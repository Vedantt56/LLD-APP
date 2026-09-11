import { describe, it, expect } from 'vitest';
import { CompositeEvaluator } from '../evaluators/composite-evaluator';
import { DeterministicEvaluator } from '../evaluators/deterministic-evaluator';
import { EvaluationStrategy, EvaluationResult } from '../domain/evaluation';
import { AttemptService } from '../services/attempt-service';
import { InMemoryRepository } from '../infrastructure/in-memory-repository';
import { Problem } from '../domain/problem';
import { Submission } from '../domain/submission';

class MockTimeoutLLMEvaluator implements EvaluationStrategy {
  async evaluate(): Promise<EvaluationResult> {
    throw new Error('Gemini API evaluation timed out after 10000ms');
  }
}

class MockCatastrophicEvaluator implements EvaluationStrategy {
  async evaluate(): Promise<EvaluationResult> {
    throw new Error('Catastrophic System Failure');
  }
}

describe('CompositeEvaluator Fallback & Attempt Lifecycle', () => {
  const problem: Problem = {
    id: 'problem-parking-lot',
    title: 'Parking Lot System',
    slug: 'parking-lot',
    description: 'Parking Lot LLD',
    requirements: [],
    sampleStarterCode: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const submission: Submission = {
    id: 'sub-1',
    attemptId: 'att-1',
    code: 'export class ParkingSlot { private id: string; constructor(id: string) { this.id = id; } }',
    language: 'typescript',
    submittedAt: new Date(),
  };

  // MANDATORY REQUIREMENT TEST: LLM Failure -> PARTIAL EvaluationResult
  it('retains deterministic result and returns status = PARTIAL when LLM times out or throws', async () => {
    const deterministicEvaluator = new DeterministicEvaluator();
    const failingLLMEvaluator = new MockTimeoutLLMEvaluator();
    const compositeEvaluator = new CompositeEvaluator(deterministicEvaluator, failingLLMEvaluator);

    const result = await compositeEvaluator.evaluate(problem, submission);

    // Behavioral contract assertions
    expect(result.status).toBe('PARTIAL');
    expect(result.feedback.deterministic.passed).toBe(true);
    expect(result.feedback.llm).toBeUndefined();
    expect(result.overallScore).toBe(result.feedback.deterministic.score);
  });

  // WORKFLOW CONTRACT TEST: AttemptService transitions to EVALUATED even on LLM fallback
  it('transitions attempt status to EVALUATED when LLM falls back to partial deterministic result', async () => {
    const repo = new InMemoryRepository();
    const compositeEvaluator = new CompositeEvaluator(new DeterministicEvaluator(), new MockTimeoutLLMEvaluator());
    const attemptService = new AttemptService(repo, compositeEvaluator);

    const attempt = await repo.createAttempt('problem-parking-lot');
    expect(attempt.status).toBe('DRAFT');

    const result = await attemptService.submitSolution(attempt.id, submission.code);

    expect(result.attempt.status).toBe('EVALUATED');
    expect(result.evaluationResult.status).toBe('PARTIAL');
  });

  // FAILURE DISAMBIGUATION TEST: Catastrophic failure transitions attempt status to FAILED
  it('transitions attempt status to FAILED on unexpected catastrophic evaluation failure', async () => {
    const repo = new InMemoryRepository();
    const attemptService = new AttemptService(repo, new MockCatastrophicEvaluator());

    const attempt = await repo.createAttempt('problem-parking-lot');
    expect(attempt.status).toBe('DRAFT');

    await expect(attemptService.submitSolution(attempt.id, submission.code)).rejects.toThrowError(
      'Catastrophic System Failure'
    );

    const failedAttempt = await repo.getAttemptById(attempt.id);
    expect(failedAttempt?.status).toBe('FAILED');
  });
});

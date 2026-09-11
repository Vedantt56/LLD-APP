import { CompositeEvaluator, COMPOSITE_WEIGHTS } from './evaluators/composite-evaluator';
import { DeterministicEvaluator } from './evaluators/deterministic-evaluator';
import { EvaluationStrategy, EvaluationResult } from './domain/evaluation';
import { AttemptService } from './services/attempt-service';
import { InMemoryRepository } from './infrastructure/in-memory-repository';
import { Problem } from './domain/problem';
import { Submission } from './domain/submission';

class MockFailingLLMEvaluator implements EvaluationStrategy {
  async evaluate(): Promise<EvaluationResult> {
    throw new Error('Simulated LLM Timeout Error');
  }
}

class MockCatastrophicEvaluator implements EvaluationStrategy {
  async evaluate(): Promise<EvaluationResult> {
    throw new Error('Catastrophic System Error');
  }
}

async function runPhase5Tests() {
  console.log('--- Running Phase 5 CompositeEvaluator & AttemptService Unit Tests ---\n');

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

  // Test Case 1: CompositeEvaluator fallback when LLM fails
  const deterministicEvaluator = new DeterministicEvaluator();
  const failingLLMEvaluator = new MockFailingLLMEvaluator();
  const compositeWithFallback = new CompositeEvaluator(deterministicEvaluator, failingLLMEvaluator);

  const fallbackResult = await compositeWithFallback.evaluate(problem, submission);
  console.log(`[PASS] Case 1 (LLM Fallback): Status = ${fallbackResult.status}, Score = ${fallbackResult.overallScore}`);
  if (fallbackResult.status !== 'PARTIAL') {
    throw new Error('Expected PARTIAL status when LLM evaluator fails');
  }

  // Test Case 2: AttemptService full lifecycle execution (DRAFT -> SUBMITTED -> EVALUATING -> EVALUATED)
  const repo = new InMemoryRepository();
  const attemptService = new AttemptService(repo, compositeWithFallback);

  const attempt = await repo.createAttempt('problem-parking-lot');
  console.log(`[PASS] Initial Attempt Created: ID = ${attempt.id}, Status = ${attempt.status}`);

  const serviceResult = await attemptService.submitSolution(attempt.id, submission.code);
  console.log(`[PASS] Case 2 (AttemptService Lifecycle): Final Status = ${serviceResult.attempt.status}, Evaluation Status = ${serviceResult.evaluationResult.status}`);
  if (serviceResult.attempt.status !== 'EVALUATED') {
    throw new Error(`Expected final attempt status EVALUATED, got ${serviceResult.attempt.status}`);
  }

  // Test Case 3: Catastrophic evaluation failure transitioning attempt to FAILED
  const repo3 = new InMemoryRepository();
  const failingAttemptService = new AttemptService(repo3, new MockCatastrophicEvaluator());
  const attempt3 = await repo3.createAttempt('problem-parking-lot');

  try {
    await failingAttemptService.submitSolution(attempt3.id, submission.code);
    throw new Error('Expected submitSolution to throw on catastrophic error');
  } catch {
    const failedAttempt = await repo3.getAttemptById(attempt3.id);
    console.log(`[PASS] Case 3 (Catastrophic Failure): Attempt Status transitioned to '${failedAttempt?.status}'`);
    if (failedAttempt?.status !== 'FAILED') {
      throw new Error(`Expected attempt status FAILED on catastrophic error, got ${failedAttempt?.status}`);
    }
  }

  console.log('\n--- ALL PHASE 5 COMPOSITE EVALUATOR & ATTEMPT SERVICE TESTS PASSED ---');
}

runPhase5Tests().catch((err) => {
  console.error('\n--- TEST FAILURE ---');
  console.error(err);
  process.exit(1);
});

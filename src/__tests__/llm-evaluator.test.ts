import { describe, it, expect } from 'vitest';
import {
  LLMEvaluator,
  LLMConfigError,
  LLMSchemaValidationError,
} from '../evaluators/llm-evaluator';
import { Problem } from '../domain/problem';
import { Submission } from '../domain/submission';

describe('LLMEvaluator (Mocked & Isolated)', () => {
  const testProblem: Problem = {
    id: 'problem-parking-lot',
    title: 'Parking Lot System',
    slug: 'parking-lot',
    description: 'Parking Lot LLD',
    requirements: [],
    sampleStarterCode: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const testSubmission: Submission = {
    id: 'sub-1',
    attemptId: 'att-1',
    code: 'export class ParkingSlot {}',
    language: 'typescript',
    submittedAt: new Date(),
  };

  it('parses valid structured JSON response into LLMEvaluationResult', () => {
    const evaluator = new LLMEvaluator({ apiKey: 'mock-key' });
    const validJsonText = JSON.stringify({
      overallScore: 90,
      rubricScores: [
        { criterion: 'SRP', score: 5, reasoning: 'Single responsibility well respected.' },
        { criterion: 'COUPLING', score: 4, reasoning: 'Low coupling.' },
        { criterion: 'EXTENSIBILITY', score: 5, reasoning: 'Highly extensible.' },
        { criterion: 'RELATIONSHIPS', score: 4, reasoning: 'Clean composition.' },
        { criterion: 'NAMING', score: 5, reasoning: 'PascalCase domain naming.' },
      ],
      strengths: ['Clean interface segregation'],
      improvements: ['Consider factory pattern'],
    });

    const parsed = evaluator.parseAndValidateResponse(validJsonText);
    expect(parsed.overallScore).toBe(90);
    expect(parsed.rubricScores.length).toBe(5);
    expect(parsed.strengths).toContain('Clean interface segregation');
  });

  it('throws LLMConfigError when API key is missing', async () => {
    const evaluator = new LLMEvaluator({ apiKey: '' });
    delete process.env.GEMINI_API_KEY;

    await expect(evaluator.evaluate(testProblem, testSubmission)).rejects.toThrowError(
      LLMConfigError
    );
  });

  it('throws LLMSchemaValidationError when response is missing required rubric criteria', () => {
    const evaluator = new LLMEvaluator({ apiKey: 'mock-key' });
    const incompleteJson = JSON.stringify({
      overallScore: 80,
      rubricScores: [
        { criterion: 'SRP', score: 4, reasoning: 'Good SRP' },
        // Missing COUPLING, EXTENSIBILITY, RELATIONSHIPS, NAMING
      ],
      strengths: [],
      improvements: [],
    });

    expect(() => evaluator.parseAndValidateResponse(incompleteJson)).toThrowError(
      LLMSchemaValidationError
    );
  });

  it('throws LLMSchemaValidationError when score is out of valid bounds (1-5 for rubric, 0-100 for overall)', () => {
    const evaluator = new LLMEvaluator({ apiKey: 'mock-key' });
    const invalidScoreJson = JSON.stringify({
      overallScore: 120, // Out of bounds 0-100
      rubricScores: [
        { criterion: 'SRP', score: 10, reasoning: 'Invalid score' },
        { criterion: 'COUPLING', score: 4, reasoning: 'Valid' },
        { criterion: 'EXTENSIBILITY', score: 5, reasoning: 'Valid' },
        { criterion: 'RELATIONSHIPS', score: 4, reasoning: 'Valid' },
        { criterion: 'NAMING', score: 4, reasoning: 'Valid' },
      ],
      strengths: [],
      improvements: [],
    });

    expect(() => evaluator.parseAndValidateResponse(invalidScoreJson)).toThrowError(
      LLMSchemaValidationError
    );
  });
});

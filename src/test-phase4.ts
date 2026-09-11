import {
  LLMEvaluator,
  LLMConfigError,
  LLMTimeoutError,
  LLMSchemaValidationError,
} from './evaluators/llm-evaluator';
import { Problem } from './domain/problem';
import { Submission } from './domain/submission';

const testProblem: Problem = {
  id: 'problem-parking-lot',
  title: 'Parking Lot System',
  slug: 'parking-lot',
  description: 'Parking Lot LLD',
  requirements: [
    {
      id: 'req-1',
      description: 'Define clean interfaces for IParkingStrategy and IBillingStrategy',
      expectedInterfaces: ['IParkingStrategy', 'IBillingStrategy'],
    },
  ],
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

async function runPhase4Tests() {
  console.log('--- Running Phase 4 LLMEvaluator Unit Tests ---\n');

  // Test Case 1: Missing API key handling
  try {
    const evaluator = new LLMEvaluator({ apiKey: '' });
    delete process.env.GEMINI_API_KEY;
    await evaluator.evaluate(testProblem, testSubmission);
    throw new Error('Expected LLMConfigError when API key is missing');
  } catch (err) {
    if (err instanceof LLMConfigError) {
      console.log(`[PASS] Case 1 (Missing API Key): Correctly threw LLMConfigError.`);
    } else {
      throw err;
    }
  }

  // Test Case 2: Schema validation on valid JSON
  const evaluator = new LLMEvaluator({ apiKey: 'dummy-test-key' });
  const validJsonText = JSON.stringify({
    overallScore: 85,
    rubricScores: [
      { criterion: 'SRP', score: 4, reasoning: 'Classes have focused single responsibilities.' },
      { criterion: 'COUPLING', score: 4, reasoning: 'Loose coupling demonstrated via interfaces.' },
      { criterion: 'EXTENSIBILITY', score: 5, reasoning: 'Strategy pattern allows easy additions.' },
      { criterion: 'RELATIONSHIPS', score: 4, reasoning: 'Composition used appropriately.' },
      { criterion: 'NAMING', score: 4, reasoning: 'Clear domain-oriented PascalCase naming.' },
    ],
    strengths: ['Interface segregation', 'Clean property encapsulation'],
    improvements: ['Add factory for slot creation'],
  });

  const parsed = evaluator.parseAndValidateResponse(validJsonText);
  console.log(`[PASS] Case 2 (Schema Validation Success): Overall Score = ${parsed.overallScore}, Rubric Items = ${parsed.rubricScores.length}`);
  if (parsed.overallScore !== 85 || parsed.rubricScores.length !== 5) {
    throw new Error('Schema parsing failed on valid JSON structure');
  }

  // Test Case 3: Schema validation failure on malformed JSON
  const malformedJson = JSON.stringify({
    overallScore: 85,
    rubricScores: [
      { criterion: 'SRP', score: 4, reasoning: 'Good SRP' },
      // Missing required criteria (COUPLING, EXTENSIBILITY, RELATIONSHIPS, NAMING)
    ],
    strengths: [],
    improvements: [],
  });

  try {
    evaluator.parseAndValidateResponse(malformedJson);
    throw new Error('Expected LLMSchemaValidationError for missing criteria');
  } catch (err) {
    if (err instanceof LLMSchemaValidationError) {
      console.log(`[PASS] Case 3 (Schema Validation Failure): Correctly caught malformed JSON schema.`);
    } else {
      throw err;
    }
  }

  // Test Case 4: Schema validation failure on invalid score range
  const invalidScoreJson = JSON.stringify({
    overallScore: 150, // Out of bounds 0-100
    rubricScores: [
      { criterion: 'SRP', score: 10, reasoning: 'Invalid score 10' },
      { criterion: 'COUPLING', score: 4, reasoning: 'Valid' },
      { criterion: 'EXTENSIBILITY', score: 5, reasoning: 'Valid' },
      { criterion: 'RELATIONSHIPS', score: 4, reasoning: 'Valid' },
      { criterion: 'NAMING', score: 4, reasoning: 'Valid' },
    ],
    strengths: [],
    improvements: [],
  });

  try {
    evaluator.parseAndValidateResponse(invalidScoreJson);
    throw new Error('Expected LLMSchemaValidationError for out-of-range score');
  } catch (err) {
    if (err instanceof LLMSchemaValidationError) {
      console.log(`[PASS] Case 4 (Out-of-Range Score Rejection): Correctly rejected invalid overallScore/rubricScore.`);
    } else {
      throw err;
    }
  }

  console.log('\n--- ALL PHASE 4 LLM EVALUATOR TESTS PASSED ---');
}

runPhase4Tests().catch((err) => {
  console.error('\n--- TEST FAILURE ---');
  console.error(err);
  process.exit(1);
});

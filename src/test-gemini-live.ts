import fs from 'fs';
import path from 'path';
import { LLMEvaluator } from './evaluators/llm-evaluator';
import { Problem } from './domain/problem';
import { Submission } from './domain/submission';

// Load .env.local manually for standalone node script
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
}

async function testLiveGeminiKey() {
  console.log('--- Testing Live Gemini API Key from .env.local ---');
  const apiKey = process.env.GEMINI_API_KEY;
  console.log(`Detected GEMINI_API_KEY: ${apiKey ? apiKey.substring(0, 8) + '...' : 'NOT FOUND'}`);

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error('[FAIL] GEMINI_API_KEY in .env.local is still placeholder or empty!');
    process.exit(1);
  }

  const evaluator = new LLMEvaluator({ apiKey, timeoutMs: 15000 });
  const problem: Problem = {
    id: 'problem-parking-lot',
    title: 'Parking Lot System',
    slug: 'parking-lot',
    description: 'Design a parking lot with vehicle slots and billing strategies.',
    requirements: [
      { id: 'r1', description: 'Define clean interfaces for IParkingStrategy', expectedInterfaces: ['IParkingStrategy'] }
    ],
    sampleStarterCode: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const submission: Submission = {
    id: 'sub-live',
    attemptId: 'att-live',
    code: `
      export interface IParkingStrategy { findSlot(): void; }
      export class NearestSlotStrategy implements IParkingStrategy { findSlot(): void {} }
      export class ParkingSlot { private id: string; constructor(id: string) { this.id = id; } }
    `,
    language: 'typescript',
    submittedAt: new Date(),
  };

  try {
    console.log('Sending request to Google Gemini API...');
    const result = await evaluator.evaluate(problem, submission);
    console.log('\n✅ [SUCCESS] Gemini API responded with valid structured JSON feedback!');
    console.log(`- Overall Score: ${result.overallScore}/100`);
    console.log(`- Status: ${result.status}`);
    console.log('- Rubric Criteria Evaluated:', result.feedback.llm?.rubricScores.map(r => `${r.criterion}: ${r.score}/5`).join(', '));
    console.log('- Key Strengths:', result.feedback.llm?.strengths);
    console.log('- Key Improvements:', result.feedback.llm?.improvements);
  } catch (err) {
    console.error('\n❌ [ERROR] Gemini API call failed:');
    console.error((err as Error).message);
    process.exit(1);
  }
}

testLiveGeminiKey();

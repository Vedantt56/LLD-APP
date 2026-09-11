import { GoogleGenAI, Type, Schema } from '@google/genai';
import { Problem } from '../domain/problem';
import { Submission } from '../domain/submission';
import {
  EvaluationStrategy,
  EvaluationResult,
  LLMEvaluationResult,
  LLMRubricCriterionScore,
} from '../domain/evaluation';

export class LLMConfigError extends Error {
  constructor(message: string = 'GEMINI_API_KEY environment variable is not configured') {
    super(message);
    this.name = 'LLMConfigError';
  }
}

export class LLMTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Gemini API evaluation timed out after ${timeoutMs}ms`);
    this.name = 'LLMTimeoutError';
  }
}

export class LLMSchemaValidationError extends Error {
  constructor(message: string, public rawResponse?: string) {
    super(`LLM Schema Validation Error: ${message}`);
    this.name = 'LLMSchemaValidationError';
  }
}

export class LLMApiError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(`Gemini API Error: ${message}`);
    this.name = 'LLMApiError';
  }
}

export interface LLMEvaluatorOptions {
  apiKey?: string;
  timeoutMs?: number;
  modelName?: string;
}

const REQUIRED_CRITERIA: Array<LLMRubricCriterionScore['criterion']> = [
  'SRP',
  'COUPLING',
  'EXTENSIBILITY',
  'RELATIONSHIPS',
  'NAMING',
];

const GEMINI_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    overallScore: {
      type: Type.INTEGER,
      description: 'Overall Low Level Design score from 0 to 100.',
    },
    rubricScores: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          criterion: {
            type: Type.STRING,
            enum: ['SRP', 'COUPLING', 'EXTENSIBILITY', 'RELATIONSHIPS', 'NAMING'],
            description: 'The Low Level Design rubric criterion evaluated.',
          },
          score: {
            type: Type.INTEGER,
            description: 'Score from 1 (poor) to 5 (excellent).',
          },
          reasoning: {
            type: Type.STRING,
            description: 'Concise 1-2 sentence concrete explanation of the score.',
          },
        },
        required: ['criterion', 'score', 'reasoning'],
      },
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Key positive Object-Oriented design patterns used.',
    },
    improvements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Actionable design improvements or refactor recommendations.',
    },
  },
  required: ['overallScore', 'rubricScores', 'strengths', 'improvements'],
};

export class LLMEvaluator implements EvaluationStrategy {
  private apiKey: string | undefined;
  private timeoutMs: number;
  private modelName: string;

  constructor(options?: LLMEvaluatorOptions) {
    this.apiKey = options?.apiKey || process.env.GEMINI_API_KEY;
    this.timeoutMs = options?.timeoutMs || 20000; // Default 20 seconds timeout
    this.modelName = options?.modelName || 'gemini-3.5-flash';
  }

  async evaluate(problem: Problem, submission: Submission): Promise<EvaluationResult> {
    if (!this.apiKey) {
      throw new LLMConfigError();
    }

    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    const prompt = this.buildPrompt(problem, submission);

    // Call Gemini API wrapped with timeout race
    const rawText = await this.callGeminiWithTimeout(ai, prompt);

    // Parse and validate JSON schema
    const parsedLLMResult = this.parseAndValidateResponse(rawText);

    return {
      id: `eval-llm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      attemptId: submission.attemptId,
      status: 'COMPLETE',
      feedback: {
        deterministic: {
          score: 0,
          passed: true,
          ruleFeedbacks: [],
        },
        llm: parsedLLMResult,
      },
      overallScore: parsedLLMResult.overallScore,
      evaluatedAt: new Date(),
    };
  }

  private buildPrompt(problem: Problem, submission: Submission): string {
    return `You are an expert Object-Oriented Low-Level Design (LLD) interviewer and code evaluator.

Evaluate the following TypeScript solution for the problem "${problem.title}".

PROBLEM DESCRIPTION:
${problem.description}

REQUIREMENTS:
${problem.requirements.map((r) => `- ${r.description}`).join('\n')}

SUBMITTED CODE:
\`\`\`typescript
${submission.code}
\`\`\`

INSTRUCTIONS:
Evaluate the Object-Oriented Design strictly against these 5 rubric criteria:
1. SRP: Single Responsibility Principle adherence.
2. COUPLING: Low coupling and appropriate dependency injection.
3. EXTENSIBILITY: Ease of extending behavior using interfaces/polymorphism without modifying existing code (OCP).
4. RELATIONSHIPS: Correctness of class relationships (composition vs aggregation vs inheritance).
5. NAMING: Clarity, expressiveness, and domain accuracy of class and method names.

Return your evaluation as a valid JSON object matching the requested schema. Do NOT include markdown code blocks or prose outside JSON.`;
  }

  private async callGeminiWithTimeout(ai: GoogleGenAI, prompt: string): Promise<string> {
    let timerId: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(() => {
        reject(new LLMTimeoutError(this.timeoutMs));
      }, this.timeoutMs);
    });

    const candidateModels = Array.from(
      new Set([
        this.modelName,
        'gemini-3.5-flash',
        'gemini-3.6-flash',
        'gemini-flash-latest',
        'gemini-2.5-pro',
      ])
    );

    const apiPromise = (async () => {
      let lastError: unknown;

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: GEMINI_RESPONSE_SCHEMA,
              temperature: 0.2,
            },
          });

          const text = response.text;
          if (text) {
            return text;
          }
        } catch (err) {
          lastError = err;
          const msg = (err as Error).message || '';
          console.warn(`[LLMEvaluator] Model '${model}' failed (${msg}). Trying next candidate model if available...`);
          // Try next candidate model on any API/capacity/404/503 error
          continue;
        }
      }

      throw new LLMApiError(
        (lastError as Error)?.message || 'All Gemini model candidates failed',
        lastError
      );
    })();

    try {
      return await Promise.race([apiPromise, timeoutPromise]);
    } finally {
      if (timerId) clearTimeout(timerId);
    }
  }

  public parseAndValidateResponse(rawText: string): LLMEvaluationResult {
    let json: unknown;
    try {
      // Strip potential markdown wrapping if present
      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      json = JSON.parse(cleanedText);
    } catch (err) {
      throw new LLMSchemaValidationError(`Failed to parse JSON response: ${(err as Error).message}`, rawText);
    }

    if (!json || typeof json !== 'object') {
      throw new LLMSchemaValidationError('JSON output must be an object', rawText);
    }

    const obj = json as Record<string, unknown>;

    // 1. Validate overallScore
    if (typeof obj.overallScore !== 'number' || obj.overallScore < 0 || obj.overallScore > 100) {
      throw new LLMSchemaValidationError('Field "overallScore" must be a number between 0 and 100', rawText);
    }

    // 2. Validate rubricScores
    if (!Array.isArray(obj.rubricScores)) {
      throw new LLMSchemaValidationError('Field "rubricScores" must be an array', rawText);
    }

    const rubricScores: LLMRubricCriterionScore[] = [];
    const foundCriteria = new Set<string>();

    for (const item of obj.rubricScores) {
      if (!item || typeof item !== 'object') {
        throw new LLMSchemaValidationError('Each rubricScore item must be an object', rawText);
      }
      const r = item as Record<string, unknown>;

      if (!REQUIRED_CRITERIA.includes(r.criterion as LLMRubricCriterionScore['criterion'])) {
        throw new LLMSchemaValidationError(`Invalid criterion: ${String(r.criterion)}`, rawText);
      }

      if (typeof r.score !== 'number' || r.score < 1 || r.score > 5) {
        throw new LLMSchemaValidationError(`Criterion score for ${String(r.criterion)} must be between 1 and 5`, rawText);
      }

      if (typeof r.reasoning !== 'string' || r.reasoning.trim().length === 0) {
        throw new LLMSchemaValidationError(`Criterion reasoning for ${String(r.criterion)} must be a non-empty string`, rawText);
      }

      foundCriteria.add(r.criterion as string);
      rubricScores.push({
        criterion: r.criterion as LLMRubricCriterionScore['criterion'],
        score: r.score,
        reasoning: r.reasoning,
      });
    }

    for (const reqCriterion of REQUIRED_CRITERIA) {
      if (!foundCriteria.has(reqCriterion)) {
        throw new LLMSchemaValidationError(`Missing required criterion score for "${reqCriterion}"`, rawText);
      }
    }

    // 3. Validate strengths & improvements
    if (!Array.isArray(obj.strengths) || !obj.strengths.every((s) => typeof s === 'string')) {
      throw new LLMSchemaValidationError('Field "strengths" must be an array of strings', rawText);
    }

    if (!Array.isArray(obj.improvements) || !obj.improvements.every((i) => typeof i === 'string')) {
      throw new LLMSchemaValidationError('Field "improvements" must be an array of strings', rawText);
    }

    return {
      overallScore: obj.overallScore,
      rubricScores,
      strengths: obj.strengths as string[],
      improvements: obj.improvements as string[],
    };
  }
}

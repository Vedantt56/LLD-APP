import { Problem } from '../domain/problem';
import { Submission } from '../domain/submission';
import {
  EvaluationStrategy,
  EvaluationResult,
} from '../domain/evaluation';
import { DeterministicEvaluator } from './deterministic-evaluator';
import { LLMEvaluator } from './llm-evaluator';

export const COMPOSITE_WEIGHTS = {
  DETERMINISTIC: 0.4,
  LLM: 0.6,
} as const;

export class CompositeEvaluator implements EvaluationStrategy {
  private deterministicEvaluator: EvaluationStrategy;
  private llmEvaluator: EvaluationStrategy;

  constructor(
    deterministicEvaluator?: EvaluationStrategy,
    llmEvaluator?: EvaluationStrategy
  ) {
    this.deterministicEvaluator = deterministicEvaluator || new DeterministicEvaluator();
    this.llmEvaluator = llmEvaluator || new LLMEvaluator();
  }

  async evaluate(problem: Problem, submission: Submission): Promise<EvaluationResult> {
    // 1. Run Deterministic Evaluator (must succeed)
    const deterministicEval = await this.deterministicEvaluator.evaluate(problem, submission);
    const deterministicFeedback = deterministicEval.feedback.deterministic;

    // 2. Run LLM Evaluator with graceful fallback
    try {
      const llmEval = await this.llmEvaluator.evaluate(problem, submission);
      const llmFeedback = llmEval.feedback.llm;

      if (llmFeedback) {
        const overallScore = Math.round(
          deterministicFeedback.score * COMPOSITE_WEIGHTS.DETERMINISTIC +
          llmFeedback.overallScore * COMPOSITE_WEIGHTS.LLM
        );

        return {
          id: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          attemptId: submission.attemptId,
          status: 'COMPLETE',
          feedback: {
            deterministic: deterministicFeedback,
            llm: llmFeedback,
          },
          overallScore,
          evaluatedAt: new Date(),
        };
      }
    } catch (err) {
      console.warn(`[CompositeEvaluator] LLMEvaluator failed or timed out (${(err as Error).message}). Falling back to deterministic-only evaluation.`);
    }

    // 3. Fallback path (LLM failed/timed out): Return deterministic-only results with status = 'PARTIAL'
    return {
      id: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      attemptId: submission.attemptId,
      status: 'PARTIAL',
      feedback: {
        deterministic: deterministicFeedback,
        llm: undefined,
      },
      overallScore: deterministicFeedback.score,
      evaluatedAt: new Date(),
    };
  }
}

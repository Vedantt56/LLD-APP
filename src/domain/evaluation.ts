import { Problem } from './problem';
import { Submission } from './submission';

export type EvaluationStatus = 'COMPLETE' | 'PARTIAL';

export const RULE_WEIGHTS = {
  CLASS_COUNT: 0.20,
  GOD_CLASS: 0.20,
  ENCAPSULATION: 0.20,
  INTERFACE_USAGE: 0.25,
  NAMING: 0.15,
} as const;

export interface DeterministicRuleFeedback {
  ruleId: string;
  category: 'ENCAPSULATION' | 'CLASS_COUNT' | 'INTERFACE_USAGE' | 'NAMING' | 'GOD_CLASS';
  score: number; // 0-100 continuous score computed by rule function
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface DeterministicEvaluationResult {
  score: number; // 0-100
  passed: boolean;
  ruleFeedbacks: DeterministicRuleFeedback[];
}

export interface LLMRubricCriterionScore {
  criterion: 'SRP' | 'COUPLING' | 'EXTENSIBILITY' | 'RELATIONSHIPS' | 'NAMING';
  score: number; // 1-5
  reasoning: string;
}

export interface LLMEvaluationResult {
  overallScore: number;
  rubricScores: LLMRubricCriterionScore[];
  strengths: string[];
  improvements: string[];
}

export interface Feedback {
  deterministic: DeterministicEvaluationResult;
  llm?: LLMEvaluationResult;
}

export interface EvaluationResult {
  id: string;
  attemptId: string;
  status: EvaluationStatus; // 'COMPLETE' when LLM succeeds, 'PARTIAL' on LLM fallback
  feedback: Feedback;
  overallScore: number;
  evaluatedAt: Date;
}

export interface EvaluationStrategy {
  evaluate(problem: Problem, submission: Submission): Promise<EvaluationResult>;
}

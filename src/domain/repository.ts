import { Problem } from './problem';
import { Attempt } from './attempt';
import { Submission } from './submission';
import { EvaluationResult } from './evaluation';

export interface Repository {
  // Problem Operations
  getProblemById(id: string): Promise<Problem | null>;
  getProblemBySlug(slug: string): Promise<Problem | null>;
  listProblems(): Promise<Problem[]>;

  // Attempt Operations
  createAttempt(problemId: string): Promise<Attempt>;
  getAttemptById(id: string): Promise<Attempt | null>;
  updateAttempt(attempt: Attempt): Promise<Attempt>;
  listAttemptsByProblemId(problemId: string): Promise<Attempt[]>;

  // Submission Operations
  createSubmission(attemptId: string, code: string): Promise<Submission>;
  getSubmissionById(id: string): Promise<Submission | null>;
  getSubmissionByAttemptId(attemptId: string): Promise<Submission | null>;

  // Evaluation Operations
  saveEvaluationResult(result: Omit<EvaluationResult, 'id'>): Promise<EvaluationResult>;
  getEvaluationResultById(id: string): Promise<EvaluationResult | null>;
  getEvaluationResultByAttemptId(attemptId: string): Promise<EvaluationResult | null>;
}

import { Repository } from '../domain/repository';
import { Problem } from '../domain/problem';
import { Attempt } from '../domain/attempt';
import { Submission } from '../domain/submission';
import { EvaluationResult } from '../domain/evaluation';
import { SEED_PROBLEMS } from './seed-data';

export class InMemoryRepository implements Repository {
  private problems: Map<string, Problem> = new Map();
  private attempts: Map<string, Attempt> = new Map();
  private submissions: Map<string, Submission> = new Map();
  private evaluationResults: Map<string, EvaluationResult> = new Map();

  constructor() {
    // Seed initial problems
    SEED_PROBLEMS.forEach((problem) => {
      this.problems.set(problem.id, problem);
    });
  }

  // Problem Operations
  async getProblemById(id: string): Promise<Problem | null> {
    return this.problems.get(id) ?? null;
  }

  async getProblemBySlug(slug: string): Promise<Problem | null> {
    for (const problem of this.problems.values()) {
      if (problem.slug === slug) {
        return problem;
      }
    }
    return null;
  }

  async listProblems(): Promise<Problem[]> {
    return Array.from(this.problems.values());
  }

  // Attempt Operations
  async createAttempt(problemId: string): Promise<Attempt> {
    const problem = await this.getProblemById(problemId);
    if (!problem) {
      throw new Error(`Problem not found with id: ${problemId}`);
    }

    const id = `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const attempt: Attempt = {
      id,
      problemId,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.attempts.set(id, attempt);
    return attempt;
  }

  async getAttemptById(id: string): Promise<Attempt | null> {
    return this.attempts.get(id) ?? null;
  }

  async updateAttempt(attempt: Attempt): Promise<Attempt> {
    if (!this.attempts.has(attempt.id)) {
      throw new Error(`Attempt not found with id: ${attempt.id}`);
    }
    const updatedAttempt = {
      ...attempt,
      updatedAt: new Date(),
    };
    this.attempts.set(attempt.id, updatedAttempt);
    return updatedAttempt;
  }

  async listAttemptsByProblemId(problemId: string): Promise<Attempt[]> {
    return Array.from(this.attempts.values())
      .filter((attempt) => attempt.problemId === problemId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Submission Operations
  async createSubmission(attemptId: string, code: string): Promise<Submission> {
    const attempt = await this.getAttemptById(attemptId);
    if (!attempt) {
      throw new Error(`Attempt not found with id: ${attemptId}`);
    }

    const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const submission: Submission = {
      id,
      attemptId,
      code,
      language: 'typescript',
      submittedAt: new Date(),
    };

    this.submissions.set(id, submission);
    return submission;
  }

  async getSubmissionById(id: string): Promise<Submission | null> {
    return this.submissions.get(id) ?? null;
  }

  async getSubmissionByAttemptId(attemptId: string): Promise<Submission | null> {
    for (const submission of this.submissions.values()) {
      if (submission.attemptId === attemptId) {
        return submission;
      }
    }
    return null;
  }

  // Evaluation Operations
  async saveEvaluationResult(result: Omit<EvaluationResult, 'id'>): Promise<EvaluationResult> {
    const id = `eval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const evaluationResult: EvaluationResult = {
      ...result,
      id,
    };
    this.evaluationResults.set(id, evaluationResult);
    return evaluationResult;
  }

  async getEvaluationResultById(id: string): Promise<EvaluationResult | null> {
    return this.evaluationResults.get(id) ?? null;
  }

  async getEvaluationResultByAttemptId(attemptId: string): Promise<EvaluationResult | null> {
    for (const evalResult of this.evaluationResults.values()) {
      if (evalResult.attemptId === attemptId) {
        return evalResult;
      }
    }
    return null;
  }
}

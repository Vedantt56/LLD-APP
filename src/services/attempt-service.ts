import { Repository } from '../domain/repository';
import { Attempt, transitionAttempt } from '../domain/attempt';
import { Submission } from '../domain/submission';
import { EvaluationResult, EvaluationStrategy } from '../domain/evaluation';
import { CompositeEvaluator } from '../evaluators/composite-evaluator';
import { getRepository } from '../lib/repository-factory';
import { validateTypeScriptSubmission } from '../validators/typescript-validator';

export class AttemptService {
  private repo: Repository;
  private evaluator: EvaluationStrategy;

  constructor(repo?: Repository, evaluator?: EvaluationStrategy) {
    this.repo = repo || getRepository();
    this.evaluator = evaluator || new CompositeEvaluator();
  }

  async submitSolution(
    attemptId: string,
    code: string
  ): Promise<{ submission: Submission; attempt: Attempt; evaluationResult: EvaluationResult }> {
    // 0. Validate code BEFORE creating submission or transitioning state
    validateTypeScriptSubmission(code);

    // 1. Load Attempt
    const attempt = await this.repo.getAttemptById(attemptId);
    if (!attempt) {
      throw new Error(`Attempt not found with id: ${attemptId}`);
    }

    // 2. Load Problem
    const problem = await this.repo.getProblemById(attempt.problemId);
    if (!problem) {
      throw new Error(`Problem not found with id: ${attempt.problemId}`);
    }

    // 3. Create Submission
    const submission = await this.repo.createSubmission(attemptId, code);

    // 4. State transition: DRAFT -> SUBMITTED
    let currentAttempt = transitionAttempt(attempt, 'SUBMITTED', {
      submissionId: submission.id,
    });
    await this.repo.updateAttempt(currentAttempt);

    // 5. State transition: SUBMITTED -> EVALUATING
    currentAttempt = transitionAttempt(currentAttempt, 'EVALUATING');
    await this.repo.updateAttempt(currentAttempt);

    // 6. Execute Evaluation (CompositeEvaluator handles LLM fallback internally)
    try {
      const evalResult = await this.evaluator.evaluate(problem, submission);
      
      // Save evaluation result
      const savedEvalResult = await this.repo.saveEvaluationResult(evalResult);

      // State transition: EVALUATING -> EVALUATED
      currentAttempt = transitionAttempt(currentAttempt, 'EVALUATED', {
        evaluationResultId: savedEvalResult.id,
      });
      await this.repo.updateAttempt(currentAttempt);

      return {
        submission,
        attempt: currentAttempt,
        evaluationResult: savedEvalResult,
      };
    } catch (catastrophicError) {
      // System/Deterministic failure: EVALUATING -> FAILED
      currentAttempt = transitionAttempt(currentAttempt, 'FAILED');
      await this.repo.updateAttempt(currentAttempt);
      throw catastrophicError;
    }
  }
}

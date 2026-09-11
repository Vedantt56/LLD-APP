export type AttemptStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'EVALUATING'
  | 'EVALUATED'
  | 'FAILED';

export interface Attempt {
  id: string;
  problemId: string;
  status: AttemptStatus;
  submissionId?: string;
  evaluationResultId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ALLOWED_TRANSITIONS: Record<AttemptStatus, AttemptStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['EVALUATING'],
  EVALUATING: ['EVALUATED', 'FAILED'],
  EVALUATED: [],
  FAILED: [],
};

export class InvalidStateTransitionError extends Error {
  constructor(public currentStatus: AttemptStatus, public targetStatus: AttemptStatus) {
    super(`Invalid state transition from '${currentStatus}' to '${targetStatus}'`);
    this.name = 'InvalidStateTransitionError';
  }
}

export function isValidTransition(currentStatus: AttemptStatus, targetStatus: AttemptStatus): boolean {
  return ALLOWED_TRANSITIONS[currentStatus]?.includes(targetStatus) ?? false;
}

export function transitionAttempt(
  attempt: Attempt,
  newStatus: AttemptStatus,
  updates?: { submissionId?: string; evaluationResultId?: string }
): Attempt {
  if (!isValidTransition(attempt.status, newStatus)) {
    throw new InvalidStateTransitionError(attempt.status, newStatus);
  }

  return {
    ...attempt,
    status: newStatus,
    submissionId: updates?.submissionId ?? attempt.submissionId,
    evaluationResultId: updates?.evaluationResultId ?? attempt.evaluationResultId,
    updatedAt: new Date(),
  };
}

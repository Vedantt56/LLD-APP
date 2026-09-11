import { describe, it, expect } from 'vitest';
import {
  Attempt,
  transitionAttempt,
  isValidTransition,
  InvalidStateTransitionError,
} from '../domain/attempt';

describe('Attempt State Machine Transitions', () => {
  const initialAttempt: Attempt = {
    id: 'att-test-1',
    problemId: 'parking-lot',
    status: 'DRAFT',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('allows valid DRAFT -> SUBMITTED transition', () => {
    expect(isValidTransition('DRAFT', 'SUBMITTED')).toBe(true);
    const updated = transitionAttempt(initialAttempt, 'SUBMITTED', { submissionId: 'sub-1' });
    expect(updated.status).toBe('SUBMITTED');
    expect(updated.submissionId).toBe('sub-1');
  });

  it('allows valid SUBMITTED -> EVALUATING transition', () => {
    const submittedAttempt: Attempt = { ...initialAttempt, status: 'SUBMITTED', submissionId: 'sub-1' };
    expect(isValidTransition('SUBMITTED', 'EVALUATING')).toBe(true);
    const evaluating = transitionAttempt(submittedAttempt, 'EVALUATING');
    expect(evaluating.status).toBe('EVALUATING');
  });

  it('allows valid EVALUATING -> EVALUATED transition', () => {
    const evaluatingAttempt: Attempt = { ...initialAttempt, status: 'EVALUATING' };
    expect(isValidTransition('EVALUATING', 'EVALUATED')).toBe(true);
    const evaluated = transitionAttempt(evaluatingAttempt, 'EVALUATED', { evaluationResultId: 'eval-1' });
    expect(evaluated.status).toBe('EVALUATED');
    expect(evaluated.evaluationResultId).toBe('eval-1');
  });

  it('allows valid EVALUATING -> FAILED transition', () => {
    const evaluatingAttempt: Attempt = { ...initialAttempt, status: 'EVALUATING' };
    expect(isValidTransition('EVALUATING', 'FAILED')).toBe(true);
    const failed = transitionAttempt(evaluatingAttempt, 'FAILED');
    expect(failed.status).toBe('FAILED');
  });

  it('strictly rejects illegal direct transition DRAFT -> EVALUATED', () => {
    expect(isValidTransition('DRAFT', 'EVALUATED')).toBe(false);
    expect(() => transitionAttempt(initialAttempt, 'EVALUATED')).toThrowError(
      InvalidStateTransitionError
    );
  });

  it('strictly rejects illegal transition EVALUATED -> SUBMITTED', () => {
    const evaluatedAttempt: Attempt = { ...initialAttempt, status: 'EVALUATED' };
    expect(isValidTransition('EVALUATED', 'SUBMITTED')).toBe(false);
    expect(() => transitionAttempt(evaluatedAttempt, 'SUBMITTED')).toThrowError(
      InvalidStateTransitionError
    );
  });
});

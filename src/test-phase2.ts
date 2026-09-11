import { getRepository, resolveProblem } from './lib/repository-factory';
import { transitionAttempt, InvalidStateTransitionError } from './domain/attempt';

async function runPhase2Tests() {
  console.log('--- Running Phase 2 Verification Tests ---\n');
  const repo = getRepository();

  // 1. List Problems
  const problems = await repo.listProblems();
  console.log(`[PASS] Seeded problems count: ${problems.length}`);
  if (problems.length !== 2) {
    throw new Error(`Expected 2 seeded problems, got ${problems.length}`);
  }

  // 2. Test Unified ID vs Slug Resolution
  const byId = await resolveProblem('problem-parking-lot');
  const bySlug = await resolveProblem('parking-lot');
  if (!byId || !bySlug || byId.id !== bySlug.id) {
    throw new Error('Problem resolution by ID and slug failed or mismatched');
  }
  console.log(`[PASS] Resolved problem by ID ('${byId.id}') and slug ('${bySlug.slug}') successfully.`);

  // 3. Create Attempt
  const attempt = await repo.createAttempt(byId.id);
  console.log(`[PASS] Created attempt in status '${attempt.status}' with ID: ${attempt.id}`);
  if (attempt.status !== 'DRAFT') {
    throw new Error(`Expected initial attempt status DRAFT, got ${attempt.status}`);
  }

  // 4. Test Valid State Transition (DRAFT -> SUBMITTED)
  const submission = await repo.createSubmission(attempt.id, 'class ParkingLot {}');
  const submittedAttempt = transitionAttempt(attempt, 'SUBMITTED', { submissionId: submission.id });
  await repo.updateAttempt(submittedAttempt);
  console.log(`[PASS] Valid transition DRAFT -> SUBMITTED succeeded.`);

  // 5. Test Invalid State Transition (SUBMITTED -> EVALUATED directly without EVALUATING)
  try {
    transitionAttempt(submittedAttempt, 'EVALUATED');
    throw new Error('Invalid state transition failed to throw error!');
  } catch (err) {
    if (err instanceof InvalidStateTransitionError) {
      console.log(`[PASS] Invalid state transition correctly rejected: ${err.message}`);
    } else {
      throw err;
    }
  }

  // 6. Test Valid Transition Chain (SUBMITTED -> EVALUATING -> EVALUATED)
  const evaluatingAttempt = transitionAttempt(submittedAttempt, 'EVALUATING');
  await repo.updateAttempt(evaluatingAttempt);
  const evaluatedAttempt = transitionAttempt(evaluatingAttempt, 'EVALUATED');
  await repo.updateAttempt(evaluatedAttempt);
  console.log(`[PASS] Transition chain SUBMITTED -> EVALUATING -> EVALUATED completed successfully.`);

  // 7. Verify Attempt History
  const history = await repo.listAttemptsByProblemId(byId.id);
  if (history.length !== 1) {
    throw new Error(`Expected 1 history item, got ${history.length}`);
  }
  console.log(`[PASS] Attempt history returned ${history.length} item(s).`);

  console.log('\n--- ALL PHASE 2 VERIFICATION TESTS PASSED ---');
}

runPhase2Tests().catch((err) => {
  console.error('\n--- TEST FAILURE ---');
  console.error(err);
  process.exit(1);
});

import { getRepository, resolveProblem } from './lib/repository-factory';
import { AttemptService } from './services/attempt-service';

async function runPhase6E2ETests() {
  console.log('--- Running Phase 6 Dual-Problem & History E2E Tests ---\n');
  const repo = getRepository();
  const attemptService = new AttemptService(repo);

  // 1. Resolve problems
  const parkingLot = await resolveProblem('parking-lot');
  const elevator = await resolveProblem('elevator-system');

  if (!parkingLot || !elevator) {
    throw new Error('Failed to resolve seeded problems (Parking Lot & Elevator System)');
  }
  console.log(`[PASS] Successfully resolved both problems: '${parkingLot.title}' & '${elevator.title}'`);

  // --- PARKING LOT TEST 1 ---
  console.log('\n--- 1. Testing Parking Lot (Submission 1) ---');
  const attPL1 = await repo.createAttempt(parkingLot.id);
  const resPL1 = await attemptService.submitSolution(attPL1.id, parkingLot.sampleStarterCode);
  console.log(`[PASS] Parking Lot Attempt 1: Status = ${resPL1.attempt.status}, Overall Score = ${resPL1.evaluationResult.overallScore}`);

  // --- PARKING LOT TEST 2 (History Accumulation) ---
  console.log('\n--- 2. Testing Parking Lot (Submission 2 - History Accumulation) ---');
  const attPL2 = await repo.createAttempt(parkingLot.id);
  const resPL2 = await attemptService.submitSolution(
    attPL2.id,
    `export class ExtraParkingSlot { private id: string; constructor(id: string) { this.id = id; } }`
  );
  console.log(`[PASS] Parking Lot Attempt 2: Status = ${resPL2.attempt.status}, Overall Score = ${resPL2.evaluationResult.overallScore}`);

  const plHistory = await repo.listAttemptsByProblemId(parkingLot.id);
  console.log(`[PASS] Parking Lot Attempt History Count: ${plHistory.length}`);
  if (plHistory.length !== 2) {
    throw new Error(`Expected 2 attempt history records for Parking Lot, got ${plHistory.length}`);
  }

  // --- ELEVATOR SYSTEM TEST ---
  console.log('\n--- 3. Testing Elevator System (Submission 1) ---');
  const attEl1 = await repo.createAttempt(elevator.id);
  const resEl1 = await attemptService.submitSolution(attEl1.id, elevator.sampleStarterCode);
  console.log(`[PASS] Elevator System Attempt 1: Status = ${resEl1.attempt.status}, Overall Score = ${resEl1.evaluationResult.overallScore}`);

  const elHistory = await repo.listAttemptsByProblemId(elevator.id);
  console.log(`[PASS] Elevator System Attempt History Count: ${elHistory.length}`);
  if (elHistory.length !== 1) {
    throw new Error(`Expected 1 attempt history record for Elevator System, got ${elHistory.length}`);
  }

  console.log('\n--- ALL PHASE 6 DUAL-PROBLEM & HISTORY E2E TESTS PASSED ---');
}

runPhase6E2ETests().catch((err) => {
  console.error('\n--- TEST FAILURE ---');
  console.error(err);
  process.exit(1);
});

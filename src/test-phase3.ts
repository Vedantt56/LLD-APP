import { DeterministicEvaluator, RULE_WEIGHTS } from './evaluators/deterministic-evaluator';
import { Problem } from './domain/problem';
import { Submission } from './domain/submission';

const testProblem: Problem = {
  id: 'problem-parking-lot',
  title: 'Parking Lot System',
  slug: 'parking-lot',
  description: 'Parking Lot LLD',
  requirements: [
    {
      id: 'req-1',
      description: 'Define clean interfaces for IParkingStrategy and IBillingStrategy',
      expectedInterfaces: ['IParkingStrategy', 'IBillingStrategy'],
    },
  ],
  sampleStarterCode: '',
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function runPhase3Tests() {
  console.log('--- Running Phase 3 DeterministicEvaluator Unit Tests ---\n');
  const evaluator = new DeterministicEvaluator();

  // Test Case 1: Excellent submission (Full score expected)
  const perfectCode = `
    export interface IParkingStrategy {
      findSlot(): void;
    }
    export interface IBillingStrategy {
      calculateFee(): number;
    }
    export class NearestSlotStrategy implements IParkingStrategy {
      public findSlot(): void {}
    }
    export class HourlyBillingStrategy implements IBillingStrategy {
      public calculateFee(): number { return 10; }
    }
    export class ParkingSlot {
      private id: string;
      private isOccupied: boolean = false;
      constructor(id: string) { this.id = id; }
      public getId(): string { return this.id; }
    }
  `;

  const sub1: Submission = {
    id: 'sub-1',
    attemptId: 'att-1',
    code: perfectCode,
    language: 'typescript',
    submittedAt: new Date(),
  };

  const res1 = await evaluator.evaluate(testProblem, sub1);
  console.log(`[PASS] Case 1 (Perfect Submission): Score = ${res1.overallScore}/100, Passed = ${res1.feedback.deterministic.passed}`);
  if (res1.overallScore < 95) {
    throw new Error(`Expected score >= 95 for perfect submission, got ${res1.overallScore}`);
  }

  // Test Case 2: Encapsulation violation (Public fields)
  const unencapsulatedCode = `
    export interface IParkingStrategy { findSlot(): void; }
    export interface IBillingStrategy { calculateFee(): number; }
    export class NearestSlotStrategy implements IParkingStrategy { findSlot(): void {} }
    export class HourlyBillingStrategy implements IBillingStrategy { calculateFee(): number { return 10; } }
    export class ParkingSlot {
      public id: string;
      public isOccupied: boolean;
    }
  `;

  const sub2: Submission = {
    id: 'sub-2',
    attemptId: 'att-2',
    code: unencapsulatedCode,
    language: 'typescript',
    submittedAt: new Date(),
  };

  const res2 = await evaluator.evaluate(testProblem, sub2);
  const encFeedback = res2.feedback.deterministic.ruleFeedbacks.find((f) => f.ruleId === 'ENCAPSULATION');
  console.log(`[PASS] Case 2 (Public Fields Warning): Encapsulation Rule Passed = ${encFeedback?.passed}, Score = ${res2.overallScore}`);
  if (encFeedback?.passed !== false) {
    throw new Error('Expected ENCAPSULATION check to fail on un-encapsulated public fields');
  }

  // Test Case 3: God-class violation
  const godClassCode = `
    export interface IParkingStrategy { findSlot(): void; }
    export interface IBillingStrategy { calculateFee(): number; }
    export class NearestSlotStrategy implements IParkingStrategy { findSlot(): void {} }
    export class HourlyBillingStrategy implements IBillingStrategy { calculateFee(): number { return 10; } }
    export class MegaManager {
      m1() {} m2() {} m3() {} m4() {} m5() {}
      m6() {} m7() {} m8() {} m9() {} m10() {}
      m11() {} m12() {} m13() {} m14() {} m15() {}
    }
  `;

  const sub3: Submission = {
    id: 'sub-3',
    attemptId: 'att-3',
    code: godClassCode,
    language: 'typescript',
    submittedAt: new Date(),
  };

  const res3 = await evaluator.evaluate(testProblem, sub3);
  const godFeedback = res3.feedback.deterministic.ruleFeedbacks.find((f) => f.ruleId === 'GOD_CLASS');
  console.log(`[PASS] Case 3 (God Class Warning): God Class Rule Passed = ${godFeedback?.passed}, Message = "${godFeedback?.message}"`);
  if (godFeedback?.passed !== false) {
    throw new Error('Expected GOD_CLASS check to fail for class with >12 methods');
  }

  // Test Case 4: Syntax error handling
  const brokenCode = `
    class BrokenClass {
      private x = ;
  `;

  const sub4: Submission = {
    id: 'sub-4',
    attemptId: 'att-4',
    code: brokenCode,
    language: 'typescript',
    submittedAt: new Date(),
  };

  const res4 = await evaluator.evaluate(testProblem, sub4);
  console.log(`[PASS] Case 4 (Syntax Error Handling): Score = ${res4.overallScore}, Status = ${res4.status}`);
  if (res4.overallScore !== 0 || res4.feedback.deterministic.passed !== false) {
    throw new Error('Expected 0 score for syntax error code');
  }

  console.log('\n--- ALL PHASE 3 DETERMINISTIC EVALUATOR TESTS PASSED ---');
}

runPhase3Tests().catch((err) => {
  console.error('\n--- TEST FAILURE ---');
  console.error(err);
  process.exit(1);
});

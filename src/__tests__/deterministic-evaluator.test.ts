import { describe, it, expect } from 'vitest';
import { DeterministicEvaluator } from '../evaluators/deterministic-evaluator';
import { Problem } from '../domain/problem';
import { Submission } from '../domain/submission';

describe('DeterministicEvaluator (AST Analysis)', () => {
  const evaluator = new DeterministicEvaluator();

  const testProblem: Problem = {
    id: 'problem-parking-lot',
    title: 'Parking Lot System',
    slug: 'parking-lot',
    description: 'Parking Lot LLD',
    requirements: [
      {
        id: 'req-1',
        description: 'Define clean interface IParkingStrategy',
        expectedInterfaces: ['IParkingStrategy'],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('evaluates a clean, well-encapsulated submission with 100 overall score', async () => {
    const code = `
      export interface IParkingStrategy {
        findSlot(): void;
      }
      export class NearestStrategy implements IParkingStrategy {
        public findSlot(): void {}
      }
      export class ParkingSlot {
        private id: string;
        constructor(id: string) { this.id = id; }
        public getId(): string { return this.id; }
      }
    `;

    const sub: Submission = { id: 'sub-1', attemptId: 'att-1', code, language: 'typescript', submittedAt: new Date() };
    const res = await evaluator.evaluate(testProblem, sub);

    expect(res.status).toBe('COMPLETE');
    expect(res.overallScore).toBe(100);
    expect(res.feedback.deterministic.passed).toBe(true);
  });

  it('asserts partial rule score (e.g. 1 class yields 60 score on CLASS_COUNT) matches returned rule.score and earned points', async () => {
    const code = `
      export class SingleClass {
        private name: string;
        constructor(name: string) { this.name = name; }
      }
    `;

    const sub: Submission = { id: 'sub-partial', attemptId: 'att-partial', code, language: 'typescript', submittedAt: new Date() };
    const res = await evaluator.evaluate(testProblem, sub);

    const classCountFb = res.feedback.deterministic.ruleFeedbacks.find((f) => f.ruleId === 'CLASS_COUNT');
    expect(classCountFb?.score).toBe(60);
    expect(classCountFb?.passed).toBe(true);

    const earnedPoints = Math.round((classCountFb!.score * 20) / 100);
    expect(earnedPoints).toBe(12); // 60% of 20 = 12 points
  });

  it('detects un-encapsulated public fields and lowers encapsulation score', async () => {
    const code = `
      export interface IParkingStrategy { findSlot(): void; }
      export class NearestStrategy implements IParkingStrategy { findSlot(): void {} }
      export class ParkingSlot {
        public id: string = '';
        public isOccupied: boolean = false;
      }
    `;

    const sub: Submission = { id: 'sub-2', attemptId: 'att-2', code, language: 'typescript', submittedAt: new Date() };
    const res = await evaluator.evaluate(testProblem, sub);

    const encFeedback = res.feedback.deterministic.ruleFeedbacks.find((f) => f.ruleId === 'ENCAPSULATION');
    expect(encFeedback?.passed).toBe(false);
    expect(res.overallScore).toBeLessThan(100);
  });

  it('detects God-class antipattern when a class exceeds member limit', async () => {
    const code = `
      export interface IParkingStrategy { findSlot(): void; }
      export class NearestStrategy implements IParkingStrategy { findSlot(): void {} }
      export class MegaManager {
        m1() {} m2() {} m3() {} m4() {} m5() {}
        m6() {} m7() {} m8() {} m9() {} m10() {}
        m11() {} m12() {} m13() {} m14() {} m15() {}
      }
    `;

    const sub: Submission = { id: 'sub-3', attemptId: 'att-3', code, language: 'typescript', submittedAt: new Date() };
    const res = await evaluator.evaluate(testProblem, sub);

    const godFeedback = res.feedback.deterministic.ruleFeedbacks.find((f) => f.ruleId === 'GOD_CLASS');
    expect(godFeedback?.passed).toBe(false);
  });

  // REQUIRED EDGE CASE 1: Empty Submission
  it('handles edge case: empty submission code cleanly without crashing', async () => {
    const sub: Submission = { id: 'sub-empty', attemptId: 'att-empty', code: '   ', language: 'typescript', submittedAt: new Date() };
    const res = await evaluator.evaluate(testProblem, sub);

    expect(res.status).toBe('COMPLETE');
    const classCountFb = res.feedback.deterministic.ruleFeedbacks.find((f) => f.ruleId === 'CLASS_COUNT');
    expect(classCountFb?.passed).toBe(false);
  });

  // REQUIRED EDGE CASE 2: Non-compiling / Syntax Error Code
  it('handles edge case: non-compiling TypeScript code cleanly with 0 score parse failure', async () => {
    const brokenCode = `
      export class BrokenClass {
        private val = ;
    `;

    const sub: Submission = { id: 'sub-broken', attemptId: 'att-broken', code: brokenCode, language: 'typescript', submittedAt: new Date() };
    const res = await evaluator.evaluate(testProblem, sub);

    expect(res.status).toBe('COMPLETE');
    expect(res.overallScore).toBe(0);
    expect(res.feedback.deterministic.passed).toBe(false);
    expect(res.feedback.deterministic.ruleFeedbacks[0].message).toContain('TypeScript code failed to parse');
  });

  // FIX 2 REGRESSION TEST: Semantically / Type-Invalid TypeScript
  it('detects semantically invalid TypeScript (type errors) and fails evaluation cleanly with 0 score', async () => {
    const invalidCode = `
      class Test {
        private value: number = "not a number";
      }
    `;

    const sub: Submission = { id: 'sub-semantic-error', attemptId: 'att-semantic-error', code: invalidCode, language: 'typescript', submittedAt: new Date() };
    const res = await evaluator.evaluate(testProblem, sub);

    expect(res.status).toBe('COMPLETE');
    expect(res.overallScore).toBe(0);
    expect(res.feedback.deterministic.passed).toBe(false);
    expect(res.feedback.deterministic.ruleFeedbacks[0].message).toContain('TypeScript code failed to parse');
  });

  // FIX 3 TESTS: Continuous rule contribution consistency
  it('proves rule contributions are based on continuous scores and mathematically consistent with weighted overall score', async () => {
    const code = `
      export interface IParkingStrategy { findSlot(): void; }
      export class NearestStrategy implements IParkingStrategy { findSlot(): void {} }
      export class ParkingSlot {
        private id: string;
        constructor(id: string) { this.id = id; }
        public getId(): string { return this.id; }
      }
    `;

    const sub: Submission = { id: 'sub-continuous', attemptId: 'att-continuous', code, language: 'typescript', submittedAt: new Date() };
    const res = await evaluator.evaluate(testProblem, sub);

    const ruleFeedbacks = res.feedback.deterministic.ruleFeedbacks;
    const weights: Record<string, number> = {
      CLASS_COUNT: 0.20,
      GOD_CLASS: 0.20,
      ENCAPSULATION: 0.20,
      INTERFACE_USAGE: 0.25,
      NAMING: 0.15,
    };

    let continuousSum = 0;
    for (const rule of ruleFeedbacks) {
      const weight = weights[rule.category] || 0.20;
      const continuousContribution = rule.score * weight;
      continuousSum += continuousContribution;
    }

    expect(Math.round(continuousSum)).toBe(res.overallScore);
  });
});

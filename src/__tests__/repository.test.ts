import { describe, it, expect } from 'vitest';
import { InMemoryRepository } from '../infrastructure/in-memory-repository';
import { getRepository, resolveProblem } from '../lib/repository-factory';

describe('InMemoryRepository & Problem Resolution', () => {
  it('seeds exactly 2 problems (Parking Lot & Elevator System)', async () => {
    const repo = getRepository();
    const problems = await repo.listProblems();
    expect(problems.length).toBe(2);
    expect(problems.map((p) => p.slug)).toEqual(['parking-lot', 'elevator-system']);
  });

  it('resolves problems cleanly by ID and slug', async () => {
    const byId = await resolveProblem('problem-parking-lot');
    const bySlug = await resolveProblem('parking-lot');
    expect(byId).not.toBeNull();
    expect(bySlug).not.toBeNull();
    expect(byId?.id).toBe(bySlug?.id);
  });

  it('creates and tracks attempt history per problem independently', async () => {
    const repo = new InMemoryRepository();
    const attPL1 = await repo.createAttempt('problem-parking-lot');
    const attPL2 = await repo.createAttempt('problem-parking-lot');
    const attEl1 = await repo.createAttempt('problem-elevator-system');

    const plHistory = await repo.listAttemptsByProblemId('problem-parking-lot');
    const elHistory = await repo.listAttemptsByProblemId('problem-elevator-system');

    expect(plHistory.length).toBe(2);
    expect(elHistory.length).toBe(1);
    expect(plHistory.map((a) => a.id)).toContain(attPL1.id);
    expect(plHistory.map((a) => a.id)).toContain(attPL2.id);
    expect(elHistory[0].id).toBe(attEl1.id);
  });
});

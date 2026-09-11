import { Repository } from '../domain/repository';
import { InMemoryRepository } from '../infrastructure/in-memory-repository';
import { Problem } from '../domain/problem';

// Global singleton instance for in-memory persistence across Next.js API calls in dev mode
const globalForRepo = global as unknown as { repo?: Repository };

export function getRepository(): Repository {
  if (!globalForRepo.repo) {
    globalForRepo.repo = new InMemoryRepository();
  }
  return globalForRepo.repo;
}

/**
 * Domain helper to resolve a Problem by either its ID or slug without separate route logic.
 */
export async function resolveProblem(identifier: string): Promise<Problem | null> {
  const repo = getRepository();
  const byId = await repo.getProblemById(identifier);
  if (byId) return byId;
  return await repo.getProblemBySlug(identifier);
}

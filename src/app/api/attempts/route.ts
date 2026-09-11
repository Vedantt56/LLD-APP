import { NextRequest, NextResponse } from 'next/server';
import { getRepository, resolveProblem } from '@/lib/repository-factory';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const problemIdentifier = body.problemId || body.problemIdentifier || body.slug;

    if (!problemIdentifier) {
      return NextResponse.json(
        { error: 'Missing required field: problemId or slug' },
        { status: 400 }
      );
    }

    const problem = await resolveProblem(problemIdentifier);
    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    const repo = getRepository();
    const attempt = await repo.createAttempt(problem.id);

    return NextResponse.json(attempt, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create attempt', details: (error as Error).message },
      { status: 500 }
    );
  }
}

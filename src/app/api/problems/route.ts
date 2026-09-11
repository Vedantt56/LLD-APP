import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository-factory';

export async function GET() {
  try {
    const repo = getRepository();
    const problems = await repo.listProblems();
    return NextResponse.json(problems, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch problems', details: (error as Error).message },
      { status: 500 }
    );
  }
}

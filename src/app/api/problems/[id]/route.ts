import { NextRequest, NextResponse } from 'next/server';
import { resolveProblem } from '@/lib/repository-factory';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const problem = await resolveProblem(id);

    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    return NextResponse.json(problem, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch problem', details: (error as Error).message },
      { status: 500 }
    );
  }
}

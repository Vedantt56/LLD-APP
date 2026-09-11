import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository-factory';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repo = getRepository();

    // Check by evaluation ID first, fallback to attempt ID
    let evaluation = await repo.getEvaluationResultById(id);
    if (!evaluation) {
      evaluation = await repo.getEvaluationResultByAttemptId(id);
    }

    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation result not found' }, { status: 404 });
    }

    return NextResponse.json(evaluation, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch evaluation result', details: (error as Error).message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository-factory';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repo = getRepository();
    const attempt = await repo.getAttemptById(id);

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    const submission = attempt.submissionId
      ? await repo.getSubmissionById(attempt.submissionId)
      : await repo.getSubmissionByAttemptId(attempt.id);

    const evaluationResult = attempt.evaluationResultId
      ? await repo.getEvaluationResultById(attempt.evaluationResultId)
      : await repo.getEvaluationResultByAttemptId(attempt.id);

    return NextResponse.json(
      {
        attempt,
        submission: submission ?? null,
        evaluationResult: evaluationResult ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch attempt', details: (error as Error).message },
      { status: 500 }
    );
  }
}

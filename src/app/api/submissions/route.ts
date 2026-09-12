import { NextRequest, NextResponse } from 'next/server';
import { AttemptService } from '@/services/attempt-service';
import { InvalidStateTransitionError } from '@/domain/attempt';
import { InvalidTypeScriptSubmissionError, EmptySubmissionError } from '@/validators/typescript-validator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attemptId, code } = body;

    if (!attemptId || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Missing required fields: attemptId and code (string)' },
        { status: 400 }
      );
    }

    const attemptService = new AttemptService();
    const result = await attemptService.submitSolution(attemptId, code);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (
      error instanceof InvalidTypeScriptSubmissionError ||
      error instanceof EmptySubmissionError
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof InvalidStateTransitionError) {
      return NextResponse.json(
        { error: 'Invalid state transition', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit solution', details: (error as Error).message },
      { status: 500 }
    );
  }
}

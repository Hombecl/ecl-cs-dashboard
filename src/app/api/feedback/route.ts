import { NextRequest, NextResponse } from 'next/server';
import { createFeedback, getFeedback } from '@/lib/airtable';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.type || !body.title || !body.description || !body.submittedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const feedback = await createFeedback({
      type: body.type,
      title: body.title,
      description: body.description,
      relatedCaseId: body.relatedCaseId || null,
      submittedBy: body.submittedBy,
    });

    return NextResponse.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error('Failed to create feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const feedbackList = await getFeedback(status);

    return NextResponse.json({
      success: true,
      data: feedbackList,
    });
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

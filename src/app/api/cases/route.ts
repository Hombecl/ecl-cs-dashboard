import { NextRequest, NextResponse } from 'next/server';
import { getCases, createCase } from '@/lib/airtable';
import { analyzeCustomerMessage } from '@/lib/ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const cases = await getCases(status);

    return NextResponse.json({
      success: true,
      data: cases,
    });
  } catch (error) {
    console.error('Failed to fetch cases:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // If there's a message, analyze it with AI
    let analysis = null;
    if (body.originalMessage) {
      analysis = await analyzeCustomerMessage(body.originalMessage);
    }

    const caseData = {
      platformOrderNumber: body.platformOrderNumber,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      originalMessage: body.originalMessage,
      issueCategory: analysis?.issueCategory || body.issueCategory,
      sentiment: analysis?.sentiment || body.sentiment,
      urgency: analysis?.urgency || body.urgency,
      status: body.status || 'New',
      contactReason: body.contactReason,
      storeCode: body.storeCode,
    };

    const newCase = await createCase(caseData);

    return NextResponse.json({
      success: true,
      data: newCase,
    });
  } catch (error) {
    console.error('Failed to create case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create case' },
      { status: 500 }
    );
  }
}

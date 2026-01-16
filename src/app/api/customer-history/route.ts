import { NextRequest, NextResponse } from 'next/server';
import { getCasesByCustomerEmail } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const excludeCaseId = searchParams.get('excludeCaseId') || undefined;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const cases = await getCasesByCustomerEmail(email, excludeCaseId);

    return NextResponse.json({
      success: true,
      data: cases,
    });
  } catch (error) {
    console.error('Failed to fetch customer history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer history' },
      { status: 500 }
    );
  }
}

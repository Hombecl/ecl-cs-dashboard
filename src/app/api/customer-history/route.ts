import { NextRequest, NextResponse } from 'next/server';
import { getCasesByCustomerEmail } from '@/lib/airtable';
import { isValidEmail, isValidRecordId } from '@/lib/sanitize';

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

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate excludeCaseId if provided
    if (excludeCaseId && !isValidRecordId(excludeCaseId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid excludeCaseId format' },
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

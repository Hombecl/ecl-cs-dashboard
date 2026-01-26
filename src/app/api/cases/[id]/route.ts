import { NextRequest, NextResponse } from 'next/server';
import { getCaseById, updateCase, getOrderByPlatformNumber } from '@/lib/airtable';
import { isValidRecordId } from '@/lib/sanitize';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate record ID format
    if (!isValidRecordId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid case ID format' },
        { status: 400 }
      );
    }

    const caseData = await getCaseById(id);

    if (!caseData) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    // Enrich with order data
    if (caseData.platformOrderNumber) {
      const order = await getOrderByPlatformNumber(caseData.platformOrderNumber);
      caseData.order = order;
    }

    return NextResponse.json({
      success: true,
      data: caseData,
    });
  } catch (error) {
    console.error('Failed to fetch case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch case' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate record ID format
    if (!isValidRecordId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid case ID format' },
        { status: 400 }
      );
    }

    const updates = await request.json();

    const updatedCase = await updateCase(id, updates);

    // Enrich with order data
    if (updatedCase.platformOrderNumber) {
      const order = await getOrderByPlatformNumber(updatedCase.platformOrderNumber);
      updatedCase.order = order;
    }

    return NextResponse.json({
      success: true,
      data: updatedCase,
    });
  } catch (error) {
    console.error('Failed to update case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update case' },
      { status: 500 }
    );
  }
}

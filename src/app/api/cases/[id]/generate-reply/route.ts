import { NextRequest, NextResponse } from 'next/server';
import {
  getCaseById,
  getOrderByPlatformNumber,
  getStoreByCode,
  getPlaybookByCategory
} from '@/lib/airtable';
import { generateDraftReply } from '@/lib/ai';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get case data
    const caseData = await getCaseById(id);
    if (!caseData) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    // Get related data
    const order = caseData.platformOrderNumber
      ? await getOrderByPlatformNumber(caseData.platformOrderNumber)
      : null;

    const store = caseData.storeCode
      ? await getStoreByCode(caseData.storeCode)
      : null;

    const playbook = caseData.issueCategory
      ? await getPlaybookByCategory(caseData.issueCategory)
      : null;

    // Generate draft reply
    const reply = await generateDraftReply(caseData, order, store, playbook);

    return NextResponse.json({
      success: true,
      data: {
        reply,
        persona: store?.personaName || null,
        playbook: playbook?.scenarioName || null,
      },
    });
  } catch (error) {
    console.error('Failed to generate reply:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate reply' },
      { status: 500 }
    );
  }
}

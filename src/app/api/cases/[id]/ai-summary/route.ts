import { NextRequest, NextResponse } from 'next/server';
import {
  getCaseById,
  getOrderByPlatformNumber,
} from '@/lib/airtable';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

interface AISummary {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  canFulfillRequest: boolean;
  reason: string;
}

export async function GET(
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

    // Get order data if available
    const order = caseData.platformOrderNumber
      ? await getOrderByPlatformNumber(caseData.platformOrderNumber)
      : null;

    // Check if API key is configured
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({
        success: true,
        data: {
          summary: 'AI Summary not available - API key not configured',
          keyFindings: [],
          recommendations: ['Configure GOOGLE_AI_API_KEY to enable AI summaries'],
          canFulfillRequest: false,
          reason: 'AI not configured',
        },
      });
    }

    // Generate AI summary
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build order context
    let orderContext = 'No order information available.';
    if (order) {
      orderContext = `
ORDER STATUS:
- Order Date: ${order.orderDate}
- Order Status: ${order.status}
- Platform Status: ${order.platformOrderStatus || 'Unknown'}
- Supplier Order: ${order.supplierOrderNumber ? `#${order.supplierOrderNumber}` : 'Not placed'}
- Shipment Dropped: ${order.shipmentDropped ? 'Yes' : 'No'}
- Tracking Number: ${order.trackingNumber || 'None'}
- Ship Date: ${order.shipDate || 'Not shipped'}
- Delivery Status: ${order.trackingStatus || 'Unknown'}
- Actual Delivery: ${order.actualDelivery || 'Not delivered'}
- Amount: $${order.salesAmount.toFixed(2)}
`;
    }

    const prompt = `You are a customer service analyst. Analyze this case and provide a JSON response.

CUSTOMER REQUEST:
Issue Category: ${caseData.issueCategory || 'Unknown'}
Customer Message: ${caseData.originalMessage}

${orderContext}

Analyze this case and respond with a JSON object containing:
1. "summary": A brief 1-2 sentence summary of the situation
2. "keyFindings": Array of 2-4 key findings about the case (e.g., "Order has already shipped", "Customer wants cancellation")
3. "recommendations": Array of 2-3 actionable recommendations for the CS agent
4. "canFulfillRequest": Boolean - can we fulfill what the customer is asking?
5. "reason": Brief explanation of why we can or cannot fulfill the request

Be practical and direct. Focus on actionable insights.
Respond with valid JSON only, no markdown.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Clean up the response
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const aiSummary: AISummary = JSON.parse(cleanedText);

    return NextResponse.json({
      success: true,
      data: aiSummary,
      hasOrder: !!order,
    });
  } catch (error) {
    console.error('Failed to generate AI summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate AI summary' },
      { status: 500 }
    );
  }
}

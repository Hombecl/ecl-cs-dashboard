import { GoogleGenerativeAI } from '@google/generative-ai';
import { CSCase, OrderInfo, Store, Playbook } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

interface AnalysisResult {
  issueCategory: CSCase['issueCategory'];
  sentiment: CSCase['sentiment'];
  urgency: CSCase['urgency'];
  suggestedActions: string[];
}

export async function analyzeCustomerMessage(message: string): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const prompt = `Analyze this customer service message and provide a JSON response with the following fields:
- issueCategory: one of "Wrong Item", "Damaged Item", "Not Received", "Tracking Question", "Cancel Request", "Return Request", "General Question", "Complaint", "Other"
- sentiment: one of "Frustrated", "Concerned", "Neutral", "Polite"
- urgency: one of "High", "Medium", "Low"
- suggestedActions: array of suggested actions like "Send Replacement", "Issue Refund", "Provide Tracking", etc.

Customer message:
${message}

Respond with valid JSON only, no other text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Clean up the response - remove markdown code blocks if present
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      issueCategory: 'Other',
      sentiment: 'Neutral',
      urgency: 'Medium',
      suggestedActions: [],
    };
  }
}

export async function generateDraftReply(
  csCase: CSCase,
  order: OrderInfo | null,
  store: Store | null,
  playbook: Playbook | null
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  // Build persona instructions
  let personaInstructions = '';
  if (store?.personaName) {
    personaInstructions = `
You are ${store.personaName}, a ${store.personaAge || 'professional'} year old customer service representative from ${store.personaLocation || 'the company'}.

Personality: ${store.personalityTraits || 'Friendly and professional'}
Writing Style: ${store.writingStyle || 'Clear and helpful'}
Greeting: Use "${store.greetingTemplate || 'Hi [Name],'}" style
Sign-off: Use "${store.signoffTemplate || 'Best regards, ' + store.personaName}" style
${store.personaBackground ? `Background: ${store.personaBackground}` : ''}
`;
  } else {
    personaInstructions = `You are a professional customer service representative. Be friendly, helpful, and solution-focused.`;
  }

  // Build context
  let orderContext = '';
  if (order) {
    orderContext = `
ORDER DETAILS:
- Item: ${order.itemName}
- Amount: $${order.salesAmount.toFixed(2)}
- Order Date: ${order.orderDate}
- Status: ${order.status}
- Tracking: ${order.trackingNumber || 'Not yet shipped'}
- Tracking Status: ${order.trackingStatus || 'N/A'}
- Expected Delivery: ${order.expectedDelivery || 'N/A'}
`;
  }

  // Build playbook guidance
  let playbookGuidance = '';
  if (playbook) {
    playbookGuidance = `
PLAYBOOK GUIDANCE for ${playbook.scenarioName}:
${playbook.responseTemplate || ''}

Decision Points:
${playbook.decisionTree || 'Use your best judgment'}

When to Escalate:
${playbook.whenToEscalate || 'If customer remains unsatisfied after offering solution'}
`;
  }

  const prompt = `${personaInstructions}

Generate a customer service reply for the following case:

CUSTOMER MESSAGE:
${csCase.originalMessage}

CUSTOMER NAME: ${csCase.customerName}
ISSUE CATEGORY: ${csCase.issueCategory || 'Unknown'}
CONTACT REASON: ${csCase.contactReason || 'General inquiry'}
${orderContext}
${playbookGuidance}

GUIDELINES:
1. Acknowledge the customer's concern first
2. Be empathetic but don't over-apologize
3. Offer a clear solution or next step
4. Protect company interests - don't promise things without verification
5. Sound human, not like a template
6. Keep it concise but complete
7. If tracking shows delivered but customer says not received, ask politely if someone else may have received it
8. For wrong item issues, if order value < $15, offer replacement without requiring return

Write the reply now (just the message, no additional commentary):`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('AI generation error:', error);
    return 'Unable to generate draft reply. Please compose manually.';
  }
}

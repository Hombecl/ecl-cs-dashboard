import Airtable from 'airtable';
import { CSCase, OrderInfo, Store, CSMessage, Playbook, StaffFeedback } from '@/types';
import { escapeAirtableValue, sanitizeStatus, isValidFeedbackStatus } from './sanitize';

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID!);

// Table references
const csCasesTable = base('CS Cases');
const csMessagesTable = base('CS Messages');
const ordersTable = base('Orders');
const storeTable = base('Store');
const playbookTable = base('CS Playbook');
const feedbackTable = base('CS Feedback');

// ============ CS Cases ============

export async function getCases(status?: string): Promise<CSCase[]> {
  // Validate status against whitelist to prevent injection
  const validStatus = sanitizeStatus(status);
  const filterFormula = validStatus ? `{Status} = '${validStatus}'` : '';

  const records = await csCasesTable
    .select({
      filterByFormula: filterFormula,
      sort: [{ field: 'Platform Order Number', direction: 'desc' }],
    })
    .all();

  return records.map(record => mapRecordToCase(record));
}

export async function getCaseById(id: string): Promise<CSCase | null> {
  try {
    const record = await csCasesTable.find(id);
    return mapRecordToCase(record);
  } catch {
    return null;
  }
}

export async function getCasesByCustomerEmail(email: string, excludeCaseId?: string): Promise<CSCase[]> {
  try {
    // Escape email to prevent formula injection
    const escapedEmail = escapeAirtableValue(email);
    const records = await csCasesTable
      .select({
        filterByFormula: `{Customer Email} = '${escapedEmail}'`,
        sort: [{ field: 'Platform Order Number', direction: 'desc' }],
      })
      .all();

    let cases = records.map(record => mapRecordToCase(record));

    // Exclude current case if specified
    if (excludeCaseId) {
      cases = cases.filter(c => c.id !== excludeCaseId);
    }

    return cases;
  } catch {
    return [];
  }
}

export async function createCase(caseData: Partial<CSCase>): Promise<CSCase> {
  const fields: Record<string, string | number | boolean | undefined> = {
    'Platform Order Number': caseData.platformOrderNumber,
    'Customer Name': caseData.customerName,
    'Customer Email': caseData.customerEmail,
    'Original Message': caseData.originalMessage,
    'Issue Category': caseData.issueCategory || undefined,
    'Sentiment': caseData.sentiment || undefined,
    'Urgency': caseData.urgency || undefined,
    'Status': caseData.status || 'New',
    'Contact Reason': caseData.contactReason || undefined,
    'Store Code': caseData.storeCode || undefined,
  };

  // Remove undefined values
  Object.keys(fields).forEach(key => {
    if (fields[key] === undefined) delete fields[key];
  });

  const record = await csCasesTable.create(fields as Airtable.FieldSet);

  return mapRecordToCase(record);
}

export async function updateCase(id: string, updates: Partial<CSCase>): Promise<CSCase> {
  const fields: Record<string, string | number | boolean | null> = {};

  if (updates.platformOrderNumber) fields['Platform Order Number'] = updates.platformOrderNumber;
  if (updates.status) fields['Status'] = updates.status;
  if (updates.issueCategory) fields['Issue Category'] = updates.issueCategory;
  if (updates.sentiment) fields['Sentiment'] = updates.sentiment;
  if (updates.urgency) fields['Urgency'] = updates.urgency;
  if (updates.aiDraftReply) fields['AI Draft Reply'] = updates.aiDraftReply;
  if (updates.finalReplySent) fields['Final Reply Sent'] = updates.finalReplySent;
  if (updates.resolutionType) fields['Resolution Type'] = updates.resolutionType;
  if (updates.resolutionNotes) fields['Resolution Notes'] = updates.resolutionNotes;
  if (updates.costToCompany !== undefined) fields['Cost to Company'] = updates.costToCompany;
  if (updates.customerSatisfaction) fields['Customer Satisfaction'] = updates.customerSatisfaction;
  if (updates.whatWorked) fields['What Worked'] = updates.whatWorked;
  if (updates.whatDidntWork) fields['What Didnt Work'] = updates.whatDidntWork;
  if (updates.playbookFeedback) fields['Playbook Feedback'] = updates.playbookFeedback;
  if (updates.internalNotes) fields['Internal Notes'] = updates.internalNotes;
  if (updates.resolvedAt) fields['Resolved At'] = updates.resolvedAt;
  if (updates.followUpDate) fields['Follow Up Date'] = updates.followUpDate;
  if (updates.assignedTo) fields['Assigned To'] = updates.assignedTo;
  if (updates.aiSummary) fields['AI Summary'] = updates.aiSummary;
  if (updates.aiSummaryGeneratedAt) fields['AI Summary Generated At'] = updates.aiSummaryGeneratedAt;

  const record = await csCasesTable.update(id, fields as Airtable.FieldSet);
  return mapRecordToCase(record);
}

function mapRecordToCase(record: Airtable.Record<Airtable.FieldSet>): CSCase {
  return {
    id: record.id,
    platformOrderNumber: record.get('Platform Order Number') as string || '',
    customerName: record.get('Customer Name') as string || '',
    customerEmail: record.get('Customer Email') as string || '',
    originalMessage: record.get('Original Message') as string || '',
    issueCategory: record.get('Issue Category') as CSCase['issueCategory'],
    sentiment: record.get('Sentiment') as CSCase['sentiment'],
    urgency: record.get('Urgency') as CSCase['urgency'],
    status: (record.get('Status') as CSCase['status']) || 'New',
    aiDraftReply: record.get('AI Draft Reply') as string | null,
    finalReplySent: record.get('Final Reply Sent') as string | null,
    resolutionType: record.get('Resolution Type') as CSCase['resolutionType'],
    resolutionNotes: record.get('Resolution Notes') as string | null,
    costToCompany: record.get('Cost to Company') as number | null,
    customerSatisfaction: record.get('Customer Satisfaction') as CSCase['customerSatisfaction'],
    whatWorked: record.get('What Worked') as string | null,
    whatDidntWork: record.get('What Didnt Work') as string | null,
    playbookFeedback: record.get('Playbook Feedback') as string | null,
    internalNotes: record.get('Internal Notes') as string | null,
    resolvedAt: record.get('Resolved At') as string | null,
    followUpDate: record.get('Follow Up Date') as string | null,
    contactReason: record.get('Contact Reason') as string | null,
    storeCode: record.get('Store Code') as string | null,
    assignedTo: record.get('Assigned To') as string | null,
    createdTime: record._rawJson.createdTime,
    aiSummary: record.get('AI Summary') as string | null,
    aiSummaryGeneratedAt: record.get('AI Summary Generated At') as string | null,
  };
}

// ============ Orders ============

export async function getOrderByPlatformNumber(platformOrderNumber: string): Promise<OrderInfo | null> {
  try {
    // Escape order number to prevent formula injection
    const escapedOrderNum = escapeAirtableValue(platformOrderNumber);
    // Note: {Platform Order Number (from 4Seller)} is a linked field (array), so use SEARCH()
    // Also search in {Order Number (from 4Seller)} which is a rollup text field
    const records = await ordersTable
      .select({
        filterByFormula: `OR(
          SEARCH('${escapedOrderNum}', ARRAYJOIN({Platform Order Number (from 4Seller)}, ',')),
          SEARCH('${escapedOrderNum}', ARRAYJOIN({Order Number (from 4Seller)}, ',')),
          {Order ID_} = '${escapedOrderNum}'
        )`,
        maxRecords: 1,
      })
      .all();

    if (records.length === 0) return null;

    const record = records[0];
    return mapRecordToOrder(record);
  } catch {
    return null;
  }
}

export async function getOrdersByCustomerEmail(email: string): Promise<OrderInfo[]> {
  try {
    // Escape email to prevent formula injection
    const escapedEmail = escapeAirtableValue(email);
    const records = await ordersTable
      .select({
        filterByFormula: `{Recipient Email_f} = '${escapedEmail}'`,
        sort: [{ field: 'Order Date', direction: 'desc' }],
      })
      .all();

    return records.map(record => mapRecordToOrder(record));
  } catch {
    return [];
  }
}

export async function searchOrdersByCustomerName(
  firstName: string,
  lastName: string,
  storeCode?: string,
  daysBack: number = 30
): Promise<OrderInfo[]> {
  try {
    // Escape inputs to prevent formula injection
    const escapedFirstName = escapeAirtableValue(firstName.trim().toLowerCase());
    const escapedLastName = escapeAirtableValue(lastName.trim().toLowerCase());
    const escapedStoreCode = storeCode ? escapeAirtableValue(storeCode) : null;

    // Calculate date range (last N days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    // Build filter formula
    // Match first name in Recipient First Name field (case insensitive)
    // AND match last name in Recipient Name field
    // AND filter by store code if provided
    // AND only orders from last N days
    let filterFormula = `AND(
      SEARCH('${escapedFirstName}', LOWER(ARRAYJOIN({Recipient First Name_f}, ','))),
      SEARCH('${escapedLastName}', LOWER(ARRAYJOIN({Recipient Name_f}, ','))),
      IS_AFTER({Order Date}, '${cutoffDateStr}')
    )`;

    // Add store code filter if provided
    if (escapedStoreCode) {
      filterFormula = `AND(
        SEARCH('${escapedFirstName}', LOWER(ARRAYJOIN({Recipient First Name_f}, ','))),
        SEARCH('${escapedLastName}', LOWER(ARRAYJOIN({Recipient Name_f}, ','))),
        {Shop Code_f} = '${escapedStoreCode}',
        IS_AFTER({Order Date}, '${cutoffDateStr}')
      )`;
    }

    const records = await ordersTable
      .select({
        filterByFormula: filterFormula,
        sort: [{ field: 'Order Date', direction: 'desc' }],
        maxRecords: 10, // Limit to 10 potential matches
      })
      .all();

    return records.map(record => mapRecordToOrder(record));
  } catch (error) {
    console.error('Error searching orders by customer name:', error);
    return [];
  }
}

function mapRecordToOrder(record: Airtable.Record<Airtable.FieldSet>): OrderInfo {
  const platformOrderNumbers = record.get('Platform Order Number (from 4Seller)') as unknown as string[] | undefined;
  const supplierLinks = record.get('Primary Supplier Link (from Linked SKU)') as unknown as string[] | undefined;
  const hdpProductId = record.get('HDP Product ID') as unknown as string[] | undefined;

  return {
    orderId: record.get('Order ID_') as unknown as string || '',
    platformOrderNumber: platformOrderNumbers?.[0] || '',
    itemName: (record.get('Item Name_f') as unknown as string[])?.[0] || '',
    sku: (record.get('SKU_f') as unknown as string[])?.[0] || '',
    quantity: (record.get('Quantity (from 4Seller)') as unknown as number[])?.[0] || 1,
    salesAmount: record.get('Sales Amt') as unknown as number || 0,
    orderDate: record.get('Order Date') as unknown as string || '',
    recipientName: (record.get('Recipient Name_f') as unknown as string[])?.[0] || '',
    recipientAddress: (record.get('Recipient Full Address_f') as unknown as string[])?.[0] || '',
    recipientPhone: (record.get('Recipient Phone Number_f') as unknown as string[])?.[0] || null,
    status: record.get('Status') as unknown as string || '',
    storeCode: (record.get('Shop Code_f') as unknown as string[])?.[0] || null,
    // Shipping dates
    shipDate: record.get('Shipper Dropoff Date') as unknown as string | null,
    latestShipDate: (record.get('Latest Ship Date (from 4Seller)') as unknown as string[])?.[0] || null,
    // Tracking
    trackingNumber: record.get('Tracking# (R)') as unknown as string | null,
    marketplaceTrackingNumber: record.get('Tracking Number in Marketplace_f') as unknown as string | null,
    trackingCarrier: record.get('Tracking Carrier for Shipper') as unknown as string | null,
    trackingStatus: record.get('17Track Status') as unknown as string | null,
    trackingDetailStatus: record.get('17Track Detail Status') as unknown as string | null,
    trackingLastUpdate: record.get('17Track Latest Event time') as unknown as string | null,
    expectedDelivery: (record.get('Latest Delivery Date (from 4Seller)') as unknown as string[])?.[0] || null,
    actualDelivery: record.get('17Track Delivery Date') as unknown as string | null,
    daysSinceLastUpdate: record.get('Days Since Last 17Track Update') as unknown as number | null,
    // Order Processing Status (for cancel assessment)
    platformOrderStatus: (record.get('Platform Order Status (from 4Seller)') as unknown as string[])?.[0] || null,
    fulfillmentStatus: record.get('Fulfillment Status') as unknown as string | null,
    shipperFulfillmentStatus: record.get('Shipper Fulfilment Status') as unknown as string | null,
    supplierOrderNumber: record.get('Supplier Order#') as unknown as string | null,
    shipmentDropped: !!(record.get('Shipment as Dropped') as unknown as boolean),
    // Links
    airtableRecordId: record.id,
    walmartProductId: hdpProductId?.[0] || null,
    supplierLink: supplierLinks?.[0] || null,
  };
}

// ============ Store ============

export async function getStoreByCode(storeCode: string): Promise<Store | null> {
  try {
    // Escape store code to prevent formula injection
    const escapedStoreCode = escapeAirtableValue(storeCode);
    const records = await storeTable
      .select({
        filterByFormula: `{Store Code} = '${escapedStoreCode}'`,
        maxRecords: 1,
      })
      .all();

    if (records.length === 0) return null;
    return mapRecordToStore(records[0]);
  } catch {
    return null;
  }
}

export async function getAllStores(): Promise<Store[]> {
  const records = await storeTable.select().all();
  return records.map(mapRecordToStore);
}

function mapRecordToStore(record: Airtable.Record<Airtable.FieldSet>): Store {
  return {
    id: record.id,
    storeCode: record.get('Store Code') as string || '',
    storeName: record.get('Store Name') as string || '',
    platform: record.get('Platform') as string || '',
    personaName: record.get('Persona Name') as string | null,
    personaAge: record.get('Persona Age') as number | null,
    personaLocation: record.get('Persona Location') as string | null,
    personaBackground: record.get('Persona Background') as string | null,
    personalityTraits: record.get('Personality Traits') as string | null,
    writingStyle: record.get('Writing Style') as string | null,
    greetingTemplate: record.get('Greeting Template') as string | null,
    signoffTemplate: record.get('Signoff Template') as string | null,
    csEmail: record.get('CS Email') as string | null,
    maxResponseHours: record.get('Max Response Hours') as number | null,
  };
}

// ============ Messages ============

export async function getMessagesByCaseId(caseId: string): Promise<CSMessage[]> {
  // Escape case ID to prevent formula injection
  const escapedCaseId = escapeAirtableValue(caseId);
  const records = await csMessagesTable
    .select({
      filterByFormula: `{Case ID} = '${escapedCaseId}'`,
      sort: [{ field: 'Case ID', direction: 'asc' }],
    })
    .all();

  return records.map(mapRecordToMessage);
}

export async function createMessage(messageData: Partial<CSMessage>): Promise<CSMessage> {
  const fields: Record<string, string | string[] | undefined> = {
    'Case ID': messageData.caseId,
    'Direction': messageData.direction,
    'Sender Type': messageData.senderType,
    'Staff Member': messageData.staffMember || undefined,
    'Persona Used': messageData.personaUsed || undefined,
    'Message Content': messageData.messageContent,
    'AI Draft Original': messageData.aiDraftOriginal || undefined,
    'Edits Made': messageData.editsMade || undefined,
    'Action Taken': messageData.actionTaken,
  };

  // Remove undefined values
  Object.keys(fields).forEach(key => {
    if (fields[key] === undefined) delete fields[key];
  });

  const record = await csMessagesTable.create(fields as Airtable.FieldSet);

  return mapRecordToMessage(record);
}

function mapRecordToMessage(record: Airtable.Record<Airtable.FieldSet>): CSMessage {
  return {
    id: record.id,
    caseId: record.get('Case ID') as string || '',
    direction: record.get('Direction') as CSMessage['direction'],
    senderType: record.get('Sender Type') as CSMessage['senderType'],
    staffMember: record.get('Staff Member') as string | null,
    personaUsed: record.get('Persona Used') as string | null,
    messageContent: record.get('Message Content') as string || '',
    aiDraftOriginal: record.get('AI Draft Original') as string | null,
    editsMade: record.get('Edits Made') as string | null,
    actionTaken: record.get('Action Taken') as string[] || [],
    createdTime: record._rawJson.createdTime,
  };
}

// ============ Playbook ============

export async function getPlaybookByCategory(category: string): Promise<Playbook | null> {
  try {
    // Escape category to prevent formula injection
    const escapedCategory = escapeAirtableValue(category);
    const records = await playbookTable
      .select({
        filterByFormula: `AND({Issue Category} = '${escapedCategory}', {Playbook Status} = 'Active')`,
        maxRecords: 1,
      })
      .all();

    if (records.length === 0) return null;
    return mapRecordToPlaybook(records[0]);
  } catch {
    return null;
  }
}

export async function getAllPlaybooks(): Promise<Playbook[]> {
  const records = await playbookTable.select().all();
  return records.map(mapRecordToPlaybook);
}

function mapRecordToPlaybook(record: Airtable.Record<Airtable.FieldSet>): Playbook {
  return {
    id: record.id,
    scenarioName: record.get('Scenario Name') as string || '',
    issueCategory: record.get('Issue Category') as Playbook['issueCategory'],
    description: record.get('Description') as string | null,
    decisionTree: record.get('Decision Tree') as string | null,
    responseTemplate: record.get('Response Template') as string | null,
    whenToEscalate: record.get('When to Escalate') as string | null,
    autoRefundThreshold: record.get('Auto Refund Threshold') as number | null,
    returnRequiredThreshold: record.get('Return Required Threshold') as number | null,
    successRate: record.get('Success Rate') as number | null,
    avgResolutionDays: record.get('Avg Resolution Days') as number | null,
    totalCases: record.get('Total Cases') as number | null,
    status: (record.get('Playbook Status') as Playbook['status']) || 'Draft',
    notes: record.get('Notes') as string | null,
  };
}

// ============ Staff Feedback ============

export async function createFeedback(feedbackData: Partial<StaffFeedback>): Promise<StaffFeedback> {
  const fields: Record<string, string | undefined> = {
    'Title': feedbackData.title,
    'Type': feedbackData.type,
    'Description': feedbackData.description,
    'Related Case ID': feedbackData.relatedCaseId || undefined,
    'Submitted By': feedbackData.submittedBy,
    'Status': 'New',
  };

  // Remove undefined values
  Object.keys(fields).forEach(key => {
    if (fields[key] === undefined) delete fields[key];
  });

  const record = await feedbackTable.create(fields as Airtable.FieldSet);

  return mapRecordToFeedback(record);
}

export async function getFeedback(status?: string): Promise<StaffFeedback[]> {
  // Validate feedback status against whitelist to prevent injection
  const validStatus = status && isValidFeedbackStatus(status) ? status : null;
  const filterFormula = validStatus ? `{Status} = '${validStatus}'` : '';

  const records = await feedbackTable
    .select({
      filterByFormula: filterFormula,
      sort: [{ field: 'Title', direction: 'desc' }],
    })
    .all();

  return records.map(record => mapRecordToFeedback(record));
}

function mapRecordToFeedback(record: Airtable.Record<Airtable.FieldSet>): StaffFeedback {
  return {
    id: record.id,
    title: record.get('Title') as string || '',
    type: record.get('Type') as StaffFeedback['type'],
    description: record.get('Description') as string || '',
    relatedCaseId: record.get('Related Case ID') as string | null,
    submittedBy: record.get('Submitted By') as string || '',
    status: (record.get('Status') as StaffFeedback['status']) || 'New',
    priority: record.get('Priority') as StaffFeedback['priority'],
    notes: record.get('Notes') as string | null,
    createdTime: record._rawJson.createdTime,
  };
}

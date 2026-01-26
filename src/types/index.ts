// CS Case Types
export interface CSCase {
  id: string;
  platformOrderNumber: string;
  customerName: string;
  customerEmail: string;
  originalMessage: string;
  issueCategory: IssueCategory | null;
  sentiment: Sentiment | null;
  urgency: Urgency | null;
  status: CaseStatus;
  aiDraftReply: string | null;
  finalReplySent: string | null;
  resolutionType: ResolutionType | null;
  resolutionNotes: string | null;
  costToCompany: number | null;
  customerSatisfaction: CustomerSatisfaction | null;
  whatWorked: string | null;
  whatDidntWork: string | null;
  playbookFeedback: string | null;
  internalNotes: string | null;
  resolvedAt: string | null;
  followUpDate: string | null;
  contactReason: string | null;
  storeCode: string | null;
  assignedTo: string | null;
  createdTime: string;
  // AI Summary (cached to avoid regeneration)
  aiSummary: string | null;
  aiSummaryGeneratedAt: string | null;
  // Enriched fields from Order lookup
  order?: OrderInfo | null;
}

export type IssueCategory =
  | 'Wrong Item'
  | 'Damaged Item'
  | 'Not Received'
  | 'Tracking Question'
  | 'Cancel Request'
  | 'Return Request'
  | 'General Question'
  | 'Complaint'
  | 'Other';

export type Sentiment = 'Frustrated' | 'Concerned' | 'Neutral' | 'Polite';

export type Urgency = 'High' | 'Medium' | 'Low';

export type CaseStatus =
  | 'New'
  | 'In Progress'
  | 'Pending Customer'
  | 'Pending Internal'
  | 'Replied'
  | 'Resolved'
  | 'Escalated';

export type ResolutionType =
  | 'Replacement Sent'
  | 'Full Refund'
  | 'Partial Refund'
  | 'Tracking Provided'
  | 'Info Provided'
  | 'Order Cancelled'
  | 'Return Accepted'
  | 'No Action Needed'
  | 'Escalated';

export type CustomerSatisfaction = 'Positive' | 'Neutral' | 'Negative' | 'Unknown';

// Order Info (from Orders table)
export interface OrderInfo {
  orderId: string;
  platformOrderNumber: string;
  itemName: string;
  sku: string;
  quantity: number;
  salesAmount: number;
  orderDate: string;
  recipientName: string;
  recipientAddress: string;
  recipientPhone: string | null;
  status: string;
  storeCode: string | null;
  // Shipping dates
  shipDate: string | null;
  latestShipDate: string | null;
  // Tracking info
  trackingNumber: string | null;  // Tracking# (R) - actual tracking for 17Track
  marketplaceTrackingNumber: string | null;  // Tracking uploaded to marketplace (what customer sees)
  trackingCarrier: string | null;
  trackingStatus: string | null;
  trackingDetailStatus: string | null;
  trackingLastUpdate: string | null;
  expectedDelivery: string | null;
  actualDelivery: string | null;
  daysSinceLastUpdate: number | null;
  trackingEvents?: TrackingEvent[];
  // Order Processing Status (for cancel assessment)
  platformOrderStatus: string | null;  // Walmart order status
  fulfillmentStatus: string | null;  // Internal fulfillment status
  shipperFulfillmentStatus: string | null;  // Shipper processing status
  supplierOrderNumber: string | null;  // If exists, supplier already placed order
  shipmentDropped: boolean;  // Whether shipment has been dropped off
  // Links
  airtableRecordId: string;
  walmartProductId: string | null;
  supplierLink: string | null;
}

export interface TrackingEvent {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

// Store with Persona
export interface Store {
  id: string;
  storeCode: string;
  storeName: string;
  platform: string;
  personaName: string | null;
  personaAge: number | null;
  personaLocation: string | null;
  personaBackground: string | null;
  personalityTraits: string | null;
  writingStyle: string | null;
  greetingTemplate: string | null;
  signoffTemplate: string | null;
  csEmail: string | null;
  maxResponseHours: number | null;
}

// CS Message
export interface CSMessage {
  id: string;
  caseId: string;
  direction: 'Inbound' | 'Outbound';
  senderType: 'Customer' | 'Staff' | 'System';
  staffMember: string | null;
  personaUsed: string | null;
  messageContent: string;
  aiDraftOriginal: string | null;
  editsMade: string | null;
  actionTaken: string[];
  createdTime: string;
}

// Playbook
export interface Playbook {
  id: string;
  scenarioName: string;
  issueCategory: IssueCategory | null;
  description: string | null;
  decisionTree: string | null;
  responseTemplate: string | null;
  whenToEscalate: string | null;
  autoRefundThreshold: number | null;
  returnRequiredThreshold: number | null;
  successRate: number | null;
  avgResolutionDays: number | null;
  totalCases: number | null;
  status: 'Draft' | 'Active' | 'Deprecated';
  notes: string | null;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Dashboard Stats
export interface DashboardStats {
  newCases: number;
  inProgressCases: number;
  pendingCases: number;
  resolvedToday: number;
  avgResponseTime: number;
}

// Staff Feedback
export type FeedbackType = 'Feature Request' | 'Bug Report' | 'Data Issue' | 'Case Issue' | 'Other';
export type FeedbackStatus = 'New' | 'In Progress' | 'Done' | 'Wont Fix';
export type FeedbackPriority = 'High' | 'Medium' | 'Low';

export interface StaffFeedback {
  id: string;
  title: string;
  type: FeedbackType;
  description: string;
  relatedCaseId: string | null;
  submittedBy: string;
  status: FeedbackStatus;
  priority: FeedbackPriority | null;
  notes: string | null;
  createdTime: string;
}

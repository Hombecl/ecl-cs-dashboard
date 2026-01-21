'use client';

import { useState } from 'react';
import { CSCase } from '@/types';
import { differenceInHours, format, formatDistanceToNow } from 'date-fns';
import {
  User, Truck, Sparkles,
  Copy, RefreshCw, Check, AlertTriangle, Clock,
  Flag, DollarSign, Eye, EyeOff, Lightbulb, ListChecks,
  ChevronDown, ChevronRight, ChevronLeft, Send, Calendar,
  ExternalLink
} from 'lucide-react';
import FollowUpChecklist from './FollowUpChecklist';
import CustomerProfileModal from './CustomerProfileModal';

interface CaseDetailProps {
  caseData: CSCase;
  onUpdate: (id: string, updates: Partial<CSCase>) => void;
  // Navigation props
  onPrevCase?: () => void;
  onNextCase?: () => void;
  hasPrevCase?: boolean;
  hasNextCase?: boolean;
  currentIndex?: number;
  totalCases?: number;
  onSubmitAndNext?: () => void;
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between hover:bg-gray-50 transition px-4 py-3"
      >
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">{icon}</span>
          <span className="font-medium text-gray-900">{title}</span>
          {badge}
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="border-t border-gray-100 p-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default function CaseDetail({
  caseData,
  onUpdate,
  onPrevCase,
  onNextCase,
  hasPrevCase = false,
  hasNextCase = false,
  currentIndex,
  totalCases,
  onSubmitAndNext,
}: CaseDetailProps) {
  const [draftReply, setDraftReply] = useState(caseData.aiDraftReply || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedOrderNum, setCopiedOrderNum] = useState(false);
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [showFullMessage, setShowFullMessage] = useState(false);

  const copyOrderNumber = () => {
    if (caseData.platformOrderNumber) {
      navigator.clipboard.writeText(caseData.platformOrderNumber);
      setCopiedOrderNum(true);
      setTimeout(() => setCopiedOrderNum(false), 2000);
    }
  };

  const generateDraft = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/cases/${caseData.id}/generate-reply`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setDraftReply(data.data.reply);
        onUpdate(caseData.id, { aiDraftReply: data.data.reply });
      }
    } catch (error) {
      console.error('Failed to generate draft:', error);
    }
    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draftReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = (newStatus: CSCase['status']) => {
    onUpdate(caseData.id, { status: newStatus });
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'replacement':
        onUpdate(caseData.id, {
          status: 'In Progress',
          resolutionType: 'Replacement Sent',
        });
        break;
      case 'refund':
        onUpdate(caseData.id, {
          status: 'In Progress',
          resolutionType: 'Full Refund',
        });
        break;
      case 'resolve':
        onUpdate(caseData.id, {
          status: 'Resolved',
          resolvedAt: new Date().toISOString().split('T')[0],
        });
        break;
      case 'escalate':
        onUpdate(caseData.id, {
          status: 'Escalated',
        });
        break;
    }
  };

  // Calculate case age
  const caseAgeHours = differenceInHours(new Date(), new Date(caseData.createdTime));
  const isCaseOverdue = caseData.status !== 'Resolved' && caseAgeHours > 24;
  const isCaseCritical = caseData.status !== 'Resolved' && caseAgeHours > 48;

  // Truncate message for preview
  const messagePreview = caseData.originalMessage?.length > 200
    ? caseData.originalMessage.slice(0, 200) + '...'
    : caseData.originalMessage;

  // Get tracking summary
  const getTrackingSummary = () => {
    if (!caseData.order) return 'No order';
    if (caseData.order.actualDelivery) return `Delivered ${caseData.order.actualDelivery}`;
    if (caseData.order.trackingStatus) return caseData.order.trackingStatus;
    if (caseData.order.shipDate) return `Shipped ${caseData.order.shipDate}`;
    return 'Pending';
  };

  // Get cancel status for order
  const getCancelStatus = () => {
    if (!caseData.order) return null;
    const order = caseData.order;
    const canCancel = !order.supplierOrderNumber && !order.shipmentDropped && !order.trackingNumber;
    const maybeCancel = order.supplierOrderNumber && !order.shipmentDropped && !order.trackingNumber;

    if (canCancel) return { text: 'Can Cancel', color: 'bg-green-100 text-green-700' };
    if (maybeCancel) return { text: 'Check Supplier', color: 'bg-yellow-100 text-yellow-700' };
    return { text: 'Cannot Cancel', color: 'bg-red-100 text-red-700' };
  };

  const cancelStatus = getCancelStatus();

  // Format received time
  const receivedTime = caseData.createdTime ? new Date(caseData.createdTime) : null;
  const receivedTimeFormatted = receivedTime
    ? format(receivedTime, 'MMM d, yyyy h:mm a')
    : 'Unknown';
  const receivedTimeAgo = receivedTime
    ? formatDistanceToNow(receivedTime, { addSuffix: true })
    : '';

  // Handle submit and next
  const handleSubmitAndNext = () => {
    // Mark as resolved first
    onUpdate(caseData.id, {
      status: 'Resolved',
      resolvedAt: new Date().toISOString().split('T')[0],
    });
    // Then move to next case
    if (onSubmitAndNext) {
      onSubmitAndNext();
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto space-y-4">

        {/* Navigation Bar */}
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={onPrevCase}
              disabled={!hasPrevCase}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev</span>
            </button>
            {currentIndex !== undefined && totalCases !== undefined && (
              <span className="text-sm text-gray-500">
                {currentIndex + 1} of {totalCases}
              </span>
            )}
            <button
              onClick={onNextCase}
              disabled={!hasNextCase}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Submit & Next Button */}
          <button
            onClick={handleSubmitAndNext}
            disabled={!hasNextCase && caseData.status === 'Resolved'}
            className="flex items-center space-x-2 px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            <span>{hasNextCase ? 'Submit & Next' : 'Submit'}</span>
          </button>
        </div>

        {/* Compact Summary Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          {/* Top Row: Case ID, Status, Store */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-gray-900">
                #{caseData.platformOrderNumber?.slice(-6) || 'N/A'}
              </h2>
              <button
                onClick={copyOrderNumber}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Copy order number"
              >
                {copiedOrderNum ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </button>
              <a
                href={`https://seller.walmart.com/order-management?query=${encodeURIComponent(caseData.platformOrderNumber || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                title="Open in Walmart Seller Center"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              {caseData.storeCode && (
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">
                  {caseData.storeCode}
                </span>
              )}
              {/* Age Warning Badges */}
              {isCaseCritical && (
                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{caseAgeHours}h</span>
                </span>
              )}
              {!isCaseCritical && isCaseOverdue && (
                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{caseAgeHours}h</span>
                </span>
              )}
            </div>
            <select
              value={caseData.status}
              onChange={(e) => handleStatusChange(e.target.value as CSCase['status'])}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Customer">Pending Customer</option>
              <option value="Pending Internal">Pending Internal</option>
              <option value="Resolved">Resolved</option>
              <option value="Escalated">Escalated</option>
            </select>
          </div>

          {/* Key Info Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
            <span className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{caseData.customerName || 'Unknown'}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span title={receivedTimeAgo}>{receivedTimeFormatted}</span>
            </span>
            {caseData.order && (
              <>
                <span className="flex items-center space-x-1">
                  <DollarSign className="h-3 w-3" />
                  <span>${caseData.order.salesAmount.toFixed(2)}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Truck className="h-3 w-3" />
                  <span>{getTrackingSummary()}</span>
                </span>
              </>
            )}
            {cancelStatus && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${cancelStatus.color}`}>
                {cancelStatus.text}
              </span>
            )}
          </div>

          {/* Tags Row */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {caseData.issueCategory && (
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                {caseData.issueCategory}
              </span>
            )}
            {caseData.sentiment && (
              <span className={`text-xs px-2 py-0.5 rounded ${
                caseData.sentiment === 'Frustrated' ? 'bg-red-50 text-red-700' :
                caseData.sentiment === 'Concerned' ? 'bg-orange-50 text-orange-700' :
                caseData.sentiment === 'Polite' ? 'bg-green-50 text-green-700' :
                'bg-gray-50 text-gray-700'
              }`}>
                {caseData.sentiment}
              </span>
            )}
            {caseData.urgency && (
              <span className={`text-xs px-2 py-0.5 rounded ${
                caseData.urgency === 'High' ? 'bg-red-50 text-red-700' :
                caseData.urgency === 'Medium' ? 'bg-yellow-50 text-yellow-700' :
                'bg-green-50 text-green-700'
              }`}>
                {caseData.urgency}
              </span>
            )}
          </div>

          {/* Tracking Numbers */}
          {caseData.order && (caseData.order.trackingNumber || caseData.order.marketplaceTrackingNumber) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-3 bg-gray-50 rounded px-3 py-2">
              {caseData.order.trackingNumber && (
                <span className="flex items-center space-x-1.5">
                  <span className="text-gray-400">Actual:</span>
                  <code className="bg-white px-1.5 py-0.5 rounded border text-gray-700">{caseData.order.trackingNumber}</code>
                </span>
              )}
              {caseData.order.marketplaceTrackingNumber && caseData.order.marketplaceTrackingNumber !== caseData.order.trackingNumber && (
                <span className="flex items-center space-x-1.5">
                  <span className="text-gray-400">Walmart:</span>
                  <code className="bg-white px-1.5 py-0.5 rounded border text-gray-700">{caseData.order.marketplaceTrackingNumber}</code>
                </span>
              )}
            </div>
          )}

          {/* Customer Message */}
          <div className="bg-gray-50 rounded p-3 mb-3">
            <div className="flex items-start justify-between">
              <p className="text-sm text-gray-700 flex-1 whitespace-pre-wrap">
                {showFullMessage ? caseData.originalMessage : messagePreview}
              </p>
              {caseData.originalMessage?.length > 200 && (
                <button
                  onClick={() => setShowFullMessage(!showFullMessage)}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1 flex-shrink-0"
                >
                  {showFullMessage ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span>{showFullMessage ? 'Less' : 'More'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAction('replacement')}
              className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition"
            >
              Replacement
            </button>
            <button
              onClick={() => handleAction('refund')}
              className="px-3 py-1.5 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded transition"
            >
              Refund
            </button>
            <button
              onClick={() => handleAction('resolve')}
              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition"
            >
              Resolve
            </button>
            <button
              onClick={() => handleAction('escalate')}
              className="px-3 py-1.5 text-xs bg-red-50 text-red-700 hover:bg-red-100 rounded transition"
            >
              <Flag className="h-3 w-3 inline mr-1" />
              Escalate
            </button>
            <button
              onClick={() => setShowCustomerProfile(true)}
              className="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 rounded transition"
            >
              Full Profile
            </button>
          </div>
        </div>

        {/* Draft Reply - Main work area */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="font-medium text-gray-900">Draft Reply</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={generateDraft}
                disabled={isGenerating}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs text-purple-600 hover:bg-purple-50 rounded transition disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
              </button>
              <button
                onClick={copyToClipboard}
                disabled={!draftReply}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition disabled:opacity-50"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
          <textarea
            value={draftReply}
            onChange={(e) => setDraftReply(e.target.value)}
            placeholder="Click 'Generate' to create an AI draft reply..."
            className="w-full h-48 p-3 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
          />
        </div>

        {/* Playbook Hints - Collapsible */}
        <CollapsibleSection
          title="Playbook"
          icon={<Lightbulb className="h-4 w-4" />}
          badge={caseData.issueCategory && (
            <span className="text-xs text-amber-600 ml-2">{caseData.issueCategory}</span>
          )}
        >
          <PlaybookContent caseData={caseData} />
        </CollapsibleSection>

        {/* Follow-up Checklist - Collapsible */}
        <CollapsibleSection
          title="Follow-up Checklist"
          icon={<ListChecks className="h-4 w-4" />}
        >
          <FollowUpChecklist caseData={caseData} />
        </CollapsibleSection>

        {/* Internal Notes */}
        {caseData.internalNotes && (
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-3">
            <p className="text-xs font-medium text-yellow-800 mb-1">Internal Notes</p>
            <p className="text-sm text-yellow-700">{caseData.internalNotes}</p>
          </div>
        )}

      </div>

      {/* Customer Profile Modal */}
      <CustomerProfileModal
        isOpen={showCustomerProfile}
        onClose={() => setShowCustomerProfile(false)}
        caseData={caseData}
      />
    </div>
  );
}

// Playbook Content Component
function PlaybookContent({ caseData }: { caseData: CSCase }) {
  const getPlaybookHints = (category: string | null, order: CSCase['order']) => {
    switch (category) {
      case 'Shipping Delay':
        return {
          steps: [
            'Check tracking status - delayed or slow update?',
            'If no update >5 days, contact carrier or offer resolution',
            'If within normal timeframe, reassure with tracking info',
          ],
          autoAction: 'If >14 days since ship, offer replacement or refund',
        };
      case 'Missing Package':
        return {
          steps: [
            'Verify delivery address matches order',
            'If marked delivered, ask to check with neighbors',
            'Wait 2 business days, then replace or refund',
          ],
          autoAction: order?.salesAmount && order.salesAmount < 30
            ? 'Auto-refund eligible (<$30)'
            : 'Manual review required (>$30)',
        };
      case 'Damaged Item':
        return {
          steps: [
            'Request photo of damage if not provided',
            'Apologize and offer replacement OR refund',
            'No return required for items <$50',
          ],
          autoAction: order?.salesAmount && order.salesAmount < 50
            ? 'No return required (<$50)'
            : 'Return may be required (>$50)',
        };
      case 'Wrong Item':
        return {
          steps: [
            'Confirm what customer received vs ordered',
            'Ship correct item immediately',
            'Customer can keep wrong item (no return)',
          ],
          autoAction: 'Send replacement immediately',
        };
      case 'Return Request':
        return {
          steps: [
            'Check return eligibility (within 30 days?)',
            'Ask reason for return',
            'Offer exchange first, then refund',
          ],
          autoAction: 'Check Walmart return policy',
        };
      case 'Cancel Request':
        return {
          steps: [
            'Check if order has shipped',
            'If not shipped - cancel immediately',
            'If shipped - explain cannot cancel, offer return',
          ],
          autoAction: order?.status === 'Ordered'
            ? 'Can still cancel - not shipped'
            : 'Already shipped - cannot cancel',
        };
      default:
        return {
          steps: [
            'Acknowledge customer concern',
            'Investigate the issue',
            'Provide clear resolution or next steps',
          ],
          autoAction: null,
        };
    }
  };

  const hints = getPlaybookHints(caseData.issueCategory, caseData.order);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-gray-700 mb-2">Steps:</p>
        <ul className="space-y-1">
          {hints.steps.map((step, i) => (
            <li key={i} className="text-sm text-gray-600">• {step}</li>
          ))}
        </ul>
      </div>
      {hints.autoAction && (
        <div className="p-2 bg-amber-50 rounded text-sm text-amber-800">
          <span className="font-medium">Quick Action:</span> {hints.autoAction}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { CSCase, OrderInfo, IssueCategory } from '@/types';
import {
  CheckSquare, Square, ChevronDown, ChevronUp,
  AlertTriangle, Phone, Mail, Package, Truck,
  RefreshCw, FileText, DollarSign, MessageSquare
} from 'lucide-react';

interface FollowUpChecklistProps {
  caseData: CSCase;
}

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  category: 'verify' | 'action' | 'communicate' | 'document';
}

export default function FollowUpChecklist({ caseData }: FollowUpChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(true);

  const toggleItem = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  // Generate checklist items based on case data
  const checklistItems = useMemo(() => {
    const items: ChecklistItem[] = [];
    const order = caseData.order;
    const category = caseData.issueCategory;

    // ========== Universal Items ==========
    items.push({
      id: 'verify-order',
      label: 'Verify order details match customer inquiry',
      description: 'Confirm order number, item, and customer name',
      priority: 'high',
      category: 'verify',
    });

    // ========== Category-Specific Items ==========

    // Cancel Request
    if (category === 'Cancel Request') {
      items.push({
        id: 'check-cancel-status',
        label: 'Check if order can be cancelled',
        description: 'Review Order Processing Status panel above',
        priority: 'high',
        category: 'verify',
      });

      if (order?.supplierOrderNumber) {
        items.push({
          id: 'contact-supplier-cancel',
          label: 'Contact supplier to request cancellation',
          description: `Supplier Order #: ${order.supplierOrderNumber}`,
          priority: 'high',
          category: 'action',
        });
      }

      if (order?.shipmentDropped || order?.trackingNumber) {
        items.push({
          id: 'explain-shipped',
          label: 'Explain to customer that order has shipped',
          description: 'Advise they can refuse delivery or return after receiving',
          priority: 'high',
          category: 'communicate',
        });
      } else {
        items.push({
          id: 'process-cancel',
          label: 'Process cancellation in system',
          priority: 'high',
          category: 'action',
        });
        items.push({
          id: 'confirm-refund-timeline',
          label: 'Confirm refund timeline with customer',
          description: 'Usually 3-5 business days after cancellation',
          priority: 'medium',
          category: 'communicate',
        });
      }
    }

    // Not Received / Tracking Question
    if (category === 'Not Received' || category === 'Tracking Question') {
      items.push({
        id: 'check-tracking-status',
        label: 'Check 17Track status for actual delivery status',
        description: 'Review Delivery Status panel for discrepancies',
        priority: 'high',
        category: 'verify',
      });

      if (!order?.marketplaceTrackingNumber && order?.trackingNumber) {
        items.push({
          id: 'upload-tracking',
          label: 'Upload tracking number to marketplace',
          description: 'Customer cannot see tracking on Walmart yet',
          priority: 'high',
          category: 'action',
        });
      }

      if (order?.daysSinceLastUpdate && order.daysSinceLastUpdate > 3) {
        items.push({
          id: 'check-carrier',
          label: 'Contact carrier for shipment update',
          description: `No tracking update for ${order.daysSinceLastUpdate} days`,
          priority: 'high',
          category: 'action',
        });
      }

      items.push({
        id: 'verify-address',
        label: 'Verify shipping address is correct',
        description: order?.recipientAddress || 'Check order details',
        priority: 'medium',
        category: 'verify',
      });

      items.push({
        id: 'provide-tracking-info',
        label: 'Provide tracking information to customer',
        description: 'Include expected delivery date if available',
        priority: 'medium',
        category: 'communicate',
      });

      if (order?.trackingStatus?.toLowerCase().includes('delivered')) {
        items.push({
          id: 'check-delivery-location',
          label: 'Ask customer to check with neighbors/building office',
          priority: 'medium',
          category: 'communicate',
        });
        items.push({
          id: 'file-claim',
          label: 'Consider filing lost package claim with carrier',
          priority: 'low',
          category: 'action',
        });
      }
    }

    // Damaged Item
    if (category === 'Damaged Item') {
      items.push({
        id: 'request-photos',
        label: 'Request photos of damaged item',
        description: 'Ask for photos of item and packaging',
        priority: 'high',
        category: 'communicate',
      });

      items.push({
        id: 'assess-damage',
        label: 'Assess damage severity from photos',
        description: 'Determine if partial refund or full replacement needed',
        priority: 'high',
        category: 'verify',
      });

      items.push({
        id: 'check-refund-threshold',
        label: 'Check refund threshold for this item',
        description: `Order value: $${order?.salesAmount?.toFixed(2) || 'N/A'}`,
        priority: 'medium',
        category: 'verify',
      });

      items.push({
        id: 'offer-resolution',
        label: 'Offer resolution (refund/replacement/discount)',
        priority: 'high',
        category: 'communicate',
      });

      items.push({
        id: 'document-damage',
        label: 'Document damage in internal notes',
        description: 'For quality tracking and supplier feedback',
        priority: 'low',
        category: 'document',
      });
    }

    // Wrong Item
    if (category === 'Wrong Item') {
      items.push({
        id: 'verify-wrong-item',
        label: 'Verify what item customer received vs ordered',
        description: 'Request photos if needed',
        priority: 'high',
        category: 'verify',
      });

      items.push({
        id: 'check-sku',
        label: 'Check SKU matches listing',
        description: `SKU: ${order?.sku || 'N/A'}`,
        priority: 'high',
        category: 'verify',
      });

      items.push({
        id: 'arrange-return',
        label: 'Arrange return if required',
        description: 'Check if return is needed based on item value',
        priority: 'medium',
        category: 'action',
      });

      items.push({
        id: 'send-correct-item',
        label: 'Arrange to send correct item',
        priority: 'high',
        category: 'action',
      });

      items.push({
        id: 'report-fulfillment-error',
        label: 'Report fulfillment error internally',
        description: 'For quality improvement tracking',
        priority: 'low',
        category: 'document',
      });
    }

    // Return Request
    if (category === 'Return Request') {
      items.push({
        id: 'check-return-eligibility',
        label: 'Check return eligibility',
        description: 'Review order date and return policy',
        priority: 'high',
        category: 'verify',
      });

      items.push({
        id: 'understand-return-reason',
        label: 'Understand reason for return',
        description: 'Ask customer why they want to return',
        priority: 'high',
        category: 'communicate',
      });

      items.push({
        id: 'provide-return-instructions',
        label: 'Provide return instructions',
        description: 'Include return address and any labels needed',
        priority: 'medium',
        category: 'communicate',
      });

      items.push({
        id: 'set-refund-expectation',
        label: 'Set refund timeline expectation',
        description: 'After item is received and inspected',
        priority: 'medium',
        category: 'communicate',
      });
    }

    // Complaint
    if (category === 'Complaint') {
      items.push({
        id: 'acknowledge-concern',
        label: 'Acknowledge customer concern',
        description: 'Show empathy and understanding',
        priority: 'high',
        category: 'communicate',
      });

      items.push({
        id: 'identify-root-cause',
        label: 'Identify root cause of complaint',
        description: 'What went wrong and why',
        priority: 'high',
        category: 'verify',
      });

      items.push({
        id: 'offer-solution',
        label: 'Offer appropriate solution',
        description: 'Based on complaint severity',
        priority: 'high',
        category: 'action',
      });

      items.push({
        id: 'consider-escalation',
        label: 'Consider if escalation is needed',
        description: 'For serious complaints or repeat issues',
        priority: 'medium',
        category: 'verify',
      });
    }

    // General Question
    if (category === 'General Question') {
      items.push({
        id: 'understand-question',
        label: 'Fully understand customer question',
        description: 'Ask for clarification if needed',
        priority: 'high',
        category: 'verify',
      });

      items.push({
        id: 'provide-accurate-info',
        label: 'Provide accurate information',
        description: 'Check knowledge base if unsure',
        priority: 'high',
        category: 'communicate',
      });

      items.push({
        id: 'offer-additional-help',
        label: 'Ask if customer needs anything else',
        priority: 'low',
        category: 'communicate',
      });
    }

    // ========== Status-Based Items ==========

    // High urgency cases
    if (caseData.urgency === 'High') {
      items.push({
        id: 'prioritize-response',
        label: 'Prioritize this case - High urgency',
        description: 'Respond within 2 hours if possible',
        priority: 'high',
        category: 'action',
      });
    }

    // Frustrated customer
    if (caseData.sentiment === 'Frustrated') {
      items.push({
        id: 'handle-with-care',
        label: 'Handle with extra care - Customer is frustrated',
        description: 'Use empathetic language and offer goodwill gesture if appropriate',
        priority: 'high',
        category: 'communicate',
      });
    }

    // ========== Final Items ==========
    items.push({
      id: 'update-case-status',
      label: 'Update case status appropriately',
      description: 'In Progress, Pending Customer, or Resolved',
      priority: 'medium',
      category: 'document',
    });

    items.push({
      id: 'add-internal-notes',
      label: 'Add internal notes for future reference',
      description: 'Document key findings and actions taken',
      priority: 'low',
      category: 'document',
    });

    return items;
  }, [caseData]);

  const getCategoryIcon = (category: ChecklistItem['category']) => {
    switch (category) {
      case 'verify':
        return <FileText className="h-3 w-3" />;
      case 'action':
        return <RefreshCw className="h-3 w-3" />;
      case 'communicate':
        return <MessageSquare className="h-3 w-3" />;
      case 'document':
        return <FileText className="h-3 w-3" />;
    }
  };

  const getCategoryColor = (category: ChecklistItem['category']) => {
    switch (category) {
      case 'verify':
        return 'bg-blue-100 text-blue-700';
      case 'action':
        return 'bg-orange-100 text-orange-700';
      case 'communicate':
        return 'bg-green-100 text-green-700';
      case 'document':
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityBadge = (priority: ChecklistItem['priority']) => {
    switch (priority) {
      case 'high':
        return <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">High</span>;
      case 'medium':
        return <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">Med</span>;
      case 'low':
        return null;
    }
  };

  const completedCount = checkedItems.size;
  const totalCount = checklistItems.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Group by priority
  const highPriorityItems = checklistItems.filter(i => i.priority === 'high');
  const otherItems = checklistItems.filter(i => i.priority !== 'high');

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{completedCount}/{totalCount} completed</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              progress === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* High Priority Section */}
      {highPriorityItems.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span className="text-xs font-medium text-red-700 uppercase">Priority Actions</span>
          </div>
          <div className="space-y-2">
            {highPriorityItems.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                checked={checkedItems.has(item.id)}
                onToggle={() => toggleItem(item.id)}
                getCategoryIcon={getCategoryIcon}
                getCategoryColor={getCategoryColor}
                getPriorityBadge={getPriorityBadge}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Items Section */}
      {otherItems.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Additional Steps</span>
          </div>
          <div className="space-y-2">
            {otherItems.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                checked={checkedItems.has(item.id)}
                onToggle={() => toggleItem(item.id)}
                getCategoryIcon={getCategoryIcon}
                getCategoryColor={getCategoryColor}
                getPriorityBadge={getPriorityBadge}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ChecklistItemRowProps {
  item: ChecklistItem;
  checked: boolean;
  onToggle: () => void;
  getCategoryIcon: (category: ChecklistItem['category']) => React.ReactNode;
  getCategoryColor: (category: ChecklistItem['category']) => string;
  getPriorityBadge: (priority: ChecklistItem['priority']) => React.ReactNode;
}

function ChecklistItemRow({
  item,
  checked,
  onToggle,
  getCategoryIcon,
  getCategoryColor,
  getPriorityBadge,
}: ChecklistItemRowProps) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-start space-x-3 p-2 rounded-lg cursor-pointer transition ${
        checked ? 'bg-green-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {checked ? (
          <CheckSquare className="h-4 w-4 text-green-500" />
        ) : (
          <Square className="h-4 w-4 text-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className={`text-sm ${checked ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {item.label}
          </p>
          {getPriorityBadge(item.priority)}
        </div>
        {item.description && !checked && (
          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        <span className={`text-xs px-1.5 py-0.5 rounded flex items-center space-x-1 ${getCategoryColor(item.category)}`}>
          {getCategoryIcon(item.category)}
          <span className="capitalize">{item.category}</span>
        </span>
      </div>
    </div>
  );
}

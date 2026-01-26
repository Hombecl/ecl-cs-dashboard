'use client';

import { memo, useMemo, useCallback } from 'react';
import { CSCase } from '@/types';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { AlertCircle, Clock, CheckCircle, User, AlertTriangle, Send, Package } from 'lucide-react';

interface CaseListProps {
  cases: CSCase[];
  selectedCaseId?: string;
  onSelectCase: (caseItem: CSCase) => void;
  loading: boolean;
}

export default function CaseList({ cases, selectedCaseId, onSelectCase, loading }: CaseListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>No cases found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {cases.map((caseItem) => (
        <CaseListItem
          key={caseItem.id}
          caseItem={caseItem}
          isSelected={caseItem.id === selectedCaseId}
          onClick={() => onSelectCase(caseItem)}
        />
      ))}
    </div>
  );
}

// Helper functions outside component to avoid recreation
const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'New':
      return { icon: <div className="w-2 h-2 bg-blue-500 rounded-full" />, color: 'text-blue-600', label: 'New' };
    case 'In Progress':
      return { icon: <Clock className="w-3 h-3 text-yellow-500" />, color: 'text-yellow-600', label: 'In Progress' };
    case 'Pending Customer':
      return { icon: <AlertCircle className="w-3 h-3 text-orange-500" />, color: 'text-orange-600', label: 'Pending' };
    case 'Pending Internal':
      return { icon: <Package className="w-3 h-3 text-purple-500" />, color: 'text-purple-600', label: 'Internal' };
    case 'Replied':
      return { icon: <Send className="w-3 h-3 text-green-500" />, color: 'text-green-600', label: 'Replied' };
    case 'Resolved':
      return { icon: <CheckCircle className="w-3 h-3 text-green-500" />, color: 'text-green-600', label: 'Resolved' };
    case 'Escalated':
      return { icon: <AlertCircle className="w-3 h-3 text-red-500" />, color: 'text-red-600', label: 'Escalated' };
    default:
      return { icon: <div className="w-2 h-2 bg-gray-400 rounded-full" />, color: 'text-gray-600', label: status };
  }
};

const getSentimentColor = (sentiment: string | null) => {
  if (!sentiment) return null;
  switch (sentiment) {
    case 'Frustrated':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'Concerned':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'Polite':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const truncateMessage = (message: string, maxLength: number = 50) => {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
};

interface CaseListItemProps {
  caseItem: CSCase;
  isSelected: boolean;
  onClick: () => void;
}

const CaseListItem = memo(function CaseListItem({ caseItem, isSelected, onClick }: CaseListItemProps) {
  // Memoize computed values
  const caseAgeHours = useMemo(
    () => differenceInHours(new Date(), new Date(caseItem.createdTime)),
    [caseItem.createdTime]
  );

  const isOverdue = caseItem.status !== 'Resolved' && caseItem.status !== 'Replied' && caseAgeHours > 24;
  const isCritical = caseItem.status !== 'Resolved' && caseItem.status !== 'Replied' && caseAgeHours > 48;

  const statusDisplay = useMemo(() => getStatusDisplay(caseItem.status), [caseItem.status]);
  const sentimentColor = useMemo(() => getSentimentColor(caseItem.sentiment), [caseItem.sentiment]);
  const truncatedMessage = useMemo(
    () => truncateMessage(caseItem.originalMessage || 'No message', 80),
    [caseItem.originalMessage]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }, [onClick]);

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Case ${caseItem.platformOrderNumber || 'N/A'} - ${caseItem.customerName || 'Unknown'} - ${caseItem.status}`}
      aria-selected={isSelected}
      className={`p-3 border-b border-gray-100 cursor-pointer transition hover:bg-gray-50 ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
      } ${isCritical && !isSelected ? 'bg-red-50 !border-l-red-500' : isOverdue && !isSelected ? 'bg-orange-50 !border-l-orange-400' : ''}`}
    >
      {/* Row 1: Store Code (prominent) + Status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {caseItem.storeCode && (
            <span className="text-sm px-2 py-1 bg-purple-600 text-white rounded font-bold">
              {caseItem.storeCode}
            </span>
          )}
          <span className="font-medium text-sm text-gray-900">
            #{caseItem.platformOrderNumber?.slice(-6) || 'N/A'}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {statusDisplay.icon}
          <span className={`text-xs font-medium ${statusDisplay.color}`}>
            {statusDisplay.label}
          </span>
        </div>
      </div>

      {/* Row 2: Customer + Category */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-1.5 text-sm text-gray-700">
          <User className="w-3 h-3 text-gray-400" />
          <span className="truncate max-w-[120px]">{caseItem.customerName || 'Unknown'}</span>
        </div>
        <div className="flex items-center space-x-1">
          {caseItem.issueCategory && (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
              {caseItem.issueCategory}
            </span>
          )}
          {caseItem.sentiment && sentimentColor && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${sentimentColor}`}>
              {caseItem.sentiment === 'Frustrated' ? '😠' : caseItem.sentiment === 'Concerned' ? '😟' : caseItem.sentiment === 'Polite' ? '😊' : '😐'}
            </span>
          )}
        </div>
      </div>

      {/* Row 3: Message preview */}
      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
        {truncatedMessage}
      </p>

      {/* Row 4: Time + Warning */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          {caseItem.urgency === 'High' && (
            <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
              HIGH
            </span>
          )}
          {isCritical && (
            <span className="flex items-center space-x-0.5 text-[10px] text-red-600 font-medium">
              <AlertTriangle className="w-3 h-3" />
              <span>&gt;48h</span>
            </span>
          )}
          {isOverdue && !isCritical && (
            <span className="flex items-center space-x-0.5 text-[10px] text-orange-600">
              <Clock className="w-3 h-3" />
              <span>&gt;24h</span>
            </span>
          )}
        </div>
        <span className={`text-[10px] ${isCritical ? 'text-red-600 font-medium' : isOverdue ? 'text-orange-600' : 'text-gray-400'}`}>
          {formatDistanceToNow(new Date(caseItem.createdTime), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
});

'use client';

import { CSCase } from '@/types';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { AlertCircle, Clock, CheckCircle, User, Store, AlertTriangle } from 'lucide-react';

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

interface CaseListItemProps {
  caseItem: CSCase;
  isSelected: boolean;
  onClick: () => void;
}

function CaseListItem({ caseItem, isSelected, onClick }: CaseListItemProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'New':
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case 'In Progress':
        return <Clock className="w-3 h-3 text-yellow-500" />;
      case 'Pending Customer':
      case 'Pending Internal':
        return <AlertCircle className="w-3 h-3 text-orange-500" />;
      case 'Resolved':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'Escalated':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  const getUrgencyBadge = (urgency: string | null) => {
    if (!urgency) return null;
    const colors = {
      High: 'bg-red-100 text-red-700',
      Medium: 'bg-yellow-100 text-yellow-700',
      Low: 'bg-green-100 text-green-700',
    };
    return (
      <span className={`text-xs px-1.5 py-0.5 rounded ${colors[urgency as keyof typeof colors] || 'bg-gray-100 text-gray-700'}`}>
        {urgency}
      </span>
    );
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  // Calculate case age for warning
  const caseAgeHours = differenceInHours(new Date(), new Date(caseItem.createdTime));
  const isOverdue = caseItem.status !== 'Resolved' && caseAgeHours > 24;
  const isCritical = caseItem.status !== 'Resolved' && caseAgeHours > 48;

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-100 cursor-pointer transition hover:bg-gray-50 ${
        isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
      } ${isCritical ? 'bg-red-50 border-l-2 border-l-red-500' : isOverdue && !isSelected ? 'bg-orange-50 border-l-2 border-l-orange-400' : ''}`}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center space-x-2">
          {getStatusIcon(caseItem.status)}
          <span className="font-medium text-sm text-gray-900">
            #{caseItem.platformOrderNumber?.slice(-6) || 'N/A'}
          </span>
          {caseItem.storeCode && (
            <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">
              {caseItem.storeCode}
            </span>
          )}
        </div>
        {getUrgencyBadge(caseItem.urgency)}
      </div>

      <div className="flex items-center space-x-1 mb-1 text-sm text-gray-600">
        <User className="w-3 h-3" />
        <span>{caseItem.customerName || 'Unknown'}</span>
      </div>

      <p className="text-sm text-gray-500 mb-2">
        {truncateMessage(caseItem.originalMessage || 'No message')}
      </p>

      <div className="flex items-center justify-between">
        {caseItem.issueCategory && (
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
            {caseItem.issueCategory}
          </span>
        )}
        <div className="flex items-center space-x-1">
          {isCritical && (
            <span title="Critical: >48h">
              <AlertTriangle className="w-3 h-3 text-red-500" />
            </span>
          )}
          {isOverdue && !isCritical && (
            <span title="Overdue: >24h">
              <Clock className="w-3 h-3 text-orange-500" />
            </span>
          )}
          <span className={`text-xs ${isCritical ? 'text-red-600 font-medium' : isOverdue ? 'text-orange-600' : 'text-gray-400'}`}>
            {formatDistanceToNow(new Date(caseItem.createdTime), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}

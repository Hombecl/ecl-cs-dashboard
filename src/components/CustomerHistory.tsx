'use client';

import { useState, useEffect } from 'react';
import { CSCase } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import {
  History, User, ChevronDown, ChevronUp, AlertCircle,
  CheckCircle, Clock, Package, RefreshCw
} from 'lucide-react';

interface CustomerHistoryProps {
  customerEmail: string;
  currentCaseId: string;
}

export default function CustomerHistory({ customerEmail, currentCaseId }: CustomerHistoryProps) {
  const [previousCases, setPreviousCases] = useState<CSCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerEmail) {
      fetchCustomerHistory();
    }
  }, [customerEmail, currentCaseId]);

  const fetchCustomerHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/customer-history?email=${encodeURIComponent(customerEmail)}&excludeCaseId=${currentCaseId}`
      );
      const result = await response.json();

      if (result.success) {
        setPreviousCases(result.data);
      } else {
        setError(result.error || 'Failed to load');
      }
    } catch {
      setError('Failed to fetch customer history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'In Progress':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'Escalated':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Package className="h-3 w-3 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved':
        return 'bg-green-100 text-green-700';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'Escalated':
        return 'bg-red-100 text-red-700';
      case 'Pending Customer':
      case 'Pending Internal':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  // Summary stats
  const resolvedCases = previousCases.filter(c => c.status === 'Resolved').length;
  const escalatedCases = previousCases.filter(c => c.status === 'Escalated').length;
  const totalCases = previousCases.length;

  // Determine customer type based on history
  const getCustomerType = () => {
    if (totalCases === 0) return { label: 'First Contact', color: 'bg-blue-100 text-blue-700', icon: '🆕' };
    if (escalatedCases > 0) return { label: 'Had Escalation', color: 'bg-red-100 text-red-700', icon: '⚠️' };
    if (totalCases >= 3) return { label: 'Frequent Contact', color: 'bg-purple-100 text-purple-700', icon: '🔄' };
    return { label: 'Returning', color: 'bg-gray-100 text-gray-700', icon: '👤' };
  };

  const customerType = getCustomerType();

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <History className="h-4 w-4 text-gray-400 animate-pulse" />
        <span className="text-sm text-gray-500">Loading customer history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-red-500">{error}</span>
        <button
          onClick={fetchCustomerHistory}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Customer Type Badge + Stats */}
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded ${customerType.color}`}>
          {customerType.icon} {customerType.label}
        </span>
        {totalCases > 0 && (
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-gray-500">Total: <span className="font-medium text-gray-900">{totalCases}</span></span>
            <span className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-green-600">{resolvedCases}</span>
            </span>
            {escalatedCases > 0 && (
              <span className="flex items-center space-x-1">
                <AlertCircle className="h-3 w-3 text-red-500" />
                <span className="text-red-600">{escalatedCases}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {totalCases === 0 && (
        <p className="text-sm text-gray-500">
          No previous cases. First contact from this customer.
        </p>
      )}

      {/* Case List */}
      {totalCases > 0 && (
        <div className="space-y-2">
          {previousCases.map((prevCase) => (
            <div
              key={prevCase.id}
              className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {getStatusIcon(prevCase.status)}
                    <span className="text-sm font-medium text-gray-900">
                      #{prevCase.platformOrderNumber?.slice(-6) || 'N/A'}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(prevCase.status)}`}>
                      {prevCase.status}
                    </span>
                    {prevCase.issueCategory && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                        {prevCase.issueCategory}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-1">
                    {prevCase.originalMessage?.substring(0, 80)}...
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                  {formatDistanceToNow(new Date(prevCase.createdTime), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {escalatedCases > 0 && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">
            <strong>Caution:</strong> {escalatedCases} previous escalation(s). Handle with care.
          </p>
        </div>
      )}

      {totalCases >= 3 && !escalatedCases && (
        <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-xs text-purple-700">
            <strong>Frequent:</strong> {totalCases} contacts. Check for patterns.
          </p>
        </div>
      )}
    </div>
  );
}

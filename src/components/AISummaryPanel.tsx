'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, Lightbulb, ChevronDown, ChevronUp
} from 'lucide-react';

interface AISummary {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  canFulfillRequest: boolean;
  reason: string;
}

interface AISummaryPanelProps {
  caseId: string;
}

export default function AISummaryPanel({ caseId }: AISummaryPanelProps) {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [hasOrder, setHasOrder] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!caseId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cases/${caseId}/ai-summary`);
      const data = await response.json();

      if (data.success) {
        setSummary(data.data);
        setHasOrder(data.hasOrder || false);
      } else {
        setError(data.error || 'Failed to generate summary');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-100/50 transition"
      >
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="font-medium text-purple-900">AI Summary</span>
          {summary && !loading && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              summary.canFulfillRequest
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {summary.canFulfillRequest ? 'Can Fulfill' : 'Cannot Fulfill'}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {!hasOrder && summary && (
            <span className="text-xs text-orange-600">No order data</span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchSummary();
            }}
            disabled={loading}
            className="p-1 text-purple-500 hover:text-purple-700 hover:bg-purple-100 rounded transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-purple-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-purple-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <RefreshCw className="h-5 w-5 text-purple-500 animate-spin" />
              <span className="ml-2 text-sm text-purple-600">Analyzing case...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm py-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {summary && !loading && (
            <>
              {/* Summary */}
              <div className="bg-white/70 rounded-lg p-3">
                <p className="text-sm text-gray-800">{summary.summary}</p>
              </div>

              {/* Can Fulfill Status */}
              <div className={`flex items-start space-x-2 p-3 rounded-lg ${
                summary.canFulfillRequest
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                {summary.canFulfillRequest ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className={`text-sm font-medium ${
                    summary.canFulfillRequest ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {summary.canFulfillRequest ? 'Can fulfill request' : 'Cannot fulfill request'}
                  </p>
                  <p className={`text-xs mt-0.5 ${
                    summary.canFulfillRequest ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {summary.reason}
                  </p>
                </div>
              </div>

              {/* Key Findings */}
              {summary.keyFindings.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-purple-700 mb-1.5 flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Key Findings</span>
                  </p>
                  <ul className="space-y-1">
                    {summary.keyFindings.map((finding, idx) => (
                      <li key={idx} className="text-xs text-gray-700 flex items-start space-x-1.5">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {summary.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-purple-700 mb-1.5 flex items-center space-x-1">
                    <Lightbulb className="h-3 w-3" />
                    <span>Recommendations</span>
                  </p>
                  <ul className="space-y-1">
                    {summary.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-xs text-gray-700 flex items-start space-x-1.5">
                        <span className="text-green-500 mt-0.5">{idx + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { OrderInfo } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Package, CheckCircle,
  AlertTriangle, ExternalLink, Copy,
  RefreshCw, Loader2
} from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

interface LiveTrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: string;
  statusCode: number;
  estimatedDelivery?: string;
  lastUpdate?: string;
  origin?: string;
  destination?: string;
  daysInTransit?: number;
  events: Array<{
    timestamp: string;
    description: string;
    location?: string;
  }>;
}

interface TrackingPanelProps {
  order: OrderInfo;
}

export default function TrackingPanel({ order }: TrackingPanelProps) {
  const [liveTracking, setLiveTracking] = useState<LiveTrackingInfo | null>(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use shared copy hook for both tracking numbers
  const { copied: copiedActual, copy: copyActual } = useCopyToClipboard();
  const { copied: copiedMarketplace, copy: copyMarketplace } = useCopyToClipboard();

  // Reset live tracking state when order changes (different case selected)
  useEffect(() => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLiveTracking(null);
    setLiveError(null);
    setLoadingLive(false);
  }, [order.trackingNumber, order.platformOrderNumber]);

  const fetchLiveTracking = useCallback(async () => {
    if (!order.trackingNumber) return;

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoadingLive(true);
    setLiveError(null);

    try {
      const response = await fetch(
        `/api/tracking/${encodeURIComponent(order.trackingNumber)}`,
        { signal: abortControllerRef.current.signal }
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();

      if (data.success) {
        setLiveTracking(data.data);
      } else {
        setLiveError(data.error || 'Failed to fetch tracking info');
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setLiveError('Network error. Please try again.');
    } finally {
      setLoadingLive(false);
    }
  }, [order.trackingNumber]);

  const hasMarketplaceTracking = !!order.marketplaceTrackingNumber;
  const hasActualTracking = !!order.trackingNumber;
  const trackingMismatch = hasMarketplaceTracking && hasActualTracking &&
    order.marketplaceTrackingNumber !== order.trackingNumber;
  const noMarketplaceButHasActual = !hasMarketplaceTracking && hasActualTracking;

  const isTrackingStale = () => {
    if (!order.trackingLastUpdate) return false;
    const lastUpdate = new Date(order.trackingLastUpdate);
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 3;
  };

  if (!order.trackingNumber && !order.marketplaceTrackingNumber) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Package className="h-5 w-5" />
        <span className="text-sm">Not yet shipped</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Warnings Section - Only show critical alerts */}
      {(trackingMismatch || noMarketplaceButHasActual || isTrackingStale()) && (
        <div className="space-y-2">
          {trackingMismatch && (
            <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-orange-700">
                  Tracking numbers don&apos;t match! Customer sees different number.
                </p>
              </div>
            </div>
          )}
          {noMarketplaceButHasActual && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-700">
                  Tracking not uploaded to marketplace yet.
                </p>
              </div>
            </div>
          )}
          {isTrackingStale() && !liveTracking && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-700">
                  No tracking update for 3+ days.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tracking Numbers */}
      <div className="space-y-2">
        {/* Marketplace Tracking (What Customer Sees) */}
        <div className={`p-2 rounded-lg ${hasMarketplaceTracking ? 'bg-purple-50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 flex items-center space-x-1">
                <span>Marketplace</span>
                <span className="text-xs px-1 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px]">Customer sees</span>
              </p>
              {hasMarketplaceTracking ? (
                <p className="text-sm font-mono text-gray-900 truncate">{order.marketplaceTrackingNumber}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">Not uploaded</p>
              )}
            </div>
            {hasMarketplaceTracking && (
              <button
                onClick={() => copyMarketplace(order.marketplaceTrackingNumber!)}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-purple-100 rounded transition flex-shrink-0"
                title="Copy"
              >
                {copiedMarketplace ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Actual Tracking (For 17Track) */}
        <div className={`p-2 rounded-lg ${hasActualTracking ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 flex items-center space-x-1">
                <span>Actual Tracking</span>
                <span className="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">17Track</span>
              </p>
              {hasActualTracking ? (
                <p className="text-sm font-mono text-gray-900 truncate">{order.trackingNumber}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">Not available</p>
              )}
            </div>
            {hasActualTracking && (
              <div className="flex items-center space-x-1 flex-shrink-0">
                <button
                  onClick={() => copyActual(order.trackingNumber!)}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-blue-100 rounded transition"
                  title="Copy"
                >
                  {copiedActual ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <a
                  href={`https://t.17track.net/en#nums=${order.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-blue-100 rounded transition"
                  title="Open 17Track"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Tracking Button */}
      {hasActualTracking && (
        <div>
          <button
            onClick={fetchLiveTracking}
            disabled={loadingLive}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
          >
            {loadingLive ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Fetching...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>{liveTracking ? 'Refresh' : 'Fetch Live Status'}</span>
              </>
            )}
          </button>
          {liveError && (
            <p className="mt-1 text-xs text-red-600 text-center">{liveError}</p>
          )}
        </div>
      )}

      {/* Live Tracking Results - Simplified */}
      {liveTracking && (
        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          {/* Status Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className={`text-sm font-medium ${
                liveTracking.status.toLowerCase().includes('delivered') ? 'text-green-700' :
                liveTracking.status.toLowerCase().includes('transit') ? 'text-blue-700' :
                'text-gray-900'
              }`}>
                {liveTracking.status}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {liveTracking.carrier}
            </span>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center space-x-3 text-xs text-gray-600 mb-2">
            {liveTracking.daysInTransit !== undefined && (
              <span>{liveTracking.daysInTransit} days in transit</span>
            )}
            {liveTracking.lastUpdate && (
              <span>Updated {formatDistanceToNow(new Date(liveTracking.lastUpdate), { addSuffix: true })}</span>
            )}
          </div>

          {/* Events Timeline */}
          {liveTracking.events.length > 0 && (
            <div className="mt-2 pt-2 border-t border-green-200">
              <p className="text-xs font-medium text-gray-700 mb-1.5">
                Tracking History ({liveTracking.events.length})
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {liveTracking.events.map((event, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <div className={`flex-shrink-0 w-1.5 h-1.5 mt-1.5 rounded-full ${idx === 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900 leading-tight">{event.description}</p>
                      <p className="text-[10px] text-gray-500">
                        {event.location && `${event.location} • `}
                        {event.timestamp && format(new Date(event.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {liveTracking.events.length === 0 && (
            <p className="text-xs text-gray-500 italic mt-2">No events available</p>
          )}
        </div>
      )}

      {/* Delivery Dates - Compact */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-gray-50 rounded">
          <p className="text-gray-500">Expected</p>
          <p className="text-gray-900 font-medium">
            {order.expectedDelivery
              ? format(new Date(order.expectedDelivery), 'MMM d')
              : 'N/A'}
          </p>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <p className="text-gray-500">Delivered</p>
          <p className={`font-medium ${order.actualDelivery ? 'text-green-600' : 'text-gray-500'}`}>
            {order.actualDelivery
              ? format(new Date(order.actualDelivery), 'MMM d')
              : 'Pending'}
          </p>
        </div>
      </div>
    </div>
  );
}

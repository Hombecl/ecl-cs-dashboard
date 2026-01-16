'use client';

import { useState } from 'react';
import { OrderInfo } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Truck, Package, MapPin, Clock, CheckCircle,
  AlertTriangle, ChevronDown, ChevronUp, ExternalLink, Copy
} from 'lucide-react';

interface TrackingPanelProps {
  order: OrderInfo;
}

export default function TrackingPanel({ order }: TrackingPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [copiedActual, setCopiedActual] = useState(false);
  const [copiedMarketplace, setCopiedMarketplace] = useState(false);

  const copyActualTracking = () => {
    if (order.trackingNumber) {
      navigator.clipboard.writeText(order.trackingNumber);
      setCopiedActual(true);
      setTimeout(() => setCopiedActual(false), 2000);
    }
  };

  const copyMarketplaceTracking = () => {
    if (order.marketplaceTrackingNumber) {
      navigator.clipboard.writeText(order.marketplaceTrackingNumber);
      setCopiedMarketplace(true);
      setTimeout(() => setCopiedMarketplace(false), 2000);
    }
  };

  // Check for tracking discrepancies
  const hasMarketplaceTracking = !!order.marketplaceTrackingNumber;
  const hasActualTracking = !!order.trackingNumber;
  const trackingMismatch = hasMarketplaceTracking && hasActualTracking &&
    order.marketplaceTrackingNumber !== order.trackingNumber;
  const noMarketplaceButHasActual = !hasMarketplaceTracking && hasActualTracking;

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-600';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('delivered')) return 'bg-green-100 text-green-700';
    if (statusLower.includes('transit') || statusLower.includes('shipped')) return 'bg-blue-100 text-blue-700';
    if (statusLower.includes('exception') || statusLower.includes('failed')) return 'bg-red-100 text-red-700';
    if (statusLower.includes('pending') || statusLower.includes('created')) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
  };

  const getStatusIcon = (status: string | null) => {
    if (!status) return <Package className="h-5 w-5" />;
    const statusLower = status.toLowerCase();
    if (statusLower.includes('delivered')) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (statusLower.includes('transit')) return <Truck className="h-5 w-5 text-blue-500" />;
    if (statusLower.includes('exception') || statusLower.includes('failed')) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    return <Package className="h-5 w-5 text-gray-500" />;
  };

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
    <div className="space-y-4">

      {/* Tracking Discrepancy Alert */}
      {noMarketplaceButHasActual && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Tracking Not Uploaded to Marketplace</p>
              <p className="text-xs text-yellow-700">
                Customer cannot see tracking on Walmart yet. They may inquire about shipment status.
              </p>
            </div>
          </div>
        </div>
      )}

      {trackingMismatch && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800">Tracking Numbers Differ</p>
              <p className="text-xs text-orange-700">
                Marketplace and actual tracking numbers are different. Customer may see different status.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Both Tracking Numbers */}
      <div className="space-y-3 mb-4">
        {/* Marketplace Tracking (What Customer Sees) */}
        <div className={`p-2 rounded-lg ${hasMarketplaceTracking ? 'bg-purple-50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-gray-500 flex items-center space-x-1">
                <span>Marketplace Tracking</span>
                <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">Customer sees</span>
              </p>
              {hasMarketplaceTracking ? (
                <p className="text-sm font-mono text-gray-900">{order.marketplaceTrackingNumber}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">Not uploaded</p>
              )}
            </div>
            {hasMarketplaceTracking && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={copyMarketplaceTracking}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-purple-100 rounded transition"
                  title="Copy marketplace tracking"
                >
                  {copiedMarketplace ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actual Tracking (For 17Track) */}
        <div className={`p-2 rounded-lg ${hasActualTracking ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-gray-500 flex items-center space-x-1">
                <span>Actual Tracking #</span>
                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">17Track Status</span>
              </p>
              {hasActualTracking ? (
                <p className="text-sm font-mono text-gray-900">{order.trackingNumber}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">Not available</p>
              )}
            </div>
            {hasActualTracking && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={copyActualTracking}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-blue-100 rounded transition"
                  title="Copy actual tracking"
                >
                  {copiedActual ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
                <a
                  href={`https://t.17track.net/en#nums=${order.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-blue-100 rounded transition"
                  title="Track on 17Track"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="flex items-center space-x-3 mb-4">
        {getStatusIcon(order.trackingStatus)}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium px-2 py-0.5 rounded ${getStatusColor(order.trackingStatus)}`}>
              {order.trackingStatus || 'Unknown'}
            </span>
            {isTrackingStale() && (
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3" />
                <span>No update for 3+ days</span>
              </span>
            )}
          </div>
          {order.trackingLastUpdate && (
            <p className="text-xs text-gray-500 mt-1">
              Last update: {formatDistanceToNow(new Date(order.trackingLastUpdate), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>

      {/* Detail Status */}
      {order.trackingDetailStatus && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">{order.trackingDetailStatus}</p>
        </div>
      )}

      {/* Delivery Dates */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-start space-x-2">
          <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Expected Delivery</p>
            <p className="text-sm text-gray-900">
              {order.expectedDelivery
                ? format(new Date(order.expectedDelivery), 'MMM d, yyyy')
                : 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <CheckCircle className="h-4 w-4 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Actual Delivery</p>
            <p className="text-sm text-gray-900">
              {order.actualDelivery
                ? format(new Date(order.actualDelivery), 'MMM d, yyyy')
                : 'Not yet delivered'}
            </p>
          </div>
        </div>
      </div>

      {/* Carrier Info */}
      {order.trackingCarrier && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Carrier:</span>
          <span className="font-medium">{order.trackingCarrier}</span>
        </div>
      )}

      {/* Expanded Details Section */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {/* 17Track Detailed Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <span>17Track Details</span>
            </h4>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Main Status */}
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <p className={`font-medium ${getStatusColor(order.trackingStatus)?.replace('bg-', 'text-').replace('-100', '-700')}`}>
                  {order.trackingStatus || 'Unknown'}
                </p>
              </div>

              {/* Detail Status */}
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Detail Status</p>
                <p className="font-medium text-gray-900">
                  {order.trackingDetailStatus || 'No details'}
                </p>
              </div>

              {/* Carrier */}
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Carrier</p>
                <p className="font-medium text-gray-900">
                  {order.trackingCarrier || 'Unknown'}
                </p>
              </div>

              {/* Days Since Update */}
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Days Since Update</p>
                <p className={`font-medium ${order.daysSinceLastUpdate && order.daysSinceLastUpdate > 3 ? 'text-red-600' : 'text-gray-900'}`}>
                  {order.daysSinceLastUpdate !== null ? `${order.daysSinceLastUpdate} days` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Latest Event Time */}
            {order.trackingLastUpdate && (
              <div className="mt-3 p-3 bg-white rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Latest Event Time</p>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900">
                    {format(new Date(order.trackingLastUpdate), 'MMMM d, yyyy h:mm a')}
                  </p>
                  <span className="text-xs text-gray-500">
                    ({formatDistanceToNow(new Date(order.trackingLastUpdate), { addSuffix: true })})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Shipping Timeline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Shipping Timeline</h4>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200" />

              <div className="space-y-4">
                {/* Order Date */}
                <div className="flex items-start space-x-3 relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${order.shipDate ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <div className={`w-2 h-2 rounded-full ${order.shipDate ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order Placed</p>
                    <p className="text-xs text-gray-500">{order.orderDate || 'N/A'}</p>
                  </div>
                </div>

                {/* Ship Date */}
                <div className="flex items-start space-x-3 relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${order.shipDate ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <div className={`w-2 h-2 rounded-full ${order.shipDate ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Shipped</p>
                    <p className="text-xs text-gray-500">{order.shipDate || 'Pending'}</p>
                  </div>
                </div>

                {/* Expected Delivery */}
                <div className="flex items-start space-x-3 relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${order.actualDelivery ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    <div className={`w-2 h-2 rounded-full ${order.actualDelivery ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Expected Delivery</p>
                    <p className="text-xs text-gray-500">
                      {order.expectedDelivery
                        ? format(new Date(order.expectedDelivery), 'MMM d, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Actual Delivery */}
                <div className="flex items-start space-x-3 relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${order.actualDelivery ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {order.actualDelivery ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {order.actualDelivery ? 'Delivered' : 'Delivery'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.actualDelivery
                        ? format(new Date(order.actualDelivery), 'MMM d, yyyy')
                        : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Events if available */}
          {order.trackingEvents && order.trackingEvents.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Tracking History</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {order.trackingEvents.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className="text-sm text-gray-900">{event.status}</p>
                      <p className="text-xs text-gray-500">
                        {event.location && `${event.location} • `}
                        {format(new Date(event.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick 17Track Link */}
          {order.trackingNumber && (
            <div className="flex justify-center">
              <a
                href={`https://t.17track.net/en#nums=${order.trackingNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View Full Details on 17Track</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Alerts */}
      {isTrackingStale() && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Tracking Alert</p>
              <p className="text-xs text-red-700">
                No tracking update for more than 3 days. Consider proactively contacting the customer.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

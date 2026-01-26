'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { CSCase, OrderInfo } from '@/types';
import {
  Package, Truck, Factory, History, User,
  ChevronRight, ChevronLeft, GripVertical,
  Search, AlertCircle, ExternalLink, Loader2
} from 'lucide-react';
import TrackingPanel from './TrackingPanel';
import CustomerHistory from './CustomerHistory';
import AISummaryPanel from './AISummaryPanel';

interface InfoPanelProps {
  caseData: CSCase;
  isOpen: boolean;
  onToggle: () => void;
}

type TabType = 'order' | 'tracking' | 'processing' | 'history' | 'customer';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'order', label: 'Order', icon: <Package className="h-4 w-4" /> },
  { id: 'tracking', label: 'Tracking', icon: <Truck className="h-4 w-4" /> },
  { id: 'processing', label: 'Processing', icon: <Factory className="h-4 w-4" /> },
  { id: 'history', label: 'History', icon: <History className="h-4 w-4" /> },
  { id: 'customer', label: 'Customer', icon: <User className="h-4 w-4" /> },
];

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 320;

export default function InfoPanel({ caseData, isOpen, onToggle }: InfoPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('order');
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      // Calculate new width based on mouse position from right edge
      const newWidth = window.innerWidth - e.clientX;
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

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

  // Collapsed state - just show toggle button
  if (!isOpen) {
    return (
      <div className="w-10 bg-white border-l border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={onToggle}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          title="Show Info Panel"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="mt-4 space-y-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                onToggle();
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              title={tab.label}
            >
              {tab.icon}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      style={{ width: `${width}px` }}
      className="bg-white border-l border-gray-200 flex flex-col overflow-hidden relative"
    >
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 transition-colors z-10 group flex items-center ${
          isResizing ? 'bg-blue-500' : 'bg-transparent'
        }`}
      >
        <div className="absolute left-0 w-4 h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <span className="text-sm font-medium text-gray-700">Info Panel</span>
        <button
          onClick={onToggle}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* AI Summary */}
        <div className="p-3 border-b border-gray-200">
          <AISummaryPanel caseId={caseData.id} />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-1 text-xs font-medium transition flex flex-col items-center space-y-1 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'order' && <OrderTab order={caseData.order} customerName={caseData.customerName ?? undefined} storeCode={caseData.storeCode ?? undefined} />}
          {activeTab === 'tracking' && caseData.order && <TrackingPanel order={caseData.order} />}
          {activeTab === 'processing' && <ProcessingTab order={caseData.order} cancelStatus={cancelStatus} />}
          {activeTab === 'history' && caseData.customerEmail && (
            <CustomerHistory
              customerEmail={caseData.customerEmail}
              currentCaseId={caseData.id}
            />
          )}
          {activeTab === 'customer' && <CustomerTab caseData={caseData} />}
        </div>
      </div>
    </div>
  );
}

// Potential Orders Search Component
function PotentialOrdersSearch({ customerName, storeCode }: { customerName: string; storeCode?: string }) {
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Parse customer name into first and last name
  const parseCustomerName = (name: string): { firstName: string; lastName: string } | null => {
    const trimmed = name.trim();
    const parts = trimmed.split(/\s+/);

    if (parts.length < 2) return null;

    // Assume first part is first name, rest is last name
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    return { firstName, lastName };
  };

  const searchOrders = async () => {
    const parsed = parseCustomerName(customerName);
    if (!parsed) {
      setError('Unable to parse customer name');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const params = new URLSearchParams({
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        daysBack: '60',
      });

      if (storeCode) {
        params.append('storeCode', storeCode);
      }

      const response = await fetch(`/api/orders/search-by-name?${params}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
      } else {
        setError(data.error || 'Failed to search orders');
      }
    } catch (err) {
      console.error('Error searching orders:', err);
      setError('Failed to search orders');
    } finally {
      setLoading(false);
    }
  };

  const parsed = parseCustomerName(customerName);

  return (
    <div className="space-y-3">
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">No order linked to this case</p>
            <p className="text-xs mt-1">
              Customer: <span className="font-medium">{customerName}</span>
            </p>
          </div>
        </div>
      </div>

      {parsed && (
        <button
          onClick={searchOrders}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              <span>Find Potential Orders</span>
            </>
          )}
        </button>
      )}

      {!parsed && (
        <p className="text-xs text-gray-500">
          Cannot search: need both first and last name
        </p>
      )}

      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {searched && !loading && !error && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">
            {orders.length > 0
              ? `Found ${orders.length} potential order${orders.length > 1 ? 's' : ''}:`
              : 'No matching orders found in the last 60 days'
            }
          </p>

          {orders.map((order) => (
            <div
              key={order.airtableRecordId}
              className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">Order #</p>
                  <p className="text-sm font-mono font-medium text-gray-900">
                    {order.platformOrderNumber || order.orderId || 'N/A'}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                  {order.storeCode}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-500">Item</p>
                <p className="text-sm text-gray-900 line-clamp-2">{order.itemName}</p>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500">Date: </span>
                  <span className="text-gray-700">{order.orderDate}</span>
                </div>
                <div>
                  <span className="text-gray-500">Amount: </span>
                  <span className="font-medium text-gray-900">${order.salesAmount.toFixed(2)}</span>
                </div>
              </div>

              {order.trackingNumber && (
                <div className="text-xs">
                  <span className="text-gray-500">Tracking: </span>
                  <span className="font-mono text-gray-700">{order.trackingNumber}</span>
                </div>
              )}

              <div className="flex space-x-2 pt-1">
                <a
                  href={`https://airtable.com/appRCQASsApV4C33N/tbl0v0DK9s0Ke6ty1/${order.airtableRecordId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs px-2 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded transition"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>View in Airtable</span>
                </a>
                {order.platformOrderNumber && (
                  <a
                    href={`https://seller.walmart.com/orders/manage-orders?orderGroups=All&poNumber=${encodeURIComponent(order.platformOrderNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-xs px-2 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded transition"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Seller Center</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Order Details Tab
function OrderTab({ order, customerName, storeCode }: { order: CSCase['order']; customerName?: string; storeCode?: string }) {
  if (!order) {
    // Show potential orders search when no order is linked
    if (customerName) {
      return <PotentialOrdersSearch customerName={customerName} storeCode={storeCode} />;
    }
    return <p className="text-sm text-gray-500">No order information available</p>;
  }

  return (
    <div className="space-y-4">
      {/* Item Info */}
      <div>
        <p className="text-xs text-gray-500 mb-1">Item</p>
        <p className="text-sm text-gray-900">{order.itemName}</p>
        <p className="text-xs text-gray-500 font-mono mt-1">SKU: {order.sku}</p>
      </div>

      {/* Qty & Amount */}
      <div className="flex space-x-4">
        <div>
          <p className="text-xs text-gray-500">Qty</p>
          <p className="text-sm font-medium text-gray-900">{order.quantity}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Amount</p>
          <p className="text-sm font-medium text-gray-900">${order.salesAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Dates */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <div>
          <p className="text-xs text-gray-500">Order Date</p>
          <p className="text-sm text-gray-900">{order.orderDate}</p>
        </div>
        {order.shipDate && (
          <div>
            <p className="text-xs text-gray-500">Ship Date</p>
            <p className="text-sm text-gray-900">{order.shipDate}</p>
          </div>
        )}
        {order.actualDelivery && (
          <div>
            <p className="text-xs text-gray-500">Delivered</p>
            <p className="text-sm text-green-600 font-medium">{order.actualDelivery}</p>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <p className="text-xs text-gray-500 font-medium">Quick Links</p>
        <div className="flex flex-wrap gap-2">
          {order.platformOrderNumber && (
            <a
              href={`https://seller.walmart.com/orders/manage-orders?orderGroups=All&poNumber=${encodeURIComponent(order.platformOrderNumber)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded transition"
            >
              Seller Center
            </a>
          )}
          {order.walmartProductId && (
            <a
              href={`https://www.walmart.com/ip/${order.walmartProductId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition"
            >
              Product Page
            </a>
          )}
          {order.supplierLink && (
            <a
              href={order.supplierLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-1 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded transition"
            >
              Supplier
            </a>
          )}
          <a
            href={`https://airtable.com/appRCQASsApV4C33N/tbl0v0DK9s0Ke6ty1/${order.airtableRecordId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded transition"
          >
            Airtable
          </a>
        </div>
      </div>
    </div>
  );
}

// Processing Status Tab
function ProcessingTab({
  order,
  cancelStatus
}: {
  order: CSCase['order'];
  cancelStatus: { text: string; color: string } | null;
}) {
  if (!order) {
    return <p className="text-sm text-gray-500">No order information available</p>;
  }

  return (
    <div className="space-y-4">
      {/* Cancel Status Badge */}
      {cancelStatus && (
        <div className={`p-2 rounded-lg text-center ${cancelStatus.color}`}>
          <p className="text-sm font-medium">{cancelStatus.text}</p>
        </div>
      )}

      {/* Status Pipeline */}
      <div className="space-y-3">
        {/* Walmart Status */}
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            order.platformOrderStatus ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <Package className={`h-4 w-4 ${order.platformOrderStatus ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Walmart Status</p>
            <p className="text-sm font-medium text-gray-900">{order.platformOrderStatus || 'Unknown'}</p>
          </div>
        </div>

        {/* Supplier Order */}
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            order.supplierOrderNumber ? 'bg-orange-100' : 'bg-gray-100'
          }`}>
            <Factory className={`h-4 w-4 ${order.supplierOrderNumber ? 'text-orange-600' : 'text-gray-400'}`} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Supplier Order</p>
            <p className="text-sm font-medium text-gray-900">
              {order.supplierOrderNumber ? `#${order.supplierOrderNumber}` : 'Not placed'}
            </p>
          </div>
        </div>

        {/* Shipment */}
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            order.shipmentDropped ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            <Truck className={`h-4 w-4 ${order.shipmentDropped ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Shipment</p>
            <p className="text-sm font-medium text-gray-900">
              {order.shipmentDropped ? 'Dropped off' : order.shipperFulfillmentStatus || 'Not shipped'}
            </p>
          </div>
        </div>
      </div>

      {/* Cancel Notes */}
      {order.supplierOrderNumber && !order.shipmentDropped && (
        <div className="p-2 bg-orange-50 rounded-lg">
          <p className="text-xs text-orange-700">
            Contact supplier to cancel order #{order.supplierOrderNumber}
          </p>
        </div>
      )}

      {order.shipmentDropped && (
        <div className="p-2 bg-red-50 rounded-lg">
          <p className="text-xs text-red-700">
            Cannot cancel - package has been shipped
          </p>
        </div>
      )}
    </div>
  );
}

// Customer Info Tab
function CustomerTab({ caseData }: { caseData: CSCase }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-gray-500">Name</p>
        <p className="text-sm font-medium text-gray-900">{caseData.customerName || 'N/A'}</p>
      </div>

      <div>
        <p className="text-xs text-gray-500">Email</p>
        <p className="text-sm text-gray-900">{caseData.customerEmail || 'N/A'}</p>
      </div>

      {caseData.order?.recipientPhone && (
        <div>
          <p className="text-xs text-gray-500">Phone</p>
          <p className="text-sm text-gray-900">{caseData.order.recipientPhone}</p>
        </div>
      )}

      {caseData.order?.recipientAddress && (
        <div>
          <p className="text-xs text-gray-500">Address</p>
          <p className="text-sm text-gray-900">{caseData.order.recipientAddress}</p>
        </div>
      )}

      {caseData.storeCode && (
        <div>
          <p className="text-xs text-gray-500">Store</p>
          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
            {caseData.storeCode}
          </span>
        </div>
      )}
    </div>
  );
}

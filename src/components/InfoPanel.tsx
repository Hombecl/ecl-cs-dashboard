'use client';

import { useState } from 'react';
import { CSCase } from '@/types';
import {
  Package, Truck, Factory, History, User,
  ChevronRight, ChevronLeft, X
} from 'lucide-react';
import TrackingPanel from './TrackingPanel';
import CustomerHistory from './CustomerHistory';

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

export default function InfoPanel({ caseData, isOpen, onToggle }: InfoPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('order');

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
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Info Panel</span>
        <button
          onClick={onToggle}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'order' && <OrderTab order={caseData.order} />}
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
  );
}

// Order Details Tab
function OrderTab({ order }: { order: CSCase['order'] }) {
  if (!order) {
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
          {order.walmartProductId && (
            <a
              href={`https://www.walmart.com/ip/${order.walmartProductId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition"
            >
              Walmart
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

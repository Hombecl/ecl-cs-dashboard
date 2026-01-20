'use client';

import { useState, useEffect } from 'react';
import { CSCase, OrderInfo } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import {
  X, User, Phone, MapPin, Mail, Package, ShoppingCart,
  Truck, Calendar, DollarSign, Copy, Check, ExternalLink,
  AlertCircle, RefreshCw, Clock, ChevronDown, ChevronUp
} from 'lucide-react';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: CSCase;
}

export default function CustomerProfileModal({ isOpen, onClose, caseData }: CustomerProfileModalProps) {
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && caseData.customerEmail) {
      fetchCustomerOrders();
    }
  }, [isOpen, caseData.customerEmail]);

  const fetchCustomerOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/customer-orders?email=${encodeURIComponent(caseData.customerEmail)}`
      );
      const result = await response.json();

      if (result.success) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'phone' | 'email' | 'address') => {
    navigator.clipboard.writeText(text);
    if (type === 'phone') {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } else if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('delivered')) return 'bg-green-100 text-green-700';
    if (statusLower.includes('transit') || statusLower.includes('shipped')) return 'bg-blue-100 text-blue-700';
    if (statusLower.includes('pending') || statusLower.includes('ordered')) return 'bg-yellow-100 text-yellow-700';
    if (statusLower.includes('cancel') || statusLower.includes('return')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Calculate customer stats
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.salesAmount || 0), 0);
  const deliveredOrders = orders.filter(o => o.trackingStatus?.toLowerCase().includes('delivered')).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {caseData.customerName || 'Customer'}
              </h2>
              <p className="text-sm text-gray-500">Customer Profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 space-y-6">
          {/* Contact Info - Quick Access */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Quick Contact</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Phone */}
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    {caseData.order?.recipientPhone ? (
                      <p className="text-sm font-medium text-gray-900">
                        {caseData.order.recipientPhone}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Not available</p>
                    )}
                  </div>
                  {caseData.order?.recipientPhone && (
                    <button
                      onClick={() => copyToClipboard(caseData.order!.recipientPhone!, 'phone')}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition"
                    >
                      {copiedPhone ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {caseData.customerEmail || 'N/A'}
                    </p>
                  </div>
                  {caseData.customerEmail && (
                    <button
                      onClick={() => copyToClipboard(caseData.customerEmail, 'email')}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition flex-shrink-0"
                    >
                      {copiedEmail ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Address</p>
                    {caseData.order?.recipientAddress ? (
                      <p className="text-sm font-medium text-gray-900 truncate" title={caseData.order.recipientAddress}>
                        {caseData.order.recipientAddress}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Not available</p>
                    )}
                  </div>
                  {caseData.order?.recipientAddress && (
                    <button
                      onClick={() => copyToClipboard(caseData.order!.recipientAddress, 'address')}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition flex-shrink-0"
                    >
                      {copiedAddress ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Full Address Display */}
            {caseData.order?.recipientAddress && (
              <div className="mt-3 p-3 bg-white rounded-lg">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{caseData.order.recipientAddress}</p>
                </div>
              </div>
            )}
          </div>

          {/* Customer Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : totalOrders}</p>
              <p className="text-xs text-gray-500">Total Orders</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '-' : `$${totalSpent.toFixed(2)}`}
              </p>
              <p className="text-xs text-gray-500">Total Spent</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Package className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : deliveredOrders}</p>
              <p className="text-xs text-gray-500">Delivered</p>
            </div>
          </div>

          {/* Order History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                <Package className="h-4 w-4 text-gray-400" />
                <span>Order History</span>
              </h3>
              <button
                onClick={fetchCustomerOrders}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No orders found for this customer</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const isCurrentOrder = order.platformOrderNumber === caseData.platformOrderNumber;
                  const isExpanded = expandedOrderId === order.airtableRecordId;

                  return (
                    <div
                      key={order.airtableRecordId}
                      className={`bg-white rounded-lg border ${isCurrentOrder ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'} overflow-hidden`}
                    >
                      {/* Order Summary Row */}
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.airtableRecordId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCurrentOrder ? 'bg-blue-100' : 'bg-gray-100'}`}>
                              <Package className={`h-4 w-4 ${isCurrentOrder ? 'text-blue-600' : 'text-gray-400'}`} />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">
                                  #{order.platformOrderNumber?.slice(-6) || order.orderId?.slice(-6) || 'N/A'}
                                </span>
                                {isCurrentOrder && (
                                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                    Current Case
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 truncate max-w-xs">
                                {order.itemName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-medium text-gray-900">${order.salesAmount?.toFixed(2) || '0.00'}</p>
                              <p className="text-xs text-gray-500">{order.orderDate}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status || '')}`}>
                              {order.trackingStatus || order.status || 'Unknown'}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">SKU</p>
                              <p className="font-mono text-gray-900">{order.sku}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Quantity</p>
                              <p className="text-gray-900">{order.quantity}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Ship Date</p>
                              <p className="text-gray-900">{order.shipDate || 'Not shipped'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Delivery</p>
                              <p className="text-gray-900">
                                {order.actualDelivery || order.expectedDelivery || 'Unknown'}
                              </p>
                            </div>
                          </div>

                          {/* Tracking Info */}
                          {(order.trackingNumber || order.marketplaceTrackingNumber) && (
                            <div className="pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">Tracking</p>
                              <div className="space-y-1.5">
                                {order.trackingNumber && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-400 w-14">Actual:</span>
                                    <code className="text-sm bg-white px-2 py-1 rounded border border-gray-200">
                                      {order.trackingNumber}
                                    </code>
                                    <a
                                      href={`https://t.17track.net/en#nums=${order.trackingNumber}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 text-blue-600 hover:text-blue-800"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </div>
                                )}
                                {order.marketplaceTrackingNumber && order.marketplaceTrackingNumber !== order.trackingNumber && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-400 w-14">Walmart:</span>
                                    <code className="text-sm bg-white px-2 py-1 rounded border border-gray-200">
                                      {order.marketplaceTrackingNumber}
                                    </code>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Address for this order */}
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Shipping Address</p>
                            <p className="text-sm text-gray-700">{order.recipientAddress}</p>
                          </div>

                          {/* Link to Airtable */}
                          <div className="pt-2">
                            <a
                              href={`https://airtable.com/appRCQASsApV4C33N/tbl0v0DK9s0Ke6ty1/${order.airtableRecordId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>View in Airtable</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { ExternalLink, Copy, CheckCircle, ShoppingCart, Package, Store } from 'lucide-react';

interface WalmartLinksProps {
  platformOrderNumber?: string | null;
  walmartProductId?: string | null;
  storeCode?: string | null;
  variant?: 'full' | 'compact' | 'icons-only';
}

// Walmart Seller Center base URLs
const SELLER_CENTER_BASE = 'https://seller.walmart.com';

export default function WalmartLinks({
  platformOrderNumber,
  walmartProductId,
  storeCode,
  variant = 'full'
}: WalmartLinksProps) {
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [copiedProduct, setCopiedProduct] = useState(false);

  const copyOrderNumber = () => {
    if (platformOrderNumber) {
      navigator.clipboard.writeText(platformOrderNumber);
      setCopiedOrder(true);
      setTimeout(() => setCopiedOrder(false), 2000);
    }
  };

  const copyProductId = () => {
    if (walmartProductId) {
      navigator.clipboard.writeText(walmartProductId);
      setCopiedProduct(true);
      setTimeout(() => setCopiedProduct(false), 2000);
    }
  };

  // Build Walmart Seller Center order URL
  // Note: The actual URL structure may vary - this is a common pattern
  const getOrderUrl = () => {
    if (!platformOrderNumber) return null;
    // Walmart Seller Center order details URL
    return `${SELLER_CENTER_BASE}/order-management/details?orderNumber=${encodeURIComponent(platformOrderNumber)}`;
  };

  // Build Walmart product page URL
  const getProductUrl = () => {
    if (!walmartProductId) return null;
    return `https://www.walmart.com/ip/${walmartProductId}`;
  };

  // Build Walmart Seller Center search URL for order
  const getOrderSearchUrl = () => {
    if (!platformOrderNumber) return null;
    return `${SELLER_CENTER_BASE}/order-management?query=${encodeURIComponent(platformOrderNumber)}`;
  };

  if (!platformOrderNumber && !walmartProductId) {
    return null;
  }

  // Icons only variant - just show small icon buttons
  if (variant === 'icons-only') {
    return (
      <div className="flex items-center space-x-1">
        {platformOrderNumber && (
          <>
            <button
              onClick={copyOrderNumber}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition"
              title={copiedOrder ? 'Copied!' : `Copy order #${platformOrderNumber}`}
            >
              {copiedOrder ? (
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <a
              href={getOrderSearchUrl()!}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition"
              title="Open in Walmart Seller Center"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </>
        )}
        {walmartProductId && (
          <a
            href={getProductUrl()!}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded transition"
            title="View product on Walmart.com"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    );
  }

  // Compact variant - single row of buttons
  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {platformOrderNumber && (
          <div className="flex items-center space-x-1 bg-blue-50 rounded-lg px-2 py-1">
            <span className="text-xs text-blue-700 font-mono">{platformOrderNumber}</span>
            <button
              onClick={copyOrderNumber}
              className="p-0.5 text-blue-500 hover:text-blue-700 rounded transition"
              title={copiedOrder ? 'Copied!' : 'Copy order number'}
            >
              {copiedOrder ? (
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <a
              href={getOrderSearchUrl()!}
              target="_blank"
              rel="noopener noreferrer"
              className="p-0.5 text-blue-500 hover:text-blue-700 rounded transition"
              title="Open in Seller Center"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
        {walmartProductId && (
          <a
            href={getProductUrl()!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-xs px-2 py-1 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Product</span>
          </a>
        )}
      </div>
    );
  }

  // Full variant - detailed display
  return (
    <div className="space-y-3">
      {/* Order Number */}
      {platformOrderNumber && (
        <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-blue-600">Walmart Order</p>
              <p className="text-sm font-mono font-medium text-blue-800">{platformOrderNumber}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={copyOrderNumber}
              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded transition"
              title={copiedOrder ? 'Copied!' : 'Copy order number'}
            >
              {copiedOrder ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <a
              href={getOrderSearchUrl()!}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded transition"
              title="Open in Walmart Seller Center"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      {/* Product Link */}
      {walmartProductId && (
        <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-xs text-orange-600">Product Page</p>
              <p className="text-sm font-mono text-orange-800">{walmartProductId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={copyProductId}
              className="p-1.5 text-orange-500 hover:text-orange-700 hover:bg-orange-100 rounded transition"
              title={copiedProduct ? 'Copied!' : 'Copy product ID'}
            >
              {copiedProduct ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <a
              href={getProductUrl()!}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-orange-500 hover:text-orange-700 hover:bg-orange-100 rounded transition"
              title="View on Walmart.com"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      {/* Store Badge */}
      {storeCode && (
        <div className="flex items-center space-x-2 text-sm">
          <Store className="h-4 w-4 text-purple-500" />
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">
            {storeCode}
          </span>
        </div>
      )}
    </div>
  );
}

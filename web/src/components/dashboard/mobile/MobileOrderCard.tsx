"use client";

import { useState } from 'react';
import { useSwipeActions } from '@/hooks/useSwipeActions';

interface Order {
  id: number;
  email: string;
  status: string;
  amount_cents: number;
  created_at: string;
  tracking_number?: string;
  product?: {
    name: string;
    main_image_url?: string;
  };
}

interface MobileOrderCardProps {
  order: Order;
  onView?: (order: Order) => void;
  onFulfill?: (order: Order) => void;
  onCancel?: (order: Order) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  processing: 'bg-blue-500/20 text-blue-400',
  shipped: 'bg-purple-500/20 text-purple-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

export function MobileOrderCard({ order, onView, onFulfill, onCancel }: MobileOrderCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const [swipeState, handlers] = useSwipeActions({
    onSwipeLeft: () => setShowActions(true),
    onSwipeRight: () => {
      setShowActions(false);
      onView?.(order);
    },
    threshold: 50,
  });

  // Calculate visual offset based on swipe
  const visualOffset = swipeState.swiping
    ? Math.max(-120, Math.min(0, swipeState.deltaX))
    : showActions ? -120 : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="relative overflow-hidden rounded-lg mb-3">
      {/* Action buttons (revealed on swipe left) */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
        {order.status === 'pending' && (
          <button
            onClick={() => onFulfill?.(order)}
            className="w-[60px] bg-green-600 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
        <button
          onClick={() => onCancel?.(order)}
          className="w-[60px] bg-red-600 flex items-center justify-center"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main card content */}
      <div
        className="bg-tiktok-dark p-4 relative transition-transform"
        style={{ transform: `translateX(${visualOffset}px)` }}
        {...handlers}
        onClick={() => !swipeState.swiping && onView?.(order)}
      >
        <div className="flex items-start gap-3">
          {/* Product image or placeholder */}
          <div className="w-14 h-14 rounded-lg bg-tiktok-gray flex-shrink-0 overflow-hidden">
            {order.product?.main_image_url ? (
              <img
                src={order.product.main_image_url}
                alt={order.product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            )}
          </div>

          {/* Order info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white font-medium">#{order.id}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                {order.status}
              </span>
            </div>
            <p className="text-gray-400 text-sm truncate">{order.email}</p>
            {order.product && (
              <p className="text-gray-500 text-xs truncate mt-1">{order.product.name}</p>
            )}
          </div>

          {/* Price and date */}
          <div className="text-right flex-shrink-0">
            <p className="text-white font-semibold">{formatPrice(order.amount_cents)}</p>
            <p className="text-gray-500 text-xs mt-1">{formatDate(order.created_at)}</p>
          </div>
        </div>

        {/* Tracking info */}
        {order.tracking_number && (
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <p className="text-xs text-gray-500">
              Tracking: <span className="text-gray-400">{order.tracking_number}</span>
            </p>
          </div>
        )}

        {/* Swipe hint */}
        {!showActions && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

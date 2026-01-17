"use client";

import { useState } from 'react';
import { useSwipeActions } from '@/hooks/useSwipeActions';
import Link from 'next/link';

interface Product {
  id: number;
  slug: string;
  name: string;
  price_cents: number;
  main_image_url?: string;
  status: string;
  trend_score: number;
  urgency_score?: number;
}

interface MobileProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onToggleStatus?: (product: Product) => void;
}

const statusColors: Record<string, string> = {
  testing: 'bg-yellow-500/20 text-yellow-400',
  live: 'bg-green-500/20 text-green-400',
  paused: 'bg-orange-500/20 text-orange-400',
  killed: 'bg-red-500/20 text-red-400',
};

export function MobileProductCard({ product, onEdit, onDelete, onToggleStatus }: MobileProductCardProps) {
  const [showActions, setShowActions] = useState(false);

  const [swipeState, handlers] = useSwipeActions({
    onSwipeLeft: () => setShowActions(true),
    onSwipeRight: () => setShowActions(false),
    threshold: 50,
  });

  const visualOffset = swipeState.swiping
    ? Math.max(-180, Math.min(0, swipeState.deltaX))
    : showActions ? -180 : 0;

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getTrendColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="relative overflow-hidden rounded-lg mb-3">
      {/* Action buttons */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
        <button
          onClick={() => onEdit?.(product)}
          className="w-[60px] bg-blue-600 flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onToggleStatus?.(product)}
          className="w-[60px] bg-yellow-600 flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {product.status === 'live' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            )}
          </svg>
        </button>
        <button
          onClick={() => onDelete?.(product)}
          className="w-[60px] bg-red-600 flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Main card */}
      <Link href={`/dashboard/products/${product.id}`}>
        <div
          className="bg-tiktok-dark p-4 transition-transform"
          style={{ transform: `translateX(${visualOffset}px)` }}
          {...handlers}
        >
          <div className="flex items-start gap-3">
            {/* Product image */}
            <div className="w-16 h-16 rounded-lg bg-tiktok-gray flex-shrink-0 overflow-hidden">
              {product.main_image_url ? (
                <img
                  src={product.main_image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-medium truncate">{product.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[product.status] || 'bg-gray-500/20 text-gray-400'}`}>
                  {product.status}
                </span>
              </div>
              <p className="text-tiktok-red font-semibold">{formatPrice(product.price_cents)}</p>

              {/* Metrics row */}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className={`text-sm font-medium ${getTrendColor(product.trend_score)}`}>
                    {product.trend_score.toFixed(0)}
                  </span>
                </div>
                {product.urgency_score !== undefined && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-400">{product.urgency_score.toFixed(0)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Arrow indicator */}
            {!showActions && (
              <div className="flex-shrink-0 text-gray-600 self-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

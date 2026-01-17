"use client";

import { useState, useRef, useCallback } from 'react';
import { usePullToRefresh } from '@/hooks/useSwipeActions';

interface SwipeableListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onRefresh?: () => Promise<void>;
  emptyMessage?: string;
  loading?: boolean;
  keyExtractor: (item: T) => string | number;
}

export function SwipeableList<T>({
  items,
  renderItem,
  onRefresh,
  emptyMessage = 'No items found',
  loading = false,
  keyExtractor,
}: SwipeableListProps<T>) {
  const {
    containerRef,
    refreshing,
    pullDistance,
    progress,
    handlers,
  } = usePullToRefresh({
    onRefresh: onRefresh || (async () => {}),
    threshold: 80,
  });

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto"
      style={{ maxHeight: '100%' }}
      {...(onRefresh ? handlers : {})}
    >
      {/* Pull to refresh indicator */}
      {onRefresh && (pullDistance > 0 || refreshing) && (
        <div
          className="flex items-center justify-center py-2 transition-all"
          style={{ height: refreshing ? 60 : pullDistance }}
        >
          {refreshing ? (
            <div className="flex items-center gap-2 text-gray-400">
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-sm">Refreshing...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg
                className="w-6 h-6 text-gray-400 transition-transform"
                style={{ transform: `rotate(${progress * 180}deg)` }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
              <span className="text-xs text-gray-500 mt-1">
                {progress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && items.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <svg
            className="w-8 h-8 text-gray-400 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg
            className="w-16 h-16 text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      )}

      {/* Items */}
      <div className="space-y-0">
        {items.map((item, index) => (
          <div key={keyExtractor(item)}>{renderItem(item, index)}</div>
        ))}
      </div>

      {/* Loading more indicator */}
      {loading && items.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <svg
            className="w-6 h-6 text-gray-400 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

// Swipeable item wrapper with reveal actions
interface SwipeableItemProps {
  children: React.ReactNode;
  leftAction?: {
    icon: React.ReactNode;
    color: string;
    onAction: () => void;
  };
  rightActions?: Array<{
    icon: React.ReactNode;
    color: string;
    onAction: () => void;
  }>;
}

export function SwipeableItem({ children, leftAction, rightActions }: SwipeableItemProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const rightActionsWidth = (rightActions?.length || 0) * 60;
  const leftActionWidth = leftAction ? 60 : 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.touches[0].clientX - startX.current;
    const newOffset = Math.max(-rightActionsWidth, Math.min(leftActionWidth, deltaX));
    setOffset(newOffset);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    // Snap to position
    if (offset > leftActionWidth / 2 && leftAction) {
      setOffset(leftActionWidth);
    } else if (offset < -rightActionsWidth / 2) {
      setOffset(-rightActionsWidth);
    } else {
      setOffset(0);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Left action */}
      {leftAction && (
        <div
          className="absolute left-0 top-0 bottom-0 flex items-stretch"
          style={{ backgroundColor: leftAction.color }}
        >
          <button
            onClick={leftAction.onAction}
            className="w-[60px] flex items-center justify-center"
          >
            {leftAction.icon}
          </button>
        </div>
      )}

      {/* Right actions */}
      {rightActions && (
        <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onAction}
              className="w-[60px] flex items-center justify-center"
              style={{ backgroundColor: action.color }}
            >
              {action.icon}
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <div
        className="relative bg-tiktok-dark transition-transform"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

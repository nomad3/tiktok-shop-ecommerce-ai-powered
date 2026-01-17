"use client";

import { useState, useRef, useCallback, TouchEvent } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventScrollOnSwipe?: boolean;
}

interface SwipeState {
  swiping: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  deltaX: number;
  deltaY: number;
}

interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

export function useSwipeActions(config: SwipeConfig): [SwipeState, SwipeHandlers] {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventScrollOnSwipe = false,
  } = config;

  const [state, setState] = useState<SwipeState>({
    swiping: false,
    direction: null,
    deltaX: 0,
    deltaY: 0,
  });

  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    startTime.current = Date.now();
    setState(prev => ({ ...prev, swiping: true, deltaX: 0, deltaY: 0 }));
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!startX.current && !startY.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;

    // Determine primary direction
    let direction: 'left' | 'right' | 'up' | 'down' | null = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    if (preventScrollOnSwipe && (direction === 'left' || direction === 'right')) {
      e.preventDefault();
    }

    setState({
      swiping: true,
      direction,
      deltaX,
      deltaY,
    });
  }, [preventScrollOnSwipe]);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    const { deltaX, deltaY, direction } = state;
    const velocity = (Date.now() - startTime.current) < 300;

    // Check if swipe exceeds threshold or has high velocity
    const shouldTrigger = velocity || Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold;

    if (shouldTrigger && direction) {
      switch (direction) {
        case 'left':
          onSwipeLeft?.();
          break;
        case 'right':
          onSwipeRight?.();
          break;
        case 'up':
          onSwipeUp?.();
          break;
        case 'down':
          onSwipeDown?.();
          break;
      }
    }

    // Reset state
    startX.current = 0;
    startY.current = 0;
    setState({
      swiping: false,
      direction: null,
      deltaX: 0,
      deltaY: 0,
    });
  }, [state, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return [
    state,
    {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  ];
}

// Hook for pull-to-refresh
interface PullToRefreshConfig {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export function usePullToRefresh({ onRefresh, threshold = 80 }: PullToRefreshConfig) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling || refreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);

    // Apply resistance
    const resistedDistance = Math.min(distance * 0.5, threshold * 1.5);
    setPullDistance(resistedDistance);
  }, [pulling, refreshing, threshold]);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    setPulling(false);
    setPullDistance(0);
    startY.current = 0;
  }, [pullDistance, threshold, refreshing, onRefresh]);

  return {
    containerRef,
    pulling,
    refreshing,
    pullDistance,
    progress: Math.min(pullDistance / threshold, 1),
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}

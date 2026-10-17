import { useRef } from 'react';
import type { TouchEvent } from 'react';
import { detectSwipe, SwipeDirection, TouchPoint } from '../utils/swipe';

/** Touch handlers that call `onClose` when the element is swiped in `direction`. */
export const useSwipeToClose = (direction: SwipeDirection, onClose: () => void) => {
  const start = useRef<TouchPoint | null>(null);

  return {
    onTouchStart: (e: TouchEvent) => {
      const touch = e.touches[0];
      start.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    },
    onTouchEnd: (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const from = start.current;
      start.current = null;
      if (from && touch && detectSwipe(from, { x: touch.clientX, y: touch.clientY }) === direction) {
        onClose();
      }
    },
  };
};

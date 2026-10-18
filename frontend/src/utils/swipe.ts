export type SwipeDirection = 'left' | 'right';

export interface TouchPoint {
  x: number;
  y: number;
}

export const SWIPE_THRESHOLD_PX = 60;

/** Returns the horizontal swipe direction, or null for short or mostly vertical gestures. */
export const detectSwipe = (
  start: TouchPoint,
  end: TouchPoint,
  threshold = SWIPE_THRESHOLD_PX
): SwipeDirection | null => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy)) return null;
  return dx < 0 ? 'left' : 'right';
};

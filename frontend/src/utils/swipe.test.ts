import { describe, it, expect } from 'vitest';
import { detectSwipe, SWIPE_THRESHOLD_PX } from './swipe';

describe('detectSwipe', () => {
  it('detects a horizontal swipe to the left', () => {
    expect(detectSwipe({ x: 200, y: 100 }, { x: 100, y: 110 })).toBe('left');
  });

  it('detects a horizontal swipe to the right', () => {
    expect(detectSwipe({ x: 100, y: 100 }, { x: 220, y: 90 })).toBe('right');
  });

  it('ignores movements shorter than the threshold', () => {
    expect(detectSwipe({ x: 100, y: 100 }, { x: 100 + SWIPE_THRESHOLD_PX - 1, y: 100 })).toBeNull();
  });

  it('ignores mostly vertical gestures so list scrolling never closes a drawer', () => {
    expect(detectSwipe({ x: 100, y: 100 }, { x: 180, y: 300 })).toBeNull();
  });
});

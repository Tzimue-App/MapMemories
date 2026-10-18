import { Directive, input, output } from '@angular/core';
import { detectSwipe, SwipeDirection, TouchPoint } from './swipe';

/** Emits `swipeClose` when the host is swiped horizontally in `appSwipeToClose` direction. */
@Directive({
  selector: '[appSwipeToClose]',
  host: {
    '(touchstart)': 'onTouchStart($event)',
    '(touchend)': 'onTouchEnd($event)',
  },
})
export class SwipeToClose {
  readonly appSwipeToClose = input.required<SwipeDirection>();
  readonly swipeClose = output<void>();

  private start: TouchPoint | null = null;

  protected onTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    this.start = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  protected onTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    const from = this.start;
    this.start = null;
    if (from && touch && detectSwipe(from, { x: touch.clientX, y: touch.clientY }) === this.appSwipeToClose()) {
      this.swipeClose.emit();
    }
  }
}

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FilterCriteria, UnifiedMapElement } from '../../models/view';
import { filterModifications } from '../../shared/filter-modifications';
import { formatCoordinates } from '../../shared/geo-area';
import { SwipeToClose } from '../../shared/swipe-to-close';
import { ElementCounts, FilterToolbar } from './filter-toolbar';

const TYPE_BADGES = {
  PIN: { label: '📍 Pin', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300' },
  RADIUS: { label: '⭕ Circle', class: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300' },
  BOUNDARY: { label: '🗺️ Boundary', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300' },
};

@Component({
  selector: 'app-global-view-drawer',
  imports: [FilterToolbar, DatePipe, SwipeToClose],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './global-view-drawer.html',
})
export class GlobalViewDrawer {
  readonly isOpen = input(false);
  readonly elements = input.required<UnifiedMapElement[]>();
  readonly closed = output<void>();
  readonly selectElement = output<UnifiedMapElement>();

  protected readonly criteria = signal<FilterCriteria>({ type: 'ALL', dateRange: 'ALL', searchQuery: '' });
  protected readonly badges = TYPE_BADGES;
  protected readonly formatCoordinates = formatCoordinates;

  protected readonly counts = computed<ElementCounts>(() => {
    const elements = this.elements();
    const count = (type: UnifiedMapElement['type']) => elements.filter((e) => e.type === type).length;
    return { ALL: elements.length, PIN: count('PIN'), RADIUS: count('RADIUS'), BOUNDARY: count('BOUNDARY') };
  });

  protected readonly filtered = computed(() => filterModifications(this.elements(), this.criteria()));
}

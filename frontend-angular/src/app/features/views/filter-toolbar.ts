import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { DateRangeFilter, ElementTypeFilter, FilterCriteria } from '../../models/view';

export type ElementCounts = Record<ElementTypeFilter, number>;

@Component({
  selector: 'app-filter-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2.5 pb-3 border-b border-gray-200 dark:border-gray-700">
      <div class="relative">
        <span class="absolute inset-y-0 left-2.5 flex items-center text-gray-400 text-xs pointer-events-none">🔍</span>
        <input
          type="text"
          placeholder="Filter memories..."
          [value]="criteria().searchQuery"
          (input)="patch({ searchQuery: $any($event.target).value })"
          class="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        @if (criteria().searchQuery) {
          <button
            type="button"
            aria-label="Clear filter"
            (click)="patch({ searchQuery: '' })"
            class="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
          >
            ✕
          </button>
        }
      </div>

      <div class="flex items-center justify-between gap-1">
        <div class="flex gap-1 overflow-x-auto py-0.5">
          @for (pill of pills(); track pill.type) {
            <button
              type="button"
              [attr.aria-label]="pill.label"
              (click)="patch({ type: pill.type })"
              class="px-2 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0"
              [class]="
                criteria().type === pill.type
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              "
            >
              {{ pill.label }} ({{ pill.count }})
            </button>
          }
        </div>

        <select
          aria-label="Date filter"
          [value]="criteria().dateRange"
          (change)="patch({ dateRange: $any($event.target).value })"
          class="py-1 px-1.5 text-[11px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none shrink-0"
        >
          @for (option of dateOptions; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      </div>
    </div>
  `,
})
export class FilterToolbar {
  readonly criteria = model.required<FilterCriteria>();
  readonly counts = input.required<ElementCounts>();

  protected readonly dateOptions: { value: DateRangeFilter; label: string }[] = [
    { value: 'ALL', label: 'All Time' },
    { value: 'TODAY', label: 'Today' },
    { value: 'WEEK', label: 'Past 7 days' },
    { value: 'MONTH', label: 'Past 30 days' },
  ];

  protected readonly pills = computed(() => {
    const counts = this.counts();
    return [
      { type: 'ALL' as const, label: 'All', count: counts.ALL },
      { type: 'PIN' as const, label: 'Pins', count: counts.PIN },
      { type: 'RADIUS' as const, label: 'Circles', count: counts.RADIUS },
      { type: 'BOUNDARY' as const, label: 'Boundaries', count: counts.BOUNDARY },
    ];
  });

  protected patch(changes: Partial<FilterCriteria>): void {
    this.criteria.update((criteria) => ({ ...criteria, ...changes }));
  }
}

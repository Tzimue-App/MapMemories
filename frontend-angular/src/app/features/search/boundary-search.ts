import { ChangeDetectionStrategy, Component, ElementRef, inject, output } from '@angular/core';
import { BoundaryService } from '../../core/boundary.service';
import { BoundaryItem } from '../../models/boundary';
import { adminLevelBadge } from '../../shared/admin-level';
import { debouncedSearch } from '../../shared/debounced-search';

@Component({
  selector: 'app-boundary-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative block w-full max-w-md mx-auto z-[1000]',
    '(document:mousedown)': 'onDocumentMouseDown($event)',
  },
  template: `
    <div class="relative flex items-center">
      <input
        type="text"
        [value]="search.query()"
        (input)="search.type($any($event.target).value)"
        placeholder="Search country, region, or city (e.g. France, BE, Paris)..."
        class="w-full px-4 py-2.5 pr-16 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:focus:ring-purple-400"
      />
      <div class="absolute right-3 flex items-center space-x-1">
        @if (search.isLoading()) {
          <div class="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-1"></div>
        }
        @if (search.query()) {
          <button
            type="button"
            (click)="clear()"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700"
            title="Clear boundary search"
          >
            Clear
          </button>
        }
      </div>
    </div>

    @if (search.showDropdown()) {
      <div
        class="absolute w-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-72 overflow-y-auto"
      >
        @if (search.results().length > 0) {
          <ul class="divide-y divide-gray-100 dark:divide-gray-700/60">
            @for (item of search.results(); track item.osmId + '-' + item.name) {
              @let badge = badgeFor(item.adminLevel);
              <li
                (click)="select(item)"
                class="px-4 py-3 hover:bg-purple-50/70 dark:hover:bg-gray-700/50 cursor-pointer text-sm transition-colors flex items-center justify-between group"
              >
                <div class="flex flex-col overflow-hidden mr-3">
                  <span
                    class="font-semibold text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400"
                  >
                    {{ item.name }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{{ item.displayName }}</span>
                </div>

                <span
                  class="shrink-0 text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full flex items-center gap-1 border border-transparent"
                  [class]="badge.colorClass"
                >
                  <span>{{ badge.icon }}</span>
                  <span>{{ badge.label }}</span>
                </span>
              </li>
            }
          </ul>
        } @else if (search.hasSearched() && !search.isLoading()) {
          <div class="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 text-center flex flex-col items-center gap-1">
            <span>🗺️ No administrative boundaries found</span>
            <span class="text-xs text-gray-400"
              >Try searching for full country name (e.g. France, Belgium) or city</span
            >
          </div>
        }
      </div>
    }
  `,
})
export class BoundarySearch {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly boundaries = inject(BoundaryService);

  readonly selectBoundary = output<BoundaryItem>();
  readonly cleared = output<void>();

  protected readonly search = debouncedSearch((q) => this.boundaries.searchBoundaries(q));
  protected readonly badgeFor = adminLevelBadge;

  protected select(boundary: BoundaryItem): void {
    this.selectBoundary.emit(boundary);
    this.search.choose(boundary.name);
  }

  protected clear(): void {
    this.search.clear();
    this.cleared.emit();
  }

  protected onDocumentMouseDown(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.search.close();
    }
  }
}

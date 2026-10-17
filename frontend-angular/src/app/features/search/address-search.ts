import { ChangeDetectionStrategy, Component, ElementRef, inject, output } from '@angular/core';
import { NominatimService } from '../../core/nominatim.service';
import { SearchResult } from '../../models/search';
import { debouncedSearch } from '../../shared/debounced-search';

@Component({
  selector: 'app-address-search',
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
        placeholder="Search address or place..."
        class="w-full px-4 py-2.5 pr-10 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:focus:ring-blue-400"
      />
      @if (search.isLoading()) {
        <div class="absolute right-3">
          <div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    </div>

    @if (search.showDropdown()) {
      <div
        class="absolute w-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto"
      >
        @if (search.results().length > 0) {
          <ul class="divide-y divide-gray-100 dark:divide-gray-700">
            @for (item of search.results(); track item.id) {
              <li
                (click)="select(item)"
                class="px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-700/50 cursor-pointer text-sm text-gray-800 dark:text-gray-200 transition-colors"
              >
                {{ item.displayName }}
              </li>
            }
          </ul>
        } @else if (search.hasSearched() && !search.isLoading()) {
          <div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">No results found</div>
        }
      </div>
    }
  `,
})
export class AddressSearch {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly nominatim = inject(NominatimService);

  readonly selectLocation = output<SearchResult>();

  protected readonly search = debouncedSearch((q) => this.nominatim.searchLocations(q));

  protected select(result: SearchResult): void {
    this.selectLocation.emit(result);
    this.search.choose(result.displayName);
  }

  protected onDocumentMouseDown(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.search.close();
    }
  }
}

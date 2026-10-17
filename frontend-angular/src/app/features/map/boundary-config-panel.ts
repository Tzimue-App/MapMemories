import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { BOUNDARY_COLOR_OPTIONS, SavedBoundaryItem } from '../../models/boundary';
import { adminLevelLabel } from '../../shared/admin-level';
import { STOP_MAP_EVENTS_HOST } from '../../shared/popup-host';

@Component({
  selector: 'app-boundary-config-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: STOP_MAP_EVENTS_HOST,
  template: `
    <div
      class="w-64 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md text-gray-800 dark:text-gray-100 text-sm flex flex-col gap-3"
    >
      <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
        <h3 class="font-semibold text-base truncate max-w-[150px]">{{ boundary().name }}</h3>
        <span
          class="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
        >
          {{ levelLabel() }}
        </span>
      </div>

      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Boundary Highlight Color</span>
        <div class="flex gap-2 items-center mt-1 flex-wrap">
          @for (option of colorOptions; track option.value) {
            <button
              type="button"
              [title]="option.label"
              [attr.aria-label]="option.label"
              (click)="colorChange.emit(option.value)"
              class="w-6 h-6 rounded-full transition-transform border-2"
              [class]="
                boundary().color === option.value
                  ? 'scale-110 border-gray-900 dark:border-white shadow-md'
                  : 'border-transparent hover:scale-105'
              "
              [style.background-color]="option.value"
            ></button>
          }
        </div>
      </div>

      <div class="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button
          type="button"
          aria-label="Delete boundary"
          (click)="delete.emit(boundary().id)"
          class="w-full py-1 px-3 bg-red-500 hover:bg-red-600 text-white rounded font-medium text-xs transition-colors flex items-center justify-center gap-1"
        >
          <span>Delete Boundary</span>
        </button>
      </div>
    </div>
  `,
})
export class BoundaryConfigPanel {
  readonly boundary = input.required<SavedBoundaryItem>();
  readonly colorChange = output<string>();
  readonly delete = output<string>();

  protected readonly colorOptions = BOUNDARY_COLOR_OPTIONS;
  protected readonly levelLabel = computed(() => adminLevelLabel(this.boundary().adminLevel));
}

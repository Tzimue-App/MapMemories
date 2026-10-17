import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { MapStateService } from '../../core/map-state.service';
import { PIN_COLOR_OPTIONS, PIN_RADIUS_PRESETS, PinItem } from '../../models/pin';
import { STOP_MAP_EVENTS_HOST } from '../../shared/popup-host';
import { memoryMedia } from '../media/memory-media';
import { NoteList } from '../media/note-list';
import { PhotoGallery } from '../media/photo-gallery';
import { PhotoUploader } from '../media/photo-uploader';

type PanelTab = 'config' | 'photos' | 'notes';

export function formatRadius(meters: number, disabled?: boolean): string {
  if (meters === 0 || disabled) return 'Radius Disabled (0 m)';
  if (meters >= 1000) {
    return `${(meters / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} km (${meters} m)`;
  }
  return `${meters} m`;
}

export function formatPresetLabel(meters: number): string {
  if (meters === 0) return 'Off';
  return meters >= 1000 ? `${meters / 1000}km` : `${meters}m`;
}

@Component({
  selector: 'app-pin-config-panel',
  imports: [PhotoUploader, PhotoGallery, NoteList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: STOP_MAP_EVENTS_HOST,
  templateUrl: './pin-config-panel.html',
})
export class PinConfigPanel {
  private readonly auth = inject(AuthService);
  private readonly mapState = inject(MapStateService);

  readonly pin = input.required<PinItem>();
  readonly radiusChange = output<number>();
  readonly colorChange = output<string>();
  readonly delete = output<string>();

  protected readonly colorOptions = PIN_COLOR_OPTIONS;
  protected readonly presets = PIN_RADIUS_PRESETS.map((value) => ({ value, label: formatPresetLabel(value) }));

  protected readonly activeTab = signal<PanelTab>('config');
  protected readonly media = memoryMedia({
    source: () => (this.auth.isAuthenticated() && this.pin().dbId ? { id: this.pin().dbId } : null),
    resolveId: () => this.mapState.ensurePinSaved(this.pin().id),
  });

  protected readonly isRadiusDisabled = computed(
    () => this.pin().radiusMeters === 0 || this.pin().radiusDisabled === true,
  );
  protected readonly radiusText = computed(() => formatRadius(this.pin().radiusMeters, this.isRadiusDisabled()));

  protected onSlider(event: Event): void {
    this.radiusChange.emit(Number((event.target as HTMLInputElement).value));
  }
}

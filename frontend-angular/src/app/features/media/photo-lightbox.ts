import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PhotoItem } from '../../models/media';
import { AuthImage } from './auth-image';

@Component({
  selector: 'app-photo-lightbox',
  imports: [AuthImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (photo(); as photo) {
      <div
        class="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
        data-testid="photo-lightbox"
      >
        <div
          class="relative max-w-4xl w-full bg-slate-900 text-white rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div class="flex items-center justify-between p-3 border-b border-slate-800">
            <div class="text-sm font-semibold truncate pr-4">{{ photo.caption || photo.originalFilename }}</div>
            <button
              type="button"
              (click)="closed.emit()"
              class="text-slate-400 hover:text-white p-1 rounded transition-colors text-lg"
              data-testid="lightbox-close"
            >
              ✕
            </button>
          </div>
          <div class="flex-1 flex items-center justify-center bg-black p-2 overflow-hidden">
            <app-auth-image
              [src]="photo.contentUrl"
              [alt]="photo.caption || photo.originalFilename"
              imgClass="max-h-[70vh] max-w-full object-contain"
            />
          </div>
          @if (photo.caption) {
            <div class="p-3 bg-slate-800 text-xs text-slate-300 border-t border-slate-700">{{ photo.caption }}</div>
          }
        </div>
      </div>
    }
  `,
})
export class PhotoLightbox {
  readonly photo = input<PhotoItem | null>(null);
  readonly closed = output<void>();
}

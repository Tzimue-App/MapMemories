import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { PhotoItem } from '../../models/media';
import { AuthImage } from './auth-image';
import { PhotoLightbox } from './photo-lightbox';

@Component({
  selector: 'app-photo-gallery',
  imports: [AuthImage, PhotoLightbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (photos().length === 0) {
      <div class="text-center py-4 text-xs text-slate-400">No photos attached yet.</div>
    } @else {
      <div class="grid grid-cols-2 gap-2" data-testid="photo-gallery">
        @for (photo of photos(); track photo.id) {
          <div
            class="group relative h-24 rounded border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer"
            (click)="activePhoto.set(photo)"
          >
            <app-auth-image
              [src]="photo.contentUrl"
              [alt]="photo.caption || photo.originalFilename"
              imgClass="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            @if (deletePhoto(); as deletePhoto) {
              <button
                type="button"
                title="Delete Photo"
                (click)="$event.stopPropagation(); deletePhoto(photo.id)"
                class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white rounded p-1 text-[10px] transition-opacity"
              >
                ✕
              </button>
            }
            @if (photo.caption) {
              <div class="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[10px] p-1 truncate">
                {{ photo.caption }}
              </div>
            }
          </div>
        }
      </div>

      <app-photo-lightbox [photo]="activePhoto()" (closed)="activePhoto.set(null)" />
    }
  `,
})
export class PhotoGallery {
  readonly photos = input.required<PhotoItem[]>();
  /** When provided, each photo gets a delete button. */
  readonly deletePhoto = input<(photoId: number) => Promise<void>>();

  protected readonly activePhoto = signal<PhotoItem | null>(null);
}

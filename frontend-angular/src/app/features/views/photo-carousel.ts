import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, signal } from '@angular/core';
import { PhotoItem } from '../../models/media';
import { AuthImage } from '../media/auth-image';
import { PhotoLightbox } from '../media/photo-lightbox';

@Component({
  selector: 'app-photo-carousel',
  imports: [AuthImage, PhotoLightbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (current(); as photo) {
      <div class="flex flex-col gap-2">
        <div
          data-testid="carousel-stage"
          class="relative aspect-video rounded-xl overflow-hidden bg-gray-950 border border-gray-200 dark:border-gray-700 group"
        >
          <app-auth-image
            (click)="lightboxPhoto.set(photo)"
            [src]="photo.contentUrl"
            [alt]="photo.caption || photo.originalFilename"
            imgClass="w-full h-full object-contain cursor-pointer transition-transform duration-200 group-hover:scale-[1.02]"
          />

          <span
            class="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-900/80 text-white backdrop-blur-sm"
            >{{ index() + 1 }} / {{ photos().length }}</span
          >

          @if (photos().length > 1) {
            <button
              type="button"
              aria-label="Previous photo"
              (click)="previous()"
              class="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 text-xs shadow-md"
            >
              ◀
            </button>
            <button
              type="button"
              aria-label="Next photo"
              (click)="next()"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 text-xs shadow-md"
            >
              ▶
            </button>
          }

          @if (photo.caption) {
            <div
              class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-4 text-white text-xs truncate"
            >
              {{ photo.caption }}
            </div>
          }
        </div>

        @if (photos().length > 1) {
          <div class="flex gap-1.5 overflow-x-auto py-1">
            @for (thumb of photos(); track thumb.id; let i = $index) {
              <button
                type="button"
                [attr.aria-label]="'Thumbnail ' + (i + 1)"
                (click)="index.set(i)"
                class="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all"
                [class]="
                  i === index()
                    ? 'border-blue-500 scale-105 shadow-sm'
                    : 'border-transparent opacity-60 hover:opacity-100'
                "
              >
                <app-auth-image
                  [src]="thumb.contentUrl"
                  [alt]="thumb.caption || thumb.originalFilename"
                  imgClass="w-full h-full object-cover"
                />
              </button>
            }
          </div>
        }

        <app-photo-lightbox [photo]="lightboxPhoto()" (closed)="lightboxPhoto.set(null)" />
      </div>
    } @else {
      <div
        class="text-center py-6 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700"
      >
        📷 No photos attached to this memory yet.
      </div>
    }
  `,
})
export class PhotoCarousel {
  readonly photos = input.required<PhotoItem[]>();

  /** Resets to the first photo whenever the list changes. */
  protected readonly index = linkedSignal({ source: this.photos, computation: () => 0 });
  protected readonly current = computed<PhotoItem | undefined>(() => this.photos()[this.index()] ?? this.photos()[0]);
  protected readonly lightboxPhoto = signal<PhotoItem | null>(null);

  protected previous(): void {
    const count = this.photos().length;
    this.index.update((i) => (i === 0 ? count - 1 : i - 1));
  }

  protected next(): void {
    const count = this.photos().length;
    this.index.update((i) => (i === count - 1 ? 0 : i + 1));
  }
}

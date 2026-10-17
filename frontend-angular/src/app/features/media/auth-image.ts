import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { MediaService } from '../../core/media.service';

/**
 * <img> for JWT-protected photos: the browser cannot attach an Authorization header to an
 * <img src>, so the bytes are fetched through HttpClient and shown via a revocable blob: URL.
 */
@Component({
  selector: 'app-auth-image',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (url(); as url) {
      <img [src]="url" [alt]="alt()" [class]="imgClass()" />
    } @else {
      <div
        role="img"
        [attr.aria-label]="alt() || 'Image loading'"
        class="flex items-center justify-center bg-slate-200 dark:bg-slate-700"
        [class]="imgClass()"
      >
        <span class="text-[10px] text-slate-400">{{ fallback() }}</span>
      </div>
    }
  `,
})
export class AuthImage {
  private readonly media = inject(MediaService);

  readonly src = input.required<string>();
  readonly alt = input('');
  readonly imgClass = input('');
  /** Text shown while the image is loading or when it cannot be loaded. */
  readonly fallback = input('Loading...');

  protected readonly url = signal<string | null>(null);

  constructor() {
    effect((onCleanup) => {
      const src = this.src();
      if (!src || src.startsWith('blob:') || src.startsWith('data:')) {
        this.url.set(src || null);
        return;
      }

      this.url.set(null);
      let objectUrl: string | null = null;
      const subscription = this.media.getPhotoBlob(src).subscribe({
        next: (blob) => {
          objectUrl = URL.createObjectURL(blob);
          this.url.set(objectUrl);
        },
        error: () => this.url.set(null),
      });

      onCleanup(() => {
        subscription.unsubscribe();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      });
    });
  }
}

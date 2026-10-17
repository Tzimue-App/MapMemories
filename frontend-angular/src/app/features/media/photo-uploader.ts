import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { AuthImage } from './auth-image';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

@Component({
  selector: 'app-photo-uploader',
  imports: [AuthImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
      <h4 class="font-semibold text-slate-800 dark:text-slate-100 mb-2">Add Photo</h4>
      @if (errorMessage()) {
        <div class="mb-2 p-2 text-red-600 bg-red-50 dark:bg-red-900/30 rounded text-xs">{{ errorMessage() }}</div>
      }

      @if (!selectedFile()) {
        <label
          class="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
        >
          <svg class="w-6 h-6 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span class="text-slate-600 dark:text-slate-300 font-medium">Click or drag image here</span>
          <span class="text-slate-400 text-[10px] mt-0.5">Max size 10MB</span>
          <input
            type="file"
            accept="image/*"
            (change)="onFileChange($event)"
            class="hidden"
            data-testid="photo-file-input"
          />
        </label>
      } @else {
        <form (submit)="onSubmit($event)" class="space-y-2">
          @if (previewUrl(); as previewUrl) {
            <div class="relative w-full h-32 rounded overflow-hidden border border-slate-200 dark:border-slate-700">
              <app-auth-image [src]="previewUrl" alt="Preview" imgClass="w-full h-full object-cover" />
              <button
                type="button"
                (click)="clearSelection()"
                class="absolute top-1 right-1 bg-slate-900/70 text-white rounded-full p-1 hover:bg-slate-900"
                title="Remove selection"
              >
                ✕
              </button>
            </div>
          }

          <div>
            <label class="block text-slate-600 dark:text-slate-300 text-[11px] mb-1 font-medium">
              Caption (optional)
              <input
                type="text"
                [value]="caption()"
                (input)="caption.set($any($event.target).value)"
                placeholder="Add a photo description..."
                class="mt-1 w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-normal"
              />
            </label>
          </div>

          <button
            type="submit"
            [disabled]="isLoading()"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded shadow transition-colors disabled:opacity-50"
          >
            {{ isLoading() ? 'Saving Photo...' : '💾 Save Photo' }}
          </button>
        </form>
      }
    </div>
  `,
})
export class PhotoUploader {
  /** Performs the upload; a rejection is shown to the user and keeps the selection. */
  readonly upload = input.required<(file: File, caption?: string) => Promise<void>>();
  readonly isLoading = input(false);

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly caption = signal('');
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.revokePreview());
  }

  protected onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      this.errorMessage.set('Image file size must be less than 10MB.');
      return;
    }

    this.errorMessage.set(null);
    this.revokePreview();
    this.selectedFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const file = this.selectedFile();
    if (!file) return;

    try {
      this.errorMessage.set(null);
      const caption = this.caption().trim() ? this.caption() : undefined;
      await this.upload()(file, caption);
      this.clearSelection();
      this.caption.set('');
    } catch (err) {
      this.errorMessage.set((err as Error)?.message || 'Failed to upload photo.');
    }
  }

  protected clearSelection(): void {
    this.revokePreview();
    this.selectedFile.set(null);
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
  }
}

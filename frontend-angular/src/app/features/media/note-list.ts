import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NoteItem } from '../../models/media';

@Component({
  selector: 'app-note-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3 text-xs" data-testid="note-list">
      <form (submit)="onSubmit($event)" class="space-y-2">
        <textarea
          [value]="content()"
          (input)="content.set($any($event.target).value)"
          placeholder="Add a detailed note or memory..."
          rows="3"
          class="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
        ></textarea>
        <button
          type="submit"
          [disabled]="isLoading() || isBlank()"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded shadow transition-colors disabled:opacity-50"
        >
          {{ isLoading() ? 'Saving Note...' : '💾 Save Note' }}
        </button>
      </form>

      <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
        @for (note of notes(); track note.id) {
          <div
            class="group relative p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
          >
            <p class="whitespace-pre-wrap pr-4">{{ note.content }}</p>
            @if (deleteNote(); as deleteNote) {
              <button
                type="button"
                title="Delete Note"
                (click)="deleteNote(note.id)"
                class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-[10px]"
              >
                ✕
              </button>
            }
          </div>
        } @empty {
          <div class="text-center py-2 text-slate-400">No notes added yet.</div>
        }
      </div>
    </div>
  `,
})
export class NoteList {
  readonly notes = input.required<NoteItem[]>();
  readonly addNote = input.required<(content: string) => Promise<void>>();
  /** When provided, each note gets a delete button. */
  readonly deleteNote = input<(noteId: number) => Promise<void>>();

  protected readonly content = signal('');
  protected readonly isLoading = signal(false);
  protected readonly isBlank = computed(() => !this.content().trim());

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isBlank()) return;

    try {
      this.isLoading.set(true);
      await this.addNote()(this.content().trim());
      this.content.set('');
    } finally {
      this.isLoading.set(false);
    }
  }
}

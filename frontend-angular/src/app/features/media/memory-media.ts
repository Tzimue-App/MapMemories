import { computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom, Observable, of } from 'rxjs';
import { MediaService } from '../../core/media.service';
import { NoteService } from '../../core/note.service';
import { NoteItem, PhotoItem } from '../../models/media';

export interface MediaSource {
  /** Database id of the modification the media belongs to. */
  id?: number;
  /** Already-known media; skips the corresponding request. */
  photos?: PhotoItem[];
  notes?: NoteItem[];
}

export interface MemoryMediaConfig {
  /** Reactive source; `null` means "do not load anything". Only reloaded when id/photos/notes change. */
  source: () => MediaSource | null;
  /** Id to attach new media to, possibly creating the modification first. Defaults to `source().id`. */
  resolveId?: () => Promise<number | undefined>;
}

const sameSource = (a: MediaSource | null, b: MediaSource | null) =>
  a === b || (!!a && !!b && a.id === b.id && a.photos === b.photos && a.notes === b.notes);

const prepend =
  <T extends { id: number }>(item: T) =>
  (list: T[]) => [item, ...list.filter((i) => i.id !== item.id)];

/**
 * Photos and notes of one memory, shared by the pin popup and the detail drawer.
 * Must be created in an injection context (component field initialiser).
 */
export function memoryMedia({ source, resolveId }: MemoryMediaConfig) {
  const mediaService = inject(MediaService);
  const noteService = inject(NoteService);

  const photos = signal<PhotoItem[]>([]);
  const notes = signal<NoteItem[]>([]);
  const isUploadingPhoto = signal(false);

  const current = computed(source, { equal: sameSource });
  const currentId = () => current()?.id;
  const targetId = resolveId ?? (async () => currentId());

  effect((onCleanup) => {
    const src = current();
    if (!src) return;

    const load = <T>(known: T[] | undefined, fetch: (id: number) => Observable<T[]>) =>
      known ? of(known) : src.id ? fetch(src.id) : of([]);

    const subscriptions = [
      load(src.photos, (id) => mediaService.getPhotos(id)).subscribe({
        next: (p) => photos.set(p),
        error: () => undefined,
      }),
      load(src.notes, (id) => noteService.getNotes(id)).subscribe({
        next: (n) => notes.set(n),
        error: () => undefined,
      }),
    ];
    onCleanup(() => subscriptions.forEach((s) => s.unsubscribe()));
  });

  return {
    photos: photos.asReadonly(),
    notes: notes.asReadonly(),
    isUploadingPhoto: isUploadingPhoto.asReadonly(),

    uploadPhoto: async (file: File, caption?: string): Promise<void> => {
      isUploadingPhoto.set(true);
      try {
        const id = await targetId();
        if (!id) return;
        photos.update(prepend(await firstValueFrom(mediaService.uploadPhoto(id, file, caption))));
      } finally {
        isUploadingPhoto.set(false);
      }
    },

    deletePhoto: async (photoId: number): Promise<void> => {
      const id = currentId();
      if (!id) return;
      await firstValueFrom(mediaService.deletePhoto(id, photoId));
      photos.update((list) => list.filter((p) => p.id !== photoId));
    },

    addNote: async (content: string): Promise<void> => {
      const id = await targetId();
      if (!id) return;
      notes.update(prepend(await firstValueFrom(noteService.createNote(id, content))));
    },

    deleteNote: async (noteId: number): Promise<void> => {
      const id = currentId();
      if (!id) return;
      await firstValueFrom(noteService.deleteNote(id, noteId));
      notes.update((list) => list.filter((n) => n.id !== noteId));
    },
  };
}

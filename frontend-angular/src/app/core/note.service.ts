import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NoteItem } from '../models/media';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private readonly http = inject(HttpClient);

  createNote(modificationId: number, content: string): Observable<NoteItem> {
    return this.http.post<NoteItem>(`/api/modifications/${modificationId}/notes`, { content });
  }

  getNotes(modificationId: number): Observable<NoteItem[]> {
    return this.http.get<NoteItem[]>(`/api/modifications/${modificationId}/notes`);
  }

  deleteNote(modificationId: number, noteId: number): Observable<void> {
    return this.http.delete<void>(`/api/modifications/${modificationId}/notes/${noteId}`);
  }
}

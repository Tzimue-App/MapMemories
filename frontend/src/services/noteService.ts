import { NoteItem } from '../types/media';
import { authService } from './authService';

export const noteService = {
  async createNote(modificationId: number, content: string): Promise<NoteItem> {
    const token = authService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/modifications/${modificationId}/notes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to create note');
    }

    return response.json();
  },

  async getNotes(modificationId: number): Promise<NoteItem[]> {
    const token = authService.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/modifications/${modificationId}/notes`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notes');
    }

    return response.json();
  },

  async deleteNote(modificationId: number, noteId: number): Promise<void> {
    const token = authService.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/modifications/${modificationId}/notes/${noteId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to delete note');
    }
  },
};

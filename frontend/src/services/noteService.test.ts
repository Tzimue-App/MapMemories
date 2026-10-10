import { describe, it, expect, vi, beforeEach } from 'vitest';
import { noteService } from './noteService';
import { authService } from './authService';

describe('noteService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('creates a note with authorization header', async () => {
    authService.setToken('test-token');
    const mockNote = {
      id: 5,
      modificationId: 10,
      content: 'Hello memory note',
      createdAt: '2026-10-02T12:00:00Z',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockNote,
    } as Response);

    const result = await noteService.createNote(10, 'Hello memory note');
    expect(result).toEqual(mockNote);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/modifications/10/notes',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ content: 'Hello memory note' }),
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    );
  });

  it('fetches notes for a modification', async () => {
    authService.setToken('test-token');
    const mockNotes = [{ id: 5, modificationId: 10, content: 'Note 1', createdAt: '2026-10-02' }];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockNotes,
    } as Response);

    const notes = await noteService.getNotes(10);
    expect(notes).toEqual(mockNotes);
  });

  it('deletes a note', async () => {
    authService.setToken('test-token');
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
    } as Response);

    await noteService.deleteNote(10, 5);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/modifications/10/notes/5',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    );
  });
});

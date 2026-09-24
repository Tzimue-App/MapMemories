import { describe, it, expect, vi, beforeEach } from 'vitest';
import { modificationService, Modification } from './modificationService';
import { authService } from './authService';

describe('modificationService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('includes Authorization header when fetching modifications', async () => {
    authService.setToken('valid-token');
    const mockMods: Modification[] = [
      { id: 1, type: 'PIN', title: 'Home Pin', lat: 48.85, lng: 2.35, color: '#ff0000' }
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockMods,
    } as Response);

    const result = await modificationService.getModifications();
    expect(result).toEqual(mockMods);
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/modifications', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer valid-token' }),
    }));
  });

  it('saves modification with auth header', async () => {
    authService.setToken('valid-token');
    const newMod = { type: 'RADIUS' as const, title: 'Radius Zone', lat: 48.85, lng: 2.35, radiusMeters: 500, color: '#00ff00' };
    const savedMod = { ...newMod, id: 10 };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => savedMod,
    } as Response);

    const result = await modificationService.saveModification(newMod);
    expect(result).toEqual(savedMod);
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/modifications', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(newMod),
    }));
  });

  it('deletes modification with auth header', async () => {
    authService.setToken('valid-token');
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
    } as Response);

    await modificationService.deleteModification(10);
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/modifications/10', expect.objectContaining({
      method: 'DELETE',
      headers: expect.objectContaining({ Authorization: 'Bearer valid-token' }),
    }));
  });
});

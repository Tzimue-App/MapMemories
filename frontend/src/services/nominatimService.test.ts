import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchLocations } from './nominatimService';

describe('nominatimService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('queries Nominatim API with query string and returns formatted search results', async () => {
    const mockApiResponse = [
      {
        place_id: 12345,
        display_name: 'Eiffel Tower, Paris, France',
        lat: '48.8584',
        lon: '2.2945',
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const results = await searchLocations('Eiffel Tower');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://nominatim.openstreetmap.org/search?q=Eiffel%20Tower&format=json'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Accept-Language': 'en',
        }),
      })
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      id: 12345,
      displayName: 'Eiffel Tower, Paris, France',
      lat: 48.8584,
      lon: 2.2945,
    });
  });

  it('returns empty array when query is empty or whitespace', async () => {
    const results = await searchLocations('   ');
    expect(results).toEqual([]);
  });

  it('handles API errors gracefully without throwing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const results = await searchLocations('Paris');
    expect(results).toEqual([]);
  });
});

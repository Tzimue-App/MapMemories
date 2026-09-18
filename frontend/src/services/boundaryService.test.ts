import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchBoundaries } from './boundaryService';

describe('boundaryService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array for empty query', async () => {
    const results = await searchBoundaries('   ');
    expect(results).toEqual([]);
  });

  it('fetches boundary results from backend API when available', async () => {
    const mockData = [
      {
        osmId: 101,
        name: 'Bavaria',
        displayName: 'Bavaria, Germany',
        boundaryType: 'administrative',
        adminLevel: 4,
        geojson: '{"type":"Polygon","coordinates":[]}',
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null),
      },
      json: async () => mockData,
    } as unknown as Response);

    const results = await searchBoundaries('Bavaria');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Bavaria');
    expect(global.fetch).toHaveBeenCalledWith('/api/boundaries/search?query=Bavaria');
  });

  it('falls back to Nominatim direct query when backend API is unavailable or returns non-JSON', async () => {
    const mockNominatimData = [
      {
        place_id: 999,
        osm_id: 2202162,
        display_name: 'France',
        name: 'France',
        type: 'administrative',
        addresstype: 'country',
        geojson: {
          type: 'MultiPolygon',
          coordinates: [],
        },
      },
    ];

    global.fetch = vi.fn()
      // First call (/api/boundaries/search) returns HTML/fallback or error
      .mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => (name.toLowerCase() === 'content-type' ? 'text/html' : null),
        },
      } as unknown as Response)
      // Second call (Nominatim direct query) returns JSON
      .mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => mockNominatimData,
      } as unknown as Response);

    const results = await searchBoundaries('France');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('France');
    expect(results[0].adminLevel).toBe(2);
  });
});

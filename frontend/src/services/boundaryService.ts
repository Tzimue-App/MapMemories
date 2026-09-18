import { BoundaryItem } from '../types/boundary';

interface RawNominatimBoundaryResult {
  place_id: number;
  osm_id?: number;
  display_name: string;
  name?: string;
  type?: string;
  addresstype?: string;
  extratags?: {
    admin_level?: string;
  };
  geojson?: {
    type: string;
    coordinates: any;
  };
}

export const searchBoundaries = async (query: string): Promise<BoundaryItem[]> => {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  // 1. Try Backend API first
  try {
    const response = await fetch(`/api/boundaries/search?query=${encodeURIComponent(trimmed)}`);
    const contentType = response.headers.get('content-type');
    
    if (response.ok && contentType && contentType.includes('application/json')) {
      const data: BoundaryItem[] = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (error) {
    console.warn('Backend boundary API unavailable, falling back to Nominatim direct client query:', error);
  }

  // 2. Fallback: Query Nominatim directly with polygon_geojson=1
  return fetchNominatimBoundariesDirectly(trimmed);
};

const fetchNominatimBoundariesDirectly = async (query: string): Promise<BoundaryItem[]> => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&polygon_geojson=1&limit=8`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      return [];
    }

    const rawData: RawNominatimBoundaryResult[] = await response.json();
    const items: BoundaryItem[] = [];

    for (const item of rawData) {
      if (item.geojson && (item.geojson.type === 'Polygon' || item.geojson.type === 'MultiPolygon')) {
        let adminLevel = 8;
        if (item.extratags?.admin_level) {
          const parsedLevel = parseInt(item.extratags.admin_level, 10);
          if (!isNaN(parsedLevel)) {
            adminLevel = parsedLevel;
          }
        } else if (item.addresstype === 'country' || item.type === 'country') {
          adminLevel = 2;
        } else if (item.addresstype === 'state' || item.type === 'state' || item.type === 'region') {
          adminLevel = 4;
        } else if (item.addresstype === 'county' || item.type === 'county') {
          adminLevel = 6;
        }

        const name = item.name || item.display_name.split(',')[0];
        items.push({
          osmId: item.osm_id || item.place_id,
          name: name.trim(),
          displayName: item.display_name,
          boundaryType: item.type || 'administrative',
          adminLevel,
          geojson: JSON.stringify(item.geojson),
        });
      }
    }

    return items;
  } catch (error) {
    console.error('Nominatim direct boundary request failed:', error);
    return [];
  }
};

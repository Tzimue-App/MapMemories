export interface SearchResult {
  id: number;
  displayName: string;
  lat: number;
  lon: number;
}

interface RawNominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export const searchLocations = async (query: string): Promise<SearchResult[]> => {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&addressdetails=1&limit=5`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      return [];
    }

    const data: RawNominatimResult[] = await response.json();
    return data.map((item) => ({
      id: item.place_id,
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }));
  } catch (error) {
    console.error('Nominatim geocoding request failed:', error);
    return [];
  }
};

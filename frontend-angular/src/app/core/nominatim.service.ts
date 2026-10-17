import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { SearchResult } from '../models/search';

export const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
export const NOMINATIM_HEADERS = { 'Accept-Language': 'en' };

interface RawNominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

@Injectable({ providedIn: 'root' })
export class NominatimService {
  private readonly http = inject(HttpClient);

  searchLocations(query: string): Observable<SearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return of([]);

    const url = `${NOMINATIM_SEARCH_URL}?q=${encodeURIComponent(trimmed)}&format=json&addressdetails=1&limit=5`;
    return this.http.get<RawNominatimResult[]>(url, { headers: NOMINATIM_HEADERS }).pipe(
      map((data) =>
        data.map((item) => ({
          id: item.place_id,
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        })),
      ),
      catchError((error) => {
        console.error('Nominatim geocoding request failed:', error);
        return of([]);
      }),
    );
  }
}

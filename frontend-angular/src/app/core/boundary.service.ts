import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { BoundaryItem } from '../models/boundary';
import { NOMINATIM_HEADERS, NOMINATIM_SEARCH_URL } from './nominatim.service';

interface RawNominatimBoundaryResult {
  place_id: number;
  osm_id?: number;
  display_name: string;
  name?: string;
  type?: string;
  addresstype?: string;
  extratags?: { admin_level?: string };
  geojson?: { type: string; coordinates: unknown };
}

const isPolygon = (type?: string) => type === 'Polygon' || type === 'MultiPolygon';

function deriveAdminLevel(item: RawNominatimBoundaryResult): number {
  const parsed = parseInt(item.extratags?.admin_level ?? '', 10);
  if (!isNaN(parsed)) return parsed;

  const kinds = [item.addresstype, item.type];
  if (kinds.includes('country')) return 2;
  if (kinds.includes('state') || item.type === 'region') return 4;
  if (kinds.includes('county')) return 6;
  return 8;
}

function toBoundaryItem(item: RawNominatimBoundaryResult): BoundaryItem {
  return {
    osmId: item.osm_id || item.place_id,
    name: (item.name || item.display_name.split(',')[0]).trim(),
    displayName: item.display_name,
    boundaryType: item.type || 'administrative',
    adminLevel: deriveAdminLevel(item),
    geojson: JSON.stringify(item.geojson),
  };
}

@Injectable({ providedIn: 'root' })
export class BoundaryService {
  private readonly http = inject(HttpClient);

  /** Backend search first; falls back to Nominatim when the backend errors or finds nothing. */
  searchBoundaries(query: string): Observable<BoundaryItem[]> {
    const trimmed = query.trim();
    if (!trimmed) return of([]);

    return this.http.get<BoundaryItem[]>(`/api/boundaries/search?query=${encodeURIComponent(trimmed)}`).pipe(
      catchError((error) => {
        console.warn('Backend boundary API unavailable, falling back to Nominatim direct client query:', error);
        return of([] as BoundaryItem[]);
      }),
      switchMap((data) =>
        Array.isArray(data) && data.length > 0 ? of(data) : this.searchNominatimBoundaries(trimmed),
      ),
    );
  }

  private searchNominatimBoundaries(query: string): Observable<BoundaryItem[]> {
    return this.http
      .get<RawNominatimBoundaryResult[]>(NOMINATIM_SEARCH_URL, {
        headers: NOMINATIM_HEADERS,
        params: { q: query, format: 'json', polygon_geojson: '1', limit: '8' },
      })
      .pipe(
        map((raw) => raw.filter((item) => isPolygon(item.geojson?.type)).map(toBoundaryItem)),
        catchError((error) => {
          console.error('Nominatim direct boundary request failed:', error);
          return of([]);
        }),
      );
  }
}

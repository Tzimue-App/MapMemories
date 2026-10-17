import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideTestHttp } from '../../testing/http';
import { BoundaryItem } from '../models/boundary';
import { BoundaryService } from './boundary.service';

describe('BoundaryService', () => {
  let service: BoundaryService;
  let httpMock: HttpTestingController;

  const expectNominatim = (): TestRequest =>
    httpMock.expectOne((r) => r.url.startsWith('https://nominatim.openstreetmap.org/search'));

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({ providers: provideTestHttp() });
    service = TestBed.inject(BoundaryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('returns an empty array for an empty query', async () => {
    expect(await firstValueFrom(service.searchBoundaries('   '))).toEqual([]);
  });

  it('returns the backend results when available', async () => {
    const data: BoundaryItem[] = [
      {
        osmId: 101,
        name: 'Bavaria',
        displayName: 'Bavaria, Germany',
        boundaryType: 'administrative',
        adminLevel: 4,
        geojson: '{"type":"Polygon","coordinates":[]}',
      },
    ];
    const result = firstValueFrom(service.searchBoundaries('Bavaria'));

    httpMock.expectOne('/api/boundaries/search?query=Bavaria').flush(data);

    expect(await result).toEqual(data);
  });

  it('falls back to Nominatim when the backend errors (e.g. non-JSON SPA fallback)', async () => {
    const result = firstValueFrom(service.searchBoundaries('France'));

    httpMock
      .expectOne('/api/boundaries/search?query=France')
      .flush('<html></html>', { status: 404, statusText: 'Not Found' });

    const nominatim = expectNominatim();
    expect(nominatim.request.params.get('polygon_geojson')).toBe('1');
    expect(nominatim.request.headers.get('Accept-Language')).toBe('en');
    nominatim.flush([
      {
        place_id: 999,
        osm_id: 2202162,
        display_name: 'France',
        name: 'France',
        type: 'administrative',
        addresstype: 'country',
        geojson: { type: 'MultiPolygon', coordinates: [] },
      },
    ]);

    const items = await result;
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      osmId: 2202162,
      name: 'France',
      displayName: 'France',
      boundaryType: 'administrative',
      adminLevel: 2,
      geojson: JSON.stringify({ type: 'MultiPolygon', coordinates: [] }),
    });
  });

  it('falls back to Nominatim when the backend returns an empty list', async () => {
    const result = firstValueFrom(service.searchBoundaries('Nowhere'));

    httpMock.expectOne('/api/boundaries/search?query=Nowhere').flush([]);
    expectNominatim().flush([]);

    expect(await result).toEqual([]);
  });

  it('derives admin levels, skips non-polygon results and prefers extratags.admin_level', async () => {
    const result = firstValueFrom(service.searchBoundaries('Mix'));

    httpMock.expectOne('/api/boundaries/search?query=Mix').flush([]);
    expectNominatim().flush([
      { place_id: 1, display_name: 'Point, X', geojson: { type: 'Point', coordinates: [0, 0] } },
      { place_id: 2, display_name: 'Bayern, Germany', type: 'state', geojson: { type: 'Polygon', coordinates: [] } },
      {
        place_id: 3,
        display_name: 'Somme, France',
        addresstype: 'county',
        geojson: { type: 'Polygon', coordinates: [] },
      },
      {
        place_id: 4,
        display_name: 'Lille, France',
        extratags: { admin_level: '8' },
        type: 'state',
        geojson: { type: 'Polygon', coordinates: [] },
      },
      { place_id: 5, display_name: 'Some Place, Y', geojson: { type: 'Polygon', coordinates: [] } },
    ]);

    const items = await result;
    expect(items.map((i) => [i.osmId, i.name, i.adminLevel, i.boundaryType])).toEqual([
      [2, 'Bayern', 4, 'state'],
      [3, 'Somme', 6, 'administrative'],
      [4, 'Lille', 8, 'state'],
      [5, 'Some Place', 8, 'administrative'],
    ]);
  });

  it('returns an empty array when Nominatim also fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = firstValueFrom(service.searchBoundaries('Down'));

    httpMock.expectOne('/api/boundaries/search?query=Down').error(new ProgressEvent('offline'));
    expectNominatim().error(new ProgressEvent('offline'));

    expect(await result).toEqual([]);
  });
});

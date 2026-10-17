import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideTestHttp } from '../../testing/http';
import { NominatimService } from './nominatim.service';

describe('NominatimService', () => {
  let service: NominatimService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestHttp() });
    service = TestBed.inject(NominatimService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('queries Nominatim with the query string and maps the results', async () => {
    const result = firstValueFrom(service.searchLocations('Eiffel Tower'));

    const req = httpMock.expectOne((r) =>
      r.urlWithParams.startsWith('https://nominatim.openstreetmap.org/search?q=Eiffel%20Tower&format=json'),
    );
    expect(req.request.headers.get('Accept-Language')).toBe('en');
    req.flush([{ place_id: 12345, display_name: 'Eiffel Tower, Paris, France', lat: '48.8584', lon: '2.2945' }]);

    expect(await result).toEqual([
      { id: 12345, displayName: 'Eiffel Tower, Paris, France', lat: 48.8584, lon: 2.2945 },
    ]);
  });

  it('returns an empty array when the query is empty or whitespace', async () => {
    expect(await firstValueFrom(service.searchLocations('   '))).toEqual([]);
  });

  it('handles API errors gracefully without throwing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = firstValueFrom(service.searchLocations('Paris'));

    httpMock
      .expectOne((r) => r.url.startsWith('https://nominatim.openstreetmap.org/search'))
      .error(new ProgressEvent('Network error'));

    expect(await result).toEqual([]);
  });
});

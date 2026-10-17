import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth.interceptor';
import { TokenStorage } from './token-storage';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokens: TokenStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenStorage);
  });

  afterEach(() => httpMock.verify());

  it('adds the Bearer token to /api requests', () => {
    tokens.set('jwt-1');
    http.get('/api/modifications').subscribe();

    const req = httpMock.expectOne('/api/modifications');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-1');
    req.flush([]);
  });

  it('does not add a header when there is no token', () => {
    http.get('/api/modifications').subscribe();

    const req = httpMock.expectOne('/api/modifications');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it.each(['/api/auth/login', '/api/auth/register'])('never sends the token to %s', (url) => {
    tokens.set('jwt-1');
    http.post(url, {}).subscribe();

    const req = httpMock.expectOne(url);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('never leaks the token to third-party hosts', () => {
    tokens.set('jwt-1');
    http.get('https://nominatim.openstreetmap.org/search?q=x').subscribe();

    const req = httpMock.expectOne((r) => r.url.startsWith('https://nominatim.openstreetmap.org'));
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });
});

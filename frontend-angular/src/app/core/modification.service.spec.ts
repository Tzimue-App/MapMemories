import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideTestHttp } from '../../testing/http';
import { Modification } from '../models/modification';
import { ModificationService } from './modification.service';
import { TokenStorage } from './token-storage';

describe('ModificationService', () => {
  let service: ModificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestHttp() });
    service = TestBed.inject(ModificationService);
    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(TokenStorage).set('valid-token');
  });

  afterEach(() => httpMock.verify());

  it('fetches modifications with the Authorization header', async () => {
    const mods: Modification[] = [{ id: 1, type: 'PIN', title: 'Home Pin', lat: 48.85, lng: 2.35, color: '#ff0000' }];
    const result = firstValueFrom(service.getModifications());

    const req = httpMock.expectOne('/api/modifications');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
    req.flush(mods);

    expect(await result).toEqual(mods);
  });

  it('returns an empty list without calling the API when there is no token', async () => {
    TestBed.inject(TokenStorage).clear();
    expect(await firstValueFrom(service.getModifications())).toEqual([]);
    httpMock.expectNone('/api/modifications');
  });

  it('saves a modification', async () => {
    const newMod = {
      type: 'RADIUS' as const,
      title: 'Radius Zone',
      lat: 48.85,
      lng: 2.35,
      radiusMeters: 500,
      color: '#00ff00',
    };
    const result = firstValueFrom(service.saveModification(newMod));

    const req = httpMock.expectOne('/api/modifications');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newMod);
    req.flush({ ...newMod, id: 10 });

    expect(await result).toEqual({ ...newMod, id: 10 });
  });

  it('deletes a modification', async () => {
    const result = firstValueFrom(service.deleteModification(10));

    const req = httpMock.expectOne('/api/modifications/10');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
    req.flush(null);

    await expect(result).resolves.toBeNull();
  });
});

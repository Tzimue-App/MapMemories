import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideTestHttp } from '../../testing/http';
import { NoteService } from './note.service';
import { TokenStorage } from './token-storage';

describe('NoteService', () => {
  let service: NoteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestHttp() });
    service = TestBed.inject(NoteService);
    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(TokenStorage).set('test-token');
  });

  afterEach(() => httpMock.verify());

  it('creates a note with the Authorization header', async () => {
    const note = { id: 5, modificationId: 10, content: 'Hello memory note', createdAt: '2026-10-02T12:00:00Z' };
    const result = firstValueFrom(service.createNote(10, 'Hello memory note'));

    const req = httpMock.expectOne('/api/modifications/10/notes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'Hello memory note' });
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush(note);

    expect(await result).toEqual(note);
  });

  it('fetches notes for a modification', async () => {
    const notes = [{ id: 5, modificationId: 10, content: 'Note 1', createdAt: '2026-10-02' }];
    const result = firstValueFrom(service.getNotes(10));

    httpMock.expectOne('/api/modifications/10/notes').flush(notes);

    expect(await result).toEqual(notes);
  });

  it('deletes a note', () => {
    service.deleteNote(10, 5).subscribe();

    const req = httpMock.expectOne('/api/modifications/10/notes/5');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush(null);
  });
});

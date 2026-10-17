import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideTestHttp } from '../../testing/http';
import { PhotoItem } from '../models/media';
import { MediaService } from './media.service';
import { TokenStorage } from './token-storage';

describe('MediaService', () => {
  let service: MediaService;
  let httpMock: HttpTestingController;

  const photo: PhotoItem = {
    id: 1,
    modificationId: 10,
    originalFilename: 'test.jpg',
    contentType: 'image/jpeg',
    size: 1024,
    caption: 'Test Photo',
    contentUrl: '/api/photos/1/content',
    createdAt: '2026-10-02T12:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestHttp() });
    service = TestBed.inject(MediaService);
    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(TokenStorage).set('test-jwt-token');
  });

  afterEach(() => httpMock.verify());

  it('uploads a photo as multipart FormData (file + caption) with the Authorization header', async () => {
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const result = firstValueFrom(service.uploadPhoto(10, file, 'Test Photo'));

    const req = httpMock.expectOne('/api/modifications/10/photos');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
    expect(req.request.headers.has('Content-Type')).toBe(false);
    const body = req.request.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect((body.get('file') as File).name).toBe('test.jpg');
    expect(body.get('caption')).toBe('Test Photo');
    req.flush(photo);

    expect(await result).toEqual(photo);
  });

  it('omits the caption field when no caption is given', () => {
    service.uploadPhoto(10, new File(['x'], 'a.png', { type: 'image/png' })).subscribe();

    const req = httpMock.expectOne('/api/modifications/10/photos');
    expect((req.request.body as FormData).has('caption')).toBe(false);
    req.flush(photo);
  });

  it('fetches the photo list for a modification', async () => {
    const result = firstValueFrom(service.getPhotos(10));

    const req = httpMock.expectOne('/api/modifications/10/photos');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
    req.flush([photo]);

    expect(await result).toEqual([photo]);
  });

  it('deletes a photo', () => {
    service.deletePhoto(10, 1).subscribe();

    const req = httpMock.expectOne('/api/modifications/10/photos/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('fetches photo content as a blob with the Authorization header', async () => {
    const blob = new Blob(['image binary content'], { type: 'image/jpeg' });
    const result = firstValueFrom(service.getPhotoBlob('/api/photos/1/content'));

    const req = httpMock.expectOne('/api/photos/1/content');
    expect(req.request.responseType).toBe('blob');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
    req.flush(blob);

    expect(await result).toBe(blob);
  });
});

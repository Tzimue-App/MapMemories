import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mediaService } from './mediaService';
import { authService } from './authService';

describe('mediaService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('uploads photo using multipart FormData and Authorization header', async () => {
    authService.setToken('test-jwt-token');
    const mockPhoto = {
      id: 1,
      modificationId: 10,
      originalFilename: 'test.jpg',
      contentType: 'image/jpeg',
      size: 1024,
      caption: 'Test Photo',
      contentUrl: '/api/photos/1/content',
      createdAt: '2026-10-02T12:00:00Z',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockPhoto,
    } as Response);

    const dummyFile = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const result = await mediaService.uploadPhoto(10, dummyFile, 'Test Photo');

    expect(result).toEqual(mockPhoto);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/modifications/10/photos',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-jwt-token' }),
        body: expect.any(FormData),
      })
    );
  });

  it('fetches photo list for a modification', async () => {
    authService.setToken('test-jwt-token');
    const mockList = [
      {
        id: 1,
        modificationId: 10,
        originalFilename: 'test.jpg',
        contentType: 'image/jpeg',
        size: 1024,
        caption: 'Cap',
        contentUrl: '/api/photos/1/content',
        createdAt: '2026-10-02T12:00:00Z',
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockList,
    } as Response);

    const photos = await mediaService.getPhotos(10);
    expect(photos).toEqual(mockList);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/modifications/10/photos',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-jwt-token' }),
      })
    );
  });

  it('deletes photo for a modification', async () => {
    authService.setToken('test-jwt-token');
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
    } as Response);

    await mediaService.deletePhoto(10, 1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/modifications/10/photos/1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ Authorization: 'Bearer test-jwt-token' }),
      })
    );
  });

  it('fetches photo content as blob with Authorization header', async () => {
    authService.setToken('test-jwt-token');
    const mockBlob = new Blob(['image binary content'], { type: 'image/jpeg' });
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    } as Response);

    const result = await mediaService.getPhotoBlob('/api/photos/1/content');
    expect(result).toBe(mockBlob);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/photos/1/content',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-jwt-token' }),
      })
    );
  });
});

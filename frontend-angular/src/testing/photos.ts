import { PhotoItem } from '../app/models/media';

export const photo = (id: number, caption = '', originalFilename = `photo-${id}.jpg`): PhotoItem => ({
  id,
  modificationId: 10,
  originalFilename,
  contentType: 'image/jpeg',
  size: 1024 * id,
  caption,
  contentUrl: `/api/photos/${id}/content`,
  createdAt: '2026-10-10T12:00:00Z',
});

import { PhotoItem } from '../types/media';
import { authService } from './authService';

export const mediaService = {
  async uploadPhoto(modificationId: number, file: File, caption?: string): Promise<PhotoItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) {
      formData.append('caption', caption);
    }

    const token = authService.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/modifications/${modificationId}/photos`, {
      method: 'POST',
      headers: headers as HeadersInit,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to upload photo');
    }

    return response.json();
  },

  async getPhotos(modificationId: number): Promise<PhotoItem[]> {
    const token = authService.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/modifications/${modificationId}/photos`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch photos');
    }

    return response.json();
  },

  async deletePhoto(modificationId: number, photoId: number): Promise<void> {
    const token = authService.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/modifications/${modificationId}/photos/${photoId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to delete photo');
    }
  },

  async getPhotoBlob(contentUrl: string): Promise<Blob> {
    const token = authService.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(contentUrl, { headers });
    if (!response.ok) {
      throw new Error('Failed to fetch photo content');
    }

    return response.blob();
  },
};

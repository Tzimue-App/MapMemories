import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PhotoItem } from '../models/media';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);

  uploadPhoto(modificationId: number, file: File, caption?: string): Observable<PhotoItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) {
      formData.append('caption', caption);
    }
    // No explicit Content-Type: the browser sets the multipart boundary.
    return this.http.post<PhotoItem>(`/api/modifications/${modificationId}/photos`, formData);
  }

  getPhotos(modificationId: number): Observable<PhotoItem[]> {
    return this.http.get<PhotoItem[]>(`/api/modifications/${modificationId}/photos`);
  }

  deletePhoto(modificationId: number, photoId: number): Observable<void> {
    return this.http.delete<void>(`/api/modifications/${modificationId}/photos/${photoId}`);
  }

  getPhotoBlob(contentUrl: string): Observable<Blob> {
    return this.http.get(contentUrl, { responseType: 'blob' });
  }
}

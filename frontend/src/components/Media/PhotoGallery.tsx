import React, { useState } from 'react';
import { PhotoItem } from '../../types/media';
import { PhotoLightbox } from './PhotoLightbox';
import { AuthImage } from './AuthImage';

interface PhotoGalleryProps {
  photos: PhotoItem[];
  onDeletePhoto?: (photoId: number) => Promise<void>;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, onDeletePhoto }) => {
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null);

  if (photos.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-slate-400">
        No photos attached yet.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2" data-testid="photo-gallery">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative h-24 rounded border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer"
            onClick={() => setActivePhoto(photo)}
          >
            <AuthImage
              src={photo.contentUrl}
              alt={photo.caption || photo.originalFilename}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            {onDeletePhoto && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePhoto(photo.id);
                }}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white rounded p-1 text-[10px] transition-opacity"
                title="Delete Photo"
              >
                ✕
              </button>
            )}
            {photo.caption && (
              <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[10px] p-1 truncate">
                {photo.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      <PhotoLightbox photo={activePhoto} onClose={() => setActivePhoto(null)} />
    </>
  );
};

import React, { useState } from 'react';
import { PhotoItem } from '../../types/media';
import { AuthImage } from '../Media/AuthImage';
import { PhotoLightbox } from '../Media/PhotoLightbox';

interface PhotoCarouselProps {
  photos: PhotoItem[];
}

export const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ photos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);

  if (!photos || photos.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
        ?? No photos attached to this memory yet.
      </div>
    );
  }

  const currentPhoto = photos[currentIndex] || photos[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Main Image Stage */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-950 border border-gray-200 dark:border-gray-700 group">
        <AuthImage
          src={currentPhoto.contentUrl}
          alt={currentPhoto.caption || currentPhoto.originalFilename}
          className="w-full h-full object-contain cursor-pointer transition-transform duration-200 group-hover:scale-[1.02]"
          onClick={() => setLightboxPhoto(currentPhoto)}
        />

        {/* Counter Badge */}
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-900/80 text-white backdrop-blur-sm">
          {currentIndex + 1} / {photos.length}
        </span>

        {/* Navigation arrows (if > 1 photo) */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 text-xs shadow-md"
            >
              ?
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 text-xs shadow-md"
            >
              ?
            </button>
          </>
        )}

        {/* Caption bar */}
        {currentPhoto.caption && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-4 text-white text-xs truncate">
            {currentPhoto.caption}
          </div>
        )}
      </div>

      {/* Thumbnail Bar */}
      {photos.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto py-1">
          {photos.map((photo, idx) => (
            <button
              key={photo.id}
              type="button"
              aria-label={`Thumbnail ${idx + 1}`}
              onClick={() => setCurrentIndex(idx)}
              className={`relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? 'border-blue-500 scale-105 shadow-sm'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <AuthImage
                src={photo.contentUrl}
                alt={photo.caption || photo.originalFilename}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal on Image click */}
      <PhotoLightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
    </div>
  );
};

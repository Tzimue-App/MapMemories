import React from 'react';
import { PhotoItem } from '../../types/media';
import { AuthImage } from './AuthImage';

interface PhotoLightboxProps {
  photo: PhotoItem | null;
  onClose: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ photo, onClose }) => {
  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" data-testid="photo-lightbox">
      <div className="relative max-w-4xl w-full bg-slate-900 text-white rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-3 border-b border-slate-800">
          <div className="text-sm font-semibold truncate pr-4">
            {photo.caption || photo.originalFilename}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors text-lg"
            data-testid="lightbox-close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center bg-black p-2 overflow-hidden">
          <AuthImage
            src={photo.contentUrl}
            alt={photo.caption || photo.originalFilename}
            className="max-h-[70vh] max-w-full object-contain"
          />
        </div>
        {photo.caption && (
          <div className="p-3 bg-slate-800 text-xs text-slate-300 border-t border-slate-700">
            {photo.caption}
          </div>
        )}
      </div>
    </div>
  );
};

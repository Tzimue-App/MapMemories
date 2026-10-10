import { useState, useEffect } from 'react';
import { mediaService } from '../../services/mediaService';

/**
 * Fetches an image from an authenticated endpoint and returns a blob URL.
 * Browser <img> tags can't attach Authorization headers, so this hook
 * fetches the image via fetch() with the JWT token and creates an object URL.
 */
export function useAuthImage(src: string | undefined | null): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setBlobUrl(null);
      return;
    }

    if (src.startsWith('blob:') || src.startsWith('data:')) {
      setBlobUrl(src);
      return;
    }

    let revoked = false;
    let objectUrl: string | null = null;

    const fetchImage = async () => {
      try {
        const blob = await mediaService.getPhotoBlob(src);
        if (revoked) return;

        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch {
        if (!revoked) setBlobUrl(null);
      }
    };

    fetchImage();

    return () => {
      revoked = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  return blobUrl;
}

import React from 'react';
import { useAuthImage } from './useAuthImage';

export interface AuthImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallback?: React.ReactNode;
}

export const AuthImage: React.FC<AuthImageProps> = ({
  src,
  alt,
  className,
  fallback,
  ...props
}) => {
  const blobUrl = useAuthImage(src);

  if (!blobUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-200 dark:bg-slate-700 ${className || ''}`}
        aria-label={alt || 'Image loading'}
        role="img"
      >
        {fallback || (
          <span className="text-[10px] text-slate-400">Loading...</span>
        )}
      </div>
    );
  }

  return <img src={blobUrl} alt={alt} className={className} {...props} />;
};

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PhotoLightbox } from './PhotoLightbox';
import { PhotoItem } from '../../types/media';

vi.mock('./AuthImage', () => ({
  AuthImage: ({ src, alt }: { src: string; alt?: string }) => (
    <img src={src} alt={alt} data-testid="mock-lightbox-image" />
  ),
}));

describe('PhotoLightbox Component', () => {
  const photo: PhotoItem = {
    id: 1,
    modificationId: 10,
    originalFilename: 'landscape.png',
    contentType: 'image/png',
    size: 5000,
    caption: 'Mountain View',
    contentUrl: '/api/photos/1/content',
    createdAt: '2026-10-01T09:00:00Z',
  };

  it('renders nothing when photo is null', () => {
    const { container } = render(<PhotoLightbox photo={null} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders lightbox with AuthImage and calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<PhotoLightbox photo={photo} onClose={onClose} />);

    expect(screen.getByTestId('photo-lightbox')).toBeInTheDocument();
    const img = screen.getByTestId('mock-lightbox-image');
    expect(img).toHaveAttribute('src', '/api/photos/1/content');
    expect(img).toHaveAttribute('alt', 'Mountain View');

    fireEvent.click(screen.getByTestId('lightbox-close'));
    expect(onClose).toHaveBeenCalled();
  });
});

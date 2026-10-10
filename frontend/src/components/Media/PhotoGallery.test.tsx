import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PhotoGallery } from './PhotoGallery';
import { PhotoItem } from '../../types/media';

vi.mock('./AuthImage', () => ({
  AuthImage: ({ src, alt }: { src: string; alt?: string }) => (
    <img src={src} alt={alt} data-testid="mock-auth-image" />
  ),
}));

describe('PhotoGallery Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockPhotos: PhotoItem[] = [
    {
      id: 1,
      modificationId: 10,
      originalFilename: 'sunset.jpg',
      contentType: 'image/jpeg',
      size: 1024,
      caption: 'Beautiful Sunset',
      contentUrl: '/api/photos/1/content',
      createdAt: '2026-10-01T10:00:00Z',
    },
    {
      id: 2,
      modificationId: 10,
      originalFilename: 'mountain.jpg',
      contentType: 'image/jpeg',
      size: 2048,
      caption: '',
      contentUrl: '/api/photos/2/content',
      createdAt: '2026-10-02T10:00:00Z',
    },
  ];

  it('renders empty message when no photos', () => {
    render(<PhotoGallery photos={[]} />);
    expect(screen.getByText(/No photos attached yet/i)).toBeInTheDocument();
  });

  it('renders photos with AuthImage and captions', () => {
    render(<PhotoGallery photos={mockPhotos} />);

    const images = screen.getAllByTestId('mock-auth-image');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', '/api/photos/1/content');
    expect(images[0]).toHaveAttribute('alt', 'Beautiful Sunset');
    expect(screen.getByText('Beautiful Sunset')).toBeInTheDocument();
  });

  it('calls onDeletePhoto when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<PhotoGallery photos={mockPhotos} onDeletePhoto={onDelete} />);

    const deleteButtons = screen.getAllByTitle('Delete Photo');
    expect(deleteButtons).toHaveLength(2);

    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});

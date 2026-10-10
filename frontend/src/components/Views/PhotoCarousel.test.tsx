import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PhotoCarousel } from './PhotoCarousel';
import { PhotoItem } from '../../types/media';

describe('PhotoCarousel Component', () => {
  const mockPhotos: PhotoItem[] = [
    {
      id: 1,
      modificationId: 10,
      originalFilename: 'pic1.jpg',
      contentType: 'image/jpeg',
      size: 1024,
      caption: 'First photo caption',
      contentUrl: '/api/photos/1/content',
      createdAt: '2026-10-10T12:00:00Z',
    },
    {
      id: 2,
      modificationId: 10,
      originalFilename: 'pic2.png',
      contentType: 'image/png',
      size: 2048,
      caption: 'Second photo caption',
      contentUrl: '/api/photos/2/content',
      createdAt: '2026-10-10T12:30:00Z',
    },
  ];

  it('renders fallback when photo list is empty', () => {
    render(<PhotoCarousel photos={[]} />);
    expect(screen.getByText(/no photos attached/i)).toBeInTheDocument();
  });

  it('renders the first photo and counter index', () => {
    render(<PhotoCarousel photos={mockPhotos} />);
    expect(screen.getByText(/first photo caption/i)).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('navigates through photos using next and previous buttons', () => {
    render(<PhotoCarousel photos={mockPhotos} />);

    const nextBtn = screen.getByRole('button', { name: /next photo/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText(/second photo caption/i)).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    const prevBtn = screen.getByRole('button', { name: /previous photo/i });
    fireEvent.click(prevBtn);

    expect(screen.getByText(/first photo caption/i)).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('selects photo when thumbnail is clicked', () => {
    render(<PhotoCarousel photos={mockPhotos} />);

    const thumbnails = screen.getAllByRole('button', { name: /thumbnail/i });
    expect(thumbnails).toHaveLength(2);

    fireEvent.click(thumbnails[1]);
    expect(screen.getByText(/second photo caption/i)).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });
});

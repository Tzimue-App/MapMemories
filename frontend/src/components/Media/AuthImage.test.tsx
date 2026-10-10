import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthImage } from './AuthImage';
import { mediaService } from '../../services/mediaService';

describe('AuthImage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-uuid');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading placeholder initially and replaces with img once blob is loaded', async () => {
    const mockBlob = new Blob(['image-bytes'], { type: 'image/jpeg' });
    vi.spyOn(mediaService, 'getPhotoBlob').mockResolvedValueOnce(mockBlob);

    render(
      <AuthImage
        src="/api/photos/1/content"
        alt="Test photo"
        className="w-10 h-10"
      />
    );

    // Initial state: loading indicator
    expect(screen.getByRole('img', { name: /Test photo/i })).toBeInTheDocument();
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    // After fetch resolves
    await waitFor(() => {
      const img = screen.getByRole('img', { name: /Test photo/i });
      expect(img.tagName.toLowerCase()).toBe('img');
      expect(img).toHaveAttribute('src', 'blob:http://localhost/test-uuid');
      expect(img).toHaveClass('w-10 h-10');
    });

    expect(mediaService.getPhotoBlob).toHaveBeenCalledWith('/api/photos/1/content');
    expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
  });

  it('renders directly without calling getPhotoBlob when src is a blob: URL', async () => {
    const spy = vi.spyOn(mediaService, 'getPhotoBlob');

    render(
      <AuthImage
        src="blob:http://localhost/local-preview"
        alt="Preview photo"
      />
    );

    const img = screen.getByRole('img', { name: /Preview photo/i });
    expect(img.tagName.toLowerCase()).toBe('img');
    expect(img).toHaveAttribute('src', 'blob:http://localhost/local-preview');
    expect(spy).not.toHaveBeenCalled();
  });

  it('renders fallback when getPhotoBlob fails', async () => {
    vi.spyOn(mediaService, 'getPhotoBlob').mockRejectedValueOnce(new Error('Network error'));

    render(
      <AuthImage
        src="/api/photos/999/content"
        alt="Failed photo"
        fallback={<span>Failed to load</span>}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('revokes object URL on unmount', async () => {
    const mockBlob = new Blob(['bytes'], { type: 'image/png' });
    vi.spyOn(mediaService, 'getPhotoBlob').mockResolvedValueOnce(mockBlob);

    const { unmount } = render(
      <AuthImage src="/api/photos/1/content" alt="Cleanup test" />
    );

    await waitFor(() => {
      expect(screen.getByRole('img', { name: /Cleanup test/i }).tagName.toLowerCase()).toBe('img');
    });

    unmount();
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-uuid');
  });
});

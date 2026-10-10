import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DetailSideDrawer } from './DetailSideDrawer';
import { UnifiedMapElement } from '../../types/view';

describe('DetailSideDrawer Component', () => {
  const pinElement: UnifiedMapElement = {
    id: 'pin-10',
    dbId: 10,
    type: 'PIN',
    title: 'Eiffel Tower Visit',
    description: 'Trip to Paris in spring',
    lat: 48.8584,
    lng: 2.2945,
    color: '#3B82F6',
    createdAt: '2026-10-10T12:00:00Z',
    photos: [
      {
        id: 101,
        modificationId: 10,
        originalFilename: 'tower.jpg',
        contentType: 'image/jpeg',
        size: 5000,
        caption: 'Looking up',
        contentUrl: '/api/photos/101/content',
        createdAt: '2026-10-10T12:00:00Z',
      },
    ],
    notes: [
      {
        id: 201,
        modificationId: 10,
        content: 'Remember to book summit tickets early!',
        createdAt: '2026-10-10T12:05:00Z',
      },
    ],
  };

  const circleElement: UnifiedMapElement = {
    id: 'pin-11',
    dbId: 11,
    type: 'RADIUS',
    title: 'Safety Perimeter',
    lat: 48.8584,
    lng: 2.2945,
    radiusMeters: 1000,
    color: '#EF4444',
  };

  const boundaryElement: UnifiedMapElement = {
    id: 'boundary-12',
    dbId: 12,
    type: 'BOUNDARY',
    title: 'Monaco District',
    lat: 43.7384,
    lng: 7.4246,
    color: '#8B5CF6',
    adminLevel: 2,
    geojson: JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [7.41, 43.73],
          [7.43, 43.73],
          [7.43, 43.75],
          [7.41, 43.75],
          [7.41, 43.73],
        ],
      ],
    }),
  };

  it('renders pin details, coordinates, photos carousel, and notes', () => {
    render(
      <DetailSideDrawer
        isOpen={true}
        element={pinElement}
        onClose={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Eiffel Tower Visit')).toBeInTheDocument();
    expect(screen.getByText('Trip to Paris in spring')).toBeInTheDocument();
    expect(screen.getByText(/48.8584° N, 2.2945° E/i)).toBeInTheDocument();
    expect(screen.getByText('Looking up')).toBeInTheDocument();
    expect(screen.getByText('Remember to book summit tickets early!')).toBeInTheDocument();
  });

  it('renders computed area for circle elements', () => {
    render(
      <DetailSideDrawer
        isOpen={true}
        element={circleElement}
        onClose={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // 1000m radius circle area is 3.14 km^2 (or ~3.1 km²)
    expect(screen.getByText(/3.1 km²/i)).toBeInTheDocument();
  });

  it('renders computed polygon area for boundary elements', () => {
    render(
      <DetailSideDrawer
        isOpen={true}
        element={boundaryElement}
        onClose={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/Surface Area/i)).toBeInTheDocument();
    expect(screen.getByText(/Level 2/i)).toBeInTheDocument();
  });

  it('triggers onDelete when delete button is confirmed', () => {
    const onDelete = vi.fn();
    render(
      <DetailSideDrawer
        isOpen={true}
        element={pinElement}
        onClose={vi.fn()}
        onDelete={onDelete}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /delete memory/i });
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledWith(pinElement);
  });
});

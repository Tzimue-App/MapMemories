import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MapView } from './MapView';
import { PinItem } from '../../types/pin';
import { SavedBoundaryItem } from '../../types/boundary';
import { AuthProvider } from '../../context/AuthContext';

describe('MapView Component', () => {
  it('renders Leaflet map container element', () => {
    const { container } = render(<MapView center={[48.8566, 2.3522]} zoom={13} />);
    const mapElement = container.querySelector('.leaflet-container');
    expect(mapElement).toBeInTheDocument();
  });

  it('displays OpenStreetMap tile layer attribution', () => {
    render(<MapView center={[48.8566, 2.3522]} zoom={13} />);
    const attributionLink = screen.getByRole('link', { name: /OpenStreetMap/i });
    expect(attributionLink).toBeInTheDocument();
  });

  it('renders markers and circles for provided pins', () => {
    const mockPins: PinItem[] = [
      {
        id: 'pin-1',
        lat: 48.8566,
        lng: 2.3522,
        radiusMeters: 1000,
        color: '#3B82F6',
        label: 'Test Pin 1',
      },
    ];

    const { container } = render(
      <AuthProvider>
        <MapView center={[48.8566, 2.3522]} zoom={13} initialPins={mockPins} />
      </AuthProvider>
    );

    const markerElement = container.querySelector('.leaflet-marker-icon');
    expect(markerElement).toBeInTheDocument();

    const circleElement = container.querySelector('path.leaflet-interactive');
    expect(circleElement).toBeInTheDocument();
  });

  it('invokes onElementSelect when a marker is clicked', () => {
    const onElementSelect = vi.fn();
    const mockPins: PinItem[] = [
      {
        id: 'pin-1',
        dbId: 1,
        lat: 48.8566,
        lng: 2.3522,
        radiusMeters: 0,
        color: '#3B82F6',
        label: 'Selectable Pin',
      },
    ];

    const { container } = render(
      <AuthProvider>
        <MapView center={[48.8566, 2.3522]} zoom={13} initialPins={mockPins} onElementSelect={onElementSelect} />
      </AuthProvider>
    );

    const markerElement = container.querySelector('.leaflet-marker-icon');
    expect(markerElement).toBeInTheDocument();

    if (markerElement) {
      fireEvent.click(markerElement);
    }
    expect(onElementSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'pin-1',
        type: 'PIN',
        title: 'Selectable Pin',
      })
    );
  });

  it('updates markers when initialPins is updated to empty array', () => {
    const mockPins: PinItem[] = [
      {
        id: 'pin-1',
        lat: 48.8566,
        lng: 2.3522,
        radiusMeters: 1000,
        color: '#3B82F6',
      },
    ];

    const { container, rerender } = render(
      <AuthProvider>
        <MapView center={[48.8566, 2.3522]} zoom={13} initialPins={mockPins} />
      </AuthProvider>
    );
    expect(container.querySelector('.leaflet-marker-icon')).toBeInTheDocument();

    // Rerender with empty initialPins
    rerender(
      <AuthProvider>
        <MapView center={[48.8566, 2.3522]} zoom={13} initialPins={[]} />
      </AuthProvider>
    );
    expect(container.querySelector('.leaflet-marker-icon')).not.toBeInTheDocument();
  });

  it('renders saved administrative boundaries', () => {
    const savedBoundaries: SavedBoundaryItem[] = [
      {
        id: 'b-1',
        osmId: 100,
        name: 'Belgium',
        displayName: 'Kingdom of Belgium',
        boundaryType: 'administrative',
        adminLevel: 2,
        geojson: '{"type":"Polygon","coordinates":[[[4.0,50.0],[5.0,50.0],[5.0,51.0],[4.0,51.0],[4.0,50.0]]]}',
        color: '#10b981',
      },
    ];

    const { container } = render(
      <MapView center={[48.8566, 2.3522]} zoom={13} savedBoundaries={savedBoundaries} />
    );

    const boundarySvg = container.querySelector('path.leaflet-interactive');
    expect(boundarySvg).toBeInTheDocument();
  });

  it('does not render circle element when radius is set to 0 or disabled', () => {
    const disabledRadiusPins: PinItem[] = [
      {
        id: 'pin-disabled',
        lat: 48.8566,
        lng: 2.3522,
        radiusMeters: 0,
        radiusDisabled: true,
        color: '#3B82F6',
      },
    ];

    const { container } = render(
      <AuthProvider>
        <MapView center={[48.8566, 2.3522]} zoom={13} initialPins={disabledRadiusPins} />
      </AuthProvider>
    );

    const markerElement = container.querySelector('.leaflet-marker-icon');
    expect(markerElement).toBeInTheDocument();

    const circleElement = container.querySelector('path.leaflet-interactive');
    expect(circleElement).not.toBeInTheDocument();
  });

  it('allows adding pins when map is clicked', () => {
    const onPinsChange = vi.fn();
    const { container } = render(
      <MapView center={[48.8566, 2.3522]} zoom={13} onPinsChange={onPinsChange} />
    );

    const mapContainer = container.querySelector('.leaflet-container');
    expect(mapContainer).toBeInTheDocument();

    if (mapContainer) {
      fireEvent.click(mapContainer);
    }

    expect(onPinsChange).toHaveBeenCalled();
  });

  describe('marker clustering', () => {
    const colocatedPins = (count: number, radiusMeters = 0): PinItem[] =>
      Array.from({ length: count }, (_, i) => ({
        id: `pin-${i}`,
        lat: 48.8566,
        lng: 2.3522,
        radiusMeters,
        color: '#3B82F6',
      }));

    it('groups overlapping markers into a single cluster showing their count', () => {
      const { container } = render(
        <MapView center={[48.8566, 2.3522]} zoom={13} initialPins={colocatedPins(5)} />
      );

      const clusters = container.querySelectorAll('.remembermap-cluster');
      expect(clusters).toHaveLength(1);
      expect(clusters[0]).toHaveTextContent('5');
      expect(container.querySelectorAll('.custom-pin-marker')).toHaveLength(0);
    });

    it('keeps radius circles visible for pins hidden inside a cluster', () => {
      const { container } = render(
        <MapView center={[48.8566, 2.3522]} zoom={13} initialPins={colocatedPins(3, 500)} />
      );

      expect(container.querySelectorAll('.remembermap-cluster')).toHaveLength(1);
      expect(container.querySelectorAll('path.leaflet-interactive')).toHaveLength(3);
    });

    it('updates the cluster count when pins are removed', () => {
      const { container, rerender } = render(
        <MapView center={[48.8566, 2.3522]} zoom={13} initialPins={colocatedPins(4)} />
      );
      expect(container.querySelector('.remembermap-cluster')).toHaveTextContent('4');

      rerender(<MapView center={[48.8566, 2.3522]} zoom={13} initialPins={colocatedPins(3)} />);
      expect(container.querySelector('.remembermap-cluster')).toHaveTextContent('3');
    });
  });

  describe('mobile-friendly controls', () => {
    it('places the zoom control bottom-right, clear of the search header overlay', () => {
      const { container } = render(<MapView center={[48.8566, 2.3522]} zoom={13} />);
      expect(container.querySelector('.leaflet-bottom.leaflet-right .leaflet-control-zoom')).toBeInTheDocument();
      expect(container.querySelector('.leaflet-top.leaflet-left .leaflet-control-zoom')).not.toBeInTheDocument();
    });
  });
});

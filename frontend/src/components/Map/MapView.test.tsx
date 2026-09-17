import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MapView } from './MapView';
import { PinItem } from '../../types/pin';

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

    const { container } = render(<MapView center={[48.8566, 2.3522]} zoom={13} initialPins={mockPins} />);

    // Marker container or leaflet-marker-icon should be present
    const markerElement = container.querySelector('.leaflet-marker-icon');
    expect(markerElement).toBeInTheDocument();

    // Circle SVG element should be present
    const circleElement = container.querySelector('path.leaflet-interactive');
    expect(circleElement).toBeInTheDocument();
  });

  it('does not render circle element when radius is set to 0 or disabled, but leaves pin marker visible', () => {
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
      <MapView center={[48.8566, 2.3522]} zoom={13} initialPins={disabledRadiusPins} />
    );

    // Marker must still be rendered
    const markerElement = container.querySelector('.leaflet-marker-icon');
    expect(markerElement).toBeInTheDocument();

    // Circle SVG element must NOT be rendered
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
});

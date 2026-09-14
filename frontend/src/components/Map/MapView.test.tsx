import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MapView } from './MapView';

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
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddressSearch } from './AddressSearch';
import * as nominatimService from '../../services/nominatimService';

vi.mock('../../services/nominatimService');

describe('AddressSearch Component', () => {
  const mockOnSelectLocation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input field with placeholder', () => {
    render(<AddressSearch onSelectLocation={mockOnSelectLocation} />);
    const input = screen.getByPlaceholderText(/search address or place.../i);
    expect(input).toBeInTheDocument();
  });

  it('triggers search and renders suggestion list on typing', async () => {
    const mockResults = [
      { id: 1, displayName: 'Paris, France', lat: 48.8566, lon: 2.3522 },
      { id: 2, displayName: 'Paris, Texas, USA', lat: 33.6609, lon: -95.5555 },
    ];

    vi.spyOn(nominatimService, 'searchLocations').mockResolvedValue(mockResults);

    render(<AddressSearch onSelectLocation={mockOnSelectLocation} />);
    const input = screen.getByPlaceholderText(/search address or place.../i);

    fireEvent.change(input, { target: { value: 'Paris' } });

    await waitFor(() => {
      expect(nominatimService.searchLocations).toHaveBeenCalledWith('Paris');
      expect(screen.getByText('Paris, France')).toBeInTheDocument();
      expect(screen.getByText('Paris, Texas, USA')).toBeInTheDocument();
    });
  });

  it('invokes onSelectLocation callback when a suggestion is clicked', async () => {
    const mockResults = [
      { id: 1, displayName: 'Lyon, France', lat: 45.764, lon: 4.8357 },
    ];

    vi.spyOn(nominatimService, 'searchLocations').mockResolvedValue(mockResults);

    render(<AddressSearch onSelectLocation={mockOnSelectLocation} />);
    const input = screen.getByPlaceholderText(/search address or place.../i);

    fireEvent.change(input, { target: { value: 'Lyon' } });

    const suggestion = await screen.findByText('Lyon, France');
    fireEvent.click(suggestion);

    expect(mockOnSelectLocation).toHaveBeenCalledWith({
      id: 1,
      displayName: 'Lyon, France',
      lat: 45.764,
      lon: 4.8357,
    });
  });

  it('shows no results message when search returns empty array', async () => {
    vi.spyOn(nominatimService, 'searchLocations').mockResolvedValue([]);

    render(<AddressSearch onSelectLocation={mockOnSelectLocation} />);
    const input = screen.getByPlaceholderText(/search address or place.../i);

    fireEvent.change(input, { target: { value: 'NonexistentPlace12345' } });

    await waitFor(() => {
      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    });
  });
});

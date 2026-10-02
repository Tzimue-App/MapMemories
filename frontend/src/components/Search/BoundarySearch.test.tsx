import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BoundarySearch } from './BoundarySearch';
import * as boundaryService from '../../services/boundaryService';

vi.mock('../../services/boundaryService');

describe('BoundarySearch Component', () => {
  const onSelectBoundary = vi.fn();
  const onClearBoundary = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('triggers search and renders suggestions list on typing', async () => {
    const mockBoundaries = [
      {
        osmId: 101,
        name: 'Occitanie',
        displayName: 'Occitanie, France',
        boundaryType: 'administrative',
        adminLevel: 4,
        geojson: '{"type":"Polygon"}',
      },
    ];

    vi.spyOn(boundaryService, 'searchBoundaries').mockResolvedValue(mockBoundaries);

    render(
      <BoundarySearch onSelectBoundary={onSelectBoundary} onClearBoundary={onClearBoundary} />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Occitanie' } });

    // Advance past the 300ms debounce timer
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(screen.getByText('Occitanie')).toBeInTheDocument();
      expect(screen.getByText('Region')).toBeInTheDocument();
    });
  });

  it('invokes onSelectBoundary when a result is clicked', async () => {
    const mockBoundaries = [
      {
        osmId: 102,
        name: 'Toulouse',
        displayName: 'Toulouse, France',
        boundaryType: 'administrative',
        adminLevel: 8,
        geojson: '{"type":"Polygon"}',
      },
    ];

    vi.spyOn(boundaryService, 'searchBoundaries').mockResolvedValue(mockBoundaries);

    render(
      <BoundarySearch onSelectBoundary={onSelectBoundary} onClearBoundary={onClearBoundary} />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Toulouse' } });

    // Advance past the 300ms debounce timer
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(screen.getByText('Toulouse')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Toulouse'));

    expect(onSelectBoundary).toHaveBeenCalledWith(mockBoundaries[0]);
  });
});

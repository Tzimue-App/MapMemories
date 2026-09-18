import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoundaryConfigPanel } from './BoundaryConfigPanel';
import { SavedBoundaryItem } from '../../types/boundary';

describe('BoundaryConfigPanel Component', () => {
  const mockBoundary: SavedBoundaryItem = {
    id: 'boundary-1',
    osmId: 101,
    name: 'France',
    displayName: 'France (Metropolitan)',
    boundaryType: 'administrative',
    adminLevel: 2,
    geojson: '{"type":"Polygon"}',
    color: '#8b5cf6',
  };

  const onColorChange = vi.fn();
  const onDelete = vi.fn();

  it('renders boundary details and color choices', () => {
    render(
      <BoundaryConfigPanel
        boundary={mockBoundary}
        onColorChange={onColorChange}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('France')).toBeInTheDocument();
    expect(screen.getByText('Country')).toBeInTheDocument();
    expect(screen.getByLabelText('Red')).toBeInTheDocument();
  });

  it('triggers onColorChange when a color button is clicked', () => {
    render(
      <BoundaryConfigPanel
        boundary={mockBoundary}
        onColorChange={onColorChange}
        onDelete={onDelete}
      />
    );

    const redButton = screen.getByLabelText('Red');
    fireEvent.click(redButton);

    expect(onColorChange).toHaveBeenCalledWith('#ef4444');
  });

  it('triggers onDelete when delete button is clicked', () => {
    render(
      <BoundaryConfigPanel
        boundary={mockBoundary}
        onColorChange={onColorChange}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete boundary/i });
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith('boundary-1');
  });
});

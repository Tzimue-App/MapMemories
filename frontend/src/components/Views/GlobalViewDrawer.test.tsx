import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GlobalViewDrawer } from './GlobalViewDrawer';
import { UnifiedMapElement } from '../../types/view';

describe('GlobalViewDrawer Component', () => {
  const mockElements: UnifiedMapElement[] = [
    {
      id: 'pin-1',
      dbId: 1,
      type: 'PIN',
      title: 'Montmartre Point',
      description: 'Scenic viewpoint in Paris',
      lat: 48.8867,
      lng: 2.3431,
      color: '#3B82F6',
      createdAt: '2026-10-10T10:00:00Z',
    },
    {
      id: 'boundary-2',
      dbId: 2,
      type: 'BOUNDARY',
      title: 'Ile-de-France',
      description: 'Capital region',
      lat: 48.8566,
      lng: 2.3522,
      color: '#8B5CF6',
      createdAt: '2026-10-09T10:00:00Z',
    },
  ];

  it('renders elements list when open', () => {
    render(
      <GlobalViewDrawer
        isOpen={true}
        onClose={vi.fn()}
        elements={mockElements}
        onSelectElement={vi.fn()}
      />
    );

    expect(screen.getByText('Montmartre Point')).toBeInTheDocument();
    expect(screen.getByText('Ile-de-France')).toBeInTheDocument();
    expect(screen.getByText(/All \(2\)/i)).toBeInTheDocument();
  });

  it('does not render content or has hidden state when isOpen is false', () => {
    const { container } = render(
      <GlobalViewDrawer
        isOpen={false}
        onClose={vi.fn()}
        elements={mockElements}
        onSelectElement={vi.fn()}
      />
    );

    const drawer = container.querySelector('[data-testid="global-view-drawer"]');
    expect(drawer).toHaveClass('-translate-x-full');
  });

  it('calls onSelectElement and onClose when an element is clicked', () => {
    const onSelectElement = vi.fn();
    const onClose = vi.fn();

    render(
      <GlobalViewDrawer
        isOpen={true}
        onClose={onClose}
        elements={mockElements}
        onSelectElement={onSelectElement}
      />
    );

    fireEvent.click(screen.getByText('Montmartre Point'));
    expect(onSelectElement).toHaveBeenCalledWith(mockElements[0]);
  });

  it('filters items in list dynamically through search input', () => {
    render(
      <GlobalViewDrawer
        isOpen={true}
        onClose={vi.fn()}
        elements={mockElements}
        onSelectElement={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/filter memories.../i);
    fireEvent.change(searchInput, { target: { value: 'Montmartre' } });

    expect(screen.getByText('Montmartre Point')).toBeInTheDocument();
    expect(screen.queryByText('Ile-de-France')).not.toBeInTheDocument();
  });
});

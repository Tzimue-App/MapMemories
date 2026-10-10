import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterToolbar } from './FilterToolbar';
import { FilterCriteria } from '../../types/view';

describe('FilterToolbar Component', () => {
  const initialCriteria: FilterCriteria = {
    type: 'ALL',
    dateRange: 'ALL',
    searchQuery: '',
  };

  it('renders type pills with counts', () => {
    const onChange = vi.fn();
    render(
      <FilterToolbar
        criteria={initialCriteria}
        onChange={onChange}
        counts={{ ALL: 10, PIN: 4, RADIUS: 3, BOUNDARY: 3 }}
      />
    );

    expect(screen.getByText(/All \(10\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Pins \(4\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Circles \(3\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Boundaries \(3\)/i)).toBeInTheDocument();
  });

  it('calls onChange when switching type filter', () => {
    const onChange = vi.fn();
    render(
      <FilterToolbar
        criteria={initialCriteria}
        onChange={onChange}
        counts={{ ALL: 10, PIN: 4, RADIUS: 3, BOUNDARY: 3 }}
      />
    );

    const pinsBtn = screen.getByRole('button', { name: /pins/i });
    fireEvent.click(pinsBtn);

    expect(onChange).toHaveBeenCalledWith({
      ...initialCriteria,
      type: 'PIN',
    });
  });

  it('updates searchQuery and triggers onChange', () => {
    const onChange = vi.fn();
    render(
      <FilterToolbar
        criteria={initialCriteria}
        onChange={onChange}
        counts={{ ALL: 10, PIN: 4, RADIUS: 3, BOUNDARY: 3 }}
      />
    );

    const searchInput = screen.getByPlaceholderText(/filter memories.../i);
    fireEvent.change(searchInput, { target: { value: 'monument' } });

    expect(onChange).toHaveBeenCalledWith({
      ...initialCriteria,
      searchQuery: 'monument',
    });
  });

  it('updates date range filter', () => {
    const onChange = vi.fn();
    render(
      <FilterToolbar
        criteria={initialCriteria}
        onChange={onChange}
        counts={{ ALL: 10, PIN: 4, RADIUS: 3, BOUNDARY: 3 }}
      />
    );

    const select = screen.getByLabelText(/date filter/i);
    fireEvent.change(select, { target: { value: 'WEEK' } });

    expect(onChange).toHaveBeenCalledWith({
      ...initialCriteria,
      dateRange: 'WEEK',
    });
  });
});

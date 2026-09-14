import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the interactive map and search overlay', () => {
    const { container } = render(<App />);
    expect(screen.getByPlaceholderText(/search address or place.../i)).toBeInTheDocument();
    expect(container.querySelector('.leaflet-container')).toBeInTheDocument();
  });
});

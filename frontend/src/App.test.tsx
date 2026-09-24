import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { authService } from './services/authService';
import { modificationService } from './services/modificationService';

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the interactive map, search overlay, and Sign In button', () => {
    const { container } = render(<App />);
    expect(screen.getByPlaceholderText(/search address or place.../i)).toBeInTheDocument();
    expect(container.querySelector('.leaflet-container')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Sign In/i }).length).toBeGreaterThan(0);
  });

  it('opens AuthModal when Sign In button is clicked', async () => {
    render(<App />);

    const signInButtons = screen.getAllByRole('button', { name: /Sign In/i });
    fireEvent.click(signInButtons[0]);

    expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('shows logged in user when token is stored', async () => {
    vi.spyOn(authService, 'getToken').mockReturnValue('valid-token');
    vi.spyOn(authService, 'getMe').mockResolvedValueOnce({ username: 'testuser', email: 'test@example.com' });
    vi.spyOn(modificationService, 'getModifications').mockResolvedValueOnce([]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/👤 testuser/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
    });
  });

  it('resets pins and boundaries on logout', async () => {
    vi.spyOn(authService, 'getToken').mockReturnValue('valid-token');
    vi.spyOn(authService, 'getMe').mockResolvedValueOnce({ username: 'user1', email: 'user1@example.com' });
    vi.spyOn(modificationService, 'getModifications').mockResolvedValueOnce([
      { id: 1, type: 'PIN', title: 'User 1 Pin', lat: 48.85, lng: 2.35 }
    ]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/📍 1 Pin/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));

    await waitFor(() => {
      expect(screen.getByText(/📍 0 Pins/i)).toBeInTheDocument();
    });
  });
});

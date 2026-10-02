import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthModal } from './AuthModal';
import { AuthProvider } from '../../context/AuthContext';
import { authService } from '../../services/authService';

describe('AuthModal Component', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders sign in tab by default', () => {
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={onClose} />
      </AuthProvider>
    );

    expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
  });

  it('switches to Sign Up tab when clicked', () => {
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={onClose} />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
  });

  it('submits login form and calls onClose on success', async () => {
    vi.spyOn(authService, 'login').mockResolvedValueOnce({
      token: 'token123',
      username: 'user1',
      email: 'user1@example.com',
    });

    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={onClose} />
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Username/i), { target: { value: 'user1' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'pass123' } });
    fireEvent.submit(screen.getByTestId('auth-form'));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});

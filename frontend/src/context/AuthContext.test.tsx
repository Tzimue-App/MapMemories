import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { authService } from '../services/authService';

const TestComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{isAuthenticated ? `Logged in as ${user?.username}` : 'Logged out'}</span>
      <button onClick={() => login('john', 'pass123')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders logged out state initially when no token', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('status')).toHaveTextContent('Logged out');
  });

  it('logs in user successfully', async () => {
    vi.spyOn(authService, 'login').mockResolvedValueOnce({
      token: 'jwt-123',
      username: 'john',
      email: 'john@example.com',
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('Logged in as john');
    });
  });

  it('logs out user successfully', async () => {
    vi.spyOn(authService, 'getToken').mockReturnValue('jwt-123');
    vi.spyOn(authService, 'getMe').mockResolvedValueOnce({ username: 'john', email: 'john@example.com' });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('Logged in as john');
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('status')).toHaveTextContent('Logged out');
  });
});

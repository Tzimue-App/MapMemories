import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './authService';

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores token on login', async () => {
    const mockResponse = { token: 'fake-jwt-token', username: 'testuser', email: 'test@example.com' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await authService.login('testuser', 'password123');

    expect(result).toEqual(mockResponse);
    expect(authService.getToken()).toBe('fake-jwt-token');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', password: 'password123' }),
    }));
  });

  it('clears token on logout', () => {
    authService.setToken('sample-token');
    expect(authService.getToken()).toBe('sample-token');

    authService.logout();
    expect(authService.getToken()).toBeNull();
  });

  it('throws error when login fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    } as Response);

    await expect(authService.login('wrong', 'wrong')).rejects.toThrow('Invalid credentials');
  });
});

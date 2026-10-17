import { TestBed } from '@angular/core/testing';
import { TOKEN_KEY, TokenStorage } from './token-storage';

describe('TokenStorage', () => {
  let storage: TokenStorage;

  beforeEach(() => {
    storage = TestBed.inject(TokenStorage);
  });

  it('uses the same localStorage key as the React frontend', () => {
    expect(TOKEN_KEY).toBe('remembermap_jwt_token');
  });

  it('returns null when no token is stored', () => {
    expect(storage.get()).toBeNull();
  });

  it('stores, reads and clears the token', () => {
    storage.set('abc');
    expect(localStorage.getItem('remembermap_jwt_token')).toBe('abc');
    expect(storage.get()).toBe('abc');

    storage.clear();
    expect(storage.get()).toBeNull();
  });
});

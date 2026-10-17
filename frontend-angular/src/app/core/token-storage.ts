import { Injectable } from '@angular/core';

/** Shared with the React frontend so a session survives switching between the two UIs. */
export const TOKEN_KEY = 'remembermap_jwt_token';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
}

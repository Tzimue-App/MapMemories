import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthResponse, AuthUser } from '../models/auth';
import { TokenStorage } from './token-storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenStorage);

  private readonly _user = signal<AuthUser | null>(null);
  private readonly _loading = signal(true);

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  constructor() {
    void this.restoreSession();
  }

  async login(username: string, password: string): Promise<void> {
    await this.authenticate('/api/auth/login', { username, password }, 'Login failed');
  }

  async register(username: string, email: string, password: string): Promise<void> {
    await this.authenticate('/api/auth/register', { username, email, password }, 'Registration failed');
  }

  logout(): void {
    this.tokens.clear();
    this._user.set(null);
  }

  private async restoreSession(): Promise<void> {
    if (!this.tokens.get()) {
      this._loading.set(false);
      return;
    }
    try {
      this._user.set(await firstValueFrom(this.http.get<AuthUser>('/api/auth/me')));
    } catch {
      this.logout();
    } finally {
      this._loading.set(false);
    }
  }

  private async authenticate(url: string, body: object, fallbackMessage: string): Promise<void> {
    try {
      const res = await firstValueFrom(this.http.post<AuthResponse>(url, body));
      this.tokens.set(res.token);
      this._user.set({ username: res.username, email: res.email });
    } catch (err) {
      const message = err instanceof HttpErrorResponse ? err.error?.message : undefined;
      throw new Error(message || fallbackMessage);
    }
  }
}

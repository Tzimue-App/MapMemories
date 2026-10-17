import { computed, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthService } from '../app/core/auth.service';
import { AuthUser } from '../app/models/auth';

/* eslint-disable @typescript-eslint/no-explicit-any */
type ObservableFn = (...args: any[]) => Observable<any>;
const observableFn = (value: unknown = undefined) => vi.fn<ObservableFn>(() => of(value));

/** Signal-backed AuthService double; drive it with `signIn()` / `signOut()` and the `loading` signal. */
export class FakeAuthService {
  readonly user = signal<AuthUser | null>(null);
  readonly loading = signal(false);
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly login = vi.fn(async (username: string, _password: string) => this.signIn(username));
  readonly register = vi.fn(async (username: string, _email: string, _password: string) => this.signIn(username));
  readonly logout = vi.fn(() => this.signOut());

  signIn(username = 'testuser'): void {
    this.user.set({ username, email: `${username}@example.com` });
  }

  signOut(): void {
    this.user.set(null);
  }
}

export const fakeModificationService = () => ({
  getModifications: observableFn([]),
  saveModification: observableFn({ id: 1 }),
  deleteModification: observableFn(),
});

export const fakeMediaService = () => ({
  uploadPhoto: observableFn(),
  getPhotos: observableFn([]),
  deletePhoto: observableFn(),
  getPhotoBlob: observableFn(new Blob()),
});

export const fakeNoteService = () => ({
  createNote: observableFn(),
  getNotes: observableFn([]),
  deleteNote: observableFn(),
});

export const fakeSearchService = () => ({
  searchLocations: observableFn([]),
  searchBoundaries: observableFn([]),
});

export const provideFakeAuth = (fake: FakeAuthService) => ({ provide: AuthService, useValue: fake });

export const provideFake = <T>(token: abstract new (...args: never[]) => T, value: unknown) => ({
  provide: token,
  useValue: value,
});

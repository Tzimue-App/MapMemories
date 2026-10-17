import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestHttp } from '../../testing/http';
import { AuthService } from './auth.service';
import { TokenStorage } from './token-storage';

describe('AuthService', () => {
  let httpMock: HttpTestingController;

  const setup = (token?: string) => {
    TestBed.configureTestingModule({ providers: provideTestHttp() });
    if (token) TestBed.inject(TokenStorage).set(token);
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  };

  afterEach(() => httpMock.verify());

  describe('session restore', () => {
    it('is logged out and not loading when no token is stored', () => {
      const auth = setup();

      httpMock.expectNone('/api/auth/me');
      expect(auth.loading()).toBe(false);
      expect(auth.user()).toBeNull();
      expect(auth.isAuthenticated()).toBe(false);
    });

    it('restores the user from /api/auth/me when a token is stored', async () => {
      const auth = setup('jwt-123');
      expect(auth.loading()).toBe(true);

      const req = httpMock.expectOne('/api/auth/me');
      expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-123');
      req.flush({ username: 'john', email: 'john@example.com' });
      await Promise.resolve();

      expect(auth.loading()).toBe(false);
      expect(auth.user()).toEqual({ username: 'john', email: 'john@example.com' });
      expect(auth.isAuthenticated()).toBe(true);
    });

    it('drops an invalid token cleanly', async () => {
      const auth = setup('expired');

      httpMock.expectOne('/api/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
      await Promise.resolve();

      expect(auth.loading()).toBe(false);
      expect(auth.isAuthenticated()).toBe(false);
      expect(TestBed.inject(TokenStorage).get()).toBeNull();
    });
  });

  describe('login', () => {
    it('posts credentials, stores the token and sets the user', async () => {
      const auth = setup();
      const done = auth.login('testuser', 'password123');

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'testuser', password: 'password123' });
      req.flush({ token: 'fake-jwt-token', username: 'testuser', email: 'test@example.com' });
      await done;

      expect(TestBed.inject(TokenStorage).get()).toBe('fake-jwt-token');
      expect(auth.user()).toEqual({ username: 'testuser', email: 'test@example.com' });
      expect(auth.isAuthenticated()).toBe(true);
    });

    it('rejects with the backend error message', async () => {
      const auth = setup();
      const done = auth.login('wrong', 'wrong');

      httpMock
        .expectOne('/api/auth/login')
        .flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      await expect(done).rejects.toThrow('Invalid credentials');
      expect(auth.isAuthenticated()).toBe(false);
    });

    it('rejects with a default message when the backend gives none', async () => {
      const auth = setup();
      const done = auth.login('x', 'y');

      httpMock.expectOne('/api/auth/login').flush(null, { status: 500, statusText: 'Server Error' });

      await expect(done).rejects.toThrow('Login failed');
    });
  });

  describe('register', () => {
    it('posts the new account, stores the token and sets the user', async () => {
      const auth = setup();
      const done = auth.register('jane', 'jane@example.com', 'secret');

      const req = httpMock.expectOne('/api/auth/register');
      expect(req.request.body).toEqual({ username: 'jane', email: 'jane@example.com', password: 'secret' });
      req.flush({ token: 'jwt-jane', username: 'jane', email: 'jane@example.com' });
      await done;

      expect(TestBed.inject(TokenStorage).get()).toBe('jwt-jane');
      expect(auth.user()?.username).toBe('jane');
    });

    it('rejects with "Registration failed" by default', async () => {
      const auth = setup();
      const done = auth.register('a', 'b@c.d', 'e');

      httpMock.expectOne('/api/auth/register').flush({}, { status: 400, statusText: 'Bad Request' });

      await expect(done).rejects.toThrow('Registration failed');
    });
  });

  it('logout clears the token and the user', async () => {
    const auth = setup('jwt-123');
    httpMock.expectOne('/api/auth/me').flush({ username: 'john', email: 'john@example.com' });
    await Promise.resolve();

    auth.logout();

    expect(auth.isAuthenticated()).toBe(false);
    expect(TestBed.inject(TokenStorage).get()).toBeNull();
  });
});

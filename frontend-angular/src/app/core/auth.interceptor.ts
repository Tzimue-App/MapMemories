import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStorage } from './token-storage';

const PUBLIC_API_URLS = ['/api/auth/login', '/api/auth/register'];

/** Adds `Authorization: Bearer <jwt>` to same-origin API calls (never to third-party hosts). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/') || PUBLIC_API_URLS.includes(req.url)) {
    return next(req);
  }

  const token = inject(TokenStorage).get();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};

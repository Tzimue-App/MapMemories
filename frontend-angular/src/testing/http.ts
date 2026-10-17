import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from '../app/core/auth.interceptor';

/** HttpClient wired exactly like the app (JWT interceptor included) but backed by the testing controller. */
export const provideTestHttp = () => [
  provideHttpClient(withInterceptors([authInterceptor])),
  provideHttpClientTesting(),
];

export interface AuthUser {
  username: string;
  email: string;
  id?: number;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
}

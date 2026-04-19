export type UserRole = 'Admin' | 'Manager' | 'Worker';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  userName: string;
  email: string;
  roles: string[];
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CurrentUser {
  userId: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

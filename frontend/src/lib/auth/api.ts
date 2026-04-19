import apiClient from '../api';
import type { LoginRequest, LoginResponse, RegisterRequest, CurrentUser } from './types';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>('/auth/login', data);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<void> {
  await apiClient.post('/auth/register', data);
}

export async function refresh(): Promise<void> {
  await apiClient.post('/auth/refresh');
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function currentUser(): Promise<CurrentUser> {
  const res = await apiClient.get<CurrentUser>('/auth/current');
  return res.data;
}

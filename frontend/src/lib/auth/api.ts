import apiClient from '../api';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from './types';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>('/auth/login', data);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const res = await apiClient.post<RegisterResponse>('/auth/register', data);
  return res.data;
}

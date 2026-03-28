import axios, { AxiosHeaders } from 'axios';
import type { InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// --- Request interceptor: attach access token ---
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers ?? new AxiosHeaders();
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// --- Response interceptor: refresh on 401, skip auth endpoints ---
let refreshPromise: Promise<string> | null = null;

function isAuthEndpoint(url: string): boolean {
  return AUTH_ENDPOINTS.some((ep) => url.includes(ep));
}

function isAuthFailure(error: AxiosError): boolean {
  const status = error.response?.status;
  return status === 401 || status === 403;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // SSR or non-401 → reject immediately
    if (typeof window === 'undefined' || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Auth endpoints → reject without intercepting (prevents redirect loops)
    if (isAuthEndpoint(originalRequest.url ?? '')) {
      return Promise.reject(error);
    }

    // Already retried → give up
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Use promise lock: all concurrent 401s share one refresh call
    if (!refreshPromise) {
      refreshPromise = apiClient
        .post<{ accessToken: string }>('/auth/refresh')
        .then((res: AxiosResponse<{ accessToken: string }>) => {
          const newToken = res.data.accessToken;
          localStorage.setItem('access_token', newToken);
          return newToken;
        })
        .catch((refreshError: AxiosError) => {
          // Only logout on auth failure (401/403) from refresh endpoint
          if (isAuthFailure(refreshError)) {
            localStorage.removeItem('access_token');
            window.location.assign('/login');
          }
          throw refreshError;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const newToken = await refreshPromise;
      originalRequest.headers = originalRequest.headers ?? new AxiosHeaders();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;

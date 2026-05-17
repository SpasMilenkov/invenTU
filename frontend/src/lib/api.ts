import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosError } from 'axios';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
const UNAUTH_PAGES = ['/login', '/register'];

const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// --- Response interceptor: refresh on 401, skip auth endpoints ---
let refreshPromise: Promise<void> | null = null;

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

    if (typeof window === 'undefined' || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (isAuthEndpoint(originalRequest.url ?? '')) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = apiClient
        .post<void>('/auth/refresh')
        .then(() => {
          return;
        })
        .catch((refreshError: AxiosError) => {
          if (
            isAuthFailure(refreshError) &&
            !UNAUTH_PAGES.includes(window.location.pathname)
          ) {
            window.location.assign('/login');
          }
          throw refreshError;
        })
        .finally(() => {
          refreshPromise = null;
        }) as Promise<void>;
    }

    try {
      await refreshPromise;
      return apiClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

function parseFilename(disposition: string | undefined): string | null {
  if (!disposition) return null;
  const match = /filename\*?=(?:UTF-8'')?"?([^";\n]+)"?/i.exec(disposition);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export async function downloadFile(
  url: string,
  params: Record<string, unknown> | undefined,
  fallbackName: string,
): Promise<void> {
  const cleaned: Record<string, unknown> = {};
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      cleaned[k] = v;
    }
  }

  const response = await apiClient.get<Blob>(url, {
    params: cleaned,
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  const filename = parseFilename(disposition) ?? fallbackName;

  const blobUrl = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
}

export default apiClient;


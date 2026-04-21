import type { AxiosError } from 'axios';
import type { Path, UseFormSetError } from 'react-hook-form';

// Backend validation payloads may use PascalCase ("Email") or camelCase ("email").
// buildFieldMap seeds both for each RHF path so callers don't have to enumerate casings.
export function buildFieldMap<T extends Record<string, unknown>>(
  paths: readonly Path<T>[],
): Record<string, Path<T>> {
  const map: Record<string, Path<T>> = {};
  for (const path of paths) {
    const key = String(path);
    map[key] = path;
    map[key.charAt(0).toUpperCase() + key.slice(1)] = path;
  }
  return map;
}

export function applyBackendFieldErrors<T extends Record<string, unknown>>(
  err: unknown,
  setError: UseFormSetError<T>,
  fieldMap: Record<string, Path<T>>,
): boolean {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (!data || typeof data !== 'object') return false;
  const errors = (data as { errors?: Record<string, string[]> }).errors;
  if (!errors || typeof errors !== 'object') return false;

  let mapped = false;
  for (const [rawKey, messages] of Object.entries(errors)) {
    const target = fieldMap[rawKey] ?? fieldMap[rawKey.toLowerCase()];
    if (target && messages?.length) {
      setError(target, { type: 'server', message: messages.join(' ') });
      mapped = true;
    }
  }
  return mapped;
}

export function extractAuthErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError;
  if (!axiosErr?.response) return 'Something went wrong. Please try again.';

  const data = axiosErr.response.data;

  // FluentValidation array: [{ propertyName, errorMessage, ... }]
  // Identity errors array:  [{ code, description }]
  if (Array.isArray(data) && data.length > 0) {
    if ('errorMessage' in data[0]) {
      return (data as Array<{ errorMessage: string }>)
        .map((e) => e.errorMessage)
        .join(' ');
    }
    if ('code' in data[0]) {
      const errors = data as Array<{ code: string; description: string }>;
      const dup = errors.find((e) => e.code === 'DuplicateUserName' || e.code === 'DuplicateEmail');
      if (dup) return 'An account with this email already exists.';
      return errors.map((e) => e.description).join(' ');
    }
  }

  // Generic middleware shape: { error?, message?, errors?: { field: string[] } }
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (obj.errors && typeof obj.errors === 'object') {
      const messages = Object.values(obj.errors as Record<string, string[]>).flat();
      if (messages.length > 0) return messages.join(' ');
    }
    if (typeof obj.message === 'string' && obj.message) return obj.message;
  }

  return 'Something went wrong. Please try again.';
}

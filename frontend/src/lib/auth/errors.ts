import type { AxiosError } from 'axios';

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

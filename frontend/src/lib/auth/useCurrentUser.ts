import { useQuery } from '@tanstack/react-query';
import { currentUser } from './api';
import type { CurrentUser } from './types';

export const CURRENT_USER_KEY = ['auth', 'currentUser'] as const;

export function useCurrentUser() {
  return useQuery<CurrentUser>({
    queryKey: CURRENT_USER_KEY,
    queryFn: currentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

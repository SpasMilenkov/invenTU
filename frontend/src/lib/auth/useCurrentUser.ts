import { useQuery } from '@tanstack/react-query';
import { currentUser } from './api';
import type { CurrentUser } from './types';

export function useCurrentUser() {
  return useQuery<CurrentUser>({
    queryKey: ['auth', 'currentUser'],
    queryFn: currentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import apiClient from '../api';
import { CURRENT_USER_KEY } from '../auth/useCurrentUser';
import type { CreateUserInput, UpdateUserInput } from '../schemas/users';

export const USERS_QUERY_KEY = ['users'] as const;

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  isActive: boolean;
}

export interface UserDetail extends UserSummary {
  userName: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
}

interface ListParams {
  page: number;
  pageSize: number;
}

export function useUsersList({ page, pageSize }: ListParams) {
  return useQuery<PagedResult<UserSummary>>({
    queryKey: [...USERS_QUERY_KEY, 'list', { page, pageSize }],
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<UserSummary>>('/users', {
        params: { page, pageSize },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation<UserDetail, unknown, CreateUserInput>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<UserDetail>('/users', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  role?: string;
  currentPassword?: string;
  newPassword?: string;
}

interface UpdateUserOptions {
  isSelf?: boolean;
}

export function useUpdateUser(id: string | undefined, { isSelf = false }: UpdateUserOptions = {}) {
  const queryClient = useQueryClient();
  return useMutation<UserDetail, unknown, UpdateUserPayload>({
    mutationFn: async (payload) => {
      if (!id) throw new Error('User id is required');
      const res = await apiClient.put<UserDetail>(`/users/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      if (isSelf) queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: async (id) => {
      await apiClient.patch(`/users/${id}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function toUpdatePayload(input: UpdateUserInput): UpdateUserPayload {
  const payload: UpdateUserPayload = {
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
  };
  if (input.newPassword) {
    payload.newPassword = input.newPassword;
    payload.currentPassword = input.currentPassword || undefined;
  }
  return payload;
}

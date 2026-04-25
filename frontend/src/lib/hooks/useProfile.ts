import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api';
import { useCurrentUser, CURRENT_USER_KEY } from '../auth/useCurrentUser';

export interface ProfileView {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export function useProfile() {
  const { data, isLoading, isError } = useCurrentUser();

  const profile: ProfileView | undefined = data && {
    userId: data.userId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: data.roles?.[0] ?? '',
  };

  return { data: profile, isLoading, isError };
}

export function useUpdateProfile(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { firstName: string; lastName: string }) => {
      if (!userId) throw new Error('User not loaded');
      await apiClient.put(`/users/${userId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
    },
  });
}

export function useChangePassword(userId: string | undefined) {
  return useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      if (!userId) throw new Error('User not loaded');
      await apiClient.put(`/users/${userId}`, payload);
    },
  });
}

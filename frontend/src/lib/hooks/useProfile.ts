import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api';

export interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const PROFILE_KEY = ['profile'] as const;

export function useProfile() {
  return useQuery<ProfileData>({
    queryKey: PROFILE_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<ProfileData>('/account/profile');
      return data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { firstName: string; lastName: string }) => {
      const { data } = await apiClient.put<ProfileData>('/account/profile', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_KEY, data);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      await apiClient.post('/account/change-password', payload);
    },
  });
}

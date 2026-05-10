import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api';
import type { SupplierDto, SupplierQueryParams } from '../types/suppliers';
import type { CreateSupplierInput, UpdateSupplierInput } from '../schemas/suppliers';

export const SUPPLIERS_QUERY_KEY = ['suppliers'] as const;

function toListParams(params: SupplierQueryParams) {
  const req: Record<string, string> = {};
  if (params.search && params.search.length > 0) req.search = params.search;
  if (params.archive) req.archive = params.archive;
  return req;
}

export function useSuppliersList(params: SupplierQueryParams) {
  return useQuery<SupplierDto[]>({
    queryKey: [...SUPPLIERS_QUERY_KEY, 'list', params],
    queryFn: async () => {
      const res = await apiClient.get<SupplierDto[]>('/suppliers', {
        params: toListParams(params),
      });
      return res.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation<SupplierDto, unknown, CreateSupplierInput>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<SupplierDto>('/suppliers', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY });
    },
  });
}

export function useUpdateSupplier(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<SupplierDto, unknown, UpdateSupplierInput>({
    mutationFn: async (payload) => {
      if (!id) throw new Error('Supplier id is required');
      const res = await apiClient.put<SupplierDto>(`/suppliers/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY });
    },
  });
}

export function useArchiveSupplier() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: async (id) => {
      await apiClient.patch(`/suppliers/${id}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY });
    },
  });
}

export function useRestoreSupplier() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: async (id) => {
      await apiClient.patch(`/suppliers/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY });
    },
  });
}

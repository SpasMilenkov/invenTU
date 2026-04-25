import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import apiClient from '../api';
import type { PagedResult } from './useUsers';
import type { CreateWarehouseInput, UpdateWarehouseInput } from '../schemas/warehouses';

export const WAREHOUSES_QUERY_KEY = ['warehouses'] as const;

export type WarehouseStatusFilter = 'All' | 'Active' | 'Inactive';

export interface WarehouseSummary {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  location: string | null;
  maxStockLevel: number | null;
  totalLocations: number;
  totalStockItems: number;
  totalQuantity: number;
}

interface ListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: WarehouseStatusFilter;
}

export function useWarehousesList({ page, pageSize, search, status = 'All' }: ListParams) {
  return useQuery<PagedResult<WarehouseSummary>>({
    queryKey: [...WAREHOUSES_QUERY_KEY, 'list', { page, pageSize, search: search ?? '', status }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, pageSize, status };
      if (search && search.trim()) params.search = search.trim();
      const res = await apiClient.get<PagedResult<WarehouseSummary>>('/warehouses', { params });
      return res.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation<WarehouseSummary, unknown, CreateWarehouseInput>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<WarehouseSummary>('/warehouses', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSES_QUERY_KEY });
    },
  });
}

export function useUpdateWarehouse(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<WarehouseSummary, unknown, UpdateWarehouseInput>({
    mutationFn: async (payload) => {
      if (!id) throw new Error('Warehouse id is required');
      const res = await apiClient.put<WarehouseSummary>(`/warehouses/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSES_QUERY_KEY });
    },
  });
}

export function useDeactivateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: async (id) => {
      await apiClient.patch(`/warehouses/${id}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSES_QUERY_KEY });
    },
  });
}

export function useActivateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: async (id) => {
      await apiClient.patch(`/warehouses/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSES_QUERY_KEY });
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/warehouses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSES_QUERY_KEY });
    },
  });
}

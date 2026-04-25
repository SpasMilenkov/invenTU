import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api';
import { WAREHOUSES_QUERY_KEY } from './useWarehouses';
import type {
  CreateStockLocationInput,
  UpdateStockLocationInput,
} from '../schemas/stockLocations';

export interface StockLocationSummary {
  id: string;
  warehouseId: string;
  zone: string;
  aisle: string | null;
  shelf: string | null;
  bin: string | null;
  maxCapacity: number;
  fullLocationCode: string;
  stockItemCount: number;
  totalQuantity: number;
}

interface ListOptions {
  zone?: string;
  enabled?: boolean;
}

function locationsKey(warehouseId: string, zone?: string) {
  return [...WAREHOUSES_QUERY_KEY, warehouseId, 'locations', { zone: zone ?? '' }] as const;
}

export const LOCATIONS_PREFIX = (warehouseId: string) =>
  [...WAREHOUSES_QUERY_KEY, warehouseId, 'locations'] as const;

export function useLocationsList(
  warehouseId: string | undefined,
  { zone, enabled = true }: ListOptions = {},
) {
  return useQuery<StockLocationSummary[]>({
    queryKey: warehouseId ? locationsKey(warehouseId, zone) : ['warehouses', 'noop', 'locations'],
    queryFn: async () => {
      if (!warehouseId) return [];
      const params: Record<string, string> = {};
      if (zone && zone.trim()) params.zone = zone.trim();
      const res = await apiClient.get<StockLocationSummary[]>(
        `/warehouses/${warehouseId}/locations`,
        { params },
      );
      return res.data;
    },
    enabled: !!warehouseId && enabled,
    staleTime: 30 * 1000,
  });
}

export function useCreateLocation(warehouseId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<StockLocationSummary, unknown, CreateStockLocationInput>({
    mutationFn: async (payload) => {
      if (!warehouseId) throw new Error('Warehouse id is required');
      const res = await apiClient.post<StockLocationSummary>(
        `/warehouses/${warehouseId}/locations`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      if (warehouseId) {
        queryClient.invalidateQueries({ queryKey: LOCATIONS_PREFIX(warehouseId) });
      }
      queryClient.invalidateQueries({ queryKey: WAREHOUSES_QUERY_KEY });
    },
  });
}

interface UpdateLocationVars {
  id: string;
  payload: UpdateStockLocationInput;
}

export function useUpdateLocation(warehouseId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<StockLocationSummary, unknown, UpdateLocationVars>({
    mutationFn: async ({ id, payload }) => {
      if (!warehouseId) throw new Error('Warehouse id is required');
      const res = await apiClient.put<StockLocationSummary>(
        `/warehouses/${warehouseId}/locations/${id}`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      if (warehouseId) {
        queryClient.invalidateQueries({ queryKey: LOCATIONS_PREFIX(warehouseId) });
      }
      queryClient.invalidateQueries({ queryKey: WAREHOUSES_QUERY_KEY });
    },
  });
}

interface DeleteLocationVars {
  warehouseId: string;
  id: string;
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, DeleteLocationVars>({
    mutationFn: async ({ warehouseId, id }) => {
      await apiClient.delete(`/warehouses/${warehouseId}/locations/${id}`);
    },
    onSuccess: (_data, { warehouseId }) => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_PREFIX(warehouseId) });
      queryClient.invalidateQueries({ queryKey: WAREHOUSES_QUERY_KEY });
    },
  });
}

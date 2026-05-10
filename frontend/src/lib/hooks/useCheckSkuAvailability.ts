import { useQuery } from '@tanstack/react-query';
import apiClient from '../api';
import type { PagedResult, ProductDto } from '../types/products';

export type SkuStatus = 'idle' | 'checking' | 'available' | 'taken';

export interface SkuAvailabilityResult {
  status: SkuStatus;
  message?: string;
}

const SKU_REGEX = /^[A-Za-z0-9\-_.]+$/;
const MAX_SKU_LENGTH = 50;

function isValidSku(sku: string): boolean {
  if (!sku || sku.length === 0) return false;
  if (sku.length > MAX_SKU_LENGTH) return false;
  return SKU_REGEX.test(sku);
}

export function useCheckSkuAvailability(sku: string): SkuAvailabilityResult {
  const normalizedSku = sku.trim().toUpperCase();
  const isValid = isValidSku(normalizedSku);

  const { data, isLoading, isFetching, error } = useQuery<PagedResult<ProductDto>>({
    queryKey: ['sku-check', normalizedSku],
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<ProductDto>>('/products', {
        params: { search: normalizedSku, pageSize: 20 },
      });
      return res.data;
    },
    enabled: isValid,
    staleTime: 30_000,
    gcTime: 60_000,
    refetchOnWindowFocus: false,
  });

  if (!isValid) {
    return { status: 'idle' };
  }

  if (error) {
    if (import.meta.env.DEV) {
      console.warn('[useCheckSkuAvailability] error:', error);
    }
    return { status: 'idle' };
  }

  if (isLoading || (isFetching && !data)) {
    return { status: 'checking' };
  }

  if (!data) {
    return { status: 'idle' };
  }

  const skuIsTaken = data.items.some((product) => product.sku.toUpperCase() === normalizedSku);

  if (skuIsTaken) {
    return { status: 'taken', message: 'SKU already in use' };
  }

  return { status: 'available', message: 'SKU is available' };
}

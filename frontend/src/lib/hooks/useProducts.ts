import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import apiClient from '../api';
import type {
  PagedResult,
  ProductDto,
  ProductQueryParams,
  StockSummary,
} from '../types/products';
import type { CreateProductInput, UpdateProductInput } from '../schemas/products';

export const PRODUCTS_QUERY_KEY = ['products'] as const;
export const STOCK_SUMMARY_QUERY_KEY = ['stock', 'summary'] as const;

function toListRequestParams(params: ProductQueryParams) {
  const req: Record<string, string | number | boolean> = {
    page: params.page,
    pageSize: params.pageSize,
  };
  if (params.search && params.search.length > 0) req.search = params.search;
  if (params.categoryId) req.categoryId = params.categoryId;
  if (params.isActive !== undefined) req.isActive = params.isActive;
  if (params.archive) req.archive = params.archive;
  return req;
}

export function useProductsList(params: ProductQueryParams) {
  return useQuery<PagedResult<ProductDto>>({
    queryKey: [...PRODUCTS_QUERY_KEY, 'list', params],
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<ProductDto>>('/products', {
        params: toListRequestParams(params),
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery<ProductDto>({
    queryKey: [...PRODUCTS_QUERY_KEY, 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Product id is required');
      const res = await apiClient.get<ProductDto>(`/products/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

async function fetchStockSummary(productId: string): Promise<StockSummary> {
  const res = await apiClient.get<StockSummary>(`/stock/summary/${productId}`);
  return res.data;
}

export function useStockSummary(productId: string | undefined) {
  return useQuery<StockSummary>({
    queryKey: [...STOCK_SUMMARY_QUERY_KEY, productId],
    queryFn: () => fetchStockSummary(productId as string),
    enabled: Boolean(productId),
    staleTime: 15 * 1000,
  });
}

export function useProductStockSummaries(productIds: string[]) {
  return useQueries({
    queries: productIds.map((id) => ({
      queryKey: [...STOCK_SUMMARY_QUERY_KEY, id],
      queryFn: () => fetchStockSummary(id),
      staleTime: 15 * 1000,
    })),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation<ProductDto, unknown, CreateProductInput>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<ProductDto>('/products', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}

export function useUpdateProduct(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<ProductDto, unknown, UpdateProductInput>({
    mutationFn: async (payload) => {
      if (!id) throw new Error('Product id is required');
      const res = await apiClient.put<ProductDto>(`/products/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}

export function useArchiveProduct() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: async (id) => {
      await apiClient.patch(`/products/${id}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}

export function useRestoreProduct() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: async (id) => {
      await apiClient.patch(`/products/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}

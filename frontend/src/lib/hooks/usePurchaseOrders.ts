import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import apiClient from '../api';
import type { PagedResult } from '../types/common';
import type {
  PurchaseOrderDto,
  PurchaseOrderQueryParams,
} from '../types/purchase-orders';
import type { CreatePurchaseOrderInput } from '../schemas/purchase-orders';

export const PURCHASE_ORDERS_QUERY_KEY = ['purchase-orders'] as const;

function toListParams(params: PurchaseOrderQueryParams) {
  const req: Record<string, string | number> = {
    page: params.page,
    pageSize: params.pageSize,
  };
  if (params.supplierId) req.supplierId = params.supplierId;
  if (params.status !== undefined) req.status = params.status;
  if (params.fromDate) req.fromDate = params.fromDate;
  if (params.toDate) req.toDate = params.toDate;
  return req;
}

export function usePurchaseOrdersList(params: PurchaseOrderQueryParams) {
  return useQuery<PagedResult<PurchaseOrderDto>>({
    queryKey: [...PURCHASE_ORDERS_QUERY_KEY, 'list', params],
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<PurchaseOrderDto>>(
        '/suppliers/purchase-orders',
        { params: toListParams(params) },
      );
      return res.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

interface CreatePurchaseOrderPayload extends CreatePurchaseOrderInput {
  createdByUserId: string;
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation<PurchaseOrderDto, unknown, CreatePurchaseOrderPayload>({
    mutationFn: async (payload) => {
      const body = {
        supplierId: payload.supplierId,
        orderDate: payload.orderDate,
        createdByUserId: payload.createdByUserId,
        expectedDate:
          payload.expectedDate && payload.expectedDate.length > 0
            ? payload.expectedDate
            : undefined,
        purchaseOrderLines: payload.purchaseOrderLines,
      };
      const res = await apiClient.post<PurchaseOrderDto>(
        '/suppliers/purchase-orders',
        body,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_QUERY_KEY });
    },
  });
}

export function useAdvancePurchaseOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: async (id) => {
      await apiClient.patch(`/suppliers/purchase-orders/${id}/status`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_QUERY_KEY });
    },
  });
}

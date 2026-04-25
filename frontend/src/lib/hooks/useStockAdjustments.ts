import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api";

export const ADJUSTMENTS_QUERY_KEY = ["stock", "adjustments"] as const;

export interface StockAdjustment {
  movementId: string;
  productId: string;
  productName: string;
  stockLocationId: string;
  fullLocationCode: string;
  warehouseId: string;
  warehouseName: string;
  previousQuantity: number;
  countedQuantity: number;
  delta: number;
  status: "Active" | "PendingApproval" | "Approved" | "Rejected";
  notes: string | null;
  referenceNumber: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface SubmitAdjustmentInput {
  warehouseId: string;
  stockLocationId: string;
  productId: string;
  countedQuantity: number;
  referenceNumber?: string;
  notes?: string;
}

export interface ReviewAdjustmentInput {
  reason?: string;
}

export function usePendingAdjustments() {
  return useQuery<StockAdjustment[]>({
    queryKey: [...ADJUSTMENTS_QUERY_KEY, "pending"],
    queryFn: async () => {
      const res = await apiClient.get<StockAdjustment[]>(
        "/stock/adjustments/pending",
      );
      return res.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useSubmitAdjustment() {
  const queryClient = useQueryClient();
  return useMutation<StockAdjustment, unknown, SubmitAdjustmentInput>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<StockAdjustment>(
        "/stock/adjustments",
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADJUSTMENTS_QUERY_KEY });
    },
  });
}

export function useApproveAdjustment() {
  const queryClient = useQueryClient();
  return useMutation<
    StockAdjustment,
    unknown,
    { id: string; input: ReviewAdjustmentInput }
  >({
    mutationFn: async ({ id, input }) => {
      const res = await apiClient.patch<StockAdjustment>(
        `/stock/adjustments/${id}/approve`,
        input,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADJUSTMENTS_QUERY_KEY });
    },
  });
}

export function useRejectAdjustment() {
  const queryClient = useQueryClient();
  return useMutation<
    StockAdjustment,
    unknown,
    { id: string; input: ReviewAdjustmentInput }
  >({
    mutationFn: async ({ id, input }) => {
      const res = await apiClient.patch<StockAdjustment>(
        `/stock/adjustments/${id}/reject`,
        input,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADJUSTMENTS_QUERY_KEY });
    },
  });
}

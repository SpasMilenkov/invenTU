import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api";

export interface StockReceiptResult {
  movementId: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  stockLocationId: string;
  quantity: number;
  updatedStockLevel: number;
  referenceNumber: string | null;
  createdAt: string;
}

export interface StockIssueResult {
  movementId: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  stockLocationId: string;
  quantity: number;
  updatedStockLevel: number;
  reasonCode: string;
  notes: string | null;
  createdAt: string;
}

export interface StockTransferResult {
  movementId: string;
  productId: string;
  productName: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  quantity: number;
  createdAt: string;
}

export interface ReceiveStockInput {
  warehouseId: string;
  stockLocationId: string;
  productId: string;
  quantity: number;
  referenceNumber?: string;
  notes?: string;
}

export interface IssueStockInput {
  warehouseId: string;
  stockLocationId: string;
  productId: string;
  quantity: number;
  reasonCode: string;
  notes?: string;
}

export interface TransferStockInput {
  sourceWarehouseId: string;
  sourceStockLocationId: string;
  destinationWarehouseId: string;
  destinationStockLocationId: string;
  productId: string;
  quantity: number;
  notes?: string;
}

export function useReceiveStock() {
  const queryClient = useQueryClient();
  return useMutation<StockReceiptResult, unknown, ReceiveStockInput>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<StockReceiptResult>(
        "/stock/receipts",
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

export function useIssueStock() {
  const queryClient = useQueryClient();
  return useMutation<StockIssueResult, unknown, IssueStockInput>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<StockIssueResult>(
        "/stock/issues",
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

export function useTransferStock() {
  const queryClient = useQueryClient();
  return useMutation<StockTransferResult, unknown, TransferStockInput>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<StockTransferResult>(
        "/stock/transfers",
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

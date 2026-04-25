import { useQuery } from "@tanstack/react-query";
import apiClient from "../api";

export interface WarehouseSummary {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface StockLocationSummary {
  id: string;
  warehouseId: string;
  fullLocationCode: string;
  zone: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  sku: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

export function useActiveWarehouses() {
  return useQuery<WarehouseSummary[]>({
    queryKey: ["warehouses", "active"],
    queryFn: async () => {
      const res = await apiClient.get<WarehouseSummary[]>("/warehouses");
      return res.data.filter((w) => w.isActive);
    },
    staleTime: 60 * 1000,
  });
}

export function useStockLocations(warehouseId: string | null) {
  return useQuery<StockLocationSummary[]>({
    queryKey: ["warehouses", warehouseId, "locations"],
    queryFn: async () => {
      const res = await apiClient.get<StockLocationSummary[]>(
        `/warehouses/${warehouseId}/locations`,
      );
      return res.data;
    },
    enabled: !!warehouseId,
    staleTime: 60 * 1000,
  });
}

export function useProducts(search: string) {
  return useQuery<PagedResult<ProductSummary>>({
    queryKey: ["products", "list", { search }],
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<ProductSummary>>(
        "/products",
        {
          params: { search, pageSize: 50, isActive: true },
        },
      );
      return res.data;
    },
    staleTime: 30 * 1000,
  });
}

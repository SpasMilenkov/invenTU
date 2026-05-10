export interface ProductDto {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName: string;
  primaryWarehouseId: string | null;
  unitPrice: number;
  costPrice: number;
  unitOfMeasure: string;
  isActive: boolean;
  description: string | null;
  barcode: string | null;
  minStockLevel: number;
  maxStockLevel: number | null;
  reorderPoint: number;
  totalStock: number;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

export type { PagedResult } from './common';

export type ArchiveStatusFilter = 'Active' | 'Archived' | 'All';

export interface ProductQueryParams {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  archive?: ArchiveStatusFilter;
  page: number;
  pageSize: number;
}

export interface StockByWarehouse {
  warehouseId: string;
  warehouseName: string;
  totalQuantity: number;
  totalQuantityReserved: number;
  totalQuantityAvailable: number;
}

export interface StockSummary {
  productId: string;
  productName: string;
  productSku: string;
  totalQuantity: number;
  totalQuantityReserved: number;
  totalQuantityAvailable: number;
  warehouseCount: number;
  byWarehouse: StockByWarehouse[];
}

export type StockStatus = 'OutOfStock' | 'LowStock' | 'InStock';

export function deriveStockStatus(totalAvailable: number, minStockLevel: number): StockStatus {
  if (totalAvailable <= 0) return 'OutOfStock';
  if (totalAvailable <= minStockLevel) return 'LowStock';
  return 'InStock';
}

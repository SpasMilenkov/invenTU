// src/lib/types/dashboard.ts

export interface StockByCategory {
  categoryId: string;
  categoryName: string;
  totalQuantity: number;
}

export type MovementType = "Inbound" | "Outbound" | "Transfer";
export type MovementStatus = "Completed" | "Pending" | "Cancelled";

export interface StockMovement {
  id: string;
  productName: string;
  sku: string;
  movementType: MovementType;
  quantity: number;
  status: MovementStatus;
  createdAt: string; // ISO 8601 — backend sends UTC DateTime, serialised as string over JSON
}

export interface DashboardData {
  totalProducts: number;
  totalWarehouses: number;
  lowStockCount: number;
  totalStockValue: number;
  recentMovements: StockMovement[];
  stockByCategory: StockByCategory[];
}

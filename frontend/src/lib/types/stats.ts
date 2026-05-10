// src/lib/types/stats.ts
// Mirror of the C# response DTOs — ASP.NET Core's default JSON serializer
// camelCases all property names, so TotalActiveProducts → totalActiveProducts.

export interface InventoryHealthResponse {
  /** Active, non-deleted product count. */
  totalActiveProducts: number;
  /** SUM(StockItems.Quantity × Products.CostPrice) across all locations. */
  totalStockValue: number;
  /** Products whose on-hand total is at or below their ReorderPoint. */
  productsBelowReorderPoint: number;
  /** SUM of all StockItems.Quantity values. */
  totalStockUnits: number;
  /** Total bin-level stock locations registered across all warehouses. */
  totalStockLocations: number;
}

export interface AlertSummaryResponse {
  /** Alerts where ResolvedAt is null. */
  totalUnresolved: number;
  /** Unresolved alerts the calling user has not yet read. */
  unreadForCurrentUser: number;
  /** AlertType enum name → count for all unresolved alerts. */
  byType: Record<string, number>;
}

export interface PurchaseOrderPipelineResponse {
  /** Non-terminal purchase order count. */
  totalOpenOrders: number;
  /** Combined line-item value of all open orders. */
  totalOpenValue: number;
  /** PurchaseOrderStatus enum name → count across ALL orders. */
  byStatus: Record<string, number>;
}

/** Flattened union of all three stats responses — used as KpiCards props. */
export interface StatsData {
  inventoryHealth: InventoryHealthResponse;
  alerts: AlertSummaryResponse;
  pipeline: PurchaseOrderPipelineResponse;
}

export interface PublicSummaryResponse {
  activeWarehouses: number;
  activeSkus: number;
  stockLocations: number;
}

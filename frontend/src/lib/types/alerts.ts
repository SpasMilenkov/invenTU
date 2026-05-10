export interface AlertLiveDto {
  alertId: string;
  alertType: string;
  message: string | null;
  isRead: boolean;
  createdAt: string; // ISO-8601
  resolvedAt: string | null;

  // stock context (null for non-inventory alerts)
  productId: string | null;
  productName: string | null;
  sku: string | null;
  warehouseId: string | null;
  warehouseName: string | null;
  stockLocationId: string | null;
  locationCode: string | null;
  currentQuantity: number | null;
  minStockLevel: number | null;
  reorderSuggestion: number | null;
  stockHealthPct: number | null; // 0–100, null when unknown
}

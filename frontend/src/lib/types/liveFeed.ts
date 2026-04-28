// src/lib/types/liveFeed.ts

export type MovementType =
  | "Receipt"
  | "Issue"
  | "Transfer"
  | "Adjustment"
  | "Count"
  | "WriteOff";

export interface StockMovementLiveDto {
  movementId: string;
  movementType: MovementType;
  productId: string;
  /** Empty string if the service didn't load the product entity. */
  productName: string;
  /** Always positive magnitude. */
  quantity: number;
  /**
   * Signed for directional display:
   *   Receipt / positive Adjustment → positive
   *   Issue / WriteOff / negative Adjustment → negative
   *   Transfer → positive (use source/dest names for direction)
   */
  displayQuantity: number;
  sourceWarehouseName: string | null;
  destinationWarehouseName: string | null;
  locationCode: string | null;
  statusOrReason: string | null;
  referenceNumber: string | null;
  notes: string | null;
  occurredAt: string; // ISO-8601
}

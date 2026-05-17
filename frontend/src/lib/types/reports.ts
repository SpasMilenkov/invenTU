export type MovementTypeFilter =
  | 'Receipt'
  | 'Issue'
  | 'Transfer'
  | 'Adjustment'
  | 'Count'
  | 'WriteOff';

export type MovementStatusFilter =
  | 'Active'
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected';

export const MOVEMENT_TYPE_OPTIONS: MovementTypeFilter[] = [
  'Receipt',
  'Issue',
  'Transfer',
  'Adjustment',
  'Count',
  'WriteOff',
];

export const MOVEMENT_STATUS_OPTIONS: ReadonlyArray<{ value: MovementStatusFilter; label: string }> = [
  { value: 'Active', label: 'Active' },
  { value: 'PendingApproval', label: 'Pending approval' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
];

export interface InventoryValuationFilters {
  warehouseId?: string;
  categoryId?: string;
}

export interface StockMovementFilters {
  fromDate?: string;
  toDate?: string;
  warehouseId?: string;
  movementType?: MovementTypeFilter;
  status?: MovementStatusFilter;
  productId?: string;
}

export interface TurnoverFilters {
  fromDate?: string;
  toDate?: string;
}

export type ReportFormat = 'csv' | 'pdf';

export interface ReportEndpoints {
  csv: string;
  pdf: string;
}

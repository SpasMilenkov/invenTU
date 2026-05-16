export type AuditAction = 'Insert' | 'Update' | 'Delete';

export type AuditEntityType =
  | 'Product'
  | 'Warehouse'
  | 'StockLocation'
  | 'User'
  | 'Category'
  | 'StockMovement'
  | 'StockItem'
  | 'Supplier'
  | 'PurchaseOrder'
  | 'PurchaseOrderLine'
  | 'UserRole';

export const AUDIT_ENTITY_TYPE_OPTIONS: readonly AuditEntityType[] = [
  'Product',
  'Warehouse',
  'StockLocation',
  'User',
  'Category',
  'StockMovement',
  'StockItem',
  'Supplier',
  'PurchaseOrder',
  'PurchaseOrderLine',
  'UserRole',
];

export const AUDIT_ACTION_OPTIONS: readonly AuditAction[] = [
  'Insert',
  'Update',
  'Delete',
];

export interface ChangedFieldsPayload {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface AuditLogDto {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  changedFields: ChangedFieldsPayload;
  userId: string | null;
  userDisplayName: string | null;
  timestamp: string;
}

export interface AuditLogFilters {
  entityType?: AuditEntityType;
  action?: AuditAction;
  userId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AuditLogListParams extends AuditLogFilters {
  page: number;
  pageSize: number;
}

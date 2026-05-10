export enum PurchaseOrderStatus {
  Draft = 0,
  Submitted = 1,
  PartiallyReceived = 2,
  Received = 3,
}

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.Draft]: 'Draft',
  [PurchaseOrderStatus.Submitted]: 'Submitted',
  [PurchaseOrderStatus.PartiallyReceived]: 'Partially received',
  [PurchaseOrderStatus.Received]: 'Received',
};

export const NEXT_STATUS_LABEL: Record<PurchaseOrderStatus, string | null> = {
  [PurchaseOrderStatus.Draft]: 'Submit',
  [PurchaseOrderStatus.Submitted]: 'Mark partially received',
  [PurchaseOrderStatus.PartiallyReceived]: 'Mark received',
  [PurchaseOrderStatus.Received]: null,
};

export interface PurchaseOrderDto {
  id: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  createdByUserId: string;
  createdByUserName: string;
  expectedDate: string | null;
}

export interface PurchaseOrderQueryParams {
  supplierId?: string;
  status?: PurchaseOrderStatus;
  fromDate?: string;
  toDate?: string;
  page: number;
  pageSize: number;
}

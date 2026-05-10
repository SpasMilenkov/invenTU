export type SupplierArchiveStatus = 'Active' | 'Archived' | 'All';

export interface SupplierDto {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  isActive: boolean;
}

export interface SupplierQueryParams {
  search?: string;
  archive?: SupplierArchiveStatus;
}

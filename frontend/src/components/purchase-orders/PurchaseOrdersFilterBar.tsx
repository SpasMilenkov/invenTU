import { Icon } from '../ui/Icon';
import {
  PURCHASE_ORDER_STATUS_LABELS,
  PurchaseOrderStatus,
} from '../../lib/types/purchase-orders';
import type { SupplierDto } from '../../lib/types/suppliers';

interface Props {
  supplierId: string;
  onSupplierChange: (id: string) => void;
  status: PurchaseOrderStatus | undefined;
  onStatusChange: (status: PurchaseOrderStatus | undefined) => void;
  fromDate: string;
  toDate: string;
  onFromDateChange: (v: string) => void;
  onToDateChange: (v: string) => void;
  suppliers: SupplierDto[] | undefined;
  isSuppliersLoading: boolean;
  onClear: () => void;
  hasActiveFilters: boolean;
}

const STATUS_OPTIONS: PurchaseOrderStatus[] = [
  PurchaseOrderStatus.Draft,
  PurchaseOrderStatus.Submitted,
  PurchaseOrderStatus.PartiallyReceived,
  PurchaseOrderStatus.Received,
];

export default function PurchaseOrdersFilterBar({
  supplierId,
  onSupplierChange,
  status,
  onStatusChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  suppliers,
  isSuppliersLoading,
  onClear,
  hasActiveFilters,
}: Props) {
  return (
    <div className="toolbar">
      <div className="md:w-72">
        <select
          className="select"
          value={supplierId}
          onChange={(e) => onSupplierChange(e.target.value)}
          disabled={isSuppliersLoading}
          aria-label="Filter by supplier"
        >
          <option value="">All suppliers</option>
          {suppliers?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="md:w-56">
        <select
          className="select"
          value={status === undefined ? '' : String(status)}
          onChange={(e) =>
            onStatusChange(e.target.value === '' ? undefined : (Number(e.target.value) as PurchaseOrderStatus))
          }
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {PURCHASE_ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Icon name="filter" size={14} style={{ color: 'var(--color-ink-3)' }} />
        <input
          type="date"
          className="input"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          aria-label="From date"
        />
        <span style={{ color: 'var(--color-ink-3)' }}>—</span>
        <input
          type="date"
          className="input"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          aria-label="To date"
        />
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

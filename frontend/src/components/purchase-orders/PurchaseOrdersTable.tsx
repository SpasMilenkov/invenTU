import { toast } from 'sonner';
import { Tag } from '../ui/Tag';
import EmptyState from '../products/EmptyState';
import StatusTransitionButton from './StatusTransitionButton';
import { useAdvancePurchaseOrderStatus } from '../../lib/hooks/usePurchaseOrders';
import { extractAuthErrorMessage } from '../../lib/auth/errors';
import {
  PURCHASE_ORDER_STATUS_LABELS,
  PurchaseOrderStatus,
} from '../../lib/types/purchase-orders';
import type { PurchaseOrderDto } from '../../lib/types/purchase-orders';
import type { PagedResult } from '../../lib/types/common';

interface Props {
  data?: PagedResult<PurchaseOrderDto>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const STATUS_KIND: Record<PurchaseOrderStatus, 'neutral' | 'info' | 'warn' | 'ok'> = {
  [PurchaseOrderStatus.Draft]: 'neutral',
  [PurchaseOrderStatus.Submitted]: 'info',
  [PurchaseOrderStatus.PartiallyReceived]: 'warn',
  [PurchaseOrderStatus.Received]: 'ok',
};

function fmtDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

export default function PurchaseOrdersTable({
  data,
  isLoading,
  isFetching,
  isError,
  onRetry,
  onPageChange,
  hasActiveFilters,
  onClearFilters,
}: Props) {
  const advance = useAdvancePurchaseOrderStatus();

  if (isError) {
    return (
      <div className="info-card">
        <p>Could not load purchase orders.</p>
        <button type="button" className="btn btn-outline btn-sm mt-3" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  const showSkeleton = isLoading && !data;
  const items = data?.items ?? [];
  const showEmpty = !showSkeleton && items.length === 0;

  if (showEmpty) {
    return hasActiveFilters ? (
      <EmptyState
        title="No purchase orders match your filters"
        description="Try a different combination or clear the filters."
        actionLabel="Clear filters"
        onAction={onClearFilters}
      />
    ) : (
      <EmptyState
        title="No purchase orders yet"
        description="Create one to start tracking inbound stock."
      />
    );
  }

  async function handleAdvance(id: string) {
    try {
      await advance.mutateAsync(id);
      toast.success('Status updated');
    } catch (err) {
      toast.error(extractAuthErrorMessage(err));
    }
  }

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }} title="Line items are not returned by the API yet.">
        <table className="tbl">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Status</th>
              <th>Order date</th>
              <th>Expected date</th>
              <th>Created by</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {showSkeleton &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={`s-${i}`}>
                  <td>
                    <div className="h-3 w-40 animate-pulse" style={{ background: 'var(--color-bg-sunk)' }} />
                  </td>
                  <td>
                    <div className="h-3 w-20 animate-pulse" style={{ background: 'var(--color-bg-sunk)' }} />
                  </td>
                  <td>
                    <div className="h-3 w-24 animate-pulse" style={{ background: 'var(--color-bg-sunk)' }} />
                  </td>
                  <td>
                    <div className="h-3 w-24 animate-pulse" style={{ background: 'var(--color-bg-sunk)' }} />
                  </td>
                  <td>
                    <div className="h-3 w-32 animate-pulse" style={{ background: 'var(--color-bg-sunk)' }} />
                  </td>
                  <td>
                    <div className="h-3 w-24 animate-pulse" style={{ background: 'var(--color-bg-sunk)' }} />
                  </td>
                </tr>
              ))}
            {items.map((po) => (
              <tr key={po.id}>
                <td className="strong">{po.supplierName}</td>
                <td>
                  <Tag kind={STATUS_KIND[po.status]}>
                    {PURCHASE_ORDER_STATUS_LABELS[po.status].toUpperCase()}
                  </Tag>
                </td>
                <td>{fmtDate(po.orderDate)}</td>
                <td>{fmtDate(po.expectedDate)}</td>
                <td>{po.createdByUserName}</td>
                <td>
                  <StatusTransitionButton
                    status={po.status}
                    onAdvance={() => handleAdvance(po.id)}
                    isPending={advance.isPending && advance.variables === po.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalCount > 0 && (
        <div
          className="flex items-center justify-between px-4 py-3 font-mono text-[11px]"
          style={{
            borderTop: '1px solid var(--color-rule)',
            background: 'var(--color-bg-elev)',
            color: 'var(--color-ink-3)',
          }}
        >
          <span>
            PAGE {data.page} / {data.totalPages} · {data.totalCount} TOTAL
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onPageChange(data.page - 1)}
              disabled={!data.hasPreviousPage || isFetching}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onPageChange(data.page + 1)}
              disabled={!data.hasNextPage || isFetching}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

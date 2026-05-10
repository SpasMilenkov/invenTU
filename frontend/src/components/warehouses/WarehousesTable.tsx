import { Fragment } from 'react';
import type { PagedResult } from '../../lib/hooks/useUsers';
import type { WarehouseSummary } from '../../lib/hooks/useWarehouses';
import type { StockLocationSummary } from '../../lib/hooks/useStockLocations';
import LocationTree from './LocationTree';
import { Tag } from '../ui/Tag';
import { Icon } from '../ui/Icon';
import CapacityBar from './CapacityBar';
import { formatCompactNumber } from '../../lib/format';

interface Props {
  data?: PagedResult<WarehouseSummary>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  canManage: boolean;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onEdit: (w: WarehouseSummary) => void;
  onDeactivate: (w: WarehouseSummary) => void;
  onActivate: (w: WarehouseSummary) => void;
  onDelete: (w: WarehouseSummary) => void;
  onAddLocation: (w: WarehouseSummary) => void;
  onEditLocation: (warehouseId: string, location: StockLocationSummary) => void;
  onDeleteLocation: (warehouseId: string, location: StockLocationSummary) => void;
}

export default function WarehousesTable({
  data,
  isLoading,
  isFetching,
  isError,
  onRetry,
  page,
  pageSize,
  onPageChange,
  canManage,
  expandedIds,
  onToggleExpand,
  onEdit,
  onDeactivate,
  onActivate,
  onDelete,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
}: Props) {
  if (isError) {
    return (
      <div className="info-card">
        <p>Could not load warehouses.</p>
        <button type="button" className="btn btn-outline btn-sm mt-3" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  const showSkeleton = isLoading && !data;
  const items = data?.items ?? [];
  const showEmpty = !showSkeleton && items.length === 0;
  const totalCols = canManage ? 10 : 9;

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Name</th>
              <th>Code</th>
              <th>Location</th>
              <th className="num">Locations</th>
              <th className="num">SKUs</th>
              <th className="num">Quantity</th>
              <th>Capacity</th>
              <th>Status</th>
              {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {showSkeleton &&
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                <tr key={`s-${i}`}>
                  <td></td>
                  <td>
                    <div
                      className="h-3 w-40 animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                  </td>
                  <td>
                    <div
                      className="h-3 w-20 animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                  </td>
                  <td>
                    <div
                      className="h-3 w-24 animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                  </td>
                  <td>
                    <div
                      className="ml-auto h-3 w-8 animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                  </td>
                  <td>
                    <div
                      className="ml-auto h-3 w-10 animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                  </td>
                  <td>
                    <div
                      className="ml-auto h-3 w-10 animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                  </td>
                  <td>
                    <div className="h-3 w-full animate-pulse" style={{ background: 'var(--color-bg-sunk)' }} />
                    <div className="mt-1 h-2 w-16 animate-pulse" style={{ background: 'var(--color-bg-sunk)' }} />
                  </td>
                  <td>
                    <div
                      className="h-3 w-16 animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                  </td>
                  {canManage && <td />}
                </tr>
              ))}
            {items.map((w) => {
              const isExpanded = expandedIds.has(w.id);
              return (
                <Fragment key={w.id}>
                  <tr style={{ opacity: w.isActive ? 1 : 0.6 }}>
                    <td>
                      <button
                        type="button"
                        className="icon-btn"
                        style={{ width: 24, height: 24 }}
                        aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                        aria-expanded={isExpanded}
                        onClick={() => onToggleExpand(w.id)}
                      >
                        <Icon name={isExpanded ? 'chev_down' : 'chev'} size={12} />
                      </button>
                    </td>
                    <td className="strong">{w.name}</td>
                    <td className="sku">{w.code}</td>
                    <td>{w.location ?? '—'}</td>
                    <td className="num">{w.totalLocations.toLocaleString()}</td>
                    <td className="num">{w.totalStockItems.toLocaleString()}</td>
                    <td className="num">{formatCompactNumber(w.totalQuantity)}</td>
                    <td>
                      <CapacityBar used={w.totalStockItems} max={w.maxStockLevel} />
                    </td>
                    <td>
                      <Tag kind={w.isActive ? 'ok' : 'neutral'}>
                        {w.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Tag>
                    </td>
                    {canManage && (
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-1">
                          {w.isActive ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => onEdit(w)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--color-crit)' }}
                                onClick={() => onDeactivate(w)}
                              >
                                Deactivate
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => onActivate(w)}
                              >
                                Reactivate
                              </button>
                              {w.totalLocations === 0 && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  style={{ color: 'var(--color-crit)' }}
                                  onClick={() => onDelete(w)}
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                  {isExpanded && (
                    <tr style={{ background: 'var(--color-bg-sunk)' }}>
                      <td colSpan={totalCols} style={{ padding: '12px 16px' }}>
                        <LocationTree
                          warehouseId={w.id}
                          canManage={canManage}
                          onAdd={() => onAddLocation(w)}
                          onEdit={(loc) => onEditLocation(w.id, loc)}
                          onDelete={(loc) => onDeleteLocation(w.id, loc)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {showEmpty && (
              <tr>
                <td
                  colSpan={totalCols}
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--color-ink-3)',
                  }}
                >
                  No warehouses yet.
                </td>
              </tr>
            )}
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
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || isFetching}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onPageChange(page + 1)}
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

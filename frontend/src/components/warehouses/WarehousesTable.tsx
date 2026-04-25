import { Fragment } from 'react';
import type { PagedResult } from '../../lib/hooks/useUsers';
import type { WarehouseSummary } from '../../lib/hooks/useWarehouses';
import type { StockLocationSummary } from '../../lib/hooks/useStockLocations';
import LocationTree from './LocationTree';

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
      <div className="rounded-md border border-danger-200 bg-danger-50 p-6 text-center text-sm text-danger-700 dark:border-danger-900/60 dark:bg-danger-950/40 dark:text-danger-300">
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
  const totalCols = canManage ? 7 : 6;

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-surface-border bg-surface shadow-card dark:border-secondary-700 dark:bg-secondary-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-surface-border text-left text-sm dark:divide-secondary-700">
          <thead className="bg-surface-alt text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-muted dark:bg-secondary-900/60">
            <tr>
              <th scope="col" className="w-10 px-4"></th>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">Code</th>
              <th scope="col" className="px-6 py-3">Capacity</th>
              <th scope="col" className="px-6 py-3">SKUs</th>
              <th scope="col" className="px-6 py-3">Status</th>
              {canManage && <th scope="col" className="px-6 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border dark:divide-secondary-700">
            {showSkeleton &&
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                <tr key={`s-${i}`}>
                  <td className="px-4 py-4"><div className="h-3 w-3 animate-pulse rounded bg-surface-alt" /></td>
                  <td className="px-6 py-4"><div className="h-3 w-40 animate-pulse rounded bg-surface-alt" /></td>
                  <td className="px-6 py-4"><div className="h-3 w-20 animate-pulse rounded bg-surface-alt" /></td>
                  <td className="px-6 py-4"><div className="h-3 w-16 animate-pulse rounded bg-surface-alt" /></td>
                  <td className="px-6 py-4"><div className="h-3 w-12 animate-pulse rounded bg-surface-alt" /></td>
                  <td className="px-6 py-4"><div className="h-3 w-16 animate-pulse rounded bg-surface-alt" /></td>
                  {canManage && <td className="px-6 py-4" />}
                </tr>
              ))}
            {items.map((w) => {
              const isExpanded = expandedIds.has(w.id);
              return (
                <Fragment key={w.id}>
                  <tr
                    className={`transition-colors hover:bg-surface-alt dark:hover:bg-secondary-900/40 ${
                      w.isActive ? '' : 'opacity-60'
                    }`}
                  >
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                        aria-expanded={isExpanded}
                        onClick={() => onToggleExpand(w.id)}
                      >
                        <span aria-hidden>{isExpanded ? '▼' : '▶'}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 font-medium text-text-primary">{w.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-text-secondary">{w.code}</td>
                    <td className="px-6 py-4 text-text-secondary">
                      {w.maxStockLevel ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{w.totalStockItems}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${w.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        {w.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
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
                                className="btn btn-ghost btn-sm text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/40"
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
                                  className="btn btn-ghost btn-sm text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/40"
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
                    <tr className="bg-surface-alt/30 dark:bg-secondary-900/30">
                      <td colSpan={totalCols} className="px-6 py-4">
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
                  className="px-6 py-12 text-center text-sm text-text-muted"
                >
                  No warehouses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalCount > 0 && (
        <div className="flex items-center justify-between border-t border-surface-border px-6 py-3 text-xs text-text-muted dark:border-secondary-700">
          <span>
            Page {data.page} of {data.totalPages} · {data.totalCount} total
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

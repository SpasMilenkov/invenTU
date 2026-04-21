import type { PagedResult, ProductDto, StockSummary } from '../../lib/types/products';
import StockStatusBadge from './StockStatusBadge';
import EmptyState from './EmptyState';

interface StockLookup {
  byProductId: Map<string, StockSummary>;
  isLoadingForProduct: (id: string) => boolean;
  isErrorForProduct: (id: string) => boolean;
}

interface Props {
  data?: PagedResult<ProductDto>;
  stock: StockLookup;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  onRowClick: (productId: string) => void;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

function formatPrice(n: number): string {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function rowKeyHandler(e: React.KeyboardEvent<HTMLTableRowElement>, onClick: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onClick();
  }
}

export default function ProductsTable({
  data,
  stock,
  isLoading,
  isFetching,
  isError,
  onRetry,
  onRowClick,
  onPageChange,
  hasActiveFilters,
  onClearFilters,
}: Props) {
  if (isError) {
    return (
      <div className="rounded-md border border-danger-200 bg-danger-50 p-6 text-center text-sm text-danger-700 dark:border-danger-900/60 dark:bg-danger-950/40 dark:text-danger-300">
        <p>Could not load products.</p>
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
        title="No products match your filters"
        description="Try a different search term, or clear the filters to see everything."
        actionLabel="Clear filters"
        onAction={onClearFilters}
      />
    ) : (
      <EmptyState
        title="No products yet"
        description="Products will appear here once they are added."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-surface-border bg-surface shadow-card dark:border-secondary-700 dark:bg-secondary-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-surface-border text-left text-sm dark:divide-secondary-700">
          <thead className="bg-surface-alt text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-muted dark:bg-secondary-900/60">
            <tr>
              <th scope="col" className="px-6 py-3">SKU</th>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">Category</th>
              <th scope="col" className="px-6 py-3 text-right">Unit price</th>
              <th scope="col" className="px-6 py-3">Stock status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border dark:divide-secondary-700">
            {showSkeleton &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={`s-${i}`}>
                  <td className="px-6 py-4"><div className="h-3 w-24 animate-pulse rounded bg-surface-alt" /></td>
                  <td className="px-6 py-4"><div className="h-3 w-48 animate-pulse rounded bg-surface-alt" /></td>
                  <td className="px-6 py-4"><div className="h-3 w-32 animate-pulse rounded bg-surface-alt" /></td>
                  <td className="px-6 py-4 text-right"><div className="ml-auto h-3 w-16 animate-pulse rounded bg-surface-alt" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-20 animate-pulse rounded bg-surface-alt" /></td>
                </tr>
              ))}
            {items.map((p) => {
              const handleClick = () => onRowClick(p.id);
              return (
                <tr
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={handleClick}
                  onKeyDown={(e) => rowKeyHandler(e, handleClick)}
                  className={`cursor-pointer transition-colors hover:bg-surface-alt focus:bg-surface-alt focus:outline-none dark:hover:bg-secondary-900/40 dark:focus:bg-secondary-900/40 ${
                    p.isActive ? '' : 'opacity-60'
                  }`}
                >
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-text-secondary">{p.sku}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">{p.name}</span>
                      {!p.isActive && <span className="badge badge-neutral">Archived</span>}
                    </div>
                    {p.barcode && <div className="mt-0.5 text-xs text-text-muted">{p.barcode}</div>}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{p.categoryName}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-text-primary">
                    {formatPrice(p.unitPrice)}
                  </td>
                  <td className="px-6 py-4">
                    <StockStatusBadge
                      minStockLevel={p.minStockLevel}
                      stock={stock.byProductId.get(p.id)}
                      isLoading={stock.isLoadingForProduct(p.id)}
                      isError={stock.isErrorForProduct(p.id)}
                    />
                  </td>
                </tr>
              );
            })}
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

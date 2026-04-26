import { useMemo } from 'react';
import type { PagedResult, ProductDto, StockSummary } from '../../lib/types/products';
import { useCategoriesFlat } from '../../lib/hooks/useCategories';
import StockStatusBadge from './StockStatusBadge';
import EmptyState from './EmptyState';
import { Tag } from '../ui/Tag';

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
  const categories = useCategoriesFlat();
  const pathById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories.data ?? []) map.set(c.id, c.path);
    return map;
  }, [categories.data]);

  if (isError) {
    return (
      <div className="info-card">
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
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th className="num">Unit price</th>
              <th>Stock status</th>
            </tr>
          </thead>
          <tbody>
            {showSkeleton &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={`s-${i}`}>
                  <td>
                    <div
                      className="h-3 w-24 animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                  </td>
                  <td>
                    <div
                      className="h-3 w-48 animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                  </td>
                  <td>
                    <div
                      className="h-3 w-32 animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                  </td>
                  <td>
                    <div
                      className="ml-auto h-3 w-16 animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                  </td>
                  <td>
                    <div
                      className="h-3 w-20 animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                  </td>
                </tr>
              ))}
            {items.map((p) => {
              const handleClick = () => onRowClick(p.id);
              const categoryPath = pathById.get(p.categoryId);
              let categoryCell: React.ReactNode;
              if (categoryPath) {
                categoryCell = categoryPath;
              } else if (categories.isSuccess) {
                // Tree is loaded, but this id isn't in it (deleted/legacy/race) — degraded state.
                categoryCell = (
                  <span style={{ color: 'var(--color-ink-3)' }}>{p.categoryName}</span>
                );
              } else {
                // Tree still loading — render the leaf name without muting to avoid a flicker.
                categoryCell = p.categoryName;
              }
              return (
                <tr
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={handleClick}
                  onKeyDown={(e) => rowKeyHandler(e, handleClick)}
                  className="cursor-pointer"
                  style={{ opacity: p.isActive ? 1 : 0.6 }}
                >
                  <td className="sku">{p.sku}</td>
                  <td className="strong">
                    <div className="flex items-center gap-2">
                      <span>{p.name}</span>
                      {!p.isActive && <Tag kind="neutral">ARCHIVED</Tag>}
                    </div>
                    {p.barcode && (
                      <div
                        style={{ marginTop: 2, fontSize: 11, color: 'var(--color-ink-3)' }}
                      >
                        {p.barcode}
                      </div>
                    )}
                  </td>
                  <td style={{ wordBreak: 'break-word' }}>{categoryCell}</td>
                  <td className="num">{formatPrice(p.unitPrice)}</td>
                  <td>
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

import type { StockSummary } from '../../lib/types/products';
import { deriveStockStatus } from '../../lib/types/products';

interface Props {
  minStockLevel: number;
  stock: StockSummary | undefined;
  isLoading: boolean;
  isError: boolean;
}

const LABEL: Record<ReturnType<typeof deriveStockStatus>, string> = {
  OutOfStock: 'Out of stock',
  LowStock: 'Low stock',
  InStock: 'In stock',
};

const BADGE_CLASS: Record<ReturnType<typeof deriveStockStatus>, string> = {
  OutOfStock: 'badge badge-danger',
  LowStock: 'badge badge-warning',
  InStock: 'badge badge-success',
};

export default function StockStatusBadge({ minStockLevel, stock, isLoading, isError }: Props) {
  if (isLoading) {
    return <div className="h-4 w-20 animate-pulse rounded bg-surface-alt" aria-label="Loading stock" />;
  }
  if (isError || !stock) {
    return <span className="text-text-muted">—</span>;
  }
  const status = deriveStockStatus(stock.totalQuantityAvailable, minStockLevel);
  return (
    <span className={BADGE_CLASS[status]} title={`${stock.totalQuantityAvailable} available across ${stock.warehouseCount} warehouse(s)`}>
      {LABEL[status]}
    </span>
  );
}

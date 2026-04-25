import type { StockSummary } from '../../lib/types/products';
import { deriveStockStatus } from '../../lib/types/products';
import { Tag, type TagKind } from '../ui/Tag';

interface Props {
  minStockLevel: number;
  stock: StockSummary | undefined;
  isLoading: boolean;
  isError: boolean;
}

type Status = ReturnType<typeof deriveStockStatus>;

const LABEL: Record<Status, string> = {
  OutOfStock: 'Out of stock',
  LowStock: 'Low stock',
  InStock: 'In stock',
};

const KIND: Record<Status, TagKind> = {
  OutOfStock: 'crit',
  LowStock: 'warn',
  InStock: 'ok',
};

export default function StockStatusBadge({ minStockLevel, stock, isLoading, isError }: Props) {
  if (isLoading) {
    return (
      <div
        className="h-3 w-16 animate-pulse"
        style={{ background: 'var(--color-bg-sunk)' }}
        aria-label="Loading stock"
      />
    );
  }
  if (isError || !stock) {
    return <span style={{ color: 'var(--color-ink-3)' }}>—</span>;
  }
  const status = deriveStockStatus(stock.totalQuantityAvailable, minStockLevel);
  return (
    <span title={`${stock.totalQuantityAvailable} available across ${stock.warehouseCount} warehouse(s)`}>
      <Tag kind={KIND[status]}>{LABEL[status]}</Tag>
    </span>
  );
}

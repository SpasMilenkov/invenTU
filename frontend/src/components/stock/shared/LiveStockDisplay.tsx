import { useStockItemsForLocation } from '../../../lib/hooks/useReferenceData';

interface LiveStockDisplayProps {
  productId: string;
  warehouseId: string;
  locationId: string;
  enteredQuantity: number;
}

export default function LiveStockDisplay({
  productId,
  warehouseId,
  locationId,
  enteredQuantity,
}: LiveStockDisplayProps) {
  const enabled = !!productId && !!warehouseId && !!locationId;
  const { data, isLoading } = useStockItemsForLocation(
    enabled ? productId : null,
    enabled ? warehouseId : null,
  );

  if (!enabled) return null;

  if (isLoading) {
    return (
      <p className="font-mono text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>
        Loading available stock…
      </p>
    );
  }

  const item = data?.find((i) => i.stockLocationId === locationId);
  const available = item?.quantityAvailable ?? 0;
  const exceeded = enteredQuantity > 0 && enteredQuantity > available;

  return (
    <p
      className="font-mono text-[10.5px] uppercase tracking-wider"
      style={{ color: exceeded ? 'var(--color-crit)' : 'var(--color-ink-3)' }}
    >
      AVAILABLE AT THIS LOCATION:{' '}
      <span className="tnum" style={{ color: 'var(--color-ink)', fontWeight: 600 }}>
        {item !== undefined ? available : '—'}
      </span>
      {exceeded && ' — QUANTITY EXCEEDS AVAILABLE STOCK'}
    </p>
  );
}

import { useStockItemsForLocation } from "../../../lib/hooks/useReferenceData";

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
    return <p className="text-xs text-text-muted">Loading available stock…</p>;
  }

  const item = data?.find((i) => i.stockLocationId === locationId);
  const available = item?.quantityAvailable ?? 0;
  const exceeded = enteredQuantity > 0 && enteredQuantity > available;

  return (
    <p
      className={`text-xs font-medium ${
        exceeded ? "text-danger-600 dark:text-danger-400" : "text-text-muted"
      }`}
    >
      Available at this location:{" "}
      <span className="font-semibold">
        {item !== undefined ? available : "—"}
      </span>
      {exceeded && " — quantity exceeds available stock"}
    </p>
  );
}

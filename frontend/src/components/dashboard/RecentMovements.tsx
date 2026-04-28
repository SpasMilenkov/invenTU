// src/components/dashboard/RecentMovements.tsx

import type {
  StockMovement,
  MovementType,
  MovementStatus,
} from "../../lib/types/dashboard";

interface Props {
  movements: StockMovement[];
}

// Relative timestamp
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1_000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  // Anything older shows a short date so it stays readable
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// Tag mappings (movement type)
// Backend returns: Inbound | Outbound | Transfer
const TYPE_TAG: Record<MovementType, string> = {
  Inbound: "tag-ok",
  Outbound: "tag-warn",
  Transfer: "tag-info",
};

// Tag mappings (status)
// Backend returns: Completed | Pending | Cancelled
const STATUS_TAG: Record<MovementStatus, string> = {
  Completed: "tag-ok",
  Pending: "tag-warn",
  Cancelled: "tag-neutral",
};

export default function RecentMovements({ movements }: Props) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Recent Movements</span>
        <span className="micro" style={{ color: "var(--color-ink-4)" }}>
          Last {movements.length > 0 ? Math.min(movements.length, 10) : 0}{" "}
          records
        </span>
      </div>

      {movements.length === 0 ? (
        <div
          className="empty"
          style={{
            margin: 0,
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
          }}
        >
          No movements recorded yet
        </div>
      ) : (
        <div className="table-container" style={{ border: "none" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Type</th>
                <th>Product</th>
                <th>SKU</th>
                <th className="num">Qty</th>
                <th>Status</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {movements.slice(0, 10).map((m) => (
                <tr key={m.id}>
                  {/* Movement type badge */}
                  <td>
                    <span
                      className={`tag ${TYPE_TAG[m.movementType] ?? "tag-neutral"}`}
                    >
                      {m.movementType}
                    </span>
                  </td>

                  {/* Product name — slightly bolder as the primary identifier */}
                  <td style={{ color: "var(--color-ink)", fontWeight: 500 }}>
                    {m.productName}
                  </td>

                  {/* SKU in monospace */}
                  <td>
                    <span className="sku">{m.sku}</span>
                  </td>

                  {/* Quantity — tabular numbers, right-aligned */}
                  <td className="num tnum">{m.quantity.toLocaleString()}</td>

                  {/* Status badge */}
                  <td>
                    <span
                      className={`tag ${STATUS_TAG[m.status] ?? "tag-neutral"}`}
                    >
                      {m.status}
                    </span>
                  </td>

                  {/* Relative timestamp */}
                  <td>
                    <span
                      className="mono"
                      style={{ fontSize: "11px", color: "var(--color-ink-4)" }}
                      title={new Date(m.createdAt).toLocaleString()}
                    >
                      {relativeTime(m.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

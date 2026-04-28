// src/components/dashboard/LiveStockFeed.tsx
import {
  useStockFeed,
  type ConnectionStatus,
} from "../../lib/hooks/useStockFeed";
import type {
  MovementType,
  StockMovementLiveDto,
} from "../../lib/types/liveFeed";

// helpers

const TYPE_META: Record<
  MovementType,
  { label: string; color: string; bg: string }
> = {
  Receipt: {
    label: "Receipt",
    color: "var(--color-ok)",
    bg: "color-mix(in srgb, var(--color-ok) 12%, transparent)",
  },
  Issue: {
    label: "Issue",
    color: "var(--color-warn)",
    bg: "color-mix(in srgb, var(--color-warn) 12%, transparent)",
  },
  Transfer: {
    label: "Transfer",
    color: "var(--color-info)",
    bg: "color-mix(in srgb, var(--color-info) 12%, transparent)",
  },
  Adjustment: {
    label: "Adjust",
    color: "var(--color-accent)",
    bg: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
  },
  Count: {
    label: "Count",
    color: "var(--color-ink-2)",
    bg: "color-mix(in srgb, var(--color-ink-2) 12%, transparent)",
  },
  WriteOff: {
    label: "Write-off",
    color: "var(--color-crit)",
    bg: "color-mix(in srgb, var(--color-crit) 12%, transparent)",
  },
};

const STATUS_DOT: Record<ConnectionStatus, { color: string; label: string }> = {
  connecting: { color: "var(--color-warn)", label: "Connecting…" },
  connected: { color: "var(--color-ok)", label: "Live" },
  reconnecting: { color: "var(--color-warn)", label: "Reconnecting…" },
  disconnected: { color: "var(--color-crit)", label: "Disconnected" },
};

const formatRelative = (iso: string): string => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1_000;
  if (diff < 5) return "just now";
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const productLabel = (m: StockMovementLiveDto): string =>
  m.productName || `…${m.productId.slice(-8)}`;

const routeLabel = (m: StockMovementLiveDto): string => {
  if (m.movementType === "Transfer") {
    return `${m.sourceWarehouseName ?? "?"} → ${m.destinationWarehouseName ?? "?"}`;
  }
  const wh = m.destinationWarehouseName ?? m.sourceWarehouseName;
  const loc = m.locationCode ? ` · ${m.locationCode}` : "";
  return wh ? `${wh}${loc}` : "—";
};

// sub-components

const TypeBadge = ({ type }: { type: MovementType }) => {
  const meta = TYPE_META[type] ?? TYPE_META.Count;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.02em",
        color: meta.color,
        background: meta.bg,
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
};

const QuantityDelta = ({
  value,
  type,
}: {
  value: number;
  type: MovementType;
}) => {
  const isTransfer = type === "Transfer";
  const isPositive = value > 0;
  const color = isTransfer
    ? "var(--color-info)"
    : isPositive
      ? "var(--color-ok)"
      : "var(--color-crit)";
  const arrow = isTransfer ? "⇄" : isPositive ? "▲" : "▼";
  return (
    <span
      style={{
        color,
        fontVariantNumeric: "tabular-nums",
        fontWeight: 700,
        fontSize: 13,
        whiteSpace: "nowrap",
      }}
    >
      {arrow} {Math.abs(value).toLocaleString()}
    </span>
  );
};

const EmptyState = () => (
  <div
    style={{
      padding: "40px 0",
      textAlign: "center",
      color: "var(--color-ink-3)",
      fontSize: 13,
    }}
  >
    <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
    Waiting for stock activity…
  </div>
);

// mobile card

const MobileCard = ({ m }: { m: StockMovementLiveDto }) => (
  <div className="feed-mobile-card feed-row-enter">
    {/* top row: badge + qty + time */}
    <div className="feed-card-top">
      <TypeBadge type={m.movementType} />
      <QuantityDelta value={m.displayQuantity} type={m.movementType} />
      <span className="feed-card-time">{formatRelative(m.occurredAt)}</span>
    </div>

    {/* product */}
    <div className="feed-card-product">{productLabel(m)}</div>

    {/* detail chips */}
    <div className="feed-card-chips">
      {routeLabel(m) !== "—" && (
        <span className="feed-chip">
          <span className="feed-chip-label">Route</span>
          {routeLabel(m)}
        </span>
      )}
      {m.statusOrReason && (
        <span className="feed-chip">
          <span className="feed-chip-label">Status</span>
          {m.statusOrReason}
        </span>
      )}
      {m.referenceNumber && (
        <span className="feed-chip">
          <span className="feed-chip-label">Ref</span>
          {m.referenceNumber}
        </span>
      )}
    </div>

    {/* notes — only when present */}
    {m.notes && (
      <div className="feed-card-notes">
        <span className="feed-chip-label">Note · </span>
        {m.notes}
      </div>
    )}
  </div>
);

// desktop row

const DesktopRow = ({ m }: { m: StockMovementLiveDto }) => (
  <tr className="feed-row-enter">
    <td>
      <TypeBadge type={m.movementType} />
    </td>
    <td className="feed-td-product">
      <span className="feed-product-name">{productLabel(m)}</span>
    </td>
    <td>
      <QuantityDelta value={m.displayQuantity} type={m.movementType} />
    </td>
    <td className="feed-td-muted feed-td-wrap">{routeLabel(m)}</td>
    <td className="feed-td-muted">{m.statusOrReason ?? "—"}</td>
    <td className="feed-td-ref">{m.referenceNumber ?? "—"}</td>
    <td className="feed-td-notes feed-td-muted" title={m.notes ?? undefined}>
      {m.notes ? <span className="feed-notes-truncate">{m.notes}</span> : "—"}
    </td>
    <td className="feed-td-when micro">{formatRelative(m.occurredAt)}</td>
  </tr>
);

export default function LiveStockFeed() {
  const { movements, status, clear } = useStockFeed();
  const dot = STATUS_DOT[status];

  return (
    <div className="info-card">
      <style>{`
        /* ── enter animation ── */
        @keyframes feedRowIn {
          from {
            opacity: 0;
            background: color-mix(in srgb, var(--color-accent) 10%, transparent);
          }
          to {
            opacity: 1;
            background: transparent;
          }
        }
        .feed-row-enter {
          animation: feedRowIn 0.5s ease-out forwards;
        }

        /* ── desktop table ── */
        .feed-table {
          width: 100%;
          border-collapse: collapse;
        }
        .feed-table th {
          padding: 5px 10px;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--color-ink-3);
          border-bottom: 2px solid var(--color-border);
          white-space: nowrap;
        }
        .feed-table td {
          padding: 7px 10px;
          border-bottom: 1px solid var(--color-border);
          vertical-align: middle;
          font-size: 12px;
        }
        .feed-table tr:last-child td {
          border-bottom: none;
        }
        .feed-table tbody tr:hover td {
          background: color-mix(in srgb, var(--color-ink-3) 4%, transparent);
        }

        /* td helpers */
        .feed-td-product { max-width: 180px; }
        .feed-product-name {
          font-size: 13px;
          font-weight: 500;
          word-break: break-word;
          color: var(--color-ink-1);
        }
        .feed-td-muted { color: var(--color-ink-2); }
        .feed-td-wrap { word-break: break-word; max-width: 200px; }
        .feed-td-ref {
          font-size: 11px;
          font-family: monospace;
          color: var(--color-ink-2);
          white-space: nowrap;
        }
        .feed-td-notes { max-width: 160px; }
        .feed-notes-truncate {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          cursor: help;
          font-size: 11px;
        }
        .feed-td-when {
          white-space: nowrap;
          color: var(--color-ink-3);
        }

        /* ── mobile cards ── */
        .feed-mobile-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .feed-mobile-card {
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: color-mix(in srgb, var(--color-ink-3) 2%, transparent);
        }
        .feed-card-top {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .feed-card-time {
          margin-left: auto;
          font-size: 11px;
          color: var(--color-ink-3);
          white-space: nowrap;
        }
        .feed-card-product {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-ink-1);
          word-break: break-word;
        }
        .feed-card-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .feed-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 4px;
          border: 1px solid var(--color-border);
          color: var(--color-ink-2);
          background: color-mix(in srgb, var(--color-ink-3) 4%, transparent);
        }
        .feed-chip-label {
          font-weight: 700;
          font-size: 10px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--color-ink-3);
        }
        .feed-card-notes {
          font-size: 11px;
          color: var(--color-ink-2);
          line-height: 1.4;
          padding-top: 2px;
          border-top: 1px solid var(--color-border);
        }

        /* ── responsive switch ── */
        .feed-desktop-wrap { display: block; overflow-x: auto; }
        .feed-mobile-list-wrap { display: none; }

        @media (max-width: 680px) {
          .feed-desktop-wrap { display: none; }
          .feed-mobile-list-wrap { display: block; }
        }
      `}</style>

      {/* ── header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          gap: 8,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
        >
          <h2
            className="section-title"
            style={{ margin: 0, whiteSpace: "nowrap" }}
          >
            Live Stock Activity
          </h2>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              color: dot.color,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: dot.color,
                flexShrink: 0,
                boxShadow:
                  status === "connected"
                    ? `0 0 0 2px color-mix(in srgb, ${dot.color} 25%, transparent)`
                    : "none",
              }}
            />
            {dot.label}
          </span>
        </div>
        {movements.length > 0 && (
          <button
            className="btn btn-sm"
            onClick={clear}
            style={{ fontSize: 11, flexShrink: 0 }}
          >
            Clear
          </button>
        )}
      </div>

      {/* ── empty ── */}
      {movements.length === 0 && <EmptyState />}

      {/* ── desktop table ── */}
      {movements.length > 0 && (
        <div className="feed-desktop-wrap">
          <table className="feed-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Route / Location</th>
                <th>Status / Reason</th>
                <th>Ref #</th>
                <th>Notes</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <DesktopRow key={m.movementId} m={m} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── mobile cards ── */}
      {movements.length > 0 && (
        <div className="feed-mobile-list-wrap">
          <div className="feed-mobile-list">
            {movements.map((m) => (
              <MobileCard key={m.movementId} m={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

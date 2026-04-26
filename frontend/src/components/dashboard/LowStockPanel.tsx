// src/components/dashboard/LowStockPanel.tsx
import { useAlertFeed } from "../../lib/hooks/useAlertFeed";
import type { AlertLiveDto } from "../../lib/types/alerts";

const LOW_STOCK_TYPES = new Set([
  "LowStock",
  "LowStockLevel",
  "StockBelowMinimum",
]);
const isLowStock = (a: AlertLiveDto) => LOW_STOCK_TYPES.has(a.alertType);

// stock health bar
function StockBar({ pct }: { pct: number }) {
  const color =
    pct <= 25
      ? "var(--color-crit)"
      : pct <= 60
        ? "var(--color-warn)"
        : "var(--color-ok)";
  return (
    <div
      style={{
        height: 3,
        borderRadius: 2,
        marginTop: 5,
        background: "var(--color-border)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          transition: "width 0.4s",
        }}
      />
    </div>
  );
}

// alert row
function AlertRow({
  alert,
  onMarkRead,
}: {
  alert: AlertLiveDto;
  onMarkRead: (id: string) => void;
}) {
  const age = formatAge(alert.createdAt);
  const hasStockData =
    alert.currentQuantity != null && alert.minStockLevel != null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 0",
        borderBottom: "1px solid var(--color-border)",
        opacity: alert.isRead ? 0.5 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {/* unread dot */}
      <div style={{ paddingTop: 5, flexShrink: 0 }}>
        {!alert.isRead ? (
          <span
            style={{
              display: "block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--color-crit)",
            }}
          />
        ) : (
          <span style={{ display: "block", width: 7 }} />
        )}
      </div>

      {/* content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* product name + SKU */}
        {alert.productName && (
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-ink-1)",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {alert.productName}
            {alert.sku && (
              <span
                style={{
                  fontWeight: 400,
                  color: "var(--color-ink-3)",
                  marginLeft: 6,
                  fontSize: 11,
                }}
              >
                {alert.sku}
              </span>
            )}
          </p>
        )}

        {/* fallback message when no product name */}
        {!alert.productName && (
          <p
            style={{
              fontSize: 13,
              color: "var(--color-ink-1)",
              margin: 0,
              lineHeight: 1.4,
              wordBreak: "break-word",
            }}
          >
            {alert.message}
          </p>
        )}

        {/* stock numbers */}
        {hasStockData && (
          <>
            <p
              className="micro"
              style={{
                color: "var(--color-ink-2)",
                marginTop: 4,
                marginBottom: 0,
              }}
            >
              <span
                style={{
                  color:
                    alert.stockHealthPct != null && alert.stockHealthPct <= 25
                      ? "var(--color-crit)"
                      : "var(--color-ink-1)",
                  fontWeight: 600,
                }}
              >
                {alert.currentQuantity}
              </span>{" "}
              / {alert.minStockLevel} min
              {alert.reorderSuggestion != null && (
                <span style={{ color: "var(--color-ink-3)", marginLeft: 8 }}>
                  · suggest {alert.reorderSuggestion}
                </span>
              )}
            </p>
            {alert.stockHealthPct != null && (
              <StockBar pct={alert.stockHealthPct} />
            )}
          </>
        )}

        {/* location breadcrumb */}
        <p
          className="micro"
          style={{ color: "var(--color-ink-3)", marginTop: 4 }}
        >
          {[alert.warehouseName, alert.locationCode]
            .filter(Boolean)
            .join(" · ")}
          {alert.warehouseName || alert.locationCode ? " · " : ""}
          {age}
        </p>
      </div>

      {/* mark read */}
      {!alert.isRead && (
        <button
          className="btn btn-sm"
          style={{ flexShrink: 0, fontSize: 11 }}
          onClick={() => onMarkRead(alert.alertId)}
          title="Mark as read"
        >
          ✓
        </button>
      )}
    </div>
  );
}

// skeleton / empty / main — unchanged structure, kept for brevity
// (LowStockSkeleton, empty state, panel wrapper — same as before)
export default function LowStockPanel() {
  const { alerts, isSeeding, markRead, markAllRead } = useAlertFeed();
  if (isSeeding) return <LowStockSkeleton />;

  const lowStockAlerts = alerts.filter(isLowStock);
  const unreadCount = lowStockAlerts.filter((a) => !a.isRead).length;

  return (
    <div
      className="panel"
      style={
        unreadCount > 0
          ? {
              borderTop: "2px solid var(--color-crit)",
              borderColor:
                "color-mix(in oklab, var(--color-crit) 35%, transparent)",
            }
          : undefined
      }
    >
      <div className="panel-head">
        <span className="panel-title">Low Stock</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {unreadCount > 0 && (
            <button
              className="btn btn-sm"
              style={{ fontSize: 11 }}
              onClick={markAllRead}
            >
              Mark all read
            </button>
          )}
          <span
            className={`tag ${lowStockAlerts.length > 0 ? "tag-crit" : "tag-ok"}`}
          >
            {lowStockAlerts.length === 0
              ? "All good"
              : unreadCount > 0
                ? `${unreadCount} unread`
                : "All read"}
          </span>
        </div>
      </div>

      <div className="panel-body">
        {lowStockAlerts.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3"
            style={{ padding: "20px 0" }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background: "var(--color-ok-soft)",
                display: "grid",
                placeItems: "center",
                borderRadius: 2,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-ok)"
                strokeWidth="2"
                strokeLinecap="square"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p
              className="micro"
              style={{
                color: "var(--color-ink-3)",
                textAlign: "center",
                maxWidth: 180,
              }}
            >
              No items below reorder point
            </p>
          </div>
        ) : (
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {lowStockAlerts.map((alert) => (
              <AlertRow
                key={alert.alertId}
                alert={alert}
                onMarkRead={markRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatAge(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1_000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function LowStockSkeleton() {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Low Stock</span>
      </div>
      <div className="panel-body">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 64, borderRadius: 4, marginBottom: 8 }}
          />
        ))}
      </div>
    </div>
  );
}

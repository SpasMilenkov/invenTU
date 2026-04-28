// src/components/dashboard/AlertsFeedPanel.tsx
import { useState } from "react";
import { useAlertFeed } from "../../lib/hooks/useAlertFeed";
import type { AlertLiveDto } from "../../lib/types/alerts";

// Category definitions — add new buckets here as alert types grow
type CategoryKey = "stock" | "orders" | "system";

interface AlertCategory {
  key: CategoryKey;
  label: string;
  types: ReadonlySet<string>;
  color: string; // CSS variable name
}

const CATEGORIES: AlertCategory[] = [
  {
    key: "stock",
    label: "Stock",
    types: new Set(["LowStock", "LowStockLevel", "StockBelowMinimum", "NeedsReorder"]),
    color: "var(--color-crit)",
  },
  {
    key: "orders",
    label: "Orders",
    types: new Set(["OrderDelayed", "OrderOverdue", "PurchaseOrderExpired"]),
    color: "var(--color-warn)",
  },
  {
    key: "system",
    label: "System",
    types: new Set(["SystemAlert", "SyncFailure", "ImportError"]),
    color: "var(--color-ink-3)",
  },
];

function categoryOf(alert: AlertLiveDto): CategoryKey | null {
  for (const cat of CATEGORIES) {
    if (cat.types.has(alert.alertType)) return cat.key;
  }
  return null;
}

// StockBar — only rendered for stock-category alerts with health data
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

// AlertRow
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
        {alert.productName ? (
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
        ) : (
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

// CategoryTab
function CategoryTab({
  label,
  count,
  unread,
  active,
  color,
  onClick,
}: {
  label: string;
  count: number;
  unread: number;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 3,
        border: active ? `1px solid ${color}` : "1px solid var(--color-border)",
        background: active
          ? `color-mix(in oklab, ${color} 10%, transparent)`
          : "transparent",
        color: active ? color : "var(--color-ink-2)",
        fontSize: 11,
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      <span
        style={{
          background: unread > 0 ? color : "var(--color-bg-sunk)",
          color: unread > 0 ? "#fff" : "var(--color-ink-3)",
          borderRadius: 10,
          padding: "0 5px",
          fontSize: 10,
          fontWeight: 600,
          minWidth: 16,
          textAlign: "center",
        }}
      >
        {unread > 0 ? unread : count}
      </span>
    </button>
  );
}

// Empty state
function EmptyState({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col items-center gap-3"
      style={{ padding: "24px 0" }}
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
        No {label.toLowerCase()} alerts
      </p>
    </div>
  );
}

// Skeleton
export function AlertsFeedSkeleton() {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Alerts</span>
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

// Main panel
export default function AlertsFeedPanel() {
  const { alerts, isSeeding, markRead, markAllRead } = useAlertFeed();
  const [activeKey, setActiveKey] = useState<CategoryKey>("stock");

  if (isSeeding) return <AlertsFeedSkeleton />;

  // Bucket all alerts by category, drop uncategorised ones
  const buckets = new Map<CategoryKey, AlertLiveDto[]>(
    CATEGORIES.map((c) => [c.key, []]),
  );
  for (const alert of alerts) {
    const key = categoryOf(alert);
    if (key) buckets.get(key)!.push(alert);
  }

  const totalUnread = alerts.filter((a) => !a.isRead).length;

  // Only show tabs for categories that exist in config
  // (future-proof: tab won't appear until the first alert of that type arrives
  //  — swap to CATEGORIES if you always want all tabs visible)
  const visibleCategories = CATEGORIES;

  const activeCategory = CATEGORIES.find((c) => c.key === activeKey)!;
  const activeAlerts = buckets.get(activeKey) ?? [];
  const activeUnread = activeAlerts.filter((a) => !a.isRead).length;

  function handleMarkAllRead() {
    // Scope mark-all-read to only the active category's alerts
    for (const alert of activeAlerts) {
      if (!alert.isRead) markRead(alert.alertId);
    }
  }

  return (
    <div
      className="panel"
      style={
        totalUnread > 0
          ? {
              borderTop: "2px solid var(--color-crit)",
              borderColor:
                "color-mix(in oklab, var(--color-crit) 35%, transparent)",
            }
          : undefined
      }
    >
      {/* Header */}
      <div className="panel-head" style={{ flexWrap: "wrap", gap: 8 }}>
        <span className="panel-title">Alerts</span>

        {/* Category tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flex: 1,
            flexWrap: "wrap",
          }}
        >
          {visibleCategories.map((cat) => {
            const catAlerts = buckets.get(cat.key) ?? [];
            const catUnread = catAlerts.filter((a) => !a.isRead).length;
            return (
              <CategoryTab
                key={cat.key}
                label={cat.label}
                count={catAlerts.length}
                unread={catUnread}
                active={activeKey === cat.key}
                color={cat.color}
                onClick={() => setActiveKey(cat.key)}
              />
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {activeUnread > 0 && (
            <button
              className="btn btn-sm"
              style={{ fontSize: 11 }}
              onClick={handleMarkAllRead}
            >
              Mark all read
            </button>
          )}
          <span className={`tag ${activeUnread > 0 ? "tag-crit" : "tag-ok"}`}>
            {activeAlerts.length === 0
              ? "All good"
              : activeUnread > 0
                ? `${activeUnread} unread`
                : "All read"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="panel-body">
        {activeAlerts.length === 0 ? (
          <EmptyState label={activeCategory.label} />
        ) : (
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {activeAlerts.map((alert) => (
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

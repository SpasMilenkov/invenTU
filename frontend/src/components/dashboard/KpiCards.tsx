// src/components/dashboard/KpiCards.tsx
//
// Renders all six KPI tiles sourced from the three stats endpoints.
// Accepts granular `*Ready` flags from useStats so tiles that have resolved
// can appear immediately rather than waiting for the slowest query.
//
// Tile grouping:
//   Inventory health (3)  →  inventoryHealthReady
//   Alert summary   (1)  →  alertsReady
//   PO pipeline     (2)  →  pipelineReady (totalOpenOrders + totalOpenValue
//                            collapse into one tile; byStatus breakdown in sub)

import type { StatsData } from "../../lib/types/stats";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Props {
  stats: StatsData;
  /** Individual query resolution flags — tiles skeleton independently. */
  inventoryHealthReady?: boolean;
  alertsReady?: boolean;
  pipelineReady?: boolean;
}

// ---------------------------------------------------------------------------
// Internal tile shape
// ---------------------------------------------------------------------------
interface KpiDef {
  label: string;
  value: string;
  sub: string;
  /** Accent badge label (e.g. "↑ 12%", "3 critical") */
  badge?: string;
  badgeCrit?: boolean;
  crit?: boolean;
  ready: boolean;
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------
function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function plural(n: number, word: string): string {
  return `${n.toLocaleString()} ${n === 1 ? word : `${word}s`}`;
}

/** Build a concise PO status breakdown string, e.g. "2 Draft · 4 Sent". */
function formatByStatus(byStatus: Record<string, number>): string {
  return Object.entries(byStatus)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `${count} ${status}`)
    .join(" · ");
}

/** Build a concise alert type breakdown string, e.g. "3 LowStock · 1 Expiry". */
function formatByType(byType: Record<string, number>): string {
  return Object.entries(byType)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${count} ${type}`)
    .join(" · ");
}

// ---------------------------------------------------------------------------
// Skeleton tile (shown while a query is still pending)
// ---------------------------------------------------------------------------
function KpiTileSkeleton({ label }: { label: string }) {
  return (
    <div className="kpi" aria-busy="true" aria-label={`Loading ${label}`}>
      <div className="kpi-label">{label}</div>
      <div
        className="kpi-value"
        style={{
          background: "var(--color-surface-2, #e5e7eb)",
          borderRadius: 4,
          height: "1.75rem",
          width: "4rem",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        className="kpi-foot"
        style={{
          background: "var(--color-surface-2, #e5e7eb)",
          borderRadius: 4,
          height: "0.75rem",
          width: "7rem",
          marginTop: 6,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single KPI tile
// ---------------------------------------------------------------------------
function KpiTile({ tile }: { tile: KpiDef }) {
  if (!tile.ready) return <KpiTileSkeleton label={tile.label} />;

  const critStyle = tile.crit
    ? {
        borderColor: "color-mix(in oklab, var(--color-crit) 40%, transparent)",
        borderLeft: "3px solid var(--color-crit)",
      }
    : undefined;

  return (
    <div className="kpi" style={critStyle}>
      <div
        className="kpi-label"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        <span>{tile.label}</span>
        {tile.badge && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.02em",
              padding: "1px 6px",
              borderRadius: 999,
              background: tile.badgeCrit
                ? "color-mix(in oklab, var(--color-crit) 12%, transparent)"
                : "color-mix(in oklab, var(--color-ink-2) 10%, transparent)",
              color: tile.badgeCrit
                ? "var(--color-crit)"
                : "var(--color-ink-2)",
              whiteSpace: "nowrap",
            }}
          >
            {tile.badge}
          </span>
        )}
      </div>

      <div
        className="kpi-value"
        style={{ color: tile.crit ? "var(--color-crit)" : "var(--color-ink)" }}
      >
        {tile.value}
      </div>

      <div className="kpi-foot">{tile.sub}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function KpiCards({
  stats,
  inventoryHealthReady = true,
  alertsReady = true,
  pipelineReady = true,
}: Props) {
  const { inventoryHealth, alerts, pipeline } = stats;

  // Unresolved alerts broken down by type (e.g. "3 LowStock · 1 Expiry").
  const alertBreakdown = formatByType(alerts.byType);

  // PO status breakdown (e.g. "2 Draft · 5 Sent · 1 PartiallyReceived").
  const poStatusBreakdown = formatByStatus(pipeline.byStatus);

  const tiles: KpiDef[] = [
    // Inventory health
    {
      label: "Active SKUs",
      value: inventoryHealth.totalActiveProducts.toLocaleString(),
      sub: "Non-deleted, active products",
      ready: inventoryHealthReady,
    },
    {
      label: "Stock Locations",
      value: inventoryHealth.totalStockLocations.toLocaleString(),
      sub: "Zones · aisles · bins",
      ready: inventoryHealthReady,
    },
    {
      label: "Stock Value",
      value: formatCurrency(inventoryHealth.totalStockValue),
      sub: `${inventoryHealth.totalStockUnits.toLocaleString()} units on hand`,
      ready: inventoryHealthReady,
    },
    {
      label: "Below Reorder Point",
      value: inventoryHealth.productsBelowReorderPoint.toLocaleString(),
      sub:
        inventoryHealth.productsBelowReorderPoint === 0
          ? "All products adequately stocked"
          : plural(inventoryHealth.productsBelowReorderPoint, "product") +
            " need replenishment",
      crit: inventoryHealth.productsBelowReorderPoint > 0,
      badge:
        inventoryHealth.productsBelowReorderPoint > 0
          ? "Needs attention"
          : undefined,
      badgeCrit: inventoryHealth.productsBelowReorderPoint > 0,
      ready: inventoryHealthReady,
    },

    // Alert summary
    {
      label: "Unresolved Alerts",
      value: alerts.totalUnresolved.toLocaleString(),
      sub:
        alertBreakdown ||
        (alerts.unreadForCurrentUser > 0
          ? `${alerts.unreadForCurrentUser} unread by you`
          : "All caught up"),
      badge:
        alerts.unreadForCurrentUser > 0
          ? `${alerts.unreadForCurrentUser} unread`
          : undefined,
      badgeCrit: alerts.unreadForCurrentUser > 0,
      crit: alerts.totalUnresolved > 0,
      ready: alertsReady,
    },

    // PO pipeline
    {
      label: "Open Orders",
      value: pipeline.totalOpenOrders.toLocaleString(),
      sub:
        poStatusBreakdown ||
        `${formatCurrency(pipeline.totalOpenValue)} committed`,
      badge:
        pipeline.totalOpenValue > 0
          ? formatCurrency(pipeline.totalOpenValue)
          : undefined,
      ready: pipelineReady,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {tiles.map((tile) => (
        <KpiTile key={tile.label} tile={tile} />
      ))}
    </div>
  );
}

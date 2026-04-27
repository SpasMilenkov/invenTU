// src/components/dashboard/DashboardPage.tsx
//
// Wires useStats (three concurrent KPI queries) and useDashboard (chart +
// movements) independently so each section can skeleton/error on its own.
// LowStockPanel manages its own data via useAlertFeed internally.

import { useDashboard } from "../../lib/hooks/useDashboard";
import { useStats } from "../../lib/hooks/useStats";
import QueryProvider from "../providers/QueryProvider";
import KpiCards from "./KpiCards";
import StockByCategoryChart from "./StockByCategory";
import RecentMovements from "./RecentMovements";
import AlertPanel from "./AlertPanel";
import LiveStockFeed from "./LiveStockFeed";
import { KpiSkeleton, ChartSkeleton, FeedSkeleton } from "./DashboardSkeletons";

// ---------------------------------------------------------------------------
// Error banner — shared by both data sources
// ---------------------------------------------------------------------------
function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="info-card" style={{ borderLeftColor: "var(--color-crit)" }}>
      <p
        className="micro"
        style={{ color: "var(--color-crit)", marginBottom: 6 }}
      >
        Failed to load dashboard
      </p>
      <p style={{ fontSize: "12.5px", color: "var(--color-ink-2)" }}>
        {message}
      </p>
      <button
        className="btn btn-sm btn-danger"
        style={{ marginTop: 12 }}
        onClick={() => window.location.reload()}
      >
        Retry
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner (inside QueryProvider)
// ---------------------------------------------------------------------------
function DashboardInner() {
  // Stats: three concurrent queries — inventory health, alerts, PO pipeline.
  // Each has its own staleTime and exposes an individual "ready" flag so KPI
  // tiles can appear as soon as their own query resolves rather than waiting
  // for the slowest of the three.
  const {
    stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsRawError,
    inventoryHealthReady,
    alertsReady,
    pipelineReady,
  } = useStats();

  // Dashboard: chart data + recent movements. Independent of stats.
  const {
    data: dashData,
    isLoading: dashLoading,
    isError: dashError,
    error: dashRawError,
  } = useDashboard();

  // Derive the worst-case error message for each source.
  const statsErrorMsg =
    statsRawError instanceof Error
      ? statsRawError.message
      : "Stats unavailable — check the API and try refreshing.";

  const dashErrorMsg =
    dashRawError instanceof Error
      ? dashRawError.message
      : "Dashboard data unavailable — check the API and try refreshing.";

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Warehouse health at a glance</p>
        </div>
      </div>

      {/* KPI cards */}
      {statsError ? (
        <ErrorBanner message={statsErrorMsg} />
      ) : statsLoading || !stats ? (
        // Fall back to a full skeleton while at least one query is pending.
        // If individual tiles are needed independently, KpiCards itself can
        // consume useStats and render per-tile skeletons — but that couples
        // the component to its data source. The granular flags are passed
        // through so KpiCards can gate each tile without re-fetching.
        <KpiSkeleton />
      ) : (
        <KpiCards
          stats={stats}
          inventoryHealthReady={inventoryHealthReady}
          alertsReady={alertsReady}
          pipelineReady={pipelineReady}
        />
      )}

      {/* Chart row + low-stock panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_1fr]">
        <AlertPanel />
        {dashError ? (
          <ErrorBanner message={dashErrorMsg} />
        ) : dashLoading || !dashData ? (
          <ChartSkeleton />
        ) : (
          <StockByCategoryChart items={dashData.stockByCategory} />
        )}

        {/* AlertPanel is always mounted — it owns its own loading state */}
      </div>

      {/* Recent movements feed */}
      {dashLoading || !dashData ? (
        <FeedSkeleton />
      ) : (
        <RecentMovements movements={dashData.recentMovements} />
      )}

      {/* Live stock feed (self-managed) */}
      <LiveStockFeed />
    </div>
  );
}

// Public export (wraps with QueryProvider)
export default function DashboardPage() {
  return (
    <QueryProvider>
      <DashboardInner />
    </QueryProvider>
  );
}

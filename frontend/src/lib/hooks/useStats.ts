// src/lib/hooks/useStats.ts
import { useQueries } from "@tanstack/react-query";
import apiClient from "../api";
import type {
  AlertSummaryResponse,
  InventoryHealthResponse,
  PublicSummaryResponse,
  PurchaseOrderPipelineResponse,
} from "../types/stats";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const STATS_KEYS = {
  inventoryHealth: ["stats", "inventory-health"] as const,
  alerts: ["stats", "alerts"] as const,
  purchaseOrderPipeline: ["stats", "purchase-order-pipeline"] as const,
  publicSummary: ["stats", "public-summary"] as const,
} as const;

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------
async function fetchInventoryHealth(): Promise<InventoryHealthResponse> {
  const { data } = await apiClient.get<InventoryHealthResponse>(
    "/stats/inventory-health",
  );
  return data;
}

async function fetchAlertSummary(): Promise<AlertSummaryResponse> {
  const { data } = await apiClient.get<AlertSummaryResponse>("/stats/alerts");
  return data;
}

async function fetchPurchaseOrderPipeline(): Promise<PurchaseOrderPipelineResponse> {
  const { data } = await apiClient.get<PurchaseOrderPipelineResponse>(
    "/stats/purchase-order-pipeline",
  );
  return data;
}

async function fetchPublicSummary(): Promise<PublicSummaryResponse> {
  const { data } = await apiClient.get<PublicSummaryResponse>(
    "/stats/public-summary",
  );
  return data;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
/**
 * Fetches all four stats endpoints concurrently using `useQueries`.
 *
 * - `publicSummary` is anonymous (no auth required) and has a long staleTime
 *   because warehouse/SKU counts change infrequently.
 * - `alerts` refreshes twice as often as the other authenticated queries
 *   because unread counts change more frequently.
 *
 * Returns individual loading/error states per query so callers can render
 * skeleton tiles independently rather than waiting for the slowest query.
 */
export function useStats() {
  const [inventoryHealthQuery, alertsQuery, pipelineQuery, publicSummaryQuery] =
    useQueries({
      queries: [
        {
          queryKey: STATS_KEYS.inventoryHealth,
          queryFn: fetchInventoryHealth,
          staleTime: 60_000,
          refetchOnWindowFocus: true,
        },
        {
          queryKey: STATS_KEYS.alerts,
          queryFn: fetchAlertSummary,
          staleTime: 30_000, // unread counts change more often
          refetchOnWindowFocus: true,
        },
        {
          queryKey: STATS_KEYS.purchaseOrderPipeline,
          queryFn: fetchPurchaseOrderPipeline,
          staleTime: 60_000,
          refetchOnWindowFocus: true,
        },
        {
          queryKey: STATS_KEYS.publicSummary,
          queryFn: fetchPublicSummary,
          staleTime: 300_000, // warehouse/SKU counts are slow-changing
          refetchOnWindowFocus: false,
        },
      ],
    });

  const isLoading =
    inventoryHealthQuery.isPending ||
    alertsQuery.isPending ||
    pipelineQuery.isPending;
  // publicSummary is intentionally excluded — it's a side concern and
  // shouldn't block the main dashboard from rendering.

  const isError =
    inventoryHealthQuery.isError ||
    alertsQuery.isError ||
    pipelineQuery.isError;

  const error =
    inventoryHealthQuery.error ?? alertsQuery.error ?? pipelineQuery.error;

  const stats =
    inventoryHealthQuery.data && alertsQuery.data && pipelineQuery.data
      ? {
          inventoryHealth: inventoryHealthQuery.data,
          alerts: alertsQuery.data,
          pipeline: pipelineQuery.data,
        }
      : undefined;

  return {
    stats,
    isLoading,
    isError,
    error,
    // Granular per-query flags for components that want independent skeletons.
    inventoryHealthReady: !inventoryHealthQuery.isPending,
    alertsReady: !alertsQuery.isPending,
    pipelineReady: !pipelineQuery.isPending,
    // Public summary — available before login, never blocks the dashboard.
    publicSummary: publicSummaryQuery.data,
    publicSummaryReady: !publicSummaryQuery.isPending,
  };
}

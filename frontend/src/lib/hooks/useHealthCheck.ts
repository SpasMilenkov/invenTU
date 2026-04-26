import { useQuery } from "@tanstack/react-query";
import apiClient from "../api";

export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface HealthCheckResult {
  status: HealthStatus;
  /** Raw string returned by the ASP.NET health endpoint */
  raw: string | null;
}

const STATUS_MAP: Record<string, HealthStatus> = {
  Healthy: "healthy",
  Degraded: "degraded",
  Unhealthy: "unhealthy",
};

export function useHealthCheck(intervalMs = 30_000) {
  return useQuery<HealthCheckResult>({
    queryKey: ["health"],
    queryFn: async (): Promise<HealthCheckResult> => {
      // The /health endpoint returns a plain-text body: "Healthy", "Degraded",
      // or "Unhealthy". It responds 200 for Healthy/Degraded and 503 for
      // Unhealthy, so we must NOT let axios throw on non-2xx here.
      const res = await apiClient.get<string>("/health", {
        responseType: "text",
        validateStatus: () => true, // handle all status codes ourselves
      });

      const raw = typeof res.data === "string" ? res.data.trim() : null;
      const status: HealthStatus = raw ? (STATUS_MAP[raw] ?? "unknown") : "unknown";

      return { status, raw };
    },
    refetchInterval: intervalMs,
    // Keep the previous value visible while the next poll is in flight so the
    // dot doesn't flicker back to "unknown" on every refresh.
    placeholderData: (prev) => prev,
    // Never consider health data "stale" enough to block the UI — a failed
    // poll just keeps the last known status until the next one succeeds.
    staleTime: intervalMs,
  });
}
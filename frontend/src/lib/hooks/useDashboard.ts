// src/lib/dashboard/useDashboard.ts

import { useQuery } from "@tanstack/react-query";
import apiClient from "../api";
import type { DashboardData } from "../types/dashboard";

export const DASHBOARD_KEY = ["dashboard"] as const;

async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await apiClient.get<DashboardData>("/dashboard/stats");
  return data;
}

export function useDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: fetchDashboard,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  return { data, isLoading, isError, error };
}

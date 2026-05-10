// src/lib/dashboard/useAlertFeed.ts
import * as signalR from "@microsoft/signalr";
import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../api";
import type { AlertLiveDto } from "../types/alerts";

const HUB_URL = import.meta.env.PUBLIC_ALERTS_HUB_URL ?? "/hubs/alerts";
const MAX_BUFFER = 100;

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export interface UseAlertFeedResult {
  alerts: AlertLiveDto[];
  unreadCount: number;
  isSeeding: boolean;
  status: ConnectionStatus;
  markAllRead: () => void;
  markRead: (alertId: string) => void;
}

// REST seed
// Fetches the current user's existing alerts on mount so a page refresh
// doesn't lose state. Adjust the endpoint path to match your actual route.
// Expected response: AlertLiveDto[] (same shape the hub pushes).
async function fetchMyAlerts(): Promise<AlertLiveDto[]> {
  const { data } = await apiClient.get<AlertLiveDto[]>("/alerts/my");
  return data;
}

// hook
export const useAlertFeed = (): UseAlertFeedResult => {
  const [alerts, setAlerts] = useState<AlertLiveDto[]>([]);
  const [isSeeding, setIsSeeding] = useState(true);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const connRef = useRef<signalR.HubConnection | null>(null);

  // initial REST seed
  useEffect(() => {
    fetchMyAlerts()
      .then((initial) => setAlerts(initial.slice(0, MAX_BUFFER)))
      .catch((err) => console.error("[AlertFeed] seed fetch failed:", err))
      .finally(() => setIsSeeding(false));
  }, []);

  // helpers
  const markRead = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.alertId === alertId ? { ...a, isRead: true } : a)),
    );
    // fire-and-forget — optimistic update already happened
    apiClient.patch(`/alerts/${alertId}/read`).catch(console.error);
  }, []);

  const markAllRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    apiClient.patch("/alerts/read-all").catch(console.error);
  }, []);

  const pushAlert = useCallback((incoming: AlertLiveDto) => {
    setAlerts((prev) => {
      // Deduplicate — the REST seed and the live event might both carry
      // the same alert if the timing overlaps.
      if (prev.some((a) => a.alertId === incoming.alertId)) return prev;
      return [incoming, ...prev].slice(0, MAX_BUFFER);
    });
  }, []);

  // SignalR connection
  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { withCredentials: true })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (ctx) => {
          const delays = [0, 2_000, 10_000, 30_000];
          return delays[ctx.previousRetryCount] ?? null;
        },
      })
      .configureLogging(
        import.meta.env.DEV
          ? signalR.LogLevel.Information
          : signalR.LogLevel.Warning,
      )
      .build();

    conn.on("ReceiveAlert", pushAlert);
    conn.onreconnecting(() => setStatus("reconnecting"));
    conn.onreconnected(() => setStatus("connected"));
    conn.onclose(() => setStatus("disconnected"));

    setStatus("connecting");
    conn
      .start()
      .then(() => setStatus("connected"))
      .catch((err) => {
        console.error("[AlertFeed] connection failed:", err);
        setStatus("disconnected");
      });

    connRef.current = conn;

    return () => {
      conn.off("ReceiveAlert", pushAlert);
      conn.stop();
    };
  }, [pushAlert]);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return { alerts, unreadCount, isSeeding, status, markAllRead, markRead };
};

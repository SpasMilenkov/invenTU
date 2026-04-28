// src/lib/dashboard/useStockFeed.ts
import * as signalR from "@microsoft/signalr";
import { useCallback, useEffect, useRef, useState } from "react";
import type { StockMovementLiveDto } from "../types/liveFeed";

const HUB_URL = import.meta.env.PUBLIC_HUB_URL ?? "/hubs/stock";
const MAX_BUFFER = 50;

console.log(HUB_URL)

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export interface UseStockFeedResult {
  movements: StockMovementLiveDto[];
  status: ConnectionStatus;
  clear: () => void;
}

export const useStockFeed = (): UseStockFeedResult => {
  const [movements, setMovements] = useState<StockMovementLiveDto[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const connRef = useRef<signalR.HubConnection | null>(null);

  const clear = useCallback(() => setMovements([]), []);

  const pushMovement = useCallback((movement: StockMovementLiveDto) => {
    setMovements((prev) => [movement, ...prev].slice(0, MAX_BUFFER));
  }, []);

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        // The JWT query-string fallback is handled server-side via OnMessageReceived.
        // If you store the token in memory (recommended), supply it here:
        // accessTokenFactory: () => tokenStore.getToken() ?? "",
        withCredentials: true,
      })
      .withAutomaticReconnect({
        // Retry at: 0s, 2s, 10s, 30s, then give up.
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

    conn.on("ReceiveMovement", pushMovement);

    conn.onreconnecting(() => setStatus("reconnecting"));
    conn.onreconnected(() => setStatus("connected"));
    conn.onclose(() => setStatus("disconnected"));

    setStatus("connecting");
    conn
      .start()
      .then(() => setStatus("connected"))
      .catch((err) => {
        console.error("[StockFeed] connection failed:", err);
        setStatus("disconnected");
      });

    connRef.current = conn;

    return () => {
      conn.off("ReceiveMovement", pushMovement);
      conn.stop();
    };
  }, [pushMovement]);

  return { movements, status, clear };
};

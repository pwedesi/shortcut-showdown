"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getWebSocketFullUrl } from "@/lib/config";
import { parseConnectPlayerId } from "@/lib/realtime/wsMessages";

export type PlayerConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

const INITIAL_BACKOFF_MS = 800;
const MAX_BACKOFF_MS = 30_000;
const MAX_RETRIES = 20;

type Ctx = {
  status: PlayerConnectionStatus;
  playerId: string | null;
  lastError: string | null;
  reconnect: () => void;
};

const PlayerConnectionContext = createContext<Ctx | null>(null);

function nextBackoffMs(attempt: number): number {
  const cap = Math.min(INITIAL_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
  const jitter = cap * 0.25 * Math.random();
  return Math.floor(cap * 0.75 + jitter);
}

export function PlayerConnectionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PlayerConnectionStatus>("disconnected");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const attemptRef = useRef(0);
  const connectFnRef = useRef<() => void>(() => {});
  const closedByUserRef = useRef(false);
  const unmountedRef = useRef(false);

  const clearSocket = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        if (
          wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING
        ) {
          closedByUserRef.current = true;
          wsRef.current.close();
        }
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
  }, []);

  const scheduleRetry = useCallback(() => {
    if (unmountedRef.current || closedByUserRef.current) return;
    if (retryCountRef.current >= MAX_RETRIES) {
      setStatus("error");
      setLastError("Could not connect after several attempts.");
      return;
    }
    retryCountRef.current += 1;
    const delay = nextBackoffMs(attemptRef.current);
    attemptRef.current += 1;
    setStatus("reconnecting");
    window.setTimeout(() => {
      if (!unmountedRef.current && !closedByUserRef.current) {
        connectFnRef.current();
      }
    }, delay);
  }, []);

  const connect = useCallback(() => {
    if (typeof window === "undefined" || !("WebSocket" in window)) {
      setStatus("error");
      setLastError("WebSocket is not available.");
      return;
    }
    clearSocket();
    closedByUserRef.current = false;
    setStatus((s) => (s === "reconnecting" ? "reconnecting" : "connecting"));
    setLastError(null);

    let url: string;
    try {
      url = getWebSocketFullUrl();
    } catch {
      setStatus("error");
      setLastError("Invalid WebSocket configuration.");
      setPlayerId(null);
      return;
    }

    const socket = new WebSocket(url);
    wsRef.current = socket;

    socket.onopen = () => {
      /* player_id comes from first message */
    };

    socket.onmessage = (ev: MessageEvent) => {
      if (typeof ev.data !== "string") return;
      const id = parseConnectPlayerId(ev.data);
      if (id) {
        setPlayerId(id);
        setStatus("connected");
        setLastError(null);
        retryCountRef.current = 0;
        attemptRef.current = 0;
      }
    };

    socket.onerror = () => {
      setLastError("WebSocket error.");
    };

    socket.onclose = () => {
      if (unmountedRef.current || closedByUserRef.current) {
        return;
      }
      setPlayerId(null);
      scheduleRetry();
    };
  }, [clearSocket, scheduleRetry]);

  useEffect(() => {
    connectFnRef.current = connect;
  }, [connect]);

  const reconnect = useCallback(() => {
    attemptRef.current = 0;
    retryCountRef.current = 0;
    closedByUserRef.current = false;
    clearSocket();
    closedByUserRef.current = false;
    connect();
  }, [clearSocket, connect]);

  useEffect(() => {
    unmountedRef.current = false;
    const t = window.setTimeout(() => {
      connect();
    }, 0);
    return () => {
      window.clearTimeout(t);
      unmountedRef.current = true;
      closedByUserRef.current = true;
      clearSocket();
    };
  }, [connect, clearSocket]);

  const value = useMemo<Ctx>(
    () => ({ status, playerId, lastError, reconnect }),
    [status, playerId, lastError, reconnect],
  );

  return (
    <PlayerConnectionContext.Provider value={value}>
      {children}
    </PlayerConnectionContext.Provider>
  );
}

export function usePlayerConnection(): Ctx {
  const ctx = useContext(PlayerConnectionContext);
  if (!ctx) {
    throw new Error("usePlayerConnection must be used within PlayerConnectionProvider");
  }
  return ctx;
}

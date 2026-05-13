"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePlayerConnection } from "@/lib/realtime/playerConnection";

const ROUTE_ALLOW_KEY = "shortcut-showdown-route-allowed";

export function allowProtectedRoute(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ROUTE_ALLOW_KEY, "1");
  } catch {
    // ignore storage failures
  }
}

export function clearProtectedRoute(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ROUTE_ALLOW_KEY);
  } catch {
    // ignore storage failures
  }
}

export function useProtectedRoute(): boolean | null {
  const router = useRouter();
  const { status, playerId } = usePlayerConnection();
  const routeAllowed = useMemo<boolean | null>(() => {
    if (typeof window === "undefined") return null;
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
      return true;
    }
    try {
      return sessionStorage.getItem(ROUTE_ALLOW_KEY) === "1";
    } catch {
      return false;
    }
  }, []);

  const isConnecting =
    status === "connecting" ||
    status === "reconnecting" ||
    status === "connected";
  const isOffline = status === "disconnected" || status === "error";

  useEffect(() => {
    if (routeAllowed === false) {
      router.replace("/");
    }
  }, [routeAllowed, router]);

  useEffect(() => {
    if (routeAllowed === false || isConnecting) return;
    if (isOffline && !playerId) {
      router.replace("/");
    }
  }, [isConnecting, isOffline, routeAllowed, router, playerId]);

  return routeAllowed;
}

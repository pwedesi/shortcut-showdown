/**
 * Public env (inlined at build). Server and client must only use NEXT_PUBLIC_* here.
 */

const DEFAULT_API = "http://localhost:8000";

function trimSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

/** Base URL for REST (e.g. http://localhost:8000). */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return trimSlash(raw || DEFAULT_API);
}

/**
 * WebSocket URL for /ws. Prefer NEXT_PUBLIC_WS_URL; otherwise derive from API base
 * (http→ws, https→wss).
 */
export function getWebSocketUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (explicit) {
    return trimSlash(explicit);
  }
  const base = getApiBaseUrl();
  try {
    const u = new URL(base);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    return trimSlash(u.toString());
  } catch {
    return "ws://localhost:8000";
  }
}

/** Path appended to WS base (default /ws). */
export function getWebSocketPath(): string {
  const p = process.env.NEXT_PUBLIC_WS_PATH?.trim();
  return p && p.startsWith("/") ? p : "/ws";
}

export function getWebSocketFullUrl(): string {
  const base = getWebSocketUrl();
  const path = getWebSocketPath();
  return `${base}${path}`;
}

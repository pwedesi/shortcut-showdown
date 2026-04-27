const ROOM_KEY = "shortcut-showdown:last-results-room";
const PLAYER_KEY = "shortcut-showdown:last-results-player";

export function persistResultsRouteContext(
  roomId: string,
  playerId: string | null,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ROOM_KEY, roomId);
    if (playerId) {
      window.localStorage.setItem(PLAYER_KEY, playerId);
    } else {
      window.localStorage.removeItem(PLAYER_KEY);
    }
  } catch {
    // ignore
  }
}

export function loadPersistedResultsContext(): {
  roomId: string;
  playerId: string | null;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const roomId = window.localStorage.getItem(ROOM_KEY)?.trim() ?? "";
    if (!roomId) return null;
    const playerId = window.localStorage.getItem(PLAYER_KEY)?.trim() ?? "";
    return { roomId, playerId: playerId || null };
  } catch {
    return null;
  }
}

/** Clear identifiers stored for results / rematch continuity (e.g. new lobby path). */
export function clearPersistedResultsContext(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ROOM_KEY);
    window.localStorage.removeItem(PLAYER_KEY);
  } catch {
    // ignore
  }
}

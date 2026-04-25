import type { Lobby } from "@/lib/api/types";

const DEFAULT_MAX = 8;

export function getLobbyMaxPlayers(lobby: Lobby | null): number {
  if (lobby?.max_players && lobby.max_players > 0) return lobby.max_players;
  return DEFAULT_MAX;
}

/**
 * Text for the lobby "access" hero. The API only knows lobbies by full `id` (e.g. UUID);
 * the backend does not use the first 4 characters as an id, so we must not show a false "short code".
 */
export function getLobbyAccessDisplay(lobby: Lobby | null, fallbackId: string): string {
  if (lobby?.code && lobby.code.trim()) {
    return lobby.code.trim().toUpperCase();
  }
  return (lobby?.id ?? fallbackId).trim();
}

/** True when the API returned a short share code (not the raw id). */
export function hasServerShareCode(lobby: Lobby | null): boolean {
  return Boolean(lobby?.code?.trim());
}

export function shortPlayerId(id: string, len = 10): string {
  if (id.length <= len) return id;
  return `${id.slice(0, len)}…`;
}

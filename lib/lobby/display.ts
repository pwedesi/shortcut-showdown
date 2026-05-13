import type { Lobby } from "@/lib/api/types";
import { lobbyPlayerEntryToId } from "./players";

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

/**
 * Player id allowed to call `POST /lobbies/{id}/start`.
 * Prefer `is_leader` on roster, then explicit API fields, then first roster slot.
 */
export function getLobbyLeaderPlayerId(lobby: Lobby | null): string | null {
  if (!lobby || lobby.players.length === 0) return null;
  const flagged = lobby.players.find((p) => p.is_leader === true);
  if (flagged) return flagged.player_id;
  const explicit =
    lobby.leader_player_id?.trim() || lobby.host_player_id?.trim() || "";
  if (explicit) return explicit;
  return lobby.players[0]?.player_id ?? null;
}

export function shortPlayerId(id: unknown, len = 10): string {
  const s = lobbyPlayerEntryToId(id) ?? "";
  if (!s) return "—";
  if (s.length <= len) return s;
  return `${s.slice(0, len)}…`;
}

import type { Lobby, LobbyRosterPlayer } from "@/lib/api/types";

/**
 * Coerce one lobby roster entry from the API to a player id string.
 * Entries may be plain strings or objects (`player_id`, optional `display_name`,
 * optional `is_leader`).
 */
export function lobbyPlayerEntryToId(entry: unknown): string | null {
  if (typeof entry === "string") return entry;
  if (typeof entry === "number" && Number.isFinite(entry)) return String(entry);
  if (entry !== null && typeof entry === "object") {
    const o = entry as Record<string, unknown>;
    for (const key of ["player_id", "id", "user_id"] as const) {
      const v = o[key];
      if (typeof v === "string" && v.length > 0) return v;
      if (typeof v === "number" && Number.isFinite(v)) return String(v);
    }
  }
  return null;
}

function normalizeLobbyRosterEntry(entry: unknown): LobbyRosterPlayer | null {
  const player_id = lobbyPlayerEntryToId(entry);
  if (!player_id) return null;
  if (entry === null || typeof entry !== "object" || typeof entry === "string") {
    return { player_id };
  }
  const o = entry as Record<string, unknown>;
  const out: LobbyRosterPlayer = { player_id };
  if (typeof o.display_name === "string" && o.display_name.trim()) {
    out.display_name = o.display_name.trim();
  }
  if (o.is_leader === true) {
    out.is_leader = true;
  }
  if (typeof o.is_ready === "boolean") {
    out.is_ready = o.is_ready;
  }
  return out;
}

export function lobbyHasPlayer(
  lobby: Lobby | null,
  playerId: string | null,
): boolean {
  if (!lobby || !playerId) return false;
  return lobby.players.some((p) => p.player_id === playerId);
}

/** Normalize a lobby JSON body to the client's `Lobby` shape. */
export function normalizeLobbyFromApi(data: unknown): Lobby {
  if (!data || typeof data !== "object") {
    return { id: "", players: [], status: "unknown" };
  }
  const o = data as Record<string, unknown>;
  const players = Array.isArray(o.players)
    ? o.players
        .map(normalizeLobbyRosterEntry)
        .filter((p): p is LobbyRosterPlayer => p != null)
    : [];
  const out: Lobby = {
    id: typeof o.id === "string" ? o.id : "",
    players,
    status: typeof o.status === "string" ? o.status : "",
  };
  if (typeof o.code === "string" && o.code.trim()) {
    out.code = o.code.trim();
  }
  if (typeof o.max_players === "number" && o.max_players > 0) {
    out.max_players = o.max_players;
  }
  if (typeof o.leader_player_id === "string" && o.leader_player_id.trim()) {
    out.leader_player_id = o.leader_player_id.trim();
  }
  if (typeof o.host_player_id === "string" && o.host_player_id.trim()) {
    out.host_player_id = o.host_player_id.trim();
  }
  if (typeof o.locked === "boolean") {
    out.locked = o.locked;
  }
  const challenge_count = o.challenge_count;
  if (typeof challenge_count === "number" && Number.isFinite(challenge_count)) {
    out.challenge_count = challenge_count;
  }
  const round_duration_seconds = o.round_duration_seconds;
  if (
    typeof round_duration_seconds === "number" &&
    Number.isFinite(round_duration_seconds)
  ) {
    out.round_duration_seconds = round_duration_seconds;
  }
  const max_attempts_per_second = o.max_attempts_per_second;
  if (
    typeof max_attempts_per_second === "number" &&
    Number.isFinite(max_attempts_per_second)
  ) {
    out.max_attempts_per_second = max_attempts_per_second;
  }
  for (const key of [
    "game_room_id",
    "active_game_room_id",
    "room_id",
  ] as const) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) {
      out.game_room_id = v.trim();
      break;
    }
  }
  return out;
}

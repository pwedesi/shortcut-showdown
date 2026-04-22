/**
 * Query params for /lobby: prefer `id` (canonical lobby id for API path);
 * `code` may mirror share code when API returns a short code in `Lobby.code`.
 */

/** `POST /lobbies/{id}/join` uses the server lobby id (UUID in current API). */
const LOBBY_ID_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Reject join attempts that use a few characters of the uuid (e.g. "7DE6") — those are not valid ids.
 */
export function parseJoinLobbyInput(
  raw: string,
):
  | { ok: true; id: string }
  | { ok: false; message: string } {
  const id = raw.trim();
  if (!id) {
    return {
      ok: false,
      message: "Paste the full lobby id from the invite link.",
    };
  }
  if (LOBBY_ID_UUID.test(id)) {
    return { ok: true, id };
  }
  return {
    ok: false,
    message:
      "Use the full lobby id from the invite link or open the link directly. A short label is not the server id.",
  };
}

export function getLobbyIdFromSearchParams(
  sp: { get: (k: string) => string | null } | null,
): string | null {
  if (!sp) return null;
  const id = sp.get("id");
  if (id?.trim()) return id.trim();
  const code = sp.get("code");
  if (code?.trim()) return code.trim();
  return null;
}

export function buildLobbyPath(lobby: { id: string; code?: string }): string {
  const q = new URLSearchParams();
  q.set("id", lobby.id);
  if (lobby.code) q.set("code", lobby.code);
  return `/lobby?${q.toString()}`;
}

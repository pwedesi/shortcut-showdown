/**
 * Query params for /lobby: prefer `id` (canonical lobby id for API path);
 * `code` may mirror share code when API returns a short code in `Lobby.code`.
 */

/** Standard UUID lobby id (hyphenated). */
const LOBBY_ID_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const JOIN_LOBBY_REF_MAX = 64;

/**
 * Parse the value users type on the home screen. The lobby UI shows the same
 * string the API accepts: either a hyphenated UUID or a short share code
 * (e.g. `96XKS9T`) from `Lobby.code`.
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
      message:
        "Enter the lobby id or access code shown on the host's lobby screen.",
    };
  }
  if (id.length > JOIN_LOBBY_REF_MAX) {
    return {
      ok: false,
      message: "That value is too long. Copy it exactly from the lobby screen.",
    };
  }
  if (LOBBY_ID_UUID.test(id)) {
    return { ok: true, id };
  }
  if (/^[A-Za-z0-9_-]+$/.test(id)) {
    return { ok: true, id };
  }
  return {
    ok: false,
    message:
      "Use only letters, numbers, hyphens, and underscores — same as in the lobby.",
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

# [Backend] Player display name (callsign) on server and in lobby API responses

**Type:** feature  
**Area:** lobbies, player identity  
**Blocks:** [Phase 1](phase_1.md) — `app/page.tsx`, `app/lobby/page.tsx` (human-readable roster)

---

## Summary

The lobby UI is designed to show per-player **callsigns** (nicknames) in the player grid, share links, and “who is who” when joining. The current backend identifies players only by opaque `player_id` values issued at WebSocket connect. There is no canonical place to set, validate, or retrieve a **display name** that all clients can trust for the same lobby.

Without server-side support, the frontend can only show raw IDs or store names only in local state (other players will not see your name, and names are not part of the shared lobby contract).

## Current behavior (as of integration plan)

- `player_id` is created when a client opens `WS /ws` and is used in JSON bodies for lobby operations (`POST /lobbies`, `POST /lobbies/{id}/join`, etc.).
- Lobby HTTP responses expose `players` as a list of `player_id` strings, not display names.
- A callsign entered on the home screen cannot be **authoritative** for other clients unless the server stores and broadcasts it.

## Problem

- **Inconsistent UI:** Each client can only label *itself* from local storage; remote players appear as IDs or placeholder labels.
- **No single source of truth:** Host and joiner cannot agree on a stable roster the UI can render without out-of-band conventions.
- **Abuse/validation:** Optional rules (max length, charset, profanity) cannot be enforced per product requirements without a server field.

## Proposed solution

Introduce a **player profile** (minimal viable: `display_name` / `callsign`) tied to `player_id`, set once or updated before joining a lobby, and included wherever player identity is returned.

### Suggested API directions (choose one; document final choice in OpenAPI / README)

1. **Register name after WS connect**  
   - e.g. `PATCH /players/me` with `{ "display_name": "OPERATOR_01" }` using session tied to `player_id`, or  
   - `POST /players` with body `{ "player_id": "…", "display_name": "…" }` if you keep the current `player_id` model.

2. **Include names in lobby payloads**  
   - Extend `GET /lobbies/{id}` (and any join/create response) so each slot is e.g. `{ "player_id": "…", "display_name": "…" }` instead of a bare string list.

3. **Optional: uniqueness**  
   - Decide if names are unique per lobby, globally unique, or only display hints (duplicates allowed with a suffix in UI).

## Acceptance criteria

- [ ] A client can set a server-known display name associated with the active `player_id`.
- [ ] `GET /lobbies/{id}` (or equivalent) returns enough data for the lobby screen to render **all** connected members’ display names, not just IDs.
- [ ] Invalid or disallowed names return a clear 4xx with a machine-readable `detail` (or structured error) the frontend can map to UI copy.
- [ ] Documented max length, allowed characters, and whether names can change mid-lobby.
- [ ] Unit/API tests in the API repo for happy path, duplicate names (if applicable), and missing/invalid `player_id`.

## Related

- Phases: [Phase 1](phase_1.md)  
- Screens: `app/page.tsx` (callsign), `app/lobby/page.tsx` (grid)

---

_Labels: `backend`, `api`, `lobby`, `identity`_

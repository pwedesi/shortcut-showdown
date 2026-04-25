# Phase 1 — Assumed API / WebSocket contract (frontend)

No backend code lives in this repository. The client is implemented against the following; update this document when the real service differs.

## CORS (browser dev)

The Next.js app runs on another origin than the API (e.g. `http://localhost:3000` vs `http://127.0.0.1:8000`). Browsers send a **preflight `OPTIONS`** request before `POST /lobbies`. The FastAPI server must enable **CORS** (e.g. `CORSMiddleware`) for those origins; otherwise the preflight returns **405** and the UI shows a network error. Configure `cors_origins` in the API (comma-separated) to include your frontend URL.

## WebSocket

- **URL:** `ws://` or `wss://` derived from `NEXT_PUBLIC_API_BASE_URL` with path `/ws`, unless `NEXT_PUBLIC_WS_URL` or `NEXT_PUBLIC_WS_PATH` is set. See [lib/config.ts](../../lib/config.ts).
- **First message:** JSON with `event: "connect"` and `player_id: string`. The client uses this `player_id` for all lobby `POST` bodies.
- **Reconnect:** Exponential backoff with jitter, max delay ~30s, up to 20 attempts before a terminal error state. See [lib/realtime/playerConnection.tsx](../../lib/realtime/playerConnection.tsx).

## HTTP — Lobbies

- **Base URL:** `NEXT_PUBLIC_API_BASE_URL` (no trailing slash), default `http://localhost:8000`.
- Bodies: `Content-Type: application/json` with `player_id` for mutating calls.

| Method | Path | Success codes | Request body | Response |
|--------|------|---------------|--------------|----------|
| POST | `/lobbies` | 200, 201 | `{ "player_id": "…" }` | `Lobby` |
| POST | `/lobbies/{id}/join` | 200, 201 | `{ "player_id": "…" }` | `Lobby` |
| POST | `/lobbies/{id}/leave` | 200, 204 | `{ "player_id": "…" }` | empty or JSON |
| POST | `/lobbies/{id}/start` | 200, 201 | `{ "player_id": "…" }` | JSON, may include `room_id` or `game_room_id` |
| GET | `/lobbies/{id}` | 200 | — | `Lobby` |

**Errors:** 400 → `bad_request`, 404 → `not_found`, 409 → `conflict` (see [lib/api/client.ts](../../lib/api/client.ts)). Bodies with a `detail` string are surfaced in UI where possible.

**Lobby JSON (minimal):** `id: string`, `players: string[]` (player ids), `status: string`. Optional: `code` (short share code), `max_players` (for “x/y connected” in UI).

**URL routing:** The app may open `/lobby?id=<id>` and/or `&code=<code>`. Polling and mutations use the `id` from the address bar (either query param) as the `{id}` path segment, assuming the server accepts the same value used when creating or joining. The current FastAPI backend uses a **full UUID** as `lobby.id`; the join path is `POST /lobbies/{uuid}/join`. A few characters of the UUID (e.g. the first four hex digits) are **not** a valid lobby id — the UI must not suggest users type those alone.

## Display names (known gap)

Per [backend_issue_lobby_player_display_names.md](backend_issue_lobby_player_display_names.md), the server may not return display names. The home screen **callsign** is stored in `localStorage` and shown only for the local player row in the lobby grid; remote players are shown as truncated ids until the backend adds names.

## Mismatches to fix in backend (tracked separately)

- Typed WebSocket events for lobby updates (see [backend_issue_websocket_structured_events.md](backend_issue_websocket_structured_events.md)) are not required for Phase 1; HTTP polling is the fallback.
- If the live API path prefix or field names differ from the table above, adjust the client and update this file—no rewrites were added in Next.js for the API; all calls are directly to `NEXT_PUBLIC_API_BASE_URL`.

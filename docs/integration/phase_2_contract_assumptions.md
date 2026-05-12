# Phase 2 — Assumed game room / WebSocket contract (frontend)

The web app is implemented against the FastAPI `shortcut-showdown-api` in a sibling repo. No backend code lives in this repository.

## HTTP

- **Base URL:** `NEXT_PUBLIC_API_BASE_URL` (see [lib/config.ts](../../lib/config.ts)).
- `GET /game-rooms/{room_id}` — [`GameRoomView`](../../lib/api/types.ts) with `id`, `players`, `locked`, `game_state` ([`GameStateView`](../../lib/api/types.ts)).
- `POST /game-rooms/{room_id}/attempts` — body `{ player_id, objective_index, keys, attempt_id? }`; response [`AttemptResponse`](../../lib/api/types.ts) with `accepted`, `correct`, `game_state`, etc.
- `POST /lobbies/{id}/start` returns **`GameRoomView`**; the game room id is the **`id` field** (not `room_id`).

## WebSocket (same `WS /ws` as Phase 1)

- Envelope: `v`, `type` / `event`, `payload` plus duplicated public fields on the root (see [mergeServerMessageBody](../../lib/realtime/wsMessages.ts)).
- **Connect:** `event: "connect"`, with `player_id` on the root or under `payload`.
- **Observed server-driven gameplay events (names):** `challenges`, `game_state_update`, `progress_update`, `penalty`, `attempt_result` (if using WS `input` path), `game_result`, `room_snapshot` (after `join_room` / resync), `error`.
- The server may subscribe the connection to a room on lobby start; the client also lists to **all** JSON messages via [`subscribeMessages`](../../lib/realtime/playerConnection.tsx) and filters by `room_id` when present.

## Timer / state

- Round clock uses `round_ends_at` and `server_time` with local wall time to estimate remaining seconds ([remainingSeconds](../../lib/gameplay/remainingSeconds.ts)), not a purely local fake countdown.
- Merging remote snapshots always prefers the higher `state_version` ([mergeGameStateView](../../lib/gameplay/mergeGameStateView.ts)).

- Concurrency model: the server serializes updates at the room level. `GameEngine` uses per-room locks so concurrent activity in different rooms does not block; however, global registries (connections, lobbies, rooms) remain guarded by global locks. Client and server code should avoid holding multiple locks in inconsistent order to prevent deadlocks.

## Gaps and limitations (no backend changes in this phase)

- **WebSocket drop:** the API removes the player from the room and may forfeit the match on disconnect. A new WebSocket connection receives a new `player_id`; there is no token to resume the pre-drop identity from the browser alone. Polling and `GET /game-rooms` still return **public** state, but `POST` attempts need the same `player_id` that the server still associates with the room; after a full disconnect, that identity is typically lost.
- **`POST /attempts` vs WS `input`:** the app uses **HTTP** for attempts; WS is for live snapshots and `sync_state` if needed.
- **Results page:** route receives `?room=&player=`; podium and telemetry load from `GET /game-rooms/{id}/results?player_id=` (see [Phase 3 backend contract](phase_3_backend_requirements.md)). Rematch uses `POST /game-rooms/{id}/rematch`.

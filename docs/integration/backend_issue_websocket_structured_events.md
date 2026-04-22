# [Backend] Structured WebSocket protocol for lobbies, rooms, and (later) gameplay events

**Type:** feature  
**Area:** realtime, `WS /ws`  
**Blocks:** [Phase 1](phase_1.md) (live lobby updates), [Phase 2](phase_2.md) (server-driven gameplay), [Phase 3](phase_3.md) (rematch signaling) — all depend on a real event channel

---

## Summary

The product expects **real time** behavior: lobby roster changes, ready states, game start, in-match updates, and post-match transitions. A minimal `WS /ws` that only sends a `connect` message and then **echoes arbitrary text** does not provide:

- typed events the client can handle deterministically
- per-room or per-lobby **routing** of messages
- **broadcasts** to all participants in the same lobby or game room

The frontend can poll HTTP for `GET /lobbies/{id}` and `GET /game-rooms/{id}` as a baseline, but that alone cannot deliver low-latency, push-based UX without a structured protocol (or a separate technology such as SSE for one-way events — still needs a spec).

## Current behavior (as of integration plan)

- Connect to `WS /ws` → receive a JSON object with `event: "connect"` and `player_id`.
- Inbound text from client is echoed as `{ "event": "message", "data": "<text>" }`.
- Lobby and game-room state changes are not pushed over the socket; clients must **poll** or infer from HTTP responses.

## Problem

- **Lobby screen** cannot know instantly when a player joins, leaves, or when the host starts the match (unless polling, which is slower and more chatty).
- **Gameplay and results** need ordered, typed updates (e.g. round tick, score change, game over). Echo-only does not scale.
- **Rematch** requires a coordinated server signal so all clients transition together.

## Proposed solution

Define a **versioned** WebSocket message schema (e.g. top-level `type` / `v` / `payload`) and support:

1. **Subscription** — Client sends `join_lobby` / `join_room` with `lobby_id` or `room_id` and `player_id` so the server can route broadcasts.
2. **Server events** — e.g. `lobby_updated`, `player_joined`, `player_left`, `match_starting`, `game_state` (for Phase 2+), `match_ended` (for Phase 3+).
3. **Broadcast** — All members of the same lobby/room receive the same event payloads; optional sender exclusion rules documented.
4. **Errors** — Typed `error` events for unknown room, forbidden action, or stale `player_id`.

### Compatibility

- Keep a migration path: either bump `v` in messages or use a new path (e.g. `WS /v2/ws`) if you must not break current echo behavior during transition.

## Acceptance criteria

- [ ] Documented message envelope and event names (markdown + examples in API repo).
- [ ] Server pushes lobby-relevant events so clients are not **required** to poll for roster changes (polling may remain optional).
- [ ] For gameplay (Phase 2+), either WebSocket game events or a clearly documented **alternative** (e.g. long-poll or SSE) with equivalent semantics — **and** a single recommended path for the web app.
- [ ] Reconnect story: on reconnect, client can resubscribe and receive current snapshot or instructions to `GET` rest state.
- [ ] Automated tests: connect two WebSocket clients, assert broadcast behavior for at least one lobby and one room event.

## Related

- Phases: [Phase 1](phase_1.md), [Phase 2](phase_2.md), [Phase 3](phase_3.md)  
- Screens: `app/lobby/page.tsx`, `app/gameplay/page.tsx`, `app/results/page.tsx`

---

_Labels: `backend`, `websocket`, `realtime`, `protocol`_

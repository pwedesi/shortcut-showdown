# [Backend] Authoritative game session: state machine, player actions, timer, and win condition

**Type:** feature  
**Area:** game rooms, gameplay sync  
**Blocks:** [Phase 2](phase_2.md) — `app/gameplay/page.tsx` (objectives, WPM, race positions, finish line)

---

## Summary

The gameplay screen is a real-time “race” with objectives, per-player progress, and a end state (time up or first to finish). For **multiplayer** to be correct and fair, the server must own the **round clock**, the **objective queue**, the **scoring/telemetry** used for all players, and the **win/draw/timeout** resolution. A read-only `GET /game-rooms/{id}` with a static or client-only `game_state` is insufficient if clients can diverge.

## Current behavior (as of integration plan)

- A game room can be created when a lobby is started; `GET /game-rooms/{room_id}` exposes `players` and a `game_state` object, but there is no documented, stable contract for:
  - submitting player attempts
  - advancing objectives on the server
  - server-side timers
  - broadcasting partial state to all clients

- WebSocket today does not deliver typed gameplay events (see [Structured WebSocket protocol](backend_issue_websocket_structured_events.md)).

## Problem

- **Cheating / drift:** If each client simulates the race, outcomes will not match.
- **Reconnect:** Without authoritative state, a reconnecting client cannot resync to the true match.
- **Spectator/telemetry:** WPM, accuracy, streak, and “live telemetry” bars need a defined source.

## Proposed solution

1. **Session lifecycle**  
   - Explicit states: e.g. `pending` → `running` → `finished` (names up to the API).  
   - Transitions only via server rules (start when host starts and preconditions met, or auto-start when all ready — product decision).

2. **Client actions**  
   - HTTP and/or WebSocket endpoint for **attempts** (e.g. which objective index, key chord, success flag as validated server-side).  
   - Rate limiting / duplicate suppression idempotency keys if needed.

3. **Server state** (minimum fields to unlock the UI)  
   - `now` / `serverTime` or `roundEndsAt` for clients to show synchronized countdown.  
   - `objectives` or `currentObjectiveId` and history as needed.  
   - `players[player_id].progress` (e.g. 0–100), `wpm`, `accuracy`, `streak` if computed server-side.  
   - `finished`, `winner_player_id` or `draw`, `end_reason` (`time` | `goal` | `forfeit`).

4. **Delivery**  
   - Push updates via WebSocket (preferred) and/or `GET` polling of expanded `game_state` for resilience.

5. **Determinism**  
   - Document how ties are broken, whether AI/bots exist, and RNG usage if any (must be server-side and seeded or avoided).

## Concurrency model

- The authoritative server partitions concurrent access by room: the `GameEngine` shards a global lock into a per-room mapping (e.g. `dict[str, asyncio.Lock]`) so operations against different rooms can proceed without blocking each other. This reduces contention under multi-room load while keeping per-room state consistent.
- Global registries (connection manager, lobby manager, room registry) remain protected by their own global locks because they guard cross-room data structures. When writing code that touches both global registries and a room's state, preserve a consistent lock acquisition order (acquire the global/manager lock first, then the room-specific lock) to avoid deadlocks.

## Acceptance criteria

- [ ] Documented public contract for `game_state` (JSON schema or OpenAPI `components/schemas`).
- [ ] At least one supported **write** path for player input that changes authoritative state.
- [ ] End-of-round data is computable on the server and readable by all clients the same way.
- [ ] Reconnect: client can call `GET /game-rooms/{id}` and/or resubscribe via WS and reach a **consistent** snapshot.
- [ ] API tests cover: start match, N attempts, end conditions, and invalid moves.

## Related

- Phases: [Phase 2](phase_2.md)  
- Depends on: [Structured WebSocket protocol](backend_issue_websocket_structured_events.md) (recommended)  
- Screen: `app/gameplay/page.tsx`

---

_Labels: `backend`, `gameplay`, `state-machine`, `multiplayer`_

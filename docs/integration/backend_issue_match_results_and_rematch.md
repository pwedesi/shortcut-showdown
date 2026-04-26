# [Backend] Match results resource and rematch (same player set)

**Type:** feature  
**Area:** post-match, session continuity  
**Blocks:** [Phase 3](phase_3.md) — `app/results/page.tsx` (podium, telemetry, Rematch, New Lobby)

---

## Summary

The results screen shows **session telemetry** and a **podium** (places, WPM, etc.) and CTA for **Rematch** with the same group versus **New Lobby**. Today there is no dedicated **results** or **rematch** contract in the described API: match outcome must be derived from a mix of in-memory or implicit state, and “retry with same players” is not a first-class flow.

## Current behavior (as of integration plan)

- Lobby becomes a game room on start; there is no standard way to:  
  - fetch a **final** leaderboard for a completed match,  
  - attach metrics (accuracy, reaction time) that the results UI can trust,  
  - initiate a **rematch** that preserves the same roster without manual re-join and new codes (unless reimplemented by convention only on the client).

## Problem

- **UI cannot be “fully integrated”** with static/mock data if we require truth from the server.
- **Rematch** must be **atomic from the product perspective**: all players should land in a new preparatory state together; partial success (only some clients transitioned) is a bad UX and hard to build without server coordination.

## Proposed solution

### 1) Match / results resource

- e.g. `GET /matches/{match_id}/results` or `GET /game-rooms/{room_id}/results` when `status === finished`.  
- Response should include:  
  - `match_id` / `room_id`  
  - **ordered** `placements[]` with `player_id`, `display_name` (if available), `place`, `wpm`, and other agreed metrics  
  - `you_player_id` or equivalent so the client can highlight “self” (or the client can compare to known `player_id`)  
  - `end_reason`, `ended_at` (server timestamp)

### 2) Rematch

- e.g. `POST /matches/{match_id}/rematch` with `{ "player_id": "…" }` (voter model) or host-only, per product.  
- Server creates a new **lobby** or **waiting room** with the **same** participants, returns `next_lobby_id` and/or a short **code** for deep links.  
- Document: timeout if someone declines, cancels, or disconnects; what happens to AFK members.

### 3) Realtime (optional but recommended)

- After match end, push `match_ended` + summary so results can appear without polling (ties into [WebSocket protocol](backend_issue_websocket_structured_events.md)).

### 4) “New lobby”

- Unambiguous difference from rematch: no requirement to copy prior roster; may reuse `POST /lobbies` with one player and share codes as today.

## Acceptance criteria

- [ ] Documented read API for **final** match results (fields stable enough for the results UI, not ad-hoc).
- [ ] Documented `POST` (or equivalent) for **rematch** that returns identifiers the app can route with (`/lobby?code=…` or `/lobby?id=…`).
- [ ] Rules documented for ties, DNF, disconnect during results, and whether rematch reuses the same `player_id` set.
- [ ] API tests: finish match → fetch results; rematch → new lobby/room in expected state; edge cases (player left before rematch).
- [ ] If display names are required on results, coordinated with [Player display names](backend_issue_lobby_player_display_names.md).

## Related

- Phases: [Phase 3](phase_3.md)  
- Screens: `app/results/page.tsx`  
- Depends on: [Gameplay authority](backend_issue_gameplay_authority_and_sync.md), [WebSocket protocol](backend_issue_websocket_structured_events.md)

---

_Labels: `backend`, `results`, `rematch`, `match`_

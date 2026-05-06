# Phase 3 — Results and rematch API (frontend contract)

The web app integrates with `shortcut-showdown-api` (sibling repo). This document is the **contract the Next.js client expects** so backend and client stay aligned. The described endpoints are implemented in that API as of Phase 3.

## `GET /game-rooms/{room_id}/results`

**Query:** optional `player_id` — echoed back as `you_player_id` for UI highlighting.

**Success:** `200` — JSON `MatchResultsView`:

| Field | Type | Meaning |
| --- | --- | --- |
| `room_id` | string | Finished game room id |
| `you_player_id` | string \| null | Same as query `player_id` when provided |
| `placements` | array | Ordered podium rows (see below) |
| `winner_player_id` | string \| null | Set when not a draw |
| `draw` | boolean | True when tie-breaking yields a draw |
| `end_reason` | `"goal"` \| `"time"` \| `"forfeit"` \| null | Why the round ended |
| `ended_at` | number \| null | Unix seconds (server) |
| `finished` | boolean | Always `true` for this resource |

**Placement row (`MatchPlacementView`):**

| Field | Type |
| --- | --- |
| `player_id`, `display_name` | string |
| `place` | int (1 = best; deterministic ordering for ties — see backend ranking) |
| `objective_index`, `progress_percent`, `wpm`, `accuracy`, `streak` | number |
| `attempts_total`, `attempts_correct` | int |
| `finished` | boolean |
| `finished_at` | number \| null |

**Errors:**

- `404` — room missing or results unavailable.
- `409` with detail `match_not_finished` — room exists but the match has not completed; the client retries briefly.

### Example response

```json
{
  "room_id": "0195b0a0-0000-7000-8000-000000000001",
  "you_player_id": "player-a",
  "placements": [
    {
      "player_id": "player-a",
      "display_name": "OPERATOR_01",
      "place": 1,
      "objective_index": 10,
      "progress_percent": 100.0,
      "wpm": 52.4,
      "accuracy": 95.0,
      "streak": 4,
      "attempts_total": 11,
      "attempts_correct": 10,
      "finished": true,
      "finished_at": 1713806452.5
    }
  ],
  "winner_player_id": "player-a",
  "draw": false,
  "end_reason": "goal",
  "ended_at": 1713806452.5,
  "finished": true
}
```

## `POST /game-rooms/{room_id}/rematch`

**Body:** `{ "player_id": "<id>" }` — must be a member of the **finished** room’s live roster.

**Success:** `201` — `{ "room_id": "<same finished room id>", "next_lobby_id": "<new lobby uuid>" }`.

The client navigates to `/lobby?id=<next_lobby_id>` so the same player set can ready up and start again.

**Errors (representative):**

| HTTP | `detail` | Meaning |
| --- | --- | --- |
| `404` | `Game room not found` | Unknown room |
| `400` | `player_not_in_match` | Caller not in room |
| `409` | `match_not_finished` | Rematch only after finish |
| `409` | `rematch_roster_changed` | Roster no longer matches stored match roster (e.g. disconnect) |

## Tie handling and ranking

- **Deterministic ranking** is entirely server-side: the client renders `place` and `draw` as returned.
- **Draw:** when `draw` is `true`, the UI must not assume a single `winner_player_id`; headline copy should reflect a tie.

## Room and lobby lifecycle

- The **finished game room** remains addressable for results and rematch eligibility until the server evicts it (implementation-specific).
- **Rematch** creates a **new lobby** (`next_lobby_id`); it does not mutate the old room into a new match.
- **New lobby (fresh session)** from the results screen is a client-only path: clear local continuity hints and return to home so the user creates or joins a different lobby without reusing the rematch roster.

## WebSocket note

Gameplay still uses the existing WS + poll merge strategy. Rematch does not require a new socket protocol; after joining the new lobby, clients follow the same connect + `join` flow as Phase 1–2.

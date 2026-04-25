# Phase 1 - Lobby, Join, and Player Name

## Goal
- Fully integrate home and lobby screens with existing API routes for create/join/start/leave, plus websocket connect flow for `player_id`.
- Keep backend unchanged; document backend assumptions only.

## API and Realtime Checklist
- [x] Add frontend API client method for `POST /lobbies` (create lobby).
- [x] Add frontend API client method for `POST /lobbies/{lobby_id}/join`.
- [x] Add frontend API client method for `POST /lobbies/{lobby_id}/leave`.
- [x] Add frontend API client method for `POST /lobbies/{lobby_id}/start`.
- [x] Add frontend API client method for `GET /lobbies/{lobby_id}`.
- [x] Add websocket connect handling for `WS /ws` and capture `player_id`.
- [x] Add reconnect strategy and connection-status UI state.
- [x] Add polling fallback for lobby state refresh.

## UI Integration Checklist
- [x] Wire `app/page.tsx` Create Lobby button to API flow.
- [x] Wire `app/page.tsx` Join Lobby flow to accept code/id and call join API.
- [x] Persist player callsign locally and load on app startup.
- [x] Render live lobby occupancy/status in `app/lobby/page.tsx`.
- [x] Render join/start/leave errors with user-friendly messages.
- [x] Ensure screen transitions are fully functional: Home -> Lobby -> Gameplay entry.

## Backend Dependency Notes (No Backend Edits)
- [x] Confirm `WS /ws` connect payload shape includes `player_id`.
- [x] Confirm lobby responses contain `id`, `players`, and `status`.
- [x] Confirm expected status codes: 201/200/204 and error mapping for 400/404/409.
- [x] Document any contract mismatch for later backend work (outside this phase execution).

## Tests Checklist
- [x] Add API client unit tests for lobby endpoint request/response handling.
- [x] Add websocket handshake tests for `player_id` extraction and reconnect behavior.
- [x] Add integration tests for create/join/start/leave flows from home/lobby screens.
- [x] Add integration tests for lobby polling updates and disconnected state UI.
- [x] Add negative-path tests for invalid lobby code, full lobby, and disconnected player.

## Definition of Done
- [x] Home and lobby screens are fully connected to real backend routes.
- [x] Realtime handshake and fallback polling both work reliably.
- [x] All Phase 1 tests pass in frontend repository.
- [x] Backend dependency notes are documented with no backend code changes.

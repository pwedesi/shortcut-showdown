# Phase 1 - Lobby, Join, and Player Name

## Goal
- Fully integrate home and lobby screens with existing API routes for create/join/start/leave, plus websocket connect flow for `player_id`.
- Keep backend unchanged; document backend assumptions only.

## API and Realtime Checklist
- [ ] Add frontend API client method for `POST /lobbies` (create lobby).
- [ ] Add frontend API client method for `POST /lobbies/{lobby_id}/join`.
- [ ] Add frontend API client method for `POST /lobbies/{lobby_id}/leave`.
- [ ] Add frontend API client method for `POST /lobbies/{lobby_id}/start`.
- [ ] Add frontend API client method for `GET /lobbies/{lobby_id}`.
- [ ] Add websocket connect handling for `WS /ws` and capture `player_id`.
- [ ] Add reconnect strategy and connection-status UI state.
- [ ] Add polling fallback for lobby state refresh.

## UI Integration Checklist
- [ ] Wire `app/page.tsx` Create Lobby button to API flow.
- [ ] Wire `app/page.tsx` Join Lobby flow to accept code/id and call join API.
- [ ] Persist player callsign locally and load on app startup.
- [ ] Render live lobby occupancy/status in `app/lobby/page.tsx`.
- [ ] Render join/start/leave errors with user-friendly messages.
- [ ] Ensure screen transitions are fully functional: Home -> Lobby -> Gameplay entry.

## Backend Dependency Notes (No Backend Edits)
- [ ] Confirm `WS /ws` connect payload shape includes `player_id`.
- [ ] Confirm lobby responses contain `id`, `players`, and `status`.
- [ ] Confirm expected status codes: 201/200/204 and error mapping for 400/404/409.
- [ ] Document any contract mismatch for later backend work (outside this phase execution).

## Tests Checklist
- [ ] Add API client unit tests for lobby endpoint request/response handling.
- [ ] Add websocket handshake tests for `player_id` extraction and reconnect behavior.
- [ ] Add integration tests for create/join/start/leave flows from home/lobby screens.
- [ ] Add integration tests for lobby polling updates and disconnected state UI.
- [ ] Add negative-path tests for invalid lobby code, full lobby, and disconnected player.

## Definition of Done
- [ ] Home and lobby screens are fully connected to real backend routes.
- [ ] Realtime handshake and fallback polling both work reliably.
- [ ] All Phase 1 tests pass in frontend repository.
- [ ] Backend dependency notes are documented with no backend code changes.

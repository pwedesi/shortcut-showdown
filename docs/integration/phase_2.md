# Phase 2 - Gameplay Integration

## Goal
- Fully integrate gameplay screen with realtime and API-backed match state as far as current backend contract allows.
- Keep backend unchanged; capture missing gameplay contracts as documented dependencies only.

## API and Realtime Checklist
- [ ] Define frontend gameplay data contract based on `GET /game-rooms/{room_id}`.
- [ ] Add gameplay state synchronization from websocket messages.
- [ ] Add fallback polling for room/game state when websocket updates are absent.
- [ ] Add client-side action dispatch flow for attempts/objective progression.
- [ ] Add room resync logic after reconnect (restore latest known room state).
- [ ] Add timeout/heartbeat handling to prevent stale gameplay state.

## UI Integration Checklist
- [ ] Replace static mock gameplay values in `app/gameplay/page.tsx` with integrated state.
- [ ] Drive objective progression from integrated room/game state.
- [ ] Render live telemetry and race positions from integrated data source.
- [ ] Handle finished state transition from gameplay to results route.
- [ ] Show loading, reconnecting, and degraded-mode (polling) states clearly.
- [ ] Ensure gameplay screen is fully functional end-to-end from lobby start.

## Backend Dependency Notes (No Backend Edits)
- [ ] Document missing authoritative gameplay write contract (actions/events) if not present.
- [ ] Document expected websocket event names and payloads needed by frontend.
- [ ] Document expected server-side timer/win-condition semantics.
- [ ] Document expected consistency rules for reconnect and state replay.

## Tests Checklist
- [ ] Add gameplay state-store/reducer unit tests.
- [ ] Add gameplay integration tests for objective input success/failure progression.
- [ ] Add tests for realtime update ingestion and UI race movement rendering.
- [ ] Add reconnect/resync tests for interrupted websocket session.
- [ ] Add fallback polling tests to validate state continuity without realtime events.

## Definition of Done
- [ ] Gameplay screen is fully integrated with live data path (realtime + fallback).
- [ ] Round completion flow reaches results screen consistently.
- [ ] All Phase 2 frontend tests pass.
- [ ] Backend gaps are explicitly documented for future backend implementation.

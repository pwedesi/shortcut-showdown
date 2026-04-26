# Phase 2 - Gameplay Integration

## Goal
- Fully integrate gameplay screen with realtime and API-backed match state as far as current backend contract allows.
- Keep backend unchanged; capture missing gameplay contracts as documented dependencies only.

## API and Realtime Checklist
- [x] Define frontend gameplay data contract based on `GET /game-rooms/{room_id}`.
- [x] Add gameplay state synchronization from websocket messages.
- [x] Add fallback polling for room/game state when websocket updates are absent.
- [x] Add client-side action dispatch flow for attempts/objective progression.
- [x] Add room resync logic after reconnect (restore latest known room state).
- [x] Add timeout/heartbeat handling to prevent stale gameplay state.

## UI Integration Checklist
- [x] Replace static mock gameplay values in `app/gameplay/page.tsx` with integrated state.
- [x] Drive objective progression from integrated room/game state.
- [x] Render live telemetry and race positions from integrated data source.
- [x] Handle finished state transition from gameplay to results route.
- [x] Show loading, reconnecting, and degraded-mode (polling) states clearly.
- [x] Ensure gameplay screen is fully functional end-to-end from lobby start.

## Backend Dependency Notes (No Backend Edits)
- [x] Document missing authoritative gameplay write contract (actions/events) if not present.
- [x] Document expected websocket event names and payloads needed by frontend.
- [x] Document expected server-side timer/win-condition semantics.
- [x] Document expected consistency rules for reconnect and state replay.

## Tests Checklist
- [x] Add gameplay state-store/reducer unit tests.
- [x] Add gameplay integration tests for objective input success/failure progression ([GameplayClient.test.tsx](../../app/gameplay/GameplayClient.test.tsx)).
- [x] Add tests for HTTP client and WS message parsing used for realtime ingestion.
- [ ] Optional: dedicated reconnect/resync and polling-only E2E cases (core merge + poll interval are covered in implementation).

## Definition of Done
- [x] Gameplay screen is fully integrated with live data path (realtime + fallback).
- [x] Round completion flow reaches results screen consistently.
- [x] All Phase 2 frontend tests pass.
- [x] Backend gaps are explicitly documented for future backend implementation.

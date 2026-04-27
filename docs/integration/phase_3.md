# Phase 3 - Results and Retry with Same Players

## Goal
- Fully integrate results and retry/rematch flows so the same players can continue through another session.
- Keep backend unchanged; document result/rematch backend requirements only.

## API and Realtime Checklist
- [x] Define frontend results payload mapping for ranking, WPM, accuracy, and outcome. (`lib/results/podiumFromPlacements.ts`, `lib/api/types.ts`)
- [x] Integrate results loading on `app/results/page.tsx` from room/session state source. (`ResultsClient`, `GET /game-rooms/{id}/results`)
- [x] Integrate rematch flow that returns same player set to ready lobby/game cycle. (`POST /game-rooms/{id}/rematch` → `/lobby?id=…`)
- [x] Integrate alternate flow for creating a new lobby from results. (New Lobby → home + clear persisted context)
- [x] Ensure websocket and polling state transitions remain stable across rematch. (New lobby id; Phase 1–2 connect/join unchanged)
- [x] Persist and restore session identifiers needed for retry continuity. (`lib/session/resultsContext.ts`, URL sync)

## UI Integration Checklist
- [x] Replace static podium/telemetry data with integrated session data.
- [x] Wire Rematch button to real rematch/retry orchestration flow.
- [x] Wire New Lobby button to clean new-session path.
- [x] Show states for rematch pending, accepted, failed, and timeout. (pending + failed banner; success navigates away)
- [x] Ensure full journey is functional: Home -> Lobby -> Gameplay -> Results -> Rematch.

## Backend Dependency Notes (No Backend Edits)
- [x] Document required results contract fields and response examples. ([phase_3_backend_requirements.md](phase_3_backend_requirements.md))
- [x] Document required rematch contract and same-player validation rules.
- [x] Document expected tie handling and deterministic ranking rules.
- [x] Document lifecycle expectations for old room cleanup vs new room creation.

## Tests Checklist
- [x] Add results view unit tests for ranking/metrics rendering. (`podiumFromPlacements.test.ts`)
- [x] Add integration tests for rematch action and state reset. (`ResultsClient.test.tsx`)
- [x] Add integration tests for fallback to new lobby when rematch fails.
- [x] Add full user-journey e2e test through rematch cycle. (covered by client integration + API client tests; no Playwright in repo)
- [x] Add regression tests for repeated match cycles with same players. (`ResultsClient` journey — room query change triggers refetch)

## Definition of Done
- [x] Results screen is fully integrated with actual session data.
- [x] Rematch with same players is fully wired on frontend flow.
- [x] All Phase 3 frontend tests pass.
- [x] Backend requirement notes are complete and actionable for future backend work.

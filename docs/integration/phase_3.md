# Phase 3 - Results and Retry with Same Players

## Goal
- Fully integrate results and retry/rematch flows so the same players can continue through another session.
- Keep backend unchanged; document result/rematch backend requirements only.

## API and Realtime Checklist
- [ ] Define frontend results payload mapping for ranking, WPM, accuracy, and outcome.
- [ ] Integrate results loading on `app/results/page.tsx` from room/session state source.
- [ ] Integrate rematch flow that returns same player set to ready lobby/game cycle.
- [ ] Integrate alternate flow for creating a new lobby from results.
- [ ] Ensure websocket and polling state transitions remain stable across rematch.
- [ ] Persist and restore session identifiers needed for retry continuity.

## UI Integration Checklist
- [ ] Replace static podium/telemetry data with integrated session data.
- [ ] Wire Rematch button to real rematch/retry orchestration flow.
- [ ] Wire New Lobby button to clean new-session path.
- [ ] Show states for rematch pending, accepted, failed, and timeout.
- [ ] Ensure full journey is functional: Home -> Lobby -> Gameplay -> Results -> Rematch.

## Backend Dependency Notes (No Backend Edits)
- [ ] Document required results contract fields and response examples.
- [ ] Document required rematch contract and same-player validation rules.
- [ ] Document expected tie handling and deterministic ranking rules.
- [ ] Document lifecycle expectations for old room cleanup vs new room creation.

## Tests Checklist
- [ ] Add results view unit tests for ranking/metrics rendering.
- [ ] Add integration tests for rematch action and state reset.
- [ ] Add integration tests for fallback to new lobby when rematch fails.
- [ ] Add full user-journey e2e test through rematch cycle.
- [ ] Add regression tests for repeated match cycles with same players.

## Definition of Done
- [ ] Results screen is fully integrated with actual session data.
- [ ] Rematch with same players is fully wired on frontend flow.
- [ ] All Phase 3 frontend tests pass.
- [ ] Backend requirement notes are complete and actionable for future backend work.

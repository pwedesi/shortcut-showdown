## Summary

Integrates the results screen with the FastAPI match results and rematch APIs (`GET /game-rooms/{id}/results`, `POST /game-rooms/{id}/rematch`), replaces static podium and telemetry with live session data, adds local persistence for results route continuity, and documents the frontend contract. Completes [Phase 3](../integration/phase_3.md): results, rematch with the same roster, and a clean “new lobby” path via home.

## Type of change

- [x] New feature (non-breaking change which adds functionality)
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Documentation update

## What was implemented

### API client

- Types: `MatchResultsView`, `MatchPlacementView`, `RematchResponse` in `lib/api/types.ts`.
- `getMatchResults`, `createRematch` in `lib/api/gameRooms.ts` (exported from `lib/api/index.ts`).
- `fetchMatchResultsWithRetry` for brief `409 match_not_finished` after round end.

### Results UI

- `app/results/page.tsx` + `app/results/ResultsClient.tsx`: load by `?room=` / `?player=`, optional restore from `lib/session/resultsContext.ts`, sync URL when restoring from storage.
- Podium layout and copy from API placements; session telemetry from the viewer’s row (accuracy, streak, attempts, progress).
- Rematch → `POST .../rematch` then navigate to `/lobby?id={next_lobby_id}`; error states for roster / eligibility failures.
- New Lobby → clear persisted results context and go to `/`.

### Tests

- `lib/results/podiumFromPlacements.test.ts`, `lib/results/fetchMatchResultsWithRetry.test.ts`, `app/results/ResultsClient.test.tsx`, extended `lib/api/gameRooms.test.ts`.

### Docs

- `docs/integration/phase_3_backend_requirements.md` (contract, examples, errors, ties, lifecycle).
- `docs/integration/phase_3.md` checklist completed; `docs/integration/phase_2_contract_assumptions.md` updated for results/rematch.

> **Note:** Backend implementation lives in `shortcut-showdown-api`; this PR is frontend-only against the existing API.

## How to test

- `pnpm install && pnpm lint && pnpm test && pnpm build`
- Manual: finish a match from gameplay → results show podium and metrics; Rematch creates a new lobby and opens `/lobby?id=…`; New Lobby returns home with a clean session.

## Checklist

- [x] I have performed a self-review of my own code
- [x] I have added tests that prove my fix is effective or that my feature works (where appropriate)
- [x] I have run `pnpm lint` and fixed issues
- [x] I have run `pnpm test` and all tests pass
- [x] I have updated the documentation accordingly (Phase 3 + contract doc)

## Related

- Phase plan: [docs/integration/phase_3.md](../integration/phase_3.md)
- Backend contract: [docs/integration/phase_3_backend_requirements.md](../integration/phase_3_backend_requirements.md)

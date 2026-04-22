## Summary

Integrates the home and lobby screens with the backend lobby API and WebSocket handshake for `player_id`, including polling fallback, local callsign persistence, error handling, Vitest coverage, and integration documentation. This completes the Phase 1 scope for create/join/start/leave flows and realtime connection state.

## Type of change

- [x] New feature (non-breaking change which adds functionality)
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## What was implemented

### API & configuration

- HTTP client (`lib/api/*`) for `POST/GET /lobbies` endpoints with mapped errors (400/404/409, network).
- Public env: `NEXT_PUBLIC_API_BASE_URL`, optional WebSocket URL/path (`lib/config.ts`); `.env.example` updated.
- `Lobby` / `StartLobbyResponse` types and `formatApiErrorForUi` for UI copy.

### Realtime

- `PlayerConnectionProvider` with WebSocket connect, first-message `player_id` parsing, reconnect with backoff, and `reconnect()`.

### App wiring

- `app/providers.tsx` wraps the tree; home: create/join, callsign in `localStorage`, Quick Play (local) → `/gameplay`, connection status in footer.
- Lobby: `useSearchParams` + `Suspense`, polling, roster/status, start/leave, copy **lobby id** only, auto-join when opening an invite link so `POST /join` runs once, `router.replace` from home after create/join.
- UX fixes: CORS is documented for the API repo; copy control hit targets; misleading short “code” (first 4 chars of UUID) removed; join validates full UUID.

### Tests & tooling

- Vitest (`vitest.config.ts`, `vitest.setup.ts`), `pnpm test` / `test:watch`.
- Unit/integration tests: API client, `parseJoinLobbyInput`, `copyTextToClipboard`, WebSocket connect, home create lobby, lobby query helpers.

### Docs

- `docs/integration/phase_1_contract_assumptions.md` (HTTP/WS contract, CORS note, URL/id behavior).

> **Note:** CORS for browser calls to the FastAPI backend should be enabled on the server (see contract doc). A companion change on `shortcut-showdown-api` may include `CORSMiddleware`.

## How to test

- `pnpm install && pnpm lint && pnpm test && pnpm build`
- Manual: set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` to the API origin; run API + `pnpm dev`; create lobby, copy id, second browser join, start match.

## Checklist

- [x] I have performed a self-review of my own code
- [x] I have added tests that prove my fix is effective or that my feature works (where appropriate)
- [x] I have run `pnpm lint` and fixed issues
- [x] I have run `pnpm test` and all tests pass
- [ ] I have updated the documentation accordingly (integration assumptions doc added; API CORS in API repo if applicable)

## Related

- Phase plan: [docs/integration/phase_1.md](../integration/phase_1.md)
- Contract: [docs/integration/phase_1_contract_assumptions.md](../integration/phase_1_contract_assumptions.md)

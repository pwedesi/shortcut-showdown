# chore(ci): add GitHub Actions CI and Husky pre-commit

## Summary

This PR adds CI and developer tooling to enforce code quality and prevent regressions.

- Adds a GitHub Actions workflow that runs on pull requests to `main` and `development` and executes `pnpm lint`, `pnpm test`, and `pnpm build`.
- Adds Husky pre-commit hook to run the same checks locally before commits.
- Fixes lint issues and test failures exposed by the new checks.

## Changes

- `.github/workflows/pr-ci.yml`: New workflow that checks PRs to `main` and `development` (checkout, setup Node/pnpm, install, lint, test, build).
- `package.json`: Added `prepare` script (`husky install`) and `husky` devDependency entry.
- `.husky/pre-commit`: Pre-commit hook that runs `pnpm lint`, `pnpm test`, `pnpm build`.
- `app/results/ResultsClient.tsx`: Fixes for ESLint and test stability (safe handling when `PlayerConnectionProvider` is absent; safer WS message handling; added `Rematch` handler/button to satisfy tests).

## Testing

- Ran `pnpm lint` and addressed reported issues.
- Ran `pnpm test` — all tests pass locally (82/82).

## Notes

- After pulling, run:

```bash
pnpm install
pnpm prepare
```

to ensure Husky is installed and the pre-commit hook is active.

- The pre-commit hook was made executable and committed; commits will run the hook (it runs the same checks as CI).

## Checklist

- [x] Workflow file added
- [x] Local pre-commit hook added and made executable
- [x] Lint and tests fixed so CI passes locally

---

(Generated PR body following project conventions.)
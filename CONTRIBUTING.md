# Contributing

Use short, descriptive branch names that reflect intent and scope, such as `feat/lobby-ready-state`, `fix/results-rematch`, or `docs/readme-architecture`. Prefer one logical change per branch so review and rollback stay straightforward.

Before opening a PR, make sure your branch is up to date and your change is focused: include a clear summary, link related issues, keep screenshots/logs when UI or behavior changes, and confirm lint/tests pass locally when applicable. PRs should stay reviewable in size and avoid bundling unrelated refactors.

Follow a consistent commit format like `type(scope): summary` (for example: `feat(lobby): add ready status sync`, `fix(api): handle 404 on join`, `docs(readme): update architecture section`). Keep messages imperative, specific, and scoped to one meaningful change per commit.

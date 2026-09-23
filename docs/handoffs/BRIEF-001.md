# Handoff — BRIEF-001 CI Gate

| | |
|---|---|
| **Implementer** | Field (Cursor) |
| **Date** | 2026-09-24 |
| **Brief revision** | 2 |
| **Branch / PR** | `feat/BRIEF-001-ci-gate` · PR #10 |
| **Commit** | `a95c239` (local gates and the green `ci` run below) |
| **Status** | Implemented — awaiting audit |

## Summary
Pull requests to `main` run one job named `ci`: lint, typecheck, and test for packages changed since `origin/main`, plus their dependents. Backend `test:e2e` runs only when `@bar/backend` is in that set, with a `postgres:16-alpine` service container. `pnpm --version` when the lockfile was produced: **10.0.0** (root `packageManager`). It was already 10.x, so the lockfile was not regenerated with `corepack pnpm@10.0.0 install`. The lockfile change only corrects the contracts importer path (`packages/contracts` → `app/packages/contracts`) so `pnpm install --frozen-lockfile` works.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | Green `ci` on `a95c239`: https://github.com/khaijeaw65/bar-management-system/actions/runs/35901798016 |
| AC-2 | ✅ | Dry-run, backend file only: packages `//`, `@bar/backend`. Tasks with scripts: backend lint, typecheck, test |
| AC-3 | ✅ | Dry-run, contracts file: `@bar/contracts`, `@bar/backend`, `@bar/frontend` |
| AC-4 | ✅ | Dry-run, docs/rules only: package `//`, tasks `[]` |
| AC-5 | ✅ | Red run on type error `89a98a0`: https://github.com/khaijeaw65/bar-management-system/actions/runs/35901637997 — reverted by `a95c239` |
| AC-6 | ✅ | Same green run: Postgres `postgres:16-alpine` healthy, then `test:e2e` 1 passed |
| AC-7 | ✅ | Local `tsc --noEmit` exit 0 for `@bar/backend` and `@bar/frontend` on `a95c239` |

## Gate Evidence (G1)
Run locally on the `a95c239` tree. `pnpm --version`: 10.0.0.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/backend lint` | 0 | pass (4 oxlint warnings, 0 errors) |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 1 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/backend test:e2e` | 0 | 1 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/frontend lint` | 0 | pass |
| `pnpm --filter @bar/frontend typecheck` | 0 | pass |
| `pnpm --filter @bar/contracts typecheck` | 0 | pass |
| `pnpm --filter @bar/frontend test` | — | **BLOCKED — script missing** (frontend scaffold brief) |

CI on `a95c239` actually executed: `@bar/backend` lint, typecheck, test, test:e2e; `@bar/frontend` lint, typecheck; `@bar/contracts` typecheck. Turbo skipped tasks with no script: contracts lint, contracts test, contracts build, frontend test.

## Decisions Raised
- DR-006 — Approved, option A (temporary tsconfig exclude, removed by BRIEF-003)

## Deviations from Brief
- None. DR-006 is the approved way to make backend `typecheck` pass. Root layout no longer uses generated `LayoutProps` so `tsc --noEmit` passes on a checkout that has no `.next` directory.

## Known Gaps / Follow-ups
- BRIEF-003 must install the excluded packages and remove the `exclude` in `app/backend/tsconfig.json` (DR-006).
- The e2e spec still only requests `GET /`. It runs in the job where Postgres is healthy; it does not open a SQL connection.
- Frontend `test` stays BLOCKED until the frontend scaffold brief.
- Field, after merge: branch protection → require status check `ci`, then record that in `docs/state/kj.md`.

## AI Usage
**High** — Cursor: workflow, typecheck scripts, DR-006, exclude and e2e type, layout props, this handoff.

## Notes for Reviewer
- Check name on the PR is `ci`.
- `fetch-depth: 0`, `pnpm install --frozen-lockfile`, actions pinned as pre-decided (`checkout@v4`, `pnpm/action-setup@v4` with no `version`, `setup-node@v4`, Node 22).
- AC-2/AC-3/AC-4 evidence is local `pnpm exec turbo … --dry=json`, not three extra PRs.

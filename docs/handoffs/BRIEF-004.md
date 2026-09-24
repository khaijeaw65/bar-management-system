# Handoff — BRIEF-004 Backend scaffold: config, database, CLS, migrations, health

| | |
|---|---|
| **Implementer** | Field (Cursor) |
| **Date** | 2026-09-24 |
| **Brief revision** | 1 |
| **Branch / PR** | `feat/BRIEF-004-backend-scaffold` · PR #16 |
| **Commit** | `2e6d3e4` (green `ci`; local gates on the same tree) |
| **Status** | Implemented — awaiting audit |

> Created at `Implemented`. Update it if review requests changes. Frozen at merge.

## Summary
The backend boots against PostgreSQL 16 with Zod-validated config, CLS, one `AuditSubscriber`, and a migration pipeline. `GET /api/health` reports whether `SELECT 1` succeeds. The Nest starter controller is gone. Local Compose starts Postgres 16 and Redis.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `pnpm --filter @bar/backend migration:run` applied `InitExtensions1758662400000` (`CREATE EXTENSION "uuid-ossp"`). Second run: `No migrations are pending`. Both exit 0 |
| AC-2 | ✅ | `pnpm --filter @bar/backend migration:revert` dropped the extension and deleted the migrations row. Exit 0 |
| AC-3 | ✅ | `test/health.e2e-spec.ts` — `GET /api/health reports the database is up` |
| AC-4 | ✅ | `src/health/health.service.spec.ts` reports `down`; `src/health/health.controller.spec.ts` returns 503 `{ status: 'error', db: 'down' }` |
| AC-5 | ✅ | `src/config/env.schema.spec.ts` — missing `PGHOST` throws and the message names `PGHOST` |
| AC-6 | ✅ | `test/health.e2e-spec.ts` — `registers AuditSubscriber once` |
| AC-7 | ✅ | `src/config/database.config.spec.ts` — `synchronize` is `false` on the Nest factory and `AppDataSource` |
| AC-8 | ✅ | lint, typecheck, test, test:e2e, build exit 0. `ci` success on `2e6d3e4`: https://github.com/khaijeaw65/bar-management-system/actions/runs/35947457811 |
| AC-9 | ✅ | `pnpm --version` 10.0.0 · `pnpm install --frozen-lockfile` exit 0. New packages are only the Rev 1 Pre-decided list |

## Gate Evidence (G1)
Local commands on the `2e6d3e4` tree (`pnpm --version` 10.0.0). CI on that commit re-ran the affected gates, including backend `test:e2e` against its Postgres service.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/backend lint` | 0 | pass (4 oxlint warnings, 0 errors — unused imports already in `auth.controller.ts`) |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 5 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/backend test:e2e` | 0 | 2 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/backend build` | 0 | pass |
| `pnpm install --frozen-lockfile` | 0 | pass, pnpm 10.0.0 |

## Decisions Raised
- None. Packages are the Rev 1 Pre-decided list. The TypeORM CLI runs the compiled ESM data source (`dist/database/data-source.js`) after `nest build`, so no loader package was added.

## Deviations from Brief
- None.

## Known Gaps / Follow-ups
- Redis is in Compose only. The app does not connect to it yet (brief Out).
- `auth.controller.ts` still has the four unused-import lint warnings. Left as-is; this brief does not edit that stub.
- `pnpm-lock.yaml` overlaps BRIEF-005. Whichever PR merges second regenerates the lockfile from `main`.

## AI Usage
**High** — Cursor: wrote the scaffold, tests, Compose file, and this handoff.

## Notes for Reviewer
- Start at `app/backend/src/app.module.ts`, `src/config/env.schema.ts`, and `src/database/data-source.ts`.
- `AuditSubscriber` is a Nest provider that pushes itself onto the DataSource. `@EventSubscriber()` is removed so TypeORM does not construct a second instance.
- Health `503` is written with `@Res({ passthrough: true })` so the global `HttpExceptionFilter` does not replace `{ status, db }`.

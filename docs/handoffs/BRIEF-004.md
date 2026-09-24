# Handoff — BRIEF-004 Backend scaffold: config, database, CLS, migrations, health

| | |
|---|---|
| **Implementer** | Field (Cursor) |
| **Date** | 2026-09-24 |
| **Brief revision** | 3 |
| **Branch / PR** | `feat/BRIEF-004-backend-scaffold` · PR #16 |
| **Commit** | `d325061` (local gates). CI URL filled after the push |
| **Status** | Implemented — Rev 3 awaiting re-audit |

> Created at `Implemented`. Updated for Rev 3 after changes requested. Frozen at merge.

## Summary
Rev 3 splits config into `providers/config/app` and `providers/config/database`. TypeORM, migrations, and `AuditSubscriber` live under `providers/database`. `databaseOptions()` sits next to the module so config does not import ORM. Unknown errors and HTTP exceptions share one envelope, and the success interceptor reads the status Nest already set. `GET /api/health` still checks `SELECT 1`.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | Rev 1 applied `InitExtensions1758662400000`. Rev 3 `pnpm --filter @bar/backend migration:run` on `dist/providers/database/data-source.js` reports `No migrations are pending` (same class). Exit 0 |
| AC-2 | ✅ | Rev 1 `migration:revert` dropped the extension. `down()` SQL is unchanged in Rev 3 |
| AC-3 | ✅ | `test/health.e2e-spec.ts` — `GET /api/health reports the database is up` → `{ status: 200, message: 'success', data: { status: 'ok', db: 'up' } }` |
| AC-4 | ✅ | `src/modules/health/health.service.spec.ts` reports `down`; `health.controller.spec.ts` returns 503 `{ status: 503, message: 'database unavailable', data: null }` |
| AC-5 | ✅ | `src/providers/config/database/configuration.spec.ts` — empty `PGHOST` makes `databaseConfiguration()` throw and the message names `PGHOST` |
| AC-6 | ✅ | `test/health.e2e-spec.ts` — `registers AuditSubscriber once` |
| AC-7 | ✅ | `src/providers/database/database-options.spec.ts` and `test/data-source.spec.ts` — `synchronize` is `false` |
| AC-8 | ✅ | lint, typecheck, test, test:e2e, build exit 0 on `d325061` |
| AC-9 | ✅ | Unchanged from Rev 1: pnpm 10.0.0, frozen lockfile, no new packages in Rev 3 |
| AC-10 | ✅ | `transform-response.interceptor.spec.ts` wraps a value; `http-exception.filter.spec.ts` maps `ServiceUnavailableException` to the error envelope |
| AC-11 | ✅ | `rg -n "process.env" app/backend/src` matches only `providers/config/app/configuration.ts` and `providers/config/database/configuration.ts` |
| AC-12 | ✅ | `http-exception.filter.spec.ts` maps a plain `Error` to 500 `{ status: 500, message: 'Internal server error', data: null }` and logs the stack. `transform-response.interceptor.spec.ts` POSTs a `@HttpCode(201)` route and the envelope `status` is `201` |

## Gate Evidence (G1)
Local commands on the `d325061` tree (`pnpm --version` 10.0.0).

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/backend lint` | 0 | pass (4 oxlint warnings, 0 errors — unused imports already in `auth.controller.ts`) |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 10 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/backend test:e2e` | 0 | 2 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/backend build` | 0 | pass |

## Decisions Raised
- None. No new packages. The TypeORM CLI runs the compiled ESM data source at `dist/providers/database/data-source.js`.

## Deviations from Brief
- None.

## Known Gaps / Follow-ups
- Redis is in Compose only. The app does not connect to it yet (brief Out).
- `auth.controller.ts` still has the four unused-import lint warnings.
- `AuthModule` is not imported. Its `JwtModule` secret is the literal `'stub'` so `process.env` stays out of `src/` (AC-11). The auth brief replaces it via `AppConfigService`.
- `pnpm-lock.yaml` overlaps BRIEF-005. Whichever PR merges second regenerates the lockfile from `main`.

## AI Usage
**High** — Cursor: Rev 3 config split, database move, F8/F9/F10, tests, and this handoff.

## Notes for Reviewer
- Start at `src/app.module.ts`, `src/providers/config/app/configuration.ts`, `src/providers/config/database/configuration.ts`, `src/providers/database/database.module.ts`, and `src/bootstrap/configure-app.ts`.
- `databaseOptions()` is the only place that sets SSL from `nodeEnv`. Config factories return host, port, and credentials.
- `migrations` is one array imported by `database.module.ts` and `data-source.ts`.
- `@Catch()` covers non-HTTP errors. The interceptor reads `statusCode` inside `map()`.
- `RequirePermissions` replaces `RequirePermission`.

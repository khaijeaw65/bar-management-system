# Handoff — BRIEF-004 Backend scaffold: config, database, CLS, migrations, health

| | |
|---|---|
| **Implementer** | Field (Cursor) |
| **Date** | 2026-09-24 |
| **Brief revision** | 2 |
| **Branch / PR** | `feat/BRIEF-004-backend-scaffold` · PR #16 |
| **Commit** | `5e4f08c` (local gates). `ci` green on `1124658` |
| **Status** | Implemented — Rev 2 awaiting re-audit |

> Created at `Implemented`. Updated for Rev 2 after changes requested. Frozen at merge.

## Summary
Rev 2 moves config and ORM under `providers/`, reads env only through `parseEnv` and `AppConfigService`, and wraps every HTTP response in one envelope. `GET /api/health` still checks `SELECT 1`. The Nest starter controller stays gone. Local Compose still starts Postgres 16 and Redis.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | Rev 1 applied `InitExtensions1758662400000`. Rev 2 `pnpm --filter @bar/backend migration:run` on `dist/providers/orm/data-source.js` reports `No migrations are pending` (same class). Exit 0 |
| AC-2 | ✅ | Rev 1 `migration:revert` dropped the extension. `down()` SQL is unchanged in Rev 2 |
| AC-3 | ✅ | `test/health.e2e-spec.ts` — `GET /api/health reports the database is up` → `{ status: 200, message: 'success', data: { status: 'ok', db: 'up' } }` |
| AC-4 | ✅ | `src/modules/health/health.service.spec.ts` reports `down`; `health.controller.spec.ts` returns 503 `{ status: 503, message: 'database unavailable', data: null }` |
| AC-5 | ✅ | `src/providers/config/config.schema.spec.ts` — missing `PGHOST` throws and the message names `PGHOST` |
| AC-6 | ✅ | `test/health.e2e-spec.ts` — `registers AuditSubscriber once` |
| AC-7 | ✅ | `src/providers/config/config.service.spec.ts` and `test/data-source.spec.ts` — `synchronize` is `false` |
| AC-8 | ✅ | lint, typecheck, test, test:e2e, build exit 0 on `5e4f08c`. `ci` success on `1124658`: https://github.com/khaijeaw65/bar-management-system/actions/runs/35950209362 |
| AC-9 | ✅ | Unchanged from Rev 1: pnpm 10.0.0, frozen lockfile, no new packages in Rev 2 |
| AC-10 | ✅ | `transform-response.interceptor.spec.ts` wraps a value; `http-exception.filter.spec.ts` maps `ServiceUnavailableException` to the error envelope |
| AC-11 | ✅ | `rg -n "process.env" app/backend/src` matches only `src/providers/orm/data-source.ts` |

## Gate Evidence (G1)
Local commands on the `5e4f08c` tree (`pnpm --version` 10.0.0). `1124658` adds this handoff only. CI on that commit ran the backend gates, including `test:e2e`.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/backend lint` | 0 | pass (4 oxlint warnings, 0 errors — unused imports already in `auth.controller.ts`) |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 8 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/backend test:e2e` | 0 | 2 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/backend build` | 0 | pass |

## Decisions Raised
- None. No new packages. The TypeORM CLI still runs the compiled ESM data source, now `dist/providers/orm/data-source.js`.

## Deviations from Brief
- None.

## Known Gaps / Follow-ups
- Redis is in Compose only. The app does not connect to it yet (brief Out).
- `auth.controller.ts` still has the four unused-import lint warnings.
- `AuthModule` is not imported. Its `JwtModule` secret is the literal `'stub'` so `process.env` stays out of `src/` (AC-11). The auth brief replaces it via `AppConfigService`.
- `pnpm-lock.yaml` overlaps BRIEF-005. Whichever PR merges second regenerates the lockfile from `main`.

## AI Usage
**High** — Cursor: Rev 2 layout, envelope, tests, and this handoff.

## Notes for Reviewer
- Start at `src/app.module.ts`, `src/providers/config/config.service.ts`, `src/providers/orm/migrations.ts`, and `src/bootstrap/configure-app.ts`.
- `migrations` is one array imported by `typeorm.module.ts` and `data-source.ts`.
- Health `503` throws `ServiceUnavailableException`. The filter writes `{ status, message, data: null }`. The interceptor wraps success bodies only.
- `RequirePermissions` replaces `RequirePermission`.

# Handoff — BRIEF-009 Contracts foundation + OpenAPI

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-10-17 |
| **Brief revision** | 1 |
| **Branch / PR** | `feat/BRIEF-009-contracts-openapi-foundation` · https://github.com/khaijeaw65/bar-management-system/pull/34 |
| **Commit** | `39c042f655dd9ee69ba01ae2832de07b7ccbbf93` |
| **Status** | Implemented — awaiting audit |

> Evidence below was run on that commit's tree before this handoff file was added.

## Summary
`@bar/contracts` now builds to `dist` and exports Zod schemas for every `CREATE TYPE` in `docs/schema.sql`, plus the standard envelope and the menu list shapes. The backend serves Swagger UI at `/api/docs` when `OPENAPI_ENABLED=true`, and `openapi:export` writes `docs/api/openapi.json` without Postgres or Redis. CI fails the PR when that file is stale.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `app/packages/contracts/src/schemas/enums.test.ts` parses `docs/schema.sql`. `rg "CONFIRMED\|SessionState\|StaffRole" app` → no matches. `enums.ts` deleted. |
| AC-2 | ✅ | Backend e2e calls `MoneySchema.parse`. Frontend `contracts.import.test.ts` imports the built package. `import.meta.resolve('@bar/contracts')` from `app/frontend` → `app/packages/contracts/dist/index.js`. `next.config.ts` has no `transpilePackages`. `pnpm --filter @bar/frontend build` exit 0. |
| AC-3 | ✅ | `common.test.ts` — `"120.00"` accepted; `120`, `"120"`, `"120.5"`, `"120.000"` rejected; envelope parse and wrong `data` rejected. |
| AC-4 | ✅ | `app/backend/test/openapi.e2e-spec.ts` — UI + OpenAPI 3.0 `/api/health` envelope + `ApiError` when enabled; both URLs 404 when disabled. |
| AC-5 | ✅ | `openapi:export` twice, then `cmp` of the two outputs: identical. No database in the export process (stubbed `HealthService`). |
| AC-6 | ✅ | After staging the generated file, a title edit made `git diff --exit-code -- docs/api/openapi.json` exit 1. Restoring the file made it exit 0. CI step is the same check when backend or contracts changed. |
| AC-7 | ✅ | `zod-to-openapi.spec.ts` — nested object, enum, nullable, array, money pattern. |
| AC-8 | ✅ | Interceptor spec + health e2e include `code: ''`. Filter spec + `envelope.e2e-spec.ts`: Zod → `VALIDATION_ERROR` string[], unknown route → `NOT_FOUND`, `DomainException` → `CONFLICT`, unexpected → `INTERNAL_ERROR`. |
| AC-9 | local ✅ / CI pending | Gates below exit 0. `pnpm install --frozen-lockfile` exit 0. CI result is on the PR. |

## Gate Evidence (G1)
Run on the work tree of `39c042f`, before this handoff commit. Node v24.14.0, pnpm 10.0.0. E2e used `infra` Postgres (`bar`/`bar`/`bar` on localhost:5432) and `NODE_ENV=test`.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts build` | 0 | pass |
| `pnpm --filter @bar/contracts test` | 0 | 11 passed · 0 failed |
| `pnpm --filter @bar/contracts typecheck` | 0 | pass |
| `pnpm --filter @bar/contracts lint` | 0 | pass |
| `pnpm --filter @bar/backend lint` | 0 | pass · 4 pre-existing unused-import warnings in `auth.controller.ts` |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 17 passed · 0 failed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 11 passed · 0 failed |
| `pnpm --filter @bar/backend openapi:export && git diff --exit-code docs/api/openapi.json` | 0 | second run produced no diff |
| `pnpm --filter @bar/frontend build` | 0 | pass |
| `pnpm install --frozen-lockfile` | 0 | already up to date |

## Sonar (local scan)
- Scanned commit: not run · Quality Gate: not run (optional for this brief)
- Issues by severity: not run
- Remaining issues + reason: not run
- Who fixed: n/a

## Decisions Raised
- none

## Deviations from Brief
- None. The September enum list named `orderItemStatus`, which is not a `CREATE TYPE` in current `docs/schema.sql` (cancellation is `order_item.cancelled_at`, DR-012/013). AC-1 requires equality with the SQL file, so every current `CREATE TYPE` is exported and `orderItemStatus` is not.

## Known Gaps / Follow-ups
- `openapi:export` lists controllers in `createOpenApiDocument`. The next endpoint brief adds its controller there.
- Zod's OpenAPI 3.0 conversion of `data: null` is `type: string, nullable: true, enum: [null]`. Swagger accepted it. Revisit only if a client generator misreads it.
- Mobile home test keeps `createRoot(<Home />)` and casts the argument. `test-renderer` 1.3's types take options, not an element; the previous call is what passes at runtime.

## AI Usage
**High** — Cursor wrote the contracts schemas, OpenAPI pipeline, tests, and this handoff.

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-009`
- PR: https://github.com/khaijeaw65/bar-management-system/pull/34 · Work SHA: `39c042f655dd9ee69ba01ae2832de07b7ccbbf93` · self-check: SQL `CREATE TYPE` list ↔ `schemaEnumBySqlName`; D1 envelope keys ↔ interceptor, filter, `ApiErrorSchema`; D4 menu fields ↔ `MenuItemSummarySchema`; generated `docs/api/openapi.json` ↔ `/api/health` e2e.

## Notes for Reviewer
- Export choice: a Nest testing module with `HealthController` and a stub `HealthService`, not `AppModule`. TypeORM never starts. Comment is on `documentedControllers` in `document.ts`.
- Frontend consumes `dist`. No `transpilePackages`.
- `OPENAPI_ENABLED` defaults to `true` when unset or empty. `.env.example` says production is `false`.
- The mobile screen line changed from `OrderStatus.PENDING` to `OrderStatusSchema.enum.pending` so the deleted enum does not break `tsc` / Jest once contracts is in the affected set.

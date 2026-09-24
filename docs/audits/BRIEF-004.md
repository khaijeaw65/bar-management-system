# Audit — BRIEF-004 Backend scaffold

| | |
|---|---|
| **Auditor** | Cowork |
| **Date** | 2026-09-24 |
| **PR / commit** | #16 · code `2e6d3e4` · handoff `4a06b70` |
| **Depth** | Full |
| **Brief revision** | 1 |
| **Recommendation** | **PASS WITH NOTES** ← Field makes the final call |

> Findings describe code and documents, not people. "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | migration:run applied InitExtensions; 2nd run "No migrations are pending" | Manual evidence, local Docker |
| AC-2 | ✅ | migration:revert dropped extension + migrations row | |
| AC-3 | ✅ | `test/health.e2e-spec.ts` — 200 `{ status: 'ok', db: 'up' }` | Runs in CI against `postgres:16-alpine` |
| AC-4 | ✅ | `health.service.spec.ts` (down on throw) + `health.controller.spec.ts` (503 body) | |
| AC-5 | ✅ | `env.schema.spec.ts` — error names `PGHOST` | |
| AC-6 | ✅ | e2e asserts exactly one `AuditSubscriber` on `dataSource.subscribers` | `@EventSubscriber()` removed as the brief allowed |
| AC-7 | ✅ | `database.config.spec.ts` checks Nest factory **and** `AppDataSource` | |
| AC-8 | ✅ | lint/typecheck/test (5)/e2e (2)/build exit 0; `ci` run 35947457811 green | |
| AC-9 | ✅ | pnpm 10.0.0, frozen install OK; new deps = §7 exactly (`zod` pinned `4.6.5`) | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope | ✅ | No domain module, no Redis client, no auth wiring; starter controller removed |
| Deps | ✅ | Exactly §7; no naming-strategy package, no CLI loader |
| `synchronize: false` / migrations only | ✅ | Tested in both places |
| ESM `.js` imports | ✅ | |
| Protected files | ✅ | Only `infra/docker-compose.yml` (unlocked) |
| Same app setup in tests and prod | ✅ | `configureApp()` used by `main.ts`, unit and e2e |

## Test Quality
Good. The e2e boots the real `AppModule`, runs migrations and hits the real DB in CI, so BRIEF-001's Postgres service is now actually exercised. The 503 path is tested at controller level with the global filter in place, which matters because `@Res({ passthrough: true })` is the only thing stopping the filter from rewriting the body.

## Findings
| # | Severity | Current → Updated |
|---|---|---|
| F1 | Med | **Current:** the migration list is written twice — `migrations: [InitExtensions…]` in `app.module.ts` **and** in `data-source.ts`. Every domain brief adds migrations; forgetting one side means the CLI and the app disagree about the schema. → **Updated:** one `src/database/migrations.ts` exporting `export const migrations = [InitExtensions1758662400000]`, imported by both. ~5 lines; do it in this PR before merge. |
| F2 | Low | **Current:** `SnakeNamingStrategy` imports `typeorm/util/StringUtils.js`, an internal path. → **Updated:** acceptable — the unit test fails loudly if a TypeORM upgrade moves it. No change now. |
| F3 | Low | **Current:** migration scripts use `node --env-file=.env`, which assumes a `.env` file; ECS injects env vars instead. → **Updated:** the deploy brief (Nov) adds a production migration command without `--env-file` (e.g. `migration:run:prod`). Note only. |
| F4 | Info | **Current:** `NODE_ENV` is required; CI passes because Vitest sets `NODE_ENV=test`. → **Updated:** intended fail-fast behavior — keep; `.env.example` documents it. |

## Recommendation to Field
**PASS WITH NOTES.** All 9 ACs met with real evidence; the scaffold is clean, small and matches `backend.md`. Fix F1 (single migration list) before merge — it's tiny and every next backend brief depends on it. F2–F4 need no change now.

# Audit — BRIEF-009 Contracts foundation + OpenAPI

| | |
|---|---|
| **Auditor** | Cowork (planning/audit session, 2026-10-17) |
| **Assignment** | Brief: Cowork (default); `audit BRIEF-009` requested by Field 2026-10-17 |
| **Date** | 2026-10-17 |
| **PR / commit** | #34 · `39c042f` (work) · head reviewed `e8704b0` (evidence-only after S) |
| **Depth** | Full |
| **Brief revision** | 1 |
| **Recommendation** | **CHANGES REQUIRED** ← Field makes the final call |

> Findings describe code and documents, not people. "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `contracts/src/schemas/enums.test.ts` parses `docs/schema.sql`; all 18 current `CREATE TYPE`s ↔ `schemaEnumBySqlName`; no `CONFIRMED/SessionState/StaffRole` in `app/` | Brief's Sept list (`orderItemStatus`) is outdated by DR-012/013; following the SQL file is correct |
| AC-2 | ✅ | backend e2e uses `MoneySchema`; `app/frontend/contracts.import.test.ts`; contracts consumed from `dist` | |
| AC-3 | ✅ | `common.test.ts` | |
| AC-4 | ✅ | `test/openapi.e2e-spec.ts` (enabled + disabled) | |
| AC-5 | ✅ | handoff (two runs, `cmp` identical) · `stableJson` sorts keys | |
| AC-6 | ✅ | CI step `OpenAPI spec matches contracts` + handoff manual red/green | Not yet exercised in CI (step skipped because an earlier step failed) |
| AC-7 | ✅ | `zod-to-openapi.spec.ts` | |
| AC-8 | ✅ | interceptor + filter specs, `envelope.e2e-spec.ts` | |
| AC-9 | ❌ | **`ci` failed** on `c887859` and `e8704b0` — step "Affected lint, typecheck, test" | See Finding 2 |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ⚠️ | `app/mobile` 2 files changed (needed so the removed enum doesn't break the build — acceptable, should be listed in the handoff) |
| No unapproved deviations / deps | ❌ → approved | Contracts devDeps `vitest ^4.1.2`, `oxlint ^1.58.0`, `@types/node ^24.0.0`, `typescript ^6.0.2` not pre-decided; **Field approved 2026-10-17** (same versions as backend). Handoff says "Deviations: none" |
| `PermissionsGuard` only | n/a | |
| `save()` not `update()` | n/a | |
| ESM `.js` imports · contracts as source of truth | ✅ | |
| Agent boundaries respected | ✅ | `ci.yml` unlocked by the brief |

## Test Quality
Strong. The enum test reads the real SQL file, so future schema changes fail loudly instead of drifting. The envelope is covered by unit and e2e tests, including disabled OpenAPI. Gap: nothing guards the production import graph (Finding 1).

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | **Must fix** | High | **Production boot depends on a devDependency.** `src/common/openapi/document.ts` imports `Test` from `@nestjs/testing` at top level (devDependency). Chain in `dist`: `main.js → bootstrap/configure-app.js → common/openapi/setup-openapi.js → common/openapi/document.js → '@nestjs/testing'`. ESM imports are static, so a production install (`--prod`, the ECS image) fails at boot with `ERR_MODULE_NOT_FOUND`, **even with `OPENAPI_ENABLED=false`**. Current → `createOpenApiDocument` (+ the `@nestjs/testing` import and the HealthService stub) lives in runtime `document.ts`. Updated → move it to a file only the export script imports (e.g. `src/common/openapi/export-document.ts`, or into `scripts/openapi-export.ts`); runtime `document.ts` keeps only `openApiConfig` / `applyContractComponents` / `buildOpenApiDocument` / `stableJson`. Add a check that `dist/main.js`'s import graph has no `@nestjs/testing` (e.g. a unit test that reads `document.ts` source, or `grep -r "@nestjs/testing" dist --include=*.js` excluding the export file, in the handoff). |
| 2 | **Must fix** | High | **CI red.** Annotation: `Test timed out in 5000ms — app/frontend/src/lib/lint/no-arbitrary-values.test.ts:22`. The test is from BRIEF-014; it runs in CI for the first time because contracts changes put `@bar/frontend` in the affected set. Locally 1.8 s; on the runner ESLint starts cold while 4 packages run in parallel. Current → default 5 s timeout. Updated → `test(..., 30_000)` on that one test. **Field approved this out-of-scope one-line change 2026-10-17** — record under Deviations (approved). Re-run until `ci` is green on the new head. |
| 3 | **Must fix** | Med | **Handoff deviations incomplete.** Current → "Deviations: None". Updated → list: (a) contracts devDeps (approved by Field 2026-10-17); (b) `app/mobile` 2-file change to follow the enum removal; (c) frontend test timeout (approved, Finding 2); (d) enum set follows current `schema.sql` (18 types) instead of the brief's September list. |
| 4 | **Must fix** | Med | **KJ state lost planning content.** `docs/state/kj/SESSION_STATE.md` went 137 → 37 lines; today's decisions, canvas table, canvas recipe/gotchas and the plan to 8 Nov were dropped. The rewrite follows the ~40-line state rule, so the cause is mixing long-lived planning notes into state. Field decided 2026-10-17: split them out. Updated → commit `docs/state/kj/PLANNING.md` (written by Cowork, restored from `origin/main` @ cef8d9b — packaging only) and add one line to SESSION_STATE: `Planning notes (Cowork-owned): docs/state/kj/PLANNING.md`. |
| 5 | Suggestion | Low | `codeForStatus` maps any unlisted status to `INTERNAL_ERROR` — e.g. a 405 or 413 returns `status: 405, code: INTERNAL_ERROR`. Consider unlisted 4xx → a generic client code when the first such case appears. Not needed now. |
| 6 | Suggestion | Low | contracts `exports.require` points at an ESM file. Works on Node ≥ 22 (`require(esm)`) and Metro; note it if a CommonJS consumer appears. |
| 7 | Suggestion | Low | `MenuItemSummarySchema` has no `kitchenTag` / `imageKey` / promo fields (DR-010/012, `menu_item.image_key`). Correct for this brief (D4); the menu brief must add them. |

## Recommendation to Field
CHANGES REQUIRED. The contract layer itself is solid and well tested, and the schema-driven enum test is a good safety net for every later brief. Two fixes are blocking: the production import of `@nestjs/testing` (would crash the first deploy) and the CI timeout (merges are blocked until `ci` is green). Findings 3–4 are documentation. After the fixes, re-audit is Compact: verify Finding 1's import graph, green `ci` on the new head, and the handoff/state.

## Evidence Coverage
- Reviewed work SHA: `39c042f` (head `e8704b0`; `39c042f..e8704b0` = handoff/state/brief PR link only — evidence-only ✅)
- Sources/diff inspected independently: full `origin/main...e8704b0` diff (47 files): contracts schemas/tests/package, backend filter/interceptor/domain-exception/openapi/config/bootstrap/export script, `ci.yml`, mobile + frontend touch points, handoff, state.
- Tests run: clean checkout of `e8704b0`, Node 22.22.0 (CI version), pnpm 10.0.0: `pnpm install --frozen-lockfile` ✅; `pnpm turbo run lint typecheck test --filter="...[origin/main]"` → **13/13 tasks pass locally**; `no-arbitrary-values.test.ts` alone 1.81 s. `nest build` + inspection of `dist` import chain for Finding 1. CI: runs 39005521497 / 39005538930 failed (annotations read; raw log download blocked).
- Not run: backend `test:e2e` (Postgres) — relied on handoff G1 + CI after fix.
- Audit is committed after S; pre-merge summary must verify S..head is evidence-only, except the approved fix commits, which need the Compact re-audit.
- Repeated blocker: none.

## Sonar (local scan)
- Handoff Sonar section present: yes — "not run" (optional for this brief) ✅
- Exclusions: none added ✅
- Learning mode: n/a (kj brief)

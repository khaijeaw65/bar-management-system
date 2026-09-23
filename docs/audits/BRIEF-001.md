# Audit — BRIEF-001 CI Gate (G2)

| | |
|---|---|
| **Auditor** | Cowork |
| **Date** | 2026-09-24 |
| **PR / commit** | #10 · `c0e297a` (code audited at `a95c239`; `c0e297a` adds the handoff) |
| **Depth** | Full |
| **Brief revision** | 2 |
| **Recommendation** | **PASS WITH NOTES** ← Field makes the final call |

> Findings describe code and documents, not people. "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | Green `ci` run 35901798016 on `a95c239` | Check name is `ci` (job `name: ci`) |
| AC-2 | ✅ | Local `turbo --dry=json`: backend-only change → `@bar/backend` | Dry-run evidence allowed by brief §5 |
| AC-3 | ✅ | Dry-run: contracts change → contracts + backend + frontend | Mobile will join automatically once BRIEF-002 adds it to the workspace |
| AC-4 | ✅ | Dry-run: docs-only → no package tasks | |
| AC-5 | ✅ | Red run 35901637997 on `89a98a0`, reverted by `a95c239` | Revert pair stays in history — fine, it is the evidence |
| AC-6 | ✅ | Same green run: `postgres:16-alpine` healthy, `test:e2e` 1 passed | e2e does not open a DB connection yet (see F4) |
| AC-7 | ✅ | `tsc --noEmit` exit 0 for backend + frontend | Backend via DR-006 exclude |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ⚠️ | `app/frontend/src/app/layout.tsx` changed (F1) |
| No unapproved deviations / deps | ✅ | No new packages; lockfile diff = contracts path fix + pnpm 10 re-resolution of one peer string; pnpm 10.0.0 confirmed |
| Protected files | ✅ | Only `.github/workflows/ci.yml` (unlocked) |
| Pre-decided exact items | ✅ | `checkout@v4`, `pnpm/action-setup@v4` (no `version`), `setup-node@v4` Node 22 + pnpm cache, `ubuntu-latest`, `postgres:16-alpine`, `fetch-depth: 0`, `--frozen-lockfile` |
| DR-006 applied as approved | ✅ | Exclude + `temporary — removed by BRIEF-003 (DR-006)` comment; e2e uses `INestApplication` |
| Agent boundaries | ✅ | Rules files left uncommitted on purpose |

## Test Quality
Gate evidence is real: a deliberate failure went red, the revert went green, and the handoff lists which tasks Turbo actually ran vs skipped (contracts lint/test, frontend test). The e2e test only hits `GET /`, so AC-6 proves the Postgres service starts, not that the backend talks to it — acceptable for a CI brief.

## Findings
| # | Severity | Current → Updated |
|---|---|---|
| F1 | Low | **Current:** root `layout.tsx` changed from generated `LayoutProps<"/">` to `{ children: ReactNode }`, and the handoff says "Deviations: None". → **Updated:** list it as a deviation in the handoff (it is outside §2 scope, but needed for AC-7 on a clean checkout, and it changes no behavior). Accept it. |
| F2 | Low | **Current:** frontend `typecheck` works by not using Next's generated route types. → **Updated:** in the frontend scaffold brief, make the script `next typegen && tsc --noEmit` so typed routes (`LayoutProps`, `PageProps`) work in CI, then restore them. |
| F3 | Low | **Current:** `app/backend/tsconfig.build.json` has its own `exclude`, which replaces the base one, so `nest build` still compiles the DR-006 files and fails. Not a regression (it failed before) and CI doesn't run `build`. → **Updated:** BRIEF-003 AC-3 fixes it; add "`pnpm --filter @bar/backend build` exits 0" to BRIEF-003. |
| F4 | Info | **Current:** e2e step computes "affected" with a second `turbo --dry=json` + `jq`, outside Turbo's task graph. → **Updated:** fine for now; when e2e grows, add a `test:e2e` task to `turbo.json` (a DR/brief-listed change) and drop the jq step. |

## Recommendation to Field
**PASS WITH NOTES.** All 7 ACs are met with real evidence, no unapproved dependencies, and DR-006 is applied exactly as approved. F1 needs only a one-line handoff fix (can be done in this PR or accepted as-is); F2 and F3 are carried into the frontend scaffold brief and BRIEF-003. Safe to merge. After merge: branch protection → require status check `ci`.

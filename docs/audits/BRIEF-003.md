# Audit — BRIEF-003 Backend scaffold dependencies

| | |
|---|---|
| **Auditor** | Cowork |
| **Date** | 2026-09-24 |
| **PR / commit** | #13 (merged `a162621`) · code `765afc6` · CI on `7652f12` · handoff `cb35348` |
| **Depth** | Compact |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** ← Field makes the final call |

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `package.json` diff — exactly the 6 §7 packages at the pre-decided ranges | |
| AC-2 | ✅ | `tsconfig.json` → `"exclude": ["node_modules", "dist"]` | DR-006 exclude + comment removed |
| AC-3 | ✅ | typecheck exit 0; `tsc --listFiles` includes former excluded set | No `src/` change needed |
| AC-4 | ✅ | lint 0 errors (4 pre-existing warnings) · test 1 · e2e 1 | |
| AC-5 | ✅ | pnpm 10.0.0 · `--frozen-lockfile` from clean tree | Lockfile diff = additions only (verified: 6 packages + transitive, e.g. `jsonwebtoken`, TypeORM CLI `yargs`) |
| AC-6 | ✅ | `app.module.ts` diff empty | |
| AC-7 | ✅ | `ci` run 35903904858 green | |
| AC-8 | ✅ | `nest build` exit 0 | Closes BRIEF-001 audit F3 |

## Findings
| # | Severity | Current → Updated |
|---|---|---|
| F1 | Med (process) | **Current:** PR #13 merged before the handoff and audit existed, so the G3 review happened after the code was on `main`. The code checks out, so no rework. → **Updated:** keep the order *handoff → audit → merge*. Cheap guard: the PR template's G3 checklist box "Cowork audit written" stays unticked until the audit link is in the PR — merge only when it's ticked. |
| F2 | Low | **Current:** CI shows a Node 20 deprecation notice for the v4 actions (`checkout`, `setup-node`, `pnpm/action-setup`). → **Updated:** bump to the current majors in a small tooling brief before GitHub removes Node 20 runners (versions are pre-decided in BRIEF-001, so it needs a brief, not an ad-hoc edit). |
| F3 | Low | **Current:** 4 unused imports in `auth.controller.ts` (lint warnings). → **Updated:** clean up in the auth brief that implements the controller — correctly left alone here. |

## Recommendation to Field
**PASS.** Exact pre-decided dependencies, DR-006 fully closed, `typecheck` and `build` now cover all of `src/`, runtime untouched. Only follow-up is process (F1) and a CI actions bump (F2).

# Handoff — BRIEF-020 Backend structure cleanup

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-10-18 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-020-backend-structure-cleanup` · PR opens after this PASS commit |
| **Commit** | `bcf1359f8c0d06e04fb0064e6fc8bc7ff68f6477` (audited work). Implemented handoff was `b89ac8b`. |
| **Status** | Audit PASS — merged PR determines Done |

> Gate evidence below was run on the work tree that became `bcf1359`. This handoff is the later PASS docs commit. Node v24.14.0, pnpm 10.0.0. Postgres `localhost:5432`, Redis `127.0.0.1:6379`.

## Summary
One clock lives in `common/`. The HTTP exception filter and response interceptor each have their own folder. `order.types.ts` exports types only. Order timestamps call `Date.toISOString()` directly. Access requests go through a repository port. No API, envelope, time-boundary, money, or permission behaviour change.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `git grep -n -E "interface Clock\|CLOCK = Symbol\|class SystemClock" -- app/backend/src` hits only `common/clock.ts` and `common/system-clock.ts`. The same pattern under `app/backend/src/modules` has no hits |
| AC-2 | ✅ | Existing menu unit specs, `business-date.spec.ts`, `order.service.spec.ts`, `ticket.service.spec.ts`, and `test/menu.e2e-spec.ts` passed. The only clock test edit is the `CLOCK` import in `menu.e2e-spec.ts` |
| AC-3 | ✅ | `http-exception.filter.spec.ts`, `transform-response.interceptor.spec.ts`, and e2e 53 passed, including `test/envelope.e2e-spec.ts`. `git ls-files` shows no flat `http-exception.*` or `transform-response.*` directly in `filters/` or `interceptors/` |
| AC-4 | ✅ | `test/order.e2e-spec.ts` — `stores blank orderedByName and notes as null`. No earlier e2e covered whitespace `orderedByName` / `notes` |
| AC-5 | ✅ | `order.types.ts` has no function or const exports (`git grep` empty). `iso` is gone from `fold-orders.ts`. Existing order and ticket e2e still pass |
| AC-6 | ✅ | Already covered by `test/auth.e2e-spec.ts` — `records one pending access request and keeps a rejected row rejected` (second login, one row, status `pending`, new display name). No new assertion |
| AC-7 | ✅ | `git grep -n -E "typeorm\|@nestjs/typeorm\|infrastructure/persistence" -- app/backend/src/modules/iam/application` has no hits |

## Gate Evidence (G1)
One row per gate command from the brief. Exact command, run on the commit above.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/backend lint` | 0 | pass (oxlint + class-file check) |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 62 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/backend test:e2e` | 0 | 53 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/backend openapi:check` | 0 | pass, no diff in `docs/api/openapi.json` |

## Sonar (local scan)
- Not run. The brief marks the local scan optional for this pure refactor.

## Decisions Raised
- none

## Deviations from Brief
- None. `common/clock.ts` keeps the interface and `CLOCK` symbol in one file. The class-file lint did not reject it (it flags module-level functions and arrow consts in class files only), so it was not split.

## Known Gaps / Follow-ups
- `docs/rules/backend.md` src tree still lists the flat filter and interceptor paths and does not show `common/http/`, `money.ts`, `time-label.ts`, `clock.ts`, `system-clock.ts`, or the ≥ 3-file folder rule. Brief Open items: Field-approved docs branch after this merges.
- Audit suggestions (not this PR): rename `recordPending` when the IAM brief adds approve/reject, and move the status rule back into `AccessRequestService` with a unit test. Import order in `order.module.ts` stays as committed.

## AI Usage
**High** — Cursor implemented the five refactors, added the blank-name e2e, and wrote this handoff.

## Review Routing
- Assigned auditor: Cowork
- Audit: PASS on `bcf1359f8c0d06e04fb0064e6fc8bc7ff68f6477`. Must fix: 0. Suggestions 1–3 are follow-ups, not this PR.
- Next: open the PR from this PASS commit. Merge when `ci` is green on that head. Field's own PR is pre-approved.
- Work SHA: `bcf1359f8c0d06e04fb0064e6fc8bc7ff68f6477` · self-check source/contract comparison: no endpoint, envelope, schema, or OpenAPI change. `requestedLines` still trims blank `orderedByName` and `notes` to null via `blankToNull`. The access-request adapter still inserts `pending` and updates only `displayName` and `avatarUrl` with `save()`.

## Notes for Reviewer
- Work commits under `bcf1359`: `66836f1` clock, `d2b19b8` filter and interceptor folders, `d7971a9` order types + `blankToNull` + the new e2e, `96401bf` inline `iso`, `bcf1359` IAM port.
- Each module still registers `{ provide: CLOCK, useClass: SystemClock }`. There is no global clock module.
- Field's untracked copies under `common/filters/http-exception/` and `common/interceptors/transform-response/` were deleted before `git mv`. The moved files are the tracked BRIEF-019 sources.

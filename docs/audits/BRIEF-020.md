# Audit — BRIEF-020 Backend structure cleanup

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session_01Wfvo8pCSjphy2e7LctRHLw |
| **Assignment** | Brief default (Cowork); `audit BRIEF-020` from Field 2026-10-18 |
| **Date** | 2026-10-18 |
| **Branch / commit** | `feat/BRIEF-020-backend-structure-cleanup` · `bcf1359f8c0d06e04fb0064e6fc8bc7ff68f6477` (work) · handoff `b89ac8b` |
| **Depth** | Full (auth access-request path + order request normalisation), per-move behaviour comparison |
| **Brief revision** | 1 |
| **Recommendation** | PASS ← Field makes the final call |

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | Auditor `git grep -E "interface Clock\|CLOCK = Symbol\|class SystemClock" -- app/backend/src` → only `common/clock.ts`, `common/system-clock.ts`. `menu/domain/clock.ts` renamed (100%), order copies deleted | Both modules keep `{ provide: CLOCK, useClass: SystemClock }`; no global module |
| AC-2 | ✅ | Only clock-related test edit: `CLOCK` import path in `test/menu.e2e-spec.ts` (diff inspected). Handoff G1: unit 62, e2e 53 | Unit specs needed no change (structural fakes) |
| AC-3 | ✅ | All 6 files moved with `git mv` (similarity 98–100%); content diffs = relative import paths only. `ls common/filters` → `http-exception/`; `common/interceptors` → `cls-user.interceptor.ts`, `transform-response/`. Field's untracked copies gone | Envelope behaviour unchanged by construction (code byte-identical) |
| AC-4 | ✅ | New e2e `stores blank orderedByName and notes as null` asserts response **and** the `order_item` row. `blankToNull` body identical to the removed `blank()` | Good: checks DB, not just response |
| AC-5 | ✅ | `order.types.ts` has no function/const exports (auditor grep empty); `iso` gone; 5 call sites replaced 1:1 with `.toISOString()` | |
| AC-6 | ✅ | Existing `test/auth.e2e-spec.ts` L259 `records one pending access request and keeps a rejected row rejected` asserts one row, `display_name: 'Updated Name'`, `status: 'pending'`, plus the rejected branch | Adapter body = old service body (only the field name changed) |
| AC-7 | ✅ | Auditor grep `typeorm\|infrastructure/persistence` in `iam/application/` → empty | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | 31 app files, all in §2 items 1–5, + handoff and own state. Seed files (brief, review report) untouched |
| §7 Pre-decided paths and names | ✅ | `common/clock.ts`, `common/system-clock.ts`, `common/http/http-input.ts#blankToNull`, `order/infrastructure/http/http-input.ts#requestedLines`, `iam/domain/access-request.{repository,types}.ts`, `access-request.typeorm-repository.ts`, `recordPending` — exact |
| No deps / contracts / OpenAPI change | ✅ | No `package.json`, contracts or `docs/api/openapi.json` diff. Handoff `openapi:check` exit 0 |
| Agent boundaries | ✅ | No `docs/rules/**`, root config, `.github`, `infra/` changes |
| `save()` not `update()` | ✅ | Adapter uses `save()` on both paths |
| Class-file rule (BRIEF-019) | ✅ | `node scripts/check-class-files.mjs` exit 0 (auditor). `clock.ts` (interface + const) not flagged; no split needed, as handoff states |
| Dependency direction | ✅ | `order/infrastructure/http` → `order/application` types (inward, fine). IAM port → `domain/` types only |
| ESM `.js` imports | ✅ | `tsc --noEmit` exit 0 (auditor) |
| Stale references | ✅ | Auditor grep for every old path (`domain/clock`, `application/system-clock`, flat filter/interceptor, `application/access-request.types`, venue `http-input`) → none |
| State | ✅ | 39 lines; *Carry over* byte-identical to seed |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Suggestion | Low | `recordPending` reads as "set status to pending", but an existing row keeps its status (a rejected row stays rejected — the auth e2e proves it). The name came from the brief's §7, not the executor. **Current →** `recordPending(input)`. **Updated →** `record(input)` with a one-line JSDoc: "new identity → pending; existing → profile only". Do it in the next IAM brief; not worth a fix round |
| 2 | Suggestion | Low | The insert-pending / keep-status rule now lives in the adapter and is covered only by the auth e2e (no unit test). Accepted by brief §7. When the IAM brief adds approve/reject, move the status decision back into `AccessRequestService` with a unit test, since that becomes real business logic |
| 3 | Suggestion | Low | `order.module.ts` places the `../../common/*` imports between `../venue` and `../../providers` imports; `menu.module.ts` puts them first. Cosmetic only — leave unless an import-order lint rule is added |
| 4 | Follow-up (known) | Low | `docs/rules/backend.md` src tree still shows the flat filter/interceptor paths and lacks `common/http/`, `money.ts`, `time-label.ts`, `clock.ts`, `system-clock.ts` and the ≥ 3-file folder rule. Already in brief Open items + handoff → Field-approved docs branch after merge |

## Recommendation to Field
PASS. Every change is a move or rename with import-path edits, plus one 1:1 inline and one service → adapter extraction whose body is unchanged. All pre-decided paths match exactly, nothing outside scope was touched, and the one new test checks the database, not just the response. Findings are naming/placement follow-ups for the IAM brief, not blockers.

## Evidence Coverage
- Reviewed work SHA: `bcf1359` (+ handoff `b89ac8b`, pushed to origin)
- Inspected independently: full `34314c8..bcf1359` app diff (every hunk), handoff, state diff, `test/auth.e2e-spec.ts` AC-6 test body
- Run by auditor on `b89ac8b`: `tsc --noEmit` (exit 0), `node scripts/check-class-files.mjs` (exit 0), stale-path / AC-1 / AC-5 / AC-7 greps, *Carry over* diff vs seed
- Not re-run by auditor: oxlint (`Cannot find native binding` — auditor shell is Linux, `node_modules` holds macOS bindings), vitest unit/e2e, `openapi:check` (needs Postgres/Redis). Relying on handoff G1; CI on the PR re-runs lint, typecheck and tests
- Written uncommitted; the executor commits it unchanged at PASS (H).
- Repeated blocker: none

## Sonar (local scan)
- Not run (optional per brief). N/A.

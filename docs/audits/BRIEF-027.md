# Audit — BRIEF-027 Backend: sold-out (86) auto-void

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-21 evening |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-21 |
| **Branch / commit** | `feat/BRIEF-027-sold-out-auto-void` · `5763b38` (audited work commit; handoff `61add8b`) |
| **Depth** | Full (core flow, bill correctness, payment boundary) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** — zero Must fix; AC-6 403 deferral accepted by Field 2026-10-21 (Finding 1) ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `test/menu-sold-out.e2e-spec.ts` T2/T5/T3/T6 fixture; `sold-out.service.ts` `voidVisit` / `voidTickets` / `publish` | Totals, lists, one `menu.availability_changed`, `ticket.status_changed` for T5 only |
| AC-2 | ✅ | `MenuCatalogService.setAvailability` returns `changed:false` → no void, no event; mark-available only flips; e2e rollback via a CHECK that rejects the reason | |
| AC-3 | ✅ | Lock order item `FOR UPDATE` (`LOCK_ITEM`) → visit (`lockIfLive`) → ticket (`lockTicket`, re-checks `pending`); order create `FOR SHARE OF mi` (`SHARE_ITEMS`) **before** `claimForOrder`; payment create locks the visit first (BRIEF-013). Three concurrent e2e cases | Matches Rev 1 §3b and Q2 A |
| AC-4 | ✅ | `LineCancellationSchema` (`at`, `reason`, `by`, `system`); `ORDER_ROWS_SQL` adds `cancelled_by`, `cancel_reason`; e2e asserts `{ reason: 'ของหมด', by: null, system: true }` | |
| AC-5 | ✅ | `updatedAt` on both ticket payloads (contracts + `ticket.service.ts`); S1: `writeResolve` returns the written issue + in-transaction view, `escalatedPayload(..., written)` — no post-commit re-read | `ticket.service.spec.ts`, ticket e2e files |
| AC-6 | ✅ (deferral accepted) | 404 / 400 ✅ (e2e). 403 not observable: `PermissionsGuard` is not an `APP_GUARD`, so no endpoint returns 403 today; the e2e asserts the `@RequirePermissions('menu:toggle_availability')` metadata | Finding 1 |
| AC-7 | ✅ | `openapi:check` exit 0; both POSTs with `staffAccess('menu:toggle_availability')`; README Menu 86 row | |
| AC-8 | ✅ | Handoff G1: contracts 27, unit 84, e2e 95, lint / typecheck / build / openapi:check exit 0 | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | S2 / S3 left out as Rev 1 says; no cache work |
| No unapproved deviations / deps | ✅ / note | No new packages, no migration, no new error code. Line lookup covers every non-cancelled ticket (not only `pending`) — required by AC-1's `in_progress` report; Rev 1 §3b step 3 was worded too narrowly (brief wording, not an implementation deviation) |
| Module boundary (Q2 A) | ✅ | `OrderModule` adds no import (`order.module.ts` only registers controller + service); payment read = one `PENDING_PAYMENT_SQL` `EXISTS`, commented "same condition as `PaymentRepository.findPendingByVisit`"; MenuModule never imports OrderModule |
| `TicketService` sole status writer | ✅ | `cancelWhenEmpty` → `cancelEmpty` (locks, counts active lines, `saveStatus`); `SoldOutService` emits after commit |
| `save()` not `update()` on audited entities | ✅ | `cancelLines` and `saveAvailability` use `findOne` + `save` |
| System actor | ✅ | `cls.set('userId', undefined)` around the voids, restored in `finally`; menu flag saved before with the staff in CLS (Finding 2) |
| Events after commit | ✅ | `toggle` is `@Transactional`; `publish` runs after it returns |
| ESM `.js` imports · contracts as source of truth | ✅ | |
| Agent boundaries respected | ✅ | no rule / protected files touched |
| Run proof on the audited SHA | ✅ | `migration:run` exit 0; backend on `:3012` (3001 / 3011 taken by other listeners) → health 200; real requests: T1 line voided (`ของหมด`, `system:true`, ticket stays `pending`), T2 accepted → not voided. Backend-only, UI n/a |

## Test Quality
Strong. The e2e uses real Postgres + Redis and the Field-reviewed fixture, asserts money (`−฿150` / `−฿300`), event counts and the three race orderings rather than only happy paths. The rollback case forces a DB failure mid-toggle instead of mocking it. The S1 unit test checks the payload source (written values), which is the actual bug, not just the event name.

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | **Field decision — ✅ accepted (Field, 2026-10-21, session: "accept AC-6 deferral")** | Med | AC-6 says "without `menu:toggle_availability` → 403". **Current:** no endpoint in the app returns 403 — `PermissionsGuard` exists but isn't registered globally, and nothing seeds permissions (brief §3 assumed a seed location that doesn't exist). **Updated:** accept AC-6 as "permission declared via `@RequirePermissions` (metadata-tested); 403 enforcement → IAM brief". Already on the state Follow-ups ("before a real-bar pilot → IAM brief"). |
| 2 | Suggestion | Low | `sold-out.service.ts` clears `userId` in CLS by hand. **Current:** works and is restored in `finally`, but the next "system" write (expiry jobs, auto-close later) would copy the trick. **Updated:** when a second caller appears, move it to one helper, e.g. `common/cls/run-as-system.ts` (`cls.run` with no user). |
| 3 | Suggestion | Low | `voidVisit` returns empty lists for a non-live visit. **Current:** such lines are neither voided nor reported. Can't happen in normal flow (close requires a paid bill), so harmless. **Updated:** none now; revisit if visits can close with open tickets. |

Note (not a finding): ~1,243 added lines excl. `openapi.json` vs the ~600–750 estimate (e2e 429). Reviewable thanks to the clear lock-order comments. Keep the BRIEF-013 S4 sizing note: race-heavy backend briefs come out ~1.7× the estimate.

## Recommendation to Field
PASS on the code. The lock design is exactly Q2 A — no new module edge, the visit row is the shared gate with payment, and order create can't slip a line past the 86 because it takes `FOR SHARE` on the menu row first. The only open item is AC-6's 403, which no endpoint in the app can show until IAM wires `PermissionsGuard`; accept it as deferred to the IAM brief and this is PASS.

**Next command:** `execute BRIEF-027` (PASS commit + PR). The executor copies this file from the main checkout (`docs/audits/BRIEF-027.md`) into its worktree unchanged — the 027 worktree is outside the project folder, so Cowork could not write there.

## Evidence Coverage
- Reviewed work SHA: `5763b38` (via the shared Git object store; worktree `~/Documents/Bar_management_project-027` is outside the connected folder)
- Sources/diff inspected independently: `0ceda99..5763b38` — `sold-out.service.ts`, `sold-out.types.ts`, `ticket.service.ts`, `order.service.ts`, `order.sql.ts`, `order.typeorm-repository.ts`, `menu-catalog.service.ts`, `menu-catalog.typeorm-repository.ts`, `visit.service.ts`, `menu-availability.controller.ts`, `order.module.ts`, contracts `menu.ts` / `orders.ts` / events; `cls-user.interceptor.ts` + `audit-log.service.ts` for the CLS key
- Tests run or independently inspected: **inspected, not re-run** (no pnpm on the Cowork shell; macOS `node_modules`). Independent gate evidence = GitHub `ci` on the PR head, required for merge
- Written uncommitted; the executor commits it unchanged at PASS (H). Pre-merge summary must verify S..H contains evidence-only changes (§7).
- Repeated blocker: none

## Sonar (local scan)
- Handoff Sonar section present: yes — not run, optional
- Remaining issues have reasons; no unapproved exclusions: n/a
- Learning mode respected: n/a

# Handoff — BRIEF-027 Sold-out (86) auto-void

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-10-21 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-027-sold-out-auto-void` (PR opens after this PASS commit) |
| **Commit** | `5763b38e533acbf8bf332e5ad2f9455115f7ab5c` |
| **Status** | Audit PASS — merged PR determines Done |

> Gates and the run proof were run on `5763b38`. Node v24.14.0. Postgres `bar` on localhost:5432, Redis `redis://127.0.0.1:6379`. Branch includes `main` through BRIEF-017 (PR #67, `ef5c3af`).

## Summary
Marking a menu item sold out cancels that item's lines on tickets nobody has started, skips a visit that is already paying and any ticket the bar has started, and reports both lists so staff know which tables to tell. Marking it available again only flips the flag. Voided lines stay voided.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `test/menu-sold-out.e2e-spec.ts` — T2 stays pending and drops ฿150, T5 is cancelled and drops ฿300, T3 / T6 totals unchanged, one `menu.availability_changed`, `ticket.status_changed` for T5 only |
| AC-2 | ✅ | e2e — already unavailable is 200 with empty lists and no event; mark-available does not restore the voided line; a CHECK constraint that rejects `ของหมด` rolls the flag and the lines back and emits nothing |
| AC-3 | ✅ | e2e — payment racing 86 never leaves a voided line inside a pending payment; accept racing 86 is either `in_progress` or cancelled-and-voided; an order during the toggle is voided by it or `409 ITEM_UNAVAILABLE` `sold_out` |
| AC-4 | ✅ | e2e — voided line `cancellation` is `{ reason: 'ของหมด', by: null, system: true }`; the companion line and the visit total exclude it |
| AC-5 | ✅ | `ticket.service.spec.ts` builds the escalate payload from the write, not a second read · `ticket.e2e-spec.ts` and `ticket-issue.e2e-spec.ts` assert `updatedAt` |
| AC-6 | ⚠️ | e2e — unknown item is 404 `NOT_FOUND`; a bad id is 400. **403 is not observable.** `menu:toggle_availability` is `@RequirePermissions` metadata, the same place `orders:update_status` is declared. `PermissionsGuard` exists and is not an `APP_GUARD`, so it does not run. The e2e checks the metadata with `Reflector`. No new error code, no schema change, no DR — the brief's pre-decided seed location does not exist in the database yet |
| AC-7 | ✅ | `openapi:check` exit 0. OpenAPI lists both POSTs with `Permission: menu:toggle_availability` in the description. README Menu 86 row is live |
| AC-8 | ✅ | Gate table below. Contracts tests included |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts test` | 0 | 27 passed · 0 failed |
| `pnpm --filter @bar/backend lint` | 0 | pass |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 84 passed · 0 failed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 95 passed · 0 failed |
| `pnpm --filter @bar/backend build` | 0 | pass |
| `pnpm --filter @bar/backend openapi:check` | 0 | pass |
| run proof: stack up → `migration:run` → `start:dev` → `curl -fsS localhost:3001/api/health` | 0 | Postgres and Redis already up. `migration:run`: no migrations pending. `curl localhost:3001/api/health` → **404** HTML from an unrelated listener (same as BRIEF-013 / BRIEF-017). `localhost:3011` was already another bar API. This process listened on `127.0.0.1:3012` (`PORT=3012`). Health **200** `{"status":"ok","db":"up"}`. Seeded staff: T1 ordered ยำหมูยอ + ถั่วทอดสมุนไพร, T2 ordered ยำหมูยอ and accepted it, then mark-unavailable. `GET /tickets` shows T1's ยำ line voided (`ของหมด`, `system: true`, ticket still `pending`) and T2's line not voided (`accepted`). The catalog seed leaves ยำหมูยอ unavailable, so the proof sets that flag true first. The companion line keeps the voided row on the default queue — an emptied ticket is `cancelled` and drops off `pending` / `accepted` / `ready` |

UI exercised: n/a

## Sonar (local scan)
- Not available yet (BRIEF-006). Not run. This brief marks the scan optional.

## Decisions Raised
- none

## Deviations from Brief
- None that change the outcome. The line lookup includes every non-cancelled ticket, not only `pending`, so a ticket that was already accepted is reported `in_progress`. A pending-only query cannot see it, and AC-1 requires that report.

## Known Gaps / Follow-ups
- AC-6's 403 waits on IAM wiring `PermissionsGuard`. Until then every staff call with a valid session passes, including this one.
- Diff excluding `docs/api/openapi.json` is about 1,243 added lines vs the ~600–750 estimate. Most of the extra is the e2e fixture and the OpenAPI document (committed separately from that count).

## AI Usage
**High** — Cursor implemented the sold-out flow, the ticket-event `updatedAt` carry-in, contracts, and tests.

## Review Routing
- Assigned auditor: Cowork
- Audit: PASS · 0 Must fix · 2 Suggestions (not blocking). AC-6 403 deferral accepted by Field 2026-10-21
- Next: merge when `ci` is green on the PR head (Field's PR, pre-approved)
- Work SHA: `5763b38e533acbf8bf332e5ad2f9455115f7ab5c`

## Notes for Reviewer
- `SoldOutService` lives in OrderModule. Lock order is menu item → visit → ticket. Order create takes `FOR SHARE` on the ordered menu rows before the visit lock, so the two cannot deadlock.
- Payment is one `EXISTS` on `payment.status = 'pending'` in the order repository. OrderModule does not import PaymentModule.
- `TicketService.cancelWhenEmpty` is the only writer of the cancelled status and does not emit. `SoldOutService` emits `ticket.status_changed` after the transaction commits.
- While the lines are voided, CLS `userId` is cleared so `AuditSubscriber` does not stamp the staff onto the system cancel. `cancelled_by` stays null. The menu-flag save happens before that, with the staff still in CLS. The event's `updatedBy` is still the staff who tapped 86.
- Escalate (`S1`) builds `ticket.issue_escalated` from the values just written plus the in-transaction ticket view. A later read is not used for that payload.

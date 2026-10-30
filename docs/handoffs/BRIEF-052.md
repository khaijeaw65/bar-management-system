# Handoff — BRIEF-052 Customer QR: pay the table bill (PromptPay merge), แจ้งโอนแล้ว (C5)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-30 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-052-customer-pay` (PR opens after audit PASS) |
| **Commit** | Work SHA: see chat |
| **Status** | Implemented — awaiting audit (Cowork) |

## Summary
- **Migration** `1763100000000-CustomerPayment`: `payment.guest_session_id` (+ partial index); `table_seat.staff_call_reason` CHECK += `transfer`. Entities / records carry both.
- **Contracts:** `CallStaffReasonSchema` += `transfer`; `CustomerCallStaffSchema` keeps `bill | other` (guest `transfer` → 400); `CustomerPendingPayment`, `CustomerPayment`, `NotifyTransferResult`; error `PAYMENT_NOT_YOURS`.
- **Backend:** `CustomerPaymentService` + `CustomerPaymentController` (`GET /customer/payment`, `POST /customer/payments`, `…/:id/cancel`, `…/:id/notify-transfer`), all writes through `PaymentService` (`create` takes `guestSessionId`). Cancel → 404 off-visit, 403 `PAYMENT_NOT_YOURS`, then the existing 409. notify-transfer checks state before the 60 s throttle so a bad request does not burn the slot. `PaymentService.emitChanged` now also pings `tab.changed` and, once the payment leaves `pending`, `TableSeatService.clearTransferCall` clears only a `transfer` bell (+ `table.staff_call_cleared`). The OpenAPI export lists the new controller; `docs/api/README.md` rows added.
- **Frontend:** `/customer/pay` (intent → QR view → expired / paid), tab footer "ชำระเงิน" when `bill.remaining > 0`, `CallStaffSheet` takes `initialReason` (cash → เช็คบิล), QR via `qrcode.react` canvas (PNG save `promptpay-{seat}.png`), `role="timer"` mm:ss countdown + once-a-minute polite announce, `tab.changed` now also refetches `/customer/payment`. POS: `callReasonText` reads "แจ้งโอนแล้ว ฿1,240.00".
- ~1.4k net-new lines incl. tests and the planner's AC tests (one brief by Field's choice).

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 – AC-9 | ✅ | `test/customer-payment.e2e-spec.ts` (9 passed, planner's assertions untouched) |
| AC-10 – AC-14 | ✅ | `e2e/customer-pay.spec.ts` (5 passed, planner's assertions untouched) · unit: `PayScreen.test`, `countdown.test`, `alerts.test`, `payment.service.spec`, contracts `customer.test` |
| AC-15 | ⚠️ | gates below; run proof partial (see below) |

## Gate Evidence (G1) — on work SHA `655eb58`
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts build` / `test` | 0 | 95 passed (+1 new) |
| `pnpm --filter @bar/backend lint` / `typecheck` (`tsc --noEmit`) | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 179 passed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 30 files · 214 passed |
| `pnpm --filter @bar/backend openapi:check` | 0 | no diff |
| `pnpm --filter @bar/frontend lint` / `typecheck` | 0 | pass |
| `pnpm --filter @bar/frontend test` | 0 | 50 files · 240 passed |
| `pnpm --filter @bar/frontend test:e2e` | 0 | 41 passed |
| `pnpm --filter @bar/frontend build` | 0 | pass (run before the last two small commits, which only touch `PayScreen.tsx` / `customer-payment.service.ts`; lint, typecheck, unit and e2e re-run after them) |

**Run proof (partial):** `migration:run` applied `CustomerPayment` on dev `bar`; `start:dev` from the worktree, `/api/health` 200, `next dev` :3010. Phone 390×844 scanned T3 → ordered ฿120 → tab shows "ชำระเงิน" (total ฿380) → intent → สร้าง QR → QR + `14:55` countdown + hint → แจ้งโอนแล้ว: DB `table_seat.staff_call_reason = transfer`, `note = 380.00`, payment still `pending`, button "แจ้งพนักงานแล้ว · 19:39" → เปลี่ยนวิธีจ่าย: payment `cancelled`, **bell cleared**, intent shows "สร้าง QR พร้อมเพย์" again.
**Not done:** (1) scanning the QR with a real banking app (no device here); (2) staff side on the real stack — POS card chip / chime and POS "mark paid" → phone flips to paid (needs Field's LINE login; covered by e2e AC-7/8 and AC-14 in mock mode); (3) screenshots in `docs/handoffs/assets/BRIEF-052/` — the browser pane returns images only to the session, no file was saved.

## Sonar (local scan)
- Scanned commit: `655eb58` · Quality Gate: ERROR — `new_coverage` 0 % (no coverage report path, known follow-up) + `new_violations` 21.
- Issues by severity: see `pnpm sonar:report` (BLOCKER 0; the scan before the S6582 fix: HIGH 6 · MEDIUM 7 · LOW 9 · INFO 1).
- Fixed in this brief's files: S6582 `customer-payment.service.ts`. Remaining ones are in files this brief did not author (setup.ts, MenuSwitch/MenuItemRow, order-query, request-hash, promptpay-payload, seed-menu-catalog, `customer.gateway.ts:53`, `table-seat.service.ts` duplicate import, `payment.service.ts:194`) — pre-existing cleanup follow-up.
- Who fixed: agent (Field's own brief).

## Decisions Raised
- none

## Deviations from Brief
- None in behaviour. Harness wiring (allowed by §5): `customerMockControls` gained `posPending / markPaid / expirePending`, the customer mock now keeps its "server" in `sessionStorage` (AC-13 reloads `/customer/pay` and needs the tab to survive), and `expirePending` before the create request lands makes that create come back already cancelled (AC-13 clicks and expires without waiting).
- One existing test changed: `updated-at-trigger.e2e-spec` AC-5 now also reverts / re-applies `CustomerPayment` (it drops `guest_session`, which `payment` now references).

## Known Gaps / Follow-ups
- `CustomerOrderController` (BRIEF-048) is still missing from the OpenAPI export script; only the new payment controller was added.
- A QR that expired a moment ago on the phone but whose job has not run: "สร้าง QR ใหม่" returns 409 `PAYMENT_IN_FLIGHT` for a few seconds, then works.
- The guest cancel records `status_reason = staff_cancel` (no guest reason exists in the contract).
- `docs/schema.sql` / ERD not updated (brief: Cowork edit at audit).

## AI Usage
**High** — Claude Code wrote the code and unit tests (Field's brief, full agent mode).

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-052`
- Work SHA: see chat · contract comparison: brief §3 ↔ `customer.ts` schemas ↔ `CustomerPaymentController` ↔ OpenAPI ↔ both AC test files — consistent.

## Notes for Reviewer
- Start at `customer-payment.service.ts`, `payment.service.ts` (`emitChanged`), `table-seat.service.ts` (`clearTransferCall`), `PayScreen.tsx`.
- Work was done in the worktree `.worktrees/BRIEF-052` because the main checkout holds an uncommitted 051 audit note.

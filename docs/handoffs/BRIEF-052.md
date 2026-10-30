# Handoff — BRIEF-052 Customer QR: pay the table bill (PromptPay merge), แจ้งโอนแล้ว (C5)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-30 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-052-customer-pay` (PR opens after audit PASS) |
| **Commit** | Work SHA: see chat |
| **Status** | Audit PASS (Cowork, re-audit 2, S = `f281329`) — PR open |

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
| AC-15 | ✅ | gates below; run proof below (real banking-app scan waived by the auditor) |

## Gate Evidence (G1) — on work SHA `f281329` (re-run after the audit fixes)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts build` / `test` | 0 | 95 passed (+1 new) |
| `pnpm --filter @bar/backend lint` / `typecheck` (`tsc --noEmit`) | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 179 passed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 31 files · 216 passed |
| `pnpm --filter @bar/backend openapi:check` | 0 | no diff |
| `pnpm --filter @bar/frontend lint` / `typecheck` | 0 | pass |
| `pnpm --filter @bar/frontend test` | 0 | 50 files · 241 passed |
| `pnpm --filter @bar/frontend test:e2e` | 0 | 41 passed |
| `pnpm --filter @bar/frontend build` | 0 | pass (run before the last two small commits, which only touch `PayScreen.tsx` / `customer-payment.service.ts`; lint, typecheck, unit and e2e re-run after them) |

**Run proof** (real API :3011 + `next dev` :3010, dev `bar`, T3):
- Phone-side (browser pane, 390×844): `migration:run` applied `CustomerPayment` on dev `bar`; `start:dev` from the worktree, `/api/health` 200. Phone scanned T3 → ordered ฿120 → tab shows "ชำระเงิน" (total ฿380) → intent → สร้าง QR → QR + `14:55` countdown + hint → แจ้งโอนแล้ว: DB `table_seat.staff_call_reason = transfer`, `note = 380.00`, payment still `pending`, button "แจ้งพนักงานแล้ว · 19:39" → เปลี่ยนวิธีจ่าย: payment `cancelled`, **bell cleared**, intent shows "สร้าง QR พร้อมเพย์" again.
- Staff-side (Field signed in with LINE on the POS): phone แจ้งโอนแล้ว → T3 card "แจ้งโอนแล้ว ฿380.00" + Toast "T3 เรียกพนักงาน · แจ้งโอนแล้ว ฿380.00" → POS "ดู QR" → "ยืนยันด้วยตนเอง" · `direct_transfer` → DB payment `completed` / `manual` / `direct_transfer`, T3 `staff_call_reason` NULL (bell cleared) → phone flipped to "ชำระเรียบร้อย" live.
- Screenshots added after Re-audit 2 (headless Playwright against the real stack, POS opened with a minted staff session for Field's dev staff — no LINE flow, no mock mode), `docs/handoffs/assets/BRIEF-052/`: `1-intent.png` · `2-qr-view.png` (QR, ฿120.00, `15:00`, บันทึก QR, hint) · `3-notified.png` ("แจ้งพนักงานแล้ว · HH:MM") · `4-pos-transfer-chip.png` (T3 card "แจ้งโอนแล้ว ฿120.00") · `5-paid.png` ("ชำระเรียบร้อย"). That second run (new order ฿120 on the same open T3 visit; DB: payment `completed` / `manual` / `direct_transfer` / ฿120.00, bell NULL, no transfer chip on the POS afterwards) is the source of the images; the amounts in the written lines above come from the earlier run.
- **Not done / waived:** scanning the QR with a real banking app — waived by the auditor (same `qrPayload` builder as the POS checkout proven on a device in BRIEF-025). Sound not heard (headless).

## Sonar (local scan)
- Scanned commit: `655eb58` (the audit-fix commit `f281329` was not re-scanned) · Quality Gate: ERROR — `new_coverage` 0 % (no coverage report path, known follow-up) + `new_violations` 21.
- Issues by severity: see `pnpm sonar:report` (BLOCKER 0; the scan before the S6582 fix: HIGH 6 · MEDIUM 7 · LOW 9 · INFO 1).
- Fixed in this brief's files: S6582 `customer-payment.service.ts`. Remaining ones are in files this brief did not author (setup.ts, MenuSwitch/MenuItemRow, order-query, request-hash, promptpay-payload, seed-menu-catalog, `customer.gateway.ts:53`, `table-seat.service.ts` duplicate import, `payment.service.ts:194`) — pre-existing cleanup follow-up.
- Who fixed: agent (Field's own brief).

## Decisions Raised
- none

## Deviations from Brief
- None in behaviour. Harness wiring (allowed by §5): `customerMockControls` gained `posPending / markPaid / expirePending`, the customer mock now keeps its "server" in `sessionStorage` (AC-13 reloads `/customer/pay` and needs the tab to survive), and `expirePending` before the create request lands makes that create come back already cancelled (AC-13 clicks and expires without waiting).
- One existing test changed: `updated-at-trigger.e2e-spec` AC-5 now also reverts / re-applies `CustomerPayment` (it drops `guest_session`, which `payment` now references).

## Known Gaps / Follow-ups
- Audit fixes (re-audit 1): non-PromptPay pending hidden from the phone (bill stays locked, "พนักงานกำลังเช็คบิลให้โต๊ะนี้"); `guest_cancel` reason; `CustomerOrderController` in the OpenAPI export. The POS shows no status-reason text yet, so "ลูกค้ายกเลิก" has no place to render (for reports / AI insight).
- `docs/schema.sql` / `docs/erd.html` updated by Cowork with Field's approval (`Approved-by: Field (session)`), committed here.
- `CustomerOrderController` (BRIEF-048) is still missing from the OpenAPI export script; only the new payment controller was added.
- A QR that expired a moment ago on the phone but whose job has not run: "สร้าง QR ใหม่" returns 409 `PAYMENT_IN_FLIGHT` for a few seconds, then works.
- The guest cancel records `status_reason = staff_cancel` (no guest reason exists in the contract).

## AI Usage
**High** — Claude Code wrote the code and unit tests (Field's brief, full agent mode).

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-052`
- Work SHA: `f281329` · contract comparison: brief §3 ↔ `customer.ts` schemas ↔ `CustomerPaymentController` ↔ OpenAPI ↔ both AC test files — consistent.

## Notes for Reviewer
- Start at `customer-payment.service.ts`, `payment.service.ts` (`emitChanged`), `table-seat.service.ts` (`clearTransferCall`), `PayScreen.tsx`.
- Work was done in the worktree `.worktrees/BRIEF-052` because the main checkout holds an uncommitted 051 audit note.

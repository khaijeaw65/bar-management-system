# BRIEF-052 — Customer QR: pay the table bill (PromptPay merge), แจ้งโอนแล้ว (C5)

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts · frontend |
| **Revision** | 1 |
| **Depends on** | BRIEF-013 ✅ / 024 ✅ / 025 ✅ (payments, venue PromptPay ID, slip verify) · BRIEF-047–050 ✅ (guest session, tab, bell, live) · **BRIEF-051 merged** (POS bell UI shows the new reason) — seed is based on an older local `main`: **merge `origin/main` first** |
| **References** | CD-07 handoff (boards `intent`, `qr` ·1–5, ·8–12, `cash · after`; §9 rules; R2, R3, R5, Q1) · canvas https://claude.ai/artifact/JDoXZyWWF2tLybdY9dufQe · CD-03 (lock, 15-min expiry) · DR-014 #6 (venue PromptPay mode) · DR-019 (merge only) · DR-028 · DR-018 (QR from payload) · audit BRIEF-048 Finding 3 (`tab.changed` on payment changes) |
| **Audit depth** | Full (payment + guest auth) |
| **Size** | ~2 days · est. ~1,300–1,600 net-new lines incl. tests — **one brief by Field's choice** |

---

## Interview — Selected (by KJ), 2026-10-30
| Q | Selected (by KJ) |
|---|---|
| Split | One brief, backend + frontend |
| "แจ้งโอนแล้ว" storage (CD-07 Q1) | Reuse the seat bell: new reason `transfer`, amount in `note`; auto-cleared when the payment leaves `pending` |
| Guest cancel ("เปลี่ยนวิธีจ่าย", CD-07 R2) | Only payments this guest session created (new nullable `payment.guest_session_id`) |
| Methods from the phone | PromptPay merge only (venue amount-locked QR); cash → existing bell reason `bill` |
| *(proposed)* Who may notify | Any guest on the visit may tap แจ้งโอนแล้ว for the visit's pending PromptPay payment — including one the POS created (a friend pays the cashier's QR) |
| *(proposed)* Cancel by others | `403 PAYMENT_NOT_YOURS` (not 404) — the guest already sees the payment in `GET /customer/payment`, nothing to hide |
| *(proposed)* Guest `call-staff` | stays `bill` / `other` only; `transfer` is set only through `notify-transfer` |

## 1. Goal
A guest pays the whole table from their phone with the venue's amount-locked PromptPay QR, taps "แจ้งโอนแล้ว" so the POS knows to scan the slip, and sees the bill turn paid live — never two payment attempts at once.

## 2. Scope
### In — backend / contracts
- **Schema (one migration):** `payment.guest_session_id UUID NULL REFERENCES guest_session(id)` (+ partial index) — NULL = staff-created · `table_seat.staff_call_reason` CHECK adds `'transfer'`.
- **Contracts:** `CallStaffReasonSchema` += `'transfer'` (POS reads it) while `CustomerCallStaffSchema.reason` stays `'bill' | 'other'` · new `CustomerPaymentSchema`, `CustomerPendingPaymentSchema`, `NotifyTransferResultSchema` (below) · error code `PAYMENT_NOT_YOURS`.
- **Guest routes (`CustomerModule`, class-level `@Public()` + `GuestSessionGuard`), all through `PaymentService` — no second payment writer:**
  - `GET /customer/payment` → `CustomerPayment`.
  - `POST /customer/payments` (+ `Idempotency-Key`, DR-017, scoped to the session) body `{}` → `201 CustomerPendingPayment` — creates the visit's merge PromptPay payment (CD-03 lock, 15-min expiry, venue mode QR — same rules as `POST /visits/:id/payments`), `guest_session_id` set, `created_by` NULL.
  - `POST /customer/payments/:id/cancel` → `200 CustomerPayment` — only when `guest_session_id` = this session and status `pending`.
  - `POST /customer/payments/:id/notify-transfer` → `200 NotifyTransferResult` — payment must be the visit's `pending` PromptPay payment; sets the seat bell `{ reason: 'transfer', note: <payment amount, Money string> }` (overwrites like any call) → `table.staff_called`; throttle 60 s per session (Redis, fail open). Never changes the payment status.
- **Auto-clear:** when a payment leaves `pending` (paid / cancelled / expired / slip-verified), if its seat's bell reason is `transfer` → clear it + `table.staff_call_cleared`. Bells with `bill` / `other` are untouched.
- **Live:** every payment status change emits `tab.changed { visitId }` (next to the existing staff `payment.status_changed`), so phones refetch `GET /customer/payment` and the tab.
- OpenAPI + `docs/api/README.md` Customer rows.

### In — frontend (phone, `src/app/customer/**`)
- Tab footer **"ชำระเงิน"** when `bill.remaining > 0` → `/customer/pay`.
- **`/customer/pay`** (CD-07 intent): total "ยอดทั้งโต๊ะ ฿…"; no pending → "สร้าง QR พร้อมเพย์" + "จ่ายเงินสด" (opens the bell sheet preset to เช็คบิล); pending exists → "ดู QR" only (CD-07 D3); after full payment → "ชำระเรียบร้อย" + "กลับไปที่บิล" (R5: new orders start a new balance).
- **QR view** (qr·1–5, ·8–12): QR rendered from `qrPayload` (DR-018 — reuse the POS QR renderer), amount, countdown to `expiresAt` (polite announce each minute), **"บันทึก QR"** (PNG download) + 2-step hint "เปิดแอปธนาคาร → สแกน → เลือกรูปจากคลังภาพ" (R3), **"แจ้งโอนแล้ว"** → disabled "แจ้งพนักงานแล้ว · 23:41", **"เปลี่ยนวิธีจ่าย"** only when `mine` (cancel → back to intent), expired → "QR หมดอายุ" + "สร้าง QR ใหม่"; paid (live) → "ชำระเรียบร้อย".
- **POS (BRIEF-051 UI):** bell reason `transfer` reads "แจ้งโอนแล้ว ฿1,240.00" on the card, list and Toast (label map only).

### Out (do NOT build here)
- Split bill (DR-019) · gateway / webhook mode (BRIEF-026) · guest cash payment record · receipts · slip upload by the guest · tips · POS changes beyond the reason label.

## 3. Contract
| Method | Path | Auth | Request → Response |
|---|---|---|---|
| GET | `/customer/payment` | `guest_session` | → `CustomerPayment` |
| POST | `/customer/payments` | `guest_session` + `Idempotency-Key` | `{}` → `201 CustomerPendingPayment` |
| POST | `/customer/payments/:id/cancel` | `guest_session` | → `CustomerPayment` |
| POST | `/customer/payments/:id/notify-transfer` | `guest_session` | → `NotifyTransferResult` |

```ts
CustomerPendingPayment = { id: uuid, amount: Money, qrPayload: string, expiresAt: IsoDateTime, mine: boolean, createdAt: IsoDateTime }
CustomerPayment = { bill: { total: Money, paid: Money, remaining: Money, locked: boolean }, pending: CustomerPendingPayment | null }
NotifyTransferResult = { notifiedAt: IsoDateTime }
```
- Seat-only session → `{ bill: { total: '0.00', paid: '0.00', remaining: '0.00', locked: false }, pending: null }`.
- `pending` = the visit's `pending` PromptPay payment whoever created it; `mine` = created by this session.
- **Errors:** 400 `VALIDATION_ERROR` · 401 `GUEST_SESSION_INVALID` · 403 `PAYMENT_NOT_YOURS` · 404 `NOT_FOUND` (payment not on this visit) · 409 `NOTHING_TO_PAY` · 409 `PAYMENT_IN_FLIGHT` · 409 `PROMPTPAY_NOT_SET` · 409 `PAYMENT_MODE_UNAVAILABLE` · 409 `INVALID_STATE_TRANSITION` · 409 idempotency (DR-017) · 429 `RATE_LIMITED`.
- **WS:** `/customer` `tab.changed { visitId }` on every payment status change · `/staff` `table.staff_called` (reason `transfer`), `table.staff_call_cleared`, existing `payment.status_changed`.
- **Transfer bell format:** `staffCall.reason = 'transfer'`, `staffCall.note` = the pending payment's `amount` as a Money string (e.g. `"1240.00"`); the POS formats it "แจ้งโอนแล้ว ฿1,240.00".
- **Business rules:** one attempt at a time per visit (CD-07 D3) · lock + 15-min expiry as CD-03 · the guest never confirms; staff scan the slip / mark paid (DR-014 #6) · paid ≠ closed (R5) · nickname / identity never exposed.

## 4. Acceptance Criteria
- **AC-1** — `GET /customer/payment`: seat-only → zero bill, `pending: null`; after an order → `bill.total` = the tab total, `remaining` = total, `locked: false`.
- **AC-2** — `POST /customer/payments` → 201 pending payment: `amount` = remaining, non-empty `qrPayload`, `expiresAt` ≈ now + 15 min, `mine: true`; DB row `guest_session_id` = this session, `created_by` NULL, `method` promptpay; bill `locked: true`; staff get `payment.status_changed`; same `Idempotency-Key` replay → same payment id.
- **AC-3** — One at a time: a second phone's `POST` → 409 `PAYMENT_IN_FLIGHT`; its `GET` shows the same pending with `mine: false`; a POS-created pending payment → guest `POST` 409 `PAYMENT_IN_FLIGHT`, `GET` shows it `mine: false`.
- **AC-4** — Refusals: seat-only or zero balance → 409 `NOTHING_TO_PAY`; venue without PromptPay ID → 409 `PROMPTPAY_NOT_SET`.
- **AC-5** — Cancel: own pending → 200, status `cancelled`, bill unlocked, `pending: null`; another phone's or the POS's pending → 403 `PAYMENT_NOT_YOURS`; already paid → 409 `INVALID_STATE_TRANSITION`.
- **AC-6** — แจ้งโอนแล้ว: → 200; seat `staffCall` = `{ reason: 'transfer', note: <amount> }` on `GET /tables`; staff get `table.staff_called`; payment still `pending`; second tap within 60 s → 429; for a non-pending payment → 409 `INVALID_STATE_TRANSITION`. Works for a POS-created pending payment too.
- **AC-7** — Auto-clear: the transfer bell clears (+ `table.staff_call_cleared`) when staff mark the payment paid, when the guest cancels it, and when it expires (15-min job); a `bill` bell is not cleared by a payment change.
- **AC-8** — Live: a guest socket on the visit receives `tab.changed` when the payment is created and when staff mark it paid; afterwards `GET /customer/payment` → `remaining: '0.00'`, `pending: null`.
- **AC-9** — Isolation: staff token on `/customer/payment(s)` → 401; guest cookie on `POST /payments/:id/mark-paid` → 401; guest `POST /customer/call-staff { reason: 'transfer' }` → 400.
- **AC-10 (UI)** — Phone J1: tab → ชำระเงิน → `/customer/pay` "ยอดทั้งโต๊ะ ฿…" → สร้าง QR พร้อมเพย์ → QR image labelled "QR พร้อมเพย์ ฿{amount} โต๊ะ {seat}" + a countdown (`role="timer"`, text `mm:ss`, starts between 14:00 and 15:00 and goes down as time passes) + "บันทึก QR" downloads `promptpay-{seat}.png` + hint "เปิดแอปธนาคาร …" → แจ้งโอนแล้ว → button disabled "แจ้งพนักงานแล้ว · HH:MM" → (staff pays) → "ชำระเรียบร้อย" live → กลับไปที่บิล → tab without "ชำระเงิน".
- **AC-11 (UI)** — A pending payment someone else created (POS or another phone) → intent shows only "ดู QR" (no "สร้าง QR พร้อมเพย์"); its QR view has no "เปลี่ยนวิธีจ่าย".
- **AC-12 (UI)** — My own pending QR → "เปลี่ยนวิธีจ่าย" → back to the intent with "สร้าง QR พร้อมเพย์".
- **AC-13 (UI)** — Expired QR → "QR หมดอายุ" + "สร้าง QR ใหม่"; "จ่ายเงินสด" opens the bell sheet with เช็คบิล selected (`aria-pressed="true"`).
- **AC-14 (UI, POS)** — Bell reason `transfer` with `note: "1240.00"` reads "แจ้งโอนแล้ว ฿1,240.00" on the table card (amount formatted from the Money string, §3).
- **AC-15** — Gates + run proof pass.

## 5. Test Gate
**AC tests by planner (trial #36)** — written against §3 before implementation; they fail until the brief is built. The executor makes them pass **without editing their assertions** (fixing a wrong selector / helper wiring is allowed and listed in the handoff); unit tests are the executor's.

| AC | Test type | Location |
|---|---|---|
| AC-1 – AC-9 | API e2e (supertest + socket.io client, real Postgres + Redis) | `app/backend/test/customer-payment.e2e-spec.ts` |
| AC-10 – AC-14 | UI e2e (Playwright, MSW, Playwright clock for the countdown) | `app/frontend/e2e/customer-pay.spec.ts` |

**Test-harness contract for the UI e2e (executor adds these to the existing mock layer, same pattern as BRIEF-050):** `window.__customerMock` gains `posPending()` (a pending PromptPay payment created by the POS, `mine: false`), `markPaid()` (pending → paid, remaining 0), `expirePending()` (pending → cancelled/expired); `window.__staffSocket.fire` (BRIEF-051) drives the POS card. MSW `/customer/payment(s)` handlers follow §3; the default venue has a PromptPay ID; the tab after `orderOne` has `remaining > 0`.

Gate commands (all must pass):
```bash
pnpm --filter @bar/contracts build && pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck && pnpm --filter @bar/backend test && pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:check
pnpm --filter @bar/frontend lint && pnpm --filter @bar/frontend typecheck && pnpm --filter @bar/frontend test && pnpm --filter @bar/frontend test:e2e && pnpm --filter @bar/frontend build
```
Run proof (real stack, ports BRIEF-046; dev venue has a test PromptPay ID): phone (390×844) orders on T3 → ชำระเงิน → สร้าง QR → scan the QR with a real banking app **without paying** (amount + receiver shown correctly) → แจ้งโอนแล้ว → POS card shows "แจ้งโอนแล้ว ฿…" + chime → POS checkout marks paid (manual, reason direct_transfer) → phone flips to "ชำระเรียบร้อย", POS bell gone → second run: สร้าง QR → เปลี่ยนวิธีจ่าย → bill unlocked. Screenshots in `docs/handoffs/assets/BRIEF-052/`: intent, QR view, notified state, POS card with transfer chip, paid.

### Local Sonar scan
- **Required: yes.**
- Approved exclusions: none.

## 6. Constraints
- Payments are created / cancelled only through `PaymentService` (one payment writer, same lock / idempotency / expiry code as staff); `CustomerModule` imports `PaymentModule`.
- Guest never sees staff ids, `statusNote`, slip data or other sessions' ids; `CustomerPendingPayment` is built field by field.
- `save()` on audited entities; `updated_at` from triggers; no raw tokens in logs.
- Frontend: DS tokens, HeroUI v3; QR renderer reused (DR-018); `localStorage` untouched; Thai copy from CD-07 §6; targets ≥ 44 px.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):** migration above (`payment.guest_session_id`, CHECK += `transfer`) · endpoints / schemas / error code in §3 · bell reason `transfer` with the amount as `note` · auto-clear rule · `tab.changed` on payment changes · routes `src/app/customer/pay/page.tsx` · the three *(proposed)* rows once Field approves.
- **Stop and raise a DR if:** guest payment creation needs a path outside `PaymentService` · split or gateway logic creeps in · any other schema change.

## 8. Unlocked Protected Files
- `none` (schema docs → Field-approved Cowork edit at audit, as BRIEF-047/048)

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2 (≤ 3 working days; over the line guide by Field's one-brief choice)
- [x] No unresolved decision blocking the main outcome
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-30 | Initial Draft (Cowork) — customer side C5 |
| 1 | 2026-10-30 | AC tests by planner (trial #36) — `app/backend/test/customer-payment.e2e-spec.ts` (AC-1–9), `app/frontend/e2e/customer-pay.spec.ts` (AC-10–14) |
| 1 | 2026-10-30 | Draft edit (Field: tighten vague ACs): AC-10 countdown `role="timer"` mm:ss + download `promptpay-{seat}.png`; AC-11 split into AC-11 / AC-12; AC-7 adds expiry; transfer bell `note` = Money string (§3); ACs renumbered to AC-15 |

# BRIEF-013 — Backend: payments core (PromptPay QR, cash, split-equal, lock, manual confirm)

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent — Cursor) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 2 |
| **Depends on** | **BRIEF-012 merged ✅ PR #50** (orders, tickets, totals, `VisitService` row lock, Idempotency-Key helper) · **BRIEF-016 merged ✅ PR #49** (`venue` row) · schema diff Q2 applied to `schema.sql` ✅ (seed commit) |
| **References** | FRD §7 (modes, split, payment-in-flight, settlement ≠ close) · DR-014 #6 · `docs/schema.sql` §7 (`payment`, `payment_order`, `payment_status`, `payment_method`, `payment_confirmed_via`) · CD-03 (Q1–Q3 rev 1, F1–F4, R4, R5, §4 action table, §9 rules) · CD-02 (close-confirm, `409 PAYMENT_IN_FLIGHT`) · `docs/api/README.md` (Payments, Idempotency, D1) · `docs/rules/backend.md` |
| **Audit depth** | Full (payment, money, concurrency) |
| **Size** | ~3 days (target: before the 2 Nov freeze; gate 8 Nov = this brief) |

---

## 1. Goal
The cashier can collect a table's bill — whole or split equally — as an amount-locked PromptPay QR to the venue's own account or as cash; while any part is waiting, the bill is locked; staff confirm a transfer manually with a reason (flagged); a QR expires after 15 minutes. Settling never closes the table. This is the gate path: order → **pay** → close.

## 2. Scope
### In
- **Migration:** `payment`, `payment_order` as `schema.sql` §7 + the Q2 diff; enums `payment_method`, `payment_status`, `payment_confirmed_via` if not yet created. `Payment` extends `BaseEntity`.
- **Module** `modules/payment/` (hexagonal): `PaymentService` (create / cancel / mark-paid / expiry — the only place `payment.status` changes), `BillService` (visit bill: billable total, paid, remaining, locked orders), `PromptPayPayload` (pure: EMVCo payload from venue PromptPay ID + amount, Q3).
- **Idempotency helper (BRIEF-012 audit S2 carry-over):** move `IdempotencyService` from `modules/order/application/` to `common/` (key prefix per caller: `idempotency:order:` / `idempotency:payment:`); when the first request fails while a retry is polling, return 409 `CONFLICT` "กำลังดำเนินการ" instead of `IDEMPOTENCY_KEY_REUSED`. Order tests stay green.
- **Create** `POST /visits/:visitId/payments` (+ `Idempotency-Key`, shared helper):
  - Body `{ method: 'promptpay'|'cash', mode: 'merge'|'split_equal', parts?: 2–10, chargeAssignments?: [{ orderItemId, part }] }`.
  - One transaction, visit row locked: visit live; no `pending` payment on the visit (else 409 `PAYMENT_IN_FLIGHT` with the existing attempt in `details`); remaining > 0 (else 409 `NOTHING_TO_PAY`).
  - Bill = active (non-cancelled) lines of the visit's orders not yet covered by a completed payment; `payment_order` links every order in it (locks them).
  - `merge` → one part = remaining. `split_equal` → non-charge total split `floor(x×100/n)/100`, last part takes the remainder; each charge line added to its assigned part (default part 1 when not assigned) (CD-03 Q2, §9).
  - `promptpay` → each part `pending`, `qr_payload` = EMVCo payload for that amount, `expires_at = now + 15 min`. `cash` → `merge` only (split + cash → 400; a split part can be settled by cash via mark-paid), created `completed`, `confirmed_via = cash`, `paid_at = now`.
  - Venue `payment_mode = gateway` → 409 `PAYMENT_MODE_UNAVAILABLE` (gateway = BRIEF-020). Venue without `promptpay_id` → 409 `PROMPTPAY_NOT_SET` for `promptpay`.
- **Cancel** `POST /payments/:id/cancel` — `pending → cancelled`, `status_reason = staff_cancel`; already settled → 409 `INVALID_STATE_TRANSITION`.
- **Manual confirm** `POST /payments/:id/mark-paid` `{ via: 'manual'|'cash', reason?, note? }` — `pending → completed`, `paid_at`; `manual` requires `reason ∈ webhook_missing | direct_transfer | other` (CD-03 strings), `other` requires `note` (F3); `cash` needs no reason. `updated_by` = staff; manual = flagged (`confirmed_via = manual`). No PIN (CD-03 Q3).
- **Expiry** (Q4): a `pending` payment past `expires_at` is `cancelled` + `status_reason = expired`. Applied before every read and write that touches the visit's payments (create, cancel, mark-paid, `GET /payments/:id`, bill, close, void-guard) inside the same transaction; emits `payment.status_changed` once.
- **Lock (F2):** while any part of the visit is `pending`: `POST /visits/:id/close` → 409 `PAYMENT_IN_FLIGHT` (extend `VisitService.close`); `PaymentGuard.assertNoPaymentInFlight(visitId)` exported for BRIEF-017 / 018. New orders stay allowed; they are outside the lock (not in `payment_order`) and remain due.
- **Reads:** `GET /payments/:id` (poll fallback, CD-03 R4) · `GET /visits/:id` gains `bill: { total, paid, remaining, locked }` + `payments[]` (grouped by `attemptId`, parts 1/n) · `GET /tables` `currentVisit` gains `paymentPending: boolean`.
- **Venue PromptPay ID (Q5):** `seed:venue` sets `promptpay_id` / `promptpay_id_type` from env `VENUE_PROMPTPAY_ID` / `VENUE_PROMPTPAY_ID_TYPE` when present (never committed); `.env.example` documents both. Fixes BRIEF-016 audit S2 in the same touch: settings set on insert only.
- **Events** (room `staff`, after commit): `payment.status_changed` `{ paymentId, attemptId, visitId, status, confirmedVia, statusReason, amount, partNo, partCount }`.
- **Contracts + docs:** schemas above; error codes `PAYMENT_IN_FLIGHT`, `NOTHING_TO_PAY`, `PAYMENT_MODE_UNAVAILABLE`, `PROMPTPAY_NOT_SET`; `docs/api/README.md` Payments table (mark-paid body, cancel, slip / webhook → BRIEF-019 / 020); `openapi.json`.

### Out (do NOT build here)
- **Slip scan → EasySlip verification** (`verify-slip`, `slip_trans_ref`, receiver match, CD-03 Q2 real-slip check) → **BRIEF-019** (Q1).
- **Gateway + webhook** (`/webhooks/payments/:provider`, `gateway_tx_id`, late-webhook rule) → **BRIEF-020** (Q1). Provider TBD: GB Prime Pay is now Xendit (gbprimepay.com redirects to xendit.co, 2026-10-17) → DR with BRIEF-020 (Xendit vs Omise); Field checks Xendit TH PromptPay test mode first.
- Customer pays on phone (CD-07, "แจ้งโอนแล้ว") · receipts as files / tax invoice · refunds · tips · shift cash count (DR-014 #7) · void / comp guard wiring (BRIEF-017 / 018 call the guard) · `PermissionsGuard` enforcement (IAM brief).

## 3. Contract
| Method | Path | Request → Response | Permission |
|---|---|---|---|
| POST | `/visits/:visitId/payments` | body §2 + `Idempotency-Key` → 201 `PaymentAttempt` | `payments:create` |
| GET | `/payments/:id` | → `Payment` | `payments:read` |
| POST | `/payments/:id/cancel` | — → `Payment` | `payments:create` |
| POST | `/payments/:id/mark-paid` | `{ via, reason?, note? }` → `Payment` | `payments:mark_paid` |
- `Payment`: `{ id, attemptId, visitId, partNo, partCount, amount, method, status, confirmedVia, statusReason, statusNote, qrPayload, expiresAt, paidAt, createdBy, updatedBy, createdAt }` · `PaymentAttempt`: `{ attemptId, visitId, mode, total, parts: Payment[] }` · `Bill`: `{ total, paid, remaining, locked }` — money as string.
- **OpenAPI:** all 4 endpoints + changed `GET /visits/:id`, `GET /tables`, `POST /visits/:id/close`.

## 4. Acceptance Criteria
- **AC-1** — Given T3 with ฿1,240.00 billable, when the cashier creates `promptpay` + `merge`, then one `pending` payment ฿1,240.00 with an EMVCo payload for the venue PromptPay ID and that amount, `expires_at` +15 min, every current order linked in `payment_order`, `payment.status_changed` emitted.
- **AC-2** — Given ฿1,240.00 non-charge + ค่าเปิดขวด ฿300.00 assigned to part 2, `split_equal` n=3 → parts ฿413.33 / ฿713.33 / ฿413.34 (sum ฿1,540.00); unassigned charge → part 1; n outside 2–10 → 400.
- **AC-3** — Given a pending part, a second create → 409 `PAYMENT_IN_FLIGHT` with the existing attempt; close → 409 `PAYMENT_IN_FLIGHT`; a new order is accepted and is not in the locked amount (`bill.remaining` after settlement = that order's total).
- **AC-4** — Same `Idempotency-Key` + body twice → one attempt, same response; double-tap with no key handled by AC-3 (409).
- **AC-5** — `cash` + `merge` → `completed`, `confirmed_via = cash`; `cash` + `split_equal` → 400; mark-paid `{ via: cash }` settles one split part.
- **AC-6** — mark-paid `manual` without reason → 400; `other` without note → 400; valid → `completed`, `confirmed_via = manual`, reason / note / `updated_by` stored; on a settled or cancelled payment → 409.
- **AC-7** — cancel pending → `cancelled` + `staff_cancel`; bill unlocks when no part is pending; cancel a completed payment → 409.
- **AC-8** — A pending payment read or touched after `expires_at` (injected clock) is `cancelled` + `expired`, exactly one event, and the visit unlocks; two concurrent touches expire it once.
- **AC-9** — Concurrent create on one visit (`Promise.all`) → one 201 + one 409; concurrent mark-paid + cancel → one wins, the other 409.
- **AC-10** — Settling the full bill never closes the visit; close after full settlement succeeds.
- **AC-11** — Venue `gateway` mode → 409 `PAYMENT_MODE_UNAVAILABLE`; no PromptPay ID → 409 `PROMPTPAY_NOT_SET`; `seed:venue` with the env vars sets the ID, a re-run keeps edited settings (BRIEF-016 S2).
- **AC-12** — EMVCo payload: unit test against known-good vectors (mobile + national ID, with amount; CRC16 correct); scanning one generated QR with a Thai banking app shows the venue name and amount (manual check, screenshot in handoff — no transfer needed).
- **AC-13** — Unknown ids → 404; invalid body → 400; OpenAPI + `openapi:check`; README updated.
- **AC-14** — lint / typecheck / test / test:e2e / build exit 0; contracts tests pass.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2, AC-5, AC-6, AC-7, AC-10, AC-11, AC-13 | e2e | `test/payment.e2e-spec.ts` (real Postgres + Redis) |
| AC-2 (split math) | unit | `src/modules/payment/application/split.spec.ts` |
| AC-3, AC-4, AC-9 | e2e (concurrency) | `test/payment.e2e-spec.ts` → `describe('lock')` |
| AC-8 | unit + e2e | `payment.service.spec.ts` (clock) · `payment.e2e-spec.ts` → `describe('expiry')` |
| AC-12 | unit + manual | `src/modules/payment/application/promptpay-payload.spec.ts` · handoff screenshot |

Gate commands (all must pass):
```bash
pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint
pnpm --filter @bar/backend typecheck
pnpm --filter @bar/backend test
pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend build
pnpm --filter @bar/backend openapi:check
```
A required script that doesn't exist yet = **BLOCKED** — report it, never skip silently.

### Local Sonar scan
- **Required** — payment and money handling.

## 6. Constraints
- Amounts from the DB only; `NUMERIC` + string money end to end; split math in integer satang.
- Payment status changes only in `PaymentService`; visit transitions only in `VisitService`; row locks + `save()` (BRIEF-012 pattern); events after commit.
- The locked amount never changes after create (FRD §7 "freeze what must be frozen").
- PromptPay ID never logged; not returned by `GET /venue` (BRIEF-016 Q2).
- Thai `message`, English `code`; manual-confirm Toast states facts ("บันทึกให้เจ้าของตรวจสอบแล้ว").

## 7. Decision Points (Field Guard)
- **Q1 — Split payment work into three briefs. ✅ Decided (Field, 2026-10-17): A.** **BRIEF-013** = this core (gate path, ~3 days) · **BRIEF-019** = slip scan → EasySlip verify (needs an EasySlip account ฿99+/month and the one-real-slip check, CD-03 Q2) · **BRIEF-020** = gateway + webhook (provider TBD — GB Prime Pay became Xendit; needs a test account + ngrok; FRD's "headline" auto-confirm). *Why:* DR-014 #6 sets the gate to manual confirm; slip + gateway are ~3 more days and each depends on an outside account. *Alternative:* one brief (~6 days, past the freeze).
- **Q2 — Schema diff. ✅ Decided (Field, 2026-10-17): A** — the exact diff below, incl. `payment_charge_item` (F1 approved 2026-10-09 but never reached `schema.sql`). ERD + CLAUDE.md "37 tables" wording: separate Field-approved edits, diff shown first.
  ```sql
  ALTER TABLE payment
    ADD COLUMN attempt_id     UUID NOT NULL,            -- groups the parts of one checkout (merge = 1 part)
    ADD COLUMN part_no        SMALLINT NOT NULL DEFAULT 1,
    ADD COLUMN part_count     SMALLINT NOT NULL DEFAULT 1,
    ADD COLUMN status_reason  VARCHAR(30),              -- staff_cancel | expired | webhook_missing | direct_transfer | other (CD-03 F1)
    ADD COLUMN status_note    TEXT,                     -- required when status_reason = 'other' (F3)
    ADD COLUMN expires_at     TIMESTAMPTZ;              -- pending QR lifetime, 15 min (CD-03 Q1)
  CREATE TABLE payment_charge_item (                    -- which split part carries a charge line (CD-03 Q2)
    payment_id     UUID NOT NULL REFERENCES payment(id),
    order_item_id  UUID NOT NULL REFERENCES order_item(id),
    PRIMARY KEY (payment_id, order_item_id)
  );
  CREATE INDEX idx_payment_visit_status ON payment(visit_id, status);
  ```
  *Why the extra table:* a charge line belongs to one part; storing it lets the receipt per part list it and stops it being counted twice. *Alternative:* no table — the part amount already includes the charge; receipt shows only amounts (simpler, loses "who paid the corkage"). Table count 37 → 38 (CLAUDE.md / ERD wording follow).
- **Q3 — EMVCo PromptPay payload. ✅ Decided (Field, 2026-10-17): A** (own code). own code (~60 lines: TLV fields + CRC16-CCITT) with known-good test vectors — no new dependency, and it is a good thesis artefact. *Alternative:* npm `promptpay-qr` (small, widely used, but a new dependency → exact version Pre-decided).
- **Q4 — Expiry mechanism. ⏸ On hold (Field, 2026-10-17)** — options laid out in session (A lazy expiry vs B BullMQ delayed job). *Cowork recommends* **lazy expiry**: checked inside every transaction that touches the visit's payments + `GET /payments/:id`; the POS countdown is client-side and refetches at 0. No queue now (BullMQ arrives with the AI insight job). *Cost:* a QR nobody touches stays `pending` in the DB until the next read — harmless, because every read and write expires it first. *Alternative:* BullMQ delayed job (exact event at 15:00; adds `bullmq` + `@nestjs/bullmq` now).
- **Q5 — Demo PromptPay ID. ⏸ On hold (Field, 2026-10-17)** — the owner sets `promptpay_id` later on the back-office settings screen (`PATCH /venue`, CD-12/13 era); Field wants to test with a real account once manual confirm and the gateway are both up. *Cowork recommended* env-only (`VENUE_PROMPTPAY_ID`), set on Field's machine; never in git or seed source. *Why:* it is a real personal / bar account. Back-office settings screen later.
- **Pre-decided (if approved as recommended):** error codes above · permissions `payments:create`, `payments:read`, `payments:mark_paid` · no new packages · schema per Q2 · `app/backend/.env.example` gains two keys.
- **Likely DRs:** split + charge assignment edge cases (charge lines added after the attempt) · close rule when `remaining > 0` (today: UI-only, CD-02 — server allows).

## 8. Unlocked Protected Files
- `none` — the Q2 diff was applied to `docs/schema.sql` by Cowork in the seed commit (`Approved-by: Field (session)`, 2026-10-17). `docs/erd.html` + CLAUDE.md "37 tables" wording: separate Field-approved edits.

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions
- [ ] No unresolved decision blocking the main outcome (Q1–Q3 decided; Q4, Q5 on hold)
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-17 | Initial Draft (Cowork) — gate-scope payments from FRD §7, DR-014 #6, CD-03 (Q1–Q3, F1–F4, R4–R6); slip → BRIEF-019, gateway → BRIEF-020 proposed; Q1–Q5 open |
| 2 | 2026-10-17 | Field in session: Q1 A, Q2 A (exact schema diff), Q3 A; Q4, Q5 on hold — recorded by Cowork on Field's explicit instruction |

# BRIEF-013 — Backend: payments core (PromptPay QR, cash, lock, manual confirm, QR expiry)

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent — Cursor) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 3 |
| **Depends on** | **BRIEF-012 merged ✅ PR #50** (orders, tickets, totals, `VisitService` row lock, Idempotency-Key helper) · **BRIEF-016 merged ✅ PR #49** (`venue` row) · schema diff Q2 applied to `schema.sql` ✅ (seed commit). BRIEF-024 (PromptPay ID settings) is **not** a dependency: tests set `venue.promptpay_id` in fixtures; the 8 Nov demo needs both. |
| **References** | FRD §7 (modes, payment-in-flight, settlement ≠ close) · DR-014 #6 · `docs/schema.sql` §7 (`payment`, `payment_order`, `payment_charge_item`, enums) · CD-03 (Q1–Q3 rev 1, F1–F4, R4, R5, §4 action table, §9 rules) · CD-02 (close-confirm, `409 PAYMENT_IN_FLIGHT`) · `docs/api/README.md` (Payments, Idempotency, D1) · `docs/rules/backend.md` |
| **Audit depth** | Full (payment, money, concurrency) |
| **Size** | ~2.5 days · ~500 net-new lines target (split checkout → BRIEF-023, PromptPay ID settings → BRIEF-024 to fit workflow §2) |

---

## 1. Goal
The cashier can collect a table's whole bill as an amount-locked PromptPay QR to the venue's own account, or as cash; while the QR is waiting, the bill is locked; staff confirm a transfer manually with a reason (flagged); a QR expires 15 minutes after it is created. Settling never closes the table. This is the gate path: order → **pay** → close.

## 2. Scope
### In
- **Migration:** `payment`, `payment_order`, `payment_charge_item` as `schema.sql` §7 incl. the Q2 diff (the whole diff ships here so the DB matches `schema.sql`; `payment_charge_item` stays unused until BRIEF-023); enums `payment_method`, `payment_status`, `payment_confirmed_via` if not yet created. `Payment` extends `BaseEntity`.
- **Module** `modules/payment/` (layout per `docs/rules/backend.md` src tree): `PaymentService` (create / cancel / mark-paid / expire — the only place `payment.status` changes), `BillService` (visit bill: billable total, paid, remaining, locked orders), `PromptPayPayload` (pure: EMVCo payload from venue PromptPay ID + amount, Q3).
- **Idempotency helper (BRIEF-012 audit S2 carry-over):** move `IdempotencyService` from `modules/order/application/` to `common/` (key prefix per caller: `idempotency:order:` / `idempotency:payment:`); when the first request fails while a retry is polling, return 409 `CONFLICT` "กำลังดำเนินการ" instead of `IDEMPOTENCY_KEY_REUSED`. Order tests stay green.
- **Create** `POST /visits/:visitId/payments` (+ `Idempotency-Key`, shared helper):
  - Body `{ method: 'promptpay'|'cash', mode: 'merge' }` — `mode` is required now so BRIEF-023 can add `split_equal` without a breaking change; any other value → 400.
  - One transaction, visit row locked: visit live; no `pending` payment on the visit (else 409 `PAYMENT_IN_FLIGHT` with the existing attempt in `details`); remaining > 0 (else 409 `NOTHING_TO_PAY`).
  - Bill = active (non-cancelled) lines of the visit's orders not yet covered by a completed payment; `payment_order` links every order in it (locks them). One part: `part_no = 1`, `part_count = 1`, amount = remaining.
  - `promptpay` → `pending`, `qr_payload` = EMVCo payload for that amount, `expires_at = now + PAYMENT_QR_TTL_SECONDS` (default 900). `cash` → created `completed`, `confirmed_via = cash`, `paid_at = now`.
  - Venue `payment_mode = gateway` → 409 `PAYMENT_MODE_UNAVAILABLE` (gateway = BRIEF-026). Venue without `promptpay_id` → 409 `PROMPTPAY_NOT_SET` for `promptpay`.
- **Cancel** `POST /payments/:id/cancel` — `pending → cancelled`, `status_reason = staff_cancel`; already settled or cancelled → 409 `INVALID_STATE_TRANSITION`.
- **Manual confirm** `POST /payments/:id/mark-paid` `{ via: 'manual'|'cash', reason?, note? }` — `pending → completed`, `paid_at`; `manual` requires `reason ∈ webhook_missing | direct_transfer | other` (CD-03 strings), `other` requires `note` (F3); `cash` needs no reason. `updated_by` = staff; manual = flagged (`confirmed_via = manual`). No PIN (CD-03 Q3).
- **Expiry — BullMQ delayed job (Q4 B):**
  - `BullModule` registered once in `providers/` on the existing `REDIS_URL` config; queue `payment-expiry`.
  - After the create transaction commits, a `promptpay` payment enqueues one job: `jobId = paymentId`, `delay = expires_at − now`. Cancel / mark-paid remove the job after commit (best effort).
  - The processor (separate class, not called from HTTP controllers) calls `PaymentService.expire(paymentId)`: row lock; still `pending` and `now ≥ expires_at` → `cancelled` + `status_reason = expired`, emits `payment.status_changed`; anything else → no-op. Idempotent, so a late or duplicate job is harmless.
  - Enqueue failure after commit → log at `error` (payment id only) and return the 201. The payment stays `pending` until staff cancel it — recorded as a known limit in the handoff.
- **Lock (F2):** while the visit has a `pending` payment: `POST /visits/:id/close` → 409 `PAYMENT_IN_FLIGHT` (extend `VisitService.close`); `PaymentGuard.assertNoPaymentInFlight(visitId)` exported for BRIEF-017 / 018. New orders stay allowed; they are outside the lock (not in `payment_order`) and remain due.
- **Reads:** `GET /payments/:id` (poll fallback, CD-03 R4) · `GET /visits/:id` gains `bill: { total, paid, remaining, locked }` + `payments[]` (grouped by `attemptId`) · `GET /tables` `currentVisit` gains `paymentPending: boolean`.
- **Events** (room `staff`, after commit): `payment.status_changed` `{ paymentId, attemptId, visitId, status, confirmedVia, statusReason, amount, partNo, partCount }`.
- **Contracts + docs:** schemas above; error codes `PAYMENT_IN_FLIGHT`, `NOTHING_TO_PAY`, `PAYMENT_MODE_UNAVAILABLE`, `PROMPTPAY_NOT_SET`; `docs/api/README.md` Payments table (mark-paid body, cancel, `mode` values; split → BRIEF-023, slip / webhook → BRIEF-025 / 026); `openapi.json`; `app/backend/.env.example` gains `PAYMENT_QR_TTL_SECONDS=900`.

### Out (do NOT build here)
- **Split equal + charge-line assignment** (`split_equal`, `parts`, `chargeAssignments`, `payment_charge_item` writes) → **BRIEF-023**.
- **PromptPay ID management** (owner sets / changes the venue PromptPay ID, masked read, `seed:venue` S2 fix) → **BRIEF-024** (Q5).
- **Slip scan → EasySlip verification** (`verify-slip`, `slip_trans_ref`, receiver match, CD-03 Q2 real-slip check) → **BRIEF-025** (Q1).
- **Gateway + webhook** (`/webhooks/payments/:provider`, `gateway_tx_id`, late-webhook rule) → **BRIEF-026** (Q1). Provider TBD: GB Prime Pay is now Xendit (gbprimepay.com redirects to xendit.co, 2026-10-17) → DR with BRIEF-026 (Xendit vs Omise).
- Customer pays on phone (CD-07, "แจ้งโอนแล้ว") · receipts as files / tax invoice · refunds · tips · shift cash count (DR-014 #7) · void / comp guard wiring (BRIEF-017 / 018 call the guard) · `PermissionsGuard` enforcement (IAM brief) · a sweeper / re-enqueue on boot for lost expiry jobs.

## 3. Contract
| Method | Path | Request → Response | Permission |
|---|---|---|---|
| POST | `/visits/:visitId/payments` | `{ method, mode: 'merge' }` + `Idempotency-Key` → 201 `PaymentAttempt` | `payments:create` |
| GET | `/payments/:id` | → `Payment` | `payments:read` |
| POST | `/payments/:id/cancel` | — → `Payment` | `payments:create` |
| POST | `/payments/:id/mark-paid` | `{ via, reason?, note? }` → `Payment` | `payments:mark_paid` |
- `Payment`: `{ id, attemptId, visitId, partNo, partCount, amount, method, status, confirmedVia, statusReason, statusNote, qrPayload, expiresAt, paidAt, createdBy, updatedBy, createdAt }` · `PaymentAttempt`: `{ attemptId, visitId, mode, total, parts: Payment[] }` · `Bill`: `{ total, paid, remaining, locked }` — money as string.
- **WS events:** `payment.status_changed` → payload §2.
- **Contracts changes:** `PaymentSchema`, `PaymentAttemptSchema`, `BillSchema`, `CreatePaymentSchema`, `MarkPaidSchema`; enums `PaymentMethod`, `PaymentStatus`, `PaymentConfirmedVia`, `PaymentStatusReason`; 4 error codes.
- **Permissions:** `payments:create`, `payments:read`, `payments:mark_paid` (declared; enforcement → IAM brief).
- **Business rules:**
  - QR lifetime 15 min → CD-03 Q1 · expiry by delayed job → Field Q4 B (2026-10-19)
  - One pending payment per visit; close blocked while pending; new orders allowed outside the lock → FRD §7, CD-03 F2
  - Locked amount never changes after create → FRD §7 "freeze what must be frozen"
  - Settlement ≠ close → FRD §7, CD-02
  - Manual confirm needs a reason, `other` needs a note, no PIN → CD-03 F3, Q3
  - Cash = merge only in this brief; split → BRIEF-023 → Field Q6 (2026-10-19)
- **OpenAPI:** all 4 endpoints + changed `GET /visits/:id`, `GET /tables`, `POST /visits/:id/close`.

## 4. Acceptance Criteria
- **AC-1** — Given T3 with ฿1,240.00 billable, when the cashier creates `promptpay` + `merge`, then one `pending` payment ฿1,240.00 with an EMVCo payload for the venue PromptPay ID and that amount, `expires_at` +15 min, every current order linked in `payment_order`, one expiry job with `jobId = paymentId`, `payment.status_changed` emitted.
- **AC-2** — Given a pending payment, a second create → 409 `PAYMENT_IN_FLIGHT` with the existing attempt; close → 409 `PAYMENT_IN_FLIGHT`; a new order is accepted and is not in the locked amount (`bill.remaining` after settlement = that order's total).
- **AC-3** — Same `Idempotency-Key` + body twice → one attempt, same response; double-tap with no key handled by AC-2 (409).
- **AC-4** — `cash` + `merge` → `completed`, `confirmed_via = cash`, no expiry job; mark-paid `{ via: cash }` settles a pending QR payment.
- **AC-5** — mark-paid `manual` without reason → 400; `other` without note → 400; valid → `completed`, `confirmed_via = manual`, reason / note / `updated_by` stored; on a settled or cancelled payment → 409.
- **AC-6** — cancel pending → `cancelled` + `staff_cancel`, bill unlocks, expiry job removed; cancel a completed payment → 409.
- **AC-7** — Expiry: with `PAYMENT_QR_TTL_SECONDS` set short in e2e, an untouched pending payment becomes `cancelled` + `expired`, exactly one event, the visit unlocks; a job for a payment already settled or cancelled is a no-op (no event); `expire()` and `markPaid()` racing on one payment → exactly one wins.
- **AC-8** — Concurrent create on one visit (`Promise.all`) → one 201 + one 409; concurrent mark-paid + cancel → one wins, the other 409.
- **AC-9** — Settling the full bill never closes the visit; close after full settlement succeeds.
- **AC-10** — Venue `gateway` mode → 409 `PAYMENT_MODE_UNAVAILABLE`; no PromptPay ID → 409 `PROMPTPAY_NOT_SET`; `mode` other than `merge` → 400.
- **AC-11** — EMVCo payload: unit tests against known-good vectors (mobile + national ID, with amount; CRC16-CCITT correct). The real banking-app scan is the gate demo check after BRIEF-024 — not an AC here.
- **AC-12** — Unknown ids → 404; invalid body → 400; OpenAPI + `openapi:check`; README updated; order idempotency tests still green after the helper move.
- **AC-13** — lint / typecheck / test / test:e2e / build exit 0; contracts tests pass; run proof (§5) passes.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-4, AC-5, AC-6, AC-9, AC-10, AC-12 | e2e | `test/payment.e2e-spec.ts` (real Postgres + Redis) |
| AC-2, AC-3, AC-8 | e2e (concurrency) | `test/payment.e2e-spec.ts` → `describe('lock')` |
| AC-7 | unit + e2e | `payment.service.spec.ts` (clock) · `payment.e2e-spec.ts` → `describe('expiry')` |
| AC-11 | unit | `src/modules/payment/application/promptpay-payload.spec.ts` |

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
Run proof (backend change):
```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
pnpm --filter @bar/backend migration:run
pnpm --filter @bar/backend start:dev   # separate shell, started on the work SHA
curl -fsS localhost:3001/api/health
```
Plus: on that server, create a `promptpay` payment for a seeded visit and show the expiry job in Redis (`bull:payment-expiry:<paymentId>`). UI change: n/a.

A required script that doesn't exist yet = **BLOCKED** — report it, never skip silently.

### Local Sonar scan
- **Required** — payment and money handling.

## 6. Constraints
- Amounts from the DB only; `NUMERIC` + string money end to end; amount math in integer satang.
- Payment status changes only in `PaymentService`; visit transitions only in `VisitService`; row locks + `save()` (BRIEF-012 pattern); events and queue calls after commit.
- The HTTP controller never imports the processor; the processor never calls HTTP code (CLAUDE.md module boundaries).
- The locked amount never changes after create.
- PromptPay ID never logged; not returned by `GET /venue` (BRIEF-016 Q2).
- Thai `message`, English `code`; manual-confirm Toast states facts ("บันทึกให้เจ้าของตรวจสอบแล้ว").

## 7. Decision Points (Field Guard)
- **Q1 — Split payment work into separate briefs. ✅ Decided (Field, 2026-10-17): A.** Core here · slip scan → EasySlip verify · gateway + webhook. IDs renumbered in Rev 3 (Q7).
- **Q2 — Schema diff. ✅ Decided (Field, 2026-10-17): A** — the exact diff below, incl. `payment_charge_item`. ERD + table count 38 applied in the follow-up seed commit (Field-approved 2026-10-17).
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
- **Q3 — EMVCo PromptPay payload. ✅ Decided (Field, 2026-10-17): A** — own code (~60 lines: TLV fields + CRC16-CCITT) with known-good test vectors; no new dependency.
- **Q4 — Expiry mechanism. ✅ Decided (Field, 2026-10-19): B — BullMQ delayed job.** BullMQ is already in the locked stack (CLAUDE.md) and the AI insight job will reuse the setup. *Cost:* two new packages now and a lost job (Redis down at enqueue) leaves the QR pending until staff cancel it — accepted; no sweeper in this brief.
- **Q5 — Demo PromptPay ID. ✅ Decided (Field, 2026-10-19): PromptPay ID management** — the owner sets the ID in the system. Built as its own brief (**BRIEF-024**), not here, to keep this brief within workflow §2; tests use a fixture ID.
- **Q6 — Size split. ✅ Decided (Field, 2026-10-19): this brief = merge checkout only; split equal + charge assignment → BRIEF-023.** *Why:* workflow §2 (~500 net-new lines); the gate path needs one merged payment only.
- **Q7 — Brief IDs. ✅ Decided (Field, 2026-10-19): next free numbers** — split 023 · PromptPay ID settings 024 · slip 025 · gateway 026.
- **Pre-decided:** error codes above · permissions `payments:create`, `payments:read`, `payments:mark_paid` · schema per Q2 · new packages, exact versions, `app/backend` dependencies: `bullmq@6.3.11`, `@nestjs/bullmq@12.0.0` (peer range covers `@nestjs/*` 12 and `bullmq` 6) — nothing else · queue name `payment-expiry` · env key `PAYMENT_QR_TTL_SECONDS` (default 900) in `app/backend/.env.example`.
- **Likely DRs:** close rule when `remaining > 0` (today: UI-only, CD-02 — server allows).

## 8. Unlocked Protected Files
- `none` — the Q2 diff is in `docs/schema.sql` (seed commit, `Approved-by: Field (session)`, 2026-10-17); ERD + table count in the follow-up seed commit.

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2 (≤ ~3 working days, ~500 net-new lines); otherwise split
- [x] No unresolved decision blocking the main outcome (Q1–Q7 decided)
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-17 | Initial Draft (Cowork) — gate-scope payments from FRD §7, DR-014 #6, CD-03 (Q1–Q3, F1–F4, R4–R6); slip and gateway split out; Q1–Q5 open |
| 2 | 2026-10-17 | Field in session: Q1 A, Q2 A (exact schema diff), Q3 A; Q4, Q5 on hold — recorded by Cowork on Field's explicit instruction |
| 3 | 2026-10-19 | Rebased on main (#60). Field in session: Q4 B (BullMQ delayed job, exact versions Pre-decided), Q5 PromptPay ID management → BRIEF-024, Q6 split equal → BRIEF-023, Q7 IDs 023–026 — recorded by Cowork on Field's explicit instruction. Workflow Rev 20 template: business rules, run proof, size check. Seed env + BRIEF-016 S2 moved to BRIEF-024; banking-app scan moved to the gate demo |

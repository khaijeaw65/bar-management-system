# Handoff — BRIEF-013 Payments core

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-10-19 |
| **Brief revision** | 3 |
| **Branch** | `feat/BRIEF-013-payments-core` (PR opens after audit PASS) |
| **Commit** | `f06f28a54beccd7417682c2e675da39d8ee2bd6d` (the commit the evidence below was run on) |
| **Status** | Implemented — awaiting audit |

> Created at `Implemented` (one docs commit). Updated once in the PASS commit. Frozen at merge.

## Summary
Staff can collect a visit's whole remaining bill as one merged PromptPay QR or as cash. A pending QR locks close, expires by a BullMQ delayed job, and can be cancelled or confirmed manually. Settling the bill does not close the visit.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `test/payment.e2e-spec.ts` — `locks a 1240 promptpay bill, links the order, and queues expiry` |
| AC-2 | ✅ | same file — `blocks a second create and close, and keeps a later order due` |
| AC-3 | ✅ | `describe('lock')` — `replays the same idempotency key and rejects a different body` · `idempotency.service.spec.ts` — key dropped while polling is 409 `CONFLICT` |
| AC-4 | ✅ | `completes cash immediately and can settle a QR as cash` |
| AC-5 | ✅ | `requires a manual reason and stores the staff member` |
| AC-6 | ✅ | `cancels a pending payment and refuses a completed one` |
| AC-7 | ✅ | `payment.service.spec.ts` — before `expiresAt` no-op; at `expiresAt` cancels once and emits `expired`; settled is a no-op · e2e `describe('expiry')` — delayed job cancels; `expire` vs `mark-paid` one winner |
| AC-8 | ✅ | `lets one of two concurrent creates win` · `lets one of mark-paid and cancel win` |
| AC-9 | ✅ | `does not close the visit when the bill is settled` |
| AC-10 | ✅ | `rejects gateway mode, a missing PromptPay id, and a mode other than merge` |
| AC-11 | ✅ | `promptpay-payload.spec.ts` — mobile + national-id vectors; CRC-16/CCITT-FALSE of `123456789` is `29B1` |
| AC-12 | ✅ | `returns 404 and 400 for unknown ids and a bad body` · `docs/api/openapi.json` lists the 4 payment paths plus visit bill, table `paymentPending`, and close · `openapi:check` exit 0 |
| AC-13 | ✅ | Gate table below |

## Gate Evidence (G1)
Run on `f06f28a` before this docs commit. Node v24.14.0. E2e used Postgres `bar` on localhost:5432 and Redis `redis://127.0.0.1:6379`.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts test` | 0 | 23 passed · 0 failed |
| `pnpm --filter @bar/backend lint` | 0 | pass |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 73 passed · 0 failed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 76 passed · 0 failed |
| `pnpm --filter @bar/backend build` | 0 | pass |
| `pnpm --filter @bar/backend openapi:check` | 0 | pass (export produced no diff) |
| run proof: stack up → `migration:run` → `start:dev` → `curl -fsS localhost:3001/api/health` | 0 | migration: no pending (e2e had already applied `1762200000000`). Health **200** on this process at `127.0.0.1:3011` — port 3001 is held by unrelated container `tlirv-eup-web` (`curl localhost:3001/api/health` → 404). On that server: promptpay create 201 `pending` `120.00`, Redis `EXISTS bull:payment-expiry:fc1f94f2-595f-4be0-b36a-d64a0b00bc1b` = 1 |

UI exercised: n/a

## Sonar (local scan)
- Not available yet (BRIEF-006). Not run.

## Decisions Raised
- none

## Deviations from Brief
- None.

## Known Gaps / Follow-ups
- If Redis rejects the expiry enqueue after commit, the API still returns 201 and logs the payment id. The QR stays `pending` until staff cancel it. No boot sweeper (brief limit).
- `payment_charge_item` is migrated and unused until BRIEF-023. No entity.
- `@RequirePermissions` is metadata only until the IAM brief.
- PromptPay ID is a test fixture here. Owner settings are BRIEF-024. `GET /venue` still does not return the id.
- Gateway, slip, and split stay in BRIEF-026, BRIEF-025, and BRIEF-023.
- Local setup: `app/frontend/.env.local` is absent (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_MOCKING`).

## AI Usage
**High** — Cursor implemented the payment module, the idempotency move, contracts, tests, OpenAPI, and this handoff.

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-013`
- Work SHA: `f06f28a54beccd7417682c2e675da39d8ee2bd6d` · self-check: four endpoints, bill fields, four error codes, and `jobId = paymentId` compared against BRIEF-013 Rev 3 §2–§3

## Notes for Reviewer
- Status changes only in `PaymentService`, via `save()` under a row lock. Visit close locks the visit, then `PaymentGuard.assertNoPaymentInFlight`, then `closeIfLive`. Events and the queue run after the transaction commits.
- Create locks the visit. A pending payment is 409 `PAYMENT_IN_FLIGHT` with the existing attempt in `details`. `remaining` is the sum of active orders not linked to a completed payment. `locked` is true while any payment is `pending`. New orders stay outside `payment_order`.
- Cash is inserted `completed` / `confirmed_via = cash`. A second cash create therefore sees `NOTHING_TO_PAY`, not a pending lock. AC-8's concurrent create uses PromptPay so the loser is `PAYMENT_IN_FLIGHT`.
- Cancel and mark-paid return 200. Create returns 201. Manual confirm requires a reason; `other` requires a note. `updated_by` is the staff member.
- Queue `payment-expiry`, `jobId = paymentId`, delay until `expires_at`. The processor is not imported by the controller. `PAYMENT_QR_TTL_SECONDS` defaults to 900 (`configuration.spec.ts`); e2e sets 2.
- `IdempotencyService` lives in `common/idempotency/`. Redis key `idempotency:${scope}:${key}`. Orders use `order`. If the key disappears while a retry is polling, that retry is 409 `CONFLICT` "กำลังดำเนินการ". A different body stays `IDEMPOTENCY_KEY_REUSED`.
- `PaymentModule` imports `OrderModule` and `VenueModule` through `forwardRef`. A direct `OrderModule` import was `undefined` under the venue → order → payment cycle.
- EMVCo field order is 00, 01, 29, 58, 53, 54, 63. The ฿1,240 / mobile vector is the e2e payload.
- Amounts stay decimal strings. Addition uses integer satang.

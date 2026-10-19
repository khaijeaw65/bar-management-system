# Handoff — BRIEF-024 Venue PromptPay ID

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-10-19 |
| **Brief revision** | 2 |
| **Branch / PR** | `feat/BRIEF-024-promptpay-id-settings` · no PR until audit PASS |
| **Commit** | `5db6b528cca4e7b1e75091ad8915d38f35ff97b1` |
| **Status** | Implemented |

> Gate evidence below was run on `5db6b52`, before this docs commit. Node v24.14.0. This branch includes `main` through BRIEF-013 (PR #64).

## Summary
The owner sets the venue PromptPay ID through the API. Staff receive only a mask. Each real change writes one append-only `audit_log` row. A pending payment anywhere in the venue blocks the change, so an open QR still pays the previous account.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `test/venue-payment-settings.e2e-spec.ts` — stores `0812345678` from `081-234-5678`, GET mask `XXX-XXX-5678`, `GET /venue` has no payment fields |
| AC-2 | ✅ | `src/modules/venue/application/promptpay-id.spec.ts` — bad format, bad national-ID check digit, type mismatch throw 400 `VALIDATION_ERROR` without the raw ID · e2e posts the same three cases |
| AC-3 | ✅ | e2e — one masked `audit_log` row per real change, unchanged PATCH adds none, raw ID absent from the row and from captured stdout/stderr |
| AC-4 | ✅ | e2e — pending payment on a visit → 409 `PAYMENT_IN_FLIGHT`, ID unchanged, no new audit row; after mark-paid the PATCH succeeds |
| AC-5 | ✅ | e2e `describe('seed')` — re-run keeps the edited name, kitchen display, cut-off, counter QR, payment mode, and PromptPay ID |
| AC-6 | ✅ | e2e — payment created after the PATCH carries the new ID in the EMVCo payload (`1.23` / mobile vector) |
| AC-7 | ✅ | Gate table below · `docs/api/openapi.json` lists `GET` and `PATCH /api/venue/payment-settings` · `docs/api/README.md` Venue table updated |

## Gate Evidence (G1)
Run on `5db6b52` before this docs commit. Node v24.14.0. E2e used Postgres `bar` on localhost:5432 and Redis `redis://127.0.0.1:6379`.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts test` | 0 | 25 passed · 0 failed |
| `pnpm --filter @bar/backend lint` | 0 | pass |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 78 passed · 0 failed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 82 passed · 0 failed |
| `pnpm --filter @bar/backend build` | 0 | pass |
| `pnpm --filter @bar/backend openapi:check` | 0 | pass (export produced no diff) |
| run proof: stack up → `migration:run` → `start:dev` → `curl -fsS localhost:3001/api/health` | 0 | migration: no pending (e2e had already applied `AuditLog1762300000000`). `curl localhost:3001/api/health` → **404** HTML from an unrelated docker listener. This process listened on `127.0.0.1:3011` (`PORT=3011`). Health **200** `{"status":"ok","db":"up"}`. PATCH `081-234-5678` / `mobile` → **200**, mask `XXX-XXX-5678`, raw ID absent from the body, stored digits match. `audit_log` row: entity `venue`, action `UPDATE`, `changed_fields.promptpay_id` `{ from: null, to: "XXX-XXX-5678" }`, `promptpay_id_type` `{ from: null, to: "mobile" }`, `changed_by` = the staff id, raw ID absent |

UI exercised: n/a

## Sonar (local scan)
- Not available yet (BRIEF-006). Not run.

## Decisions Raised
- none

## Deviations from Brief
- None.

## Known Gaps / Follow-ups
- `@RequirePermissions('venue:read_payment' | 'venue:update_payment')` is metadata only until the IAM brief. Owner-only enforcement is that brief (Q2).
- No PIN on this action (Q2). BRIEF-018 adds it before a real-bar pilot.
- `payment_mode = gateway` is not switchable here (BRIEF-026).
- Local setup: `app/frontend/.env.local` is absent (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_MOCKING`).

## AI Usage
**High** — Cursor implemented the migration, audit writer, settings API, seed change, contracts, tests, OpenAPI, and this handoff.

## Review Routing
- Assigned auditor: Cowork
- Next: `audit BRIEF-024`

## Notes for Reviewer
- `audit_log` matches `schema.sql` §9 (`audit_action` + table + the three indexes). `AuditLogService.record` is insert-only and reads `changed_by` from CLS. It is not wired into `AuditSubscriber`.
- The change runs in one transaction: lock the venue row, `PaymentGuard.assertNoPaymentInFlightForVenue()`, `save()` the venue, then the audit insert. The guard's check is `PaymentRepository.hasPending()` — one venue, so any `pending` payment counts. The 409 body has no payment details, so it cannot carry a QR payload.
- Same stored digits and type → 200 and no audit row. Validation runs before the transaction. Mask is `XXX-XXX-` plus the last 4 digits for every ID type. A national ID uses the Thai check digit.
- `GET /venue` is unchanged. `paymentAccount()` still returns the full ID to `PaymentService` so the QR can be built. That value is not logged or returned by the settings endpoints.
- `seed:venue` inserts the venue row once (BRIEF-016 audit S2). A re-run does not write the row. No PromptPay env key.

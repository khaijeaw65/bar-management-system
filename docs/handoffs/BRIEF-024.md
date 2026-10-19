# Handoff — BRIEF-024 Venue PromptPay ID

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-10-20 |
| **Brief revision** | 3 |
| **Branch / PR** | `feat/BRIEF-024-promptpay-id-settings` · PR opens after this PASS commit |
| **Commit** | `34a379388ac52267fcd4ecd67358a4932d252efa` (audited work). Implemented handoff was `eb2f019`. Rev 3 is `cce3aac`. |
| **Status** | Audit PASS — merged PR determines Done |

> Executor gates below were run on `5db6b52`, before the Implemented docs commit. The race fix `34a3793` was re-checked by the auditor (e2e 83, including `describe('race')`). This handoff is the later PASS docs commit. Node v24.14.0. This branch includes `main` through BRIEF-013 (PR #64).

## Summary
The owner sets the venue PromptPay ID through the API. Staff receive only a mask. Each real change writes one append-only `audit_log` row. A pending payment anywhere in the venue blocks the change, and a payment being created shares the venue row so an open QR cannot keep the old ID after the change commits.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `test/venue-payment-settings.e2e-spec.ts` — stores `0812345678` from `081-234-5678`, GET mask `XXX-XXX-5678`, `GET /venue` has no payment fields |
| AC-2 | ✅ | `src/modules/venue/application/promptpay-id.spec.ts` — bad format, bad national-ID check digit, type mismatch throw 400 `VALIDATION_ERROR` without the raw ID · e2e posts the same three cases |
| AC-3 | ✅ | e2e — one masked `audit_log` row per real change, unchanged PATCH adds none, raw ID absent from the row and from captured stdout/stderr |
| AC-4 | ✅ | e2e — pending payment → 409 `PAYMENT_IN_FLIGHT`, ID unchanged, no new audit row; after mark-paid the PATCH succeeds · `describe('race')` — concurrent PATCH + create is either 409 with the old ID in the QR, or 200 with the new ID |
| AC-5 | ✅ | e2e `describe('seed')` — re-run keeps the edited name, kitchen display, cut-off, counter QR, payment mode, and PromptPay ID |
| AC-6 | ✅ | e2e — payment created after the PATCH carries the new ID in the EMVCo payload (`1.23` / mobile vector) |
| AC-7 | ✅ | Gate table below · `docs/api/openapi.json` lists `GET` and `PATCH /api/venue/payment-settings` · `docs/api/README.md` Venue table updated |

## Gate Evidence (G1)
Executor run on `5db6b52` before the Implemented docs commit. Node v24.14.0. E2e used Postgres `bar` on localhost:5432 and Redis `redis://127.0.0.1:6379`.

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

Auditor re-run on `34a3793` (Linux, Postgres 16 + Redis): contracts test 25 · lint 0 · typecheck 0 · test 78 · test:e2e 83 · build 0 · openapi:check 0. Before that commit the executor ran lint, typecheck, unit tests, `payment.e2e-spec.ts`, and `venue-payment-settings.e2e-spec.ts` (including `describe('race')`) on the fix.

UI exercised: n/a

## Sonar (local scan)
- Not available yet (BRIEF-006). Not run.

## Decisions Raised
- none

## Deviations from Brief
- None. Rev 3 (Field, 2026-10-19) is the shared venue lock on payment create.

## Known Gaps / Follow-ups
- `@RequirePermissions('venue:read_payment' | 'venue:update_payment')` is metadata only until the IAM brief. Owner-only enforcement is that brief (Q2).
- No PIN on this action (Q2). BRIEF-018 adds it before a real-bar pilot.
- `payment_mode = gateway` is not switchable here (BRIEF-026).
- Audit suggestions, not blocking: S1 (one shared `INVALID` exception instance), S2 (`hasPending` is table-wide; one venue in Phase 1).
- Local setup: `app/frontend/.env.local` is absent (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_MOCKING`).

## AI Usage
**High** — Cursor implemented the migration, audit writer, settings API, seed change, race fix, contracts, tests, OpenAPI, and this handoff.

## Review Routing
- Assigned auditor: Cowork
- Audit: PASS on `34a379388ac52267fcd4ecd67358a4932d252efa`. Must fix: 0. Suggestions S1–S2 are not blocking.
- Next: open the PR from this PASS commit. Merge when `ci` is green on that head. Field's own PR is pre-approved.

## Notes for Reviewer
- `audit_log` matches `schema.sql` §9 (`audit_action` + table + the three indexes). `AuditLogService.record` is insert-only and reads `changed_by` from CLS. It is not wired into `AuditSubscriber`.
- The change runs in one transaction: lock the venue row `FOR UPDATE`, `PaymentGuard.assertNoPaymentInFlightForVenue()`, `save()` the venue, then the audit insert. The guard's check is `PaymentRepository.hasPending()` — one venue, so any `pending` payment counts. The 409 body has no payment details, so it cannot carry a QR payload.
- Payment create locks the visit, then reads the account with `lockedPaymentAccount()` (`SELECT … FOR SHARE`) inside the same transaction. PATCH locks the venue only. A create in flight makes the PATCH wait and then see the pending QR; a PATCH in flight makes the create wait and then read the new ID.
- Same stored digits and type → 200 and no audit row. Validation runs before the transaction. Mask is `XXX-XXX-` plus the last 4 digits for every ID type. A national ID uses the Thai check digit.
- `GET /venue` is unchanged. The full ID is read only to build the QR. It is not logged or returned by the settings endpoints.
- `seed:venue` inserts the venue row once (BRIEF-016 audit S2). A re-run does not write the row. No PromptPay env key.

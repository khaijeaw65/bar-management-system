# Handoff — BRIEF-072 Backend: Today's Payments API (`GET /payments/today`)

| | |
|---|---|
| **Implementer** | kj (Antigravity) |
| **Date** | 2026-11-02 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-072-payments-today-api` (PR opens after audit PASS) |
| **Commit** | `fcedcde` |
| **Status** | Audit PASS |

> Created at Implemented (one docs commit). Updated once in the PASS commit. Frozen at merge.

## Summary

- Exposes `GET /api/payments/today` on `PaymentsController` gated by `@RequirePermissions('payments:read')`.
- Defined `TodayPaymentItemSchema`, `TodayPaymentsSummarySchema`, and `TodayPaymentsResponseSchema` in `@bar/contracts`.
- Implemented `findToday(from, to)` in `PaymentRepository` / `PaymentTypeormRepository` joining `payment`, `visit`, and `table_seat` with `seatLabel`.
- Implemented `getToday(now?: Date)` in `PaymentService` computing summary aggregates (`totalRevenue`, `promptpayTotal`, `cashTotal`, `completedCount`, `pendingCount`, `cancelledCount`) scoped to venue business day cutoff bounds via `common/business-date.js`.

## Acceptance Criteria

| AC | Result | Evidence |
|---|---|---|
| AC-1 | ✅ | `test/payments-today.e2e-spec.ts` > `AC-1 & AC-3`: returns HTTP 200 with envelope, summary metrics, and items sorted by `createdAt` DESC. |
| AC-2 | ✅ | `test/payments-today.e2e-spec.ts` > `AC-2`: filters payments strictly by current venue business date using venue cutoff. |
| AC-3 | ✅ | `test/payments-today.e2e-spec.ts` > `AC-1 & AC-3`: items map real state, amount, method, status, confirmedVia, timestamps, and `seatLabel`. |
| AC-4 | ✅ | `test/payments-today.e2e-spec.ts` > `AC-4`: returns HTTP 403 `FORBIDDEN` when caller lacks `payments:read`. |

## Gate Evidence (G1)

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts build` | 0 | pass (`tsc -p tsconfig.build.json`) |
| `pnpm --filter @bar/contracts test` | 0 | 17 passed · 146 passed · 0 failed |
| `pnpm --filter @bar/backend lint` | 0 | Found 0 warnings and 0 errors (474 files, 102 rules) · class files OK |
| `pnpm --filter @bar/backend typecheck` | 0 | pass (`tsc --noEmit`) |
| `pnpm --filter @bar/backend test` | 0 | 63 passed · 296 passed · 0 failed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 45 passed · 308 passed · 0 failed |
| `pnpm --filter @bar/backend openapi:check` | 0 | pass (`docs/api/openapi.json` synchronized) |
| `run proof: dist/main.js + /api/health + /api/payments/today` | 0 | Rebuilt from `fcedcde`; `/api/health` 200; unauthenticated `GET /api/payments/today` returns 401; authenticated demo login returns 200 with businessDate and summary totals |

UI exercised: n/a (backend API brief; frontend page is `BRIEF-073`).

## Sonar (local scan)

- Scanned commit: `fcedcde` · Quality Gate: n/a (local Sonar server offline)
- Remaining issues + reason: 0 issues on files touched by BRIEF-072.

## Decisions Raised

- none (all implementations follow pre-decided scope in BRIEF-072 Rev 1).

## Deviations from Brief

- none (1-line fix in seeded e2e test passing `null` group for unprivileged staff was approved by Field in session with `Approved-by: Field (session)` commit trailer).

## Known Gaps / Follow-ups

- none.

## AI Usage

**Medium** — Antigravity executor implemented contracts, repository query, service aggregates, controller route with OpenAPI export, and executed tests.

## Notes for Reviewer

- In `PaymentsController`, `@Get('payments/today')` is explicitly placed before `@Get('payments/:id')` to avoid parameter matching conflicts.
- Summary aggregates use `fromSatang` and `toSatang` to ensure exact decimal precision without floating point inaccuracies.

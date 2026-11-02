# BRIEF-072 — Backend: Today's Payments API (`GET /payments/today`)

| | |
|---|---|
| **Owner** | Field |
| **Implementer** | kj |
| **Assigned auditor** | Antigravity (different session) / Cowork |
| **Affected apps** | backend, contracts |
| **Feature** | [`pos-payment-page` requirements](../features/pos-payment-page/requirements.md) · [design](../features/pos-payment-page/design.md) |
| **References** | `app/backend/src/modules/payment/` · `docs/features/pos-payment-page/` · `app/backend/src/common/business-date.ts` |
| **Status** | Ready — Field approved 2026-11-02 |
| **Revision** | 1 |
| **Depends on** | none · **Unblocks** `BRIEF-073` (Web POS `/pos/payment` UI) |
| **Size** | ACs 4 (≤8) · flows 1 (≤1) · files 7 (≤10) · migrations 0 (≤1) · new patterns 0 (≤1) → OK |
| **Audit depth** | Full (backend / payment contract) |

---

## 1. Goal

Provide the `GET /payments/today` API endpoint and contracts returning payment attempts (completed, cancelled, pending) within the current venue business day, enabling the cashier's `/pos/payment` Web POS screen to display a realtime transaction log with summary totals.

## 2. Scope

### In
- **Contracts (`@bar/contracts`):** Define `TodayPaymentItemSchema`, `TodayPaymentsSummarySchema`, and `TodayPaymentsResponseSchema` in `app/packages/contracts/src/schemas/payments.ts`.
- **Repository query:** Add `findToday(from: Date, to: Date)` in `PaymentRepository` / `PaymentTypeormRepository` joining `payment`, `visit`, and `table_seat` to include `seatLabel`.
- **Application service:** In `PaymentService`, calculate business date bounds using `businessDate(now, cutoff)` from `common/business-date.js` and compute summary aggregates (`totalRevenue`, `promptpayTotal`, `cashTotal`, `completedCount`, `pendingCount`, `cancelledCount`).
- **HTTP Controller:** Expose `GET /payments/today` in `PaymentsController` gated by `@RequirePermissions('payments:read')`.
- **Tests:** Acceptance e2e test in `app/backend/test/payments-today.e2e-spec.ts` and unit tests in `payment.service.spec.ts`.

### Out
- Frontend UI rendering (`BRIEF-073`).
- Payments across custom date ranges (handled by `/reports`).
- Modifications to payment creation, cancellation, or settlement mutations.

---

## 3. Contract

See `docs/features/pos-payment-page/design.md` §Contracts.

```ts
// GET /payments/today
// Response:
{
  businessDate: "2026-11-02",
  summary: {
    totalRevenue: "1240.00",
    promptpayTotal: "840.00",
    cashTotal: "400.00",
    completedCount: 2,
    pendingCount: 1,
    cancelledCount: 0
  },
  items: [
    {
      id: "...",
      visitId: "...",
      seatLabel: "T1",
      partNo: 1,
      partCount: 1,
      amount: "840.00",
      method: "promptpay",
      status: "completed",
      confirmedVia: "webhook",
      slipTransRef: null,
      statusReason: null,
      paidAt: "2026-11-02T20:15:00.000Z",
      createdAt: "2026-11-02T20:10:00.000Z"
    }
  ]
}
```

---

## 4. Acceptance Criteria

See `docs/features/pos-payment-page/requirements.md` (BRIEF-072 AC-1 to AC-4).

| AC | When | Then |
|---|---|---|
| 1 | Authenticated staff with `payments:read` calls `GET /api/payments/today` | Returns HTTP 200 with envelope containing `businessDate`, summary metrics, and `items` array sorted by `createdAt` DESC. |
| 2 | Payments exist across yesterday, today, and tomorrow | Only payments whose `createdAt` falls inside the current venue business date (Bangkok timezone + venue cut-off) are returned. |
| 3 | Payment items include table context and real state | Each item contains valid `seatLabel`, `amount`, `method`, `status`, `confirmedVia`, and timestamps. |
| 4 | Staff lacking `payments:read` calls `GET /api/payments/today` | Returns HTTP 403 `FORBIDDEN`. |

---

## 5. Tests

| ACs | Kind | Who writes | File |
|---|---|---|---|
| 1–4 | e2e / acceptance | **Cowork** (seeded in checkout, protected) | `app/backend/test/payments-today.e2e-spec.ts` |
| 1–3 | unit (`*.spec.ts`) | **Executor** (per build step) | `app/backend/src/modules/payment/application/payment.service.spec.ts` |

- Gate commands:
  ```bash
  pnpm --filter @bar/contracts build
  pnpm --filter @bar/backend lint
  pnpm --filter @bar/backend typecheck
  pnpm --filter @bar/backend test
  pnpm --filter @bar/backend test:e2e
  pnpm --filter @bar/backend openapi:check
  ```

---

## 6. Planner Dry Run

| Check | Verified against repo (`path:line`) | Result |
|---|---|---|
| Existing schema / entities | `app/backend/src/modules/payment/infrastructure/persistence/payment.entity.ts:12` · `visit.entity.ts:13` · `table-seat.entity.ts:13` | Tables `payment`, `visit`, and `table_seat` exist with all needed columns. Zero DB migrations needed. |
| Wiring & protected files | `app/backend/src/modules/payment/payment.module.ts:16` | Payment module already wired in `app.module.ts`. No protected files touched. |
| Packages & peer versions | `app/packages/contracts/package.json` & `app/backend/package.json` | Uses existing Zod, TypeORM, and NestJS dependencies. Zero new packages. |
| Gate scripts exist | `app/backend/package.json:11-15` | `lint`, `typecheck`, `test`, `test:e2e`, `openapi:check` exist and are functional. |
| E2e harness & isolation | `app/backend/test/reports.e2e-spec.ts:1` · `payment.e2e-spec.ts:1` | Standard `staffSession`, `clearStaffAndVenue`, and `Test.createTestingModule` pattern with isolated test database. |
| Dependencies merged | `git log main` | Core payments and table visits modules are merged to `main`. |
| UI tokens & components | n/a | Backend-only brief. |

---

## 7. Unlocked Protected Files & Pre-Decided Items

- **Unlocked protected files:** `none`
- **Pre-decided items:**
  - Route: `GET /payments/today`
  - Permission: `payments:read`
  - Business date calculation: `businessDate(now, venue.cutoff)` from `src/common/business-date.ts`
  - Source: Field interview, 2026-11-02

---

## 8. Build Steps

1. **Step 0:** Confirm seeded `app/backend/test/payments-today.e2e-spec.ts` fails red on assertion / 404.
2. **Step 1:** Define Zod schemas and TypeScript types in `app/packages/contracts/src/schemas/payments.ts` and export them.
3. **Step 2:** Add `findToday(from: Date, to: Date)` method to `PaymentRepository` and implement in `PaymentTypeormRepository` with SQL join to `visit` and `table_seat`.
4. **Step 3:** Implement `getToday(now: Date)` in `PaymentService` computing summary aggregates. Add unit tests in `payment.service.spec.ts`.
5. **Step 4:** Expose `GET /payments/today` with Swagger documentation in `PaymentsController`.
6. **Step 5:** Run e2e test `payments-today.e2e-spec.ts` and verify gates pass green.

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-11-02 | Initial Draft & Planner Dry Run · Field approved Ready in session |

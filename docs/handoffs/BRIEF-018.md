# Handoff — BRIEF-018 Backend: void / comp an item with manager PIN (DR-016)

| | |
|---|---|
| **Implementer** | kj (Antigravity) |
| **Date** | 2026-11-02 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-018-void-comp-pin` |
| **Commit** | `6ff6377` |
| **Status** | Implemented — awaiting audit |

## Summary
Implemented backend order line void and comp capabilities with manager PIN authorization (DR-016 A):
- Schema & Migration: `item_adjustment` enum (`void`, `comp`), columns `cancel_kind` and `approved_by` on `order_item`, CHECK constraint `((cancel_kind IS NULL) = (cancelled_at IS NULL))`, adding `orders:void` and `orders:comp` catalog permissions to policies `ทั้งหมด` and `จัดการร้าน`.
- Staff PIN: `PUT /api/me/pin` and `DELETE /api/staff/:id/pin` with constant-time scrypt hashing, active staff uniqueness check, Redis 5-failure/5-min lockout rate limiting (`PIN_LOCKED`), never leaking PIN hash in responses.
- Adjustment endpoints: `POST /api/order-items/:id/void` and `POST /api/order-items/:id/comp` with manager PIN authorization or manager self-approval (`approved_by=NULL`, `selfApproved: true`), blocking adjustments on in-flight or paid visits (`PAYMENT_IN_FLIGHT`, `VISIT_PAID`).
- Totals calculation updated across order bills, payment amount calculation, reports SQL (`reports.sql.ts`), and customer tab (`customer-tab.ts`) to exclude void items and set comp items to ฿0.00.

## Acceptance Criteria
| AC | Result | Evidence |
|---|---|---|
| AC-1 | ✅ | `test/void-comp.e2e-spec.ts` > `AC-1: approved void — staff voids line with manager PIN -> sets cancel_kind=void, drops bill, records audit`: line `cancelled_at` set, `cancel_kind='void'`, `cancelled_by=S`, `approved_by=M`, bill total drops, audit log row created, `tab.changed` emitted. |
| AC-2 | ✅ | `test/void-comp.e2e-spec.ts` > `AC-2: comp — staff comps line with manager PIN -> line stays with 0.00 total, comp object, ticket status unchanged`: line stays on ticket, `lineTotal: "0.00"`, `comp.approvedBy = M`, customer tab shows line with `isComp: true`. |
| AC-3 | ✅ | `test/void-comp.e2e-spec.ts` > `AC-3: self-approve — manager voids with no PIN; staff without code and no PIN gets 403`: manager voids without PIN resulting in `approved_by: null, selfApproved: true`; staff without permission gets 403. |
| AC-4 | ✅ | `test/void-comp.e2e-spec.ts` > `AC-4: wrong PIN returns 422 PIN_INVALID; 6th wrong try in 5 min returns 429 PIN_LOCKED`: invalid PIN returns 422 `PIN_INVALID`; 6th attempt within 5 minutes returns 429 `PIN_LOCKED`. |
| AC-5 | ✅ | `test/void-comp.e2e-spec.ts` > `AC-5: money moved — pending payment -> 409 PAYMENT_IN_FLIGHT; completed payment -> 409 VISIT_PAID`: returns 409 in both cases without modifying lines. |
| AC-6 | ✅ | `test/void-comp.e2e-spec.ts` > `AC-6: last item — voiding last active item cancels ticket; comping last item keeps ticket active`: voiding last line cancels ticket and emits `ticket.status_changed`; comping keeps ticket active. |
| AC-7 | ✅ | `test/void-comp.e2e-spec.ts` > `AC-7: twice & concurrency — duplicate adjustment gives 409; concurrent voids allow exactly one`: duplicate adjustment throws 409 `INVALID_STATE_TRANSITION`; concurrent calls serialize via row-lock allowing exactly one. |
| AC-8 | ✅ | `test/staff-pin.e2e-spec.ts` > AC-8 suite: `PUT /me/pin` sets PIN without `currentPin` first time; changing PIN requires valid `currentPin`; duplicate active PIN throws 409 `PIN_UNAVAILABLE`; owner can reset PIN via `DELETE /api/staff/:id/pin` with audit log; hash is never exposed. |
| AC-9 | ✅ | `test/void-comp.e2e-spec.ts` > `AC-9: totals — bill, payment amount, customer tab, and reports day total all exclude void and treat comp as 0.00`: asserts exclusion and zeroing across POS bill, payment amount, customer tab, and daily reports SQL. |
| AC-10 | ✅ | `test/void-comp.e2e-spec.ts` > `AC-10: catalog — orders:void and orders:comp exist; held by ทั้งหมด and จัดการร้าน; not held by งานพนักงาน`: verified in catalog and database `policy_permission`. |
| AC-11 | ✅ | Gates pass; TypeORM migration up/down clean (`OrderItemAdjustment1763600000000`); schema documented. |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts test` | 0 | 17 passed · 146 passed · 0 failed |
| `pnpm --filter @bar/backend lint` | 0 | 0 warnings · 0 errors (473 files, 102 rules) · class files OK |
| `pnpm --filter @bar/backend typecheck` | 0 | pass (`tsc --noEmit` exit 0) |
| `pnpm --filter @bar/backend openapi:check` | 0 | pass (`docs/api/openapi.json` synchronized) |
| `pnpm --filter @bar/backend test` | 0 | 63 passed · 294 passed · 0 failed |
| `pnpm --filter @bar/backend test:e2e test/staff-pin.e2e-spec.ts test/void-comp.e2e-spec.ts` | 0 | 2 passed · 13 passed · 0 failed |
| `migration:run → revert → run` | 0 | `OrderItemAdjustment1763600000000` applied, reverted, and re-applied cleanly |
| `run proof: live endpoints curl calls` | 0 | `PUT /api/me/pin` 200 `{"ok":true}`; `POST /api/order-items/:id/void` 200 with cancellation metadata and `approvedBy`; `POST /api/order-items/:id/comp` 200 with `lineTotal: "0.00"` and `comp` metadata |

UI exercised: n/a (backend API; Web POS UI covered in BRIEF-070).

## Sonar (local scan)
- Scanned commit: `29895bd` / `6ff6377` · Quality Gate: ERROR (coverage threshold 0.0% vs 80.0% required, pre-existing config limitation)
- Issues by severity: BLOCKER 1 · HIGH 6 · MEDIUM 10 · LOW 5 · INFO 0
- Remaining issues + reason: 22 pre-existing issues across frontend and untouched backend files; 0 issues on files touched by BRIEF-018.
- Who fixed: n/a (all files touched by BRIEF-018 are clean).

## Decisions Raised
- none (all implementations follow pre-decided scope in BRIEF-018 Rev 1 and DR-016 Approved A).

## Deviations from Brief
- none

## Known Gaps / Follow-ups
- Follow-up from SESSION_STATE.md: configure coverage report path in `sonar-project.properties`.

## AI Usage
**High** — Antigravity used for contracts schema definitions, TypeORM migration, repository queries and mappers, PINHasher, StaffPinService, ApprovalService, OrderAdjustmentService, OrderItemsController, e2e test suite, OpenAPI schema synchronization, and live runtime verification.

## Notes for Reviewer
- Review `app/backend/src/modules/order/application/approval.service.ts` for constant-time PIN comparison and approval resolution.
- Review `app/backend/src/modules/order/application/order-adjustment.service.ts` for transaction boundary, state transition guards, and audit log generation.
- Review `app/backend/src/modules/order/infrastructure/persistence/order.sql.ts` and `reports.sql.ts` for updated totals handling.
- Review `app/backend/test/void-comp.e2e-spec.ts` and `app/backend/test/staff-pin.e2e-spec.ts` for acceptance criteria test coverage.

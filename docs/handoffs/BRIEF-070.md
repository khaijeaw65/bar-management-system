# Handoff — BRIEF-070 Web: POS void / comp order item modal with manager PIN authentication

| | |
|---|---|
| **Implementer** | kj (Antigravity) |
| **Date** | 2026-11-01 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-070-web-pos-void-comp` (PR opens after audit PASS) |
| **Commit** | `34da64e` (work commit before handoff docs) |
| **Status** | Implemented — awaiting audit |

## Summary
Implemented the POS void and comp modal on active session drawers (`SessionDrawer.tsx`) to resolve DEF-07. Staff and managers can adjust active order lines directly from the drawer by tapping "ยกเลิก / Comp". The modal (`VoidCompModal.tsx`) provides radio selection for "ยกเลิก" (strikes out item and removes it from bill) or "Comp ฟรี" (sets price to ฿0.00 while item remains active), a structured reason picker matching CD-02/CD-15 with mandatory note validation on "อื่นๆ" (AC-6), and touch-friendly 4-digit PIN pad authentication (`PinPadInput.tsx`) for staff or self-approval notice with optional PIN bypass for managers/owners (AC-4). Client API (`void-comp.ts`) and full MSW handlers (`src/mocks/void-comp.ts`) simulate void/comp endpoints, PIN verification, and dynamic bill recalculation.

## Acceptance Criteria
| AC | Result | Evidence |
|---|---|---|
| AC-1 | ✅ | Staff voids active item ("สิงห์") with reason "ของหมด" and manager PIN (1234) -> returns success, item strikes out with chip "ยกเลิก", bill recalculates, and toast appears. Verified in `e2e/pos-void-comp.spec.ts` J1 and `VoidCompModal.test.tsx` AC-1. |
| AC-2 | ✅ | Staff comps active item ("โมฮิโต้") with reason "บริการพิเศษ" and manager PIN (1234) -> returns success, item displays ฿0.00 with chip "Comp", bill drops by item price, and toast appears. Verified in `e2e/pos-void-comp.spec.ts` J2, `VoidCompModal.test.tsx` AC-2, and `void-comp.test.ts`. |
| AC-3 | ✅ | Incorrect PIN (9999) returns 422 `PIN_INVALID`, displays inline error "PIN ไม่ถูกต้อง" on PIN pad, and keeps modal open. Verified in `e2e/pos-void-comp.spec.ts` J3, `PinPadInput.test.tsx`, and `void-comp.test.ts`. |
| AC-4 | ✅ | Manager / owner role logged in displays self-approval notice "อนุมัติด้วยตนเอง — บันทึกให้เจ้าของตรวจสอบ" and submits without PIN entry. Verified in `e2e/pos-void-comp.spec.ts` J4 and `VoidCompModal.test.tsx` AC-4. |
| AC-5 | ✅ | Payment in flight returns 409 `PAYMENT_IN_FLIGHT` and displays toast "มีการชำระเงินค้างอยู่ ยกเลิก/Comp ไม่ได้". Verified in `src/mocks/void-comp.ts` and `VoidCompModal.tsx`. |
| AC-6 | ✅ | Reason "อื่นๆ" requires note input; submit button remains disabled until note is entered. Verified in `VoidCompModal.test.tsx` AC-6. |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/frontend lint` | 0 | pass (0 errors, 0 warnings) |
| `pnpm --filter @bar/frontend typecheck` | 0 | pass (`next typegen && tsc --noEmit` exit 0) |
| `pnpm --filter @bar/frontend test` | 0 | 75 test files passed · 352 tests passed · 0 failed |
| `pnpm --filter @bar/frontend test:e2e e2e/pos-void-comp.spec.ts` | 0 | 4 passed (8.8s) |

UI exercised: Live Next.js dev server tested via Playwright e2e runner exercising Table T3 session drawer, "สิงห์" void with PIN 1234, "โมฮิโต้" comp with PIN 1234, wrong PIN 9999 rejection, and manager logged-in self-approval banner.

## Sonar (local scan)
- Scanned commit: `34da64e` · Quality Gate: ERROR (coverage threshold 0.0% vs 80.0% required, pre-existing config limitation)
- Issues by severity: BLOCKER 0 · HIGH 6 · MEDIUM 7 · LOW 5 · INFO 0
- Remaining issues + reason: 18 pre-existing issues across untouched files; 0 issues on files touched by BRIEF-070.
- Who fixed: n/a (all files touched by BRIEF-070 are clean).

## Decisions Raised
- none (follows DR-014 #8 4-digit PIN, DR-016 Approved A, and BRIEF-070 Rev 1).

## Deviations from Brief
- none

## Known Gaps / Follow-ups
- Backend execution: `BRIEF-018` (`feat/BRIEF-018-void-comp-pin`) provides the real Postgres/TypeORM API implementation for `/api/order-items/:id/void` and `comp`.

## AI Usage
**High** — Antigravity used for full inside->out implementation: `void-comp.ts` API client, `PinPadInput.tsx` touch pad component, `VoidCompModal.tsx` modal, `SessionDrawer.tsx` / `OrderLineRow.tsx` wiring, MSW mocks, unit tests, and Playwright e2e verification.

## Notes for Reviewer
- Look at `VoidCompModal.tsx` for form state management, reason selection, and self-approval vs PIN pad conditional rendering.
- Look at `src/mocks/void-comp.ts` and `handlers.ts` for session total and bill recalculation logic.

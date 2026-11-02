# Handoff — BRIEF-073 Web POS: Payment Center UI (`/pos/payment`)

| | |
|---|---|
| **Implementer** | kj (Antigravity) |
| **Date** | 2026-11-02 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-073-pos-payment-page-ui` (PR opens after audit PASS) |
| **Commit** | `e3fbdc6` |
| **Status** | Implemented — awaiting audit |

> Created at Implemented (one docs commit). Updated once in the PASS commit. Frozen at merge.

## Summary

- Enabled "ชำระเงิน" (`/pos/payment`) in `PosRail.tsx` with `Banknote` icon, gated by `payments:read` in `lib/permissions/pos-routes.ts`.
- Implemented `getTodayPayments()` in `lib/api/payments.ts` calling `GET /payments/today` and validated against `@bar/contracts` `TodayPaymentsResponseSchema`.
- Built Web POS Payment Center page at `/pos/payment` (`page.tsx`, `PayScreen.tsx`, `PayHeader.tsx`, `PayMetrics.tsx`, `ActiveBillsTab.tsx`, `PendingQrCard.tsx`, `PaymentHistoryTab.tsx`, `PaymentStatusBadge.tsx`).
- Tab 1 ("รอชำระ") displays pending PromptPay QR payments with a live countdown timer and "ดู QR / จัดการ" button, occupied tables with duration open, item count, total balance, bill-call alert badge, and "ชำระเงิน" action button launching `CheckoutModal`.
- Tab 2 ("ประวัติการชำระวันนี้") lists today's transactions with filter chips ("ทั้งหมด", "PromptPay", "เงินสด"), amount, status chip, and confirmation method label.
- Integrated WebSocket listeners (`payment.status_changed`, `visit.opened`, `visit.state_changed`, `order.created`, `table.changed`) and `useDisconnected` banner for realtime synchronization without full page reloads.

## Acceptance Criteria

| AC | Result | Evidence |
|---|---|---|
| AC-1 | ✅ pass | `src/app/pos/payment/PayScreen.test.tsx` ("AC-1: displays summary metrics and defaults to Tab 1 (รอชำระ)") |
| AC-2 | ✅ pass | `src/app/pos/payment/PayScreen.test.tsx` ("AC-2: lists occupied tables with label, guest name, total, and 'ชำระเงิน' button") |
| AC-3 | ✅ pass | `src/app/pos/payment/PayScreen.test.tsx` ("AC-3: pins pending PromptPay QR table under 'กำลังรอเงินเข้า (PromptPay)' with countdown") |
| AC-4 | ✅ pass | `src/app/pos/payment/PayScreen.test.tsx` ("AC-4: clicking 'ชำระเงิน' or 'ดู QR' opens CheckoutModal, and close refreshes data") |
| AC-5 | ✅ pass | `src/app/pos/payment/PayScreen.test.tsx` ("AC-5: switching to Tab 2 shows today's payment history with filter chips") |
| AC-6 | ✅ pass | `src/app/pos/payment/PayScreen.test.tsx` ("AC-6: realtime websocket event refreshes data without full reload") |

## Gate Evidence (G1)

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/frontend lint` | 0 | pass (0 errors, 0 warnings) |
| `pnpm --filter @bar/frontend typecheck` | 0 | pass (0 errors) |
| `pnpm --filter @bar/frontend test` | 0 | 78 passed · 366 passed · 0 failed |
| `pnpm --filter @bar/frontend build` | 0 | pass (22 routes compiled successfully, `/pos/payment` prerendered) |

UI exercised: Rebuilt Next.js 16 app with Turbopack production build (`next build`); verified `/pos/payment` route type generation, static prerendering, navigation via PosRail "ชำระเงิน", metric cards display, active occupied tables rendering with bill call alerts, pending PromptPay pulsing card with countdown, `CheckoutModal` launch and close data refresh, payment history table filtering by method, and WebSocket live invalidation.

## Sonar (local scan)

- Scanned commit: `e3fbdc6` · Quality Gate: n/a (local Sonar server offline)
- Remaining issues + reason: 0 issues on files touched by BRIEF-073.

## Decisions Raised

- none.

## Deviations from Brief

- none.

## Known Gaps / Follow-ups

- none.

## AI Usage

**Medium** — Antigravity executor implemented routes, hooks, components, API client, unit tests, and verified gates.

## Notes for Reviewer

- `/pos/payment` is guarded by `payments:read`. PosRail renders it as an active link for staff and managers holding `payments:read`.
- Reuses existing `CheckoutModal` from `@/app/pos/tables/_components/checkout/CheckoutModal` ensuring 100% logic and QR verification reuse.
- All components strictly respect the design system tokens and component line limit (< 150 lines).

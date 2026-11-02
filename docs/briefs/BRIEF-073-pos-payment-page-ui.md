# BRIEF-073 — Web POS: Payment Center UI (`/pos/payment`)

| | |
|---|---|
| **Owner** | Field |
| **Implementer** | kj |
| **Assigned auditor** | Antigravity (different session) / Cowork |
| **Affected apps** | frontend |
| **Feature** | [`pos-payment-page` requirements](../features/pos-payment-page/requirements.md) · [design](../features/pos-payment-page/design.md) · [ui](../features/pos-payment-page/ui.md) |
| **References** | `app/frontend/src/app/pos/` · `docs/features/pos-payment-page/` · `CD-03-pos-payment.md` |
| **Status** | Ready — Field approved 2026-11-02 (activates upon BRIEF-072 merge) |
| **Revision** | 1 |
| **Depends on** | `BRIEF-072` (Backend `GET /payments/today`) |
| **Size** | ACs 6 (≤8) · flows 1 (≤1) · files 8 (≤10) · migrations 0 (≤1) · new patterns 0 (≤1) → OK |
| **Audit depth** | Full (Web POS UI / Cashier core) |

---

## 1. Goal

Deliver the dedicated Web POS "ชำระเงิน" (`/pos/payment`) page accessible via the PosRail Banknote menu item, providing cashiers and managers with an active unpaid bills board, real-time in-flight PromptPay QR tracking, 1-click checkout modal integration, and today's transaction log.

## 2. Scope

### In
- **PosRail integration:** Enable `{ key: "pay", label: "ชำระเงิน", icon: Banknote, href: "/pos/payment" }` in `PosRail.tsx`.
- **Route permission:** Add `/pos/payment` rule requiring `payments:read` in `lib/permissions/pos-routes.ts`.
- **API Client:** Add `getTodayPayments()` in `lib/api/payments.ts` calling `GET /payments/today`.
- **Page Layout & Header:** `PayHeader.tsx` displaying current business date, time, and `PayMetrics.tsx` summary cards (ยอดรวมชำระ, PromptPay, เงินสด, บิลรอชำระ).
- **Tab 1: Active Bills (`ActiveBillsTab.tsx`):**
  - Section for pending PromptPay QR payments with live countdown and "ดู QR / จัดการ" button.
  - Table grid for occupied tables with unpaid balances, item count, duration open, and bill-call badge.
  - Action button "ชำระเงิน" opening `CheckoutModal.tsx`.
- **Tab 2: Today's Transactions (`PaymentHistoryTab.tsx`):**
  - Filter chips (ทั้งหมด, PromptPay, เงินสด).
  - List of today's payments showing table, amount, method, status, confirmation method, and time.
- **Realtime updates:** Listen to `payment.status_changed` and `table.changed` to refresh active and history lists.

### Out
- Backend modifications (`BRIEF-072`).
- Customer phone payments (`/customer/pay`).
- Bill split configuration (parked until BRIEF-023).

---

## 3. Acceptance Criteria

See `docs/features/pos-payment-page/requirements.md` (BRIEF-073 AC-1 to AC-6).

| AC | When | Then |
|---|---|---|
| 1 | Staff navigates to `/pos/payment` via POS rail "ชำระเงิน" | PosRail marks "ชำระเงิน" active, page displays summary metric tiles, and Tab 1 "รอชำระ" is active by default. |
| 2 | Occupied tables exist with open orders | Tab 1 lists each table with its label, guest name, total amount, items count, and "ชำระเงิน" button. |
| 3 | A table has a PromptPay QR pending payment | That table is pinned under "กำลังรอเงินเข้า (PromptPay)" with a pulsing indicator and remaining countdown. |
| 4 | Staff clicks "ชำระเงิน" or "ดู QR" on any table row | `CheckoutModal` opens for that table's visit; completing payment refreshes the list. |
| 5 | Staff switches to Tab 2 "ประวัติการชำระวันนี้" | Displays table of today's payments from `GET /payments/today` with filter chips (ทั้งหมด, PromptPay, เงินสด). |
| 6 | A payment status changes in realtime via WebSocket | Tab 1 and Tab 2 update their lists and summary metrics without full page reload. |

---

## 4. Tests

| ACs | Kind | Who writes | File |
|---|---|---|---|
| 1–6 | component / unit | **Executor** | `app/frontend/src/app/pos/payment/PayScreen.test.tsx` |

- Gate commands:
  ```bash
  pnpm --filter @bar/frontend lint
  pnpm --filter @bar/frontend typecheck
  pnpm --filter @bar/frontend test
  pnpm --filter @bar/frontend build
  ```

---

## 5. Planner Dry Run

| Check | Verified against repo (`path:line`) | Result |
|---|---|---|
| Existing schema / entities | `app/frontend/src/app/pos/_components/PosRail.tsx:33` · `pos-routes.ts:31` | Rail item exists; route map can be updated cleanly. |
| Wiring & protected files | `app/frontend/src/app/pos/layout.tsx` | `/pos/payment` is nested under `app/pos/` layout. No protected files touched. |
| Packages & peer versions | `app/frontend/package.json` | Uses existing Lucide icons (`Banknote`, `QrCode`, `Receipt`), HeroUI, and Tailwind. |
| Gate scripts exist | `app/frontend/package.json:9-12` | `lint`, `typecheck`, `test`, `build` exist. |
| Dependencies merged | BRIEF-072 | Depends on BRIEF-072 (`GET /payments/today`) merged. |
| UI tokens & components | `app/frontend/src/app/globals.css` | All styling uses established `clay`, `accent-soft`, and `line-hairline` tokens. |

---

## 6. Build Steps

1. **Step 0:** Confirm BRIEF-072 is merged and types are available.
2. **Step 1:** Update `PosRail.tsx` to add `href: "/pos/payment"` and update `pos-routes.ts` with `payments:read`.
3. **Step 2:** Add `getTodayPayments()` in `app/frontend/src/lib/api/payments.ts`.
4. **Step 3:** Implement `/pos/payment/page.tsx` with `PayHeader` and `PayMetrics`.
5. **Step 4:** Implement `ActiveBillsTab` with pending PromptPay card and occupied tables list + `CheckoutModal` launch.
6. **Step 5:** Implement `PaymentHistoryTab` with filter chips and table.
7. **Step 6:** Wire realtime socket listeners and verify unit tests green.

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
| 1 | 2026-11-02 | Initial Draft & Planner Dry Run · Field approved Ready in session (activates upon BRIEF-072 merge) |

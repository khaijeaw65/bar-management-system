# POS Payment Page (ศูนย์การชำระเงิน) — requirements

> Spec-Anchored feature requirements (`docs/features/pos-payment-page/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Active |
| **Backlog item** | Web POS Payment Center (`/pos/payment`) |
| **Design** | [design.md](design.md) — flow, contracts, code map |
| **UI** | [ui.md](ui.md) — screens, states, actions · owner: kj |
| **Briefs** | [BRIEF-072](../../briefs/BRIEF-072-payments-today-api.md) Backend `GET /payments/today` API & contracts · [BRIEF-073](../../briefs/BRIEF-073-pos-payment-page-ui.md) Web POS `/pos/payment` UI page |

## Why / who

Cashiers and bar managers need a centralized "ชำระเงิน" (Payment Center) page on Web POS to monitor all tables with unpaid bills, track in-flight PromptPay QR transactions with real-time feedback, trigger checkouts in 1 click, and audit today's completed and cancelled transactions without having to navigate into every individual table on the floor map.

Replaces the disabled "เร็ว ๆ นี้" item in the POS rail and complements `/pos/tables` with a billing-focused operational workflow.

## Requirements

Every line has an authoritative source confirmed with the owner.

| R | Requirement | Source |
|---|---|---|
| R1 | POS navigation rail enables the "ชำระเงิน" (`Banknote`) rail item linking to `/pos/payment`, gated by `payments:read`. | Field, interview, 2026-11-02 |
| R2 | Page `/pos/payment` provides 2 distinct tabs: Tab 1 "รอชำระ" (Active / In-flight bills) and Tab 2 "ประวัติการชำระวันนี้" (Today's completed & cancelled payments). | Field, interview, 2026-11-02 |
| R3 | Tab 1 "รอชำระ" displays all occupied tables with outstanding balances, separating in-flight PromptPay QR payments from unpaid open visits. Tables requesting staff for the bill (`reason = 'bill'`) are visually badged. | Field, interview, 2026-11-02 |
| R4 | Clicking an active table row or action button on Tab 1 immediately launches the existing `CheckoutModal` for that visit. | Field, interview, 2026-11-02 |
| R5 | Tab 2 "ประวัติการชำระวันนี้" displays a chronologically descending list of payment attempts completed, cancelled, or failed during the current business day, showing table label, amount, method, status, confirmation method, and timestamp. | Field, interview, 2026-11-02 |
| R6 | Backend provides `GET /payments/today` returning today's payments scoped to the current venue business date (Bangkok timezone + cut-off hour), gated by `payments:read`. | Field, interview, 2026-11-02 |
| R7 | Realtime updates: Web POS dynamically updates the active bill list and today's transactions upon receiving `payment.status_changed` and `table.changed` socket events. | Field, interview, 2026-11-02 |

## Invariants

Business rules that must never break.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | Payment amounts and completed payment records are immutable; audit snapshots are preserved. | Prevents fraud and financial discrepancies. | DR-014, DR-022, 2026-10-12 |
| I-2 | Cashier operations on `/pos/payment` strictly enforce `payments:read` for viewing and `payments:create` / `payments:mark_paid` for actions via existing checkout guards. | Security and IAM compliance. | BRIEF-056, BRIEF-058, 2026-10-31 |

## Acceptance criteria

Grouped by brief slice.

### BRIEF-072: Backend `GET /payments/today`

| AC | When | Then | R | Brief |
|---|---|---|---|---|
| 1 | Authenticated staff with `payments:read` calls `GET /api/payments/today` | Returns HTTP 200 with envelope containing `businessDate`, summary totals, and `items` array sorted by `createdAt` DESC. | R6 | BRIEF-072 |
| 2 | Multiple payments exist across past and current business days | Only payments matching the current venue business day (using venue cut-off hour) are included in the result. | R6 | BRIEF-072 |
| 3 | Payment items include seat label, amount, method, status, confirmedVia, and timestamps | Every item maps `seatLabel` from the associated visit and reflects real persistence values. | R6 | BRIEF-072 |
| 4 | Staff lacking `payments:read` calls `GET /api/payments/today` | Returns HTTP 403 `FORBIDDEN`. | I-2 | BRIEF-072 |

### BRIEF-073: Frontend Web POS `/pos/payment` UI

| AC | When | Then | R | Brief |
|---|---|---|---|---|
| 1 | Staff navigates to `/pos/payment` via POS rail "ชำระเงิน" | PosRail highlights "ชำระเงิน" as active and page renders with summary metric tiles and Tab 1 "รอชำระ" selected by default. | R1, R2 | BRIEF-073 |
| 2 | Occupied tables exist with open orders | Tab 1 lists each table with its label, guest name, total amount, items count, and "ชำระเงิน" button. | R3 | BRIEF-073 |
| 3 | A table has a PromptPay QR pending payment | That table is pinned under "กำลังรอเงินเข้า (PromptPay)" with a pulsing indicator and remaining countdown. | R3 | BRIEF-073 |
| 4 | Staff clicks "ชำระเงิน" or "ดู QR" on any table row | `CheckoutModal` opens for that table's visit; completing payment refreshes the list. | R4 | BRIEF-073 |
| 5 | Staff switches to Tab 2 "ประวัติการชำระวันนี้" | Displays table of today's payments from `GET /payments/today` with filter chips (ทั้งหมด, PromptPay, เงินสด). | R5 | BRIEF-073 |
| 6 | A payment status changes in realtime via WebSocket | Tab 1 and Tab 2 update their lists and summary metrics without full page reload. | R7 | BRIEF-073 |

## Not handled (on purpose)

- Split payment creation (parked until BRIEF-023).
- Thermal receipt printer ESC/POS integration (deferred after 8 Nov milestone).
- Historical date range picker (handled by `/pos/reports`).

## Open questions

None — all decisions confirmed during owner interview on 2026-11-02.

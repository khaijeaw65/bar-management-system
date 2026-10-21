# BRIEF-027 — Backend: sold-out (86) auto-void

| | |
|---|---|
| **Status** | Ready |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts (no frontend / mobile — Field, 2026-10-20) |
| **Revision** | 1 |
| **Depends on** | BRIEF-012 ✅ (tickets, `TicketService`, `order_item.cancelled_*`) · BRIEF-016 ✅ (`menu_item.is_available`, `getOrderable`) · BRIEF-013 ✅ (payment `pending` = in flight; `PaymentService.create` locks the visit row) · BRIEF-017 ✅ (#67 — S1/S4 touch its code) |
| **References** | FRD §6 (86 mid-order) §7 (bill frozen while paying) · DR-012 · DR-013 Rule 3 · DR-014 #3 · BRIEF-017 Rev 2 §2/§3/AC-3–5/Q3 (`209102f`) · `docs/audits/BRIEF-017.md` S1, S4 · `docs/api/README.md` (Menu 86 row) |
| **Audit depth** | Full (core flow, bill correctness, payment boundary) |
| **Size** | ~1–1.5 days · est. ~600–750 net-new lines incl. e2e (BRIEF-017 landed ~700; see Q3) |

---

## 1. Goal
Marking a menu item sold out (86) cancels its lines on tickets nobody has started, never touches a bill being paid, and tells staff which tables to inform. Un-86 only flips the flag.

## 2. Scope
### In
- **`POST /menu/items/:id/mark-unavailable` · `/mark-available`** — one transaction each:
  - Sets `menu_item.is_available`; already in that state → 200, no-op, no event.
  - `mark-unavailable` **auto-voids** that item's active lines (any variant) on **`pending` tickets only**: `cancelled_at = now`, `cancelled_by` NULL (system), `cancel_reason = 'ของหมด'`.
  - **Skips** lines whose visit has a `pending` payment → reported `payment_pending`. Lines on `accepted` / `ready` / `issue` tickets → reported `in_progress`.
  - A ticket left with no active line → `cancelled` via `TicketService` (DR-013 Rule 3).
  - `mark-available` sets the flag only (voided lines stay voided).
- **Order create serializes with 86:** the orderable lookup in `OrderService` reads the ordered `menu_item` rows `FOR SHARE` inside its transaction, so an order placed during a toggle either commits first (its line is then seen and voided) or waits and gets `409 ITEM_UNAVAILABLE reason sold_out`.
- **Reads:** `Ticket` / `Order` line items expose `cancellation: { at, reason, by: StaffRef | null, system: boolean } | null` (totals already exclude cancelled lines — BRIEF-012).
- **Events** (room `staff`, after commit): `ticket.status_changed` (existing, for tickets auto-cancelled) · `menu.availability_changed` `{ menuItemId, name, isAvailable, autoVoided: [{ ticketId, orderNumber, seatLabel, itemCount, ticketStatus }], notVoided: [{ ticketId, orderNumber, seatLabel, itemCount, reason: 'in_progress' | 'payment_pending' }] }`.
- **Carry-ins from BRIEF-017 audit:**
  - **S4 (Field-approved 2026-10-20):** `updatedAt: IsoDateTime` on `ticket.status_changed` and `ticket.issue_escalated` payloads — clients drop an event older than what they already show.
  - **S1:** `escalatedPayload` builds from the values just written (locked issue fields + `escalatedAt`) instead of a re-read — no 500 on a write that succeeded.
- **Contracts + docs:** schemas above; README Menu 86 row → live; `openapi.json`.

### Out (do NOT build here)
- Void / comp + PIN, `cancel_kind` / DR-016 → BRIEF-018 (after IAM).
- Menu Redis cache (deferred after 8 Nov — Field 2026-10-20) · auto-restore by stock level (FRD §6) · daily prep counts.
- Variant- or modifier-level 86 (item level only).
- BRIEF-017 S2 (`note` description) and S3 (`blankToNull` move) — next order-module brief.
- Any frontend / mobile UI (toast, struck-through line) · push notifications · `audit_log` writes.

## 3. Contract
| Method | Path | Request → Response | Permission |
|---|---|---|---|
| POST | `/menu/items/:id/mark-unavailable` | — → `MarkAvailabilityResult` `{ item: MenuItem, autoVoided, notVoided }` | `menu:toggle_availability` |
| POST | `/menu/items/:id/mark-available` | — → `MarkAvailabilityResult` (lists empty) | `menu:toggle_availability` |
- **WS events:** `menu.availability_changed` (new, payload above) · `ticket.status_changed` + `ticket.issue_escalated` gain `updatedAt` (S4).
- **Contracts changes:** `MenuAvailabilityChangedPayloadSchema`, `MENU_AVAILABILITY_CHANGED`, `MarkAvailabilityResultSchema`, `LineCancellationSchema` on order/ticket line items, `updatedAt` on the two ticket payloads. No new error codes.
- **Example (Field-reviewed 2026-10-17, carried from Rev 2):** 86 on ยำหมูยอ with T2 #0041 `pending` (+ ถั่วทอด), T5 #0043 `pending` (only line), T3 #0040 `accepted`, T6 #0044 `pending` + QR waiting → `autoVoided` T2 (ticket stays `pending`), T5 (ticket `cancelled`); `notVoided` T3 `in_progress`, T6 `payment_pending`.
- **Business rules:**
  - Auto-void `pending` tickets only (FRD §6 says `PENDING/ACCEPTED`) → **Field Q3, 2026-10-17** overrides: an accepted ticket may already be made.
  - Skip any visit with a `pending` payment → FRD §7 (QR amount is locked) · Field Q3.
  - System cancel = `cancelled_by` NULL, reason `ของหมด` → FRD §6 · DR-014 #3.
  - Ticket with zero active lines → `cancelled` → DR-013 Rule 3.
  - Toast copy states facts ("แจ้งลูกค้าโต๊ะ …"), never blames → CD-15.
- **Permissions:** `menu:toggle_availability` (Pre-decided name, Rev 2) — seeded wherever `orders:update_status` is seeded today.
- **OpenAPI:** both POSTs, permission in each description (`staffAccess`).

### 3b. Under the hood
- **When:** staff tap 86 / un-86 on POS or phone.
- **Where:** use case + controller live in **OrderModule** (`SoldOutService`, `menu-availability.controller.ts` at path `menu/items`) — Q2 A. MenuModule gains `setAvailability(itemId, value)` on its exported service. No new module import.
- **How** (`@Transactional()`, one tx):
  1. Lock `menu_item` row `FOR UPDATE`; same state → return no-op.
  2. Set `is_available`.
  3. Find active lines of that item on `pending` tickets → group by visit.
  4. For each visit, **ordered by id**: lock the visit row (same row `PaymentService.insertAttempt` locks via `lockLive`; via a new `VisitService.lockIfLive(id): Promise<boolean>` (`lockById` + live check, no throw) — **not** `lockLive`, which throws; a non-live visit is skipped, never fails the toggle) → `EXISTS payment WHERE visit_id AND status='pending'` (order-side SQL, same condition as `findPendingByVisit`) → yes: report `payment_pending`, next visit.
  5. Lock that visit's tickets `FOR UPDATE` (BRIEF-012 pattern, ordered by id); re-check status — no longer `pending` → report `in_progress`.
  6. Cancel lines (`save()`); ticket with no active line → `TicketService` cancels it.
  7. Commit → emit `menu.availability_changed` + `ticket.status_changed` per cancelled ticket.
- **Data:** `menu_item.is_available` · `order_item.cancelled_at/by/cancel_reason` · `order_ticket.status`. No schema change.
- **Failure:** any error → rollback, nothing voided, no event. Lock order item → visit → ticket everywhere this brief writes; payment create takes visit → venue, ticket transitions take ticket only — no cycle.
- **Why:** the visit-row lock is the same gate payment create uses, so "in flight" can't change between our check and our write — without OrderModule importing PaymentModule.

## 4. Acceptance Criteria
- **AC-1** — The Field-reviewed example (§3) produces exactly that result: lines, ticket statuses, totals (T2 −฿150, T5 −฿300, T3 / T6 unchanged), the HTTP result lists, one `menu.availability_changed` with matching `autoVoided` / `notVoided`, and `ticket.status_changed` for T5 only.
- **AC-2** — `mark-unavailable` on an already-unavailable item → 200, nothing voided, no event; `mark-available` sets the flag only, voided lines stay voided; a toggle that fails mid-way rolls back fully and emits nothing.
- **AC-3** — Races (real Postgres): (a) a payment created concurrently with the 86 on the same visit → either the payment wins and the line is `payment_pending`, or the 86 wins and the payment's amount excludes the voided line — never a voided line inside a pending payment; (b) a ticket accepted just before the toggle → `in_progress`, not voided; (c) an order with the item placed during the toggle → either voided by it or rejected `409 ITEM_UNAVAILABLE sold_out` — never a live `pending` line of an 86'd item.
- **AC-4** — Order / ticket reads show `cancellation` on voided lines (`system: true`, `by: null`, reason `ของหมด`); totals exclude them.
- **AC-5** — `ticket.status_changed` and `ticket.issue_escalated` carry `updatedAt` = the ticket's committed `updated_at` (S4); escalate when a `substitute` commits right after → 200 and a valid event, no 500 (S1, unit).
- **AC-6** — Unknown item → 404; invalid id → 400; without `menu:toggle_availability` → 403.
- **AC-7** — OpenAPI lists both endpoints; `openapi:check` passes; README Menu 86 row updated.
- **AC-8** — lint / typecheck / test / test:e2e / build exit 0; contracts tests pass.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2, AC-4, AC-6 | e2e | `app/backend/test/menu-sold-out.e2e-spec.ts` (T2/T5/T3/T6 fixture) |
| AC-3 | e2e (concurrent) | same file |
| AC-5 | unit + e2e | `src/modules/order/application/ticket.service.spec.ts` · existing ticket e2e asserts `updatedAt` |
| AC-7 | command | `openapi:check` |
| AC-8 | commands | below |

Gate commands (all must pass):
```bash
pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint
pnpm --filter @bar/backend typecheck
pnpm --filter @bar/backend test
pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend build
pnpm --filter @bar/backend openapi:check
```
Run proof:
```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
pnpm --filter @bar/backend migration:run
pnpm --filter @bar/backend start:dev   # separate shell, started on the work SHA
curl -fsS localhost:3001/api/health
# seeded staff session: place 2 orders with the same item → accept one → mark-unavailable → GET /tickets shows one voided line + one in_progress
```
UI change: n/a (backend only).

A required script that doesn't exist yet = **BLOCKED** — report it, never skip silently.

### Local Sonar scan
- Optional — Field's brief; run if time allows.

## 6. Constraints
- Ticket status changes only in `TicketService`; `SoldOutService` calls it — never writes `order_ticket.status`.
- MenuModule never imports OrderModule. OrderModule adds **no** new module import (no `forwardRef` to PaymentModule).
- Payment table is read only by one `EXISTS` query in the order repository — no write, no PaymentModule type imported.
- Row locks + `save()` on audited entities; system actor = no staff in CLS.
- One transaction per toggle; events after commit; money in `NUMERIC`.
- Thai `message`, English `code`.

## 7. Decision Points (Field Guard)
- **Q1 — Sold-out scope (was BRIEF-017 Q3). ✅ Decided (Field, 2026-10-17): A + skip** — `pending` only; skip payment in flight; report the rest. *Why:* an accepted ticket may already be made; a QR amount is locked (FRD §7).
- **Q2 — 86 → payment-in-flight check without a new module cycle. ✅ Decided (Field, 2026-10-21): A.** PaymentModule already imports OrderModule (`forwardRef`).
  - **A (chosen):** use case in OrderModule; lock the visit row (same lock as `PaymentService.create`) then one order-side `EXISTS` on `payment`. *Why:* zero new imports, race-safe by the shared lock, ~20 lines. *Trade-off:* the order repo knows one fact about the `payment` table (status `pending`) — written down here so it isn't hidden.
  - **B:** `forwardRef(() => PaymentModule)` in OrderModule and inject `PaymentGuard`. *Why not:* adds a 4th `forwardRef` edge to the venue↔order↔payment cycle parked as F7.
  - **C:** a port token provided at `AppModule` level. *Why not:* new wiring pattern for one boolean — over-engineered for now.
- **Q3 — Size. ✅ Decided (Field, 2026-10-21): one brief** at est. ~600–750 lines vs the ~500 target. *Why:* AC-1/AC-3 share one fixture; BRIEF-017 at ~700 was reviewable; S2/S3 moved out to trim.
- **Pre-decided:** permission `menu:toggle_availability` · event name `menu.availability_changed` · endpoint paths above · no new packages · no schema change · no new error codes.
- **Likely DRs:** if the `FOR SHARE` on order create (§2) shows measurable contention or needs a change to `getOrderable`'s signature beyond a lock option.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size — over target, Field-accepted (Q3)
- [x] No unresolved decision blocking the main outcome (Q1–Q3 decided)
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-20 | Initial Draft (Cowork) — from BRIEF-017 Rev 2 §2/§3/AC-3–5/Q3; + Q2 module boundary, S4 `updatedAt`, S1; cache and S2/S3 out |
| 1 | 2026-10-21 | Field in session: Q3 accepted as one brief; Q2 A (shared visit lock + order-side `EXISTS`, plain lock skips non-live visits) — recorded by Cowork on Field's explicit instruction |
| 1 | 2026-10-21 | Field approved Rev 1 → Ready ("approve BRIEF-027 Rev 1 Ready") — recorded by Cowork on Field's explicit instruction |

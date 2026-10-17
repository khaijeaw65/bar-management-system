# BRIEF-017 — Backend: ticket issue flow + sold-out (86) auto-void + menu cache

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent — Cursor) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 2 |
| **Depends on** | **BRIEF-012 merged** (tickets, `TicketService`, `order_item`, room `staff`) · **BRIEF-016 merged** (menu tables, `MenuAvailability`, `getOrderable`) · **BRIEF-013 merged** (Q1 — "visit has a payment in flight" check) |
| **References** | FRD §6 (issue paths, cancelled display) §7 (bill frozen while paying) · DR-012 · DR-013 Rules 3–4 · DR-014 #3 · BRIEF-012 Q2 · BRIEF-016 Q1 (cache path) · CD-08 R12 + issue flow (J2) · CD-15 R5 R7 J2, board-states·5 · `docs/api/README.md` (Menu 86, Orders) |
| **Audit depth** | Full (core flow, bill correctness) |
| **Size** | ~1.5–2 days |

---

## 1. Goal
Staff can report a problem on a ticket and continue or hand it to the POS; marking a menu item sold out cancels its not-yet-taken lines automatically and tells staff which tables to inform. Bill and ticket status stay correct; nothing changes on a bill that is being paid.

## 2. Scope
### In
- **Issue flow** (`TicketService`, DR-013 names; CD-08 J2, CD-15 J2):
  | Endpoint | From → To | Body / effect |
  |---|---|---|
  | `POST /tickets/:id/flag-issue` | `pending|accepted|ready → issue` | `{ reason: 'out_of_stock'|'equipment'|'other', itemId?, note? }` — `note` required for `other`; `itemId` must be an active line of this ticket; sets `issue_reason`, `issue_item_id`, `issue_note`, `issue_reported_by` |
  | `POST /tickets/:id/resolve` | `issue → accepted` (`substitute`) · stays `issue` (`escalate`) | `{ resolution: 'substitute'|'escalate', note? }` — `escalate` sets `issue_escalated_at` ("ส่งให้ POS"; second escalate → 409); `substitute` = "แก้แล้ว ทำต่อ" / POS "ทำต่อ", clears the issue fields |
  - Until BRIEF-018, an escalated issue is resolved at the POS by `substitute` only (no void).
- **Sold-out (86)** `POST /menu/items/:id/mark-unavailable` · `/mark-available` (`menu:toggle_availability`), one transaction:
  - Sets `menu_item.is_available`; already in that state → 200, no-op, no event.
  - `mark-unavailable` **auto-voids** that item's active lines on **`pending` tickets only** (Q3): `cancelled_at = now`, `cancelled_by` NULL (system), `cancel_reason = 'ของหมด'`.
  - **Skips** lines whose visit has a payment in flight (BRIEF-013 check) → listed as `payment_pending`. Lines on `accepted` / `ready` / `issue` tickets → listed as `in_progress`.
  - A ticket left with no active line → `cancelled` (DR-013 Rule 3).
  - `mark-available` only sets the flag (voided lines stay voided).
- **Menu cache** (BRIEF-016 Q1 path): Redis cache-aside of the raw menu, key `menu:catalog`; deleted by `mark-*` and by `seed:menu`; availability still computed per request from cached data (clock-dependent); `getOrderable()` keeps reading the DB.
- **Reads:** `Ticket` / `Order` items expose `cancellation: { at, reason, note, by, system } | null` (totals already exclude cancelled lines — BRIEF-012) · `GET /tickets` adds `?escalated=true` and returns `issue: { reason, itemId, note, reportedBy, escalatedAt } | null` (CD-15 issue column / strip).
- **Events** (room `staff`, after commit): `ticket.status_changed` (existing) · `order_item.cancelled` `{ itemId, ticketId, orderId, visitId, reason, system: true }` · `menu.availability_changed` `{ menuItemId, name, isAvailable, autoVoided: [{ ticketId, orderNumber, seatLabel, itemCount, ticketStatus }], notVoided: [{ ticketId, orderNumber, seatLabel, itemCount, reason: 'in_progress'|'payment_pending' }] }`.
- **Contracts + docs:** schemas above; `docs/api/README.md` (Menu 86 rows → this brief; `/order-items/:id/cancel` → BRIEF-018; events); `openapi.json`.

### Out (do NOT build here)
- **Void / comp + PIN approval, staff PIN seeding, PIN rate limit, DR-016 (`cancel_kind`, `approved_by`) → BRIEF-018, after the IAM brief** (Q2, Field 2026-10-17).
- IAM groups / `PermissionsGuard` enforcement (IAM brief) · `audit_log` writes · AI anomaly alerts (DR-014 #11).
- Push to the escalating staff (notifications brief) · back-office menu edit (CD-12) · auto-restock / daily prep counts.

## 3. Contract
| Method | Path | Request → Response | Permission |
|---|---|---|---|
| POST | `/tickets/:id/flag-issue` | `{ reason, itemId?, note? }` → `Ticket` | `orders:update_status` |
| POST | `/tickets/:id/resolve` | `{ resolution, note? }` → `Ticket` | `orders:update_status` |
| POST | `/menu/items/:id/mark-unavailable` | — → `MenuItem` | `menu:toggle_availability` |
| POST | `/menu/items/:id/mark-available` | — → `MenuItem` | `menu:toggle_availability` |
- Example (Field-reviewed 2026-10-17): 86 on ยำหมูยอ with T2 #0041 `pending` (+ ถั่วทอด), T5 #0043 `pending` (only line), T3 #0040 `accepted`, T6 #0044 `pending` + QR waiting → `autoVoided` T2 (ticket stays `pending`), T5 (ticket `cancelled`); `notVoided` T3 `in_progress`, T6 `payment_pending`.
- **OpenAPI:** all 4 endpoints, permission in each description.

## 4. Acceptance Criteria
- **AC-1** — Given a `pending` / `accepted` / `ready` ticket, when staff flag `out_of_stock` on one of its lines, then status `issue`, issue fields + reporter set, `ticket.status_changed` emitted; `other` without note → 400; a line from another ticket or a cancelled line → 400; flag on `sent` / `cancelled` / `issue` → 409.
- **AC-2** — Given an `issue` ticket, `resolve escalate` sets `issue_escalated_at` and keeps `issue` (second escalate → 409); `resolve substitute` → `accepted` with issue fields cleared; resolve on a non-issue ticket → 409; two concurrent resolves → one 200 + one 409.
- **AC-3** — The Field-reviewed example (§3) produces exactly that result: lines, ticket statuses, totals (T2 −฿150, T5 −฿300, T3 / T6 unchanged) and one `menu.availability_changed` with those `autoVoided` / `notVoided` lists, plus `ticket.status_changed` for T5.
- **AC-4** — `mark-unavailable` on an already-unavailable item → 200, nothing voided, no event; `mark-available` sets the flag only; a rolled-back toggle voids nothing and emits nothing.
- **AC-5** — A line auto-voided while an order on the same visit is being placed or a ticket is being accepted → no lost update (row locks, BRIEF-012 pattern); a ticket accepted a moment before the toggle is reported `in_progress`, not voided.
- **AC-6** — Menu reads hit Redis after the first call; `mark-*` and `seed:menu` invalidate it; a promo window still opens / closes by the clock on cached data; `getOrderable` reads the DB (an item 86'd → next order line 409 `ITEM_UNAVAILABLE reason sold_out` immediately).
- **AC-7** — Unknown ticket / item → 404; invalid body → 400.
- **AC-8** — OpenAPI lists the 4 endpoints; `openapi:check` passes; README updated.
- **AC-9** — lint / typecheck / test / test:e2e / build exit 0; contracts tests pass.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2 | unit + e2e | `src/modules/order/application/ticket.service.spec.ts` · `test/ticket-issue.e2e-spec.ts` |
| AC-3, AC-4, AC-5 | e2e | `test/menu-sold-out.e2e-spec.ts` (real Postgres + Redis; T2/T5/T3/T6 fixture) |
| AC-6 | e2e | `test/menu-cache.e2e-spec.ts` |
| AC-7 | e2e | in the files above |
| AC-8 | command | `openapi:check` |

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
A required script that doesn't exist yet = **BLOCKED** — report it, never skip silently.

### Local Sonar scan
- Optional — Field's brief; run if time allows.

## 6. Constraints
- Ticket status changes only in `TicketService`; the 86 service calls it for auto-cancel — never writes `order_ticket.status` itself.
- Menu module must not import the order module's internals: the order module subscribes to an in-process "item sold out" call/port owned by the order side (or the 86 use case lives in the order module) — no import cycle (backend.md).
- Row locks + `save()` on audited entities; system actor = no staff in CLS (`cancelled_by` NULL).
- One transaction per toggle; events after commit. Totals in `NUMERIC`.
- Thai `message`, English `code`; Toast copy states facts ("แจ้งลูกค้าโต๊ะ …"), never blames.

## 7. Decision Points (Field Guard)
- **Q1 — Order vs BRIEF-013. ✅ Decided (Field, 2026-10-17): A** — 016 → 012 → 013 → 017; this brief uses BRIEF-013's payment-in-flight check. *Why:* payment is on the 8 Nov gate path; void / issue are not. (Corrects BRIEF-012 Q2's "right after".)
- **Q2 — Void / comp before IAM. ✅ Decided (Field, 2026-10-17): B** — no void / comp until the IAM brief; they move to **BRIEF-018 (after the IAM brief)** with PIN approval (approver must hold `orders:void`), PIN seeding, PIN rate limit and DR-016. *Why:* the control stays as strict as FRD §8 from the first release. *Accepted trade-off:* until BRIEF-018 the POS cannot remove a wrong line; CD-15 J1 (void + replace) waits; escalated issues resolve by `substitute` only.
- **Q3 — Sold-out scope. ✅ Decided (Field, 2026-10-17): A + skip** — auto-void lines on `pending` tickets only; skip visits with a payment in flight; report the rest as `notVoided` (`in_progress` / `payment_pending`). *Why:* an accepted ticket may already be made; a QR amount is locked (FRD §7).
- **Pre-decided:** permission `menu:toggle_availability` · Redis key `menu:catalog` · no new packages · no schema change · no new error codes.
- **Likely DRs:** module boundary for the 86 → auto-void call (menu ↔ order) if the port shape is unclear.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions
- [x] No unresolved decision blocking the main outcome (Q1–Q3 decided 2026-10-17)
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-17 | Initial Draft (Cowork) — void/comp + PIN, issue flow, 86, cache; DR-016 raised |
| 2 | 2026-10-17 | Field decisions in session: Q1 A (after BRIEF-013), Q2 B (void/comp + PIN + DR-016 → BRIEF-018 after IAM), sold-out A + skip on payment in flight — recorded by Cowork on Field's explicit instruction. Renamed `BRIEF-017-issues-sold-out.md`; scope narrowed, ~1.5–2 days |

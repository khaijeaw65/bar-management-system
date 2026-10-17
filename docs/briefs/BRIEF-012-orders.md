# BRIEF-012 — Backend: orders + station tickets (place → accept → ready → send)

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent — Cursor) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 3 |
| **Depends on** | **BRIEF-011 merged** (PR #45 — `VisitService`, `NotificationsService`, `closeIfLive`) · **BRIEF-016 merged** (Q1 — `venue` settings row + menu tables/read + seed) |
| **References** | FRD §6 · `docs/schema.sql` §6 (`order_record`, `order_ticket`, `order_item`, `order_item_modifier`, `order_status`) · DR-011 · DR-012 (+ Amendment 1) · DR-013 · DR-014 #1 #4 · `docs/api/README.md` (Orders, Idempotency, Realtime) · CD-04 R8 · CD-08 R10-1, R10-4 · CD-15 · BRIEF-011 audit Finding 1 · `docs/rules/backend.md` |
| **Audit depth** | Full (core flow, concurrency, money) |
| **Size** | ~3 days (target: API live by checkpoint 25 Oct) |

---

## 1. Goal
Staff can place an order on a live visit; it gets a daily number (#001), splits into station tickets per the venue setting, and each ticket moves through `pending → accepted → (ready) → sent` with live events to POS and staff app. The visit becomes `active` on its first order and the table grid shows real totals. BRIEF-013 (payment) bills these orders.

## 2. Scope
### In
- **Migrations** exactly as `schema.sql` §6: `order_record`, `order_ticket`, `order_item`, `order_item_modifier`, enum `order_status`, circular FK `fk_ticket_issue_item`, indexes `idx_order_visit`, `idx_ticket_order`, `idx_ticket_status`, `idx_order_item_ticket`. (`kitchen_station` and menu tables come from BRIEF-016.) Entities extend `BaseEntity` except `order_item_modifier` (no audit columns).
- **Module** `modules/order/` (hexagonal, same layout as `modules/venue/`): `OrderService` (placement), `TicketService` (all ticket transitions — the only place `order_ticket.status` changes), TypeORM adapters, controllers.
- **Placement** `POST /visits/:visitId/orders` — one transaction:
  1. Lock the visit row (`SELECT … FOR UPDATE`, new `VisitService` method used by `OrderService`); state not `open|active|idle` → 409 `INVALID_STATE_TRANSITION`. `open|idle → active` in the same transaction (BRIEF-011 Finding 1 follow-through: no check-then-write).
  2. Validate every line: via BRIEF-016 `MenuCatalogService.getOrderable()` (never re-implement availability): unknown variant → 400 `VALIDATION_ERROR`; not orderable now → 409 `ITEM_UNAVAILABLE` with `details: [{ variantId, reason: "sold_out" | "out_of_window" }]` (DR-010 rule 11); an unavailable modifier option → same 409, `reason: "sold_out"`; modifier options belong to the variant's groups and meet `is_required` / `min_select` / `max_select` → else 400 `VALIDATION_ERROR`.
  3. `business_date` from `venue.business_day_cutoff` in Asia/Bangkok (local time before cut-off → previous date). `order_number` = next for that date under `pg_advisory_xact_lock` keyed on the date (Q5).
  4. Tickets: `venue.kitchen_display_enabled` off → one `bar` ticket for all non-charge items; on → `bar` / `food` by `menu_item.kitchen_tag`. Charge items → their own ticket (`station` NULL) created `sent` with `sent_at`. Decided once, never re-split (DR-013 Rule 1).
  5. Snapshots: `unit_price_snapshot` = variant price, `price_delta_snapshot` per modifier. `created_by` = staff from the JWT (customer QR orders are out of scope).
  6. After commit: `order.created`; `visit.state_changed` if the visit moved to `active`.
- **`Idempotency-Key`** on placement per `docs/api/README.md` §Idempotency (Redis, 24 h, same key + different body → 409 `IDEMPOTENCY_KEY_REUSED`). Header optional; absent = no replay.
- **Ticket transitions** (pessimistic lock on the ticket row in a transaction, then `save()`; wrong current status → 409 `INVALID_STATE_TRANSITION`; `updated_by` = acting staff → "กำลังเตรียม · ชื่อ"):
  | Endpoint | From → To | Rule |
  |---|---|---|
  | `POST /tickets/:id/accept` | `pending → accepted` | — |
  | `POST /tickets/:id/ready` | `accepted → ready` | only when `kitchen_display_enabled` **and** seat kind = `table` (DR-011, DR-014 #1); otherwise 409 |
  | `POST /tickets/:id/send` | `ready → sent`, or `accepted → sent` when READY is skipped | sets `sent_at`; `accepted → sent` while READY applies → 409 |
- **Reads:** `GET /tickets?status=&visitId=` (queue; default `pending,accepted,ready`; excludes charge tickets; each ticket carries `orderNumber`, `station`, seat label/kind, items with modifiers + `orderedByName`, `acceptedBy` display name, `createdAt`) · `GET /orders/:id` (order + all tickets + items — CD-08 R10-1) · `GET /visits/:id` gains `orders[]` · `GET /tables` fills `currentVisit.total` and `itemCount` (non-cancelled lines: `quantity × (unit + Σ deltas)`).
- **Realtime:** add room `staff`, joined by every authenticated `/staff` socket (CD-08 R10-4, Q3 decided); `NotificationsService.emitToStaff()`. `order.created` and `ticket.status_changed` go to `staff`; `visit.*` stays on `pos`.
- **Contracts:** request/response schemas for the endpoints above, `TicketSchema`, `OrderSchema`, event schemas `order.created`, `ticket.status_changed`; error code `ITEM_UNAVAILABLE` (`IDEMPOTENCY_KEY_REUSED` already exists). Confirm `OrderStatusSchema` matches `schema.sql` (state noted a drift; today both list 6 values incl. `cancelled` — auditor re-checks).
- **Docs:** `docs/api/README.md` Orders table + event list updated to the DR-013 names (`/tickets/:id/…`, `ticket.status_changed`); `docs/api/openapi.json` regenerated.

### Out (do NOT build here)
- Cancel / void / comp + manager PIN + self-approve flag, ticket auto-`cancelled`, `flag-issue` / `resolve` / escalate, sold-out auto-cancel (DR-014 #3) → **BRIEF-017** (Q2).
- `409 PAYMENT_IN_FLIGHT`, bill, payments → BRIEF-013.
- Customer QR order `POST /public/visits/:id/orders`, call-staff ack → customer-QR brief (after 8 Nov).
- Menu CRUD, venue settings API → BRIEF-016 / back-office briefs. Expo push token → notifications brief. Kitchen display screen (S2).
- `PermissionsGuard` enforcement (IAM brief) — metadata only, as BRIEF-011.

## 3. Contract
- **Endpoints** (`/api`, envelope, money as string `"0.00"`):
  | Method | Path | Request → Response | Permission |
  |---|---|---|---|
  | POST | `/visits/:visitId/orders` | `{ items: [{ variantId, quantity (1–99), modifierOptionIds?: [], orderedByName?, notes? }] (1–50) }` → 201 `Order` | `orders:create` |
  | GET | `/orders/:id` | → `Order` | `orders:read` |
  | GET | `/tickets` | `?status=a,b&visitId=` → `Ticket[]` (unpaged) | `orders:read` |
  | POST | `/tickets/:id/accept` · `/ready` · `/send` | — → `Ticket` | `orders:update_status` |
- `Order`: `{ id, visitId, orderNumber, businessDate, createdAt, createdBy: { staffId, displayName } | null, tickets: Ticket[], total }`
- `Ticket`: `{ id, orderId, orderNumber, station: 'bar'|'food'|null, status, seat: { id, label, kind }, items: [{ id, variantId, name, variantName, quantity, unitPrice, modifiers: [{ optionId, name, priceDelta }], lineTotal, orderedByName, notes, cancelledAt: null }], acceptedBy: { staffId, displayName } | null, sentAt, createdAt, updatedAt }`
- **WS** (room `staff`): `order.created` → `Order` · `ticket.status_changed` → `{ ticketId, orderId, visitId, status, updatedBy: { staffId, displayName } }`
- **OpenAPI:** all 6 endpoints in `docs/api/openapi.json`, permission in each description.

## 4. Acceptance Criteria
- **AC-1** — Given a live visit and kitchen screen **off**, when staff place beer + fries + a corkage charge, then 201 with one order `#N`, a `bar` ticket (`pending`, beer + fries) and a charge ticket (`sent`, `sent_at` set); prices and modifier deltas are snapshotted.
- **AC-2** — Given kitchen screen **on**, when the same order is placed, then three tickets: `bar` (beer), `food` (fries), charge (`sent`).
- **AC-3** — Given an `open` (or `idle`) visit, when its first order is placed, then the visit is `active` and `visit.state_changed` is emitted once; a closed/abandoned visit → 409 `INVALID_STATE_TRANSITION` and nothing is written.
- **AC-4** — Given a close and an order racing on the same visit (`Promise.all`, e2e), then either the order is 201 and the close 200 after it, or the close 200 and the order 409 — never an order row on a visit closed before it.
- **AC-5** — Given 5 concurrent orders on one business date, then numbers are unique and consecutive; given local time 05:59 vs 06:00 with cut-off 06:00, then `business_date` is the previous vs current day (unit, injected clock).
- **AC-6** — Given an unavailable variant (flag off, or outside its window), then 409 `ITEM_UNAVAILABLE` with `reason` `sold_out` / `out_of_window` per line; a modifier set breaking required/min/max or from another group → 400 `VALIDATION_ERROR`; nothing written.
- **AC-7** — Given the same `Idempotency-Key` + body twice, then the second returns the first response and one order exists; same key + different body → 409 `IDEMPOTENCY_KEY_REUSED`.
- **AC-8** — Ticket transitions follow §2 (incl. READY only for table seats with the kitchen screen on); a wrong-state call → 409; two concurrent `accept` on one ticket → one 200 + one 409 and exactly one `ticket.status_changed`; `acceptedBy` shows the accepting staff.
- **AC-9** — `GET /tickets` defaults to `pending,accepted,ready`, excludes charge tickets, filters by `status` / `visitId`; `GET /orders/:id` returns all tickets incl. charge; `GET /tables` shows the visit's `total` / `itemCount`; `GET /visits/:id` lists its orders.
- **AC-10** — A socket in room `staff` receives `order.created` and `ticket.status_changed`; events are emitted only after commit (a rolled-back placement emits nothing).
- **AC-11** — Unknown visit/order/ticket → 404 `NOT_FOUND`; invalid body → 400 `VALIDATION_ERROR`.
- **AC-12** — OpenAPI lists the 6 endpoints with permissions; `openapi:check` passes; `docs/api/README.md` Orders section matches.
- **AC-13** — lint / typecheck / test / test:e2e / build exit 0; contracts tests pass.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2, AC-6, AC-9, AC-11 | e2e | `test/order.e2e-spec.ts` (real Postgres + Redis, BRIEF-016 seed) |
| AC-3, AC-4 | e2e (concurrency) | `test/order.e2e-spec.ts` → `describe('visit activation race')` |
| AC-5 | unit + e2e | `src/modules/order/application/business-date.spec.ts` · `order.e2e-spec.ts` → `describe('order number')` |
| AC-6 (modifier rules) | unit | `src/modules/order/application/order.service.spec.ts` |
| AC-7 | e2e | `test/order.e2e-spec.ts` → `describe('idempotency')` |
| AC-8 | unit + e2e | `src/modules/order/application/ticket.service.spec.ts` · `test/ticket.e2e-spec.ts` |
| AC-10 | e2e | `test/notifications.e2e-spec.ts` (room `staff`) |
| AC-12 | command | `openapi:check` |

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
- Hexagonal layout, ports + tokens, Zod DTOs, `@Transactional()` for multi-repo writes (backend.md).
- Audited entities (`order_record`, `order_ticket`, `order_item`): `save()` only — concurrency via row locks inside the transaction, not `UPDATE … WHERE status`. `visit` has no audit columns; its transitions stay in `VisitService`.
- `OrderService` never writes `visit` directly — it calls `VisitService`. Ticket status changes only in `TicketService`.
- Prices come from the DB, never from the request. Money in `NUMERIC`, serialized as string; no float math.
- Inject `NotificationsService`, never the gateway; emit after commit.
- Thai user-facing `message` (e.g. "รายการนี้หมดหรือยังไม่เปิดขาย"), English `code`.

## 7. Decision Points (Field Guard)
- **Q1 — Menu + venue dependency. ✅ Decided (Field, 2026-10-17): A.** New **BRIEF-016 — venue settings + menu read + seed** lands first: `venue` (one seeded row) + menu tables from `schema.sql` §4, `seed:menu` (every orderable item ≥ 1 variant — README D4), `GET /menu/categories`, `GET /menu/items` with `available_now` (CD-04, DR-010). **Read-only** — availability toggle (86) goes to BRIEF-017. *Why:* POS order entry (CD-04) needs the menu read anyway; this brief stays ≤ 3 days.
- **Q2 — Void / issue flow. ✅ Decided (Field, 2026-10-17): A — BRIEF-017**, right after this brief: void + comp + manager 4-digit PIN + self-approve flag, ticket auto-`cancelled`, `flag-issue` / `resolve` / escalate, sold-out auto-cancel (DR-014 #3) + availability toggle. Retargets CD-02 R5 and CD-15 R5 from BRIEF-012 to BRIEF-017. *Why:* not on the 8 Nov gate path; PIN handling gets its own focused audit; no unapproved void path in the meantime.
- **Q3 — Staff-app room. ✅ Decided (Field, 2026-10-17): A** — one room `staff`, joined by every authenticated `/staff` socket (POS included); `order.created` + `ticket.status_changed` → `staff`; `visit.*` stays on `pos`. *Why:* smallest change; both surfaces need the same events; a kitchen-display room can be added later without breaking this.
- **Q4 — Names. ✅ Decided (Field, 2026-10-17): A — DR-013 names:** `/tickets/:id/accept|ready|send`, `GET /tickets`, `GET /orders/:id`, events `order.created`, `ticket.status_changed`. This brief updates `docs/api/README.md` (Orders table + event list). *Why:* status lives on the ticket; `/orders/:id/accept` is ambiguous once an order has bar + food tickets.
- **Q5 — Order number. ✅ Decided (Field, 2026-10-17): A** — in the placement transaction: `pg_advisory_xact_lock(<business date key>)` → `MAX(order_number) + 1` → insert; `uq_order_number_per_day` stays as the safety net; one-line code comment says why the lock exists. *Why:* correct by construction, no retry code, no gaps on rollback; lock scope = one business date, held for milliseconds.
- **Pre-decided:** new error code `ITEM_UNAVAILABLE` with per-line `reason` (DR-010 rule 11; `IDEMPOTENCY_KEY_REUSED` already in contracts) · permissions `orders:create`, `orders:read`, `orders:update_status` · room `staff` + `NotificationsService.emitToStaff()` · no new packages (Redis provider, socket.io from BRIEF-011).
- **Likely DRs:** TypeORM pessimistic lock inside `@Transactional()` with the CLS transaction manager · advisory-lock key from a date.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions
- [x] No unresolved decision blocking the main outcome (Q1–Q5 decided 2026-10-17)
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision (Ready also waits for BRIEF-016 to be Ready)

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-17 | Initial Draft (Cowork) — from DR-012/013/014, CD-04 R8, CD-08 R10-1/R10-4, CD-15 R5, CD-02 R5, BRIEF-011 Finding 1; Q1–Q5 open |
| 2 | 2026-10-17 | Q1–Q5 decided by Field in session (all A), recorded by Cowork on Field's explicit instruction; Pre-decided list completed |
| 3 | 2026-10-17 | Aligned with BRIEF-016: availability via `getOrderable()`; `ITEM_UNAVAILABLE` carries `reason` (DR-010 rule 11); `IDEMPOTENCY_KEY_REUSED` already exists — no decision change |

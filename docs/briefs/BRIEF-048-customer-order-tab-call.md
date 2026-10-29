# BRIEF-048 — Backend: customer order, running tab, call staff + WS /customer (C2)

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 1 |
| **Depends on** | **BRIEF-047 merged** (`guest_session`, `GuestSessionGuard`, `CustomerModule`, throttle helper) · BRIEF-012 ✅ / 013 ✅ / 017 ✅ / 027 ✅ (orders, tickets, payments, cancel, sold-out events) · BRIEF-011 ✅ (visits, `opened_via = 'qr'`) |
| **References** | DR-028 (guest session, "ของฉัน", throttles) · CD-06 handoff §4 (send order, running tab, call staff), §9 (tab, realtime, call staff), D2/D3 · CD-07 (cash → call-staff `reason: 'bill'`) · CD-08 R10-2 (acknowledge call-staff) · FRD §3 (first order opens the visit, shared session), §6 (customer-facing tab, call staff) · DR-012 (status per ticket) · DR-017 (Idempotency-Key) · DR-021 (errors) |
| **Audit depth** | Full (orders + guest auth) |
| **Size** | ~2 days · est. ~1,100–1,300 net-new lines incl. tests — **one brief by Field's choice** (2026-10-29) over the ~500-line guide |

---

## Interview — Selected (by KJ), 2026-10-29
| Q | Selected (by KJ) |
|---|---|
| Split C2? | One brief |
| Live updates | WS `/customer` namespace |
| WS payload | Ping `tab.changed { visitId }` → phone refetches the tab |
| Call staff kept as | DB flag + staff acknowledge (survives POS reload) |
| Call reason | Optional: `bill` / `other` (+ note) |
| Who acknowledges | Any staff, POS + staff app, one endpoint |
| Tab content | Whole table + "ของฉัน" filter |
| *(proposed)* Flag location | On **`table_seat`**, not `visit` — a guest at a free table (no visit yet) can still call staff; cleared on acknowledge and when the seat's visit closes |
| *(proposed)* "ของฉัน" exposure | Server sends `mine: boolean` per order; other phones' session ids never leave the server |
| *(proposed)* WS path | Customer gateway on its own socket.io path `/api/customer/socket.io` so the `Path=/api/customer` cookie reaches the handshake (DR-028 cookie unchanged) |

## 1. Goal
A guest with a guest session can send an order (the first order on a free table opens the visit), see the whole table's running tab live with a "ของฉัน" filter, and ring the bell for staff; staff see the bell on the POS / staff app and clear it.

## 2. Scope
### In
- **Schema (one migration):**
  - `order_record.guest_session_id UUID NULL REFERENCES guest_session(id)` + index — NULL = staff order (DR-028).
  - `table_seat.staff_called_at TIMESTAMPTZ NULL`, `staff_call_reason VARCHAR(10) NULL CHECK IN ('bill','other')`, `staff_call_note VARCHAR(100) NULL`.
  - `docs/schema.sql` + ERD note updated.
- **Send order** — `POST /customer/orders` (+ `Idempotency-Key`, DR-017; key scoped to the guest session) `{ items: PlaceOrderItem[] }` (same item shape as BRIEF-012; `orderedByName` comes from the session's `displayName`, never from the body).
  1. Throttle: 1 order / 10 s per session (Redis `SET NX EX 10`, fail open) → 429 `RATE_LIMITED`.
  2. **One transaction** (`OrderService`, lock order menu → visit as today):
     - session bound to a visit → `claimForOrder(visitId)`;
     - seat-only session → `VisitService.openForGuest(tableSeatId)` = insert-or-attach on the live-per-seat rule (BRIEF-011 first-write-wins; `opened_via = 'qr'`, `opened_by = NULL`) → set `guest_session.visit_id`;
     - insert the order with `guest_session_id`, `created_by = NULL`, each line `ordered_by_name` = session `displayName` (snapshot) or NULL.
  3. After commit: existing `order.created` (+ `visit.opened` / `visit.state_changed` when it opened or activated) to staff/POS **plus** `tab.changed` to the visit room.
  - Errors reuse BRIEF-012 / DR-010: 409 `ITEM_UNAVAILABLE` (`sold_out` / `out_of_window`), 400 validation, charge-type variants → 400 (not orderable by guests, CD-06 §9).
  - **Failure → what's left → who cleans:** transaction fails → no visit, no order, session unchanged → guest retries with the same key (replay → same order). WS emit failure after commit → order stands, phone refetches on reconnect.
- **Running tab** — `GET /customer/tab` → `CustomerTab`:
  - seat-only session → `{ visitId: null, orders: [], total: '0.00' }`.
  - else every order on the visit (guest + staff entered), newest placement first; per order: `orderNumber`, `placedAt`, `mine` (= this session placed it), tickets `[{ station, status }]` (DR-012, no item progress), lines `[{ itemName, variantName, modifiers (option names), quantity, unitPrice, lineTotal, orderedByName, cancelled }]` from snapshots (DR-022); charge-type lines included with no ticket status (CD-06 D3); cancelled lines kept, struck, excluded from `total`.
  - `asOf` timestamp (CD-06 data-freshness).
  - No staff names, staff ids, cost, other sessions' ids or payment details (payment = C5).
- **Call staff (guest)** — `POST /customer/call-staff` `{ reason?: 'bill'|'other', note?: string ≤ 100 }` → `{ calledAt }`. Throttle 60 s per session → 429 (CD-06 call·3). Sets the seat's flag (overwrites an older one) → emits to POS + staff room `table.staff_called { tableSeatId, reason, note, calledAt }`.
- **Acknowledge (staff)** — `POST /tables/:seatId/acknowledge-call` (staff JWT, `tables:read`) → clears the flag → emits `table.staff_call_cleared { tableSeatId }`. Idempotent: no flag → 200. Visit close also clears its seat's flag (inside `VisitService.close`).
- **POS / staff data:** `GET /tables` card `staffCalled` (exists, BRIEF-011 placeholder) becomes real + adds `staffCall: { reason, note, calledAt } | null`.
- **WS `/customer`** — new `CustomerGateway` (`namespace: '/customer'`, `path: '/api/customer/socket.io'`, same Redis adapter):
  - handshake: `guest_session` cookie → `GuestSessionService.resolve` → join room `visit:{visitId}` when bound, else `seat:{tableSeatId}`; invalid → reject.
  - after the first order binds the visit: server makes sockets in `seat:{id}` that belong to that session join `visit:{id}` (or the client reconnects — executor picks, documents in handoff).
  - **one event only:** `tab.changed { visitId }`. Sent on: order placed, ticket status change, item cancelled (POS / sold-out auto-void), visit state change / close (+ `sessionEnded: true` on close). Implemented as `NotificationsService.emitTabChanged(visitId)` called next to the existing staff emits — no customer payloads mirror staff events.
- **Contracts:** `CustomerPlaceOrderSchema`, `CustomerTabSchema` (strict), `CustomerCallStaffSchema`, `CallStaffResultSchema`, events `TAB_CHANGED` + payload, `TABLE_STAFF_CALLED`, `TABLE_STAFF_CALL_CLEARED` + payloads, table card `staffCall` field. OpenAPI for all routes; `docs/api/README.md` Customer + Tables rows and a WS table row for `/customer`.

### Out (do NOT build here)
- Customer payment / pay intent (C5) · any UI incl. POS bell sound/badge (C3/C4/C6) · guest cancelling own order · editing nickname per line · mobile app wiring of acknowledge (Metee's mobile brief) · venue setting "staff must open the table" (not S1, DR-028) · Expo push for call-staff (DR-014 #11, mobile push brief).

## 3. Contract
| Method | Path | Auth | Request → Response |
|---|---|---|---|
| POST | `/customer/orders` | `guest_session` + `Idempotency-Key` | `CustomerPlaceOrder` → `{ orderId, orderNumber, visitId }` (201) |
| GET | `/customer/tab` | `guest_session` | → `CustomerTab` |
| POST | `/customer/call-staff` | `guest_session` | `CustomerCallStaff` → `CallStaffResult` |
| POST | `/tables/:seatId/acknowledge-call` | staff JWT · `tables:read` | → `{ ok: true }` |
- **WS:** `/customer` → `tab.changed { visitId, sessionEnded? }` · `/staff` (rooms `pos`, `staff`) → `table.staff_called`, `table.staff_call_cleared`.
- **Errors:** 400 `VALIDATION_ERROR` · 401 `GUEST_SESSION_INVALID` · 409 `ITEM_UNAVAILABLE` · 409 idempotency (DR-017) · 429 `RATE_LIMITED`.
- **Business rules:** first order on a free table opens the visit, first-write-wins with the POS (FRD §3) · second phone joins the same visit and bill · `mine` by session, never by name (CD-06 R4) · prices/names from snapshots (DR-022) · cancelled lines shown, excluded from total (FRD §6).

## 4. Acceptance Criteria
- **AC-1** — Seat-only session sends an order on a free seat → 201; visit created `opened_via='qr'`, `opened_by` NULL; `guest_session.visit_id` set; order has `guest_session_id`, `created_by` NULL; staff room gets `order.created` + `visit.opened`.
- **AC-2** — Race: POS opens the same seat while the guest's first order is in flight (both in parallel) → exactly one live visit; the order lands on it; guest session bound to it.
- **AC-3** — Second phone (own session, same visit) orders → same visit; `GET /customer/tab` from phone A shows both orders, `mine` true only for A's.
- **AC-4** — Same `Idempotency-Key` replay → same order, no duplicate; second order within 10 s from one session → 429; sold-out line → 409 `ITEM_UNAVAILABLE` with `sold_out`; charge variant in the body → 400.
- **AC-5** — `orderedByName` from the body is ignored; line name = session `displayName` at send; renaming afterwards does not change old lines.
- **AC-6** — Tab: staff-entered order and a charge line appear; a POS-cancelled line shows `cancelled: true` and is excluded from `total`; ticket statuses per station; response has no staff name/id or other session ids (strict schema parse).
- **AC-7** — Call staff from a seat-only session → seat flag set, POS room gets `table.staff_called`; second call within 60 s → 429; `GET /tables` card `staffCalled: true` + `staffCall` details; `POST /tables/:seatId/acknowledge-call` → cleared + `table.staff_call_cleared`; acknowledging again → 200; closing the visit clears the flag.
- **AC-8** — WS `/customer`: valid cookie connects and receives `tab.changed` after a POS ticket accept and after a POS item cancel on its visit; a socket on another visit receives nothing; no/invalid cookie → connection rejected; visit close → `tab.changed` with `sessionEnded: true`.
- **AC-9** — Staff JWT on `/customer/orders` does not authenticate; guest cookie on `/tables/:seatId/acknowledge-call` → 401.
- **AC-10** — Gates + run proof pass; OpenAPI regenerated + `openapi:check`; README updated.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1 – AC-7, AC-9 | integration (real Postgres + Redis) | `app/backend/test/customer-order.e2e-spec.ts` |
| AC-8 | integration (socket.io client) | `app/backend/test/customer-ws.e2e-spec.ts` |
| AC-2 | concurrency (parallel requests) | in `customer-order.e2e-spec.ts` |
| AC-6 | unit (tab folding, totals) + contracts strict parse | `modules/customer/application/customer-tab.spec.ts` · `packages/contracts/src/schemas/customer.test.ts` |

Gate commands (all must pass):
```bash
pnpm --filter @bar/contracts build && pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck && pnpm --filter @bar/backend test && pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:check
```
Run proof (stop any dev backend before `test:e2e`; ports BRIEF-046):
```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
pnpm --filter @bar/backend migration:run && pnpm --filter @bar/backend start:dev   # :3011
# phone A: start session on a free seat (BRIEF-047), send 1 order → POS (web :3010) shows the table active + the order
# phone B: start session on the same seat, send 1 order → GET /customer/tab from A: 2 orders, mine true/false
# POS: accept the ticket, cancel one line → A's socket logs tab.changed twice; tab total excludes the line
# A: call-staff reason bill → GET /tables shows staffCall → acknowledge → cleared
```
Output trimmed in the handoff (curl + a short socket.io client script). UI change: n/a (POS shows the order via existing screens).

### Local Sonar scan
- Required: optional — record result in the handoff.
- Approved exclusions: none.

## 6. Constraints
- Order placement stays in `OrderService` (one path for staff and guests); `CustomerModule` controllers only translate the guest session into the input. No second order-writing service.
- `CustomerModule` may import `OrderModule` (new in this brief) in addition to `VenueModule`, `MenuModule`.
- Guest emits only through `NotificationsService.emitTabChanged`; never send staff payloads on `/customer`.
- `save()` on audited entities; `updated_at` from triggers (DR-023); never log the raw guest token.
- Thai messages: call-staff throttle reuses `RATE_LIMITED` ("กรุณารอสักครู่"); `GUEST_SESSION_INVALID` from BRIEF-047.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):** everything in "Selected (by KJ)" incl. the three *(proposed)* rows once Field approves this revision · migration columns above · endpoints/events above · `VisitService.openForGuest` in `modules/venue` · WS path `/api/customer/socket.io`, namespace `/customer` · no new dependency (`socket.io-client` ^4 is already a backend devDependency for the WS e2e).
- **Stop and raise a DR if:** a separate socket.io path cannot share the Redis adapter (do **not** widen the cookie path silently) · the guest order path needs a second order-writing service · any schema change beyond the migration above.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [ ] Size within workflow §2 — **over the line guide by Field's choice (one brief)**; ~2 days
- [x] No unresolved decision blocking the main outcome
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-29 | Initial Draft (Cowork) — customer side C2 |

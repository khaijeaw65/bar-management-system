# Handoff — BRIEF-048 Backend: customer order, running tab, call staff + WS /customer (C2)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-30 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-048-customer-order-tab-call` (PR opens after audit PASS) |
| **Commit** | Work SHA: see chat (not recorded here — no SHA-record commits) |
| **Status** | Implemented — waiting for `audit BRIEF-048` (Cowork) |

> Created at `Implemented`. Updated once in the PASS commit. Frozen at merge.

## Summary
A guest with a session can send an order (the first one on a free seat opens the visit), see the whole table's running tab with a "ของฉัน" mark, and ring the bell; staff see the bell on `GET /tables` + WS and clear it.

- **Migration `1763000000000-CustomerOrderCallStaff`:** `order_record.guest_session_id` (+ partial index) · `table_seat.staff_called_at / staff_call_reason / staff_call_note` (CHECK `bill|other`).
- **Order path:** `OrderService.placeAsGuest` shares `draft` / `lockMenu` / `publish` with the staff `place` (one order writer). Transaction: menu lock → `VisitService.openForGuest` (raw `INSERT … ON CONFLICT DO NOTHING` on `uq_visit_live_per_seat`, so losing the race to POS cannot abort the transaction) → `claimForOrder` → `GuestSessionRepository.bindVisit` through the transaction handle (the visit row is not committed yet) → insert. Charge variants → 400. After commit: `visit.opened` (if it opened), `visit.state_changed`, `order.created`, `tab.changed`; a failed announce is logged, never fails the order.
- **Customer routes (`CustomerOrderController`):** `POST /customer/orders` (Idempotency-Key scoped `customer-order:<session>`; replay is checked before the 10 s gap) · `GET /customer/tab` (`foldCustomerTab`, strict contract, `mine` via a new `OrderQueryService.guestSessionIds`) · `POST /customer/call-staff` (60 s).
- **Staff:** `POST /tables/:seatId/acknowledge-call` (`tables:read`, idempotent, 404 only for an unknown seat). `VisitService.close` clears the bell and emits `table.staff_call_cleared` when it cleared one, and `tab.changed { sessionEnded: true }`.
- **Cards:** `TableSummary.staffCall` (seat level, so a free seat can show it) + `currentVisit.staffCalled` mirrors it.
- **WS `/customer`:** `CustomerGateway` (`path /api/customer/socket.io`, same Redis adapter via `RedisIoAdapter`; verified, no DR needed). Handshake cookie → `GuestSessionService.resolve`; rooms `session:<id>` + `visit:<id>` or `seat:<id>`. **Bind choice:** after the first order the server runs `socketsJoin` on the `session:` room → `visit:` room (no client reconnect). The session's own first-order ping goes out before the bind, so the phone relies on the POST response for that one.
- **`tab.changed` sources:** order placed · every ticket transition/issue (`TicketService.emit`) · 86 auto-void (`SoldOutService.publish`, per visit that lost lines) · visit close. `NotificationsService.emitTabChanged` delegates to a sink the gateway registers, so Notifications never imports Customer.
- **Contracts:** `CustomerPlaceOrder`/`Result`, `CustomerTab*`, `CustomerCallStaff`, `CallStaffResult`, `AcknowledgeCallResult`, `StaffCall`/`CallStaffReason`, events `TAB_CHANGED`, `TABLE_STAFF_CALLED`, `TABLE_STAFF_CALL_CLEARED`. OpenAPI regenerated; README Customer, Tables, Realtime and Idempotency rows.
- ~1.5k net-new lines incl. tests (~700 of them e2e), plus the regenerated `openapi.json`.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | e2e `opens the visit on the first order of a seat-only session` |
| AC-2 | ✅ | e2e `settles a race with the POS on one live visit` (3 seats, parallel) |
| AC-3 | ✅ | e2e `shares one tab between phones and marks only mine` |
| AC-4 | ✅ | e2e `replays one key, spaces orders 10 s apart…` |
| AC-5 | ✅ | e2e `ignores orderedByName from the body…`; contracts `drops a smuggled orderedByName` |
| AC-6 | ✅ | unit `customer-tab.spec.ts` ×6; e2e tab + `keeps cancelled lines struck…`; contracts strict parse |
| AC-7 | ✅ | e2e `rings the bell…`, `shows staffCalled… clears the bell when the visit closes`; unit visit.service ×2 |
| AC-8 | ✅ | `customer-ws.e2e-spec.ts` ×3 (86-cancel / accept / close pings, other visit silent, bind, rejected handshakes) |
| AC-9 | ✅ | e2e `keeps the two audiences apart` |
| AC-10 | ✅ | gates + run proof below; OpenAPI + README |

## Gate Evidence (G1)
Run after stopping the dev backend (:3011) and `next dev` (:3010); e2e on `bar_test`.

| Command | Exit | Result |
|---|---|---|
| `@bar/contracts` build / test | 0 | 94 passed (11 files) |
| `@bar/backend` lint / typecheck | 0 | pass |
| `@bar/backend` test | 0 | 174 passed (42 files) |
| `@bar/backend` test:e2e | 0 | 202 passed (29 files) |
| `@bar/backend` openapi:check | 0 | |
| `@bar/frontend` `tsc --noEmit` | 0 | after the one-line mock fix (see Deviations) |

Run proof on dev `bar` (migration applied, `start:dev` :3011, T6): scan A → order (visit opened) → scan B → order → A's tab `[order 4 mine:false, order 3 mine:true]`, total 440.00; `GET /tables` T6 `active`; 86 on ถั่วทอดสมุนไพร → A's tab line `cancelled: true`, total 360.00, A's socket logged `tab.changed {visitId}` twice (B's order, the cancel); call-staff `bill` → card `staffCall {reason:'bill'}`, `staffCalled: true` → acknowledge → `null`. Afterwards the T6 visit was closed and the item made available again. UI change: n/a.

## Sonar (local scan)
- Not run — optional for this brief.

## Decisions Raised
- none

## Deviations from Brief
- **`docs/schema.sql` / `docs/erd.html`** not edited (§8 unlocks nothing; both protected). Needs the Field-approved Cowork edit for `order_record.guest_session_id` + the three `table_seat` columns, as for BRIEF-047.
- **`app/frontend/src/mocks/handlers.ts`** — one line (`staffCall: null`) so the frontend typechecks after `TableSummary.staffCall` became required. Outside "backend · contracts"; revert if you prefer the frontend brief to carry it.
- **Throttle slot is released when an order fails** (sold-out, charge line, validation) so fixing the cart does not cost another 10 s; a successful order always holds it. Brief said only "SET NX EX 10".
- **"POS item cancel"** (AC-8) has no endpoint yet (void/comp = BRIEF-018); the covered cancel path is the 86 auto-void.
- Test helper `staff-session.ts` deletes `guest_session` after `order_record` (new FK); `updated-at-trigger` revert test also reverts/re-applies the new migration.

## Notes for the auditor / next briefs
- A seat-only session whose seat later gets a visit from POS stays unbound (empty tab) until it orders; not in this brief.
- Two earlier full e2e attempts hung on orphaned `bar_test` connections left by my own killed run; I terminated those `bar_test` backends only.
- AI usage: n/a (kj, agent-written).

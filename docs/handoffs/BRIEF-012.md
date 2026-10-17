# Handoff — BRIEF-012 Orders and station tickets

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-10-17 |
| **Brief revision** | 3 |
| **Branch / PR** | `feat/BRIEF-012-orders` · no PR until audit PASS |
| **Commit** | `31cdec59f2e3320b7b96fb2e9b2afb31b522a220` (work) |
| **Status** | Implemented — awaiting audit |

## Summary
Staff can place an order on a live visit. The order gets the next number for the Bangkok business date, splits into station tickets, and each non-charge ticket moves `pending → accepted → (ready) → sent`. The first order makes the visit `active`. The table grid shows the visit total and item count from non-cancelled lines.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `test/order.e2e-spec.ts` — kitchen off: one `bar` ticket (beer + food, `pending`) and one charge ticket (`sent`, `sent_at` set). Prices snapshotted. |
| AC-2 | ✅ | same file — kitchen on: `bar`, `food`, and charge |
| AC-3 | ✅ | `activates an open visit once and rejects a closed visit` — `visit.state_changed` once; closed visit is 409 `INVALID_STATE_TRANSITION` |
| AC-4 | ✅ | `describe('visit activation race')` — `Promise.all` of close and place; no order row on a visit closed first |
| AC-5 | ✅ | `business-date.spec.ts` — 05:59 previous day, 06:00 current day, cutoff `06:00` · `describe('order number')` — 5 concurrent orders, unique consecutive numbers |
| AC-6 | ✅ | e2e sold-out `sold_out` and closed window `out_of_window` · `order.service.spec.ts` — modifier required/min/max and a foreign option are 400; nothing written |
| AC-7 | ✅ | `describe('idempotency')` — same key + body replays; different body is 409 `IDEMPOTENCY_KEY_REUSED` |
| AC-8 | ✅ | `ticket.service.spec.ts` READY rules · `test/ticket.e2e-spec.ts` — counter and kitchen-off skip READY; two concurrent accepts are 200 + 409 and one `ticket.status_changed`; `acceptedBy` is the accepting staff |
| AC-9 | ✅ | `lists the queue, the order, and the table bill` — default queue, status/visit filters, charge excluded from the queue, order read includes charge, table `total` / `itemCount`, visit `orders[]` |
| AC-10 | ✅ | `test/notifications.e2e-spec.ts` — staff socket gets `order.created` and `ticket.status_changed`; a rolled-back placement emits nothing |
| AC-11 | ✅ | `test/order.e2e-spec.ts` — unknown visit/order/ticket 404 `NOT_FOUND`; invalid body 400 `VALIDATION_ERROR` |
| AC-12 | ✅ | `docs/api/openapi.json` lists the 6 endpoints; each description starts with `Permission:`. `docs/api/README.md` Orders table uses the DR-013 paths. `openapi:check` exit 0 |
| AC-13 | ✅ | Gate table below |

## Gate Evidence (G1)
Run on the work tree that became `31cdec5`, before the handoff commit. Node v24.14.0, pnpm 10.0.0. E2e used Postgres `bar` on localhost:5432 and Redis `redis://127.0.0.1:6379`.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts test` | 0 | 16 passed · 0 failed |
| `pnpm --filter @bar/backend lint` | 0 | pass |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 60 passed · 0 failed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 52 passed · 0 failed |
| `pnpm --filter @bar/backend build` | 0 | pass |
| `pnpm --filter @bar/backend openapi:check` | 0 | pass (export produced no diff) |

## Sonar (local scan)
- Not run. The brief marks the local scan optional. Shared SonarQube is not available yet.

## Decisions Raised
- none. No new package. No schema column beyond `docs/schema.sql` §6.

## Deviations from Brief
- None. `GET /tickets` returns `{ items }` with no `nextCursor`. The contract table says `Ticket[]` (unpaged); the README list rule is `data.items`, and an unpaged list omits the cursor.

## Known Gaps / Follow-ups
- `@RequirePermissions` is metadata only until the IAM brief, as the brief already records.
- `acceptedBy` is Redis key `order:accepted-by:{ticketId}` because `updated_by` is overwritten on the next `save()`. Fallback: Redis id, else `updated_by` only while status is `accepted`, else null. A flushed Redis loses the name after the ticket leaves `accepted`. Ceiling is a real column in a later schema brief. Comment is on `accepted-by.store.ts`.
- Seed stand-in for the AC wording: beer `ช้างดราฟต์` ฿120, food `ถั่วทอดสมุนไพร` ฿80 (`ยำหมูยอ` is sold out in the BRIEF-016 seed), corkage `ค่าเปิดขวด` ฿300. Sample total `500.00`, item count 3.
- Void, comp, PIN, flag-issue, and sold-out auto-cancel stay in BRIEF-017. Payments stay in BRIEF-013. Customer QR orders stay out.
- Charge tickets are created `sent` and never appear on `GET /tickets`.

## AI Usage
**High** — Cursor implemented the order module, visit claim, contracts, tests, OpenAPI, and this handoff.

## Review Routing
- Assigned auditor: Cowork
- Next: `ตรวจ BRIEF-012` on `31cdec59f2e3320b7b96fb2e9b2afb31b522a220`. No PR until PASS.

## Notes for Reviewer
- `VisitService.claimForOrder` locks the visit with `SELECT … FOR UPDATE` on the placement transaction, then updates `open|idle` to `active`. `OrderService` does not write `visit`. Ticket status changes only in `TicketService`.
- Daily numbers: inside the placement transaction, `pg_advisory_xact_lock` on `YYYYMMDD`, then `MAX(order_number)+1`. The comment is on that query. Unique index remains the safety net.
- Business date is Asia/Bangkok local time. Before `venue.business_day_cutoff` the date is the previous calendar day. Clock is injected.
- Kitchen off: one `bar` ticket for every non-charge line, including a null `kitchen_tag`. Kitchen on: `bar` / `food` by tag. One charge ticket per order (`station` null) because of `UNIQUE NULLS NOT DISTINCT (order_id, station)`.
- Idempotency key is optional. Redis keeps it 24h. The hash is sha256 of `{ visitId, items }`. A failed placement deletes the in-flight key.
- Events fire after the placement method returns: `order.created` and `ticket.status_changed` to room `staff`; `visit.state_changed` stays on `pos` and fires only when the visit actually becomes `active`. Every authenticated `/staff` socket joins `pos` and `staff`.
- `ITEM_UNAVAILABLE` puts `details: [{ variantId, reason }]` on the error envelope `data`. Other errors keep `data: null`.
- Money is decimal strings. Line total is `quantity × (unit + Σ deltas)` with no float math. Item names on reads come from the live menu; prices stay snapshotted.
- Modifiers in the seed are on `โอลด์แฟชั่น` (required ice group).

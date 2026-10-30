# Audit — BRIEF-048 Backend: customer order, running tab, call staff + WS /customer (C2)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-30 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-30 |
| **Branch / commit** | `feat/BRIEF-048-customer-order-tab-call` · **S = `43922fe`** · handoff `5c016e1` · merge of `main` (047) `1232ec3` · seed `cb9f482` |
| **Depth** | Full (orders + guest auth) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** — no Must fix. `docs/schema.sql` + `docs/erd.html` close through a Field-approved edit in the PASS commit (Finding 1). |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `OrderService.insertForGuest`: menu lock → `openForGuest` (`INSERT … opened_via 'qr'` no `opened_by`) → `claimForOrder` → `bindVisit` in the same transaction → insert with `guestSessionId`, staff `created_by` stays NULL; `publish` emits `visit.opened`, `visit.state_changed`, `order.created`, `tab.changed` | |
| AC-2 | ✅ | `INSERT … ON CONFLICT (table_seat_id) WHERE state IN (live) DO NOTHING` then `SELECT` live — the loser never aborts the transaction; READ COMMITTED sees the winner after its commit; parallel e2e on 3 seats | |
| AC-3 | ✅ | `foldCustomerTab` `mine` = `placedBy.get(order.id) === sessionId`; other ids never serialized | |
| AC-4 | ✅ | idempotency `begin` before the 10 s gap (replay never 429s), scope `customer-order:<session>`; charge variant → 400 inside the transaction; sold-out → existing 409 | Finding 2 on slot release |
| AC-5 | ✅ | `CustomerPlaceOrderSchema` = `PlaceOrderItemSchema.omit({ orderedByName })` (strict) + `line()` takes `guest.displayName` | |
| AC-6 | ✅ | tab built field by field from snapshots; charge ticket's lines kept, status dropped; cancelled via `cancelledAt`; `total` from order totals (cancelled excluded); strict contract | |
| AC-7 | ✅ | `TableSeatService.callStaff` / `acknowledgeCall` (404 unknown seat, 200 when nothing to clear), `VisitService.close` → `clearBell` + `table.staff_call_cleared`; 60 s `acquire`; `GET /tables` `staffCall` | |
| AC-8 | ✅ | `CustomerGateway` own path `/api/customer/socket.io`, handshake cookie → `resolve`, rooms `session:` + `visit:`/`seat:`, `socketsJoin` bind after first order; pings from order, every ticket transition (`TicketService.emit`), 86 auto-void, close (`sessionEnded`) | "POS item cancel" has no endpoint yet → Finding 3 |
| AC-9 | ✅ | `/customer` class-level `@Public()` + `GuestSessionGuard`; `acknowledge-call` behind the staff JWT + `tables:read`; e2e both ways | |
| AC-10 | ✅ | gates per handoff (contracts 94, unit 174, e2e 202, openapi:check); **Cowork re-ran `tsc --noEmit` backend and frontend on `5c016e1` (both exit 0)**; vitest / e2e not re-runnable in the Cowork shell → GitHub `ci` is the independent check | `docs/schema.sql` / ERD → Finding 1 |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| One order writer | ✅ | `placeAsGuest` shares `lockMenu` / `draft` / `publish` with `place`; `CustomerOrderService` only translates the session |
| Module boundaries | ✅ | `CustomerModule` → `OrderModule`, `VenueModule`, `MenuModule`; Notifications never imports Customer (sink registered by the gateway) |
| Guest WS = ping only | ✅ | one event `tab.changed { visitId, sessionEnded? }`; no staff payload on `/customer` |
| DR-028 locks | ✅ | `guest_session_id` nullable FK; nickname snapshot at send; Redis = throttles only, fail open |
| Migration ↔ entities ↔ brief | ✅ | FK + partial index; three seat columns with `CHECK ('bill','other')`; `down` reverses in order; seat entity / order entity updated |
| `save()` on audited entities | ✅ | seat bell set/clear via findOne + save |
| Lock order menu → visit | ✅ | unchanged for both paths (no deadlock with an 86) |
| No new dependency · no secrets logged | ✅ | `socket.io-client` already a devDependency |
| Scope | ✅ / ⚠️ | one line outside "backend · contracts": `app/frontend/src/mocks/handlers.ts` (`staffCall: null`) — required for the frontend typecheck after `TableSummary.staffCall`; accepted (Finding 4) |
| Protected files | ✅ | `docs/schema.sql` / `docs/erd.html` untouched (§8 none) — correct call |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Field-approved edit (docs) | Low | **Current:** schema docs lack `order_record.guest_session_id` and the three `table_seat` bell columns; `docs/erd.html` lacks `guest_session` (047) too. **Updated:** Cowork writes both (schema.sql: two column additions; erd.html: `guest_session` entity + relations + the new columns, header 38 → 39 tables) as a Field-approved edit; the executor commits them in the PASS commit with `Approved-by: Field (session)`. |
| 2 | Suggestion | Low | **Current:** the 10 s order slot is released on **any** failed order (409 sold-out, 400 charge line, 409 visit state), so a session can send failing orders back-to-back, each opening a transaction with menu share locks. **Updated (later, optional):** release only on `ITEM_UNAVAILABLE` (the case the release exists for — fixing the cart after a sold-out line); keep the slot on other failures. Low risk at bar scale; the per-IP scan cap and POS visibility still apply. |
| 3 | Suggestion (next brief) | Low | **Current:** AC-8's "POS item cancel" is covered by the 86 auto-void and ticket transitions (incl. issue resolve); a direct POS void/comp has no endpoint yet. **Updated:** BRIEF-018 (void/comp + PIN) calls `NotificationsService.emitTabChanged(visitId)` next to its staff emit — add it to that brief's ACs. Payment status changes join in C5. |
| 4 | Info | — | `TableSummary.staffCall` is required in contracts, so `mocks/handlers.ts` needed `staffCall: null` to keep `@bar/frontend` typecheck (and `ci`) green. Keeping it here is right; C6 (POS bell UI) builds on the same field. |
| 5 | Info | — | First-order ping: the placing phone binds to `visit:` after its own `tab.changed` goes out — the POST response is that phone's signal (handoff). BRIEF-049 already navigates/refreshes after a 201, so no gap for the UI. |
| 6 | Info | — | A seat-only session whose seat later gets a visit from the POS stays unbound (empty tab, own room `seat:`) until it orders — consistent with DR-028 (bind at first order). C4 may show "ยังไม่มีออเดอร์" for that phone; decide there if a rebind on `GET /customer/tab` is wanted. |
| 7 | Info (environment) | — | Two earlier e2e runs hung on orphaned `bar_test` connections from a killed run; the executor stopped dev servers and terminated only `bar_test` backends — matches Carry over (dev env isolation). |

## Recommendation to Field
Clean: one order writer, a race-safe open that can't abort the transaction, a guest socket that only pings, and both auth directions tested. Approve the schema docs edit (Finding 1) and the executor ships with the PASS commit. Findings 2–3 are small follow-ups; 3 belongs in BRIEF-018's ACs.

**Field approved the schema docs edit in session (2026-10-30, "approve schema docs edit")** — `docs/schema.sql` + `docs/erd.html` written to the checkout by Cowork, uncommitted.

**Next command:** `execute BRIEF-048` (PASS commit + PR; include `docs/schema.sql` + `docs/erd.html` with `Approved-by: Field (session)`).

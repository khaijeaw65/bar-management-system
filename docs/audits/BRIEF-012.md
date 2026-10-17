# Audit — BRIEF-012 Backend: orders + station tickets (place → accept → ready → send)

| | |
|---|---|
| **Auditor** | Cowork (Claude, Cowork session 2026-10-17) |
| **Assignment** | Brief: Cowork (default) |
| **Date** | 2026-10-17 |
| **Branch / commit** | `feat/BRIEF-012-orders` · `31cdec59f2e3320b7b96fb2e9b2afb31b522a220` (work) · head `a5e7f61` (docs only: handoff + state) · no PR (audit before PR) |
| **Depth** | Full (core flow, concurrency, money) |
| **Brief revision** | 3 (Ready 2026-10-17) |
| **Recommendation** | **PASS** (re-audit on `1323202`) — Finding 1 + S2 fixed; S3 closed (Field: won't fix) ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `order.e2e-spec.ts` "splits beer, food, and corkage when the kitchen screen is off" | Charge ticket `sent` + `sent_at`; snapshots stored. |
| AC-2 | ✅ | "splits bar and food when the kitchen screen is on" | |
| AC-3 | ✅ | "activates an open visit once and rejects a closed visit" | `visit.state_changed` only on a real `open|idle → active`. |
| AC-4 | ✅ | `describe('visit activation race')` | `claimForOrder` = `SELECT … FOR UPDATE` then conditional `UPDATE … WHERE state IN ('open','idle')`; close's conditional update waits on the row lock. |
| AC-5 | ✅ | `business-date.spec.ts`, `describe('order number')` | Advisory lock on `YYYYMMDD` + `MAX+1`, comment present; lock order visit row → date lock is the same for every placement (no deadlock). |
| AC-6 | ✅ | "rejects an unavailable line and a bad modifier set without writing", `order.service.spec.ts` | Uses `getOrderable` (BRIEF-016); `details: [{ variantId, reason }]`. |
| AC-7 | ✅ | `describe('idempotency')` | See S1 for the in-flight timeout code. |
| AC-8 | ⚠️ | `ticket.service.spec.ts`, `ticket.e2e-spec.ts` | Transitions + concurrent accept ✅. `acceptedBy` source → Finding 1. Kitchen-on table READY → send covered by unit rule only (no e2e). |
| AC-9 | ✅ | "lists the queue, the order, and the table bill" | Bill = `quantity × (unit + Σ deltas)` in SQL `NUMERIC`, cancelled lines excluded. |
| AC-10 | ✅ | `notifications.e2e-spec.ts` | Events emitted after the `@Transactional` method returns (post-commit); rollback emits nothing. |
| AC-11 | ✅ | "returns not found and validation errors" | |
| AC-12 | ✅ | `openapi.json`, README Orders (DR-013 names) | `GET /tickets` → `{ items }` unpaged (README list rule) — fine. |
| AC-13 | ✅ (handoff) | handoff gate table on `31cdec5` | Not re-run by Cowork (no pnpm / Linux `node_modules` in the linked shell). |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | No void / issue / payment / public order. |
| No unapproved deviations / deps | ❌ | No new package ✅. Ticket acceptor stored in Redis instead of `order_ticket.updated_by` (brief §2) — a data-model choice without a DR; handoff lists it under Known Gaps, "Deviations: None" → Finding 1. |
| Schema = `schema.sql` §6 | ✅ | Tables, enum, circular FK, `UNIQUE NULLS NOT DISTINCT`, 4 indexes match. |
| `OrderService` never writes `visit` · ticket status only in `TicketService` | ✅ | `VisitService.claimForOrder`; `TicketService.apply`. |
| Row locks + `save()` on audited entities | ✅ | `LOCK_TICKET_SQL … FOR UPDATE OF t` then repository `save()`; `updated_by` stamped by `AuditSubscriber` via CLS. |
| Prices from the DB, money as string | ✅ | |
| `NotificationsService`, not the gateway · events after commit | ✅ | |
| Hexagonal layering · ports + tokens | ✅ | |
| Thai `message`, English `code` | ✅ | |

## Test Quality
- Strong concurrency coverage on real Postgres: activation race, 5 concurrent order numbers, concurrent accept.
- Missing: e2e for kitchen-on **table** `accepted → ready → sent` (unit covers `readyStepApplies`). Add when touching AC-8.
- `ticket.e2e-spec.ts:64` asserts `acceptedBy` after `ready` — depends on the Redis store (Finding 1).

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | **Must fix** | **Med** | **Ticket acceptor kept in Redis, written after the transaction.** `ticket.service.ts` → `accept()` runs `apply()` (commits `pending → accepted`), then `acceptedBy.remember()` (`accepted-by.store.ts`, key `order:accepted-by:{ticketId}`, no TTL). (a) If the Redis write fails, the request returns 500 although the ticket is already `accepted`; the client retries and gets 409 — the staff member sees an error for an action that succeeded. (b) Keys never expire — one per ticket forever. (c) A Redis flush loses the name. (d) Domain data outside Postgres is a data-model change; the brief says `updated_by` = acting staff → "กำลังเตรียม · ชื่อ" (CD-08 R14), and that is exactly what the DB already holds while the ticket is `accepted` (the accept `save()` is the last write). **Current →** Redis store + DB fallback. **Updated →** remove `AcceptedByStore`; `acceptedBy` = `updated_by` while `status = accepted`, `null` otherwise (the chip only shows the name in กำลังเตรียม). Adjust `ticket.e2e-spec.ts:64`. If a durable acceptor is wanted after `ready` / `sent` (e.g. owner insight "who handled #0042"), that is an `order_ticket.accepted_by` column → raise a DR, don't build it here. |
| 2 | Suggestion | Low | **In-flight idempotent request times out as `IDEMPOTENCY_KEY_REUSED`.** `idempotency.service.ts` → `poll()` waits 20 × 50 ms; a same-key, same-body retry that arrives while the first placement still holds the advisory lock (> 1 s at peak) throws `reused()` — wrong code for "same request, still running"; the POS would show "key used for another request". **Updated →** after the poll, 409 `CONFLICT` "คำสั่งนี้กำลังดำเนินการ ลองอีกครั้ง". Also move `IdempotencyService` to `common/` (BRIEF-013 reuses it for payments) — or leave it for BRIEF-013 to move. |
| 3 | Suggestion | Low · info | **Item names on reads come from the live menu.** `ORDER_ROWS_SQL` joins `menu_item` / `menu_item_variant` / `modifier_option` for names; prices are snapshotted, names are not. Renaming a menu item changes old orders and future receipts. Acceptable for S1 (schema has no name snapshot); revisit before receipts (BRIEF-013) or back-office menu edit (CD-12). **Field decision 2026-10-17 — won't fix here:** names follow the menu through the existing FKs (`order_item.menu_item_variant_id`, `order_item_modifier.modifier_option_id`); prices stay snapshotted. Requirement carried to the back-office menu brief (CD-12): renaming an item / variant / option shows a confirmation that existing orders will show the new name; ordered items cannot be hard-deleted (FK) → offer deactivate (ปิดการขาย) instead. Snapshot columns only via a DR if owner insight needs historic names. |

## Summary
Solid implementation of the hardest concurrency paths: visit claim under row lock, daily numbers under an advisory lock, ticket transitions under row locks, events after commit, all proven with real-Postgres races. One change before PASS: drop the Redis acceptor store (fails after commit, never expires, outside the approved data model) and read the acceptor from `updated_by` while the ticket is `accepted`.

**Next:** executor fixes Finding 1 and S2 (Field, 2026-10-17: fix both; S3 closed as won't fix) — fix commit(s) only, no handoff/state commit — reports the new S → `ตรวจ BRIEF-012` re-audit appends here.

---

## Re-audit — 2026-10-17 · fix commit `1323202feba207f1acdf09517179dad255c897c4`
- Scope: 8 files, all in `modules/order/` + `test/ticket.e2e-spec.ts`; `accepted-by.store.ts` deleted. No schema, docs or dependency change. Fix commit only (no handoff / state commit) ✅.

| # | Status | Evidence |
|---|---|---|
| 1 | ✅ | `AcceptedByStore` removed from module, `TicketService`, `OrderQueryService`; no remaining reference (`grep accepted-by / AcceptedByStore` → none). `present-order.ts` → `accepterId`: `status === 'accepted' ? updatedById : null`. `ticket.e2e-spec.ts:64` now expects `acceptedBy` `null` after `ready`; concurrent-accept test still asserts the winner's name. The accept request no longer has a write after commit. |
| S2 | ✅ (part) | `poll()` timeout → 409 `CONFLICT` "คำสั่งนี้กำลังดำเนินการ ลองอีกครั้ง"; different body still `IDEMPOTENCY_KEY_REUSED` — new `idempotency.service.spec.ts` covers both. Move to `common/` not done → **carried to BRIEF-013** (it reuses the service). Small leftover: if the first request fails while a retry is polling, the key disappears and the retry gets `IDEMPOTENCY_KEY_REUSED`; `inFlight()` would fit better there too — fold into the BRIEF-013 move. |
| S3 | closed | Field decision 2026-10-17 (above): names follow the menu via FK; CD-12 rename confirmation + deactivate instead of delete. |

- **AC-8** now ✅. Open (not blocking): e2e for kitchen-on table `accepted → ready → sent` (unit-covered).
- **Evidence:** gates not re-run by Cowork (no pnpm / Linux `node_modules` in the linked shell); executor's gate results for `1323202` go in the final handoff at PASS.

**Next (§3 step 5):** executor makes one `docs(BRIEF-012): audit PASS, handoff, state` commit — this report unchanged + final handoff (gate evidence on `1323202`) + state — pushes; the git hand opens the PR. Field's own PR → merge pre-approved once CI is green on that head (§7).

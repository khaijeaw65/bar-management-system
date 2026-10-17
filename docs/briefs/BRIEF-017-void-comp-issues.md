# BRIEF-017 — Backend: void / comp with PIN approval, issue flow, sold-out (86) + menu cache

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent — Cursor) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 1 |
| **Depends on** | **BRIEF-012 merged** (tickets, `TicketService`, `order_item`, room `staff`) · **BRIEF-016 merged** (menu tables, `MenuAvailability`, `getOrderable`) · **BRIEF-013 merged** if Q1 = A (`409 PAYMENT_IN_FLIGHT` check) · **DR-016 Approved** + `schema.sql` updated |
| **References** | FRD §6 (issue paths, cancelled display) §7 (comp/void blocked while paying) §8 (comps & voids, solo self-approve) · DR-012 · DR-013 Rules 3–4 · DR-014 #3 #8 #11 · DR-016 · BRIEF-012 Q2 · BRIEF-016 Q1 (cache path) · CD-02 R5 + Q1 (manager's 4-digit POS PIN) · CD-08 R12 + issue flow · CD-15 R3 R5 J1 J2 · `docs/api/README.md` (Menu 86, Orders) |
| **Audit depth** | Full (money, fraud controls, PIN) |
| **Size** | ~3 days |

---

## 1. Goal
Staff can report a problem on a ticket and the POS resolves it; a manager approves a void or comp in place with their 4-digit PIN (or a solo bartender self-approves, flagged); marking an item sold out cancels its waiting lines automatically. The bill and ticket status stay correct after every one of these.

## 2. Scope
### In
- **Migration** per DR-016 (once Approved): `item_adjustment` enum, `order_item.cancel_kind`, `order_item.approved_by`, CHECK `cancel_kind IS NULL ⇔ cancelled_at IS NULL`.
- **Issue flow** (`TicketService`, DR-013 names):
  | Endpoint | From → To | Body / effect |
  |---|---|---|
  | `POST /tickets/:id/flag-issue` | `pending|accepted|ready → issue` | `{ reason: 'out_of_stock'|'equipment'|'other', itemId?, note? }` — `note` required for `other`; `itemId` must be on this ticket; sets `issue_*`, `issue_reported_by` |
  | `POST /tickets/:id/resolve` | `issue → accepted` (`substitute`) · stays `issue` (`escalate`) | `{ resolution: 'substitute'|'escalate', note? }` — `escalate` sets `issue_escalated_at` ("ส่งให้ POS"); `substitute` clears the issue fields (CD-08, CD-15 ทำต่อ) |
- **Void / comp** `POST /order-items/:id/void` · `POST /order-items/:id/comp` — `{ reason, note?, approval: { pin } | { selfApprove: true } }`:
  - Reasons (CD-15 R3 order): `ของหมด`, `สั่งผิด`, `ลูกค้าเปลี่ยนใจ`, `ของเสีย`, `บริการพิเศษ`, `อื่นๆ` (note required). Stored as given in `cancel_reason`.
  - **Approval (Q2):** `pin` → find the active staff whose PIN matches → `approved_by`; approver must not be the caller (else 403 `PIN_SELF`); no match → 403 `PIN_INVALID`. `selfApprove` → `approved_by` NULL (flagged). Approver check is evaluated at the start of the action (FRD §2).
  - **PIN rate limit (Q5):** 5 wrong PINs per caller session → 60 s lock (Redis) → 429 `RATE_LIMITED`.
  - Blocked while the visit has a payment in flight → 409 `PAYMENT_IN_FLIGHT` (Q1).
  - Line already adjusted → 409 `INVALID_STATE_TRANSITION`.
  - **Void:** off the bill. If every line of the ticket is now voided → ticket `cancelled` from any status (DR-013 Rule 3). If the voided line is the ticket's `issue_item_id` and lines remain → ticket `issue → accepted`, issue fields cleared (CD-15 J1).
  - **Comp:** line stays, billed ฿0; ticket status unchanged (the item is still served).
- **Sold-out (86)** `POST /menu/items/:id/mark-unavailable` · `/mark-available` (`menu:toggle_availability`):
  - Sets `menu_item.is_available`; emits `menu.availability_changed`.
  - `mark-unavailable` auto-voids that item's lines on **`pending` tickets** (Q4): `cancel_kind = void`, `cancel_reason = ของหมด`, `cancelled_by` NULL (system), no approval; same ticket-cancel rule; one Toast-ready event per affected ticket ("แจ้งลูกค้าโต๊ะ …").
- **Menu cache (BRIEF-016 Q1 path):** Redis cache-aside of the raw menu (`menu:catalog`); deleted on `mark-unavailable` / `mark-available` and by `seed:menu`; availability still computed per request; `getOrderable()` keeps reading the DB.
- **PIN seed (Q3):** `seed:staff -- --pin 1234` stores `pos_pin_hash` (`node:crypto` scrypt + per-user salt); no PIN-setting API here.
- **Totals & reads:** table / visit / order totals: `cancel_kind IS NULL` full price · `comp` ฿0 · `void` excluded; `Ticket` / `Order` items expose `adjustment: { kind, at, reason, note, by, approvedBy, selfApproved, system } | null`; `GET /tickets?status=issue&escalated=true` for the POS issue column/strip (CD-15).
- **Events** (room `staff`): `ticket.status_changed` (existing) · `order_item.adjusted` `{ itemId, ticketId, orderId, visitId, kind, reason, by, approvedBy, system }` · `menu.availability_changed` `{ menuItemId, isAvailable, autoVoided: [{ ticketId, seatLabel, itemCount }] }`.
- **Contracts + docs:** schemas above; error codes `PIN_INVALID`, `PIN_SELF`, `PAYMENT_IN_FLIGHT` (if not yet added by BRIEF-013); `docs/api/README.md` (replace `/order-items/:id/cancel` with `/void` + `/comp`; events); `openapi.json`.

### Out (do NOT build here)
- PIN switching on the shared POS + PIN self-service (CD-01 shell brief) · requiring the approver to hold `orders:void` / be a Manager (IAM brief — until then any other staff PIN approves, Q2) · shift / "manager on shift" detection.
- `audit_log` table + `AuditSubscriber` log writes (separate brief) · AI anomaly alerts (DR-014 #11) · substitution model (replace = void + new order, CD-15 D2).
- Push notifications to the escalating staff (notifications brief) · back-office menu edit (CD-12).

## 3. Contract
| Method | Path | Request → Response | Permission |
|---|---|---|---|
| POST | `/tickets/:id/flag-issue` | `{ reason, itemId?, note? }` → `Ticket` | `orders:update_status` |
| POST | `/tickets/:id/resolve` | `{ resolution, note? }` → `Ticket` | `orders:update_status` |
| POST | `/order-items/:id/void` | `{ reason, note?, approval }` → `Ticket` | `orders:void` |
| POST | `/order-items/:id/comp` | `{ reason, note?, approval }` → `Ticket` | `orders:comp` |
| POST | `/menu/items/:id/mark-unavailable` · `/mark-available` | — → `MenuItem` | `menu:toggle_availability` |
- `approval`: `{ pin: '^\d{4}$' }` or `{ selfApprove: true }`. Money as string. OpenAPI: all 6 endpoints, permission in each description.

## 4. Acceptance Criteria
- **AC-1** — Given a `pending` ticket, when staff flag `out_of_stock` on an item, then status `issue`, issue fields + reporter set, `ticket.status_changed` emitted; `other` without note → 400; an item from another ticket → 400; flag on `sent`/`cancelled` → 409.
- **AC-2** — Given an `issue` ticket, `resolve escalate` sets `issue_escalated_at` and keeps `issue`; `resolve substitute` → `accepted` with issue fields cleared; resolve on a non-issue ticket → 409.
- **AC-3** — Given a manager PIN, when a line is voided, then `cancel_kind = void`, `approved_by` = manager, line off every total, `order_item.adjusted` emitted; the ticket of its last active line becomes `cancelled` from any status.
- **AC-4** — Given an `issue` ticket whose issue item is voided and other lines remain, then the ticket is `accepted` and issue fields are cleared (CD-15 J1).
- **AC-5** — Comp → `cancel_kind = comp`, line ฿0 in totals, ticket status unchanged.
- **AC-6** — Wrong PIN → 403 `PIN_INVALID`; caller's own PIN → 403 `PIN_SELF`; 6th wrong PIN within 60 s → 429; `selfApprove` → `approved_by` NULL and `adjustment.selfApproved = true`.
- **AC-7** — Line already voided/comped → 409; two concurrent voids of one line → one 200 + one 409.
- **AC-8** — Payment in flight on the visit → void/comp 409 `PAYMENT_IN_FLIGHT`, nothing written (Q1).
- **AC-9** — `mark-unavailable` sets the flag, auto-voids the item's lines on `pending` tickets only (system, ของหมด), cancels tickets left empty, emits `menu.availability_changed` with the affected tickets; `accepted` lines untouched; `mark-available` reverses the flag only.
- **AC-10** — Menu read hits Redis after the first call; `mark-*` and `seed:menu` invalidate it; availability windows still change with the clock on cached data; `getOrderable` never reads the cache.
- **AC-11** — `seed:staff --pin` stores a scrypt hash, never the PIN; re-run with a new PIN replaces it.
- **AC-12** — OpenAPI lists the 6 endpoints; `openapi:check` passes; README updated.
- **AC-13** — lint / typecheck / test / test:e2e / build exit 0; contracts tests pass.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2 | unit + e2e | `src/modules/order/application/ticket.service.spec.ts` · `test/ticket-issue.e2e-spec.ts` |
| AC-3–AC-8 | unit + e2e | `src/modules/order/application/item-adjustment.service.spec.ts` · `test/void-comp.e2e-spec.ts` |
| AC-6 (rate limit) | e2e | `test/void-comp.e2e-spec.ts` → `describe('pin')` |
| AC-9, AC-10 | e2e | `test/menu-availability.e2e-spec.ts` (real Postgres + Redis) |
| AC-11 | e2e | `test/staff-seed.e2e-spec.ts` |
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
- **Required** — PIN handling and fraud controls.

## 6. Constraints
- PIN: never logged, never returned, compared via scrypt + `timingSafeEqual`; no new package (`node:crypto`).
- Ticket status changes only in `TicketService`; line adjustments in one service; row locks + `save()` on audited entities (BRIEF-012 pattern).
- System auto-void runs in the same transaction as the flag change; events after commit.
- Totals computed in SQL/`NUMERIC`, never floats.
- Thai `message`, English `code`; Alerts state facts, never accuse (DR-014 #11 tone).

## 7. Decision Points (Field Guard)
- **Q1 — Order vs BRIEF-013.** *Recommend* **016 → 012 → 013 → 017**: payment is on the 8 Nov gate path (order → pay → close); void / issue are not. With 013 merged first, this brief adds the real `409 PAYMENT_IN_FLIGHT` check instead of a stub. *Alternative:* 017 before 013 → no payment check here; BRIEF-013 must add it to void/comp. (Corrects BRIEF-012 Q2's "right after this brief".)
- **Q2 — Approver before the IAM brief.** *Recommend* any **other** active staff's PIN approves (stored in `approved_by`); the IAM brief later adds "approver must hold `orders:void`". `selfApprove` is an explicit choice, flagged. *Why:* no groups or shifts exist yet, so "manager on shift" can't be known; the flag + approver id already give the owner a full record. *Alternative:* block void/comp until the IAM brief.
- **Q3 — PIN setup.** *Recommend* `seed:staff --pin` only (demo / dev); self-service PIN comes with the POS switch (CD-01 shell). Hash = `node:crypto` scrypt (no new dependency). Note: a 4-digit PIN is 10,000 values — the rate limit (Q5) is the real protection, the hash only keeps it out of DB dumps.
- **Q4 — Which lines sold-out auto-cancels.** *Recommend* lines on **`pending`** tickets only: once a ticket is `accepted` someone may already be pouring or cooking it, so that staff member decides (flag issue / void). *Alternative:* `pending` + `accepted` — fewer manual steps, but can cancel something already on the bar top.
- **Q5 — PIN brute force.** *Recommend* 5 wrong PINs per session → 60 s lock in Redis (429). *Alternative:* per-device lock — needs a device id we don't have.
- **DR-016** (Pending) — `cancel_kind` + `approved_by` on `order_item`; `schema.sql` / ERD edit only after Field OKs the exact diff.
- **Pre-decided (if approved as recommended):** error codes `PIN_INVALID`, `PIN_SELF` · permissions `orders:void`, `orders:comp`, `menu:toggle_availability` · no new packages · `app/backend/package.json` unchanged (`seed:staff` gains a flag, not a script).
- **Likely DRs:** CLS actor = NULL for system auto-void with `AuditSubscriber` · splitting this brief if it runs past 3 days (issue flow + 86 first, void/comp second).

## 8. Unlocked Protected Files
- `none` — `docs/schema.sql` is edited by Cowork with Field's OK on the DR-016 diff, before Ready.

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions
- [ ] No unresolved decision blocking the main outcome (Q1–Q5 + DR-016 open)
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-17 | Initial Draft (Cowork) — from BRIEF-012 Q2 + BRIEF-016 Q1 (Field, 2026-10-17), CD-02 R5, CD-08 issue flow, CD-15 R3/R5, DR-014 #3; DR-016 raised |

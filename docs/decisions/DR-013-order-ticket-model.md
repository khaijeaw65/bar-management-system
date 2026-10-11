# DR-013 — Order → ticket data model (DR-012 Amendment 2 candidate)

| | |
|---|---|
| **Status** | Approved — Field · 2026-10-11 |
| **Raised by** | Field via Cowork · 2026-10-10 |
| **Brief** | BRIEF-012 (orders, not written) · affects schema.sql/erd.html, CD-08, CD-15, CD-02, CD-06, BRIEF-010 |
| **Category** | Data · Flow/Architecture |

## Context
DR-012 (+ Amendment 1) put status on `order_record` as a **station ticket** linked by `placement_id`, always split. Follow-up review (Field, 2026-10-10) found:
1. **Most target bars have one POS**; the kitchen is told verbally. Always splitting gives them 2 cards and double taps for nothing. `venue.kitchen_display_enabled` (already in schema) should decide.
2. **No order number in the schema** — every screen shows "#0042", nothing stores it.
3. **No columns for issue data** — CD-08/CD-15 send and show reason, item, note, "ส่งให้ POS".
4. **No served time** — table summary shows "เสิร์ฟ 21:22 น.".
5. **`order_item.status` is mostly unused** (only cancelled matters), but a cancel needs who / when / why.
6. **Naming:** `order_record` currently means *ticket*; "order #001 → two tickets" is how Field and staff talk about it. `placement_id` becomes redundant once the order has a number.

## Options
**A) Columns on `order_record`** (row = ticket) — add `order_number`, `business_date`, issue fields, `sent_at`; drop `placement_id` (number + date group the tickets). *Pros:* no new table. *Cons:* `order_record` keeps meaning "ticket"; number / creator repeated per ticket; `payment_order` points at tickets.

**B) Order → tickets (new `order_ticket`, 35 tables)**
```sql
CREATE TABLE order_record (            -- what was sent in one go: "#001"
  id UUID PK, visit_id UUID NOT NULL → visit,
  order_number INT NOT NULL, business_date DATE NOT NULL,   -- daily reset, 06:00 cut-off
  created_at/updated_at/created_by/updated_by,              -- created_by NULL = customer QR
  UNIQUE (business_date, order_number)
);
CREATE TABLE order_ticket (            -- one station's part; owns STATUS
  id UUID PK, order_id UUID NOT NULL → order_record,
  station kitchen_station,             -- bar | food · NULL = charge ticket (created 'sent') · kitchen off → bar
  status order_status NOT NULL DEFAULT 'pending',
  issue_reason VARCHAR(30), issue_item_id UUID → order_item, issue_note TEXT,
  issue_escalated_at TIMESTAMPTZ, sent_at TIMESTAMPTZ,
  created_at/updated_at/created_by/updated_by,              -- updated_by = "กำลังเตรียม · ชื่อ" (CD-08 R14)
  UNIQUE NULLS NOT DISTINCT (order_id, station)
);
order_item: order_id → ticket_id (NOT NULL → order_ticket); drop status;
            + cancelled_at (NULL = active), cancelled_by → staff_user, cancel_reason VARCHAR(50), cancel_note TEXT
payment_order: unchanged (payment_id, order_id → order_record)
drop: order_record.placement_id, .station, .status; order_item_status enum + idx_order_item_status
```
*Pros:* names match reality; number stored once; bill links to orders. *Cons:* +1 table; queue query joins order for the number; endpoints/events renamed.

## Rules (both options)
1. Split into tickets only when `venue.kitchen_display_enabled`; decided at placement, never re-split or merged.
2. Tickets of one order share the number; label "· บาร์ / · ครัว" only when split.
3. All items on a ticket cancelled → ticket `cancelled`, from any status.
4. Status stays per ticket (DR-012); no per-item progress. Staff app shows one card per ticket (same rule as POS); a mobile station filter only if asked for later.

## Ripple (B)
Endpoints `/tickets/:id/accept|ready|send|flag-issue|resolve` · event `ticket.status_changed`, `order_item.cancelled` · CD-08/CD-15 action tables · CD-02 panel · CD-06 tab grouping · BRIEF-010 queue = tickets with `orderNumber` + `station` · CLAUDE.md "34 tables" → 35 · FRD §6 kitchen routing (setting-based).
**UI layout is not affected** — cards look the same ("#001 · บาร์"); only data/API names change. CDs can continue.

## Recommendation
**B.** One join is cheap; the model then matches how the bar talks ("order #001, two tickets"), which removes the recurring confusion.

---

## Decision — Field only
**Decision:** Approved with change: **B** (order → tickets, new `order_ticket`, 35 tables) + Rules 1–4, plus:
- `order_ticket.issue_reported_by` UUID → staff_user ("รายงานโดย ต้น", CD-15 R5).
- Business-day cut-off **06:00 Asia/Bangkok** for `business_date` — the same day boundary used by CD-13 R3 (shift-end membership) and CD-05 R5 (reports).
- Cardinality: one order → 1..3 tickets (bar / food / charge; usually 1 bar + optional charge when the kitchen screen is off); one ticket → 1..n items; each item belongs to exactly one ticket.
- Schema/ERD edit applied only after Field OKs the exact diff.
**Why:** the model matches how the bar talks ("order #001, two tickets"); number, creator and bill link stored once; status stays per ticket.
**Date:** 2026-10-11

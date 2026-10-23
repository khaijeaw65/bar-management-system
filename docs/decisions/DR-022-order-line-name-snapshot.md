# DR-022 — Order lines keep the names they were ordered under

| | |
|---|---|
| **Status** | Pending |
| **Raised by** | Cowork · 2026-10-23 (BRIEF-038 audit Finding 1) |
| **Brief** | BRIEF-042 (backend) · BRIEF-040 (menu UI — rename confirm) |
| **Category** | Data · Flow/Architecture |

## Context
`order_item` freezes the price (`unit_price_snapshot`) and `order_item_modifier` freezes the add-on price (`price_delta_snapshot`), but neither stores a **name**. `ORDER_ROWS_SQL` joins the live `menu_item.name`, `menu_item_variant.name` and `modifier_option.name`. Since BRIEF-038 a manager can rename items and price options (BRIEF-044 will add add-on renames), so a rename rewrites how every past order, ticket and bill reads — e.g. "แก้ว" → "แก้วใหญ่" makes last night's ฿180 line read "แก้วใหญ่ ฿180". Amounts, payments and reports revenue are unaffected.

A second, smaller issue sits on the same read (BRIEF-038 re-check Finding 6): lines are ordered `o.created_at, t.created_at, i.created_at`, and rows written in one transaction share `now()`, so lines placed together can swap places between reads.

**Field direction (2026-10-23, BRIEF-038 audit session):** option B, with a UI guard — renaming asks the manager to confirm. Run before 8 Nov, right after BRIEF-039.

## Options
**A) Keep live names (status quo)** — no work / past orders and bills change wording after a rename; confusing once a real bar edits its menu.
**B) Snapshot columns at order time** — `item_name_snapshot`, `variant_name_snapshot` on `order_item`, `option_name_snapshot` on `order_item_modifier`; order reads use them. / One migration with a backfill; order-create writes three more values.
**C) One JSON snapshot column per line** — flexible / untyped, harder to query, no precedent in the schema.

## Recommendation
B — same pattern as the price snapshot already in the schema, typed, and the read gets simpler (no join for names). Add `order_item.line_no` in the same migration so lines read back in the order they were placed.

## If Approved — Locks
- `order_item.item_name_snapshot VARCHAR(200) NOT NULL`, `order_item.variant_name_snapshot VARCHAR(200) NOT NULL`, `order_item.line_no SMALLINT NOT NULL` (1 … n per order, request order), `order_item_modifier.option_name_snapshot VARCHAR(200) NOT NULL` — added nullable, backfilled from current names (`line_no` by `created_at, id`), then set NOT NULL.
- Order create fills them in the same transaction that reads the price; `ORDER_ROWS_SQL` reads names from the snapshots and orders lines by `line_no`.
- Reports (BRIEF-036) keep live names — they rank menu items as they are now.
- Menu UI: saving a changed item or price-option name asks for confirmation first (BRIEF-040 Pre-decided). Copy is the UI brief's call.
- CLAUDE.md schema rule line (Field / Cowork, Field-approved): "`order_item` name + price snapshots frozen at order time".

---

## Decision — Field only
**Decision:**
**Why:**
**Date:**

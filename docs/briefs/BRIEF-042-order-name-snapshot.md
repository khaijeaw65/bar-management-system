# BRIEF-042 — Backend: order lines keep their names + stable line order

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-23 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend |
| **Revision** | 1 |
| **Depends on** | DR-022 Approved · BRIEF-039 merged (queue order; no code dependency) |
| **References** | DR-022 · BRIEF-038 audit F1 + re-check F6 (Field 2026-10-23) · `docs/schema.sql` §6 `order_item`, `order_item_modifier` · `order.sql.ts` `ORDER_ROWS_SQL` |
| **Audit depth** | Full (order path, migration with backfill) |
| **Size** | ~0.5–1 day · est. ~400–500 net-new lines incl. tests |

---

## 1. Goal
A past order, ticket or bill reads exactly as it did when it was placed — renaming a menu item, price option or add-on later changes nothing on it — and lines show in the order they were placed.

## 2. Scope
### In
- **Migration** `app/backend/src/providers/database/migrations/<timestamp>-OrderLineSnapshots.ts` (DR-022 locks): add `order_item.item_name_snapshot`, `order_item.variant_name_snapshot`, `order_item.line_no`, `order_item_modifier.option_name_snapshot` as nullable → backfill from the current `menu_item` / `menu_item_variant` / `modifier_option` names and `line_no` = row number per order by `created_at, id` → `SET NOT NULL`. `down` drops the four columns.
- **Order create** fills the snapshots and `line_no` (1 … n in request order) in the same transaction that already reads the variant / option prices. Entities updated.
- **Order read:** `ORDER_ROWS_SQL` returns names from the snapshots; lines ordered by `line_no` (tickets of one order by `created_at, station` — a stable tie-break); response shapes unchanged.
- **CLI:** `demo-history` and any seed that inserts `order_item` / `order_item_modifier` write the snapshots and `line_no`.
- `docs/schema.sql` §6 updated (unlocked below). `docs/erd.html` is updated by Cowork after merge (Field-approved edit — not brief-unlockable).

### Out (do NOT build here)
- Rename-confirm dialog → BRIEF-040 (Pre-decided there, Field 2026-10-23) · reports keep live names (DR-022) · audit-log rows for renames · any API shape change.

## 3. Contract
- **Endpoints:** none new; `Order` / `OrderLine` / ticket payloads keep their fields — values now come from the snapshots.
- **WS events:** unchanged.
- **Contracts changes:** none.
- **Business rules:** names and prices on an order line are frozen at order time (DR-022, existing price snapshot) · line order = placing order.

## 4. Acceptance Criteria
- **AC-1** — Order a variant with an add-on, then rename the item, the variant and the add-on option → the old order, its tickets and the bill read the **old** names; a new order reads the new names.
- **AC-2** — Migration on a DB with existing orders: every row gets non-null snapshots equal to the names at migration time and a `line_no`; `down` then `up` again succeeds.
- **AC-3** — A 5-line order read 20 times returns the lines in request order every time (BRIEF-038 F6).
- **AC-4** — `seed:demo-history` and the order e2e suites pass with the new NOT NULL columns.
- **AC-5** — Gates + run proof.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-3 | e2e | `app/backend/test/order-snapshots.e2e-spec.ts` |
| AC-2 | e2e (migration run on seeded rows) | same file or `test/migrations/*.e2e-spec.ts` |
| AC-4 | existing suites | order / payment / reports e2e |

Gate commands (all must pass):
```bash
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck && pnpm --filter @bar/backend test && pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:check
```
Run proof: on the dev DB (`bar`, with demo history + T1's จินโทนิค lines) → `migration:run` → `SELECT` a few snapshot rows (names match) → rename จินโทนิค and "แก้ว" via `PATCH /menu/items/:id` → POS T1 drawer still shows "จินโทนิค แก้ว" on the old lines (screenshot) → new order shows the new name.

### Local Sonar scan
- **Required for this brief: yes.**

## 6. Constraints
- One migration; backfill in SQL inside it; no app-side backfill script.
- `save()` on audited entities; the order-create path keeps its existing locks and idempotency.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):** the four columns, types and NOT NULL exactly as DR-022 locks · migration file name `<timestamp>-OrderLineSnapshots.ts` · reports stay on live names.
- **Likely DRs:** none.

## 8. Unlocked Protected Files
- `docs/schema.sql`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2 (≤ ~3 working days, ~500 net-new lines); otherwise split
- [x] No unresolved decision blocking the main outcome (DR-022 Approved)
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-23 | Initial Draft (Cowork) — BRIEF-038 audit F1 (Field: option B + UI confirm) + F6 line order |
| 1 | 2026-10-23 | Ready — Field in session: "approve all" (DR-022 Approved) |

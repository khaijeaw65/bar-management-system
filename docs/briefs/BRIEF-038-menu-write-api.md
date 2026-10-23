# BRIEF-038 — Backend: menu write API (items, variants, categories)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-22 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 1 |
| **Depends on** | BRIEF-016 ✅ (menu read) · BRIEF-027 ✅ (mark-(un)available + `menu.availability_changed`) |
| **References** | CD-12 R6, R7 (1, 3, 5), §4 Action table, editor boards · DR-012 (station required except charge) · DR-010 / DR-014 #10 (S1 promo switch) · DR-017 (Idempotency-Key) · `docs/schema.sql` §4 |
| **Audit depth** | Full (prices feed orders and payments) |
| **Size** | ~1.5 days · est. ~550–650 net-new lines incl. tests |

---

## 1. Goal
The manager can add and edit menu items — price options, station, category, promo flag — and manage categories, with safe concurrent edits. Prices already ordered never change (`unit_price_snapshot`).

## 2. Scope
### In
- **Items** (in `modules/menu`, through a `MenuWriteService`):
  - `POST /menu/items` (+ `Idempotency-Key`, DR-017) `{ categoryId, name, description?, itemType: 'simple'|'charge', station: 'bar'|'food'|null, isPromo, variants: [{ name, price }] (≥ 1), modifierGroupIds?: [] }` → `MenuItem`.
  - `PATCH /menu/items/:id` `{ updatedAt, …same fields }` → `MenuItem`; `updatedAt` older than stored → 409 `MENU_ITEM_STALE` with the current item in `details` (CD-12 R7-1, editor·9).
  - Variants replaced as a set on PATCH: existing variant ids kept / updated, missing ones **deactivated** (`is_available = false`), never deleted (order lines reference them). At least one active variant (CD-12 D3).
  - Rules: `station` required unless `itemType = 'charge'`, null for charge (DR-012, `chk_menu_item_station`) · price ≥ 0.00 money string (DR-004) · `isPromo` creates a plain promo item, no window editor (DR-014 #10) · `recipe` type rejected in S1 (400 — saves like simple is UI-only, CD-12 editor·6).
  - Modifier group links per variant: same `modifierGroupIds` applied to every active variant (`menu_variant_modifier_group`) — editing groups themselves is BRIEF-039.
- **Categories:** `POST /menu/categories` `{ name }` · `PATCH /menu/categories/:id` `{ name?, isActive? }` · `PUT /menu/categories/order` `{ ids: [] }` (full ordering) · `DELETE /menu/categories/:id` → 409 `CATEGORY_NOT_EMPTY` when it holds items (CD-12 R7-3); hidden category (`isActive=false`) hides its items on every menu surface.
- **Events:** `menu.changed` `{ itemIds?, categoryIds? }` (room `staff`) on every write → POS / staff app refetch the menu. Mark-(un)available keeps BRIEF-027's `menu.availability_changed`.
- Every write uses `save()` (audit columns); no `audit_log` rows in S1 for menu edits (owner price-change alerts = AI epic).
- Contracts (`CreateMenuItemSchema`, `UpdateMenuItemSchema`, category schemas, `MenuChangedPayloadSchema`, error codes `MENU_ITEM_STALE`, `CATEGORY_NOT_EMPTY`), OpenAPI, `docs/api/README.md` Menu table.

### Out (do NOT build here)
- Modifier groups / options CRUD + `MODIFIER_GROUP_IN_USE` and photo upload (BRIEF-039, DR-020) · item delete (deactivate via category / sold-out only in S1) · promo window editor (S2) · recipes / inventory (S2) · item sort inside a category (S2) · UI (BRIEF-040 / 041).

## 3. Contract
| Method | Path | Request → Response | Permission |
|---|---|---|---|
| POST | `/menu/items` | `CreateMenuItem` + `Idempotency-Key` → `MenuItem` | `menu:write` |
| PATCH | `/menu/items/:id` | `UpdateMenuItem` → `MenuItem` | `menu:write` |
| POST | `/menu/categories` | `{ name }` → `MenuCategory` | `menu:write` |
| PATCH | `/menu/categories/:id` | `{ name?, isActive? }` → `MenuCategory` | `menu:write` |
| PUT | `/menu/categories/order` | `{ ids }` → `MenuCategoryList` | `menu:write` |
| DELETE | `/menu/categories/:id` | → `{ ok: true }` | `menu:write` |
- **WS events:** `menu.changed` (new).
- **Errors:** 400 `VALIDATION_ERROR` · 404 · 409 `MENU_ITEM_STALE` · 409 `CATEGORY_NOT_EMPTY` · idempotency errors per DR-017.
- **Permissions:** `menu:write` (declared; enforcement → IAM brief).
- **Business rules:** price changes never touch existing order lines (`unit_price_snapshot`) · a deactivated variant disappears from new orders but old lines still render · DR-012 station rule.

## 4. Acceptance Criteria
- **AC-1** — Create a bar item with 2 variants → 201, appears in `GET /menu/items` for POS; same `Idempotency-Key` replay → same item, no duplicate.
- **AC-2** — Charge item with a station → 400; simple item without station → 400; `recipe` → 400; no variants → 400.
- **AC-3** — PATCH with a stale `updatedAt` → 409 `MENU_ITEM_STALE` with the current item; fresh → 200.
- **AC-4** — PATCH removing a variant that an open order uses → variant deactivated, the order line still shows its name and snapshot price; new orders can't pick it (order API rejects it).
- **AC-5** — Price change → existing order lines and bills unchanged; new orders use the new price.
- **AC-6** — Category: create, rename, reorder, hide (items vanish from POS menu), delete empty → ok, delete non-empty → 409 `CATEGORY_NOT_EMPTY`.
- **AC-7** — Every write emits one `menu.changed`.
- **AC-8** — Gates + run proof pass; OpenAPI + `openapi:check`; README updated.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1 – AC-7 | integration (real Postgres) | `app/backend/test/menu-write.e2e-spec.ts` |
| AC-2 | unit | item validation spec |

Gate commands (all must pass):
```bash
pnpm --filter @bar/contracts build
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck && pnpm --filter @bar/backend test && pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:check
```
Run proof: `curl` as Field: create "จินโทนิค" (2 variants, bar) → order it on the POS (web) → change its price → bill keeps the old price, a new order uses the new one → stale PATCH → 409. Output trimmed in the handoff.

## 6. Constraints
- Writes only through `MenuWriteService`; `save()`; no inline permission checks; transactions per request.
- No schema change (all columns exist). Need one → stop, raise a DR.

## 7. Decision Points (Field Guard)
- **Pre-decided:** photos are BRIEF-039 (DR-020) · no item delete in S1 · variants deactivate, never delete.
- **Q1 — Concurrency on items. ✅ Decided (Field, 2026-10-22): A — `updatedAt` → 409 `MENU_ITEM_STALE`.** CD-12 R7-1 asks for `updatedAt` → 409. *Cowork recommends:* **A — as designed** (client sends the `updatedAt` it loaded; editor·9 shows "มีคนบันทึกก่อน" with reload). *Alternative:* **B — last write wins** (simpler; two managers editing the same item at once is rare in a small bar).
- **Likely DRs:** none.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-22 | Initial Draft (Cowork) — owner side S5 #4 (menu management backend, part 1) |
| 1 | 2026-10-22 | Ready — Field in session: "038 Q1 = A, approve BRIEF-038 Rev 1 Ready" |

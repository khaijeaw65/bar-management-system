# BRIEF-016 — Backend: venue settings + menu read + seed

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent — Cursor) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 2 |
| **Depends on** | **BRIEF-011 merged** (PR #45 — `modules/venue/`, `seed:venue`, envelope + OpenAPI helper) |
| **References** | `docs/schema.sql` §1 (`venue`, enums `venue_payment_mode`, `promptpay_id_type`) + §4 (`menu_category`, `menu_item`, `menu_item_availability`, `menu_item_variant`, `modifier_group`, `modifier_option`, `menu_variant_modifier_group`, enums `item_type`, `kitchen_station`) · DR-010 (rules 1, 3, 5, 10–12) · DR-012 (station tag) · DR-014 #1 #4 · BRIEF-012 Q1 (Field, 2026-10-17) · `docs/api/README.md` (Menu, D4) · CD-04 (R2 quick add, R4 promos, R8, menu data) · `docs/rules/backend.md` |
| **Audit depth** | Full (core-flow input: prices + availability feed orders) |
| **Size** | ~1.5 days (before BRIEF-012) |

---

## 1. Goal
The backend has the venue's settings and a seeded bar menu, and POS / staff app can read the menu with live availability (`available_now`, DR-010). BRIEF-012 reuses the same availability rule and prices when an order is placed.

## 2. Scope
### In
- **Migrations** exactly as `schema.sql`: `venue` (+ its enums, `created_by`/`updated_by` FKs → `staff_user`) and the 7 menu tables above (+ `item_type`, `kitchen_station`, `chk_menu_item_station`, `chk_avail_*`). Entities extend `BaseEntity` where the table has audit columns; `modifier_option` (no `created_by`/`updated_by`) and `menu_variant_modifier_group` (join table) do not.
- **Venue** (`modules/venue/`): `VenueSettingsService.get()` — the one venue row (Phase 1 = single venue); exported for BRIEF-012 (`kitchenDisplayEnabled`, `businessDayCutoff`). `GET /venue` (read).
- **Menu module** `modules/menu/` (hexagonal, same layout as `modules/venue/`):
  - `MenuAvailability` — pure function, injected clock, Asia/Bangkok: `availableNow = category.is_active && item.is_available && (no window rows || now inside a window)`; reason `sold_out` (flag off) or `out_of_window`. Windows: `days_of_week` = the day the window **starts**; `end_time < start_time` crosses midnight (DR-010 rules 5, 10).
  - `MenuCatalogService` — list/detail reads, and **`getOrderable(variantIds, now)`** exported for BRIEF-012: per variant → price, names, item `item_type` + `kitchen_tag`, availability + reason, its modifier groups/options (with `is_available`).
- **Endpoints** (`/api`, envelope, OpenAPI):
  | Method | Path | Behaviour | Permission |
  |---|---|---|---|
  | GET | `/venue` | `{ name, slug, kitchenDisplayEnabled, businessDayCutoff, counterQrEnabled }` — no PromptPay / payment fields | `venue:read` |
  | GET | `/menu/categories` | active categories by `sort_order` | `menu:read` |
  | GET | `/menu/items` | `?categoryId` · `?available=true` (only `availableNow`) — items of active categories by category `sort_order`, then item `sort_order`; full shape (Q1) | `menu:read` |
  | GET | `/menu/items/:id` | same item shape | `menu:read` |
- **Seed** (idempotent, natural keys = venue `slug`, category name, item name + category, variant name + item, group name, option name + group):
  - `seed:venue` also upserts one venue (`slug: main`, `kitchen_display_enabled: false`, cut-off `06:00`).
  - New `seed:menu` (Q3): the CD-04 menu — เบียร์สด (ช้างดราฟต์ ฿120, สิงห์ดราฟต์ ฿140, ลีโอขวด ฿100) · ค็อกเทล (เนโกรนี ฿240, โอลด์แฟชั่น 2 variants from ฿260 + modifier groups: required "น้ำแข็ง" 1 of ปกติ / ก้อนใหญ่, optional "เพิ่ม" 0–1 เชอร์รี่ +฿20) · ไฮบอล (ไฮบอลมะนาวโซดา ฿180) · อาหาร (ยำหมูยอ ฿150 `is_available=false`, ถั่วทอดสมุนไพร ฿80 — `kitchen_tag=food`) · ค่าบริการ (ค่าเปิดขวด ฿300, `item_type=charge`, `kitchen_tag` NULL) · โปรโมชั่น (`is_promo`): one daily 17:00–21:00 item and one Fri–Sat 22:00–02:00 item. Drinks `kitchen_tag=bar`. Every orderable item ≥ 1 variant (README D4); single-price items get one variant named "ปกติ".
- **Contracts:** `VenueSettingsSchema`, `MenuCategorySchema`, `MenuItemSchema` (+ variant, modifier group/option, window), list/response schemas.

### Out (do NOT build here)
- 86 / un-86 (`mark-unavailable` / `mark-available`), `menu.availability_changed` event, sold-out auto-cancel → BRIEF-017.
- Redis menu cache (BRIEF-017, Q1) · menu / venue write APIs, back-office (CD-12) · customer `GET /public/menu` (customer-QR brief) · images: `imageUrl` returned `null` until an S3 brief (`image_key` column exists, unused).
- Inventory / recipe tables (`menu_variant_ingredient`) · orders (BRIEF-012) · `PermissionsGuard` enforcement (IAM brief — metadata only).

## 3. Contract
- `MenuItem`: `{ id, categoryId, name, description, imageUrl: null, itemType, station: 'bar'|'food'|null, isPromo, basePrice, sortOrder, availableNow, unavailableReason: 'sold_out'|'out_of_window'|null, windows: [{ daysOfWeek: number[], startTime: 'HH:mm', endTime: 'HH:mm' }], variants: [{ id, name, price, isAvailable, modifierGroups: [{ id, name, isRequired, minSelect, maxSelect, options: [{ id, name, priceDelta, isAvailable }] }] }] }` — money as string; clients format window labels ("ถึง 21:00", "เริ่ม 22:00 (ศ.–ส.)") from `windows`.
- `MenuCategory`: `{ id, name, sortOrder }` · `VenueSettings`: as the table above.
- **OpenAPI:** all 4 endpoints in `docs/api/openapi.json`, permission in each description; `docs/api/README.md` Menu table marks 86 rows "BRIEF-017".

## 4. Acceptance Criteria
- **AC-1** — Given an empty DB after migrations, when `seed:venue` and `seed:menu` run twice, then one venue and the exact CD-04 menu exist with no duplicates; every non-charge item has `kitchen_tag`, the charge item has none, every orderable item has ≥ 1 variant.
- **AC-2** — Given the seed, `GET /menu/categories` returns active categories in `sort_order`; `GET /menu/items` returns items grouped in category then item order with variants and modifier groups; `?categoryId` filters; `?available=true` drops ยำหมูยอ.
- **AC-3** — Availability (unit, injected clock, Asia/Bangkok): no window → available; flag off → `sold_out`; daily 17:00–21:00 at 20:59 in / 21:00 out (`out_of_window`); Fri 22:00–02:00 → Fri 23:00 in, **Sat 01:00 in**, Sat 02:00 out, Thu 23:00 out, Sun 01:00 in (started Sat); inactive category → item not listed.
- **AC-4** — `getOrderable` returns price, `kitchen_tag`, `item_type`, availability + reason and modifier groups for each requested variant; an unknown variant id is reported as missing (no throw — BRIEF-012 maps it).
- **AC-5** — `GET /venue` returns the seeded settings; no PromptPay/payment fields in the response.
- **AC-6** — Unknown item id → 404 `NOT_FOUND`; malformed query → 400 `VALIDATION_ERROR`.
- **AC-7** — OpenAPI lists the 4 endpoints with permissions; `openapi:check` passes.
- **AC-8** — lint / typecheck / test / test:e2e / build exit 0; contracts tests pass.
- **AC-9** — `app/backend/README.md` lists the seed order `seed:staff` → `seed:venue` → `seed:menu` and that each is safe to re-run.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1 | e2e | `test/menu-seed.e2e-spec.ts` |
| AC-2, AC-5, AC-6 | e2e | `test/menu.e2e-spec.ts` (real Postgres) |
| AC-3 | unit | `src/modules/menu/application/menu-availability.spec.ts` |
| AC-4 | unit + e2e | `src/modules/menu/application/menu-catalog.service.spec.ts` · `test/menu.e2e-spec.ts` |
| AC-7 | command | `openapi:check` |
| AC-9 | review | `app/backend/README.md` |

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
- Optional — Field's brief; run if time allows.

## 6. Constraints
- Server clock only for availability (DR-010 rule 1); clock injected so tests never depend on wall time.
- One availability function used by the list, detail and `getOrderable` — BRIEF-012 must not re-implement it.
- Load the menu in a fixed number of queries (no per-item N+1); Phase-1 lists unpaged (README).
- Hexagonal layout, ports + tokens, Zod DTOs; `save()` for audited entities (seed included); Thai `message`, English `code`.

## 7. Decision Points (Field Guard)
- **Q1 — List shape. ✅ Decided (Field, 2026-10-17): A** — `GET /menu/items` returns the full item (variants + modifier groups + windows); `GET /menu/items/:id` returns the same shape. *Why:* small menus (~20–80 items); one request loads the POS; CD-04 R2 quick-add needs variants + required groups on the tile. Load: ~5 fixed queries per call, ~4 calls/min per bar (60 s refetch, DR-010 rule 12).
  - **Scaling path (decided, not built here):** Redis cache-aside of the raw menu, invalidated on every menu write — built in **BRIEF-017** together with the first write (86 toggle). Availability is always computed per request (clock-dependent), never cached.
  - **Rule:** `getOrderable()` always reads the DB, never a cache — order placement prices are never stale.
- **Q2 — `GET /venue`. ✅ Decided (Field, 2026-10-17): A** — read-only `{ name, slug, kitchenDisplayEnabled, businessDayCutoff, counterQrEnabled }`; no PromptPay / payment fields (BRIEF-013). *Why:* POS board columns (CD-15 R7) and the staff-app READY button depend on `kitchenDisplayEnabled`; no hardcoded UI assumption.
- **Q3 — Seed scripts. ✅ Decided (Field, 2026-10-17): A** — add `"seed:menu": "nest build && node --env-file=.env ./dist/cli/seed-menu.js"` to `app/backend/package.json`; `seed:venue` also upserts the venue row. Document the local order `seed:staff` → `seed:venue` → `seed:menu` in `app/backend/README.md`. *Why:* one seed per module; Metee can rebuild his local DB alone; same pattern as BRIEF-011.
- **Pre-decided:** permissions `menu:read`, `venue:read` · `app/backend/package.json` script `seed:menu` exactly as Q3 · no new packages · no new error codes.
- **Likely DRs:** TypeORM mapping for `SMALLINT[]` (`days_of_week`) · time-zone handling without a new date library (use `Intl` / plain arithmetic; a new package needs a DR).

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions
- [x] No unresolved decision blocking the main outcome (Q1–Q3 decided 2026-10-17)
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-17 | Initial Draft (Cowork) — split out of BRIEF-012 by Field's Q1 decision (2026-10-17); read-only menu |
| 2 | 2026-10-17 | Q1–Q3 decided by Field in session (all A) + cache scaling path → BRIEF-017 + `getOrderable` DB-only rule + seed README AC, recorded by Cowork on Field's explicit instruction |

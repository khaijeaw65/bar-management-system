# BRIEF-045 — Web POS: categories manager + add-on groups screen (+ category `itemCount`)

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | frontend · backend · contracts |
| **Revision** | 1 |
| **Depends on** | BRIEF-038 ✅ (#80, category write API) · BRIEF-040 ✅ (#90, `/pos/menu` list + toolbar, `useMenuLive`) · BRIEF-041 ✅ (#91) · BRIEF-044 ✅ (#87, modifier-group CRUD, DR-024 archive) |
| **References** | **DR-025 (Pending — category name unique)** · CD-12 boards `modifiers` (1–6), `categories` (1–6), `flow`; §4 Action table rows "Groups CRUD" / "Categories"; R6 (delete group in use disabled), R7-3 (`CATEGORY_NOT_EMPTY`, `MODIFIER_GROUP_IN_USE`), R7-4 (group rules) · CD-04 F4 (rule label on the order sheet) · DR-024 (archive, no restore) · BRIEF-038 §2 Categories · BRIEF-044 §2 · `catalog.ts` / `ModifierGroup.tsx` (order sheet rule wording) |
| **Audit depth** | Full for the backend part (migration + contract change) · Compact for the UI (every rule is enforced server-side) (proposed) |
| **Size** | ~2.5 days · est. **~1.4–1.5k** net-new lines incl. tests (DR-025 adds ~100) — **above the ~500 target by Field's choice (one brief, both screens — see Selected)**. Suggested commit order for review: 1) backend + contracts (`itemCount`, DR-025 index) · 2) categories modal · 3) add-on screens (proposed) |

---

## Selected (by KJ) — interview 2026-10-23

| # | Question | Selected |
|---|---|---|
| 1 | Split categories / add-on screens? | **One brief, both screens** (over the size target, accepted) |
| 2 | Implementer | **kj (executor agent)** |
| 3 | Group editor option rows | **Switch "ขาย" per row** — off = left out of `PATCH` (deactivated), on again = id re-listed (reactivated); trash only on new unsaved rows |
| 4 | Deleting (archiving) an unused group | **AlertDialog confirm** first; in-use group → delete disabled + "ใช้อยู่ใน n เมนู — ถอดออกจากเมนูก่อน" |
| 5 | Category reorder | **Both: drag handle + ↑ / ↓ buttons** — drag via `useDragAndDrop` from `react-aria-components` (already a dependency) — *pattern new to KJ* |
| 6 | When reorder / hide hit the API | **At once, optimistic** — revert + error Toast on failure; "เสร็จ" only closes |
| 7 | "n เมนู" per category | **Add `itemCount` to the API** |
| 8 | Screen placement | **CD-12 as drawn** — categories = Modal 560 from "จัดการหมวด" on `/pos/menu`; add-on = page `/pos/menu/modifiers` + group editor Drawer 480 |
| 9 | `itemCount` on which responses | **Always, required field** on every `MenuCategory` |
| 10 | "ลูกค้าเห็น" preview in the group editor | **Include** |
| 11 | Live refresh | **Invalidate on `menu.changed`** (existing event, no new one) |
| 12 | Q1 — unique category name | **B — server-side** → DR-025: `lower(trim(name))`, all rows (hidden too), migration fails loudly on existing duplicates, DB unique index + catch `23505` → 409 `CATEGORY_NAME_TAKEN` (DR-025 interview) |

## 1. Goal
The manager creates, renames, reorders, hides and deletes menu categories, and creates, edits and removes add-on groups, from the POS back office — no `curl` needed — and every screen reflects the change without a reload.

## 2. Scope
### In
**Backend + contracts (Selected 7, 9)**
- `MenuCategorySchema` gains **`itemCount: z.number().int().min(0)`** (required) = number of `menu_item` rows in the category, counted exactly like the `CATEGORY_NOT_EMPTY` delete guard (`lockCategoryItemCount`) — so the blocked-delete message always matches.
- Every response that returns `MenuCategory` / `MenuCategoryList` carries it: `GET /menu/categories` (with and without `includeHidden`), `POST /menu/categories` (→ 0), `PATCH /menu/categories/:id`, `PUT /menu/categories/order`. One `LEFT JOIN … GROUP BY` in the catalog read (proposed); no schema change, no migration.
- **Unique category names (DR-025, once Approved):** migration `<timestamp>-CategoryNameUnique.ts` — check for duplicates (`lower(trim(name))`) and throw listing them, else `CREATE UNIQUE INDEX uq_menu_category_name ON menu_category (lower(trim(name)))`; `down` drops it. Repository maps `QueryFailedError` `23505` on `uq_menu_category_name` → 409 `CATEGORY_NAME_TAKEN` ("มีหมวดชื่อนี้แล้ว") for `POST` and `PATCH { name }`; any other error rethrown. Entity index metadata + `docs/schema.sql` §4 (unlocked below).
- OpenAPI regenerated, `docs/api/README.md` Menu table note.

**Frontend — entry points**
- `/pos/menu` toolbar (BRIEF-040 `MenuToolbar`): secondary buttons **"จัดการหมวด"** (opens the categories Modal) and **"ตัวเลือกเสริม"** (→ `/pos/menu/modifiers`) — CD-12 list board.

**Frontend — categories Modal 560 (CD-12 `categories` 1–4)**
- Rows in `sort_order`: drag handle (`grip-vertical`) + ↑ / ↓ icon buttons (Selected 5) · name · "n เมนู" (`itemCount`) · Switch แสดง · delete.
- Hidden row: muted + note "ซ่อนจากเมนูลูกค้าและ POS" (categories·2).
- **Reorder:** drop or ↑ / ↓ → optimistic new order → `PUT /menu/categories/order` with **all** ids in the new order (hidden included) → response replaces the cache; failure → revert + Toast "เรียงหมวดไม่สำเร็จ — ลองอีกครั้ง" (proposed copy). ↑ disabled on the first row, ↓ on the last.
- **Hide / show:** Switch → optimistic → `PATCH { isActive }`; failure → revert + Toast.
- **Add:** "+ เพิ่มหมวด" → inline Input "ชื่อหมวดใหม่" → Enter / ✓ → `POST` → appended at the end; Esc cancels (categories·4).
- **Rename:** tap the name → inline Input → Enter / blur saves `PATCH { name }`, Esc cancels (proposed — API exists, board doesn't draw it).
- **Delete:** `itemCount > 0` → button disabled + "ลบไม่ได้ — ยังมี n เมนูในหมวดนี้" (categories·3); `itemCount = 0` → `DELETE`; a 409 `CATEGORY_NOT_EMPTY` race → same message + refetch.
- Names: 1–200 chars after trim, validated with `CreateMenuCategorySchema`; a 409 `CATEGORY_NAME_TAKEN` on add or rename shows "มีหมวดชื่อนี้แล้ว" on the name Input, the typed value kept.
- "เสร็จ" closes. States: loading skeleton · error + ลองอีกครั้ง · empty "ยังไม่มีหมวด" + เพิ่มหมวด.

**Frontend — add-on groups page `/pos/menu/modifiers` (CD-12 `modifiers` 1–3)**
- Breadcrumbs เมนู › ตัวเลือกเสริม · list from `GET /menu/modifier-groups`: name · rule chip ("ต้องเลือก 1" / "ไม่บังคับ · สูงสุด 2") · options count (active) · "ใช้กับ n เมนู" (`usedByItems`) · "เพิ่มกลุ่ม". Row tap → editor Drawer.
- **Group editor Drawer 480** (new / edit): ชื่อกลุ่ม · Switch "ต้องเลือก" · NumberField ขั้นต่ำ / สูงสุด (ต้องเลือก off ⇒ ขั้นต่ำ = 0 and disabled) · options table: name · ราคาเพิ่ม (+฿) · Switch "ขาย" · trash (new unsaved rows only) · "+ เพิ่มตัวเลือก" · **"ลูกค้าเห็น"** preview line using the order sheet's rule wording (Selected 10).
- **Option Switch (Selected 3):** off on an existing option → its id is left out of `options` in `PATCH` (API deactivates it); on again → id re-listed (API reactivates). Inactive options from `GET` load with the Switch off. `maxSelect` is validated against the **Switch-on** rows.
- Validation inline + summary with the contracts schemas (`CreateModifierGroupSchema` / `UpdateModifierGroupSchema`): "สูงสุดต้องไม่น้อยกว่าขั้นต่ำ" etc. (modifiers·3); server 400 field errors mapped the same way (BRIEF-040 helper).
- **Delete (Selected 4):** `usedByItems > 0` → disabled + "ใช้อยู่ใน n เมนู — ถอดออกจากเมนูก่อน"; else AlertDialog "ลบกลุ่ม {name}? ลบแล้วกู้คืนไม่ได้" → `DELETE`; 409 `MODIFIER_GROUP_IN_USE` race → same message + refetch.
- Save → Toast "บันทึกกลุ่มแล้ว", Drawer closes. Closing the Drawer with changes → reuse `useLeaveGuard` AlertDialog (proposed).
- States: loading · error + retry · empty "ยังไม่มีกลุ่ม" + เพิ่มกลุ่ม.

**Live (Selected 11):** new query keys sit under `["menu", …]` so the existing `useMenuLive` invalidation covers them; the categories Modal is covered by `MenuList`'s existing `useMenuLive()`; the modifiers page mounts `useMenuLive()` itself (today only `MenuList` does).

**Mocks / client:** `lib/api/menu.ts` category + group write functions; MSW handlers in `src/mocks/menu.ts`.

### Out (do NOT build here)
- Phone 390 layouts (modifiers·4–6, categories·5–6) → phone shell brief after 8 Nov (BRIEF-040 Q2) · restoring archived groups (DR-024) · group / option sort order (BRIEF-044 S2) · permission gating (IAM brief) · item sort inside a category (S2) · any change to the item editor beyond what already exists.

## 3. Contract
| Method | Path | Change | Permission |
|---|---|---|---|
| GET | `/menu/categories` | response items + `itemCount` | `menu:read` |
| POST / PATCH | `/menu/categories`, `/menu/categories/:id` | response + `itemCount` | `menu:write` |
| PUT | `/menu/categories/order` | response items + `itemCount` | `menu:write` |
| DELETE | `/menu/categories/:id` | unchanged | `menu:write` |
| POST / PATCH | `/menu/categories`, `/menu/categories/:id` | + 409 `CATEGORY_NAME_TAKEN` (DR-025) | `menu:write` |
| GET / POST / PATCH / DELETE | `/menu/modifier-groups[/:id]` | unchanged (BRIEF-044) — used by the UI | `menu:read` / `menu:write` |
- **WS events:** `menu.changed` (existing payload) — consumed only.
- **Contracts changes:** `MenuCategorySchema.itemCount` (required, int ≥ 0) · error code `CATEGORY_NAME_TAKEN` (DR-025).
- **Business rules:**
  - Delete a category only when it holds no item → CD-12 §9 Categories + BRIEF-038 AC-6 (server 409).
  - `itemCount` counts every item in the category (active or not) → same query as the delete guard (this brief, Selected 7/9).
  - Reorder sends the full order; every visible category must be listed → CD-12 §4 + `menu-write.service.ts` reorder guard.
  - Hidden category hides its items everywhere except the back office → BRIEF-038 §2.
  - Group rules (`isRequired ⇒ min ≥ 1`, `!isRequired ⇒ min = 0`, `min ≤ max ≤ active options`, delta ≥ 0) → CD-12 R7-4 / BRIEF-044.
  - Switched-off option = deactivated, re-listing reactivates; delete in use blocked; delete = archive, no restore → BRIEF-044 / DR-024.
  - Category name unique on `lower(trim(name))`, hidden categories included → CD-12 §9 + **DR-025**.
- **OpenAPI:** `docs/api/openapi.json` regenerated (`openapi:export`), committed in this PR.

## 3b. Under the hood (proposed — skill section, not in the bar template)
- **When:** manager opens จัดการหมวด / ตัวเลือกเสริม; every write; another device's write (`menu.changed`).
- **Where:** backend `modules/menu` catalog repository read (`itemCount`) · frontend `app/pos/menu/_components/categories/*`, `app/pos/menu/modifiers/**`, `lib/api/menu.ts`.
- **How — reorder (the new pattern):**
  1. Drop (or ↑ / ↓) → `useDragAndDrop` `onReorder` gives the moved key + target → build the new id list.
  2. `onMutate`: cancel `["menu","categories","admin"]` queries, snapshot, `setQueryData(newOrder)` (row moves at once).
  3. `PUT /menu/categories/order { ids }` → backend opens **one DB transaction**: lock rows, check every active id listed, save `sort_order` for all, commit → returns the list (+ `itemCount`) → emits `menu.changed { categoryIds }` after commit.
  4. `onSuccess`: replace cache with the response · `onError`: restore snapshot + Toast · `onSettled`: invalidate.
  - **Inside the transaction:** only step 3's server work. The optimistic cache write and the revert are client-only.
  - **Failure → what's left → who cleans:** PUT fails → DB unchanged (rolled back) → client restores its snapshot itself; two quick drops → both PUTs carry a full list, last one wins, the final invalidate re-syncs.
- **How — group save:** form → schema parse → `PATCH` with options = Switch-on rows (ids kept) → one DB transaction server-side (BRIEF-044) → Toast + invalidate `["menu", …]`.
- **Data:** `menu_category.sort_order`, `is_active` · `modifier_group`, `modifier_option.is_available` · no new column; one new index `uq_menu_category_name` (DR-025).
- **How — unique name (DR-025):** `POST` / `PATCH { name }` → transaction → `save()` → Postgres checks `uq_menu_category_name` inside the write → taken: SQLSTATE `23505`, rollback, repo maps it to 409 → nothing written, client shows it on the field; two devices at once → one commits, the other gets 409.
- **Why:** count server-side so the "ลบไม่ได้" number always equals the 409 guard; optimistic reorder because CD-12 says "applies at once" and a revert is cheap (one list).

## 4. Acceptance Criteria
- **AC-1** — Given categories with items, when `GET /menu/categories?includeHidden=true`, then each item has `itemCount` equal to its items (incl. inactive items and hidden categories); `POST` returns `itemCount: 0`; `PATCH` and `PUT …/order` responses carry it.
- **AC-2** — Given the categories Modal, when a row is dragged (pointer) or moved with ↑ / ↓ (keyboard too), then the list re-orders at once and `PUT /menu/categories/order` is sent with every id in the new order; when the PUT fails, then the order reverts and an error Toast shows.
- **AC-3** — Given a visible category, when its Switch is turned off, then `PATCH { isActive: false }` is sent, the row shows "ซ่อนจากเมนูลูกค้าและ POS"; on failure it reverts.
- **AC-4** — Given the Modal, when "+ เพิ่มหมวด" + a name + Enter, then `POST` is sent and the row appears last; an empty name sends nothing and shows the error; rename via the name saves `PATCH { name }`.
- **AC-5** — Given a category with `itemCount: 2`, then delete is disabled with "ลบไม่ได้ — ยังมี 2 เมนูในหมวดนี้"; given `itemCount: 0`, delete sends `DELETE` and the row disappears; a 409 `CATEGORY_NOT_EMPTY` shows the blocked message.
- **AC-6** — Given `/pos/menu/modifiers`, then each group shows its rule chip, active option count and "ใช้กับ n เมนู"; "เพิ่มกลุ่ม" opens an empty Drawer; save sends `POST` with the schema shape and the list shows the new group.
- **AC-7** — Given an existing group, when an option's Switch is turned off and saved, then `PATCH` `options` omits that id; turning it back on and saving re-lists the id. `maxSelect` greater than Switch-on rows → inline error, no request.
- **AC-8** — Group validation: ต้องเลือก on with ขั้นต่ำ 0, max < min, negative price, no option on → inline + summary, no request; ต้องเลือก off forces ขั้นต่ำ 0 (disabled). The "ลูกค้าเห็น" line shows the rule wording.
- **AC-9** — Given `usedByItems > 0`, delete is disabled with "ใช้อยู่ใน n เมนู — ถอดออกจากเมนูก่อน"; given 0, delete opens the confirm, ยกเลิก sends nothing, ลบ sends `DELETE` and the group leaves the list.
- **AC-10** — Given the Modal or modifiers page is open, when a `menu.changed` event arrives, then the categories / groups refetch without a reload.
- **AC-11** — Given a category "ไฮบอล" (visible or hidden), when `POST { name: " ไฮบอล " }` or a rename to it, then 409 `CATEGORY_NAME_TAKEN` and nothing is written; "Beer" vs "beer" → 409; renaming a category to its own name with other spacing → 200; the Modal shows "มีหมวดชื่อนี้แล้ว" on the Input. Given duplicate names already in the DB, `migration:run` fails listing them.
- **AC-12** — Gates + run proof; OpenAPI + `openapi:check`; README.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-11 (API + migration) | unit + e2e (real Postgres) | `app/backend/src/modules/menu/application/menu-catalog.service.spec.ts` · `app/backend/test/menu-write.e2e-spec.ts` |
| AC-1 | unit | `app/packages/contracts/src/schemas/menu-write.test.ts` (category schema with / without `itemCount`) |
| AC-2 – AC-5, AC-11 (UI) | component (MSW) | `app/frontend/src/app/pos/menu/_components/categories/CategoriesModal.test.tsx` |
| AC-6 – AC-9 | component (MSW) | `app/frontend/src/app/pos/menu/modifiers/_components/ModifierGroupEditor.test.tsx` + `ModifierGroupList.test.tsx` |
| AC-10 | component | fake-socket test (pattern of `useMenuLive.test.ts`) |
| AC-2, AC-6 | e2e (MSW) | `app/frontend/e2e/menu-backoffice.spec.ts` |

Gate commands (all must pass):
```bash
pnpm --filter @bar/contracts build
pnpm --filter @bar/contracts lint && pnpm --filter @bar/contracts typecheck && pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck && pnpm --filter @bar/backend test && pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:check
pnpm --filter @bar/frontend lint && pnpm --filter @bar/frontend typecheck && pnpm --filter @bar/frontend test && pnpm --filter @bar/frontend test:e2e && pnpm --filter @bar/frontend build
```
Run proof (fresh on the work SHA; stop the dev backend before `test:e2e` — KJ state):
```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
pnpm --filter @bar/backend migration:run
pnpm --filter @bar/backend start:dev   # separate shell
curl -fsS localhost:3001/api/health
```
UI (real API, two tabs): จัดการหมวด → drag ไฮบอล above เบียร์สด, ↓ with the keyboard → order entry tab shows the new chip order without reload · hide โปรโมชั่น → gone from order entry · add "ทดสอบ" → add " ทดสอบ " again → "มีหมวดชื่อนี้แล้ว" → delete it · try delete ค็อกเทล → disabled "ยังมี n เมนู" · ตัวเลือกเสริม → create "ท็อปปิ้ง" (not required, max 2, 3 options) → link it in the item editor → switch one option off + save → POS order sheet greys it → back on → try delete → disabled → unlink in the editor → delete → confirm → gone. Screenshots in the handoff.

### Local Sonar scan
- **Required for this brief: yes.**
- Approved exclusions / "won't fix": none.

## 6. Constraints
- **No new dependency** — drag uses `useDragAndDrop` / `GridList` from the existing `react-aria-components`; HeroUI v3 for Modal, Drawer, Switch, NumberField, AlertDialog, Toast (CD-12 R8: HeroUI directly where the DS lacks one).
- `frontend.md` Hard Limits; tokens only; Thai copy hardcoded; forms validate with the contracts Zod schemas.
- Backend: one migration (DR-025 index) and nothing else in the schema; `PermissionsGuard` unchanged; no change to the delete guard; `save()` on `menu_category`.
- Drag handle and ↑ / ↓ buttons are labelled (`aria-label="ย้าย {name} ขึ้น"` etc.); keyboard reorder must work (AC-2).

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):** `MenuCategorySchema.itemCount: z.number().int().min(0)` required on every category response · route `/pos/menu/modifiers` · categories as a Modal on `/pos/menu` · drag via `useDragAndDrop` from `react-aria-components@^1.21.1` (no new package) + ↑ / ↓ buttons · reorder = full-list `PUT /menu/categories/order`, optimistic with revert · option Switch = omit / re-list the id in `PATCH` · group delete behind an AlertDialog · live refresh through the existing `menu.changed` / `useMenuLive` — no new WS event · DR-025 locks (index `uq_menu_category_name` on `lower(trim(name))`, migration file name `<timestamp>-CategoryNameUnique.ts`, fail-loud on existing duplicates, 409 `CATEGORY_NAME_TAKEN` mapped only for `23505` on that index).
- **Q1 — category name unique? ✅ Field (2026-10-23): B — server-side → DR-025 (Pending).** *Was recommended:* A — client-side check only.
- **Likely DRs:** DR-025 (raised, Pending — Ready needs it Approved) · any need for a new package for drag.

## 8. Unlocked Protected Files
- `docs/schema.sql`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions (all merged)
- [ ] Size within workflow §2 — **~1.4–1.5k vs ~500; Field chose one brief (Selected 1)** — confirm at Ready
- [ ] No unresolved decision blocking the main outcome — **DR-025 Pending** (needs Field's "approve DR-025")
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-23 | Initial Draft (Cowork) — categories + add-on screens from BRIEF-040 Out; `itemCount` added (Field interview, Selected 1–11) |
| 1 | 2026-10-23 | Q1 = B (Field) → DR-025 raised (Pending, interview Selected 12); migration + 409 `CATEGORY_NAME_TAKEN` + `docs/schema.sql` unlock added; AC-11 |

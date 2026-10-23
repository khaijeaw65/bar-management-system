# Handoff — BRIEF-045 Web POS: categories manager + add-on groups screen (+ category `itemCount`)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-23 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-045-menu-categories-addons-ui` (seed `64e82be`) |
| **Assigned auditor** | Cowork |
| **Status** | Audit PASS (Cowork, S `419a159`, re-audit) — PR opened |
| **AI usage** | n/a (Field's brief, agent-written) |

## Summary
- **Backend + contracts:** `MenuCategory.itemCount` (required, int ≥ 0) on every category response — one grouped count in the catalog read, `0` on create, a count query after `PATCH`. Error code `CATEGORY_NAME_TAKEN`. DR-025: migration `1762700000000-CategoryNameUnique` (fails loudly listing duplicates, then `uq_menu_category_name` on `lower(trim(name))`); `menu-write.typeorm-repository.ts` maps `23505` on that constraint (only) to 409 on `POST` and `PATCH { name }`. `docs/schema.sql` §4 and `docs/api/README.md` updated, OpenAPI regenerated.
- **Categories Modal** (`/pos/menu` → "จัดการหมวด", `_components/categories/*`, `_hooks/useCategories.ts`): `GridList` + `useDragAndDrop` (react-aria-components, no new package) with drag handle and ↑ / ↓ buttons; reorder / hide are optimistic (revert + Toast on failure); add, rename (inline, Enter / blur saves, Esc cancels), delete (disabled with "ลบไม่ได้ — ยังมี n เมนูในหมวดนี้"; 409 race → Toast).
- **Add-on groups** (`/pos/menu/modifiers`, "ตัวเลือกเสริม" in the toolbar): list with rule chip / active option count / "ใช้กับ n เมนู"; Drawer 480 editor (`GroupEditor`, `RuleFields`, `OptionRows`); option "ขาย" Switch = omit / re-list id in `PATCH`; validation with the contracts schemas; "ลูกค้าเห็น" preview; delete behind an AlertDialog, disabled while in use; `useMenuLive()` on the screen.
- **Client / mocks:** `apiPut`, `apiDelete`; category + group functions in `lib/api/menu.ts`; stateful MSW handlers (`itemCount`, `usedByItems`, name clash, delete guards).

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `menu-write.e2e-spec.ts` "counts every item…" (inactive items, hidden category, POST 0, PATCH, PUT) · `menu-write.test.ts` |
| AC-2 | ✅ (arrows + revert) | `CategoriesModal.test.tsx` · `e2e/menu-backoffice.spec.ts`; the pointer drag path shares `movedIds` / `reorder` but is **not** exercised (jsdom has no drag events) |
| AC-3 | ✅ | `CategoriesModal.test.tsx` "hides a category…" |
| AC-4 | ✅ | "adds a category, rejects an empty or taken name, and renames one" |
| AC-5 | ✅ | "blocks delete while…" (409 `CATEGORY_NOT_EMPTY` path is code-only, not tested) |
| AC-6 | ✅ | `ModifierGroupList.test.tsx` · `ModifierGroupEditor.test.tsx` "creates a group…" · e2e |
| AC-7 | ✅ | "an option's switch leaves its id out…" · "maximum above the switched-on options…" |
| AC-8 | ✅ | "blocks invalid groups…" · "required with minimum 0…" |
| AC-9 | ✅ | `ModifierGroupList.test.tsx` (disabled + reason · confirm / cancel / delete) |
| AC-10 | ✅ | `ModifierGroupsLive.test.tsx` (fake socket); the Modal rides `MenuList`'s existing `useMenuLive` |
| AC-11 | ✅ | `menu-write.e2e-spec.ts` "keeps category names unique…" + "refuses to create the unique index while duplicates exist" · Modal test (taken name keeps the value) |
| AC-12 | ✅ | gates below |

## Gate Evidence (G1)
On work SHA `c99a1c2`:
| Command | Exit | Result |
|---|---|---|
| contracts build / lint / typecheck / test | 0 | 79 passed |
| backend lint / typecheck / test | 0 | 137 passed |
| backend `test:e2e` (dev backend stopped first) | 0 | 169 passed (25 files) |
| backend `openapi:export` | 0 | regenerated; `openapi:check` is a `git diff` check and passes once the file is committed (it is, in `7431d97`) |
| frontend lint / typecheck / build | 0 | pass |
| frontend `test` | 0 on re-run | 174 tests. Under full-suite load 2–3 timeout-prone tests (`MenuEditor`, `CartPanel`, `ModifierGroupEditor` create) failed once each and passed alone and on re-run (same load flake as 038 audit F4) |
| frontend `test:e2e` | 0 | 21 passed |

## Sonar
Gate ERROR as on main: `new_coverage` 0 %, 18 issues — the same 18 pre-existing ones (`test/setup.ts`, backend order / payment / menu-availability, `MenuItemRow`); none in this brief's files.

## Audit round 1 — Must fix #1–#4 (work SHA `419a159`)
- **#2** `CategoryNameInput`: `submitting` ref ignores Enter / blur while a save is pending (test: Enter then blur → exactly one `PATCH`). `6d7b372`.
- **#3** `ModifierGroupEditor.test.tsx`: required + min 2 + max 1 → "เลือกสูงสุดต้องไม่น้อยกว่าขั้นต่ำ", no request. `6d7b372`.
- **#4** `menu-write.e2e-spec.ts`: duplicate-row `DELETE` moved into `finally` before `migration.up`. `6d7b372`.
- **#1** run proof below. It found **two bugs the tests missed**, fixed in `419a159`:
  1. **Clicking the visible switch track toggled nothing** (categories "แสดง", option "ขาย", "ต้องเลือก") — the same HeroUI quirk as BRIEF-041 Rev 2 (track sits outside the `<label>` that holds the input); the jsdom tests clicked the hidden input. New `menu/_components/MenuSwitch.tsx` turns a click on `[data-slot="switch-control"]` into the toggle (label / keyboard still use the Switch's `onChange`); used in `CategoryRow`, `OptionRows`, `RuleFields`. New test clicks the track (`CategoriesModal.test.tsx`).
  2. A React Aria console error "stopPropagation is now the default…" from `event.stopPropagation()` in `CategoryNameInput` — removed (RAC already stops propagation; verified Esc cancels the input without closing the modal).

Gates on `419a159`: frontend lint · typecheck · build 0 · unit 177 passed · e2e 21 passed. Backend untouched since `c99a1c2` except the test move (#4): lint, typecheck, `test:e2e` 169 passed on `6d7b372`. Not re-run after `6d7b372`: contracts and backend unit (no source change).

## Run proof (§5, real API)
On the work tree, real API `:3001` (plain `node dist/main`) + `next dev :3000`, Field signed in via LINE, the in-app browser (pane ≈ 800 px wide), two tabs: back office and the order-entry page of T1 (`/pos/tables/<visit>/order`).
1. **Categories modal:** counts from the API match the list (เบียร์สด 3, ค็อกเทล 3, …); every row with items shows "ลบไม่ได้ — ยังมี n เมนูในหมวดนี้" with delete disabled.
2. **Drag with the mouse** (ไฮบอล from 4th to 2nd row) moved it at once; after a full reload the order persisted. **↑ with the keyboard** (focus the button, Enter) moved ไฮบอล to 2nd and kept focus. The order tab (opened after) showed chips "โปรโมชั่น · ไฮบอล · เบียร์สด · …".
3. **Hide โปรโมชั่น** (after fix 1) → the already-open order tab dropped the chip **without a reload** (`menu.changed`); shown again → back.
4. **Add** "ทดสอบ" → row appended with "0 เมนู"; add " ทดสอบ " → "มีหมวดชื่อนี้แล้ว" under the field, typed value kept; **Esc** cancelled the input and left the modal open; **delete** ทดสอบ → row gone.
5. **Groups page:** real list ("น้ำแข็ง ต้องเลือก 1 · ใช้กับ 2 เมนู", "เพิ่ม ไม่บังคับ · สูงสุด 1"). Created "ท็อปปิ้ง" (ไม่บังคับ, max 2, ชีส 20 / ไข่ดาว 0 / เบคอน 0) → listed "ไม่บังคับ · สูงสุด 2 · 3 ตัวเลือก · ใช้กับ 0 เมนู"; linked it to จินโทนิค (ไฮบอล) in the item editor → "ใช้กับ 1 เมนู", delete disabled with the reason.
6. **Option switch off** (ชีส, after fix 1) + save → the POS order sheet for that item showed ชีส **disabled**; reopening the editor loaded the option with its switch off; **switch on** + save → the sheet showed it enabled again (live, no reload).
7. **Delete:** unlinked the group in the item editor → delete enabled → AlertDialog "ลบกลุ่ม ท็อปปิ้ง? / ลบแล้วกู้คืนไม่ได้" → ลบ → the group left the list.
Screenshots were viewed in the session only (the browser tool cannot write files). Test data left in the dev DB: none (ทดสอบ and ท็อปปิ้ง deleted / archived; จินโทนิค (ไฮบอล) saved once with and once without the group). The test group row stays archived (`is_active = false`, DR-024).
Visual note: in the 800 px pane the group drawer's text inputs have no visible border (placeholders show, typing works) — not in the brief; for CD-12 polish.

## Limitations
- Pointer drag-and-drop has no automated test (jsdom); it was exercised by hand in the run proof above.
- `uq_menu_category_name` is an expression index, so it is not declared on the TypeORM entity (decorators take columns only) — the migration and `docs/schema.sql` carry it; `docs/erd.html` is Cowork's (DR-025).
- PUT `/categories/order` returns active categories only, so the UI refetches instead of replacing the cache from the response (hidden rows would vanish).
- Diff is ~1.55k added lines vs the ~500 target (accepted by Field, Selected 1).

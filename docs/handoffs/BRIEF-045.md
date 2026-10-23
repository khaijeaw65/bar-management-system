# Handoff — BRIEF-045 Web POS: categories manager + add-on groups screen (+ category `itemCount`)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-23 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-045-menu-categories-addons-ui` (seed `64e82be`) |
| **Assigned auditor** | Cowork |
| **Status** | Implemented — work SHA `c99a1c2` (backend `7431d97` + UI `c99a1c2`), awaiting `audit BRIEF-045` |
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

## Run proof
On `c99a1c2`: `migration:run` applied `CategoryNameUnique1762700000000` on dev DB `bar`; fresh `nest build` + `node dist/main` → `/api/health` 200 `{"db":"up"}` (dev backend left running on :3001).
**Not done:** the two-tab UI walkthrough on the real API (needs Field's LINE sign-in); the UI is verified by component tests, Playwright against the in-page MSW server and the backend e2e. Field / auditor to do the walkthrough in the brief §5 if wanted.

## Limitations
- Pointer drag-and-drop is untested (above); keyboard / button reorder is.
- `uq_menu_category_name` is an expression index, so it is not declared on the TypeORM entity (decorators take columns only) — the migration and `docs/schema.sql` carry it; `docs/erd.html` is Cowork's (DR-025).
- PUT `/categories/order` returns active categories only, so the UI refetches instead of replacing the cache from the response (hidden rows would vanish).
- Diff is ~1.55k added lines vs the ~500 target (accepted by Field, Selected 1).

# Handoff — BRIEF-040 Web POS: menu management — item list + editor + live menu

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-23 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-040-menu-editor-ui` (seed `2ee875c`) · audited work SHA `fbaee5b` (first audit `3df722b`, Must fix #1 fixed in `fbaee5b`) |
| **Assigned auditor** | Cowork |
| **Status** | Implemented — **run proof on the real API still open** (see Limitations) |
| **AI usage** | n/a (Field's brief, agent-written) |

## Summary
- **List** `/pos/menu`: search + category chips (single select, combine), `?includeHidden=true` reads, "ซ่อนอยู่" chip on items of a hidden category, "โปร" chip, ส่งไปที่ column, row tap → editor (`onAction`), per-row sold-out Switch (optimistic, reverts + Toast on failure, `mark-(un)available`), `?highlight=<id>` after a save. States: skeleton / empty (+ เพิ่มเมนูแรก) / no results / error + retry.
- **Editor** `/pos/menu/new`, `/pos/menu/[id]`: ข้อมูลหลัก, ประเภท (สูตร saves as `simple`), ส่งไปที่ (hidden + `null` for ค่าบริการ), เมนูโปร Switch, price options (≥ 1, first row not removable), add-on group chips. Validation with the contracts schemas (inline + summary Alert, nothing sent). Create: `POST` + `Idempotency-Key` (kept for a retry of the same body, new key if the body changed). Edit: `PATCH` with the loaded `updatedAt`. 409 `MENU_ITEM_STALE` → warning Alert, typed values kept, "โหลดฉบับล่าสุด" loads `details`. Rename confirm (AlertDialog, DR-022) for the item name or an existing option's name. Leave guard reuses the settings dialog (moved to `components/ui/LeaveDialog.tsx`, `hooks/useLeaveGuard.ts`; `go()` added).
- **Live menu:** `hooks/useMenuLive.ts` — `menu.changed` + `menu.availability_changed` invalidate `["menu"]`; used by the list and `useOrderMenu`.
- **Mocks:** `mocks/menu.ts` (stateful items, idempotent create, stale 409, mark-available) wired from `handlers.ts`; reset per test in `test/setup.ts`.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `MenuList.test.tsx` (filter together, hidden chip, row tap vs Switch, failed toggle) |
| AC-2 | ✅ | `MenuEditor.test.tsx` "creates an item…" · `e2e/menu-editor.spec.ts` |
| AC-3 | ✅ | `MenuEditor.test.tsx` price edit + stale · e2e stale |
| AC-4 | ✅ | `MenuEditor.test.tsx` rename item / existing option; price edit has no dialog |
| AC-5 | ✅ | `MenuEditor.test.tsx` validation + charge |
| AC-6 | ✅ | `MenuEditor.test.tsx` leave |
| AC-7 | ✅ | `hooks/useMenuLive.test.ts` (fake socket) |
| AC-8 | ✅ | gates ✅; run proof on the real API below |

## Gate Evidence (G1)
Run on the working tree after the last code change (before the handoff commit):

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/frontend lint` | 0 | pass |
| `pnpm --filter @bar/frontend typecheck` | 0 | pass |
| `pnpm --filter @bar/frontend test` | 0 | 151 passed (31 files) |
| `pnpm --filter @bar/frontend test:e2e` | 0 | 17 passed |
| `pnpm --filter @bar/frontend build` | 0 | pass (`/pos/menu/new`, `/pos/menu/[id]` listed) |

## Run proof
Real API (`:3001`) + `next dev :3000` (web-real) on the work tree, Field signed in via LINE; browser viewport 1280×900. Steps in the in-app browser:
1. `/pos/menu/new`: จินโทนิค, ไฮบอล, บาร์, ปกติ 220 + ดับเบิล 320, add-on "น้ำแข็ง" → บันทึก → `POST /menu/items` **201** → toast, redirect to `/pos/menu?highlight=<id>`, row in the list.
2. Tab B (same item) saves ปกติ 220 → 230; tab A (old copy) sets ปกติ 250 and saves → `PATCH` **409** → "เมนูนี้ถูกแก้โดยคนอื่น" Alert, typed 250 kept; "โหลดฉบับล่าสุด" → 230.00 / 320.00.
3. Rename ดับเบิล → ดับเบิ้ล and 320 → 340 → บันทึก → rename dialog "ตัวเลือก: ดับเบิล → ดับเบิ้ล"; ยืนยัน → `PATCH` **200**.
4. Order entry for T1 in a third tab that was never reloaded: the item sheet shows "ดับเบิ้ล ฿340.00" (refetch from `menu.changed`; two `GET /menu/items` seen in that tab).
Not captured as files: screenshots were taken in the session only. The test item "จินโทนิค" (ไฮบอล) is left in the local dev DB `bar`.

## Audit round 1 fix
Must fix #1: `draftOf` now keeps only `isAvailable` price options and takes add-on links from them, so saving never re-activates a removed option (also on the stale reload). Two tests added. Re-run on `fbaee5b`: lint, typecheck, build exit 0; unit 153 passed; e2e 17 passed (the first unit run had 2 load flakes, green on two re-runs). Run proof not repeated (test-covered change). Merged `main` (docs #88/#89) before this commit.

## Sonar
Gate ERROR (as on main): `new_coverage` 0 % (no coverage path yet) and 17 issues, none in this brief's files. First scan flagged 2 S6819 (`role="group"`) in `MenuToolbar` / `AddOnsSection` → fixed with `<fieldset>` + `<legend>`; re-scan: HIGH 5 · MEDIUM 5 · LOW 6 · INFO 1, all in `test/setup.ts` and backend files that existed before.

## Deviations / notes for the auditor
- **List Switch was not on main** — the brief says "stays", but `MenuItemRow` had none; built it (AC-1 needs it).
- **Editor files live in `menu/_components/editor/`**, not `[id]/_components/`: `new` and `[id]` share them and `_components` must not be imported across sibling routes.
- **No react-hook-form** (not installed; brief forbids a new dependency): plain state + Zod `safeParse`.
- **Server 400** carries messages without paths, so they show in the failure Alert, not under a field.
- Leave dialog is the existing Modal-based one (settings), not a new AlertDialog; copy "ยังไม่ได้บันทึก / อยู่ต่อ / ออกโดยไม่บันทึก".
- `.env.local` lacks `NEXT_PUBLIC_API_MOCKING` (setup gap, name only).

## Limitations
- Photo (041), categories / add-on screens (045), phone layout, permission gating: out of scope.

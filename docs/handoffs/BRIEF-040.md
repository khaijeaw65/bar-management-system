# Handoff — BRIEF-040 Web POS: menu management — item list + editor + live menu

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-23 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-040-menu-editor-ui` (seed `2ee875c`; no PR until audit PASS) |
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
| AC-8 | ⚠️ | gates ✅; real-API run proof not done |

## Gate Evidence (G1)
Run on the working tree after the last code change (before the handoff commit):

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/frontend lint` | 0 | pass |
| `pnpm --filter @bar/frontend typecheck` | 0 | pass |
| `pnpm --filter @bar/frontend test` | 0 | 151 passed (31 files) |
| `pnpm --filter @bar/frontend test:e2e` | 0 | 17 passed |
| `pnpm --filter @bar/frontend build` | 0 | pass (`/pos/menu/new`, `/pos/menu/[id]` listed) |

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
- **Run proof (real API) not done:** the web app needs a LINE sign-in and there is no dev login; I did not mint a session by script. Needs Field to sign in on `http://localhost:3000` (web-real), then run the brief's steps (create จินโทนิค → second tab price change → stale → rename confirm → order entry without reload) with screenshots.
- Photo (041), categories / add-on screens (045), phone layout, permission gating: out of scope.

# BRIEF-040 — Web POS: menu management — item list + editor (no photo) + live menu

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent) — Q1 |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | frontend |
| **Revision** | 1 |
| **Depends on** | BRIEF-038 ✅ (#80) · 039 ✅ (#81, `includeHidden`, `isActive`) · 042 ✅ (#83, name snapshots) · 044 ✅ (#87, `GET /menu/modifier-groups`) |
| **References** | CD-12 boards `list` (1–2), `editor` (1–10), §4 Action table, §9 (D2 full-page editor, D3 ≥ 1 option, R6 states, R7-1 stale 409, R9 promo Switch) · DR-012 (station except charge) · DR-014 #10 (เมนูโปร) · DR-022 (rename confirm) · BRIEF-038 contracts (`CreateMenuItemSchema`, `UpdateMenuItemSchema`) |
| **Audit depth** | Compact (UI; every rule is enforced server-side) |
| **Size** | ~1.5 days · est. ~700–850 net-new lines incl. tests — above the ~500 target; photo (041) and the categories / add-on screens (045) are already split out |

---

## 1. Goal
The manager adds and edits menu items from the POS back office — price options, station, category, promo flag, add-on groups — and every POS screen shows the change without a reload.

## 2. Scope
### In
- **`/pos/menu` list (upgrade of BRIEF-016/027):** search (trimmed substring on the Thai name) + category chips (ทั้งหมด default, single select, combines with search) + "เพิ่มเมนูใหม่" → `/pos/menu/new`; row tap → `/pos/menu/[id]`; the sold-out Switch stays (stops row-tap propagation). Reads with `?includeHidden=true`; items of a hidden category carry a "ซ่อนอยู่" chip.
- **Editor `/pos/menu/new` and `/pos/menu/[id]`** (CD-12 editor boards, 1280 / 1024): breadcrumbs · ข้อมูลหลัก (ชื่อเมนู, หมวด Select, คำอธิบาย TextArea) · ประเภท RadioGroup ทั่วไป / สูตร / ค่าบริการ (สูตร saves as `simple` with the S2 note, CD-12 editor·6) · ส่งไปที่ บาร์ / ครัว (hidden for ค่าบริการ, sent `null`) · เมนูโปร Switch · ตัวเลือก (ราคา) table (≥ 1; one row = base price, its remove disabled; existing rows keep their `id`) · ตัวเลือกเสริม chips from `GET /menu/modifier-groups` (applied to every price option — BRIEF-038) · sticky footer ยกเลิก / บันทึก.
  - Save: create → `POST /menu/items` with one `Idempotency-Key` per editor session; edit → `PATCH` with the `updatedAt` loaded. Toast "บันทึกเมนูแล้ว" → back to the list with the row highlighted.
  - Validation inline + summary Alert ("ยังบันทึกไม่ได้ — แก้ n จุด…") using the contracts schemas; server 400 field errors mapped the same way.
  - **409 `MENU_ITEM_STALE`** → editor·9: warning Alert "เมนูนี้ถูกแก้โดยคนอื่น…" + "โหลดฉบับล่าสุด" (reloads from `details`); typed values stay until reload.
  - **Rename confirm (DR-022, Pre-decided):** saving a changed item name or a changed name of an *existing* price option first opens an AlertDialog listing the old → new names; ยืนยัน saves, ยกเลิก sends nothing. Copy is this brief's call.
  - Leaving with unsaved changes → AlertDialog (CD-12 editor·8).
- **Live menu:** `menu.changed` (BRIEF-038) and `menu.availability_changed` invalidate the `["menu", …]` queries on `/pos/menu` and in POS order entry (`useOrderMenu`) — no reload needed after an edit on another device.
- `lib/api/menu.ts` write functions + MSW handlers; states per CD-12: list skeleton / empty / no results / error + retry; editor loading / error.

### Out (do NOT build here)
- Photo upload / thumbnails → **BRIEF-041** · categories screen (create / rename / reorder / hide / delete) and add-on groups screen → **BRIEF-045** (to draft) · phone 390 layout (Q2) · permission gating (IAM brief) · promo window editor (S2) · item delete (S1 has none).

## 3. Contract
- **Endpoints used:** `GET /menu/items?includeHidden=true`, `GET /menu/items/:id`, `GET /menu/categories?includeHidden=true`, `GET /menu/modifier-groups`, `POST /menu/items`, `PATCH /menu/items/:id`, existing mark-(un)available.
- **WS events used:** `menu.changed`, `menu.availability_changed`.
- **Contracts changes:** none.
- **Business rules:** all enforced by the API (DR-012 station rule, ≥ 1 option, price ≥ 0, stale check); the client validates with the same schemas for early feedback.

## 4. Acceptance Criteria
- **AC-1** — List: search + category chips filter together; hidden-category items show "ซ่อนอยู่"; row tap opens the editor, the Switch toggles without opening it.
- **AC-2** — New item with 2 price options, bar, one add-on group → `POST` with an `Idempotency-Key`; back on the list it appears highlighted.
- **AC-3** — Edit a price → `PATCH` with the loaded `updatedAt`; a stale save → editor·9 Alert, typed values kept, "โหลดฉบับล่าสุด" loads the server copy.
- **AC-4** — Changing the item name or an existing option's name opens the rename confirm; ยกเลิก sends nothing; other edits save without it.
- **AC-5** — Validation: station required unless ค่าบริการ (hidden + `null` then), ≥ 1 option, price ≥ 0 — inline + summary, no request.
- **AC-6** — Leaving with changes asks first.
- **AC-7** — A `menu.changed` event refreshes `/pos/menu` and order entry without a reload.
- **AC-8** — Gates + run proof.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1 | component | `src/app/pos/menu/_components/MenuList.test.tsx` |
| AC-2 – AC-6 | component (MSW) | `src/app/pos/menu/[id]/_components/MenuEditor.test.tsx` |
| AC-7 | component | live-menu hook test (fake socket) |
| AC-2, AC-3 | e2e (MSW) | `e2e/menu-editor.spec.ts` |

Gate commands (all must pass):
```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend test:e2e
pnpm --filter @bar/frontend build
```
Run proof (real API): create "จินโทนิค" (2 options, บาร์, ระดับน้ำแข็ง) → open it in a second tab, save a price change there → first tab save → editor·9 → reload → rename an option → confirm dialog → order entry in a third tab shows the new price without reload. Screenshots in the handoff.

### Local Sonar scan
- **Required for this brief: yes.**

## 6. Constraints
- `frontend.md` Hard Limits; tokens only; HeroUI v3 (Table, Input, Select, TextArea, RadioGroup, Switch, Chip, AlertDialog, Alert, Breadcrumbs — CD-12 R8: use HeroUI directly where the DS lacks one).
- No new dependency; forms validate with the contracts Zod schemas.

## 7. Decision Points (Field Guard)
- **Pre-decided:** routes `/pos/menu`, `/pos/menu/new`, `/pos/menu/[id]` (CD-12 canvas `/admin/menu/…` maps to the POS shell, DR-002) · rename confirm (DR-022) · สูตร saves as `simple` · add-on groups apply to every price option (BRIEF-038).
- **Q1 — Implementer.** *Cowork recommends:* **A — kj (executor agent)**, same as the menu backend this week. *Alternative:* **B — methee** (learning mode §8: ≤ 20 % agent; would need a smaller split).
- **Q2 — Phone 390 layout.** BRIEF-037 deferred the responsive shell "to the menu UI brief". *Cowork recommends:* **A — own brief after 8 Nov** (shell + nav drawer + 390 list for the J2 sold-out-from-phone journey). *Alternative:* **B — here** (~+300 lines).
- **Likely DRs:** none.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [ ] Named implementer and auditor; scope/ACs/contracts/references complete
- [ ] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [ ] Size within workflow §2 (≤ ~3 working days, ~500 net-new lines); otherwise split
- [ ] No unresolved decision blocking the main outcome
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-23 | Initial Draft (Cowork) — menu UI part 1; photo → 041, categories / add-on screens → 045 |

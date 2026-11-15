---
id: CD-16
title: Back office — stock items · recipes · opening stock
revision: 2
status: approved   # R2–R7 accepted by Field 2026-11-15 · source snapshot pending (before stock brief)
approved_by: Field
approved_on: 2026-11-15
canvas: https://claude.ai/artifact/6hAmmjP792i7PnqafPs4wY
canvas_version: 1794724290-2361   # rev 2 (stickies green); snapshot pinned when taken
ds_version: 1791561405-c72e
source: docs/design/source/CD-16/   # after approval
surfaces: [web-backoffice]
sizes: [1280x800, 1024x768, 390x844]
brief: CD-16-stock-items.md
drs: [DR-031]
depends_on: [CD-12, CD-13]
supersedes: brief paste text where they conflict
---

# CD-16 — Back office: stock items · recipes · opening stock

Built on The Loft Bar Design System (real DS components; dark/light Theme tweak on every board). **Do not port canvas markup** — build with HeroUI v3 + tokens (`docs/rules/frontend.md`). Sample data only. Template: `cd-template.md` v2 · board rules: `board-convention.md`.

## 0. Review items
All accepted by Field 2026-11-15 (stickies green).

| # | Item | Recommendation |
|---|---|---|
| R1 ✓ | Pain point (Field 9 Nov): small bar — owner counts and keys into POS; medium/large — POS for sales + staff hand count sent in a LINE group, owner compares by hand. Consequence (assumption): counts lost in chat, no history per item, loss noticed late. | Done. |
| R2 ✓ | **D1 rail + tabs:** new rail item สต็อก (icon `package`) under เมนู; tabs รายการสต็อก · นับสต็อก / ของหาย (CD-17) · จัดซื้อ (CD-18); shown with `inventory:manage`. | Accept. |
| R3 ✓ | **Schema gaps → stock brief (not decided here):** `inventory_item` lacks container name/size, auto-86 switch, default supplier, purchase unit + per-purchase qty, average cost (replace `cost_per_unit`), `is_active`. `item_type = recipe` may be obsolete (any item can have a recipe). | Decide in the stock brief (30 Nov) + DR-031 amendment if needed. |
| R4 ✓ | **Archive, not delete:** items with history (sale / receive / count) can't be deleted — "ปิดใช้งาน" hides, stops deducting; recipes keep the line with a warning. Items with no history can be deleted. | Accept — keeps loss + P&L history correct. |
| R5 ✓ | **Low-stock threshold unit:** containers when the item has one (2 ขวด), base unit otherwise (20 ชิ้น); stored in base unit. | Accept. |
| R6 ✓ | **Cost per drink in the recipe** ("ต้นทุนวัตถุดิบ ≈ ฿78.74 · 30% ของราคา") = average cost × qty. Added by Cowork, not in the brief. | Accept (cheap, helps pricing) or remove one line. |
| R7 ✓ | **DS gap:** stock-item picker must be searchable (HeroUI ComboBox / Autocomplete); DS Select can't search → drawn as open Select. | Log for CD session 5 (DS gap-fill). |

## 1. Overview
- **Goal:** owner sets up each stock item once (container, opening stock, cost) and links it to menu variants; the system deducts on every sent order and 86s the menu at 0.
- **User + context:** owner / manager (`inventory:manage`) · Monday afternoon before opening, laptop or phone · set up once, edit rarely.
- **Entry → exit:** rail สต็อก · เมนู › แก้ไขเมนู › ตัดสต็อก. Exit: saved → list; recipe applies to new orders only.
- **Outcome:** one page per item; one line per ingredient; low / out and auto-86'd menus visible at a glance.
- **Out of scope (D8):** เปิดของใหม่, loss, override log, count, adjustments (CD-17) · suppliers, PO, receive, ซื้อหน้าร้าน (CD-18) · staff app (CD-28) · ML (CD-26).
- **Journeys:** J1 set up Bulleit Bourbon (ขวด 700 ml, opening 4 ขวด @ ฿900) → link to โอลด์แฟชั่น 60 ml (E1–E4).

## 2. Boards
| Board | Type | States |
|---|---|---|
| `overview` | OVERVIEW | goal, pain point, user, outcome, entry/exit, journey, out of scope, decisions |
| `journey-1` | JOURNEY | list → new item filled → recipe pick → recipe filled → saved (E1–E4) |
| `list · 1280` | STATES | 1 loaded · 2 loading · 3 empty · 4 error · 5 filter ใกล้หมด / หมด |
| `list · ค้นหา · 1024 · สิทธิ์` | STATES | 6 no result · 7 1024 + long names · 8 no permission |
| `list · 390` | STATES | 1 loaded · 2 loading · 3 empty · 4 filter · 5 saved (new row + Toast) |
| `editor · 1280` | STATES | 1 edit (Jameson) · 2 new empty · 3 new filled · 4 category C · 5 validation |
| `editor · 1280 (ต่อ)` | STATES | 6 saving · 7 duplicate name 409 · 8 leave unsaved · 9 archive confirm · 10 1024 + long name |
| `editor · 390` | STATES | 1 new filled · 2 edit · 3 category C (full page, 390×1480) |
| `menu-recipe · 1280` | STATES | 1 none · 2 pick · 3 filled · 4 keg (2 variants, out → auto-86) · 5 validation |
| `menu-recipe · 390` | STATES | 6 archived item in recipe · 7 food (ชิ้น) · 8 filled · 9 saved |
| `flow` | FLOW MAP | set up · recipe · after setup (CD-04/06/14/17/18) |
| `Screen` | shared | the one screen component every board mounts (`renderVals()` = sample data) |

## 3. State coverage
| State | List | Editor | Menu recipe |
|---|---|---|---|
| default | ✓ list·1 | ✓ editor·1 / ·2 | ✓ ·3 |
| loading | ✓ ·2 | n/a (opens from list data; first paint uses list row) — **open: brief decides skeleton** | n/a (CD-12 editor loading) |
| empty | ✓ ·3 / ·6 | n/a | ✓ ·1 (no recipe) |
| error + retry | ✓ ·4 | shared list·4 (load) | shared CD-12 |
| validation | n/a | ✓ ·5 | ✓ ·5 |
| pending | n/a | ✓ ·6 | shared editor·6 pattern |
| success feedback | ✓ list·390·5 | → list Toast | ✓ ·9 / J1·5 |
| failure per reason | n/a | ✓ ·7 (409 name) | ✓ ·5 |
| stale / conflict | n/a | **not drawn** — reuse CD-12 editor·9 (409 STALE) if the brief adds `updatedAt` | same |
| disconnected | n/a (not realtime) | n/a | n/a |
| permission denied | ✓ ·8 | shared ·8 | CD-12 (menu:write) |
| long Thai text | ✓ ·7 | ✓ ·10 | n/a (names from stock list, same clamp) |
| smallest size | ✓ ·7 (1024) · 390 | ✓ ·10 (1024) · 390 | ✓ 390 |
| keyboard open | n/a (web) | n/a | n/a |

## 4. Action table
No stock API exists — every row is **needs API (stock brief, planned 30 Nov)**. Names below are proposals for the brief, not contracts.

| Action | API (status) | Permission | Success → UI | Failure → UI | Recovery | Data kept | Idempotency |
|---|---|---|---|---|---|---|---|
| list items | `GET /inventory/items?category&status&q` (needs API) | `inventory:manage` | list·1 | network → list·4 · 403 → list·8 | retry | filters | n/a |
| create item (+ opening stock) | `POST /inventory/items` (needs API) — creates item + one `inventory_transaction` `opening` | `inventory:manage` | list + Toast (list·390·5) | 400 → editor·5 · 409 name → editor·7 · network → Toast error, stay | fix / retry | form | client key per form; retry reuses it |
| edit item | `PATCH /inventory/items/:id` (needs API) | `inventory:manage` | list + Toast | 400 → ·5 · 409 name → ·7 · 409 unit in use → unit locked (editor·1 hint) | fix | form | n/a (PATCH) |
| archive item | `POST /inventory/items/:id/archive` (needs API) | `inventory:manage` | list without row + Toast | network → Toast error | retry | — | idempotent |
| save recipe | part of `PATCH /menu/items/:id` → variant `ingredients[] {inventoryItemId, quantity}` (needs API, menu brief) | `menu:write` | menu-recipe·9 | 400 qty ≤ 0 → ·5 · archived item → ·6 warning (save allowed) | fix | form | n/a |

## 5. e2e script (J1)
E1 list → "เพิ่มรายการ" opens new editor · E2 save Bulleit (A, ml, ขวด 700, opening 4 ขวด, ฿900, threshold 2 ขวด, ลัง = 6) → list shows "4 ขวด", status ปกติ · E3 menu โอลด์แฟชั่น › ตัดสต็อก: Bulleit 60 ml + น้ำเชื่อม 10 ml + น้ำแข็ง (C) on ปกติ; 120 / 15 on ดับเบิล · E4 save → Toast; next order of โอลด์แฟชั่น ปกติ deducts 60 ml Bulleit + 10 ml syrup, ice untouched.

## 6. Strings & sample data
All copy and data live in `Screen.dc.html` `renderVals()` (S items, E0 editor states, RC0 recipe states, DLG, TOASTS). Key strings: category labels "A · นับแม่น / B · คร่าว ๆ / C · ไม่นับ" · status "ปกติ / ใกล้หมด / หมด" · auto-86 description · "ยอดยกมา — กรอกครั้งเดียวตอนสร้าง" · "สูตรที่แก้ใช้กับออเดอร์ใหม่เท่านั้น".

## 7. Layout & tokens
Shell = CD-12 (PosRail 88 + top bar 56). Editor desk = 3 equal columns (C item = 2), phone = 1 column, sticky footer. List columns `1fr 140 190 130 170 40`. Tokens only; mapping in `app/frontend/src/app/globals.css`.

## 8. Components → platform
DS Tabs / Tag(count) / Badge(dot) / Input(suffix, prefix) / Select / Radio(description) / Switch(description) / Alert / Toast / DataTable(loading) / Skeleton → HeroUI v3 Tabs / Chip / Input / Select (**ComboBox for stock picker, R7**) / RadioGroup / Switch / Alert / Toast / Table / Skeleton. Alert dialogs drawn from tokens (DS Dialog limitation).

## 9. Behaviour rules
- Stock stored in base unit; shown as `floor(qty/size) container + remainder unit`; no container → base unit only.
- Yield is derived (size ÷ 30 ml shot, ÷ 45 ml glass), never typed.
- Opening stock only on create → one `opening` transaction; later changes only via receive (CD-18) / count & adjust (CD-17).
- Base unit locked once any recipe uses the item.
- Status: หมด = qty 0 · ใกล้หมด = qty ≤ threshold · else ปกติ; C = no status.
- Auto-86 (locked, notes Topic 1 Q3): default on for A/container items, off for B; at 0 blocks new orders only.
- Recipe: per variant; empty = not tracked; C lines shown, never deducted; applies to orders sent after save.
- **Standard questions:** filters single-select, "ทั้งหมด" always selectable · search trimmed, case-insensitive, substring on name · counts on chips don't change while searching (open — brief) · min size 1024 desk / 360 phone (390 drawn) · names truncate in table, full in inputs · icon-only buttons have `aria-label` · every value from API except fixed copy.
- User-mindset: one primary action per screen ✓ · status never colour only ✓ · loss-making actions confirm (leave, archive) ✓ · task cost: new item ≈ 9 fields once; recipe line = 2 inputs.

## 10. Revisions
| Rev | Date | Change | Authority |
|---|---|---|---|
| 1 | 2026-11-09 | Canvas built (11 boards + shared Screen) | D2 + D5 Field 9 Nov; rest Cowork defaults |
| 2 | 2026-11-15 | R2–R7 accepted, no canvas change except stickies → approved | Field |

## 11. Source snapshot
Pending — take before the stock brief (30 Nov) per cd-template §6.

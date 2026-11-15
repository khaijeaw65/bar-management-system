# Stock — UI

> Screens, states and actions for `docs/features/stock/`. Requirements: [requirements.md](requirements.md) · Design: [design.md](design.md). Every row here is an AC source for the frontend brief.
> Built from the Claude Design handoff(s) `docs/design/CD-16-handoff.md`, `docs/design/CD-17-handoff.md` (written before workflow Rev 24 — the CD came before `design.md`). The handoff stays the record of the canvas; this file is what briefs cite.

| | |
|---|---|
| **Design** | CD-16 rev 2 — **approved** (Field 2026-11-15) · canvas https://claude.ai/artifact/6hAmmjP792i7PnqafPs4wY · version `1794724290-2361` <br> CD-17 rev 2 — **approved** (Field 2026-11-15) · canvas https://claude.ai/artifact/HhGhQQe3XrQWouuqAfVSjZ · version `1794728931-f584` |
| **Design system** | DS version `1791561405-c72e` (The Loft Bar Design System) · `docs/design-system.md` · web = HeroUI v3, staff app = HeroUI Native |
| **Approved by** | CD-16: Field 2026-11-15 · CD-17: Field 2026-11-15 |
| **Frontend brief(s)** | none yet — stock briefs (planned 30 Nov) |
| **UI owner** | kj |

## CD-16 — Overview

- **Goal:** owner sets up each stock item once (container, opening stock, cost) and links it to menu variants; the system deducts on every sent order and 86s the menu at 0.
- **User + context:** owner / manager (`inventory:manage`) · Monday afternoon before opening, laptop or phone · set up once, edit rarely.
- **Entry → exit:** rail สต็อก · เมนู › แก้ไขเมนู › ตัดสต็อก. Exit: saved → list; recipe applies to new orders only.
- **Outcome:** one page per item; one line per ingredient; low / out and auto-86'd menus visible at a glance.
- **Out of scope (D8):** เปิดของใหม่, loss, override log, count, adjustments (CD-17) · suppliers, PO, receive, ซื้อหน้าร้าน (CD-18) · staff app (CD-28) · ML (CD-26).
- **Journeys:** J1 set up Bulleit Bourbon (ขวด 700 ml, opening 4 ขวด @ ฿900) → link to โอลด์แฟชั่น 60 ml (E1–E4).

## CD-16 — Screens (boards)

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

## CD-16 — Screen × State matrix

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

## CD-16 — Action table

No stock API exists — every row is **needs API (stock brief, planned 30 Nov)**. Names below are proposals for the brief, not contracts.

| Action | API (status) | Permission | Success → UI | Failure → UI | Recovery | Data kept | Idempotency |
|---|---|---|---|---|---|---|---|
| list items | `GET /inventory/items?category&status&q` (needs API) | `inventory:manage` | list·1 | network → list·4 · 403 → list·8 | retry | filters | n/a |
| create item (+ opening stock) | `POST /inventory/items` (needs API) — creates item + one `inventory_transaction` `opening` | `inventory:manage` | list + Toast (list·390·5) | 400 → editor·5 · 409 name → editor·7 · network → Toast error, stay | fix / retry | form | client key per form; retry reuses it |
| edit item | `PATCH /inventory/items/:id` (needs API) | `inventory:manage` | list + Toast | 400 → ·5 · 409 name → ·7 · 409 unit in use → unit locked (editor·1 hint) | fix | form | n/a (PATCH) |
| archive item | `POST /inventory/items/:id/archive` (needs API) | `inventory:manage` | list without row + Toast | network → Toast error | retry | — | idempotent |
| save recipe | part of `PATCH /menu/items/:id` → variant `ingredients[] {inventoryItemId, quantity}` (needs API, menu brief) | `menu:write` | menu-recipe·9 | 400 qty ≤ 0 → ·5 · archived item → ·6 warning (save allowed) | fix | form | n/a |

## CD-16 — Messages & strings

All copy and data live in `Screen.dc.html` `renderVals()` (S items, E0 editor states, RC0 recipe states, DLG, TOASTS). Key strings: category labels "A · นับแม่น / B · คร่าว ๆ / C · ไม่นับ" · status "ปกติ / ใกล้หมด / หมด" · auto-86 description · "ยอดยกมา — กรอกครั้งเดียวตอนสร้าง" · "สูตรที่แก้ใช้กับออเดอร์ใหม่เท่านั้น".

## CD-16 — Behaviour decisions

- Stock stored in base unit; shown as `floor(qty/size) container + remainder unit`; no container → base unit only.
- Yield is derived (size ÷ 30 ml shot, ÷ 45 ml glass), never typed.
- Opening stock only on create → one `opening` transaction; later changes only via receive (CD-18) / count & adjust (CD-17).
- Base unit locked once any recipe uses the item.
- Status: หมด = qty 0 · ใกล้หมด = qty ≤ threshold · else ปกติ; C = no status.
- Auto-86 (locked, notes Topic 1 Q3): default on for A/container items, off for B; at 0 blocks new orders only.
- Recipe: per variant; empty = not tracked; C lines shown, never deducted; applies to orders sent after save.
- **Standard questions:** filters single-select, "ทั้งหมด" always selectable · search trimmed, case-insensitive, substring on name · counts on chips don't change while searching (open — brief) · min size 1024 desk / 360 phone (390 drawn) · names truncate in table, full in inputs · icon-only buttons have `aria-label` · every value from API except fixed copy.
- User-mindset: one primary action per screen ✓ · status never colour only ✓ · loss-making actions confirm (leave, archive) ✓ · task cost: new item ≈ 9 fields once; recipe line = 2 inputs.

## CD-17 — Overview

- **Goal:** one tap per opened container; the owner sees what went missing, which container, who opened it, in ฿.
- **Users + context:** ต้น (bartender) Friday 23:00, POS tablet at the bar, one hand · Beam (manager) next morning / Sunday afternoon, laptop or phone.
- **Entry → exit:** bar — rail สต็อก › รายการสต็อก › เปิดของใหม่. Owner — rail สต็อก › นับสต็อก / ของหาย › ของหาย · ยังมีของ · นับสต็อก · ประวัติ.
- **Outcome:** bar 1 tap + 5 s undo, no confirm · loss sorted by ฿ · blind count → one confirm.
- **Out of scope (D8):** staff-app button (CD-28) · low-stock checklist at close (CD-19) · receive / PO (CD-18) · ML anomalies (CD-26) · per-item thresholds.
- **Journeys:** J1 ต้น opens Jameson bottle (27 % missing) → Beam ของหาย → detail → ใส่เหตุผล หก 60 ml (E1–E4) · J2 blind count 5 items → variance → confirm 3 (−฿178.00) (E1–E3).

## CD-17 — Screens (boards)

| Board | Type | States |
|---|---|---|
| `overview` | OVERVIEW | goal, pain, users, outcome, entry/exit, journeys, out of scope, decisions |
| `journey-1` | JOURNEY | POS list → warning Toast → ของหาย → detail + ใส่เหตุผล → explained |
| `journey-2` | JOURNEY | count empty → full → variance → history + Toast |
| `loss · 1280` | STATES | 1 loaded · 2 loading · 3 empty · 4 error · 5 filter ต้องดู |
| `detail · 1024 · สิทธิ์` | STATES | 6 detail Jameson · 7 อาจลืมกด (Jim Beam) · 8 loss 1024 · 9 no permission (bartender) |
| `open · POS` | STATES | 1 bartender list · 2 within threshold · 3 over threshold · 4 sold beyond 1 container · 5 undone · 6 error |
| `adjust` | STATES | 1 ปรับยอด (whole bottle broke) · 2 ใส่เหตุผล validation · 3 pending |
| `override` | STATES | 1 รอตรวจ / ไม่ตรง / ตรงแล้ว · 2 ตรวจแล้ว dialog · 3 empty |
| `count · 1280` | STATES | 1 empty · 2 draft 3/5 · 3 validation · 4 variance · 5 confirming |
| `history` | STATES | 1 all · 2 search Jameson |
| `phone · 390` | STATES | count draft · variance · loss · detail |
| `flow` | FLOW MAP | open · loss · override + count |
| `Screen` | shared | screen component every board mounts (`renderVals()` = sample data) |

## CD-17 — Screen × State matrix

| State | Open (POS) | Loss | Detail | Adjust / explain | Override | Count | History |
|---|---|---|---|---|---|---|---|
| default | ✓ open·1 | ✓ ·1 | ✓ ·6 | ✓ adjust·1 | ✓ ·1 | ✓ ·1 | ✓ ·1 |
| loading | shared CD-16 list·2 | ✓ ·2 | shared loss·2 | n/a | shared loss·2 | shared loss·2 | shared loss·2 |
| empty | n/a (CD-16 list·3) | ✓ ·3 | n/a | n/a | ✓ ·3 | ✓ ·1 | **not drawn** (same as override·3 copy) |
| error + retry | ✓ ·6 | ✓ ·4 | shared loss·4 | Toast error (CD-16 pattern) | shared | shared | shared |
| validation | n/a | n/a | n/a | ✓ ·2 | n/a | ✓ ·3 | n/a |
| pending | n/a (optimistic + undo) | n/a | n/a | ✓ ·3 | n/a | ✓ ·5 | n/a |
| success feedback | ✓ ·2–4 | n/a | ✓ J1·5 | ✓ J1·5 | n/a | ✓ J2·4 | ✓ J2·4 |
| failure per reason | ✓ ·6 | n/a | n/a | ✓ ·2 | n/a | ✓ ·3 | n/a |
| stale / conflict | **open: two taps on the same container within seconds** → brief decides (server idempotency key) | n/a | n/a | n/a | n/a | count vs sales during count → R2 note: system qty frozen at submit time (count·4 Alert) | n/a |
| permission denied | n/a (button needs `inventory:open_container`) | ✓ ·9 | shared ·9 | shared | shared | shared (R6) | shared |
| long Thai text | shared CD-16 ·7 | ✓ ·8 (1024 truncation) | n/a | n/a | n/a | n/a | n/a |
| smallest size | 1024 shared CD-16 | ✓ ·8 · 390 | ✓ 390 | n/a (Drawer full width on phone — not drawn) | n/a | ✓ 390 | n/a |

## CD-17 — Action table

No stock API yet — every row **needs API (stock brief, planned 30 Nov)**. Names are proposals.

| Action | API (status) | Permission | Success → UI | Failure → UI | Recovery | Idempotency |
|---|---|---|---|---|---|---|
| open container | `POST /inventory/items/:id/open` → `{ previous: {sold, size, missing, pct, overThreshold, soldBeyond} }` (needs API) | `inventory:open_container` | Toast open·2/3/4 + row resets | network → open·6 · 403 → button hidden | tap again | client key per tap; undo = `DELETE /inventory/opens/:id` within 5 s |
| loss report | `GET /inventory/loss?from&to&flagged` (needs API) | `inventory:manage` | loss·1 | loss·4 · 403 → ·9 | retry | n/a |
| item loss detail | `GET /inventory/items/:id/loss?from&to` (needs API) | `inventory:manage` | detail·6/7 | loss·4 pattern | retry | n/a |
| explain loss | `POST /inventory/opens/:id/explanations {qty, reason, note}` (needs API) | `inventory:manage` | J1·5 + Toast | 400 qty > missing / note missing → adjust·2 | fix | n/a |
| adjust stock | `POST /inventory/items/:id/adjustments {direction, qty, reason, note}` (needs API) | `inventory:manage` | detail + history row | 400 → adjust·2 pattern | fix | client key per form |
| override (ยังมีของ) list / check | `GET /inventory/overrides` · `POST /inventory/overrides/:id/check {note}` (needs API) — claims themselves are created by CD-04/14/28 | `inventory:manage` | override·1 / ·2 → row ตรวจแล้ว | retry | — | idempotent |
| count draft / submit / confirm | `PUT /inventory/counts/current` (draft) · `POST …/submit` → variance · `POST …/confirm` (needs API) | `inventory:manage` | count·4 → J2·4 | 400 → count·3 · network on confirm → Toast error, stay on variance | retry | confirm idempotent per count id |
| history | `GET /inventory/transactions?item&type&cursor` (needs API) | `inventory:manage` | history·1/2 | loss·4 pattern | retry | n/a |

## CD-17 — Messages & strings

All in `Screen.dc.html` `renderVals()` (lossRows, JAM / JIM detail, OR open rows, V override, CR count, H0 history, DR drawers, TOASTS). Key strings: "เปิดของใหม่" · "เลิกทำ" · "หายไม่ทราบเหตุ" · "ตัดออกมีเหตุผล" · "อาจลืมกดเปิดของใหม่" · "ยังมีของ ไม่ตรง" · "นับแบบไม่เห็นยอดในระบบ" · "ยืนยันปรับยอด 3 รายการ".

## CD-17 — Behaviour decisions

- Loss math and action semantics: R2. Threshold = venue setting (default 10 %, CD-21); flag when missing % > threshold.
- Sold beyond one container since last open → system assumes one extra container, no loss computed for those containers, flag "อาจลืมกดเปิดของใหม่".
- Undo window 5 s (Toast action); after that, R4.
- Count: system qty frozen at submit; rows left blank are skipped; confirm writes only rows with a difference; one open draft per venue.
- Override status: รอตรวจ → ตรงแล้ว / ไม่ตรง automatically from the next receive or count; ตรวจแล้ว is the owner's acknowledgement only.
- **Standard questions:** period chips single-select ("ต้องดู" = filter, count shows rows); history search trimmed, substring, case-insensitive, Escape clears query only · min sizes 1024 / 390 · names truncate in tables · icon-only buttons have `aria-label` · status never colour only (every Badge has a word).
- User-mindset: bar = 1 tap, no dialog (undo instead) ✓ · every error says how to fix ✓ · blind count stated on screen ✓.

## Design input (what goes into Claude Design)

Already drawn — the CD brief(s) `docs/design/CD-16.md`, `docs/design/CD-17.md` hold the pasted input. A new version starts from requirements → *Flow* and this file, never the DB schema.

## Design source snapshot

**Pending.** CD-16 (`1794724290-2361`) and CD-17 (`1794728931-f584`) are approved but not snapshotted. Take the snapshot **into `docs/features/stock/design-source/`** (Rev 24 location) before the first stock UI brief, and list each file + SHA-256 here.

| File | SHA-256 |
|---|---|
| — | — |

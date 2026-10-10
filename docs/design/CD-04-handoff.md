---
id: CD-04
title: POS — order for customer (menu → options → cart → send)
revision: 2
status: review            # rev 1 approved 2026-10-09 (Q1, F1–F4); rev 2 = CD template retrofit
approved_by: Field        # rev 1
approved_on: 2026-10-09   # rev 1
canvas: https://claude.ai/artifact/8xBUgRiM4ZmQoNvinbVSsz
canvas_version: 1791643758-8795
ds_version: 1791561405-c72e
source: docs/design/source/CD-04/   # taken after rev 2 approval (§11)
surfaces: [web-pos]
sizes: [1280x800, 1024x768]
brief: CD-04-pos-order-entry.md
drs: [DR-009, DR-010, DR-012]
depends_on: [CD-00, CD-01, CD-02, CD-03, CD-14]
supersedes: brief paste text and acceptance where they conflict (see brief "Revisions")
---

# CD-04 — POS: order for customer

Built on The Loft Bar Design System (real DS components; every board has a dark/light Theme tweak). **Do not port canvas markup** — build with HeroUI v3 + tokens (`docs/rules/frontend.md`, BRIEF-014 utilities). Sample data only. Template: `cd-template.md` · boards: `board-convention.md`. Shared children on the canvas: `PosFrame`, `Grid` (CD-02 copy), `Panel` (CD-02 + modes `sent` / `sentMixed` / `sentPromo`, prop `ring`), `Order` (props `menu` loaded / loading / error / noresult / promo / disconnected / long · `cart` loaded / loading / empty / one / mixed / charge / sending / neterr / void / realtime / closed / swipe / forbidden / promoReady / promoVoid / promoFixed / long · `who` · `ring`).

## 0. Review items
Rev 1 decisions Q1, F1–F4 stay (§10). Rev-2 items (✓ = accepted):

| # | Item | Recommendation |
|---|---|---|
| R1 | **Pain point.** Root observed at both bars (CD-14 R8: paper / verbal orders, no single place everyone sees). The POS-specific part is an **assumption**: guests who order at the counter (not via QR) need a path into the system fast enough that the cashier doesn't jot it down first and forget / under-charge. | Field: confirm or correct from the field visits. |
| R2 ✓ | **POS keeps quick add** (Field 2026-10-10): 1 variant + no required modifier → tile tap adds 1 + Toast "เลิกทำ". Differs from CD-14 (sheet always) because the POS cart is always visible. | Done (cart·6, J1 E2). |
| R3 ✓ | **"ค่าบริการ" badge tone `neutral`** (CD-14 R5) — it labels a type, not a status. | Done (Order, charge·3). |
| R4 ✓ | **DR-010 promos:** category "โปรโมชั่น"; tile shows window ("โปร · ถึง 21:00"); outside window = greyed, not tappable, shows start ("โปร · เริ่ม 22:00 (ศ.–ส.)"); expired in cart = `409 ITEM_UNAVAILABLE reason out_of_window`, same void-line pattern as sold out ("หมดเวลาโปร — ลบออกเพื่อส่งต่อ"). | Done (menu·4, conflicts·7, J2). |
| R5 ✓ | **DR-012 on send:** one send = one placement; server splits per station (`kitchen_tag`) → bar / kitchen tickets; panel shows both new tickets on top, highlighted. Charge items get their own ticket created `sent`. Cart shows no station. | Done (send·3, J1). |
| R6 | **Entry from a table that already has orders.** Rev 1 kit had "สั่งแทนลูกค้า" in the panel header meta row; the CD-02 canvas only has it in the no-orders state. Add Button secondary sm in the meta row (hidden without `orders:create`). | Accept → apply to CD-02 panel too. |
| R7 | **New states:** 1024×768 + long names (order·2) · disconnected (menu·5, still orderable, re-checked on send) · 403 permission revoked (conflicts·8, cart kept) · "+ ชื่อใหม่" popover (cart·8, closes rev-1 P1) · without `orders:create` the entry is hidden (rule). | Accept. |
| R8 | **Needs API:** modifier-group shape per variant (BRIEF-012) · menu `available_now` + window (DR-010 rule 12) · charge ticket created `sent` (DR-012) · order display number per placement — **parked** (SESSION_STATE). | Add to BRIEF-012 / menu brief. |

## 1. Overview
- **Goal:** the cashier puts a table's order into the system from menu tiles in a few taps and sends it once; the server routes it to bar / kitchen.
- **Pain point:** see R1 (root = field research; POS-specific part = assumption).
- **User + context:** cashier / bartender at the POS tablet · Friday 22:00, guest standing at the counter ordering 2–3 things, queue behind, touch only.
- **Entry → exit:** CD-02 panel "สั่งแทนลูกค้า" → `/pos/tables/:id/order`. Exit: sent → panel (new tickets on top) · back with empty cart → panel · back with items → leave-confirm.
- **Outcome:** 1 tap per no-option drink (quick add; assumes qty 1); retry never duplicates an order; sold-out / expired promo caught before send and never dropped silently; a charge always has a name.
- **Out of scope:** menu / price management (CD-12), discounts / promotion engine, bottle keep (S2), customer QR menu (CD-06), staff app ordering (CD-14), printed tickets, per-item split.
- **Journeys:** J1 T3 mixed cart: สั่งแทนลูกค้า → ช้างดราฟต์ ×2 (quick add) → โอลด์แฟชั่น (sheet) → ถั่วทอดสมุนไพร → send → 2 tickets (E1–E6) · J2 promo expired at 21:01 → 409 → remove → ลีโอขวด ×4 → send (E1–E4).

## 2. Boards
| Board | Type | States |
|---|---|---|
| `overview` | OVERVIEW | goal, pain point (R1), user/context, outcome, entry/exit, journeys, out of scope, key decisions |
| `journey-1` | JOURNEY | panel T3 (E1 สั่งแทนลูกค้า) → empty cart (E2 ช้าง ×2) → Toast (E3 โอลด์แฟชั่น) → sheet (E4 เพิ่ม) → mixed cart (E5 ถั่วทอด, E6 ส่ง) → panel บาร์ + ครัว ฿1,840.00 |
| `journey-2` | JOURNEY | promo cart (E1 ส่ง 21:01) → 409 void line (E2 ลบออก) → cart (E3 ลีโอขวด ×4) → cart ฿640.00 (E4 ส่ง) → panel ฿1,880.00 |
| `order` | STATES | 1 1280 loaded · 2 1024×768 + long names |
| `item-sheet` | STATES | 1 default · 2 required not chosen · 3 max reached |
| `order-states · menu` | STATES | 1 loading · 2 error · 3 no result · 4 promo category · 5 disconnected |
| `order-states · cart` | STATES | 4 loading · 5 empty · 6 quick add Toast · 7 swipe · 8 "+ ชื่อใหม่" popover |
| `send` | STATES | 1 sending · 2 success (1 bar ticket) · 3 mixed → 2 tickets · 4 network error |
| `send · conflicts` | STATES | 4 sold out 409 · 5 realtime sold out · 6 visit closed · 7 promo expired 409 · 8 403 |
| `charge` | STATES | 1 no name · 2 name chosen · 3 in cart |
| `leave-confirm` | STATES | AlertDialog |
| `flow` | FLOW MAP | add · send (+ failure row) · leave |
Shared (not boards to review): `PosFrame`, `Order`, `Grid`, `Panel`.

## 3. State coverage
✓ drawn · n/a (reason) · shared (where) · rule (§9, not drawn).

| State | Menu | Cart | Item sheet | Charge | Send |
|---|---|---|---|---|---|
| default | ✓ order·1 | ✓ order·1 | ✓ ·1 | ✓ ·2 | ✓ send·2 |
| loading | ✓ menu·1 | ✓ cart·4 | n/a (data from menu) | n/a | ✓ send·1 |
| empty | ✓ menu·3 (no result) | ✓ cart·5 | n/a | n/a | rule: empty → send disabled |
| error + retry | ✓ menu·2 | shared send·4 | n/a | n/a | ✓ send·4 |
| validation | n/a | rule: qty min 1 | ✓ ·2 ·3 | ✓ ·1 | ✓ conflicts·4 ·7 |
| pending | n/a | ✓ send·1 (locked) | n/a (local) | n/a | ✓ send·1 |
| success feedback | ✓ cart·6 Toast | ✓ cart·6 | rule: closes → line added | ✓ ·3 | ✓ send·2 ·3 |
| failure per reason | ✓ menu·2 | ✓ conflicts·4–8 | n/a | n/a | ✓ 409 sold out / out_of_window / closed · 403 · network |
| stale / conflict | ✓ menu·4 (window) · conflicts·5 realtime | ✓ conflicts·5 ·7 | rule: option becomes unavailable → sheet error on add | n/a | ✓ conflicts·6 |
| disconnected | ✓ menu·5 | shared menu·5 | n/a | n/a | rule: send still tried; network error → send·4 |
| permission denied | rule: no `orders:create` → entry hidden (R6/R7) | ✓ conflicts·8 (403) | n/a | n/a | ✓ conflicts·8 |
| long Thai text | ✓ order·2 (2-line clamp) | ✓ order·2 (wraps) | rule: names wrap | n/a | n/a |
| smallest size | ✓ order·2 (1024×768) | ✓ order·2 (cart 360) | rule: modal 680 fits | n/a | n/a |
| keyboard open | rule: on-screen keyboard over search → tiles scroll under it | n/a | rule: note TextArea → modal stays centered | n/a | n/a |
| session expired | global: 401 → CD-01 login (cart lost, R6-CD-14 rule) | ← | ← | ← | ← |

## 4. Action table
| Action | API (status) | Permission | Success → UI | Failure → UI | Recovery | Data kept | Idempotency |
|---|---|---|---|---|---|---|---|
| Load menu | `GET /menu/categories`, `GET /menu/items` (planned, menu brief; `available_now` + window per DR-010 R8) | `menu:read` | tiles | network → menu·2 | ลองอีกครั้ง | cart | n/a |
| Live availability | WS `menu.availability_changed` (planned BRIEF-012) + refetch every 60 s (DR-010 rule 12) | `menu:read` | tile → หมด; cart line → void (conflicts·5) + Toast | socket down → menu·5 | refetch on reconnect | cart | upsert by item id |
| Quick add | client | `orders:create` | line +1, Toast "เลิกทำ" (cart·6) | item หมด / out of window → tile inert | — | cart | — |
| Add with options | client (modifier groups shape: R8) | `orders:create` | line added | required missing → sheet·2 | pick | sheet inputs | — |
| Add charge | client | `orders:create` | line + Badge "ค่าบริการ" | no name → add disabled (charge·1) | pick name | cart | — |
| New name | client (sent as `orderedByName`) | — | chip added, selected (cart·8) | > 30 chars → Input error | edit | — | — |
| Send | `POST /visits/:visitId/orders` + `Idempotency-Key` (planned BRIEF-012) | `orders:create` | `201` → panel, new station tickets on top (send·2 ·3) + Toast | `409 ITEM_UNAVAILABLE` `sold_out` → conflicts·4 · `out_of_window` → conflicts·7 · `409 INVALID_STATE_TRANSITION` → conflicts·6 · `403` → conflicts·8 · network → send·4 | remove line / retry / back to table | cart (all failures) | same key per cart; retry never duplicates |
| Leave | client | — | empty → back; items → leave-confirm | — | อยู่ต่อ | until ทิ้งตะกร้า | — |

## 5. e2e script
- **J1** E1 on T3 panel tap "สั่งแทนลูกค้า" → order screen, cart empty · E2 tap ช้างดราฟต์ twice → line ×2 ฿240.00, Toast "เพิ่ม ช้างดราฟต์ แล้ว" · E3 tap โอลด์แฟชั่น → item sheet (ปกติ · เชอร์รี่ · ก้อนใหญ่ default) · choose สั่งโดย บีม · E4 "เพิ่มลงตะกร้า · ฿280.00" → line added · E5 tap ถั่วทอดสมุนไพร → line ฿80.00 · cart ฿600.00 / 4 · E6 ส่งออเดอร์ → exactly one `POST` with one Idempotency-Key → `201`; panel shows 2 new tickets 20:34 บาร์ (ช้าง ×2, โอลด์แฟชั่น) + ครัว (ถั่วทอด), both "ใหม่", total ฿1,840.00.
- **J2** cart has "ลีโอ 4 ขวด + ถังน้ำแข็ง" (added 20:58) + ช้าง ×2 · E1 send at 21:01 → `409 ITEM_UNAVAILABLE reason out_of_window` → nothing created; promo line moves to top struck, Alert "โปรหมดเวลาแล้ว 1 รายการ", send disabled · E2 ลบออก → send enabled · E3 tap ลีโอขวด 4 times → ×4 ฿400.00 · E4 send → `201`, one bar ticket, total ฿1,880.00.
- **Edge:** network error then retry → same key, server returns the first result, one order only · visit closed while in cart → 409 → cart locked, back discards · 403 mid-session → cart kept, send disabled · out-of-window tile tap → nothing added.

## 6. Strings & sample data
Sample data lives in `Order` / `Panel` `renderVals()` and the board files. New in rev 2 (**bold**): **tab "โปรโมชั่น" · "โปร · ถึง 21:00" · "โปร · เริ่ม 22:00 (ศ.–ส.)" · ลีโอ 4 ขวด + ถังน้ำแข็ง ฿390.00 · ไฮบอลมะนาวโซดา 2 แก้ว ฿290.00 · ค็อกเทล 1 แถม 1 ฿240.00 · Badge "หมดเวลาโปร" · "หมดเวลาโปร — ลบออกเพื่อส่งต่อ" · "โปรหมดเวลาแล้ว 1 รายการ" / "โปรนี้ถึง 21:00 — ลบออก หรือสั่งเมนูปกติแทน" · Alert bodies "ลบออกก่อนจึงจะส่งได้" · "ตะกร้ายังอยู่ครบ — ส่งซ้ำจะไม่เกิดออเดอร์ซ้ำ" · "ออเดอร์ไม่ถูกส่ง — กลับไปที่โต๊ะแล้วเลือกใหม่" · "บัญชีนี้ไม่มีสิทธิ์ส่งออเดอร์แล้ว" / "ตะกร้ายังอยู่ — ให้ผู้จัดการตรวจสิทธิ์ หรือให้พนักงานอื่นส่งแทน" · "การเชื่อมต่อขาด" / "สถานะเมนูอาจไม่ล่าสุด — ยังสั่งได้ ระบบตรวจของหมด / โปรหมดเวลาอีกครั้งตอนส่ง" · popover "ชื่อผู้สั่ง" / "เช่น แพร" / "ใช้กับตะกร้านี้ · สูงสุด 30 ตัวอักษร" / "เพิ่มชื่อ" · Toast body "แยก 2 ใบ: บาร์ 3 รายการ · ครัว 1 รายการ" / "ใบ บาร์ · n รายการ" · panel station labels บาร์ / ครัว + "สั่งแทนลูกค้า" in meta row**. Rev-1 strings (Claude Design summary below) still valid except: "ขนาด" → "ตัวเลือก" (F4) · "ค่าบริการ" Chip info → Badge neutral (R3) · send success group = per-station tickets, item rows without progress chips (DR-012).

### Rev-1 Claude Design summary (verbatim — layout §2 and strings §1 still apply unless changed above)
```
CD-04 — POS สั่งออเดอร์แทนลูกค้า (order entry, table T3) — DEVELOPER HANDOFF

Design system: The Loft Bar · HeroUI v3 (web) / HeroUI Native (Expo) · Noto Sans Thai 400/600/700 · Lucide 0.468.0 (stroke 1.75, sizes 16/20/24)
Files: ui_kits/pos-v2/cd-04/ (dark) · ui_kits/pos-v2/cd-04/light/ (light = iframe of the dark file with ?theme=light)
Shared code: cd04-kit.jsx (data, MenuTile, MenuPane, NameChips, CartLineX, CartPane, OrderHeader, OrderView, part markers) · cd04-sheets.jsx (ItemSheet, ChargeSheet, LeaveDialog, option row, TextArea) · ../cd-02/* (Cd02Shell, TablePanel, StateLabel, Board) · ../Shell.jsx
Every card: 1280×800, standalone, loads React 18.3.1 + Babel + Lucide + _ds_bundle.js itself.
Money: ฿1,240.00 format, tabular-nums. Guests: ต้น, บีม. Shell chrome = CD-02 handoff §0; rail "โต๊ะ" active.

Menu data (CD-01): ช้างดราฟต์ ฿120.00 · สิงห์ดราฟต์ ฿140.00 · ลีโอขวด ฿100.00 (เบียร์สด) · เนโกรนี ฿240.00 · โอลด์แฟชั่น เริ่มต้น ฿260.00 (ค็อกเทล, has options) · ไฮบอลมะนาวโซดา ฿180.00 (ไฮบอล) · ยำหมูยอ ฿150.00 หมด · ถั่วทอดสมุนไพร ฿80.00 (อาหาร) · ค่าเปิดขวด ฿300.00 (ค่าบริการ)
Sample cart (total ฿620.00, 4 items): ช้างดราฟต์ ×2 ฿240.00 (ต้น) · โอลด์แฟชั่น ×1 ฿280.00 "ปกติ · เชอร์รี่ · น้ำแข็งก้อนใหญ่" (บีม) · ลีโอขวด ×1 ฿100.00 "หมายเหตุ: ไม่ใส่น้ำแข็ง" (ต้น)


======================================================================
1. ARTBOARDS — STATES + STRINGS
======================================================================

----------------------------------------------------------------------
1.0 Common order screen strings (OrderView — used on order, item-sheet, leave-confirm, states)
----------------------------------------------------------------------
String                                  | Element
----------------------------------------|----------------------------------------------
กลับไปที่โต๊ะ T3                          | Button ghost, arrow-left
สั่งออเดอร์ — T3                          | page title (--text-title 26)
มีแขก                                    | StatusChip table seated
ต้น, บีม                                  | guests (users icon, --text-muted)
ค้นหาเมนู                                 | SearchField placeholder
ทั้งหมด · เบียร์สด · ค็อกเทล · ไฮบอล · อาหาร · ค่าบริการ | Tabs (ทั้งหมด selected)
<menu name> · ฿x.xx                       | tile name (15/600, 2-line clamp) + price (bold, --text-accent)
เริ่มต้น ฿260.00                           | โอลด์แฟชั่น tile ("เริ่มต้น" 13 regular muted) + sliders-horizontal icon
หมด                                      | StatusChip menu soldout on ยำหมูยอ (tile 50% opacity, not pressable)
2 / 1 / 1                                | Badge on ช้างดราฟต์ / โอลด์แฟชั่น / ลีโอขวด tiles
ตะกร้า · 4                                | cart heading (--text-heading 21) + Chip accent count
ต้น · บีม · + ชื่อใหม่                     | name chips (ต้น selected)
สั่งโดย ต้น / สั่งโดย บีม                   | cart line meta (13, --text-muted)
ปกติ · เชอร์รี่ · น้ำแข็งก้อนใหญ่              | variant/modifier line
หมายเหตุ: ไม่ใส่น้ำแข็ง                      | note line
ลด / เพิ่ม · จำนวน                         | stepper aria-labels / group label
ลบรายการ                                  | ✕ IconButton aria-label
รวม · ฿620.00                             | cart footer (40px bold --text-accent)
ส่งออเดอร์                                 | Button primary lg block (send icon)

----------------------------------------------------------------------
1.1 CD-04/order (CD-04-order.html) — 1280 · CD-04/order · 1024 (CD-04-order-1024.html, zoom 88%)
----------------------------------------------------------------------
States: loaded cart (3 lines). 1024 board adds numbered markers + legend.
1024 legend strings: ชิ้นส่วน · 1 ปุ่มกลับ / Button ghost · 2 สถานะโต๊ะ / Chip (StatusChip) · 3 ค้นหาเมนู / SearchField · 4 หมวดเมนู / Tabs · 5 ไทล์เมนู / Card (pressable) · 6 จำนวนในตะกร้า / Badge · 7 หมด / Chip tone void · 8 ชื่อผู้สั่ง / Chip (selectable) · 9 จำนวน / NumberField (stepper) · 10 ลบรายการ / Button isIconOnly · 11 เส้นคั่น / Divider · 12 ส่งออเดอร์ / Button primary lg
Note: ไทล์เมนู 3 คอลัมน์ที่ 1024 · ตะกร้ากว้าง 360 คงที่ทุกขนาดจอ

----------------------------------------------------------------------
1.2 CD-04/item-sheet (CD-04-item-sheet.html) · states (CD-04-item-sheet-states.html, Modal 56% + 90% detail crops)
----------------------------------------------------------------------
States: 1 default · 2 required group not chosen · 3 max reached.

String                                  | Element
----------------------------------------|----------------------------------------------
โอลด์แฟชั่น                               | Modal title
ค็อกเทล · เริ่มต้น ฿260.00                 | subtitle
ปิด                                      | close IconButton aria-label
ขนาด · ต้องเลือก 1                         | RadioGroup label + Chip neutral
ปกติ ฿260.00 · ดับเบิล ฿360.00              | Radio options (ปกติ selected)
ท็อปปิ้ง · ไม่บังคับ · สูงสุด 2              | CheckboxGroup label + Chip
เปลือกส้ม +฿0.00 · เชอร์รี่ +฿20.00 · ควันซินนามอน +฿20.00 | Checkboxes (default: เชอร์รี่; max: เปลือกส้ม + เชอร์รี่, third disabled)
เลือกได้สูงสุด 2                           | helper (info icon), state 3
ระดับน้ำแข็ง · ต้องเลือก 1                  | RadioGroup label + Chip (danger in state 2)
ก้อนใหญ่ · ปกติ · ไม่ใส่                    | Radio options (default: ก้อนใหญ่; state 2: none, danger borders)
กรุณาเลือกระดับน้ำแข็ง                      | FieldError (circle-alert), state 2
สั่งโดย · ต้น · บีม · + ชื่อใหม่             | name chips (บีม selected), lg 44
หมายเหตุ (ไม่บังคับ) · เช่น หวานน้อย         | TextArea label + placeholder
1                                        | NumberField value (lg 48, min 1)
ยกเลิก                                   | Button secondary lg
เพิ่มลงตะกร้า · ฿280.00                     | Button primary lg (plus) — disabled in state 2
Detail captions: ราคาบนปุ่ม = ขนาด + ท็อปปิ้ง × จำนวน
Price rule: variant + Σ modifiers, × qty.

----------------------------------------------------------------------
1.3 CD-04/order-states (CD-04-order-states.html, menu side, zoom 71%) · CD-04/order-states · cart (CD-04-order-states-cart.html, zoom 70%)
----------------------------------------------------------------------
States: 1 loading (Skeleton tabs + 9 tiles, SearchField disabled) · 2 menu error · 3 search no result · 4 cart loading · 5 empty cart · 6 quick-add Toast · 7 swipe to remove.

String                                  | Element
----------------------------------------|----------------------------------------------
โหลดเมนูไม่สำเร็จ · เกิดข้อผิดพลาด           | Alert danger title + body (state 2)
ลองอีกครั้ง                               | Button secondary sm, rotate-cw
มาร์การิต้า                                | SearchField value (state 3)
ไม่พบเมนูที่ค้นหา                           | empty heading (search-x icon)
ลองค้นหาด้วยคำอื่น หรือล้างตัวกรอง           | empty body (CD-01 copy)
ยังไม่มีรายการ — แตะเมนูเพื่อเพิ่ม            | empty cart (shopping-basket icon); total ฿0.00 faint; send disabled
เพิ่ม ช้างดราฟต์ แล้ว · เลิกทำ               | Toast success + action (state 6)
Badge บนไทล์ = จำนวนในตะกร้า                | caption beside ช้างดราฟต์ tile (Badge 2)
ลบ                                       | swipe-revealed action (trash-2, --danger-bg 88 wide)
ปัดซ้ายหรือแตะ ✕ เพื่อลบ · ไม่มี Modal ยืนยัน | board note

----------------------------------------------------------------------
1.4 CD-04/send (CD-04-send.html) · CD-04/send · conflicts (CD-04-send-conflicts.html), zoom 80%
----------------------------------------------------------------------
States: 1 sending (cart locked) · 2 success → CD-02 Drawer · 3 network error · 4 86'd (409) · 5 realtime availability_changed · 6 visit closed.

String                                  | Element
----------------------------------------|----------------------------------------------
ส่งออเดอร์                                 | Button primary lg isPending (state 1); chips, steppers, ✕ disabled
ส่งออเดอร์ T3 แล้ว · 4 รายการ              | Toast success (state 2)
20:34 น. · ใหม่                           | new order group on top of Drawer (accent-soft highlight)
2× ช้างดราฟต์ ฿240.00 · โอลด์แฟชั่น ฿280.00 · ลีโอขวด ฿100.00 | new group items (chip รอ), mods as in cart
ยอดรวมย่อย / รวมทั้งสิ้น ฿1,860.00          | Drawer footer after send
สั่งแทนลูกค้า                              | not on this board (see flow)
ส่งออเดอร์ไม่สำเร็จ ลองอีกครั้ง              | Alert danger (wifi-off), state 3
กดส่งอีกครั้งใช้ Idempotency-Key เดิมของตะกร้านี้ — ถ้าคำขอแรกไปถึงแล้ว เซิร์ฟเวอร์จะไม่สร้างออเดอร์ซ้ำ | board note, state 3
มีรายการที่หมดแล้ว 1 รายการ                 | Alert danger at cart top (states 4, 5)
ยำหมูยอ · หมด                             | void line name + StatusChip soldout
หมดแล้ว — ลบออกเพื่อส่งต่อ                   | void line message (--status-void-fg)
฿150.00 (struck)                          | void line price, excluded from รวม
ลบออก                                    | Button danger sm (trash-2)
ยำหมูยอ หมดแล้ว                            | Toast warning (state 5)
ส่งแล้วได้ 409 ITEM_UNAVAILABLE · ปุ่มส่งปิดจนกว่าจะลบรายการ | board note (4)
event menu.availability_changed · รายการเดียวกันเปลี่ยนสถานะทันที | board note (5)
โต๊ะนี้ถูกปิดแล้ว                           | Alert danger (state 6)
กลับไปที่โต๊ะ                              | Alert action Button secondary sm (arrow-left)
ตะกร้าล็อก · ส่งไม่ได้ · ทิ้งตะกร้าเมื่อกลับ    | board note (6)

----------------------------------------------------------------------
1.5 CD-04/charge (CD-04-charge.html, zoom 82%)
----------------------------------------------------------------------
States: 1 no name chosen (add disabled) · 2 chosen (บีม) · 3 cart line with ค่าบริการ chip.

String                                  | Element
----------------------------------------|----------------------------------------------
คิดกับใคร?                                | Modal title
ค่าเปิดขวด · ฿300.00                       | item summary (price --text-price accent)
สั่งโดย · ต้องเลือก 1                       | label + Chip
ต้น · บีม · + ชื่อใหม่                      | name chips lg 44
ค่าบริการต้องระบุชื่อลูกค้า                   | helper
ยกเลิก · เพิ่มลงตะกร้า                      | Buttons (primary disabled until chosen)
ค่าบริการ                                 | Chip info on cart line (state 3); cart = ฿920.00, count 5
แตะไทล์ในหมวด ค่าบริการ เพื่อเปิด Modal       | caption beside ค่าเปิดขวด tile (user-round icon)

----------------------------------------------------------------------
1.6 CD-04/leave-confirm (CD-04-leave-confirm.html)
----------------------------------------------------------------------
State: AlertDialog over the order screen (non-dismissable).
ยกเลิกตะกร้า? (title) · รายการในตะกร้าจะไม่ถูกส่ง (body) · อยู่ต่อ (Button secondary) · ทิ้งตะกร้า (Button danger, trash-2) · triangle-alert icon.

----------------------------------------------------------------------
1.7 CD-04/flow (CD-04-flow.html)
----------------------------------------------------------------------
Nodes: CD-02/panel (Drawer โต๊ะ T3) · CD-04/order · CD-04/item-sheet (เลือกตัวเลือก) · CD-04/charge (คิดกับใคร?) · CD-04/order · ตะกร้า · CD-04/send (กำลังส่ง) · CD-04/send · 86'd (รายการหมด — ลบออก) · CD-04/leave-confirm (ยกเลิกตะกร้า?) · CD-02/panel (ออเดอร์ใหม่อยู่บนสุด)
Arrow labels: สั่งแทนลูกค้า · ตะกร้าว่าง · ไทล์ 1 ตัวเลือก · Toast · ไทล์มีตัวเลือก · ค่าบริการ · เพิ่มลงตะกร้า · ส่งออเดอร์ · สำเร็จ · 409 / หมดระหว่างรอ · ลบรายการ · กลับ (มีรายการ) · อยู่ต่อ · ทิ้งตะกร้า
Legend: การกระทำ · กลับ / แก้ไข · ผลลัพธ์


======================================================================
2. LAYOUT SPECS
======================================================================
1280×800: content 1192×744. Header 64 (padding 0 20 0 12, hairline bottom). Below: menu pane flex 1 (832) | cart 360 fixed.
1024×768: content 936×712. Menu pane 576 | cart 360. (Breakpoint rule: cart stays 360; tile grid reflows.)
Menu pane: padding 16 20 20 24, gap 12. SearchField max-width 360. Tabs gap 18, no wrap.
Tile grid: repeat(auto-fill, minmax(150px, 1fr)), gap 12, padding-top 8 → 5 cols at 1280, 3 at 1024. Tile height 96, padding 10/12, radius --r-card (12), --surface-card, 1px --line (in-cart: --line-accent-soft), --shadow-card + --highlight-top.
Count Badge: 24 min, pill, --accent / --text-on-accent, offset −8/−8, 2px --bg-app ring.
Cart: --surface-overlay, left border --line. Header padding 14 20, gap 12. Lines padding 0 20; line padding 12 0, Divider hairline between. Stepper md 36. IconButton sm 36. Void line: padding 12, radius --r-card, --status-void-bg / --status-void-border, margin 10 0. Footer padding 14 20 16, --shadow-sheet, z --z-sticky; total 40 (--fs-pos-total); Button lg 52.
Swipe: row translates −88; revealed action 88 wide on --danger-bg.
Item sheet Modal 680 (max calc(100% − 32px)), padding 0; header 20 16 0 24; body 2 cols minmax(0,1fr) gap 24, padding 8 24 20; footer 16 24 20. Option rows min-height 52, padding 0 14, radius --r-btn (10), gap 6; selected = --accent-soft + --line-accent; invalid = --danger border. TextArea min-height 76, radius --r-input (10). Fits 800 high without scroll; fits 1024.
Charge Modal 420. Leave AlertDialog default 420. Radius --r-card-lg (16).
Toasts: ToastRegion top-right, top 76 within content (12 below header), max 380.


======================================================================
3. COMPONENTS PER ARTBOARD  (HeroUI v3 → HeroUI Native · variant/size)
======================================================================
order / order-1024: Button ghost md (back) → Button · Chip soft (StatusChip table) → Chip · SearchField → SearchField · Tabs primary → Tabs · Card pressable (tile, custom MenuTile) → Card/Pressable · Badge (count) → Badge · Chip void sm (หมด) → Chip · Chip selectable (DS Tag = TagGroup › Tag) → Chip pressable · NumberField (DS QuantityStepper md 36) → custom stepper · Button isIconOnly sm → Button isIconOnly · Divider → Divider · Button primary lg block → Button.
item-sheet: Modal → Dialog · Button isIconOnly (close) · RadioGroup › Radio ×2 / ×3 → RadioGroup · CheckboxGroup › Checkbox ×3 → Checkbox · Chip neutral/danger sm (group tags) · FieldError · Chip selectable lg · TextArea → TextField multiline · NumberField lg 48 · Button secondary lg / primary lg.
order-states: Skeleton (bars, 96 tiles, cart rows) → Skeleton · Alert danger + Button secondary sm → Alert · SearchField (value / disabled) · Toast success with action → Toast · Button danger (swipe action).
send: Button primary lg isPending · Chip / NumberField / Button isIconOnly isDisabled · Toast success · Drawer (CD-02 TablePanel) · Alert danger · Toast warning · Chip void sm · Button danger sm · Alert danger + Button secondary sm.
charge: Modal · Chip selectable lg · Chip neutral sm · Button secondary / primary (isDisabled) · Chip info sm (ค่าบริการ).
leave-confirm: AlertDialog (Modal tone danger) → Dialog · Button secondary · Button danger.


======================================================================
4. NEW / CHANGED COMPONENTS + TOKENS
======================================================================
No new tokens.
Changed: ui_kits/pos-v2/cd-02/cd02-panel.jsx TablePanel — optional props orders (array, overrides T3 data), sub (number), orderBtn (shows Button secondary sm "สั่งแทนลูกค้า" in header meta row), highlightFirst (accent-soft box around first order group). Existing CD-02 boards unchanged.
Kit-local compositions (not in DS bundle): MenuTile (Card + Badge + Chip), MenuPane, NameChips (Tag ×n), CartLineX (normal / void / swipe), CartPane, OrderHeader, ItemSheet, ChargeSheet, option row (Opt), Group (label + Chip + FieldError), TextAreaField (no DS TextArea exists; styled with --surface-input, --line, --r-input).
Candidate for promotion to DS: TextArea (HeroUI TextArea) and a count Badge (HeroUI Badge) as standalone components.


======================================================================
5. DEVIATIONS FROM THE PROMPT
======================================================================
- Third topping "ควันซินนามอน +฿20.00" added: with only 2 options and max 2, the "other checkboxes disabled" state cannot exist.
- Item sheet is a 2-column Modal 680 wide so it fits 1280×800 / 1024×768 without scrolling; qty stepper moved into the footer next to the actions.
- order-states split into two boards (menu side / cart side) to keep 5+ states readable; added swipe-to-remove as state 7.
- send split into two boards (send / send · conflicts), 3 states each.
- Void line moves to the top of the cart; its price is struck and excluded from รวม (stays ฿620.00).
- Realtime state (5) also shows the cart-top Alert, same as 409, so the disabled send button always has a visible reason.
- Success Drawer lists orders newest-first and highlights the new group; total ฿1,860.00 (1,240 + 620).
- Name chips use DS Tag (HeroUI TagGroup › Tag), labelled "Chip (selectable)"; TextArea is a styled native textarea labelled HeroUI TextArea.
- Search no-result sample query "มาร์การิต้า" chosen to be a plausible miss.
- Charge modal adds helper "ค่าบริการต้องระบุชื่อลูกค้า" and the "ต้องเลือก 1" Chip; cart with charge = ฿920.00 / 5 items.
- 1024 board is a 1024×768 shell at 88% zoom with a part legend; the 1280 board has no markers.
```


## 7. Layout & tokens
- Viewports 1280×800 (design), **1024×768 smallest** (order·2). Content 1192×744 @1280, 936×712 @1024.
- Menu pane flex | cart 360 fixed. Tiles `repeat(auto-fill, minmax(150px, 1fr))` gap 12 → 5 cols @1280, 3 @1024; tile 96 high, name 2-line clamp; promo tiles add a 12/600 window line above the name (accent in window, faint outside).
- Disconnected Alert sits between search and tabs; tabs scroll horizontally if they don't fit (7 tabs at 1024).
- Cart: line name wraps (no clamp); void line card at cart top; footer total 40/700; Button lg 52.
- "+ ชื่อใหม่" popover 312 wide anchored under the chip row, `--r-card`, `--shadow-dialog`.
- Item sheet 680, charge 420, leave AlertDialog 420; Toast top-right max 380.
- Tailwind mapping: BRIEF-014 utilities only.

## 8. Components → platform (HeroUI v3)
| Part | HeroUI v3 |
|---|---|
| Back / send / sheet actions | Button (ghost md · primary lg block · secondary / danger sm) |
| Search | SearchField |
| Categories | Tabs (canvas draws plain markup — P2) |
| Menu tile | Card pressable + Badge (count) + Chip (หมด) — custom composition |
| Promo window line | small text + Lucide `clock` (no new component) |
| Name chips | TagGroup › Tag; "+ ชื่อใหม่" → Popover + Input |
| Cart line | NumberField (stepper) + Button isIconOnly; Badge neutral "ค่าบริการ" / "หมดเวลาโปร" |
| Item sheet / charge | Modal · RadioGroup · CheckboxGroup · TextArea · FieldError |
| Leave | AlertDialog (not dismissable) |
| Feedback | Alert (danger / warning) · Toast (success + action, warning) · Skeleton |
| Drawer after send | CD-02 Drawer (panel) |

## 9. Behaviour rules
- **Quick add (R2):** 1 variant + no required modifier group → add 1 + Toast with "เลิกทำ"; otherwise item sheet. Charge items always open "คิดกับใคร?" (name required).
- **Promos (DR-010):** server decides the window; out-of-window tiles greyed and inert; menu refetched every 60 s + on `menu.availability_changed`; price frozen at submit (`unit_price_snapshot`).
- **Unavailable in cart:** sold out or out of window → line moves to top, price struck and excluded from total, Alert at cart top, send disabled until removed. Same UI for 409 and realtime. Never auto-removed.
- **Send:** one `POST` per send with the cart's Idempotency-Key (generated when the cart is created, reused on retry). Cart locked while pending. Success → panel, new tickets on top (newest-first, F3), one per station (DR-012); charge lines → own ticket `sent`.
- **Failures keep the cart** (network, 409, 403); visit closed → cart locked, back discards it.
- **Permissions:** no `orders:create` → "สั่งแทนลูกค้า" hidden everywhere (R6/R7); 403 mid-session → conflicts·8.
- **Leave:** empty cart → back immediately; items → leave-confirm (อยู่ต่อ / ทิ้งตะกร้า).
- **Touch only:** targets ≥ 44, primary 52; remove = ✕ (swipe optional, F1); no confirm on remove.
- **Standard questions (`cd-template.md` §5):** Filters → category Tabs, single select, "ทั้งหมด" default (promos only under "โปรโมชั่น", same as CD-14). Search → name contains, Thai, no-result state menu·3; clears per category. Long and short → order·2; tile names clamp 2 lines, cart wraps. Interaction → DS pressed / disabled / pending; selected tab underline; DS motion only. Accessibility → tile = button labelled "ช้างดราฟต์ ฿120.00, ในตะกร้า 2"; inert tiles `aria-disabled` + reason in label ("หมด" / "โปรเริ่ม 22:00"); icon buttons labelled; Toast action reachable. Data → menu from `GET /menu/items`; missing image ignored (tiles have none); missing window → always available.
- **User-mindset checks:** ✓ one dominant action (ส่งออเดอร์) · ✓ targets · ✓ ack < 1 s (Toast / pending) · ✓ loss confirmed (leave) · ✓ errors say how to fix · ✓ task cost 1 tap / drink · ✓ status not by colour alone (Badge text) · ✓ long Thai drawn · ☐ walkthrough with staff.

## 10. Revisions
| Rev | Date | Change | Authority |
|---|---|---|---|
| 1 | 2026-10-09 | Claude Design boards; Q1 full content area · F1 ✕ only · F2 new-name popover · F3 newest-first · F4 "ตัวเลือก" | Field |
| 1 | 2026-10-10 | Ported to the Design canvas | Cowork |
| 2 | 2026-10-10 | CD template retrofit: overview, J1 / J2, pills + sections, 1024×768 + long names, disconnected, 403, popover drawn; R2 quick add kept · R3 badge neutral · R4 DR-010 promo states · R5 DR-012 tickets on send; R1 pain point assumption; R6 panel entry; R8 API gaps | Field (R2, R3; R4 via DR-010, R5 via DR-012) · R1, R6–R8 pending |

## 11. Source snapshot
Pending — after Field approves rev 2 (`cd-template.md` §6). Lucide blob `/_blob/ef7b3ddc4dbeec16b2ce27b4ccd9a770` (CD-04). P2 (Tabs drawn as plain markup) still open — build with HeroUI Tabs.

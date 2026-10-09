# CD-04 — Developer handoff: POS order for customer (from Claude Design, 2026-10-09)

Source: Claude Design project https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457 · files `ui_kits/pos-v2/cd-04/` (dark) and `cd-04/light/` · brief `CD-04-pos-order-entry.md` (Q1 = full content area).
Screenshots: `docs/design/assets/CD-04/`.
**Do not port Claude Design's JSX.** Build with HeroUI v3 + our tokens. Menu/cart values are sample data.

## 0. Cowork review — ✅ all accepted by Field (2026-10-09)
| # | Item | Recommendation |
|---|---|---|
| F1 | **Swipe-to-remove** (state 7) on a POS that also runs on desktop with a mouse. | Build **✕ only** for the gate; swipe = touch nice-to-have later. No confirm Modal on remove (as drawn). |
| F2 | **"+ ชื่อใหม่"** — tap result not drawn. | Small inline Popover with Input (max 30 chars) → adds a chip for this cart only, selected; persisted only as `orderedByName` on send. |
| F3 | **Drawer lists orders newest-first** after send (CD-02 didn't fix an order). | Accept newest-first for the CD-02 drawer everywhere (staff care about the latest order). |
| F4 | Variant RadioGroup label **"ขนาด"** — variants aren't always sizes (glass/tower, single/double, bottle/bucket). | Label **"ตัวเลือก"** when the item has > 1 variant; keep "ต้องเลือก 1" chip. |

## 1. Design notes (not blocking)
- Price rule: line = (variant + Σ modifier deltas) × qty; button "เพิ่มลงตะกร้า · ฿x" shows that.
- 1-variant + no required modifiers → quick add + Toast with "เลิกทำ" (1 tap, FRD §6) ✔.
- 86'd line goes to cart top, price struck and excluded from รวม; send disabled until removed; same Alert for 409 and realtime ✔.
- Retry after network error reuses the cart's `Idempotency-Key` ✔ (API D3).
- Visit closed → cart locked, back discards it ✔.
- Modifier "+฿0.00" shown as drawn (keep — tells staff it's free).

## 2. Accepted deviations
All items in the summary §5 accepted (3rd topping added; 2-column item sheet 680 with qty in footer; split state boards; void line at cart top; Tag for name chips; TextArea = HeroUI TextArea in code).
DS candidates (TextArea, count Badge) — **not promoted now**; HeroUI provides both, no custom component needed.

## 3. Layout (quick reference)
Menu pane flex | cart 360 fixed · tiles `minmax(150px,1fr)` → 5 cols @1280, 3 @1024 · tile 96 high · item sheet 680 · charge 420 · leave AlertDialog 420 (non-dismissable).

---

## Claude Design summary (verbatim)
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

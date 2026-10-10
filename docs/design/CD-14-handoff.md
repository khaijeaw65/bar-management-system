# CD-14 — Developer handoff: Staff app new order (Cowork Design canvas, 2026-10-10)

Source: Design canvas "CD-14 Staff New Order" https://claude.ai/artifact/VXJCDCG4BLQrXvXMaBFPTW (built by Cowork on The Loft Bar Design System https://claude.ai/artifact/AXVdDV921SWCiAxGJxD78D, real DS components mounted) · brief `CD-14-staff-app-new-order.md` (D1–D3 accepted) · rules from `CD-04-handoff.md` (F1–F4) · shell from `CD-08-handoff.md`.
**Status: pending Field review.** Pilot of the Journey / States / Flow-map board convention (10 Oct) — boards carry a type pill, R-items are sticky notes on the canvas. Every board has a **Theme tweak (dark / light)** in the Tweaks panel.
**Do not port the canvas markup.** Build with HeroUI Native + Uniwind + tokens (`docs/rules/mobile.md`). Sample data only.

## 0. Review items for Field
| # | Item | Recommendation |
|---|---|---|
| R1 | **Queue order after send.** Brief flow says "new order on top", but CD-08 queue is oldest-first (D-rule). Canvas keeps CD-08: after send, back to queue with filter **ใหม่** active and the new card highlighted (`Card selected`) + success Toast. | Accept — one ordering rule across the app. |
| R2 | **Seat picker tiles 3 per row for counters AND tables**, 72 px high, chip only (no guest names / timer) so the whole bar fits one BottomSheet without scrolling. CD-08 tables tab stays 2 per row. | Accept — picker is for choosing, tables tab is for reading. |
| R3 | **Ice level as 3 options across one row** (others stacked) so the item sheet fits 390×844 without scroll; at 360×780 the sheet body scrolls, footer stays sticky. | Accept. |
| R4 | **CD-08 table summary sheet needs a primary "สั่งออเดอร์" button** (D1 entry point #2). Not redrawn on the CD-08 canvas. | Accept — add it in the mobile brief; no canvas change. |
| R5 | **"ค่าบริการ" badge = neutral tone.** CD-04 used `tone="info"`, which the DS Badge doesn't have (falls back to neutral). | Accept — fix CD-04 reference to `neutral` when writing the web brief. |

## 1. Boards (390×844 unless noted, states side by side)
| Board | States |
|---|---|
| `journey-1` (JOURNEY) | main path, T3 seated: queue → pick T3 → menu → tap ช้างดราฟต์ → quantity sheet (2) → โอลด์แฟชั่น item sheet → cart → sent (Toast, new card highlighted). Tap rings + E1–E7 |
| `journey-2` (JOURNEY, was `pick-seat`) | one path following seat C3, arrows label each action: 1 queue + FAB "+ ออเดอร์" → 2 BottomSheet "สั่งให้โต๊ะไหน?" (C3 free, tap ring; seated seat = straight to menu, no open step) → 3 tap C3 → Spinner "กำลังเปิด…", other seats locked → **4a** opened → menu C3 (chip เปิดแล้ว) + Toast success "เปิดโต๊ะ C3 แล้ว" · **4b** (dashed arrow from 3) collision → menu C3 (chip มีแขก) + Toast info "โต๊ะนี้เพิ่งถูกเปิด — เข้าร่วมโต๊ะเดิมแล้ว" |
| `menu` | loaded (list rows, count Badge, หมด muted + chip, "มีตัวเลือก" / "ค่าบริการ · ต้องระบุชื่อ" sub-lines, sticky cart bar) · loading Skeleton · error Alert + "ลองอีกครั้ง" (cart kept) · no result EmptyState · added-from-sheet Toast success "เพิ่ม ช้างดราฟต์ ×2 แล้ว" · 360×780 |
| `item-sheet` | default (ปกติ ฿260 · เชอร์รี่ · ก้อนใหญ่ · สั่งโดย บีม → ฿280.00) · required missing (FieldError "กรุณาเลือกระดับน้ำแข็ง", add disabled) · max 2 toppings (3rd disabled + helper) · **no-option item** (ช้างดราฟต์: short sheet = สั่งโดย + หมายเหตุ + stepper, "เพิ่มลงตะกร้า · ฿240.00") |
| `cart` | normal · "คิดกับใคร?" sheet (charge needs a name, add disabled until picked) · sending (isPending, steppers/chips/✕ locked) · success → queue · 86'd line (void card + "ลบออก", Alert, send disabled) · network error (Alert, "ลองส่งอีกครั้ง", same Idempotency-Key) · visit closed (Alert, send replaced by "กลับไปคิวออเดอร์") · 360×780 |
| `leave` | Dialog "ยกเลิกตะกร้า?" · "รายการในตะกร้าจะไม่ถูกส่ง" · อยู่ต่อ / danger ทิ้งตะกร้า |
| `flow` | 3 rows: from queue · from table (with options + charge) · leave & errors |

## 2. Strings (exact)
Entry: + ออเดอร์ (FAB label "ออเดอร์" + plus icon) · สั่งให้โต๊ะไหน? · เคาน์เตอร์ · โต๊ะ · เปิดโต๊ะและสั่ง · กำลังเปิด… · "แตะโต๊ะที่มีแขกเพื่อสั่งเพิ่ม · โต๊ะว่างจะถูกเปิดให้ก่อน" · Toast "เปิดโต๊ะ C3 แล้ว" / "เลือกเมนูเพื่อเริ่มสั่งได้เลย" · Toast "โต๊ะนี้เพิ่งถูกเปิด — เข้าร่วมโต๊ะเดิมแล้ว" / "C3 เปิดโดย POS เมื่อกี้ · ออเดอร์จะเข้าบิลเดียวกัน".
Menu: สั่งออเดอร์ — T3 · ค้นหาเมนู · ทั้งหมด · เบียร์สด · ค็อกเทล · ไฮบอล · อาหาร · ค่าบริการ · มีตัวเลือก · ค่าบริการ · ต้องระบุชื่อ · เริ่มต้น ฿260.00 · ตะกร้า n รายการ · ดูตะกร้า · โหลดเมนูไม่สำเร็จ / "ตรวจการเชื่อมต่อแล้วลองอีกครั้ง ตะกร้าที่เลือกไว้ยังอยู่" · ลองอีกครั้ง · ไม่พบเมนูที่ค้นหา / "ลองค้นหาด้วยคำอื่น หรือเลือกหมวด ทั้งหมด" · Toast "เพิ่ม ช้างดราฟต์ ×2 แล้ว" / "สั่งโดย ต้น · แก้ได้ในตะกร้า".
Item sheet: ตัวเลือก · ต้องเลือก 1 · ท็อปปิ้ง · ไม่บังคับ · สูงสุด 2 · ระดับน้ำแข็ง · ก้อนใหญ่ / ปกติ / ไม่ใส่ · สั่งโดย · + ชื่อใหม่ · หมายเหตุ (ไม่บังคับ) / "เช่น หวานน้อย" · เพิ่มลงตะกร้า · ฿280.00 · FieldError "กรุณาเลือกระดับน้ำแข็ง" · helper "เลือกได้สูงสุด 2 — เอาออกก่อนเพื่อเลือกอันอื่น".
Cart: ตะกร้า · T3 · รายการใหม่สั่งโดย · สั่งโดย {name} · ค่าบริการ · รวม · ส่งออเดอร์ · คิดกับใคร? · "ค่าบริการต้องระบุชื่อลูกค้า" · หมดแล้ว — ลบออกเพื่อส่งต่อ · ลบออก · "มีรายการที่หมดแล้ว 1 รายการ" / "ลบออกก่อนจึงจะส่งได้" · "ส่งออเดอร์ไม่สำเร็จ ลองอีกครั้ง" / "ตะกร้ายังอยู่ครบ — ส่งซ้ำจะไม่เกิดออเดอร์ซ้ำ" · ลองส่งอีกครั้ง · "โต๊ะนี้ถูกปิดแล้ว" / "ออเดอร์ไม่ถูกส่ง เลือกโต๊ะใหม่จากคิวออเดอร์" · กลับไปคิวออเดอร์ · Toast "ส่งออเดอร์ T3 แล้ว · 4 รายการ" / "#0045 · ฿620.00".
Leave: ยกเลิกตะกร้า? · รายการในตะกร้าจะไม่ถูกส่ง · อยู่ต่อ · ทิ้งตะกร้า.

## 3. Layout
Pushed stack screen (no tab bar): header top pad 48, IconButton back + title `--text-title` + table StatusChip. SearchField full width (gutter 16), height 44. Category chips = DS Tag, horizontal scroll. Menu rows min 60, name `--fs-subhead`/600, price bold tabular accent, hairline dividers. Cart bar: `--surface-bar` + blur + grab handle, total `--fs-subhead` bold, primary lg "ดูตะกร้า" — pull up or tap → cart BottomSheet (top 56, radius `--r-sheet`). Item sheet: option rows 48 (Radio/Checkbox inside a token-skinned row, selected = `--accent-soft` + `--line-accent`, invalid = `--danger` border), sticky footer stepper lg + primary lg block. Seat picker tiles 72, 3/row, gap 8. FAB: primary lg, right 16, 92 above bottom (clears tab bar), `--shadow-raised`.

## 4. Components → HeroUI Native
Button · IconButton (`isIconOnly`) · SearchField · Chip (Tag selectable; StatusChip table/menu/order) · Badge · ListGroup rows (or Pressable rows) · BottomSheet (seat picker, item sheet, cart, charge) · RadioGroup · CheckboxGroup · FieldError · TextField · NumberField (QuantityStepper) · Alert · Toast (success / info, quick-add has action) · Skeleton · EmptyState · Spinner · Dialog (alert). Custom: **SeatTile** (reuse from CD-08 R4, `compact` 72 px variant), cart line composition, sticky cart bar.

## 5. e2e script (pilot: Journey arrows = test steps)
- **J1** E1 tap FAB "ออเดอร์" → seat sheet visible · E2 tap T3 → menu header "สั่งออเดอร์ — T3" · E3 tap ช้างดราฟต์ → short sheet (no option groups) · E4 stepper → 2, เพิ่มลงตะกร้า → row badge 2, cart bar "ตะกร้า 2 รายการ · ฿240.00" · E5 tap โอลด์แฟชั่น → item sheet · E6 pick defaults + เพิ่มลงตะกร้า, open cart → total ฿520.00 · E7 ส่งออเดอร์ → queue, Toast "ส่งออเดอร์ T3 แล้ว · 3 รายการ", card #… T3 highlighted; one POST with Idempotency-Key.
- **J2** E1 tap FAB · E2 tap free C3 → Spinner, other seats disabled · E3a open succeeds → menu C3 chip เปิดแล้ว + success Toast · E3b open loses (409/first-write-wins) → menu C3 chip มีแขก + info Toast; no second visit created.

## 6. Behaviour notes (same as CD-04 unless stated)
- **No quick add (Field, 10 Oct 2026 — overrides D2 for the staff app):** every item opens the item sheet; items without options get the short sheet (quantity, สั่งโดย, หมายเหตุ). 2 taps per drink, inside FRD's 3-tap rule. One sheet component with optional groups. Charge item → "คิดกับใคร?" first.
- Cart is newest-first; name chips set `สั่งโดย` for new lines only.
- Send: `POST /api/visits/:visitId/orders` + `Idempotency-Key` generated once per cart; retry reuses it. 409 `ITEM_UNAVAILABLE` → mark line void, keep cart. 409 `INVALID_STATE_TRANSITION` (visit closed) → lock cart, back to queue.
- Free seat: open visit then go to menu; if the open loses (first-write-wins) the app joins the existing visit and shows the info Toast.
- Realtime `menu.availability_changed` updates rows and void lines live.
- Canvas note: the leave Dialog is drawn from tokens + DS Buttons (DS Dialog's `actions` prop can't be set from canvas markup) — build it with HeroUI Native Dialog.

# CD-14 — Staff app (Expo): new order (order taking on the phone)

**Status:** Ready — D1–D3 accepted by Field (2026-10-09) · **Surface:** Expo staff app 390×844 (also 360×780) · **Used by:** S1 mobile brief "take order" (DR-009) · same rules as CD-04 (POS order entry), phone layout

## Attach
**Open inside the existing Claude Design project** (Design systems tab → The Loft Bar Design System): https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457
`docs/design/CD-04-handoff.md` (rules: quick add, item sheet, charge, 86'd, idempotency; F1–F4) · `docs/design/CD-08-handoff.md` once it exists (tabs, cards) · FRD §6 "3 taps max per drink"

## Data (API catalog)
Same as CD-04: `GET /api/menu/categories`, `GET /api/menu/items`, item detail (variants + modifier groups), `POST /api/visits/:visitId/orders` + `Idempotency-Key`, `GET /api/tables` (pick the seat), errors `409 ITEM_UNAVAILABLE` / `INVALID_STATE_TRANSITION`, realtime `menu.availability_changed`.

## Defaults (Field confirms or overrides)
- **D1 — Entry points:** FAB "+ ออเดอร์" on the ออเดอร์ tab (pick seat first) and "สั่งออเดอร์" in the CD-08 table summary sheet (seat known). A free seat → staff can open it from here ("เปิดโต๊ะและสั่ง") — same first-write-wins as POS.
- **D2 — Rules identical to CD-04** (quick add for 1-variant items, item BottomSheet for options, charge needs a name, ✕ remove, newest-first, variant label "ตัวเลือก", cart-only new names).
- **D3 — Cart = BottomSheet over the menu** (pull up from a sticky cart bar), not a separate tab.

## Paste into Claude Design
> Work inside **The Loft Bar Design System** project. **Staff app (Expo) — HeroUI Native components only**, name each part; extend CD-08 (tabs ออเดอร์ · โต๊ะ · อื่นๆ). Thai, Noto Sans Thai, **tokens only**, **dark and light**, phone **390×844**. Touch targets ≥ 44, primary 52. Money `฿1,240.00` tabular. Menu sample = CD-04 (ช้างดราฟต์ ฿120.00 … ยำหมูยอ ฿150.00 **หมด**, โอลด์แฟชั่น with options, ค่าเปิดขวด ฿300.00). Artboards `CD-14/<id>`. **Static state boards**, standalone 390×844 cards with Lucide in-card.
>
> 1. **CD-14/pick-seat** — from FAB "+ ออเดอร์": BottomSheet "สั่งให้โต๊ะไหน?" with seat chips grouped เคาน์เตอร์ / โต๊ะ, live chip per seat (CD-00 table set); free seat shows "เปิดโต๊ะและสั่ง". States: default · opening (spinner) · "โต๊ะนี้เพิ่งถูกเปิด — เข้าร่วมโต๊ะเดิมแล้ว" (info).
> 2. **CD-14/menu** — header "สั่งออเดอร์ — T3" + back; SearchField; category chips (ทั้งหมด · เบียร์สด · ค็อกเทล · ไฮบอล · อาหาร · ค่าบริการ); **list rows** (not tiles): name 16/600 + price right + count Badge when in cart; หมด row muted + chip. Sticky cart bar "ตะกร้า 4 รายการ · ฿620.00" + "ดูตะกร้า". States: loaded · loading · error Alert "โหลดเมนูไม่สำเร็จ" + retry · no result "ไม่พบเมนูที่ค้นหา" · quick-add Toast "เพิ่ม ช้างดราฟต์ แล้ว" + "เลิกทำ".
> 3. **CD-14/item-sheet** — BottomSheet for โอลด์แฟชั่น: RadioGroup "ตัวเลือก · ต้องเลือก 1" (ปกติ ฿260.00 / ดับเบิล ฿360.00) · CheckboxGroup "ท็อปปิ้ง · สูงสุด 2" · RadioGroup "ระดับน้ำแข็ง · ต้องเลือก 1" · name chips "สั่งโดย" (+ ชื่อใหม่) · TextField "หมายเหตุ" · qty stepper + "เพิ่มลงตะกร้า · ฿280.00". States: default · required missing (FieldError "กรุณาเลือกระดับน้ำแข็ง") · max reached.
> 4. **CD-14/cart** — BottomSheet expanded: name chips row, lines (qty stepper, name, mods, "สั่งโดย", price, ✕), total, primary lg "ส่งออเดอร์". Charge line with chip "ค่าบริการ" (charge needs a name — small sheet "คิดกับใคร?"). States: normal · sending · success Toast "ส่งออเดอร์ T3 แล้ว · 4 รายการ" → back to queue · 86'd line (void tone, "หมดแล้ว — ลบออกเพื่อส่งต่อ", send disabled) · network error Alert "ส่งออเดอร์ไม่สำเร็จ ลองอีกครั้ง" · visit closed Alert "โต๊ะนี้ถูกปิดแล้ว".
> 5. **CD-14/leave** — Dialog "ยกเลิกตะกร้า?" "รายการในตะกร้าจะไม่ถูกส่ง" · "อยู่ต่อ" / danger "ทิ้งตะกร้า".
> 6. **CD-14/flow** — queue FAB → pick-seat → menu ⇄ item-sheet → cart → send → queue (new order on top) · CD-08 table sheet "สั่งออเดอร์" → menu · back with cart → leave.
>
> Out of scope: payment, close, void/comp, bottle-keep orders, guest profile, promotions, customer QR.

## Acceptance (Field checks)
- Dark + light at 390×844; menu and cart also at 360×780.
- 1-variant drink = 1 tap; behaviour matches CD-04 (86'd, charge name, idempotent retry).
- HeroUI Native components named; no out-of-scope items.

## Result
- Claude Design link: <after run>
- Handoff: `docs/design/CD-14-handoff.md` · screenshots `docs/design/assets/CD-14/`

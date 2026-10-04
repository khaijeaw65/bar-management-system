# CD-04 — POS: order for customer (menu → variant/modifiers → cart → send)

**Status:** Ready — Q1 decided by Field (2026-10-04) · **Surface:** web desktop/tablet (1280 px; also 1024 px) · **Used by:** core vertical slice (DR-009 gate: order entry lives on the POS) — opened from CD-02 panel "สั่งแทนลูกค้า" / open-table success

> Replaces the old CD-04 slot (menu management) — menu management moves after the gate as **CD-12** (back office).

## Attach
**Open inside the existing Claude Design project** (Design systems tab → The Loft Bar Design System, not the home "What should we create?" box): https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457
`docs/design/CD-00-handoff.md` (chips, Toast) · `docs/design/CD-01-handoff.md` (shell, menu sample data, 86'd = หมด) · `docs/design/CD-02-handoff.md` (drawer, money F1) · FRD §5 (86'd), §6 (order taking, 3 taps max)

## Data this screen has (API catalog)
- `GET /api/menu/categories` → `{ items: [{ id, name, sortOrder }] }`
- `GET /api/menu/items` → per item: `name`, `categoryId`, `basePrice`, `isAvailable`, `itemType` (simple | recipe | charge), `variants[]` (`id`, `name`, `price`, `isAvailable`) — every orderable item has ≥ 1 variant (D4); POS shows "เริ่มต้น ฿x" when variant prices differ
- Modifier groups per variant: `name`, `isRequired`, `minSelect`, `maxSelect`, options (`name`, `priceDelta`, `isAvailable`) — **endpoint shape added by the orders backend brief** (catalog note)
- `POST /api/visits/:visitId/orders` + `Idempotency-Key` → items `[{ variantId, quantity, modifierOptionIds[], orderedByName?, notes? }]` · errors `409 ITEM_UNAVAILABLE` (86'd between tap and send), `409 INVALID_STATE_TRANSITION` (visit closed)
- Realtime `menu.availability_changed` (item turns หมด while the screen is open)

## Decisions needed (Field)
- **Q1 — Where order entry lives. ✅ Decided (Field, 2026-10-04): full content area.** **Recommend: full content area** (`/pos/tables/:id/order`), menu tiles left + cart column right (360 px); the CD-02 drawer closes, back arrow "กลับไปที่โต๊ะ T3". *Why:* a 400 px drawer is too narrow for a tap-fast tile grid; full width fits "3 taps per drink" (FRD §6). *Alternative:* wide drawer (720 px) over the grid — keeps context, cramped at 1024.

Defaults (no decision needed unless Field objects):
- Menu = **tiles** (name, price, หมด state), not CD-01's table — that table stays the back-office management view.
- **Tap tile with 1 variant and no required modifiers → added to cart immediately** (1 tap) with a short Toast; otherwise → item sheet (variant + modifiers + qty + note).
- `orderedByName`: cart header chips of names already on the visit + "+ ชื่อใหม่"; default none (FRD §6 name labels, optional).
- `charge` items (corkage, fines) show in a separate category "ค่าบริการ" and always ask which name they're for (feeds CD-03 Q2).
- Cart is local until "ส่งออเดอร์"; leaving with a non-empty cart asks to confirm.

## Paste into Claude Design
> Work inside **The Loft Bar Design System** project. Extend CD-01's POS shell (top bar 56 + PosRail 88, rail "โต๊ะ" active) and CD-02's session for **table T3** (guests "ต้น, บีม"). Thai copy, Noto Sans Thai, **tokens only**, **dark and light** for every artboard. HeroUI v3 components only (Card, Button, Chip, Tabs, SearchField/Input, Modal, RadioGroup, CheckboxGroup, NumberField/stepper, TextArea, Badge, Alert, Toast, Skeleton, Divider); name the HeroUI component on each part. Money `฿1,240.00` tabular. Menu sample data = CD-01 (ช้างดราฟต์ ฿120.00, สิงห์ดราฟต์ ฿140.00, ลีโอขวด ฿100.00, เนโกรนี ฿240.00, โอลด์แฟชั่น ฿260.00, ไฮบอลมะนาวโซดา ฿180.00, ยำหมูยอ ฿150.00 **หมด**, ถั่วทอดสมุนไพร ฿80.00) + charge item "ค่าเปิดขวด ฿300.00". Artboards `CD-04/<id>`. **Static state boards** — all states side by side, no clickable switchers. Every preview card renders standalone (Lucide loaded in-card, explicit 1280×800 size).
>
> 1. **CD-04/order** — full content area. Header: back arrow "กลับไปที่โต๊ะ T3" · title "สั่งออเดอร์ — T3" · Chip มีแขก. Left: SearchField "ค้นหาเมนู" + category Tabs/Chips (ทั้งหมด · เบียร์สด · ค็อกเทล · ไฮบอล · อาหาร · ค่าบริการ) + **tile grid** (~150×96, name 15/600, price tabular, "เริ่มต้น ฿x" when variants differ; หมด tile = muted + void chip "หมด", not tappable). Tile with qty in cart shows a Badge "2". Right **cart column 360**: "ตะกร้า" + count, name chips row ("ต้น", "บีม", "+ ชื่อใหม่"), cart lines (qty stepper − n +, name, variant/modifiers muted, "สั่งโดย ต้น", price right, swipe/✕ remove), note per line (muted "หมายเหตุ: ไม่ใส่น้ำแข็ง"), footer: รวม `฿620.00` large + primary lg block **"ส่งออเดอร์"**. Draw at 1280 and 1024.
> 2. **CD-04/item-sheet** — Modal from a tile with options (โอลด์แฟชั่น): RadioGroup variant (ปกติ ฿260.00 / ดับเบิล ฿360.00) · CheckboxGroup modifier "ท็อปปิ้ง" (เปลือกส้ม +฿0, เชอร์รี่ +฿20.00, max 2) · required group example "ระดับน้ำแข็ง (ต้องเลือก 1)" (ก้อนใหญ่ / ปกติ / ไม่ใส่) · qty stepper · TextArea "หมายเหตุ (ไม่บังคับ)" · name chips "สั่งโดย" · footer "ยกเลิก" / primary "เพิ่มลงตะกร้า · ฿280.00". States: default · required not chosen (field error "กรุณาเลือกระดับน้ำแข็ง", add disabled) · max reached (other checkboxes disabled + helper "เลือกได้สูงสุด 2").
> 3. **CD-04/order-states** — loading (Skeleton tiles + cart) · menu error Alert "โหลดเมนูไม่สำเร็จ" + "ลองอีกครั้ง" · search no result "ไม่พบเมนูที่ค้นหา" · empty cart ("ยังไม่มีรายการ — แตะเมนูเพื่อเพิ่ม", send disabled) · quick-add Toast "เพิ่ม ช้างดราฟต์ แล้ว" with action "เลิกทำ".
> 4. **CD-04/send** — sending (button isPending, cart locked) · success: Toast success "ส่งออเดอร์ T3 แล้ว · 4 รายการ" and return to CD-02 panel with the new order group on top (order chip ใหม่) · **86'd while in cart** (409 ITEM_UNAVAILABLE): cart line turns void tone "หมดแล้ว — ลบออกเพื่อส่งต่อ", Alert danger at cart top "มีรายการที่หมดแล้ว 1 รายการ", send disabled until removed · realtime `menu.availability_changed` before send: same line state + Toast warning "ยำหมูยอ หมดแล้ว" · visit closed meanwhile: Alert danger "โต๊ะนี้ถูกปิดแล้ว" + Button "กลับไปที่โต๊ะ" · network error: Alert "ส่งออเดอร์ไม่สำเร็จ ลองอีกครั้ง" (retry keeps the same Idempotency-Key — note on board).
> 5. **CD-04/charge** — tapping "ค่าเปิดขวด" opens a small Modal "คิดกับใคร?" with name chips (required) → cart line shows a "ค่าบริการ" chip.
> 6. **CD-04/leave-confirm** — back arrow with non-empty cart → Modal "ยกเลิกตะกร้า?" "รายการในตะกร้าจะไม่ถูกส่ง" · "อยู่ต่อ" / danger "ทิ้งตะกร้า".
> 7. **CD-04/flow** — CD-02 panel "สั่งแทนลูกค้า" → order → (1-variant tile) cart · (options tile) item-sheet → cart → ส่งออเดอร์ → CD-02 panel (new order) · 86'd → remove line → send · back → leave-confirm → panel.
>
> Out of scope (do not draw): menu management / editing prices (CD-12), happy-hour pricing, promotions, discounts, bottle-keep orders, kitchen routing, customer QR menu (CD-06), staff app order taking, printing tickets, item-level split.

## Acceptance (Field checks)
- Every artboard dark + light; order also at 1024.
- 1-variant item = 1 tap to cart; options only when needed.
- หมด handled at tile, in cart and on send (409) — never silently dropped.
- Charge item always has a name.
- Chips match CD-00 §2; no new status colours; HeroUI v3 only, new components listed.
- No out-of-scope items appear.

## Result
- Claude Design link: <after run>
- Handoff: `docs/design/CD-04-handoff.md` · screenshots `docs/design/assets/CD-04/`

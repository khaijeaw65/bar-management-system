# CD-15 — POS: orders page + issue resolution (escalated from the staff app)

**Status:** Draft — defaults D1–D3 for Field · **Surface:** web POS 1280 (also 1024) · **Used by:** S1 POS orders brief · closes the gap from CD-08 D2 ("ส่งให้ POS") · FRD §6 ISSUE resolution, §8 void/comp

## Attach
**Open inside the existing Claude Design project** (Design systems tab → The Loft Bar Design System): https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457
`docs/design/CD-02-handoff.md` (drawer, void-comp modal, chips) · `docs/design/CD-08-handoff.md` once it exists (issue reasons, escalate) · `docs/design/CD-04-handoff.md` (order for customer)

## Data
`GET /api/orders?status=…` (+ `escalated` flag, issue reason/item/note) · `POST /api/orders/:id/accept|ready|send|resolve` · `POST /api/order-items/:id/cancel` (void, manager PIN / self-approve — FRD §8) · realtime `order.created`, `order.status_changed`.

## Defaults (Field confirms or overrides)
- **D1 — Rail "ออเดอร์" = all live orders of the shift** (board by status columns), same chips and actions as the staff app; the POS can drive the state machine too (single-POS bars without a phone).
- **D2 — Issue resolution at the POS:** "ทำต่อ" (resolved → กำลังทำ) · **"ยกเลิกรายการที่มีปัญหา"** → CD-02 void-comp modal pre-filled (type ยกเลิก, reason ของเสีย/ของหมด, PIN rules) · **"เปลี่ยนรายการ"** = void the item + open CD-04 order entry for that table with a banner "สั่งแทนรายการที่ยกเลิก: ยำหมูยอ". No new substitution model.
- **D3 — Rail "ชำระเงิน" and "แขก" hidden in S1** (payments happen from the table drawer; guests = S2).

## Paste into Claude Design
> Work inside **The Loft Bar Design System** project. Extend CD-01/CD-02 POS shell (rail **"ออเดอร์"** active; rail "ชำระเงิน" and "แขก" hidden). HeroUI v3 components (Card, Chip, Tabs, Button, Badge, Drawer, Alert, Toast, Skeleton, Modal); name each part. Thai, Noto Sans Thai, **tokens only**, **dark and light**, 1280×800 (also 1024). Chips CD-00 §2. Artboards `CD-15/<id>`. **Static state boards**, standalone cards.
>
> 1. **CD-15/board** — page "ออเดอร์" + summary chips (ใหม่ 3 · กำลังทำ 4 · พร้อมเสิร์ฟ 2 · มีปัญหา 1). **4 columns**: ใหม่ · กำลังทำ · พร้อมเสิร์ฟ · มีปัญหา (each scrolls); order Card: "#0042" + time ago, "T3 · ต้น", items (max 4, "+ n"), one action Button per status (รับออเดอร์ · พร้อมแล้ว · เสิร์ฟแล้ว · จัดการปัญหา). Escalated issue card has Chip "ส่งมาจากแอปพนักงาน" + reason "ยำหมูยอ · ของหมด". Filter chip "เฉพาะเครื่องดื่ม / อาหาร" (kitchen tag). At 1024: columns scroll horizontally. States: loaded · loading · empty column "ไม่มีออเดอร์" · new order arrives (card + Badge on rail ออเดอร์) · disconnected Alert.
> 2. **CD-15/issue** — "จัดการปัญหา" → right Drawer 400: order header, Alert warning "มีปัญหากับออเดอร์นี้ · ยำหมูยอ · ของหมด · รายงานโดย ต้น 21:02 น." + note; items list with the problem item highlighted; actions: primary **"ทำต่อ"** · danger outline **"ยกเลิกรายการที่มีปัญหา"** (→ void-comp modal, pre-filled) · secondary **"เปลี่ยนรายการ"** (→ void, then CD-04 order entry with banner "สั่งแทนรายการที่ยกเลิก: ยำหมูยอ"). States: open · after void (item struck, order back to กำลังทำ, Toast "ยกเลิก ยำหมูยอ แล้ว") · payment in flight blocks void (Alert "มีการชำระเงินค้างอยู่ — ยกเลิก QR ก่อน").
> 3. **CD-15/detail** — click any card → same Drawer with full order (items, mods, notes, "สั่งโดย"), status action, link "ไปที่โต๊ะ T3" (→ CD-02 panel).
> 4. **CD-15/flow** — staff app ส่งให้ POS → board มีปัญหา → issue → ทำต่อ / ยกเลิกรายการ (void-comp) / เปลี่ยนรายการ (void → CD-04) · board → detail → ไปที่โต๊ะ.
>
> Out of scope: kitchen display (S2), payments list, guests, printing tickets, staff app screens.

## Acceptance (Field checks)
- Dark + light at 1280; board also at 1024.
- Escalated issues are visible and resolvable without a new substitution model.
- Void always goes through the CD-02 void-comp rules (reason + PIN / self-approve flag).

## Result
- Claude Design link: <after run>
- Handoff: `docs/design/CD-15-handoff.md` · screenshots `docs/design/assets/CD-15/`

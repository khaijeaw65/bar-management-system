# CD-06 — Customer QR: scan → nickname → menu → item → cart → running tab, call staff

**Status:** Ready — Q1 + D1–D4 decided by Field (2026-10-09) · **Surface:** customer phone web `/q/:token` (390×844; also 360×780) · **Used by:** S1 customer-QR briefs (DR-009) · FRD §3, §4, §6

## Attach
**Open inside the existing Claude Design project** (Design systems tab → The Loft Bar Design System): https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457
`docs/design/CD-04-handoff.md` (item sheet rules, charge, 86'd) · `docs/design/CD-00-handoff.md` §2 (item chips) · `docs/briefs/ui/customer-qr.md` Screens 1–4 (content reference only — old tokens/emoji ignored)

## Data (API catalog — customer endpoints are designed in the customer-QR brief)
- `GET /api/public/qr/:token` → table label + live visit (or none) + visit-session token · invalid/regenerated token → 404
- `GET /api/public/menu` (available items only + 86'd flag), item detail with variants + modifier groups
- `POST /api/public/visits/:id/orders` + `Idempotency-Key` (first order on a free table opens the visit — FRD §3)
- `GET` running tab of the visit (all orders of the table, names, item chips) · `POST /api/public/visits/:id/call-staff`
- Realtime `/customer`: `order_item.status_changed`, `menu.availability_changed`, `visit.state_changed`

## Decisions (Field)
- **Q1 — Menu photos. ✅ Decided (Field, 2026-10-09): add photos now** — `menu_item.image_key` (S3 key, nullable) added to `schema.sql`; upload lives in CD-12 (back office). Original recommendation was: no photos in S1 — text cards with a category icon (Lucide: beer, martini, glass-water, utensils). *Why:* photos need an upload flow + S3 + someone to shoot them; S2 can add `image_url`. *Alternative:* add `menu_item.image_url` now (schema + upload in CD-12 + S3 in infra).

## Defaults (confirm or override)
- **D1 — Nickname optional**, stored in the visit session on this phone, sent as `orderedByName`; skip allowed; changeable from the tab header.
- **D2 — Running tab shows the whole table** (shared session — FRD §3): every order with "สั่งโดย <name>", item chips, cancelled items struck through; "ของฉัน" filter chip.
- **D3 — Customer order chips** use the item set (รอ · กำลังทำ · พร้อม · ยกเลิก) + "เสิร์ฟแล้ว" when the order is `sent`.
- **D4 — Out of S1:** bottle-keep tab, "recommended for you", LINE login / PDPA invite (S2).

## Paste into Claude Design
> Work inside **The Loft Bar Design System** project. **Customer web on a phone** (Next.js, HeroUI v3 web components — name each part), 390×844 browser viewport (no app chrome). Thai, Noto Sans Thai, **tokens only**, **dark and light**. Guest-friendly: large text, one clear action per screen, no login. Money `฿1,240.00` tabular. Menu sample = CD-04 data. **Cards have a photo** (4:3, radius `--r-card`, `object-fit: cover`); items without a photo show a category Lucide icon (beer, martini, glass-water, utensils) on a `--surface-raised` 4:3 block — draw both. Artboards `CD-06/<id>`. **Static state boards**, standalone 390×844 cards with Lucide in-card.
>
> 1. **CD-06/welcome** — after scanning: bar mark + "The Loft Bar" + "โต๊ะ T3"; "บอกชื่อเล่นของคุณ" + "เพื่อให้พนักงานเรียกเมื่อเครื่องดื่มพร้อม"; TextField "ชื่อเล่น เช่น ต้น"; primary lg "ดูเมนู"; link "ข้ามขั้นตอนนี้". States: default · invalid QR "QR ไม่ถูกต้อง กรุณาติดต่อพนักงาน" (no menu) · loading.
> 2. **CD-06/menu** — sticky header "The Loft Bar" + "โต๊ะ T3 · ต้น" + Button "เรียกพนักงาน" (bell); SearchField "ค้นหาเมนู"; category Tabs (ทั้งหมด · เบียร์สด · ค็อกเทล · ไฮบอล · อาหาร); 2-column cards: photo 4:3 (or icon fallback), name 15/600 (2 lines), price, "+" button 44; หมด card muted + chip "หมด", no "+". Sticky cart bar when cart ≥ 1: "ตะกร้า 3" + "฿500.00" + "ดูตะกร้า". Header link "ดูออเดอร์ของโต๊ะ" when the table has orders. States: loaded · loading skeleton · error Alert "โหลดเมนูไม่สำเร็จ" + "ลองอีกครั้ง" · no result · item turns หมด live (Toast "ยำหมูยอ หมดแล้ว").
> 3. **CD-06/item** — full-screen sheet for โอลด์แฟชั่น: photo 16:9 at the top (fallback icon block), name, description (muted), RadioGroup "ตัวเลือก · ต้องเลือก 1", CheckboxGroup "ท็อปปิ้ง · สูงสุด 2", RadioGroup "ระดับน้ำแข็ง · ต้องเลือก 1", TextArea "หมายเหตุ เช่น หวานน้อย", sticky: qty stepper + primary "เพิ่มลงตะกร้า · ฿280.00". States: default · required missing (FieldError) · 1-variant item (no options → just note + qty).
> 4. **CD-06/cart** — "ตะกร้าของฉัน" lines (qty stepper, name, mods, note, price, ✕), total, primary lg "สั่งเลย", secondary "เลือกเมนูเพิ่ม". States: normal · sending (isPending) · success → running tab + Toast "ส่งออเดอร์แล้ว พนักงานกำลังเตรียม" · 86'd line ("หมดแล้ว — ลบออกเพื่อสั่งต่อ", send disabled) · network error "สั่งไม่สำเร็จ ลองอีกครั้ง" · table closed "โต๊ะนี้ปิดแล้ว สแกน QR อีกครั้งเพื่อเริ่มบิลใหม่".
> 5. **CD-06/tab** — "ออเดอร์ของโต๊ะ T3" + "อัปเดต 20:34 น." + filter chips "ทั้งหมด · ของฉัน"; orders newest-first, each item: name, mods, "สั่งโดย บีม", item chip, price; cancelled struck "รายการถูกยกเลิก"; total "รวมทั้งโต๊ะ ฿1,240.00"; buttons "สั่งเพิ่ม" + primary "ชำระเงิน" (→ CD-07). States: with orders · empty ("ยังไม่มีออเดอร์") · item becomes พร้อม live (Toast "โอลด์แฟชั่น พร้อมแล้ว") · disconnected banner "การเชื่อมต่อขาด กำลังลองใหม่".
> 6. **CD-06/call-staff** — BottomSheet "เรียกพนักงาน" with quick reasons (chips: "ขอเช็คบิล" · "ขอน้ำแข็ง/แก้ว" · "อื่นๆ"), primary "เรียกพนักงาน"; after: success state "แจ้งพนักงานแล้ว" + "พนักงานจะมาที่โต๊ะ T3 เร็วๆ นี้", button disabled 60 s with countdown "เรียกอีกครั้งได้ใน 0:45".
> 7. **CD-06/flow** — scan → welcome (or invalid QR) → menu ⇄ item → cart → send → tab → ชำระเงิน (CD-07) · menu/tab → call-staff · tab → สั่งเพิ่ม → menu.
>
> Out of scope: payment screens (CD-07), LINE login, PDPA consent, bottle keep, recommendations, multi-language, staff/POS screens.

## Acceptance (Field checks)
- Dark + light at 390×844; menu and tab also at 360×780.
- No login anywhere; nickname skippable.
- Shared tab shows every guest's orders with names; cancelled items stay visible struck.
- No out-of-scope items appear.

## Result
- Claude Design link: <after run>
- Handoff: `docs/design/CD-06-handoff.md` · screenshots `docs/design/assets/CD-06/`

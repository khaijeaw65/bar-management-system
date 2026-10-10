# CD-12 — Back office: responsive shell + menu management (items, photos, variants, modifiers, categories, 86'd)

**Status:** Ready — D1–D4 accepted by Field (2026-10-09) · **Surface:** web, responsive — desktop/tablet 1280 (also 1024) **and phone 390** · **Used by:** S1 back-office menu brief · DR-009 (back office = responsive) · CD-06 Q1 (photos)

## Attach
**Open inside the existing Claude Design project** (Design systems tab → The Loft Bar Design System): https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457
`docs/design/CD-01-handoff.md` (shell, PosRail, **menu list table** — reuse it) · `docs/design/CD-04-handoff.md` (variant/modifier rules, F4 label "ตัวเลือก") · FRD §5 (menu item types, 86'd)

## Data (API catalog)
`GET/POST/PATCH /api/menu/items` (+ variants, modifier-group links) · `GET /api/menu/categories` (+ create/reorder) · modifier groups CRUD (`name`, `isRequired`, `minSelect`, `maxSelect`, options `name`, `priceDelta`, `isAvailable`) · `POST /api/menu/items/:id/mark-unavailable` · `/mark-available` · photo upload → presigned S3 URL → `imageKey` · permissions `menu:write`, `menu:toggle_availability`.

## Defaults (Field confirms or overrides)
- **D1 — One web shell for POS + back office.** The CD-01 rail already holds เมนู · รายงาน · ตั้งค่า; items show by permission. **Below 768 px** the rail collapses into a top bar + hamburger Drawer; POS-only pages (โต๊ะ, ออเดอร์, ชำระเงิน) show "ใช้หน้านี้บนแท็บเล็ตหรือคอมพิวเตอร์" on a phone (DR-009: POS ≥ 1024).
- **D2 — Item editor = full page** (`/admin/menu/:id`), not a modal — variants + modifier links + photo don't fit a modal on a phone.
- **D3 — Every item has ≥ 1 variant** (API D4): a "simple" item shows one variant row ("ปกติ") whose price = base price; adding a second variant shows the variant table.
- **D4 — Out of S1:** recipe / ingredients / cost (`item_type = recipe` detail, inventory — S2), restock requests (S2), happy hour / promotions (S2). `item_type` selector shows simple · recipe · charge, but recipe fields are not drawn.

## Paste into Claude Design
> Work inside **The Loft Bar Design System** project. **Web back office, responsive**: draw every artboard at **1280×800 and 390×844** (phone). HeroUI v3 components only (Table, Card, Button, Chip, Tabs, SearchField, Input, TextArea, NumberField, Select, Switch, Checkbox, RadioGroup, Modal, Drawer, Dropdown, Alert, Toast, Skeleton, Breadcrumbs); name each part. Thai, Noto Sans Thai, **tokens only**, **dark and light**. Money `฿1,240.00`. Menu sample = CD-01/CD-04 data. Artboards `CD-12/<id>`. **Static state boards**, standalone cards (Lucide in-card, explicit size).
>
> 1. **CD-12/shell** — 1280: CD-01 shell (rail "เมนู" active). 390: top bar (brand, bell, avatar) + hamburger → Drawer with the rail items as a list + "ออกจากระบบ". Also the phone message for POS-only pages: icon monitor-smartphone + "ใช้หน้านี้บนแท็บเล็ตหรือคอมพิวเตอร์" + "หน้านี้ออกแบบสำหรับจอ 1024 px ขึ้นไป".
> 2. **CD-12/list** — 1280: CD-01 menu Table (ชื่อ · หมวด · ราคา · สถานะ) + new column photo thumbnail 40 + a **Switch "พร้อมขาย"** per row (86'd toggle) + row → editor; toolbar SearchField, category chips, "เพิ่มเมนูใหม่", secondary "จัดการหมวด", "ตัวเลือกเสริม". 390: list of Cards (thumb, name, price, category, Switch). States: loaded · loading · empty "ยังไม่มีเมนู" + "เพิ่มเมนูแรก" · error · toggle 86'd → Toast "ยำหมูยอ หมดแล้ว — ลูกค้าจะไม่เห็นในเมนู" · toggle back "ยำหมูยอ พร้อมขายแล้ว".
> 3. **CD-12/editor** — page "แก้ไขเมนู" / "เพิ่มเมนูใหม่" with Breadcrumbs เมนู › โอลด์แฟชั่น. Sections (Cards): **ข้อมูลหลัก** — photo uploader (4:3 drop zone "อัปโหลดรูป" + "JPG/PNG ไม่เกิน 5 MB", preview with "เปลี่ยนรูป" / "ลบรูป"), ชื่อเมนู, หมวด (Select), คำอธิบาย (TextArea), ประเภท (RadioGroup: ทั่วไป · สูตร · ค่าบริการ), Switch พร้อมขาย · **ตัวเลือก (ราคา)** — table rows name + price + Switch available + remove; "+ เพิ่มตัวเลือก"; one row "ปกติ" for simple items · **ตัวเลือกเสริม** — attached modifier groups as chips per variant ("ระดับน้ำแข็ง · ต้องเลือก 1", "ท็อปปิ้ง · สูงสุด 2") + "เพิ่มกลุ่ม". Sticky footer "ยกเลิก" / primary "บันทึก". States: new (empty) · edit loaded · validation (ชื่อ required, price ≥ 0, ≥ 1 variant: "ต้องมีอย่างน้อย 1 ตัวเลือก") · uploading photo (progress) · upload error "อัปโหลดไม่สำเร็จ ไฟล์ต้องเป็น JPG/PNG ไม่เกิน 5 MB" · saving · saved Toast "บันทึกเมนูแล้ว" · unsaved-changes leave Dialog "ออกโดยไม่บันทึก?". Note on board: "ราคาที่แก้ไม่กระทบออเดอร์ที่สั่งไปแล้ว" (price snapshot).
> 4. **CD-12/modifiers** — page "ตัวเลือกเสริม": list of groups (name, rule chip "ต้องเลือก 1" / "ไม่บังคับ · สูงสุด 2", options count, used-by count). Group editor (Drawer 480 on desktop, full page on phone): ชื่อกลุ่ม, Switch "ต้องเลือก", NumberField ขั้นต่ำ / สูงสุด, options table (name, +฿ price delta, Switch available, remove), "+ เพิ่มตัวเลือก". States: list · editor · validation "สูงสุดต้องไม่น้อยกว่าขั้นต่ำ".
> 5. **CD-12/categories** — Modal (desktop) / page (phone) "จัดการหมวด": rows with drag handle (grip-vertical) + name + Switch active + item count; "+ เพิ่มหมวด"; inactive category note "ซ่อนจากเมนูลูกค้าและ POS". Delete only when empty: "ลบไม่ได้ — ยังมี 6 เมนูในหมวดนี้".
> 6. **CD-12/flow** — list → editor (new/edit) → save → list · list Switch → 86'd Toast · list → ตัวเลือกเสริม → group editor · list → จัดการหมวด.
>
> Out of scope: recipes/ingredients/cost, inventory, restock, happy hour, promotions, POS screens, customer screens, IAM.

## Acceptance (Field checks)
- Every artboard at 1280 and 390, dark + light.
- 86'd toggle one tap from the list (desktop + phone).
- Photo upload with fallback icon when no photo; ≥ 1 variant enforced.
- No out-of-scope items appear.

## Result
- Claude Design link: <after run>
- Handoff: `docs/design/CD-12-handoff.md` · screenshots `docs/design/assets/CD-12/`

# CD-16 — Back office: stock items · recipes · opening stock

**Status:** Approved rev 2 (Field 2026-11-15, R2–R7 accepted) — D2 + D5 confirmed by Field 2026-11-09, D1/D3/D4/D6–D8 Cowork defaults (Field may override at canvas review) · **Surface:** web back office, responsive 1280 (also 1024) + phone 390 · **Used by:** stock brief(s) from 30 Nov (DR-031 module 1, step 1 + recipe part of step 3) · **Session:** CD session 1 of 5 (with CD-17, CD-18)

## Attach
**Open inside the existing Claude Design project** (The Loft Bar Design System): https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457
`docs/design/CD-12-handoff.md` (back-office shell, list + full-page editor pattern — reuse) · `docs/design/CD-14-handoff.md` (template reference) · notes Topic 1 + Topic 3 P5/P7/P8 (`docs/research/2026-11-08-feature-interview-notes.md`) · FRD §Inventory (A/B/C)

## Data (API catalog)
**No stock API yet — every action = "needs API (stock brief, planned 30 Nov)".** Schema today: `inventory_item` (name, category A/B/C, unit_type, unit, quantity_on_hand, low_stock_threshold, cost_per_unit) · `menu_variant_ingredient` (variant → item, quantity_used) · `inventory_transaction` (tx_type, delta). Missing for this CD (→ schema change with the stock brief, not decided here): container size + yield, auto-86 switch, default supplier, purchase unit + conversion, weighted average cost. Permission: `inventory:manage` (seeded) · recipes on menu items: `menu:write`.

## Locked inputs (Field, 8–9 Nov — do not re-ask)
Category C = untracked · tracking optional per menu item (no recipe = not tracked) · food deducts by portion / unit, never grams · deduct on order placed · auto-86 per-item switch: default on for unit / container items, off for category B · warn at threshold, auto-86 at 0 · receiving only via Purchasing (CD-18) · opening stock in step 1, adjustments in step 4 (CD-17) · weighted average cost · purchase unit + conversion per stock item · default supplier per stock item.

## Defaults (Field confirms or overrides)
- **D1 — Rail item "สต็อก"** in the CD-12 back-office shell (below เมนู), shown with `inventory:manage`. Sub-tabs: รายการสต็อก · (CD-17: นับสต็อก / ของหาย) · (CD-18: จัดซื้อ).
- **D2 ✓ Field — Quantity model = base unit + container.** Each item has a base unit (`ml` · `ชิ้น` · `ที่`) and an optional container ("ขวด 700 ml", "ถัง 30,000 ml", "แพ็ค 10 ชิ้น"). Recipes use the base unit; stock shows as containers + remainder ("3 ขวด + 420 ml"). Yield shown, not typed: 700 ml ÷ 30 ml shot = "≈ 23 shot". Why: one number for recipes and for "เปิดของใหม่" loss (sold ml since open vs container ml) — works for any pour size (30 / 45 / 60 ml).
- **D3 — Item editor = full page** (`/admin/stock/:id`, same as CD-12 D2). Sections: ข้อมูลหลัก (name, category A/B/C with one-line help, base unit, container) · แจ้งเตือน / ปิดขาย (low-stock threshold, Switch "ปิดขายอัตโนมัติเมื่อหมด" — default per locked rule, hidden for C) · การซื้อ (purchase unit + conversion "1 ลัง = 12 ขวด", default supplier Select — suppliers themselves drawn in CD-18) · ต้นทุน (weighted average cost, read-only, "คำนวณจากการรับของ") · ใช้ในเมนู (read-only list of variants using it → link to menu editor).
- **D4 — Category C items have a name only** (no quantity, threshold, cost) — they exist so staff can still report low stock (FRD) and so recipes can mention them without deducting.
- **D5 ✓ Field — Recipes live on the menu item editor (CD-12), per variant.** New section "ตัดสต็อก" in the CD-12 editor: per variant rows (stock item Select + quantity in its base unit), "ไม่ตัดสต็อก" when empty. Drawn on the CD-16 canvas as a new board of the CD-12 editor (not edited inside the CD-12 canvas). Why: the recipe is per variant (schema) and the owner sets it while setting price. Stock item page shows the reverse list (D3 ใช้ในเมนู).
- **D6 — Opening stock = field on create** ("ยอดยกมา" in containers + remainder, optional cost per container to seed the average cost). After creation the field is gone — changes go through receive (CD-18) or adjustment / count (CD-17). Bulk first-time setup = CD-17 count sheet, not a separate screen here.
- **D7 — List** (desktop Table / phone Cards): ชื่อ · หมวด A/B/C chip · คงเหลือ ("3 ขวด + 420 ml") · status chip ปกติ / ใกล้หมด / หมด (label + icon, never colour only) · ปิดขายอัตโนมัติ icon. Filters: category chips + "ใกล้หมด / หมด". Search by name.
- **D8 — Out of CD-16:** เปิดของใหม่, loss report, auto-86 override log, count, adjustments (CD-17) · suppliers, PO, receive, ซื้อหน้าร้าน, reorder (CD-18) · staff-app low-stock tap (CD-28) · ML forecast (CD-26).

## Pain point (Field, 2026-11-09 — field research)
- **Small counter bar:** the owner tracks stock himself and keys it into the POS — works because one person sees everything.
- **Medium / large bar:** POS tracks sales, staff count by hand and send the count as a message in a LINE group chat → the owner compares chat counts with POS numbers by hand. Risk (stated as consequence, not observed): counts get lost in chat, no history per item, missing stock is noticed late.
- What CD-16 solves: one stock list with containers that the system deducts on sale; counts (CD-17) and receiving (CD-18) land on the same item instead of a chat.

## Paste into Claude Design
> Work inside **The Loft Bar Design System** project. **Web back office, responsive**: boards at **1280×800 and 390×844** (phone), smallest desktop 1024×768. HeroUI v3 components only (Table, Card, Button, Chip, Tabs, SearchField, Input, NumberField, Select, Switch, RadioGroup, Modal, Drawer, Alert, Toast, Skeleton, Breadcrumbs); bar-specific DS components only where they exist. Thai, Noto Sans Thai, **tokens only**, **dark and light** (theme tweak). Money `฿1,240.00`. Shell = CD-12 back-office shell, rail item **"สต็อก"** active. Board rules: `board-convention.md`; content rules: `cd-template.md` v2.
>
> Sample data: Jameson (A, ml, ขวด 700 ml, ≈ 23 shot at 30 ml, คงเหลือ 3 ขวด + 420 ml, เตือนเมื่อเหลือ 2 ขวด, ปิดขายอัตโนมัติ on, ต้นทุนเฉลี่ย ฿780.00/ขวด, ซื้อเป็นลัง 1 ลัง = 12 ขวด) · Jim Beam (A, ขวด 700 ml, 1 ขวด + 120 ml → ใกล้หมด) · Bulleit Bourbon = new item in J1 (4 ขวด @ ฿900) · ช้างดราฟต์ (A, ถัง 30,000 ml, 0 → หมด) · น้ำเชื่อม (B, ml, ขวด 750 ml, ปิดขายอัตโนมัติ off) · หมูยอ (A, ชิ้น, แพ็ค 10 ชิ้น) · น้ำแข็ง (C) · มะนาว (C). Menu: โอลด์แฟชั่น (ปกติ: Bulleit 60 ml + น้ำเชื่อม 10 ml + น้ำแข็ง) · ช้างดราฟต์ (เล็ก 330 ml · ใหญ่ 500 ml from the keg) · ยำหมูยอ (หมูยอ 4 ชิ้น).
>
> 1. **CD-16/overview** — goal, pain point (above), user + context ("เจ้าของร้าน · บ่ายวันจันทร์ก่อนเปิดร้าน · โน้ตบุ๊กหรือมือถือ"), entry / exit, journeys, out of scope (D8), key decisions D1–D7, status.
> 2. **CD-16/journey-1** — set up Bulleit Bourbon (new item → container → opening stock → save) → open โอลด์แฟชั่น in the menu editor → "ตัดสต็อก" add Bulleit 60 ml → save. E# arrows.
> 3. **CD-16/list** — D7. States: loaded · loading · empty "ยังไม่มีรายการสต็อก" + "เพิ่มรายการแรก" · error + retry · filter "ใกล้หมด / หมด" · no search result · 1024 · 390 cards · no permission (rail item hidden; direct URL → "ไม่มีสิทธิ์จัดการสต็อก").
> 4. **CD-16/editor** — D3/D4/D6. States: new (with ยอดยกมา) · edit loaded (no ยอดยกมา, ใช้ในเมนู list, ต้นทุนเฉลี่ย read-only) · category C (name only + note "ไม่นับสต็อก — ใช้แจ้งของใกล้หมดได้") · validation (ชื่อ required, container size > 0, threshold ≥ 0, unit change blocked once used: "เปลี่ยนหน่วยไม่ได้ — ใช้อยู่ใน 2 เมนู") · saving · saved Toast "บันทึกแล้ว" · duplicate name 409 · leave unsaved Dialog · archive "ปิดใช้งาน" (used in recipes → Dialog lists menus, recipes keep but stop deducting) · 390 · long Thai name.
> 5. **CD-16/menu-recipe** — CD-12 editor section "ตัดสต็อก" per variant (D5). States: none "ไม่ตัดสต็อก — เมนูนี้ไม่นับสต็อก" · rows (stock item Select with search + quantity NumberField + unit suffix + remove) · two variants (ช้างดราฟต์ เล็ก / ใหญ่ from one keg) · category C row (badge "ไม่นับ") · validation quantity > 0 · archived item in recipe (Alert "Jameson ปิดใช้งานแล้ว — ไม่ตัดสต็อก") · 390.
> 6. **CD-16/flow** — list ↔ editor (new / edit / archive) · editor ใช้ในเมนู → menu editor · menu editor ตัดสต็อก → stock item.
>
> Out of scope: D8.

## Result
- Canvas: https://claude.ai/artifact/6hAmmjP792i7PnqafPs4wY (rev 1, 9 Nov) · Handoff: `docs/design/CD-16-handoff.md` (approved rev 2, 15 Nov)

## Revisions
| Rev | Date | Change vs this brief | Where |
|---|---|---|---|
| 0 | 2026-11-09 | D2 + D5 confirmed, pain point from Field | this brief |
| 2 | 2026-11-15 | Archive not delete (R4) · threshold unit (R5) · cost per drink (R6) added · searchable picker = DS gap (R7) | handoff §0 |

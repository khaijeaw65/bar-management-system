# UI Brief — POS Desktop Surface
**Surface:** POS Desktop (เจ้าของ / ผู้จัดการ)
**Device:** Desktop monitor or tablet (landscape). Min width 1280px.
**Mode:** Dark only
**Font:** Sarabun
**Language:** Thai-primary
**Auth:** LINE SSO → HttpOnly cookie → JWT. Login required.

---

## Design tokens — same as other surfaces (Colors.dc.html)

---

## Layout system
POS uses a persistent shell:
```
[Top bar — full width, 56px]
[Left sidebar 220px] [Main content area flex:1]
```
No bottom nav. Left sidebar = primary navigation.

---

## Screen 1 — Login
**Layout:** Full screen centered (no shell yet)

### Elements
1. Logo + **"The Loft Bar"** (28px/700) + **"ระบบจัดการบาร์"** (14px, textMuted)
2. Spacer
3. LINE login button — green, full width 360px max, 52px tall, **"เข้าสู่ระบบด้วย LINE"** (16px/700, white)
4. Footer: **"เฉพาะ Owner / Manager"** (12px, textMuted)

---

## Shell (persistent after login)

### Top bar (56px, surfaceRaised bg, border-bottom faint)
- Left: The Loft Bar logo + name (16px/700)
- Center: shift info chip — **"กะเปิด 18:00 · Beam (Manager)"** (13px, textMuted, surface bg chip)
- Right: live clock **"20:34"** (20px/700, amber) + notification bell (badge count) + avatar circle (staff photo/initial)

### Left sidebar (220px, surface bg, border-right faint)
Nav items (vertical list, 48px each):
- 🗺 **โต๊ะ** (active = amber left-border + amber text)
- 🧾 **ออเดอร์**
- 💳 **ชำระเงิน**
- 📦 **เมนู / สต็อก**
- 👤 **แขก**
- 📊 **รายงาน**
- ⚙️ **ตั้งค่า**

---

## Screen 2 — Table Grid (โต๊ะ) — DEFAULT HOME
**Main content:** Grid of table/seat cards

### Table card states
Each card ~200×140px, 16px radius:
- **IDLE** — surface bg, faint border, table number (textMuted), no other info
- **ACTIVE** — surfaceRaised bg, amber left border 3px. Shows: table number (18px/700, textPrimary), guest name(s), item count, running total (amber), time open
- **OPEN** (opened, no order yet) — surface bg, amber dashed border, **"เปิดแล้ว รอออเดอร์"** (textMuted)
- **IDLE alert** (inactivity timeout) — amber warning bg 10%, amber border, **"⚠️ ไม่มีความเคลื่อนไหว"** badge

### Action on click
- Click any ACTIVE table → right panel slides in (Session Detail, Screen 3)
- Click IDLE table → open table dialog (confirm open session, assign name)
- Top-right of grid: **"+ เปิดโต๊ะ"** amber button | **"QR เคาน์เตอร์"** outline button

---

## Screen 3 — Session Detail (right panel)
**Layout:** Slides in from right, 400px wide, full height minus top bar. Rest of grid still visible on left.

### Panel header
- **"โต๊ะที่ 3"** (20px/700) + session duration **"เปิด 1:24"** (13px, textMuted)
- Guest: **"ต้น"** (name label) + status badge (ACTIVE)
- ✕ close button (top right)

### Order list (scrollable)
Each item row:
- Status dot (amber/green/muted) + item name (14px) + customization note (12px, textMuted) + **"สั่งโดย ต้น"** + price (right, 14px/700)
- Cancelled items: struck through, textMuted, stays visible

### Summary footer (sticky bottom of panel)
- Subtotal, total (22px/700, amber)
- Row of action buttons:
  - **"ชำระเงิน"** — amber fill, primary
  - **"Void / Comp"** — outline error (permission-gated, shows manager PIN dialog)
  - **"ปิดโต๊ะ"** — ghost, textMuted
  - **"พิมพ์ใบเสร็จ"** — outline, printer icon

---

## Screen 4 — Payment Processing (ชำระเงิน)
**Opened from:** Session Detail "ชำระเงิน" button or sidebar nav
**Layout:** Modal overlay (centered, 600px wide, auto height) over dimmed background

### Modal sections
1. **Session summary** — table, name, item count, total (28px/700, amber)
2. **Split toggle** — radio: ชำระรวม / แยกจ่ายเท่ากัน · if split: stepper "แบ่งเป็น __ คน" → shows per-person amount
3. **Payment method** — 3 radio cards (same as Staff Mobile Screen 6):
   - PromptPay QR (recommended ⭐)
   - แจ้งชำระด้วยตนเอง
   - เงินสด
4. **PromptPay selected:** Show QR code (240×240, white bg, amber border wrapper), countdown, auto-confirm note
5. **Action:** **"ยืนยันการชำระเงิน"** amber fill (full width)
6. **Cancel:** ghost **"ยกเลิก"** below

### Charge-type items (puke fine, otoshi, corkage)
- Shown in item list with a special badge **"รายการพิเศษ"** (amber outline)
- NOT included in split-equal calculation — assigned to specific person
- Requires manager PIN to add

---

## Screen 5 — Menu Management (เมนู / สต็อก)
**Layout:** Left: category list. Right: item list for selected category. Top: search + add button.

### Category list (left 240px)
- Vertical list of categories (เครื่องดื่ม, อาหาร, พิเศษ, etc.)
- Active: amber left-border + amber text
- Item count badge (right, textMuted)
- **"+ เพิ่มหมวด"** bottom

### Item list (right, flex:1)
Table layout — columns: ชื่อ / ราคา / ต้นทุน / Margin% / สต็อก / สถานะ / actions

Each row:
- Item name (14px/600) + type badge (Simple/Recipe/Charge)
- Price (14px, amber), Cost (14px, textMuted), Margin (12px, success if >40%, error if <20%)
- Stock: number or **"—"** (Category C, not tracked)
- Status toggle: **เปิด** (success) / **86'd** (error) — click to toggle
- Actions: edit pencil icon, delete (permission-gated)

### 86'd toggle UX
- Click toggle → confirm chip appears inline: **"ซ่อนจากเมนูลูกค้า?"** [ยืนยัน] [ยกเลิก]
- Confirmed → row shows error badge **"86'd"** — immediately propagates to QR menu

---

## Screen 6 — Owner Dashboard (รายงาน)
**Layout:** Full main area. KPI row top + 2-column chart area + table.

### KPI row (4 stat tiles, equal width)
1. **"ยอดขายวันนี้"** — value (28px/700, amber) + vs yesterday delta (12px, success/error)
2. **"จำนวนออเดอร์"** — value + delta
3. **"ค่าเฉลี่ยต่อโต๊ะ"** — value + delta
4. **"PromptPay / เงินสด"** — ratio pill (amber / textMuted split bar)

### Date range selector (top right)
- Tabs: **วันนี้ · สัปดาห์นี้ · เดือนนี้ · กำหนดเอง**
- Active: amber pill

### Chart area (2 columns)
Left (flex:2): Revenue trend bar chart (Thai day labels จ/อ/พ/พฤ/ศ/ส/อา)
Right (flex:1): Top sellers list — rank number + item name + count + revenue (14px rows)

### Leakage / variance (below charts, if Owner role)
- Table: Ingredient / Expected usage / Actual / Variance% / Flag
- Flag column: 🔴 (>10% variance), 🟡 (5–10%), ✅ (<5%)

---

## Navigation flow
```
App open → Screen 1 (Login) → Screen 2 (Table Grid)
Click table → Screen 3 (Session Detail, right panel)
Screen 3 → ชำระเงิน → Screen 4 (Payment modal)
Sidebar เมนู → Screen 5 (Menu Mgmt)
Sidebar รายงาน → Screen 6 (Dashboard)
```

## Key interaction patterns
- Right panel (Session Detail) slides over table grid — grid still visible/interactive behind it
- Payment is a modal (not a full page) — keeps context
- 86'd toggle is inline confirm (no full modal) — speed matters
- All permission-gated actions (Void/Comp, add charge item) show manager PIN dialog inline

## Responsive note
- Target: 1280px min width. At 1024px: sidebar collapses to icon-only (tooltip on hover).
- Tablet (landscape 1024×768): sidebar icons only, panel takes 50% of screen.

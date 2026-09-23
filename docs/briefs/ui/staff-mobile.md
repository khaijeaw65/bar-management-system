# UI Brief — Staff Mobile Surface
**Surface:** Staff Mobile (พนักงาน — บาร์เทนเดอร์ / เวเตอร์)
**Device:** Staff's own phone (Android/iOS), installed PWA
**Mode:** Dark only
**Font:** Sarabun
**Language:** Thai-primary
**Auth:** LINE SSO → HttpOnly cookie → JWT. Must login before access.

---

## Design tokens — same as Customer QR (see colors.dc.html)
Additional: indigo for bottle-keep
| Token | Dark value |
|-------|-----------|
| indigo | #8B93D4 |
| indigoBg | rgba(139,147,212,0.15) |

---

## Screen 1 — Login
**Layout:** Full screen, centered, minimal. Same feel as Customer name entry but staff-branded.

### Elements (top → bottom)
1. Bar logo — 72×72 amber-border rounded square, 🥃 emoji
2. **"The Loft Bar"** — 24px/700, textPrimary
3. **"ระบบจัดการบาร์"** — 13px, textMuted
4. Large spacer
5. LINE login button — green (#06C755) bg, white LINE logo + **"เข้าสู่ระบบด้วย LINE"** (16px/700, white). Full width, 16px radius, 52px tall.
6. Footer: **"เฉพาะพนักงาน The Loft Bar"** — 12px, textMuted, centered

### Notes
- No username/password field. LINE SSO only.
- On success → redirect to Order Queue (Screen 2)
- Error state: show red error chip **"เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้ง"**

---

## Screen 2 — Order Queue (หน้าหลัก)
**Layout:** Header + filter tabs + scrollable order card list + bottom nav

### Header
- **"ออเดอร์"** (22px/700) | right: notification bell icon + current time

### Filter tabs (horizontal scroll below header)
- **ทั้งหมด · รอรับ · กำลังทำ · พร้อมแล้ว · มีปัญหา**
- Active: amber pill. Inactive: surface bg, textMuted.
- "มีปัญหา" tab — show error red dot badge if any ISSUE orders exist

### Order card
Surface bg, 16px radius, padding 16px:
- Row 1: **"#ORD-0042"** (12px/700, textMuted) | right: time ago **"2 นาทีที่แล้ว"** (12px, textMuted)
- Row 2: **"โต๊ะที่ 3 · ต้น"** (16px/600, textPrimary)
- Row 3: Item list — each item on one line: qty × name (14px, textMuted). Max 3 shown, then "+ 2 รายการ"
- Row 4: Status badge + action button (right)
  - PENDING: amber badge **"รอรับ"** | button: amber **"รับออเดอร์"**
  - ACCEPTED: blue-ish badge **"กำลังทำ"** | button: outline **"ดูรายละเอียด"**
  - READY: success badge **"พร้อมแล้ว"** | button: success fill **"เสิร์ฟแล้ว ✓"**
  - ISSUE: error badge **"มีปัญหา"** | button: error outline **"แก้ไข"**

### Bottom nav (4 tabs)
Fixed bottom, surfaceRaised bg, border top faint:
- 🧾 **ออเดอร์** (active — amber icon + label)
- 💳 **ชำระเงิน**
- 👤 **แขก**
- ⚙️ **อื่นๆ**

---

## Screen 3 — Order Detail
**Accessed by:** Tap any order card
**Layout:** Back nav + order header + item list (with per-item status) + action buttons

### Header
- ← back + **"#ORD-0042"** (18px/700)
- Sub: **"โต๊ะที่ 3 · ต้น · 20:30"** (13px, textMuted)
- Status badge (large, right aligned)

### Item list
Each item row (surface bg card, 12px radius):
- Left: qty chip (amber, dark text) + item name (14px/600) + customization note (12px, textMuted)
- Sub: **"สั่งโดย ต้น"** (12px, textMuted/indigo)
- Right: item status mini-badge

### ISSUE state (when order = ISSUE)
- Top of screen: amber warning banner — **"⚠️ มีปัญหากับออเดอร์นี้"** (13px/700, amber on amberBg)
- Below banner: show which item caused ISSUE + reason (e.g., **"Hazy IPA หมด"**)
- Resolution row (3 choices):
  - **"เปลี่ยนรายการ"** (substitute) — surface bg, amber text, border
  - **"ลบรายการ"** (remove) — surface bg, error text, border
  - **"แจ้งผู้จัดการ"** (escalate) — surface bg, textMuted, border

### Action buttons (bottom, sticky)
- PENDING: **"รับออเดอร์ →"** amber fill | **"ปฏิเสธ"** ghost
- ACCEPTED: **"พร้อมแล้ว ✓"** amber fill | **"รายงานปัญหา"** outline error
- READY: **"เสิร์ฟแล้ว ✓"** success fill

---

## Screen 4 — New Order (สั่งออเดอร์ใหม่)
**Used for:** Counter / manual order by staff (not QR self-service)
**Accessed by:** FAB + button on Order Queue, or bottom nav

### Layout: Tab name entry → item picker (same menu grid as customer) → review → confirm

### Tab: ชื่อ / โต๊ะ
- **"สั่งสำหรับ"** section:
  - Text input: seat/name — placeholder **"ชื่อ / ที่นั่ง เช่น โต๊ะ 5, Bank"**
  - Or tap existing open table from mini table grid (small chips: T1 ACTIVE (amber), T2 IDLE (muted), etc.)

### Item picker
- Same 2-column grid as Customer QR menu
- 3 taps max target: tap category → tap item → confirm (auto-add if no options)
- Items requiring options (spirits serving style, cocktail customize) open a bottom sheet picker

### Review + confirm
- List of selected items with qty
- Total at bottom
- **"ส่งออเดอร์"** amber fill button

---

## Screen 5 — Guest Profile (โปรไฟล์แขก)
**When shown:** When a regular customer is identified at a table (LINE login, staff lookup)
**Accessed by:** แขก tab → search or tap identified session

### Layout: Profile header + AI summary card + history + bottle-keep

### Profile header
- Photo placeholder (56×56 circle, surfaceRaised) + name (18px/700) + color tag chips (VIP, allergy, etc.)
- Sub: **"มาแล้ว 12 ครั้ง · ล่าสุด 3 สัปดาห์ที่แล้ว"** (12px, textMuted)

### AI Summary card (amber left-border accent)
- Label: **"✦ สรุปโดย AI"** (11px/700, amber, uppercase)
- Summary text (14px, textPrimary, line-height 1.55):
  - e.g. **"ชอบวิสกี้ออนเดอะร็อค ดื่ม 2–3 แก้วต่อครั้ง มักสั่งกิมเล็ตตอนท้าย ไม่ชอบเครื่องดื่มหวานมาก"**
- Note: preferences only, no behavioral profiling

### Bartender notes (expandable)
- Chronological notes staff added. Each: date + text + staff initial
- **"+ เพิ่มโน้ต"** amber outline button

### Bottle Keep card (if active)
- indigo accent card
- Bottle name + purchase date + expiry date
- Level estimate: Full / Half / Low (segmented control)
- Status badge: **"Active"** indigo
- **"สั่งจากขวด"** indigo button

---

## Screen 6 — Payment Handoff (ชำระเงิน)
**Accessed by:** ชำระเงิน tab or tap session → pay

### Layout: Session summary + payment method selector + action

### Session summary
- Table + name + item count + total (22px/700, amber)
- Item list (collapsed, expandable)

### Payment method (3 options, radio-style cards)
1. **PromptPay QR** — auto-confirm via webhook ⭐ (recommended badge)
   - Sub: **"ลูกค้าสแกน QR · ยืนยันอัตโนมัติ"**
2. **แจ้งชำระด้วยตนเอง** — manual confirm by staff
   - Sub: **"ลูกค้าโอนแล้ว staff กดยืนยัน"**
3. **เงินสด** — cash
   - Sub: **"บันทึกยอดชำระ"**

### Split option (below method)
- Toggle: **"ชำระรวม"** (default) / **"แยกจ่ายเท่ากัน"**
- If split:
  - Stepper: **"แบ่งเป็น __ คน"** (min 2, max 10, amber controls)
  - Per-person amount label: **"฿280 ต่อคน"** (15px/700, amber) — updates live
  - Note: **"ค่าบริการพิเศษไม่รวมในการหาร"** (11px, textMuted)
  - Manual/cash radio cards dim + disabled when split selected (QR-only flow)

### CTA
- **"สร้าง QR ชำระเงิน"** (merge, PromptPay) — amber fill → fullscreen single QR (existing flow)
- **"สร้าง QR แยกจ่าย"** (split, PromptPay) — amber fill → Screen 7 Split Management
- **"ยืนยันการชำระเงิน"** (manual/cash, merge only) — amber fill → marks session paid

---

## Screen 7 — Split Management (จัดการแยกจ่าย) [NEW]
**When shown:** After tapping "สร้าง QR แยกจ่าย" on Screen 6.
**Purpose:** Staff tracks per-person payment status; shows each person their QR; manual confirm fallback.
**Layout:** Header + slot list (scrollable) + sticky bottom action

### Header
- ← back + **"แยกจ่าย · โต๊ะที่ 4"** (18px/700)
- Sub: **"แบ่ง 3 คน · ฿187 ต่อคน"** (13px, textMuted)
- Progress chip top-right: **"1 / 3 ชำระแล้ว"** (amber pill when partial → success pill when all done)

### Slot list
Each slot row (surface bg card, 12px radius, 16px padding):
- Left: **"คนที่ 1"** (15px/600, textPrimary) + **"฿187"** (14px/700, amber)
- Right (PENDING): **"รอชำระ"** muted badge + **"แสดง QR"** amber outline button (36px tall)
- Right (PAID via webhook): green check icon + **"ชำระแล้ว ✓"** (success color) + timestamp (12px, textMuted)
- Right (PAID via manual): green check icon + **"ยืนยันด้วยตนเอง"** (success, 12px) + timestamp

### Fullscreen QR overlay (tap "แสดง QR" on any PENDING slot)
- Black overlay bg, X button top-right to close
- **"คนที่ 2 · ฿187"** (20px/700, amber, centered)
- QR code (220×220, white bg, 20px radius, padding 16px)
- PromptPay label row + countdown chip
- **"✓ ยืนยันด้วยตนเอง"** ghost button below QR — manual confirm for this slot only (fallback)

### Sticky bottom
- Partial state: **"รอ 2 คน..."** (14px, textMuted) + spinner
- All paid state: **"ทุกคนชำระครบแล้ว ✓"** (14px/700, success) + **"ปิดโต๊ะ"** amber fill button
  - Note: ปิดโต๊ะ = explicitly close session (payment does not equal session close per FRD §7)

---

## Navigation flow
```
App open → Screen 1 (Login) → Screen 2 (Order Queue)
Screen 2 → tap card → Screen 3 (Order Detail)
Bottom nav ชำระเงิน → Screen 6 (Payment Handoff)
Screen 6 → สร้าง QR ชำระเงิน (merge) → fullscreen QR overlay
Screen 6 → สร้าง QR แยกจ่าย (split) → Screen 7 (Split Management)
Screen 7 → แสดง QR → fullscreen QR overlay per slot
Bottom nav แขก → Screen 5 (Guest Profile)
FAB / new order → Screen 4 (New Order)
```

## Edge cases to show in design
- Screen 2: "มีปัญหา" tab with red dot badge
- Screen 3: ISSUE state with resolution row (3 options)
- Screen 6: split toggle — manual/cash dimmed when split selected
- Screen 6: per-person amount updating live as stepper changes
- Screen 7: mixed state (1 paid webhook, 1 paid manual, 1 pending)
- Screen 7: fullscreen QR overlay (staff shows phone to customer)
- Screen 7: all-paid state → ปิดโต๊ะ button appears

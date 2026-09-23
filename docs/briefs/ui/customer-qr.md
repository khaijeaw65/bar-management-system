# UI Brief — Customer QR Surface
**Surface:** Customer QR Menu (ลูกค้าแสกน QR)
**Device:** Phone (any device, any browser — not installed PWA)
**Mode:** Dark only (bar = low light)
**Font:** Sarabun
**Language:** Thai-primary. English loanwords where natural (QR, PromptPay, On the Rocks, Neat, Mixer).
**Auth:** None — menu loads instantly on QR scan. No login gate.

---

## Design tokens (reference Colors.dc.html)
| Token | Dark value |
|-------|-----------|
| bg | #1C1610 |
| surface | #2C2318 |
| surfaceRaised | #3A2F20 |
| amber | #D4872A |
| textPrimary | #F0E6D0 |
| textMuted | #8B7355 |
| border | rgba(240,230,208,0.12) |
| success | #5A8F5A |
| error | #C0513A |

---

## Screen 1 — ตั้งชื่อเล่น (Name Entry)
**When shown:** First visit only (no name saved in session). Skip = go straight to menu.
**Layout:** Centered single-column, vertically centered on screen.

### Elements (top → bottom)
1. Bar logo placeholder — 72×72px rounded square, amber border, 🥃 emoji center
2. **"The Loft Bar"** — 24px/700, textPrimary
3. **"โต๊ะที่ 3"** — 13px, textMuted (table number from QR param)
4. Spacer
5. **"บอกชื่อเล่นของคุณ"** — 18px/600, textPrimary
6. **"เพื่อให้เราเรียกเมื่อเครื่องดื่มพร้อม"** — 13px, textMuted, line-height 1.55
7. Text input — placeholder: `ชื่อเล่น เช่น ต้น, Bank...`, surface bg, 15px border-radius
8. CTA button — **"ดูเมนู →"** amber fill, full width, 16px/700, dark text
9. Skip link — **"ข้ามขั้นตอนนี้"** — 13px, textMuted, underline

### Notes
- Input is optional — skip always available
- Name stored in session (not user account)
- No keyboard shortcut / no form validation needed

---

## Screen 2 — เมนู (Menu Browse)
**Layout:** Sticky header + scrollable 2-column grid + sticky cart bar at bottom (when cart > 0)

### Header (sticky, non-scrolling)
- Row 1: **"The Loft Bar"** (20px/700) + table number + name ("โต๊ะที่ 3 · ต้น") | cart icon right (badge showing item count, amber circle)
- Row 2: Search bar — placeholder **"ค้นหาเมนู"** with 🔍 icon, surface bg
- Row 3: Category tabs (horizontal scroll)
  - Active tab: amber pill, dark text, 700 weight
  - Inactive: surface bg, textMuted
  - Tabs: **เครื่องดื่ม · อาหาร · พิเศษ · ขวดคีพ**

### Item grid (2 columns, scrollable)
Each card — surface bg, 16px border-radius:
- Image area: 88px tall, surfaceRaised bg, emoji placeholder center
- Below image: Thai name (13px/600, textPrimary), price (15px/700, amber), + button (28×28px amber square, 8px radius)

### 86'd item state
- Same card but opacity 0.5
- Red badge top-left of image: **"86'd"** (10px/700, white on error red)
- Price shows textMuted, no + button — show **"หมด"** text instead

### Cart bar (sticky bottom, only when cart ≥ 1 item)
- surfaceRaised bg strip, then amber full-width pill inside:
  - Left: count badge (dark bg on amber) + **"ดูตะกร้า"** (15px/700, dark text)
  - Right: total price (15px/700, dark text)

---

## Screen 3 — รายละเอียด (Item Detail)
**Layout:** Back nav → image → info → options → sticky bottom add button
**Accessed by:** Tapping any item card

### Elements (top → bottom)
1. Back row: ← icon button (36×36, surface bg) + item name (17px/700)
2. Image — full width minus 20px padding each side, 152px tall, surfaceRaised bg, emoji center, 20px radius
3. Item name (15px/600) + description (13px, textMuted, line-height 1.55)
4. **"วิธีเสิร์ฟ"** section (for spirits/whiskey only):
   - 2×2 grid of style pills
   - Selected: amber bg, dark text — Unselected: surface bg, amber border faint
   - Options: **On the Rocks** (น้ำแข็งก้อนใหญ่) · **Neat** (ไม่มีน้ำแข็ง) · **Water** (เติมน้ำเปล่า) · **Mixer** (โซดา / น้ำอัดลม)
5. Note field — placeholder: **"หมายเหตุ เช่น ไม่ใส่น้ำแข็ง, ลดหวาน..."** — surface bg, faint border
6. *(For cocktails instead of serving style: show ingredient customize options — substitute/adjust; out of scope for v1 MVP, show note field only)*

### Sticky bottom
- Row: qty stepper (−/count/+, surface bg, faint border) + CTA button (amber fill, flex:1)
- CTA text: **"เพิ่มลงตะกร้า · ฿280"** (price updates with qty)

---

## Screen 4 — ตะกร้า / ออเดอร์ (Cart & Running Tab)
**Note:** Pre-order = cart. Post-order = running tab (same screen, items now have status badges).
**Layout:** Header + item list (scrollable) + sticky total + pay button

### Header
- **"ออเดอร์ของคุณ"** (20px/700) | right: 🔔 bell chip (**"เรียกพนักงาน"**, 13px/600, surface bg, faint border)
- Subtitle: **"อัพเดทล่าสุด 20:34"** — 12px, textMuted (WebSocket freshness timestamp)

### Order item row
- Left: emoji icon (44×44, surfaceRaised bg, 12px radius)
- Center: item name (14px/600) + meta row (serving style · "สั่งโดย ต้น" — 12px, textMuted)
- Status badge (below meta):
  - กำลังทำ → amber pill (amber bg 15% opacity, amber dot + text)
  - พร้อมแล้ว 🎉 → success pill (success bg 15% opacity, success dot + text)
  - เสิร์ฟแล้ว → muted text only (no pill)
- Right: price (14px/700, textPrimary)

### Cancelled item (audit trail — stays visible)
- Same layout but opacity 0.55
- Name struck through (text-decoration: line-through), textMuted
- Price struck through, textMuted
- Meta: **"รายการถูกยกเลิก"**

### Add more
- Dashed border card at bottom of list: **"+ เพิ่มเครื่องดื่ม"** — textMuted, navigates back to menu

### Sticky bottom
- Total row: **"รวมทั้งหมด"** (14px, textMuted) | amount (22px/700, amber)
- Pay CTA: **"ชำระเงิน"** — amber fill, full width

---

## Screen 5 — ชำระเงิน (Payment QR)
**Layout:** Back nav → amount → QR → label → countdown → fallback

### Elements
1. Back ← + **"ชำระเงิน"** title (18px/700)
2. Amount block (centered):
   - Label: **"ยอดที่ต้องชำระ"** (13px, textMuted)
   - Amount: **"฿500"** (42px/700, amber)
   - Sub: **"โต๊ะที่ 3 · ต้น · 2 รายการ"** (12px, textMuted)
3. QR code — white bg rounded square (20px radius), 184×184px QR inside, padding 20px. Real QR generated from PromptPay payload.
4. PromptPay label row: navy square logo (PP) + **"PromptPay · ยืนยันอัตโนมัติ"** (14px/600)
5. Countdown chip: **"QR หมดอายุใน 09:47"** (13px, textMuted) — countdown in amber/700
6. Fallback card (bottom, amber border faint):
   - **"🙋 แจ้งพนักงาน"** (14px/600, amber)
   - **"มีปัญหา หรือต้องการชำระที่เคาน์เตอร์"** (12px, textMuted)

### States
- **Pending payment:** QR visible, countdown ticking
- **Confirmed:** Screen changes to success — green check, **"ชำระเงินสำเร็จ ✓"**, amount, timestamp. No QR.
- **Expired:** QR grays out, show **"QR หมดอายุแล้ว"** + **"สร้าง QR ใหม่"** amber button

---

## Navigation flow
```
[QR Scan] → Screen 1 (Name) → Screen 2 (Menu)
Screen 2 → tap item → Screen 3 (Detail) → add → back to Screen 2
Screen 2 → cart bar → Screen 4 (Cart/Tab)
Screen 4 → ชำระเงิน → Screen 4.5 (Payment Intent)
Screen 4.5 → ชำระรวม → Screen 5 (Payment QR)
Screen 4.5 → แยกจ่ายเท่ากัน → Screen 5-Split (Per-person QR)
Screen 5 confirmed → success state
Screen 5-Split MY_PAID → waiting state → ALL_PAID success
```

## Edge cases to show in design
- Screen 2: 86'd item (greyed, no add button, "หมด")
- Screen 4: cancelled item (struck through, stays visible)
- Screen 5: expired QR state
- Screen 5: payment confirmed success state
- Screen 4.5: split stepper with per-person amount updating live
- Screen 5-Split: MY_PAID waiting state (your check + group progress dots)
- Screen 5-Split: ALL_PAID full success state
- Screen 5-Split: expired QR (regenerate preserves others' payment status)

---

## Screen 4.5 — จ่ายอย่างไร? (Payment Intent) [NEW]
**When shown:** After tapping "ชำระเงิน" from Screen 4 (running tab).
**Purpose:** Choose merge bill or split equal before generating any QR.
**Layout:** Bottom sheet (slides up over Screen 4), 2 option cards + confirm button.

### Elements (top → bottom)
1. Handle bar (32×4px, surfaceRaised, centered top of sheet)
2. **"จ่ายอย่างไร?"** — 18px/700, textPrimary
3. **Option A — ชำระรวม** (default selected state):
   - surfaceRaised bg, amber border when selected, 16px radius
   - **"ชำระรวม"** (15px/700) + sub: **"จ่ายทั้งหมด ฿560 ในครั้งเดียว"** (13px, textMuted)
   - Amber checkmark circle icon right when selected
4. **Option B — แยกจ่ายเท่ากัน**:
   - surfaceRaised bg, faint border, 16px radius
   - **"แยกจ่ายเท่ากัน"** (15px/700) + sub: **"หารเท่ากันทุกคน"** (13px, textMuted)
   - When selected → stepper appears inline below sub text: `[−] 2 คน [+]` (amber controls)
   - Per-person amount label updates live: **"= ฿280 ต่อคน"** (14px/700, amber)
5. Note (split selected only): **"ค่าบริการพิเศษไม่รวมในการหาร"** (11px, textMuted) — covers charge-type items
6. CTA button: **"ถัดไป →"** amber fill, full width

### Notes
- Minimum split = 2, maximum = 10 (stepper clamps)
- Total used for split math excludes charge-type items (puke fine, otoshi, corkage)
- Tapping outside sheet dismisses (back to Screen 4, no action)

---

## Screen 5-Split — QR ของคุณ (Per-Person Split Payment) [NEW]
**When shown:** After confirming แยกจ่ายเท่ากัน on Screen 4.5 and tapping ถัดไป.
**Layout:** Same structure as Screen 5 (single QR) but with split-specific elements.

### Elements (top → bottom)
1. Back ← + **"ชำระเงิน"** title (18px/700)
2. Split indicator chip (top-right of header): **"แบ่ง 3 คน"** (11px, surface bg, faint border)
3. Amount block (centered):
   - Label: **"ยอดของคุณ"** (13px, textMuted)
   - Amount: **"฿187"** (42px/700, amber)
   - Sub: **"1 ใน 3 คน · ยอดรวม ฿560"** (12px, textMuted)
4. QR code — same spec as Screen 5 (white bg, 184×184, 20px radius)
5. PromptPay label row — same as Screen 5
6. Countdown chip — same as Screen 5
7. **Group progress row** (between QR and fallback card):
   - **"เพื่อน __ / __ คนชำระแล้ว"** (13px, textMuted)
   - 3 dots row: filled amber = paid, empty = pending (updates via WebSocket)
8. Fallback card — same as Screen 5

### States
- **MY_PENDING:** QR visible, countdown ticking, group progress shows 0 paid
- **MY_PAID:** QR replaced with amber check circle (56px). **"คุณชำระแล้ว ✓"** (18px/700, success). Group progress still visible + updates live: **"รอเพื่อน 2 คน..."** (14px, textMuted). Spinning dots below.
- **ALL_PAID:** Full success state — green check (72px), **"ทุกคนชำระครบแล้ว ✓"** (18px/700, success), amount, timestamp. Same layout as Screen 5 confirmed state.
- **EXPIRED (my QR):** QR grays out + **"QR หมดอายุแล้ว"** + **"สร้าง QR ใหม่"** amber button. Other people's payment status preserved.

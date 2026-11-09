# POS Payment Page (ศูนย์การชำระเงิน) — UI Specification

> UI spec for `/pos/payment` (`docs/features/pos-payment-page/ui.md`).

| | |
|---|---|
| **Feature** | [requirements.md](requirements.md) · [design.md](design.md) |
| **Owner** | kj |
| **Route** | `/pos/payment` (Web POS) |
| **Design tokens** | HeroUI + Tailwind CSS (`clay` palette, Noto Sans Thai) |

## Layout & Structure

- **PosRail:** "ชำระเงิน" (`Banknote` icon, position 3) becomes an active clickable link with `href="/pos/payment"`.
- **Top Header (`PayHeader`):**
  - Title: "การชำระเงิน" with banknote icon.
  - Subtitle: "รอบวันธุรกิจ {businessDate} · เวลาปัจจุบัน {clock}".
  - Quick summary cards (`PayMetrics`):
    - "ยอดรวมชำระแล้ว": `฿{totalRevenue}` (`text-text-accent font-bold`)
    - "PromptPay": `฿{promptpayTotal}` ({completedCount} รายการ)
    - "เงินสด": `฿{cashTotal}`
    - "บิลรอชำระ": `{pendingBillsCount} โต๊ะ` (Alert tint if > 0)

## Tabs Component (HeroUI Tabs)

### Tab 1: "รอชำระ" (Active / In-Flight Bills)
1. **Section "กำลังรอเงินเข้า (PromptPay QR)":**
   - Visible only when 1 or more tables have `paymentPending: true`.
   - Card layout with pulsing amber status dot:
     - Table label (e.g. `โต๊ะ T2`)
     - Amount due (e.g. `฿1,240.00`)
     - Countdown timer (e.g. "เหลือเวลา 12:45")
     - Buttons: "ดู QR / จัดการ" (opens `CheckoutModal` directly to pending QR view).
2. **Section "บิลเปิดรอคิดเงิน":**
   - Table or Card Grid listing all occupied tables (`currentVisit !== null`):
     - Columns: โต๊ะ (Label), เวลาเปิด (Time open / duration), รายการ (Item count), ยอดรวม (Total amount), สถานะการเรียก (Staff call badge if `staffCall.reason === 'bill'`), การกระทำ (Action).
     - Action button: Primary button "ชำระเงิน" (opens `CheckoutModal` for that table).
   - Empty state: Card with check icon — "ไม่มีบิลค้างชำระ ทุกโต๊ะเคลียร์ยอดเรียบร้อย".

### Tab 2: "ประวัติการชำระวันนี้" (Today's Transactions)
1. **Filter chips:**
   - "ทั้งหมด" (default)
   - "PromptPay"
   - "เงินสด"
2. **Transaction List Table:**
   - Columns:
     - เวลา (Time — `HH:MM น.`)
     - โต๊ะ (Seat / Table label, e.g. "T1", "Bar 3")
     - ยอดเงิน (Amount — tabular numerals, right-aligned)
     - ช่องทาง (Method: PromptPay with QR icon, or Cash with Banknote icon)
     - สถานะ (Status chip: `completed` เขียว "สำเร็จ", `cancelled` เทา "ยกเลิก", `failed` แดง "ไม่สำเร็จ")
     - การยืนยัน (Confirmation badge: "Webhook อัตโนมัติ", "สแกนสลิป", "ยืนยันเอง", "เงินสด")
   - Empty state: "ยังไม่มีรายการชำระเงินในรอบวันธุรกิจนี้".

## State Transitions & Actions

| State / Trigger | Observable UI Response |
|---|---|
| Load `/pos/payment` | Shows skeleton rows while fetching `/tables` and `/payments/today`. |
| Tab click "รอชำระ" / "ประวัติการชำระวันนี้" | Switches view without layout shift or network delay. |
| Click "ชำระเงิน" on table card | Opens `CheckoutModal` overlay. Background updates upon modal close/settlement. |
| Realtime `payment.status_changed` | Updates active bill list immediately; if completed, removes from pending and appends to Tab 2. |
| Network disconnect | Shows subtle warning banner: "การเชื่อมต่อขาด กำลังลองใหม่...". |

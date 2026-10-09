# CD-07 — Customer QR: pay from the phone (PromptPay merge / split-equal, cash via staff)

**Status:** Ready — Q1 (no claiming) + D1–D4 accepted by Field (2026-10-09) · **Surface:** customer phone web (390×844; also 360×780) · **Used by:** S1 customer payment brief · FRD §7 · rules from CD-03 (F1–F4)

## Attach
**Open inside the existing Claude Design project** (Design systems tab → The Loft Bar Design System): https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457
`docs/design/CD-03-handoff.md` (PromptPayPanel, split rule, cancelled/expired, lock) · `docs/design/CD-06-handoff.md` once it exists · `docs/briefs/ui/customer-qr.md` Screens 4.5, 5, 5-Split (content reference only)

## Data
- Customer payment endpoints are **not in the catalog yet** — added by the customer payment brief (public, visit session, same `payments` rules: lock, `cancelled` + `status_reason`, idempotent create).
- Realtime `/customer`: `payment.status_changed`, `visit.state_changed`.

## Decisions (Field)
- **Q1 — How does each friend get their part in a split? ✅ Decided (Field, 2026-10-09): no claiming.** Whoever starts the split picks n; every phone on the table sees the same part list; tap any unpaid part → its QR. Two people opening the same part see the same QR — only one payment settles it (webhook), the other phone flips to "ส่วนนี้ชำระแล้ว". *Why:* no reservation state, no timeouts to manage. *Alternative:* claim/reserve a part per phone for the QR lifetime (more state, prevents double-scan confusion).

## Defaults
- **D1 — Start screen = bottom sheet "จ่ายอย่างไร?"**: รวมบิล · หารเท่ากัน (stepper 2–10, "฿x ต่อคน" live) · **"จ่ายเงินสดกับพนักงาน"** (= call staff with reason "ขอเช็คบิล").
- **D2 — Charge items** (corkage, fines) are assigned by staff at the POS (CD-03 Q2); the customer split shows them as "ค่าบริการเฉพาะคน — ชำระกับพนักงาน" and excludes them from the phone split.
- **D3 — If a payment is already pending** (started at POS or another phone) the customer sees it ("มีการชำระเงินที่กำลังดำเนินการ") and can open that QR — never a second attempt.
- **D4 — PDPA / LINE invite after payment → S2** (not drawn).

## Paste into Claude Design
> Work inside **The Loft Bar Design System** project. **Customer web on a phone**, HeroUI v3 web components (name each part), 390×844. Thai, Noto Sans Thai, **tokens only**, **dark and light**. Reuse CD-00 **PromptPayPanel** (QR on `--qr-bg`, countdown) and payment chips: `pending` รอชำระ · `completed` ชำระแล้ว · `failed` ไม่สำเร็จ · `cancelled` ยกเลิกแล้ว (expired = cancelled chip + "QR หมดเวลา"). Money `฿1,240.00`. Table T3 total ฿1,240.00. Artboards `CD-07/<id>`. **Static state boards**, standalone 390×844 cards.
>
> 1. **CD-07/intent** — BottomSheet over the tab "จ่ายอย่างไร?": option cards **"ชำระรวม"** ("จ่ายทั้งหมด ฿1,240.00 ในครั้งเดียว") · **"หารเท่ากัน"** (stepper 2–10, "= ฿413.33 ต่อคน", note "ปัดเศษสตางค์ไว้ที่คนสุดท้าย") · **"จ่ายเงินสดกับพนักงาน"** ("พนักงานจะมาที่โต๊ะ"); primary "ถัดไป". States: merge selected · split 3 selected · charge present note "ค่าเปิดขวด ฿300.00 คิดเฉพาะคน — ชำระกับพนักงาน" · payment already pending Alert "มีการชำระเงินที่กำลังดำเนินการ" + "ดู QR".
> 2. **CD-07/qr** — merge: "ชำระเงิน — T3", PromptPayPanel (QR 240, ฿1,240.00, "หมดเวลาใน 14:32"), "สแกนด้วยแอปธนาคาร หรือบันทึกภาพ QR", Button "บันทึก QR" (download), caption "ระบบยืนยันอัตโนมัติเมื่อธนาคารแจ้งยอดเข้า". States: pending · completed ("ชำระแล้ว ฿1,240.00 · 21:14 น." + "ขอบคุณ! พนักงานจะดูแลต่อ" — table stays open) · failed ("การชำระเงินไม่สำเร็จ" + "สร้าง QR ใหม่") · expired ("QR หมดเวลา" + "สร้าง QR ใหม่") · disconnected (warning "กำลังตรวจสอบสถานะ…").
> 3. **CD-07/split** — part list "หารเท่ากัน · 3 คน": rows "คนที่ 1 ฿413.33 ชำระแล้ว ✓" · "คนที่ 2 ฿413.33 รอชำระ [จ่ายส่วนนี้]" · "คนที่ 3 ฿413.34 รอชำระ [จ่ายส่วนนี้]"; progress "ชำระแล้ว 1/3"; tapping a part → PromptPayPanel for that part with "คนที่ 2 จาก 3". States: 0/3 · 1/3 · part paid by someone else while open ("ส่วนนี้ชำระแล้ว" + back to list) · all paid ("ทุกคนชำระครบแล้ว ✓", total, time).
> 4. **CD-07/cash** — after choosing เงินสด: "แจ้งพนักงานแล้ว" + "พนักงานจะนำบิลมาที่โต๊ะ T3" + total; button "กลับไปที่ออเดอร์".
> 5. **CD-07/flow** — tab ชำระเงิน → intent → (รวม) qr → completed → tab · (หาร) split ⇄ part QR → all paid → tab · (เงินสด) cash → tab · qr expired/failed → สร้าง QR ใหม่ · pending elsewhere → ดู QR.
>
> Out of scope: card payments, tips, item-level split, receipts/tax invoice, LINE login, PDPA consent, staff/POS screens.

## Acceptance (Field checks)
- Dark + light at 390×844; qr and split also at 360×780.
- Never two payment attempts at once (pending → open existing QR).
- Paid ≠ closed: after payment the guest returns to the tab.
- No out-of-scope items appear.

## Result
- Claude Design link: <after run>
- Handoff: `docs/design/CD-07-handoff.md` · screenshots `docs/design/assets/CD-07/`

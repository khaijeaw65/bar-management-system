# CD-03 — POS: payment (PromptPay QR, cash, manual confirm, split-equal, in-flight collision)

**Status:** Done (2026-10-09) — handoff `CD-03-handoff.md`; review F1–F4 accepted by Field 2026-10-09 · **Surface:** web desktop/tablet (1280 px; also 1024 px) · **Used by:** core vertical slice (order → **pay** → close) — opened from CD-02 panel "ชำระเงิน" and close-confirm "ไปชำระเงิน"

## Attach
**Open inside the existing Claude Design project** (Design systems tab → The Loft Bar Design System, not the home "What should we create?" box): https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457
`docs/design/CD-00-handoff.md` (status chips §2, PromptPayPanel, Toast, Dialog) · `docs/design/CD-02-handoff.md` (panel, drawer, money format F1) · FRD §7 (payment), §8 (concurrency)

## Data this screen has (API catalog)
- `GET /api/visits/:id` → orders, items (incl. `item_type = charge`), totals, payments (`amount`, `method`, `status`, `paidAt`)
- `POST /api/visits/:visitId/payments` `{ method, mode: merge | split_equal, parts? }` + `Idempotency-Key` → **locks the amount**, returns PromptPay QR payload (one payment row per part)
- `GET /api/payments/:id` (polling fallback) · `POST /api/payments/:id/mark-paid` (+ reason) · `POST /api/payments/:id/cancel` (unlocks bill)
- Webhook confirms server-side → realtime `payment.status_changed`
- Errors: `409 PAYMENT_IN_FLIGHT` (close / void / comp while pending), `409 IDEMPOTENCY_KEY_REUSED`
- Enums: `payment_method` promptpay | cash · `payment_status` pending รอชำระ · completed ชำระแล้ว · failed ไม่สำเร็จ · refunded คืนเงินแล้ว (CD-00 §2)

## Decisions needed (Field)
- **Q1 — No `cancelled` / `expired` payment status. ✅ Decided (Field, 2026-10-04): add `cancelled` to `payment_status`; QR lifetime 15 min; timeout = system cancel.** The API has `/cancel` and CD-00 drew an "expired" PromptPayPanel, but `payment_status` only has pending | completed | failed | refunded. **Recommend:** add `cancelled` to `payment_status` (schema change). Staff cancel and QR timeout both set it; timeout is a system actor in `audit_log`; UI shows "หมดเวลา" vs "ยกเลิกแล้ว" from the audit reason. QR lifetime **15 min** with countdown. *Why:* `failed` should mean "gateway/bank rejected" — mixing in staff cancels makes the payment report lie. *Alternative:* reuse `failed` (no schema change, muddier reporting).
- **Q2 — Charge items in split-equal. ✅ Decided (Field, 2026-10-04): staff assigns each charge item to a part (default part 1); excluded from the equal split.** FRD §7: charge items (corkage, fines) belong to one person and are excluded from the equal split, but a shared table visit has no per-person tabs. **Recommend:** the split dialog lists charge items separately; staff assigns each to a part (default part 1). Part amount = equal share of non-charge total + assigned charges. *Alternative:* include charges in the equal split (simpler, contradicts FRD).
- **Q3 — Manual confirm of PromptPay (customer shows slip). ✅ Decided (Field, 2026-10-04): allowed with `payments:mark_paid` + mandatory reason + audit flag "ยืนยันด้วยตนเอง"; no manager PIN.** This is the fake-slip vector the webhook exists to kill. **Recommend:** allowed (gateway outages happen) with `payments:mark_paid` + mandatory reason ("เว็บฮุคไม่เข้า", "ลูกค้าโอนเข้าบัญชีร้านโดยตรง", "อื่นๆ"), shown with a warning chip "ยืนยันด้วยตนเอง" in the bill and flagged in audit for owner review — **no manager PIN** (keeps checkout fast; same flag pattern as solo void/comp). *Alternative:* require manager PIN like void/comp.

Defaults (no decision needed unless Field objects): split rounding → parts rounded down to satang, **last part absorbs the remainder**; cash "received / change" is a client-only helper (only the bill amount is stored — FRD §7); settlement ≠ close — after full payment the panel returns with "ปิดโต๊ะ" enabled; on-screen receipt summary only (no printing).

## Paste into Claude Design
> Work inside **The Loft Bar Design System** project. Extend CD-02's POS: shell (top bar 56 + PosRail 88, rail "โต๊ะ" active) and the session **Drawer 400 px** for table T3. Thai copy, Noto Sans Thai, **tokens only**, **dark and light** for every artboard. HeroUI v3 components only (Modal, Card, Chip, Button, RadioGroup, Tabs, Input, Alert, Toast, Skeleton, Spinner, Divider); name the HeroUI component on each part; reuse CD-00 **PromptPayPanel** and **StatusChip**. Money = `฿1,240.00` (prefix ฿, 2 decimals, tabular numerals). Payment chips keyed by schema enum: `pending` รอชำระ · `completed` ชำระแล้ว · `failed` ไม่สำเร็จ · `cancelled` ยกเลิกแล้ว. Artboards `CD-03/<id>`. **Static state boards** — all states side by side, no clickable switchers. Every preview card renders standalone (Lucide loaded in-card, explicit 1280×800 size).
>
> 1. **CD-03/checkout** — Modal (width ~560) "ชำระเงิน — T3". Top: bill summary (ยอดรวม `฿1,240.00`, ชำระแล้ว, **คงเหลือ** large accent). Section "วิธีแบ่งจ่าย": RadioGroup **"รวมบิล"** / **"หารเท่ากัน"**. Section "วิธีชำระ": RadioGroup cards **"PromptPay QR"** (recommended tag "ยืนยันอัตโนมัติ") / **"เงินสด"**. Buttons "ยกเลิก" / primary "สร้าง QR" (or "รับเงินสด" when cash). States: default merge · split selected · bill already partly paid (คงเหลือ < total, list of completed payments with chips).
> 2. **CD-03/split** — split-equal step: stepper "จำนวนคน" (2–10), live per-part list "คนที่ 1 ฿413.33 … คนที่ 3 ฿413.34" (last absorbs satang). Separate block "รายการคิดเฉพาะคน" listing charge items (e.g. "ค่าเปิดขวด ฿300.00") each with a Select "คิดกับ: คนที่ 1" — part totals update. Note "หารเฉพาะรายการทั่วไป ไม่รวมค่าบริการเฉพาะคน".
> 3. **CD-03/promptpay** — PromptPayPanel inside the Modal: QR 260 on `--qr-bg`, amount large, "T3 · คนที่ 1/3" when split, countdown "หมดเวลาใน 14:32", caption "ระบบจะยืนยันอัตโนมัติเมื่อธนาคารแจ้งยอดเข้า". Secondary actions: "ยืนยันด้วยตนเอง" (link-style) · "ยกเลิก QR". States side by side: **pending** (spinner "รอการชำระเงิน…") · **completed** (check, "ชำระแล้ว ฿1,240.00 · 21:14 น.", auto-advance) · **failed** (danger "การชำระเงินไม่สำเร็จ" + "สร้าง QR ใหม่") · **expired** (QR dimmed, "QR หมดเวลา" + "สร้าง QR ใหม่") · **realtime disconnected** (warning Alert "การเชื่อมต่อขาด กำลังตรวจสอบสถานะ…", still pending).
> 4. **CD-03/split-progress** — split in progress: list of parts, each row = "คนที่ n" + amount + payment chip + action ("แสดง QR" for pending, time for completed). Selected part shows its QR beside the list. Footer "ชำระแล้ว 2/3 · คงเหลือ ฿413.34". States: 0/3 · 2/3 · all done.
> 5. **CD-03/cash** — cash: amount due large; optional helper Input "รับเงินมา" with quick buttons (฿500, ฿1,000, "พอดี") → "เงินทอน ฿260.00" (helper only, muted note "ไม่บังคับ — ใช้ช่วยทอนเงิน"); primary "ยืนยันรับเงินสด". States: default · received < due (danger text "เงินไม่พอ", confirm disabled only when helper used) · confirming (isPending).
> 6. **CD-03/manual-confirm** — Modal from "ยืนยันด้วยตนเอง": warning Alert "ใช้เมื่อระบบไม่ได้รับการยืนยันจากธนาคาร — จะถูกบันทึกให้เจ้าของตรวจสอบ", required reason Select ("เว็บฮุคไม่เข้า", "ลูกค้าโอนเข้าบัญชีร้านโดยตรง", "อื่นๆ" + note Input), buttons "ปิด" / primary "ยืนยันว่าชำระแล้ว". Result in the bill: completed chip + small warning chip "ยืนยันด้วยตนเอง".
> 7. **CD-03/in-flight** — the CD-02 drawer while a payment is pending: top info Alert "กำลังรอการชำระเงิน ฿1,240.00 — ยอดถูกล็อกไว้" + Button "ดู QR"; **ยกเลิกรายการ / Comp** and **ปิดโต๊ะ** disabled with helper text "ยกเลิก QR ก่อนจึงจะแก้บิลได้"; a **new order arriving** during payment shows under a divider "ออเดอร์ใหม่หลังสร้าง QR — ไม่รวมในยอดนี้" with its amount counted in คงเหลือ after payment. Also: Toast danger for a 409 "โต๊ะนี้มีการชำระเงินค้างอยู่" when void is attempted from elsewhere.
> 8. **CD-03/done** — after full settlement: drawer footer shows "ชำระครบแล้ว" success chip, total paid, receipt summary Card (bar name, T3, items, total, method(s), time — on-screen only), primary "ปิดโต๊ะ" (→ CD-02 close-confirm) + secondary "กลับไปที่โต๊ะ" (table stays open — customers may keep ordering). Toast success "T3 ชำระแล้ว ฿1,240.00" (also drawn as the realtime toast when a webhook confirms while staff is on the grid).
> 9. **CD-03/flow** — arrows: panel ชำระเงิน → checkout → (รวมบิล) promptpay → completed → done → ปิดโต๊ะ (CD-02) · checkout → (หารเท่ากัน) split → split-progress ⇄ promptpay per part → done · checkout → cash → done · promptpay → expired/failed → สร้าง QR ใหม่ · promptpay → ยืนยันด้วยตนเอง → manual-confirm → done · promptpay → ยกเลิก QR → panel (unlocked).
>
> Out of scope (do not draw): item-level split, printed/tax receipts, refunds UI, tips, card payments, customer-phone payment (CD-07), staff-app payment handoff (CD-09), end-of-shift cashout, LINE OA.

## Acceptance (Field checks)
- Every artboard dark + light; checkout and promptpay also at 1024 px.
- Payment chips match CD-00 §2 + `cancelled` ยกเลิกแล้ว (Q1); no new status colours.
- In-flight lock is visible (disabled void/close + reason), new orders during payment shown as outside the locked amount.
- Split shows satang remainder on the last part and charge items handled per Q2.
- Settlement ≠ close: done state keeps the table open.
- No out-of-scope items appear.

## Result
- Claude Design link: https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457 (`ui_kits/pos-v2/cd-03/`, 9 boards + state boards, dark + light)
- Handoff: `docs/design/CD-03-handoff.md` · screenshots `docs/design/assets/CD-03/`

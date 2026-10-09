# CD-11 — Journey boards + notifications end-to-end (CD-10 merged in) — presentation set

**Status:** Draft — run **last**, after every other CD handoff exists · **Surface:** presentation boards 1920×1080 composed from existing artboards · **Used by:** 8 Nov gate demo + advisor presentation · CD-10 merged here (Field, 2026-10-09)

## Attach
**Open inside the existing Claude Design project** (Design systems tab → The Loft Bar Design System): https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457
All handoffs `docs/design/CD-0*-handoff.md`, `CD-1*-handoff.md` · DR-009 (surfaces, notifications table) · FRD §1 (problems: fake slips, no customer memory, scattered tools)

## Paste into Claude Design
> Work inside **The Loft Bar Design System** project. Build **presentation boards 1920×1080**, dark + light, composed **only from existing artboards** (scaled screenshots/instances of CD-02…CD-15 — do not redesign screens). Thai titles + short captions (one line each), Noto Sans Thai, tokens only. Each board: title, 3–6 screens left→right with numbered arrows, a role swimlane label (ลูกค้า · พนักงาน (แอป) · POS · เจ้าของ/ผู้จัดการ). Artboards `CD-11/<id>`.
>
> 1. **CD-11/overview** — 4 surfaces side by side (customer phone, staff app, POS tablet, back office laptop+phone) with one line each: "สแกน QR สั่งเอง" · "รับออเดอร์ทุกที่ในร้าน" · "เปิดโต๊ะ รับเงิน ปิดโต๊ะ" · "เมนู พนักงาน รายงาน".
> 2. **CD-11/journey-walkin** — walk-in group: customer scans QR (CD-06 welcome) → orders (CD-06 cart) → staff app queue buzzes (CD-08 push + queue) → bartender marks ready → customer tab shows พร้อม → POS drawer shows the order (CD-02).
> 3. **CD-11/journey-pay** — the headline: customer pays PromptPay (CD-07 qr) → **bank webhook confirms** (badge "ธนาคารยืนยัน — ปลอมสลิปไม่ได้") → POS Toast "T3 ชำระแล้ว" (CD-03 done) → staff closes table (CD-02 close-confirm) → card back to ว่าง. Side note: manual confirm path flagged for owner (CD-03 manual-confirm + CD-05 "ยืนยันด้วยตนเอง 3 ครั้ง").
> 4. **CD-11/journey-counter** — counter seat: staff opens C2 on POS (CD-02 open-table) → orders for customer (CD-04) → split / cash (CD-03) → close.
> 5. **CD-11/notifications** — one matrix board (CD-10): rows = events (ออเดอร์ใหม่ · เรียกพนักงาน · พร้อมเสิร์ฟ · ชำระแล้ว · โต๊ะไม่มีความเคลื่อนไหว · เมนูหมด), columns = surfaces (แอปพนักงาน push · POS toast/badge · หลังร้าน feed · ลูกค้า); each cell a tiny crop of the real component or "—", per DR-009.
> 6. **CD-11/issue** — problem path: bartender reports ของหมด (CD-08 issue) → POS issue drawer (CD-15) → void with reason (CD-02 void-comp) → customer tab shows "รายการถูกยกเลิก" (CD-06 tab).
> 7. **CD-11/admin** — owner morning: dashboard on phone (CD-05) → approve new staff request (CD-13) → 86 an item (CD-12 list) → customer menu shows หมด (CD-06).
>
> Out of scope: new screens, S2 features (guest AI, bottle keep, LINE OA) — at most one "Semester 2" teaser card on the overview board.

## Acceptance (Field checks)
- Boards use existing artboards only (no new UI); dark + light.
- The webhook/anti-fake-slip story is the visual centre of journey-pay.
- Notification matrix matches DR-009.

## Result
- Claude Design link: <after run>
- Boards exported to `docs/design/assets/CD-11/` (also used by the presentation deck)

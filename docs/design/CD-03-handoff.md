# CD-03 — Developer handoff: POS payment (from Claude Design, 2026-10-09)

Source: Claude Design project https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457 · files `ui_kits/pos-v2/cd-03/` (dark) and `cd-03/light/` (`?theme=light`) · brief `CD-03-pos-payment.md` (Q1–Q3 decided 2026-10-04).
Screenshots: `docs/design/assets/CD-03/` — **re-export after the CD bundle refreshes** (the summary says PromptPayPanel QR + `completed`/`cancelled` chips render as placeholder / "—" until then).
**Do not port Claude Design's JSX.** Build with HeroUI v3 + our tokens. All amounts, names and QR art are sample data (QR = placeholder, not EMVCo).

## 0. Cowork review — decisions for Field
| # | Item | Recommendation |
|---|---|---|
| F1 | **Payment needs to store *how* it was confirmed and *why* it was cancelled.** Boards show "ยืนยันด้วยตนเอง" + a reason (manual-confirm), and "QR หมดเวลา" vs "ยกเลิกแล้ว" for the same `cancelled` status. `payment` has no column for either (Q1 said "from the audit reason" — too awkward to query for a list). | Add to `payment`: `confirmed_via` enum (`webhook` \| `manual` \| `cash`, null while pending) · `status_reason VARCHAR(50)` (`expired` \| `staff_cancel` \| manual-confirm reason code) · `status_note TEXT` (the "อื่นๆ" detail). Decide in **BRIEF-013** (schema change). |
| F2 | **Split locks the whole bill** while any part is `pending` (in-flight board shows one lock for the table). Cancelling one part's QR only unlocks when no part is pending. | Accept — simplest consistent rule with FRD §7 "freeze what must be frozen". Record in BRIEF-013. |
| F3 | Manual-confirm "อื่นๆ" → `รายละเอียด` field. | **Required** when อื่นๆ is chosen (otherwise the audit flag has no content). |
| F4 | `cancelled` chip (neutral) is new in the DS StatusChip. | Update `docs/design-system.md` + `CD-00-handoff.md` §2 payment row: add `cancelled` ยกเลิกแล้ว neutral. Done in this PR. |

## 1. Design notes (not blocking)
- Sample data is not internally consistent (receipt shows เนโกรนี ฿280.00 and ยำหมูยอ ฿180.00 vs menu ฿240.00 / ฿150.00 + หมด in CD-04; split state 2 total ฿1,540.00 vs checkout ฿1,240.00). Use the **rules**, not the sample numbers: split = `floor(nonCharge×100/n)/100`, last part = remainder; charge items added to their assigned part.
- `expired` is not a status: show `cancelled` chip + heading "QR หมดเวลา" when `status_reason = expired` (F1).
- Completed → auto-advance to done after 3 s (`ไปที่สรุปการชำระใน 3 วินาที`) — accepted; button "ไปที่สรุป" skips the wait.
- Cash confirm disabled **only** when "รับเงินมา" is filled and short; empty field = confirm allowed (helper only, FRD §7).

## 2. Accepted deviations
All items in the summary §5 accepted (promptpay split into 3 state boards + 6th split-part state; context boards; added exit labels ถัดไป / ย้อนกลับ / ยืนยันการแบ่ง / ไปที่สรุป / ปิด; "ขาด ฿240.00"; quick-cash labels in money format; QR placeholder).

## 3. Modal widths (from summary §2, for quick reference)
checkout 560 · split 560 · cash 560 · manual-confirm 520 · promptpay 720 · split-progress 880 (widest; fits 1024×768). PromptPayPanel 348 (qrSize 260).

---

## Claude Design summary (verbatim)
```
CD-03 — POS ชำระเงิน (payment, table T3) — DEVELOPER HANDOFF

Design system: The Loft Bar · HeroUI v3 (web) / HeroUI Native (Expo) · Noto Sans Thai 400/600/700 · Lucide 0.468.0 (stroke 1.75, sizes 16/20/24)
Files: ui_kits/pos-v2/cd-03/ (dark) · ui_kits/pos-v2/cd-03/light/ (light = iframe of the dark file with ?theme=light)
Shared code: cd03-kit.jsx (all CD-03 modals, PayDrawer, Receipt, board helpers) · ../cd-02/cd02-kit.jsx (Cd02Shell, GridView, QRMock, StateLabel, Board) · ../cd-02/cd02-panel.jsx (TablePanel, OrderGroup) · ../Shell.jsx (top bar)
Every card: 1280×800, standalone, loads React 18.3.1 + Babel + Lucide + _ds_bundle.js itself.
Money: ฿1,240.00 (prefix ฿, 2 decimals, thousands comma, no space, tabular-nums). Clock: HH:MM น.
Payment chip (StatusChip kind="payment") keyed by schema enum: pending รอชำระ · completed ชำระแล้ว · failed ไม่สำเร็จ · cancelled ยกเลิกแล้ว.
Shell chrome (rail, top bar, notifications) = CD-02 handoff §0, unchanged. Rail "โต๊ะ" active.

NOTE ON PREVIEW: PromptPayPanel (qr / qrSize props) and StatusChip (completed / cancelled) changed this turn; the compiled bundle refreshes after the turn. Until then QR boards show the 200px placeholder and completed/cancelled chips render "—".


======================================================================
1. ARTBOARDS — STATES + STRINGS
======================================================================

----------------------------------------------------------------------
1.1 CD-03/checkout (CD-03-checkout.html) · CD-03/checkout · states (CD-03-checkout-states.html, zoom 66%)
----------------------------------------------------------------------
Context board: CD-02 grid (T3 selected) + T3 Drawer behind scrim + Modal, default state.
States: 1 default รวมบิล + PromptPay · 2 หารเท่ากัน selected · 3 partly paid (cash selected, payment list).

String                                  | Element
----------------------------------------|----------------------------------------------
ชำระเงิน — T3                            | Modal title (--text-heading)
ปิด                                      | close IconButton aria-label (x)
ยอดรวม · ฿1,240.00                       | bill summary row
ชำระแล้ว · ฿0.00 / ฿500.00               | bill summary row (state 3 = ฿500.00, --success-fg)
PromptPay · 20:41 น. · ฿500.00 · ชำระแล้ว | state 3 payment row 1 (qr-code icon, chip completed)
PromptPay · 20:44 น. · ฿740.00 · ยกเลิกแล้ว | state 3 payment row 2 (amount struck, chip cancelled)
คงเหลือ · ฿1,240.00 / ฿740.00            | bill summary total (40px, --text-accent)
วิธีแบ่งจ่าย                              | section label
รวมบิล · หารเท่ากัน                       | RadioGroup cards (icons receipt-text / users)
วิธีชำระ                                 | section label
PromptPay QR                             | Radio card (qr-code icon)
ยืนยันอัตโนมัติ                            | Chip success + dot on PromptPay card
เงินสด                                   | Radio card (banknote icon)
ยกเลิก                                   | Button secondary lg
สร้าง QR                                 | Button primary lg, state 1 (qr-code icon)
ถัดไป                                    | Button primary lg, state 2 (arrow-right)
รับเงินสด                                 | Button primary lg, state 3 (banknote)
Board labels: ค่าเริ่มต้น / เลือกหารเท่ากัน / ชำระไปแล้วบางส่วน · เงินสด

----------------------------------------------------------------------
1.2 CD-03/split (CD-03-split.html, zoom 66%)
----------------------------------------------------------------------
States: 1 three people · 2 with per-person charge, Select open · 3 two people (min, minus disabled).

String                                  | Element
----------------------------------------|----------------------------------------------
ชำระเงิน — T3 · หารเท่ากัน               | Modal title + subtitle
จำนวนคน · 2–10 คน                        | stepper label + helper
2 / 3                                    | stepper value (min 2, max 10)
คนที่ 1 ฿413.33 · คนที่ 2 ฿413.33 · คนที่ 3 ฿413.34 | per-part rows (state 1)
ปัดเศษสตางค์ไว้ที่คนสุดท้าย                 | helper under last part (3 people)
คนที่ 1 ฿713.33 · รวมค่าเปิดขวด ฿300.00   | state 2 part 1 + helper
รวม · ฿1,240.00 / ฿1,540.00              | total row (state 2 includes charge)
คนที่ 1 ฿620.00 · คนที่ 2 ฿620.00          | state 3
รายการคิดเฉพาะคน                          | section label (state 2)
ค่าเปิดขวด · ฿300.00                      | charge item row
คิดกับ: คนที่ 1 / คิดกับ: คนที่ 2 / คิดกับ: คนที่ 3 | Select value + options (open list)
หารเฉพาะรายการทั่วไป ไม่รวมค่าบริการเฉพาะคน | note (info icon)
ย้อนกลับ                                  | Button secondary lg (arrow-left)
ยืนยันการแบ่ง                              | Button primary lg
Rule: parts = floor(total×100 / n)/100; last part = total − sum(others). Charge items are added to their assigned part after the split.

----------------------------------------------------------------------
1.3 CD-03/promptpay (CD-03-promptpay.html) · states 1–3 (CD-03-promptpay-states-1/2/3.html, zoom 78%)
----------------------------------------------------------------------
Context board: pending, in Modal over grid + Drawer.
States: 1 pending · 2 completed · 3 failed · 4 expired · 5 realtime disconnected (still pending) · 6 split part 1/3.

String                                  | Element
----------------------------------------|----------------------------------------------
ชำระเงิน — T3                            | Modal title
PromptPay QR · รวมบิล / PromptPay QR · หารเท่ากัน | Modal subtitle
พร้อมเพย์                                | PromptPayPanel header
รอชำระ / ชำระแล้ว / ไม่สำเร็จ / ยกเลิกแล้ว  | PromptPayPanel chip (expired → ยกเลิกแล้ว)
เดอะ ลอฟท์ บาร์                           | merchant line under QR (--qr-ink)
฿1,240.00 / ฿413.33                      | amount (40px, tabular)
T3 / T3 · คนที่ 1/3                       | reference line
หมดเวลาใน 14:32                          | countdown (pending only)
รอการชำระเงิน…                           | Spinner + label (pending)
ระบบจะยืนยันอัตโนมัติเมื่อธนาคารแจ้งยอดเข้า | caption (pending)
ยืนยันด้วยตนเอง                           | Button ghost, link style (badge-check icon)
ยกเลิก QR                                | Button secondary lg block (x)
ชำระแล้ว ฿1,240.00 · 21:14 น.              | completed line (check in --success-bg circle)
ไปที่สรุปการชำระใน 3 วินาที                 | completed auto-advance note
ไปที่สรุป                                 | Button secondary lg (completed)
การชำระเงินไม่สำเร็จ                       | Alert danger (failed)
QR หมดเวลา                               | expired heading (timer-off icon)
ยังไม่มียอดเข้า สร้าง QR ใหม่เพื่อให้ลูกค้าสแกนอีกครั้ง | expired body
สร้าง QR ใหม่                             | Button primary lg block (refresh-cw), failed/expired
ปิด                                      | Button ghost block, failed/expired
การเชื่อมต่อขาด กำลังตรวจสอบสถานะ…          | Alert warning (wifi-off), state 5

----------------------------------------------------------------------
1.4 CD-03/split-progress (CD-03-split-progress.html) · states (CD-03-split-progress-states.html)
----------------------------------------------------------------------
Context board: 2/3 with part 3 selected and its QR beside the list.
States: 0/3 (part 1 selected) · 2/3 (part 3 selected) · all done.

String                                  | Element
----------------------------------------|----------------------------------------------
ชำระเงิน — T3 · หารเท่ากัน · 3 คน         | Modal title + subtitle
แบ่งจ่าย · 3 คน                           | list label + Chip neutral
คนที่ 1 / 2 / 3 · ฿413.33 / ฿413.33 / ฿413.34 | part rows
รอชำระ / ชำระแล้ว                         | payment chip per row
แสดง QR                                  | Button sm (primary on selected row, secondary otherwise)
21:08 น. · 21:11 น. · 21:14 น.             | completed time per row
ชำระแล้ว 0/3 · คงเหลือ ฿1,240.00           | footer, 0/3
ชำระแล้ว 2/3 · คงเหลือ ฿413.34             | footer, 2/3
ชำระแล้ว 3/3 · คงเหลือ ฿0.00               | footer, done (--success-bg, circle-check)
ไปที่สรุป                                 | Button primary lg (done)
T3 · คนที่ 3/3 · ฿413.34 · หมดเวลาใน 14:32 | PromptPayPanel beside list
รอการชำระเงิน… · ยืนยันด้วยตนเอง · ยกเลิก QR | under panel (Spinner, Button ghost sm, Button secondary sm)

----------------------------------------------------------------------
1.5 CD-03/cash (CD-03-cash.html, zoom 66%)
----------------------------------------------------------------------
States: 1 default (helper used, ฿1,500.00) · 2 received < due (฿1,000.00) · 3 confirming.

String                                  | Element
----------------------------------------|----------------------------------------------
ชำระเงิน — T3 · เงินสด · รวมบิล           | Modal title + subtitle (close hidden while confirming)
ยอดที่ต้องชำระ · ฿1,240.00                 | amount due (40px accent)
รับเงินมา                                 | Input label, prefix ฿, numeric
1,500.00 / 1,000.00                      | Input value
ไม่บังคับ — ใช้ช่วยทอนเงิน                 | Input description (states 1, 3)
เงินไม่พอ                                 | FieldError (state 2) and result-box label
฿500.00 · ฿1,000.00 · พอดี                | quick Buttons secondary sm
เงินทอน · ฿260.00                         | result box (states 1, 3)
ขาด ฿240.00                               | result box value (state 2, danger)
ยกเลิก · ยืนยันรับเงินสด                   | Buttons (confirm: disabled state 2, isPending state 3)
ปุ่มยืนยันปิดเฉพาะเมื่อกรอกช่องรับเงินมาแล้วไม่พอ · เว้นว่างไว้ก็ยืนยันได้ | board note

----------------------------------------------------------------------
1.6 CD-03/manual-confirm (CD-03-manual-confirm.html, zoom 72%)
----------------------------------------------------------------------
States: 1 reason Select open, none chosen (confirm disabled) · 2 อื่นๆ + note filled · 3 result in Drawer.

String                                  | Element
----------------------------------------|----------------------------------------------
ยืนยันว่าลูกค้าชำระแล้ว?                   | Modal title
PromptPay QR · T3 · ฿1,240.00             | subtitle
ใช้เมื่อระบบไม่ได้รับการยืนยันจากธนาคาร — จะถูกบันทึกให้เจ้าของตรวจสอบ | Alert warning
เหตุผล (ต้องเลือก) · เลือกเหตุผล            | Select label + placeholder
เว็บฮุคไม่เข้า · ลูกค้าโอนเข้าบัญชีร้านโดยตรง · อื่นๆ | Select options
รายละเอียด                                | Input label (only when อื่นๆ)
ลูกค้าโชว์สลิปจากแอปธนาคาร ยอดเข้าบัญชีแล้ว  | Input sample value
ปิด · ยืนยันว่าชำระแล้ว                     | Buttons (badge-check icon on primary)
ชำระแล้ว + ยืนยันด้วยตนเอง                 | result: payment chip + Chip warning (receipt card)

----------------------------------------------------------------------
1.7 CD-03/in-flight (CD-03-in-flight.html, zoom 84%)
----------------------------------------------------------------------
States: 1 locked drawer · 2 new order after QR · 3 409 Toast.

String                                  | Element
----------------------------------------|----------------------------------------------
โต๊ะ T3 · มีแขก · เปิด 1:50 · ต้น          | Drawer header (as CD-02)
กำลังรอการชำระเงิน ฿1,240.00 — ยอดถูกล็อกไว้ | Alert info (lock icon)
ดู QR                                    | Alert action Button secondary sm
ออเดอร์ใหม่หลังสร้าง QR — ไม่รวมในยอดนี้     | labelled Divider (state 2)
21:10 น. · ใหม่ · สิงห์ดราฟต์ · สั่งโดย ต้น · ฿140.00 | new order group (state 2)
รอชำระ · ฿1,240.00                        | footer total (40px accent)
คงเหลือหลังชำระ (ออเดอร์ใหม่) · ฿140.00     | footer row (state 2)
ชำระเงิน                                 | Button primary lg, isPending
ยกเลิกรายการ / Comp · ปิดโต๊ะ              | Buttons danger / ghost, isDisabled
ยกเลิก QR ก่อนจึงจะแก้บิลได้                | helper (lock icon)
โต๊ะนี้มีการชำระเงินค้างอยู่                 | Toast error (state 3)
เครื่องอื่นหรือแอปพนักงานพยายามยกเลิกรายการ → 409 · บิลไม่เปลี่ยน | board note

----------------------------------------------------------------------
1.8 CD-03/done (CD-03-done.html)
----------------------------------------------------------------------
States: 1 drawer after full settlement + Toast · 2 realtime Toast on CD-02 grid (webhook).

String                                  | Element
----------------------------------------|----------------------------------------------
T3 ชำระแล้ว ฿1,240.00                     | Toast success (both states)
เดอะ ลอฟท์ บาร์ · 21:14 น.                 | receipt Card header
โต๊ะ T3 · ต้น, บีม                         | receipt sub line
2× ช้างดราฟต์ ฿240.00 · เนโกรนี ฿280.00 · ยำหมูยอ ฿180.00 · โอลด์แฟชั่น ฿260.00 · 2× สิงห์ดราฟต์ ฿280.00 | receipt items
รวม · ฿1,240.00                           | receipt total
PromptPay · ฿1,240.00 · ชำระแล้ว           | receipt method row
ชำระครบแล้ว · ฿1,240.00                    | footer Chip success + total (--success-fg)
ปิดโต๊ะ                                  | Button primary lg (→ CD-02/close-confirm)
กลับไปที่โต๊ะ                              | Button secondary (arrow-left)
ปิดโต๊ะ → CD-02/close-confirm · กลับไปที่โต๊ะ = โต๊ะยังเปิด ลูกค้าสั่งต่อได้ · ใบเสร็จแสดงบนจอเท่านั้น | board note

----------------------------------------------------------------------
1.9 CD-03/flow (CD-03-flow.html)
----------------------------------------------------------------------
Nodes: CD-02/panel · CD-03/checkout · CD-03/promptpay · promptpay · failed / expired · CD-03/manual-confirm · promptpay · completed · CD-03/split · CD-03/split-progress · CD-03/cash · CD-03/done · CD-02/close-confirm
Arrow labels: ชำระเงิน · รวมบิล · หารเท่ากัน · เงินสด · ยอดเข้า · หมดเวลา / ไม่สำเร็จ · สร้าง QR ใหม่ · ยืนยันด้วยตนเอง · ยืนยันแล้ว · ยืนยันการแบ่ง · แสดง QR ต่อคน · กลับรายการ · ครบ 3/3 · รับเงินแล้ว · ปิดโต๊ะ · ยกเลิก QR → ปลดล็อก
Legend: การกระทำ · กลับ / ยกเลิก · ไปบอร์ดอื่น


======================================================================
2. LAYOUT SPECS
======================================================================
Viewport 1280×800 (POS min). Shell: PosRail 88 + top bar 56 → content 1192×744. Drawer 400 right, full content height.
Modals (HeroUI Modal, centred, scrim --scrim + 12px blur over the content area):
- checkout 560 · split 560 · cash 560 · manual-confirm 520 · promptpay 720 · split-progress 880. Padding --card-pad-lg; radius --r-card-lg (16).
- promptpay: 2 columns = PromptPayPanel (qrSize 260 → panel 348) | gap 24 | actions column minmax(0,1fr). Fits 800 high without scroll.
- split-progress: 2 columns = part list minmax(0,1fr) | gap 24 | PromptPayPanel 348.
Radio cards: min-height 56, padding 0 14, radius --r-btn (10), gap 8; selected = --accent-soft fill + --line-accent border. Split-method row = 2 equal columns.
Bill summary Card: padding 12/16, --surface-raised, radius --r-card (12); total 40px (--fs-pos-total) bold --text-accent.
Part rows: min-height 60, padding 8/12/8/14, radius --r-card, gap 8; action column 92 wide right-aligned.
Buttons: footer lg 52; quick-cash sm 36; IconButton md 44.
Drawer footer: padding 14/20/16, --shadow-sheet, sticky z --z-sticky. Receipt Card padding 16, --shadow-card + --highlight-top.
Spacing: 4px scale; section gap 16–18; group gap 8. Toasts top-right, top 72 (16 below top bar), max 380.
Breakpoint: designed at 1280; all modals ≤ 880 so 1024×768 fits (split-progress 880 is the widest).


======================================================================
3. COMPONENTS PER ARTBOARD  (HeroUI v3 → HeroUI Native · variant/size)
======================================================================
Shared: Modal → Dialog (center) · Drawer placement="right" 400 → Dialog/BottomSheet on Native · Button primary/secondary/ghost/danger (lg 52, md 44, sm 36) → Button · Button isIconOnly (IconButton md) → Button isIconOnly · Chip soft (Badge / StatusChip) sm/md → Chip · Divider → Divider.
checkout: Modal · Card (bill summary, payment rows) · RadioGroup › Radio ×2 + ×2 (custom card wrapper) · Chip success+dot "ยืนยันอัตโนมัติ" · StatusChip payment sm · Button secondary lg / primary lg.
split: Modal · NumberField (DS QuantityStepper lg 48) → custom stepper on Native · Card · Divider · Select (open) → Select · Button secondary lg / primary lg.
promptpay: Modal · PromptPayPanel (custom: Card + Chip) qrSize 260 · Spinner md → Spinner · Alert danger / warning → Alert · Button ghost (link) · Button secondary lg block · Button primary lg block.
split-progress: Modal · Card ×3 (rows) · Chip neutral · StatusChip payment sm · Button primary/secondary sm · PromptPayPanel · Spinner sm.
cash: Modal · Input (TextField, prefix ฿, numeric, description / FieldError) → TextField · Button secondary sm ×3 · Button primary lg (isDisabled / isPending).
manual-confirm: Modal · Alert warning · Select (required, open) · Input · Button secondary lg / primary lg · result: StatusChip completed + Chip warning.
in-flight: Drawer · Alert info + Button secondary sm · Divider with label · OrderGroup (CD-02) · Button primary lg isPending · Button danger / ghost isDisabled · Toast error → Toast.
done: Drawer · Card (receipt) · Chip success · Button primary lg / secondary md · Toast success (ToastRegion top-right).


======================================================================
4. NEW / CHANGED COMPONENTS + TOKENS
======================================================================
No new tokens. All colour from existing tokens (--accent*, --success-*, --warning-*, --danger-*, --info-*, --qr-bg / --qr-ink, --surface-*, --line*).
Changed (design system):
- StatusChip (components/core/StatusChip.jsx/.d.ts): payment set now = pending รอชำระ (new) · completed ชำระแล้ว (served) · failed ไม่สำเร็จ (void) · cancelled ยกเลิกแล้ว (neutral). Kept aliases paid → ชำระแล้ว, refunded คืนเงินแล้ว (making). DS-status-chips card + readme updated.
- PromptPayPanel (components/bar/PromptPayPanel.jsx/.d.ts): new props qr?: ReactNode (rendered code, wins over qrSrc), qrSize?: number (default 200; checkout uses 260; panel width = max(320, qrSize + 88)). status now accepts completed | cancelled | expired (expired → cancelled chip + QR at 25% opacity); paid kept as alias.
- cd02-panel.jsx: exports Cd02OrderGroup (reused by PayDrawer). TablePanel gained optional orders / sub / orderBtn / highlightFirst (from CD-04).
Kit-local (not in the DS bundle): RadioCard (Radio inside 56px card), BillSummary, PartList, PayDrawer, Receipt, labelled Divider.


======================================================================
5. DEVIATIONS FROM THE PROMPT
======================================================================
- promptpay states split across 3 boards (2 states each) + a context board: 5 states side by side at 1280 would put the QR modal below ~45% zoom, unreadable. Added a 6th state (split part 1/3) to show "T3 · คนที่ 1/3".
- checkout and split-progress also got a full-context board (grid + Drawer behind the Modal) in addition to the states board.
- "expired" is not in the payment enum → panel chip shows ยกเลิกแล้ว (cancelled) with QR dimmed; heading "QR หมดเวลา" carries the meaning.
- Labels not in the prompt, added so each step has an exit: ถัดไป (checkout with หารเท่ากัน), ย้อนกลับ / ยืนยันการแบ่ง (split), ไปที่สรุป + "ไปที่สรุปการชำระใน 3 วินาที" (completed), ปิด (failed/expired), Modal title "ยืนยันว่าลูกค้าชำระแล้ว?" and Select label "เหตุผล (ต้องเลือก)" (manual-confirm), "ยังไม่มียอดเข้า…" (expired body), "ขาด ฿240.00" (cash short).
- split state 2 total = ฿1,540.00: ค่าเปิดขวด ฿300.00 added on top of T3's ฿1,240.00 so the general split stays ฿413.33/413.33/413.34.
- Partly-paid sample: ฿500.00 completed + ฿740.00 cancelled (shows both chip types); คงเหลือ ฿740.00.
- Cash quick buttons drawn as "฿500.00" / "฿1,000.00" (system money format) instead of "฿500" / "฿1,000".
- PromptPayPanel chip is the panel's own; payment chips appear on the board without a separate HeroUI label.
- QR art is the CD-02 QRMock placeholder (module grid), not a real EMVCo payload.
```

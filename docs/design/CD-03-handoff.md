---
id: CD-03
title: POS — payment (PromptPay QR, cash, manual confirm, split-equal, in-flight lock)
revision: 2
status: review            # rev 1 decisions approved (Q1–Q3 2026-10-04, F1–F4 2026-10-09); rev-1 screens not yet reviewed (R3); rev 2 = CD template retrofit
approved_by: Field        # rev 1 decisions
approved_on: 2026-10-09
canvas: https://claude.ai/artifact/1NiEZaPhKTRsKtHh4WcqZb
canvas_version: 1791644100-e257
ds_version: 1791561405-c72e
source: docs/design/source/CD-03/   # taken after rev 2 approval (§11)
surfaces: [web-pos]
sizes: [1280x800, 1024x768]
brief: CD-03-pos-payment.md
drs: [DR-009, DR-012]
depends_on: [CD-00, CD-02, CD-04]
supersedes: brief paste text and acceptance where they conflict (see brief "Revisions")
---

# CD-03 — POS: payment

Built on The Loft Bar Design System (real DS components; every board has a dark/light Theme tweak). **Do not port canvas markup** — build with HeroUI v3 + tokens (`docs/rules/frontend.md`, BRIEF-014 utilities). Sample data only; QR art is a placeholder, not EMVCo. Template: `cd-template.md` · boards: `board-convention.md`. Shared children on the canvas: `PosFrame`, `Grid` (CD-02 copy), `Panel` (modes active / locked / lockedNew / paid / manualPaid, prop `ring`).

## 0. Review items
Rev 1 decisions Q1–Q3, F1–F4 stay (§10). Rev-2 items (✓ = accepted):

| # | Item | Recommendation |
|---|---|---|
| R1 ✓ | **Pain point.** Root observed at both bars (CD-14 R8: paper / verbal orders → bill added up by hand). The payment-specific part is an **assumption**: cashiers check transfer slips by eye (can be faked) and split bills on a calculator → slow check-out queue, short takings. | Field: confirm or correct from the field visits. **Confirmed 2026-10-12** (field experience + research — `docs/research/Claude_verified_ops_findings.md`, DR-014). |
| R2 ✓ | **DR-012 in the panel** (all boards): groups = station tickets with label บาร์ / ครัว, no item progress chips (only "ยกเลิก"), `accepted` = "กำลังเตรียม · ชื่อ"; orders arriving after the QR are tickets too. Sample made consistent with CD-02 / CD-04 (฿1,240.00 = items in receipt). | Done (panel). |
| R3 ⏸ | **Content review of rev 1 screens** — decisions were approved, the screens never were: split rule (last part takes satang; charges added after the split) · cash helper optional · completed auto-advances after 3 s · whole bill locked while any part pending · receipt on screen only. | Field: walk J1 / J2 + state boards. **Parked 2026-10-12** until Field reviews the canvases. |
| R4 ✓ | **New states:** checkout at 1024×768 (checkout·4) · create-QR failed, nothing locked (checkout·5) · promptpay at 1024×768 (·7). Rules: no `payments:create` → "ชำระเงิน" hidden · no `payments:mark_paid` → "ยืนยันด้วยตนเอง" hidden · disconnected → poll `GET /payments/:id` every 5 s. | Accept. **Accepted 2026-10-12** (Field). |
| R5 ✓ | **Needs API (BRIEF-013, not written):** `confirmed_via` / `status_reason` / `status_note` (F1) · whole-bill lock while any part pending (F2) · `409 PAYMENT_IN_FLIGHT` on void / comp / close · cancel + 15-min system expiry (Q1) · GB Prime Pay webhook → `payment.status_changed`. | Write into BRIEF-013. **Accepted 2026-10-12** (Field). |
| R6 | **DR-014 #6 impact (canvas update):** payment modes per venue — gateway webhook, or "normal way": app-generated amount-locked PromptPay QR to the venue account + **scan slip → verify** (evidence stored; reused slip / wrong receiver / short amount rejected) + manual confirm fallback. Gate = manual confirm. | Field approved DR-014 2026-10-12; apply in the next canvas revision. |

## 1. Overview
- **Goal:** the cashier collects the whole bill or an equal split; PromptPay confirms itself from the bank, the amount is locked while waiting, and settling never closes the table by itself.
- **Pain point:** see R1 (root = field research; payment-specific part = assumption).
- **User + context:** cashier / manager at the POS tablet · Friday 23:30, several tables asking for the bill, groups of 3–6 who want to split, guest waiting with phone in hand, touch only.
- **Entry → exit:** CD-02 panel "ชำระเงิน" · close-confirm "ไปชำระเงิน". Exit: settled → panel with on-screen receipt → "ปิดโต๊ะ" (CD-02 close-confirm) or "กลับไปที่โต๊ะ" · ยกเลิก QR → panel unlocked.
- **Outcome:** no slip checking for PromptPay (webhook confirms); no double charge (Idempotency-Key, lock); split remainder always on the last part; manual confirm possible but flagged for the owner.
- **Out of scope:** item-level split, printed / tax receipts, refunds UI, tips, cards, customer pays on phone (CD-07), end-of-shift cash count, LINE OA.
- **Journeys:** J1 T3 merge + PromptPay: ชำระเงิน → สร้าง QR → webhook → สรุป → ปิดโต๊ะ (E1–E4) · J2 webhook missing, guest shows slip: ยืนยันด้วยตนเอง → reason อื่นๆ + detail → confirmed, flagged (E1–E3).

## 2. Boards
| Board | Type | States |
|---|---|---|
| `overview` | OVERVIEW | goal, pain point (R1), user/context, outcome, entry/exit, journeys, out of scope, key decisions |
| `journey-1` | JOURNEY | panel (E1 ชำระเงิน) → checkout (E2 สร้าง QR) → pending → (webhook) completed (E3 ไปที่สรุป) → done (E4 ปิดโต๊ะ → CD-02) |
| `journey-2` | JOURNEY | pending 6 min (E1 ยืนยันด้วยตนเอง) → reason required (E2 อื่นๆ + detail) → (E3 ยืนยัน) → receipt with "ยืนยันด้วยตนเอง" |
| `checkout` | STATES | 1 default · 2 split selected · 3 partly paid + cash · 4 1024×768 · 5 create-QR failed |
| `split` | STATES | 1 three people · 2 charge assigned · 3 two people (min) |
| `promptpay` | STATES | 1 pending · 2 completed · 3 failed · 4 expired · 5 disconnected · 6 split part 1/3 · 7 1024×768 |
| `split-progress` | STATES | 0/3 · 2/3 · 3/3 |
| `cash` | STATES | helper used · short · confirming |
| `manual-confirm` | STATES | no reason · อื่นๆ + detail · result |
| `in-flight` | STATES | locked · new order after QR · 409 Toast |
| `done` | STATES | panel after settlement · realtime Toast on grid |
| `flow` | FLOW MAP | panel → checkout → promptpay / split / cash → done |
Shared (not boards to review): `PosFrame`, `Grid`, `Panel`.

## 3. State coverage
✓ drawn · n/a (reason) · shared (where) · rule (§9, not drawn).

| State | Checkout | Split | PromptPay | Cash | Manual confirm | Panel (in-flight / done) |
|---|---|---|---|---|---|---|
| default | ✓ ·1 | ✓ ·1 | ✓ ·1 | ✓ ·1 | ✓ ·1 | ✓ in-flight·1 |
| loading | rule: bill from panel data, no own load | n/a | rule: create QR = primary isPending | ✓ ·3 | rule: primary isPending | shared CD-02 panel·3 |
| empty | rule: คงเหลือ ฿0.00 → "ชำระเงิน" disabled | n/a | n/a | n/a | n/a | n/a |
| error + retry | ✓ ·5 | n/a (client) | ✓ ·3 failed | rule: network → Alert, retry same key | rule: as cash | ✓ in-flight·3 |
| validation | n/a | ✓ ·3 (2–10) | n/a | ✓ ·2 short | ✓ ·1 ·2 (reason, detail F3) | n/a |
| pending | ✓ (lock on create) | n/a | ✓ ·1 ·5 ·6 | ✓ ·3 | rule | ✓ in-flight·1 |
| success feedback | n/a | n/a | ✓ ·2 | rule → done | ✓ ·3 | ✓ done·1 ·2 |
| failure per reason | ✓ ·5 | n/a | ✓ ·3 failed · ·4 expired | ✓ ·2 | rule: 409 already completed → refetch, Toast | ✓ in-flight·3 (409) |
| stale / conflict | ✓ ·3 (partly paid) | rule: bill changed before confirm → recompute | ✓ in-flight·2 (new order outside lock) | n/a | rule: webhook arrives first → modal closes, completed | ✓ in-flight·2 |
| disconnected | n/a | n/a | ✓ ·5 (poll fallback) | n/a | n/a | shared CD-02 grid-states·4 |
| permission denied | rule: no `payments:create` → entry hidden | ← | rule: no `payments:mark_paid` → link hidden | ← | ← | ← |
| long Thai text | rule: names wrap in receipt | n/a | n/a | n/a | ✓ ·2 (detail) | rule |
| smallest size | ✓ ·4 | shared (560) | ✓ ·7 | shared (560) | shared (520) | split-progress 880 widest, fits |
| keyboard open | n/a | n/a | n/a | rule: numeric keyboard, modal stays centered | rule | n/a |
| session expired | global: 401 → CD-01 login; pending payment stays server-side | ← | ← | ← | ← | ← |

## 4. Action table
| Action | API (status) | Permission | Success → UI | Failure → UI | Recovery | Data kept | Idempotency |
|---|---|---|---|---|---|---|---|
| Open checkout | `GET /visits/:id` totals + payments (planned BRIEF-012 / 013) | `payments:create` | checkout·1 / ·3 | network → panel error | retry | — | n/a |
| Create QR / split | `POST /visits/:visitId/payments {method, mode, parts?}` + Idempotency-Key (planned BRIEF-013) | `payments:create` | locks bill, promptpay·1 / split-progress | network / gateway → checkout·5 (nothing locked) · `409 PAYMENT_IN_FLIGHT` → show existing QR | retry same key | choices | key per checkout open |
| Confirm (bank) | webhook → WS `payment.status_changed` (planned BRIEF-013) | — | promptpay·2 → done | failed → ·3 | สร้าง QR ใหม่ (new key) | — | webhook dedup by gateway ref |
| Poll status | `GET /payments/:id` every 5 s while disconnected | `payments:read` | as webhook | — | — | — | n/a |
| Cancel QR | `POST /payments/:id/cancel` | `payments:create` | `cancelled` (`staff_cancel`), bill unlocked when no part pending (F2) | 409 already completed → done | — | — | repeat → 409 refetch |
| Expiry | server job at 15 min (Q1) | system | ·4 expired (`status_reason = expired`) | — | สร้าง QR ใหม่ | — | — |
| Manual confirm | `POST /payments/:id/mark-paid {reason, note?}` | `payments:mark_paid` | completed + Badge "ยืนยันด้วยตนเอง" (`confirmed_via = manual`) | 409 already completed → close modal | — | reason | repeat → 409 |
| Cash | `POST /visits/:visitId/payments {method:'cash'}` (completed immediately) | `payments:create` | done | network → Alert | retry same key | received (client only) | Idempotency-Key |
| Void / close while pending | CD-02 actions | — | — | `409 PAYMENT_IN_FLIGHT` → in-flight·3 | cancel QR first | — | — |
| Close table | → CD-02 close-confirm | `visits:close` | — | — | — | — | — |

## 5. e2e script
- **J1** E1 on T3 panel tap "ชำระเงิน" → checkout (รวมบิล + PromptPay, คงเหลือ ฿1,240.00) · E2 "สร้าง QR" → one `POST /payments` with Idempotency-Key → QR ฿1,240.00, countdown 15:00, panel locked (void / close disabled) · simulate webhook → `payment.status_changed completed` → "ชำระแล้ว ฿1,240.00", auto-advance after 3 s · E3 "ไปที่สรุป" → panel receipt "ชำระครบแล้ว", table still open · E4 "ปิดโต๊ะ" → CD-02 close-confirm (paid → close allowed).
- **J2** pending QR, no webhook · E1 "ยืนยันด้วยตนเอง" → modal, confirm disabled · choose "อื่นๆ" → detail required (F3) · type detail · E3 "ยืนยันว่าชำระแล้ว" → `mark-paid {reason:'other', note}` → completed, `confirmed_via = manual`, receipt Badge "ยืนยันด้วยตนเอง", Toast "ยืนยันด้วยตนเอง · บันทึกให้เจ้าของตรวจสอบแล้ว".
- **Edge:** double-tap สร้าง QR → one payment · void from staff app while pending → 409 · new order during pending → shown under divider, not in locked amount · split 3 of ฿1,240.00 → 413.33 / 413.33 / 413.34 · cash received empty → confirm allowed.

## 6. Strings & sample data
Sample data lives in the board files and `Panel` `renderVals()`. New in rev 2 (**bold**): **"สร้าง QR ไม่สำเร็จ ลองอีกครั้ง" / "ยังไม่ได้ล็อกยอด — กดสร้าง QR อีกครั้งได้ ระบบไม่สร้างซ้ำ" · panel station labels บาร์ / ครัว · ticket chip "กำลังเตรียม · บีม" · receipt items 2× ช้างดราฟต์ ฿240.00 · 4× สิงห์ดราฟต์ ฿560.00 · 1× โอลด์แฟชั่น ฿260.00 · 1× ลีโอขวด ฿100.00 · 1× ถั่วทอดสมุนไพร ฿80.00**. Rev-1 strings (Claude Design summary below) still valid except panel item chips (DR-012) and the receipt sample.

### Rev-1 design notes (still valid)
- Sample data is not internally consistent (receipt shows เนโกรนี ฿280.00 and ยำหมูยอ ฿180.00 vs menu ฿240.00 / ฿150.00 + หมด in CD-04; split state 2 total ฿1,540.00 vs checkout ฿1,240.00). Use the **rules**, not the sample numbers: split = `floor(nonCharge×100/n)/100`, last part = remainder; charge items added to their assigned part.
- `expired` is not a status: show `cancelled` chip + heading "QR หมดเวลา" when `status_reason = expired` (F1).
- Completed → auto-advance to done after 3 s (`ไปที่สรุปการชำระใน 3 วินาที`) — accepted; button "ไปที่สรุป" skips the wait.
- Cash confirm disabled **only** when "รับเงินมา" is filled and short; empty field = confirm allowed (helper only, FRD §7).


### Rev-1 Claude Design summary (verbatim — layout §2, components §3 and strings §1 still apply unless changed above)
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


## 7. Layout & tokens
- Viewports 1280×800 (design), **1024×768 smallest** (checkout·4, promptpay·7). Content 1192×744 @1280.
- Modals: checkout 560 · split 560 · cash 560 · manual-confirm 520 · promptpay 720 · split-progress 880 (widest, fits 1024). PromptPayPanel 348 (qrSize 260).
- Radio cards min-height 56; bill summary total 40/700 accent; part rows min-height 60; footer buttons lg 52.
- Drawer 400 (CD-02); receipt Card padding 16. Toasts top-right max 380.

## 8. Components → platform (HeroUI v3)
| Part | HeroUI v3 |
|---|---|
| Checkout / split / cash / manual confirm | Modal + RadioGroup (card wrapper) · NumberField · Select · Input / TextField · Button |
| QR | PromptPayPanel (DS) inside Modal · Spinner |
| Payment status | StatusChip kind payment (pending / completed / failed / cancelled) |
| Manual flag | Badge warning "ยืนยันด้วยตนเอง" |
| Lock / errors / disconnected | Alert (info / danger / warning) |
| Feedback | Toast success / danger |
| Panel | CD-02 Drawer (DR-012 groups) |

## 9. Behaviour rules
- **Lock:** creating a payment locks the bill amount; while any part is `pending` the whole bill is locked (F2): void / comp / close → `409 PAYMENT_IN_FLIGHT`. Orders arriving meanwhile show under "ออเดอร์ใหม่หลังสร้าง QR — ไม่รวมในยอดนี้" and remain due after.
- **Confirmation:** only the webhook (or poll fallback) marks PromptPay completed; staff can't except via manual confirm (`payments:mark_paid`, reason required, "อื่นๆ" needs detail, flagged — Q3).
- **Expiry:** QR lifetime 15 min; expiry = `cancelled` + `status_reason = expired`, heading "QR หมดเวลา" (Q1, F1).
- **Split:** n 2–10; part = floor(non-charge × 100 / n) / 100; last part = remainder; charge items added to their assigned part (Q2).
- **Cash:** stores only the bill amount; "รับเงินมา" is a client helper; confirm disabled only when filled and short.
- **Settlement ≠ close:** done keeps the table open; "ปิดโต๊ะ" goes through CD-02 close-confirm.
- **Idempotency:** one key per checkout attempt; retry reuses it; "สร้าง QR ใหม่" after failed / expired uses a new key.
- **Disconnected:** keep pending UI, Alert warning, poll every 5 s; webhook result wins.
- **Permissions:** no `payments:create` → "ชำระเงิน" hidden; no `payments:mark_paid` → manual link hidden.
- **Standard questions (`cd-template.md` §5):** Filters / search → n/a. Long and short → 1024×768 drawn; receipt names wrap. Interaction → DS pressed / disabled / pending; radio card selected = accent-soft. Accessibility → modal labelled "ชำระเงิน — T3"; countdown announced politely each minute, not every second; status not by colour alone (chip text). Data → totals from server only; client never computes the charged amount except the split preview (server recomputes).
- **User-mindset checks:** ✓ one dominant action per step · ✓ targets · ✓ ack < 1 s · ✓ loss confirmed (cancel QR = explicit button) · ✓ errors say how to fix · ✓ task cost J1 3 taps · ✓ status not by colour alone · ☐ long Thai receipt drawn · ☐ walkthrough with staff (R3).

## 10. Revisions
| Rev | Date | Change | Authority |
|---|---|---|---|
| 1 | 2026-10-04 | Q1 `payment_status += cancelled`, 15-min QR · Q2 charges per part · Q3 manual confirm without PIN, flagged | Field |
| 1 | 2026-10-09 | Claude Design boards; F1 `confirmed_via` / `status_reason` / `status_note` · F2 split locks whole bill · F3 detail required for อื่นๆ · F4 `cancelled` chip | Field |
| 1 | 2026-10-09 | Ported to the Design canvas (P1 sample consistency, P2 QR placeholder, P3 manual result) | Cowork |
| 2 | 2026-10-10 | CD template retrofit: overview, J1 / J2, pills + sections, 1024×768 frames, create-QR failure; R2 DR-012 panel + sample consistent with CD-02 / CD-04; R1 pain point assumption; R3 screen review; R4 states; R5 API gaps | R2 via DR-012 · R1, R3–R5 pending |

## 11. Source snapshot
Pending — after Field approves rev 2 (`cd-template.md` §6). Lucide blob `/_blob/7564fb1d7f942a27438b0405aa632b96` (CD-03). QR image `/_blob/9a623a27027ed88647a51f86c0a108f1` is a placeholder (not EMVCo).

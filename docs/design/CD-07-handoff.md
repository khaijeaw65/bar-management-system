---
id: CD-07
title: Customer QR — pay from the phone (PromptPay merge / split-equal, cash via staff)
revision: 1
status: review
approved_by:
approved_on:
canvas: https://claude.ai/artifact/JDoXZyWWF2tLybdY9dufQe
canvas_version: 1791708326-9c5a
ds_version: 1791561405-c72e
source: docs/design/source/CD-07/   # taken after approval (§11)
surfaces: [web-customer]
sizes: [390x844, 360x780]
brief: CD-07-customer-payment.md
drs: [DR-009, DR-012]
depends_on: [CD-00, CD-03, CD-06]
supersedes: brief paste text and acceptance where they conflict (see brief "Revisions")
---

# CD-07 — Customer QR: pay from the phone

Built on The Loft Bar Design System (real DS components incl. `PromptPayPanel`, `StatusChip kind=payment`; every board has a dark/light Theme tweak). **Do not port canvas markup** — build with Next.js + HeroUI v3 + tokens. Sample data only; the QR image is a placeholder (not EMVCo). Payment rules come from CD-03 (lock, `cancelled` + `status_reason`, idempotent create, webhook-only confirm). One shared child renders every phone: `Screen` (props `screen` tab / intent / qr / split / cash · `state` · `ring` · `w` / `h`); its tab section is copied from CD-06.

## 0. Review items
Brief decisions Q1 (no claiming) and D1–D4 apply (§10). Rev-1 items:

| # | Item | Recommendation |
|---|---|---|
| R1 ✓ | **Pain point.** Root observed (verbal orders → bill added by hand). Payment-specific part is an **assumption**: on a full night guests wait long for the bill; friends split and transfer separately, staff check each slip by eye. | Field: confirm or correct. **Confirmed 2026-10-12** (field experience + research — `docs/research/Claude_verified_ops_findings.md`, DR-014). |
| R2 | **"เปลี่ยนวิธีจ่าย" on a pending QR** = the guest cancels their own QR (cancel → bill unlocked). Merge: always allowed. Split: only while no part is paid; after the first paid part the rest must be paid or handled by staff. | Accept. |
| R3 | **Paying with the phone that shows the QR** can't scan itself → primary "บันทึก QR" + 2-step hint (open the bank app → scan → pick from gallery). A friend can still scan the screen directly. | Accept. |
| R4 ⏸ | **Parked with CD-06 R3 / R4 / R5** (customer session). The customer payment API (visit-session auth, create / cancel / status, realtime `payment.status_changed`) is written after the session decision; rules as CD-03. | — |
| R5 | **Ordering after full payment** creates a new balance on the same table; "ชำระเงิน" returns with only the new amount. Rule only, not drawn. | Accept. |
| R6 | **DR-014 #6 impact (canvas update):** guest self-pay uses the venue's payment mode — gateway QR, or app-generated amount-locked PromptPay QR to the venue account (confirmed by staff slip scan / manual). | Field approved DR-014 2026-10-12; apply in the next canvas revision. |

## 1. Overview
- **Goal:** guests pay the whole table or an equal split with PromptPay from their own phones, confirmed automatically by the bank, or call staff for cash.
- **Pain point:** see R1.
- **User + context:** guests at a table · Friday 23:30, about to leave, three friends want to split, each pays from their own banking app.
- **Entry → exit:** CD-06 tab "ชำระเงิน" → intent sheet. Exit: back to the tab (table stays open; closing happens at the POS, CD-02).
- **Outcome:** merge in 3 taps (ชำระเงิน → สร้าง QR → บันทึก QR) + the bank transfer; never two attempts at once (pending → open the existing QR); a part paid elsewhere shows paid on every phone at once; paid ≠ closed.
- **Out of scope:** cards, tips, item-level split, receipts / tax invoice, LINE login, PDPA consent, staff / POS screens.
- **Journeys:** J1 ต้น pays ฿1,240.00 merge: tab → intent → QR → webhook → paid → tab (E1–E4) · J2 split 3: two phones open part 2, the other pays first → "ส่วนนี้ชำระแล้ว" → pay part 3 → all paid (E1–E4).

## 2. Boards
| Board | Type | States |
|---|---|---|
| `overview` | OVERVIEW | goal, pain point, user/context, outcome, entry/exit, journeys, out of scope, key decisions |
| `journey-1` | JOURNEY | tab (E1 ชำระเงิน) → intent merge (E2 สร้าง QR) → QR pending (E3 บันทึก QR, then system webhook) → paid (E4 กลับ) → tab paid |
| `journey-2` | JOURNEY | intent split 3 (E1) → split 1/3 (E2 part 2) → part QR → (other phone pays) → part paid elsewhere (E3) → split 2/3 (E4 part 3 → pay) → all paid |
| `intent` | STATES | 1 merge · 2 split 3 · 3 per-person charge (D2) · 4 cash · 5 payment already pending (D3) |
| `qr` | STATES | 1 pending · 2 completed · 3 failed · 4 expired · 5 disconnected · 6 split part 2/3 · 7 part paid elsewhere · 8 360×780 |
| `split` | STATES | 1 0/3 · 2 1/3 · 3 with per-person charge · 4 3/3 · 5 360×780 |
| `cash · after` | STATES | 1 cash: staff called · 2 tab after full payment |
| `flow` | FLOW MAP | merge · split / cash · errors / collisions |
Shared (not a board to review): `Screen`.

## 3. State coverage
✓ drawn · n/a (reason) · shared (where) · rule (§9).

| State | Intent | QR | Split | Cash |
|---|---|---|---|---|
| default | ✓ ·1 | ✓ ·1 | ✓ ·1 | ✓ ·1 |
| loading | rule: totals from the tab (already loaded) | rule: creating → primary isPending in intent | rule: list skeleton | n/a |
| empty | rule: total ฿0.00 → ชำระเงิน hidden on the tab | n/a | n/a | n/a |
| error + retry | rule: create failed → Alert in sheet, nothing locked (CD-03 checkout·5 copy) | ✓ ·3 | shared qr·3 per part | rule: call failed → CD-06 call·4 |
| validation | ✓ ·2 (2–10) | n/a | n/a | n/a |
| pending | n/a | ✓ ·1 ·5 ·6 | ✓ ·1 ·2 | n/a |
| success feedback | n/a | ✓ ·2 | ✓ ·4 | ✓ ·1 |
| failure per reason | rule | ✓ ·3 failed · ·4 expired | shared | rule |
| stale / conflict | ✓ ·5 (pending elsewhere, D3) | ✓ ·7 (paid elsewhere) | ✓ ·2 (live progress) | n/a |
| disconnected | n/a | ✓ ·5 | rule: banner, keep last list | n/a |
| permission denied | rule: closed visit → CD-06 cart·6 copy | ← | ← | ← |
| long Thai text | n/a (fixed copy) | n/a | n/a | n/a |
| smallest size | shared (sheet) | ✓ ·8 | ✓ ·5 | n/a |
| keyboard open | n/a (no text input) | n/a | n/a | n/a |
| session expired | as CD-06 (visit-session) | ← | ← | ← |

## 4. Action table
| Action | API (status) | Permission | Success → UI | Failure → UI | Recovery | Data kept | Idempotency |
|---|---|---|---|---|---|---|---|
| Open intent | tab data (CD-06) + current payments (needs API, R4) | session | intent·1; pending exists → ·5 | — | — | — | n/a |
| Create merge QR | `POST` customer payment, `mode: merge` (needs API, R4; rules CD-03) | session | locks bill → qr·1 | `409 PAYMENT_IN_FLIGHT` → intent·5 · network → Alert | retry same key | choice | key per intent open |
| Create split | `POST` customer payment, `mode: split_equal, parts: n` (needs API) | session | split·1 | as merge | as merge | n | key per intent open |
| Pay one part | open the part's existing QR (no claim, Q1) | session | qr·6 | part already paid → qr·7 | back to list | — | n/a |
| Confirm | webhook → WS `payment.status_changed` | — | qr·2 / list updates | failed → qr·3 · expiry (15 min) → qr·4 | สร้าง QR ใหม่ (new key) | — | webhook dedup |
| Change method | cancel own QR (needs API) | session | bill unlocked → intent | part already paid → not allowed (R2) | — | — | repeat → 409 |
| Cash | `POST` call-staff `{reason:'bill'}` (CD-06 R5) | session | cash·1 | network → CD-06 call·4 | retry | — | server throttle |

## 5. e2e script
- **J1** E1 on the T3 tab tap ชำระเงิน → intent sheet, total ฿1,240.00 · choose ชำระรวม · E2 "สร้าง QR ฿1,240.00" → one create with Idempotency-Key → QR ฿1,240.00, "หมดเวลาใน 14:32"; POS panel shows the bill locked · E3 บันทึก QR (download) · simulate webhook → "ชำระแล้ว ฿1,240.00 · 21:14 น." · E4 กลับไปที่ออเดอร์ → tab shows "ชำระครบแล้ว", no ชำระเงิน button, table still open.
- **J2** E1 choose หารเท่ากัน 3 → ถัดไป → split list (part 1 paid) · E2 phone A taps จ่ายส่วนนี้ on คนที่ 2 → QR ฿413.33 "T3 · คนที่ 2/3" · phone B pays part 2 → `payment.status_changed` → phone A shows "ส่วนนี้ชำระแล้ว", no second payment created · E3 back → 2/3, คงเหลือ ฿413.34 · E4 part 3 → QR → webhook → "ทุกคนชำระครบแล้ว".
- **Edge:** open intent while a POS payment is pending → intent·5, only "ดู QR" · QR expires → qr·4 → new QR uses a new key · change method after one split part paid → not offered.

## 6. Strings & sample data
All copy in `Screen.dc.html`. Key strings: **intent** จ่ายอย่างไร? · ยอดรวมทั้งโต๊ะ · ชำระรวม / จ่ายทั้งหมดในครั้งเดียว · หารเท่ากัน / PromptPay คนละ QR · = ฿413.33 ต่อคน · ปัดเศษสตางค์ไว้ที่คนสุดท้าย (฿413.34) · จ่ายเงินสดกับพนักงาน / พนักงานจะมาที่โต๊ะ · สร้าง QR ฿1,240.00 · ถัดไป · เรียกพนักงาน · หารได้ (ไม่รวมค่าบริการเฉพาะคน) · ค่าเปิดขวด ฿300.00 คิดเฉพาะคน (บีม) — ชำระกับพนักงาน ไม่รวมในการหาร · มีการชำระเงินที่กำลังดำเนินการ / ชำระรวม ฿1,240.00 · เริ่มเมื่อ 21:09 น. — เปิด QR เดิมเพื่อจ่ายต่อ ไม่สร้างใหม่ · ดู QR. **qr** ชำระเงิน — T3 · ชำระรวม / หารเท่ากัน · คนที่ 2 จาก 3 · กด บันทึก QR · เปิดแอปธนาคาร → สแกน → เลือกรูปจากคลังภาพ · ระบบยืนยันอัตโนมัติเมื่อธนาคารแจ้งยอดเข้า · บันทึก QR · เปลี่ยนวิธีจ่าย · ชำระแล้ว ฿1,240.00 · 21:14 น. · ขอบคุณ! พนักงานจะดูแลต่อ · สั่งเพิ่มได้ตามปกติ · การชำระเงินไม่สำเร็จ / ยังไม่มีการตัดเงิน — สร้าง QR ใหม่แล้วลองอีกครั้ง · QR หมดเวลา / ยังไม่มียอดเข้า — สร้าง QR ใหม่เพื่อจ่าย · สร้าง QR ใหม่ · กำลังตรวจสอบสถานะ… / การเชื่อมต่อขาด — ถ้าโอนแล้ว ไม่ต้องโอนซ้ำ ระบบจะยืนยันเมื่อกลับมาออนไลน์ · ส่วนนี้ชำระแล้ว / เพื่อนในโต๊ะจ่ายคนที่ 2 แล้วเมื่อ 21:12 น. — ไม่ต้องโอน. **split** หารเท่ากัน · 3 คน · ทุกเครื่องในโต๊ะเห็นรายการเดียวกัน · เลือกส่วนที่ยังไม่จ่าย · ชำระแล้ว n/3 · คงเหลือ · คนที่ n · จ่ายส่วนนี้ · ทุกคนชำระครบแล้ว · เปลี่ยนวิธีจ่าย (เมื่อยังไม่มีใครจ่าย). **cash** แจ้งพนักงานแล้ว · พนักงานจะนำบิลมาที่โต๊ะ T3 · จ่ายเงินสดกับพนักงานได้เลย · กลับไปที่ออเดอร์. **tab after** ชำระครบแล้ว · 21:14 น. · สั่งเพิ่ม (บิลใหม่ของโต๊ะเดิม).
Totals = the T3 bill used in CD-02/03/04/06 (฿1,240.00 → 413.33 / 413.33 / 413.34).

## 7. Layout & tokens
- Phone web 390×844, smallest 360×780. PromptPayPanel qrSize 200 (panel 320 wide) so QR + hint + buttons fit 844 without scrolling.
- Intent = bottom sheet radius `--r-sheet`; option rows `--r-btn`, selected `--accent-soft` + `--line-accent`.
- Split rows min-height 72, progress bar 8 high (`--success` fill).
- Buttons lg 52 at the bottom (thumb reach).

## 8. Components → platform (HeroUI v3 web)
| Part | HeroUI v3 |
|---|---|
| Intent | Drawer (bottom) + RadioGroup + NumberField + Alert |
| QR | DS PromptPayPanel (Card + Chip) + Spinner + Button (download) |
| Payment status | StatusChip kind payment |
| Split list | Card rows + Progress + Button |
| Feedback | Alert · Toast |

## 9. Behaviour rules
- **One attempt at a time (D3):** if any payment is pending for the visit (POS or another phone), intent shows it and only "ดู QR"; never create another.
- **Merge:** create = lock the bill (CD-03); QR lifetime 15 min; expiry = `cancelled` + `status_reason expired`.
- **Split (Q1):** n chosen once by whoever starts; parts = floor(total×100/n)/100, last part takes the remainder; per-person charges excluded and paid with staff (D2); every phone sees the same list; opening a part shows its existing QR; a part paid elsewhere flips live to "ส่วนนี้ชำระแล้ว". Whole bill stays locked until all parts are settled (CD-03 F2).
- **Confirmation:** webhook only; disconnected → banner + poll, "ไม่ต้องโอนซ้ำ".
- **Change method (R2):** merge anytime while pending; split only before the first part is paid.
- **Paid ≠ closed:** after full payment the guest returns to the tab; the table stays open; new orders start a new balance (R5).
- **Same-phone payment (R3):** "บันทึก QR" saves the image; instructions show the gallery path.
- **Standard questions:** Filters / search → n/a. Long and short → 360×780 drawn; amounts tabular. Interaction → DS pressed / disabled / pending. Accessibility → QR image labelled "QR พร้อมเพย์ ฿1,240.00 โต๊ะ T3"; countdown announced politely each minute; status has text. Data → amounts from the API only; client computes the split preview, server recomputes.
- **User-mindset checks:** ✓ one dominant action per screen · ✓ targets / thumb reach · ✓ ack < 1 s · ✓ errors say how to fix · ✓ task cost 3 taps + bank app · ✓ status has text · ☐ walkthrough with a guest.

## 10. Revisions
| Rev | Date | Change | Authority |
|---|---|---|---|
| 0 | 2026-10-09 | Brief: Q1 no claiming · D1 pay-how sheet · D2 per-person charges with staff · D3 pending → existing QR · D4 PDPA / LINE → S2 | Field |
| 1 | 2026-10-11 | First canvas built to `cd-template.md` v2: overview, J1 / J2, intent / qr / split / cash boards, flow; R1–R5 raised (R4 parked with CD-06 session items) | Cowork — review pending |

## 11. Source snapshot
Pending — after Field approves rev 1. Assets: Lucide UMD `/_blob/a526b3bd0f8acf1689edb6a78d043874`; QR placeholder `/_blob/f74631823081a93d4cbeb45f60cd9c30` (copied from CD-03).

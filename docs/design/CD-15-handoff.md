---
id: CD-15
title: POS — orders board + issue resolution (escalated from the staff app)
revision: 3
status: review
approved_by:
approved_on:
canvas: https://claude.ai/artifact/QvCcTKGEBD77NqW4ZarhcL
canvas_version: 1792218938-370c
ds_version: 1791561405-c72e
source: docs/design/source/CD-15/   # taken after approval (§11)
surfaces: [web-pos]
sizes: [1280x800, 1024x768]
brief: CD-15-pos-orders-issues.md
drs: [DR-009, DR-011, DR-012, DR-013, DR-014]
depends_on: [CD-01, CD-02, CD-04, CD-08]
supersedes: brief paste text and acceptance where they conflict (see brief "Revisions")
---

# CD-15 — POS: orders board + issue resolution

Built on The Loft Bar Design System (real DS components; every board has a dark/light Theme tweak). **Do not port canvas markup** — build with HeroUI v3 + tokens. Sample data only. Shared children: `PosFrame` (S1 rail: โต๊ะ · ออเดอร์ · เมนู · รายงาน · ตั้งค่า — ชำระเงิน / แขก hidden, D3), `Board` (state loaded / loading / empty / arrive / disconnected / kitchen / resolved / voided / replaced / voidLast / auto86, `kds` off | on, `ring`, `w` / `h`), `Drawer` (mode detail / issue / afterVoid / lastVoid / blocked / limited), `VoidModal` (CD-02 void-comp, pre-filled; mode prefill / typed / wrongpin / solo), `Order` (CD-04 order screen + `table` + replace banner).

## 0. Review items
Brief D1–D4 apply (§10). Rev-1 items (rev 2 applied R3 / R6 / R7, 17 Oct):

| # | Item | Recommendation |
|---|---|---|
| R1 ✓ | **Pain point.** Root observed (CD-08 R6: no single place everyone sees orders). POS-specific part is an **assumption**: when an item runs out mid-order, staff can't fix it themselves (a void is money), they wait for the manager, and the bill isn't corrected. | Field: confirm or correct. **Confirmed 2026-10-12** (field experience + research — `docs/research/Claude_verified_ops_findings.md`, DR-014). |
| R2 ✓ | **Order number per placement** — the board shows #0045 on both tickets (บาร์ + ครัว) of one placement; `order_record` has no number column. **Parked** with "Order display number per placement" (SESSION_STATE). | — **Answered 2026-10-12 (DR-013):** both tickets share `order_record.order_number` (#0045 · บาร์ / · ครัว). |
| R3 ✓ | **Void reason "ของหมด"** — brief says ของเสีย / ของหมด; CD-02's list has no ของหมด. Add it (first in the list, pre-filled from an issue) so sold-out is reported separately from spoilage; update CD-02 void-comp. | Accept. **Accepted 2026-10-17** (Field). **Applied rev 2** (VoidModal reasons; CD-02 in its own batch). |
| R4 ⏸ | **DS StatusChip** kind order has no `cancelled` (DR-012) and `accepted` still reads "กำลังทำ" (DR-012 A1 = "กำลังเตรียม"). Drawn with `label` overrides + Badge "ยกเลิกทั้งใบ". **Parked** with the DS label item. | — |
| R5 ✓ | **Needs API (BRIEF-012 / 013):** `GET /orders?status=` with `escalated` + issue (reason, item, note, reporter) · `POST /orders/:id/resolve` · item void + manager PIN check (CD-02 R5) · `409 PAYMENT_IN_FLIGHT` on void (BRIEF-013) · ticket auto-`cancelled` when every item is void. | Add to BRIEF-012 / 013. **Accepted 2026-10-17** (Field). |
| R6 ✓ | **1024×768:** four 260-wide columns overflow; "มีปัญหา" ends off-screen (horizontal scroll, as the brief says). Alternative: when issues exist, show them as a warning strip above three columns so they're never out of sight. | Field: keep scroll or take the strip. **Decided 2026-10-17** (Field): warning strip above three columns when issues exist (no horizontal scroll). **Applied rev 2** — board·2 (1024×768, kitchen screen on). |
| R7 ✓ | **DR-014 impact (canvas update):** READY column only when the kitchen screen is on (#1) · sold-out auto-cancel shows as cancelled items, not an issue (#3). | Field approved DR-014 2026-10-12. **Applied rev 2:** `Board kds` off (S1 default) = 3 columns ใหม่ → กำลังเตรียม → เสิร์ฟแล้ว (board·1, all journeys); board·4 = kitchen screen on, 4 columns; board-states·5 = 86 auto-cancel. |
| Q1 ✓ | **New in rev 2 — R6 × DR-014:** at 1024×768 with the kitchen screen **off** (S1 default) only 3 columns remain (ใหม่ · กำลังเตรียม · มีปัญหา) and they fit (3 × 260 + gaps < 888). Keep the issue column there, or use the R6 strip at 1024 for both modes? **Not drawn** — needs Field. | Cowork: keep the column (R6 solved an overflow that no longer exists in S1); strip only when 4 columns. **Decided 2026-10-17 (Field):** kitchen off → keep มีปัญหา (3 columns fit at 1024); the strip applies only to the 4-column kitchen-on layout. Drawn as such. |
| R8 ✓ | **DR-013 single ticket (redraw pass).** | **Decided 2026-10-17 (Field), applied rev 3:** kitchen off = one ticket per order (+ charge ticket), no บาร์ / ครัว badge, no station filter (#0045 = one card with drinks + fries; drawer, void modal, banner, toasts without station). The 2-ticket version is a kitchen-on state only (board·2–4). Kitchen on without a kitchen display: staff mark READY from the staff app / POS (Field, CD-13 Q1). |

## 1. Overview
- **Goal:** the POS sees every open ticket of the shift by status, can drive the status itself (bars without phones), and resolves issues the staff app escalated — continue, void, or replace.
- **Pain point:** see R1.
- **User + context:** manager / cashier at the POS tablet · Friday 22:00, tickets arriving continuously, the kitchen reports a sold-out item through the staff app and needs a decision in seconds.
- **Entry → exit:** rail "ออเดอร์" (Badge = new tickets) · notification "ส่งให้ POS". Exit: ไปที่โต๊ะ → CD-02 panel · เปลี่ยนรายการ → CD-04 order entry.
- **Outcome:** every issue has an owner; continue = 2 taps; replace = 5 taps (issue → เปลี่ยนรายการ → PIN + confirm → tap item → send); voids always follow CD-02 rules; the bill stays correct.
- **Out of scope:** kitchen display (S2), payments list, guests, printing tickets, staff app screens.
- **Journeys:** J1 #0040 ยำหมูยอ sold out → เปลี่ยนรายการ → void with PIN → order ถั่วทอดสมุนไพร for T2 → new ticket #0047 (E1–E5) · J2 kitchen finds stock → ทำต่อ → กำลังเตรียม (E1–E2).

## 2. Boards
| Board | Type | States |
|---|---|---|
| `overview` | OVERVIEW | goal, pain point, user/context, outcome, entry/exit, journeys, out of scope, key decisions |
| `journey-1` | JOURNEY | board (E1 จัดการปัญหา #0040) → issue drawer (E2 เปลี่ยนรายการ) → void modal pre-filled + PIN (E3 ยืนยัน) → order T2 with banner (E4 ถั่วทอด, E5 ส่ง) → board: #0040 กำลังเตรียม + #0047 new |
| `journey-2` | JOURNEY | board (E1) → issue drawer (E2 ทำต่อ) → board: #0040 กำลังเตรียม |
| `board` | STATES | 1 1280 kitchen screen off (S1) · 2 1024×768 kitchen screen on + issue strip (R6) · 3 filter ครัว · 4 1280 kitchen screen on (4 columns) |
| `board-states` | STATES | 1 loading · 2 empty columns · 3 new order arrives · 4 disconnected · 5 menu sold out (86) → waiting item auto-cancelled (DR-014 #3) |
| `issue` | STATES | 1 open · 2 payment in flight · 3 no void permission · 4 after void · 5 last item void → cancelled |
| `detail` | STATES | 1 new ticket detail |
| `void` | STATES | 1 pre-filled · 2 wrong PIN · 3 no manager → self-approve |
| `replace` | STATES | 1 order T2 + banner, empty · 2 item chosen |
| `flow` | FLOW MAP | issue from staff app · drive status at POS · sold out (86) · errors |

## 3. State coverage
✓ drawn · n/a (reason) · shared (where) · rule (§9).

| State | Board | Drawer (detail / issue) | Void | Replace |
|---|---|---|---|---|
| default | ✓ board·1 | ✓ detail·1 · issue·1 | ✓ ·1 | ✓ ·1 |
| loading | ✓ states·1 | rule: Skeleton rows | n/a | shared CD-04 |
| empty | ✓ states·2 (per column) | n/a | n/a | ✓ ·1 (empty cart) |
| error + retry | rule: load failed → Alert + ลองอีกครั้ง (CD-02 grid-states·3 pattern) | rule | shared CD-02 | shared CD-04 send·4 |
| validation | n/a | n/a | ✓ ·2 (PIN) · reason required | shared CD-04 |
| pending | rule: action button isPending | rule | rule: confirm isPending | shared CD-04 |
| success feedback | ✓ J1·5, J2·3 Toast | ✓ issue·4 ·5 | → issue·4 | ✓ J1·5 |
| failure per reason | rule: 409 already changed → latest + Toast (CD-08 R14) | ✓ issue·2 (409 payment) | ✓ ·2 · ·3 | shared CD-04 conflicts |
| stale / conflict | ✓ states·3 (realtime) | rule: ticket changed on another device → drawer refreshes | rule | shared CD-04 |
| disconnected | ✓ states·4 | shared banner | n/a | shared CD-04 |
| permission denied | rule: no `orders:update` → action buttons hidden | ✓ issue·3 | n/a (entry hidden) | rule: no `orders:create` → เปลี่ยนรายการ hidden |
| long Thai text | rule: card items clamp 1 line, max 4 + "+ n รายการ" (board·1 #0039) | rule: wraps | n/a | shared CD-04 order·2 |
| smallest size | ✓ board·2 (R6, kitchen screen on) · kitchen screen off = Q1 | shared (400 fixed) | shared (420) | shared CD-04 order·2 |
| keyboard open | n/a (POS) | n/a | rule: on-screen keypad for PIN | n/a |
| session expired | global: 401 → CD-01 login | ← | ← | ← |

## 4. Action table
| Action | API (status) | Permission | Success → UI | Failure → UI | Recovery | Data kept | Idempotency |
|---|---|---|---|---|---|---|---|
| Load board | `GET /orders?status=open` (planned BRIEF-012; + escalated / issue — R5) | `orders:read` | board·1 | network → Alert + retry | ลองอีกครั้ง | — | n/a |
| Live updates | WS `pos` `order.created`, `order.status_changed` (planned BRIEF-012) | `orders:read` | card moves / new card highlighted, rail Badge | socket down → states·4 | refetch | — | upsert by ticket id |
| Accept / ready / served | `POST /orders/:id/accept|ready|send` (planned; `ready` only when `venue.kitchen_display_enabled`, DR-014 #1) | `orders:update` | card moves column | 409 → latest + Toast "เอ รับออเดอร์ #0041 แล้ว" (CD-08 R14) | — | — | state-guarded (only from expected status) |
| Resolve (ทำต่อ) | `POST /orders/:id/resolve` (planned, R5) | `orders:update` | → กำลังเตรียม, Toast | 409 → refresh | — | — | state-guarded |
| Void problem item | `POST /order-items/:id/cancel` + reason + PIN (planned; PIN check needs API — CD-02 R5) | `orders:void` | item struck; ticket → กำลังเตรียม, or `cancelled` if last item | wrong PIN → void·2 · `409 PAYMENT_IN_FLIGHT` → issue·2 · no manager → self-approve flagged (void·3) | re-enter / cancel QR first | modal input | one call per item; repeat → 409 |
| Replace | void (above) → CD-04 `POST /visits/:id/orders` | `orders:void` + `orders:create` | new ticket (new placement) | as void / as CD-04 | — | — | CD-04 Idempotency-Key |
| Sold out (86) on a waiting item | system, on menu sold-out (CD-04 / CD-12; planned BRIEF-012) | — | item struck + "ยำหมูยอ ยกเลิกอัตโนมัติ · ของหมด" on the card, Toast warning "แจ้งลูกค้าโต๊ะ T6" (board-states·5) | — | — | — | server-side, once per item |
| Go to table | → CD-02 panel | `visits:read` | — | — | — | — | — |

## 5. e2e script
- **J1** E1 on the board tap "จัดการปัญหา" on #0040 (T2 · ครัว, escalated, "ยำหมูยอ · ของหมด") → issue drawer, ยำหมูยอ highlighted · E2 "เปลี่ยนรายการ" → void modal: ยำหมูยอ selected, type ยกเลิก, reason ของหมด · type PIN · E3 ยืนยันการยกเลิก → one `cancel` call with reason + PIN → order entry for T2 with banner "สั่งแทนรายการที่ยกเลิก: ยำหมูยอ" · E4 tap ถั่วทอดสมุนไพร (quick add) · E5 ส่งออเดอร์ → `201` → board: #0040 in กำลังเตรียม with ยำหมูยอ struck, new #0047 T2 ครัว in ใหม่, rail Badge 4, Toast "ส่งออเดอร์ T2 แล้ว · 1 รายการ".
- **J2** E1 จัดการปัญหา on #0040 · E2 ทำต่อ → `resolve` → #0040 in กำลังเตรียม, มีปัญหา column empty, Toast; staff app shows the new status.
- **Edge:** void while T2 has a pending payment → 409 → issue·2, nothing changed · void the only item of a ticket → ticket `cancelled`, leaves the board · two devices press รับออเดอร์ → second gets 409 + latest status.

## 6. Strings & sample data
Copy and sample data live in `Board` / `Drawer` / `VoidModal` / `Order` `renderVals()` and markup. Key strings: ออเดอร์ · ใหม่ n · กำลังเตรียม n · พร้อมเสิร์ฟ n · มีปัญหา n · ทั้งหมด / เฉพาะบาร์ / เฉพาะครัว · บาร์ / ครัว · ส่งมาจากแอปพนักงาน · ยำหมูยอ · ของหมด · กำลังเตรียม · {name} · รับออเดอร์ · พร้อมแล้ว · เสิร์ฟแล้ว · จัดการปัญหา · + n รายการ · ไม่มีออเดอร์ · มีปัญหา (strip) · {seat} · {station} — {issue} · ส่งมาจากแอปพนักงาน · ยำหมูยอ ยกเลิกอัตโนมัติ · ของหมด · Toast ยำหมูยอ หมด — ยกเลิกอัตโนมัติ 1 รายการ / #0049 · ครัว · แจ้งลูกค้าโต๊ะ T6 · การเชื่อมต่อขาด ข้อมูลอาจไม่อัปเดต / กำลังเชื่อมต่อใหม่ — กดปุ่มสถานะได้ ระบบจะตรวจสถานะล่าสุดก่อนเปลี่ยน · Toast ออเดอร์ใหม่ T5 · บาร์. **Drawer** ไปที่โต๊ะ {seat} · มีปัญหากับออเดอร์นี้ · ยำหมูยอ · ของหมด / รายงานโดย ต้น (แอปพนักงาน) 21:02 น. · หมายเหตุ: วัตถุดิบหมูยอหมด · มีปัญหา · รวมใบนี้ · ทำต่อ · ยกเลิกรายการที่มีปัญหา · เปลี่ยนรายการ · มีการชำระเงินค้างอยู่ — ยกเลิก QR ก่อน / โต๊ะ T2 กำลังรอชำระ ฿1,980.00 · ยกเลิกรายการได้หลังยกเลิก QR ที่หน้าชำระเงิน · ยกเลิก / เปลี่ยนรายการ ต้องใช้สิทธิ์ผู้จัดการ — เรียกผู้จัดการ หรือกด ทำต่อ · ยกเลิกทั้งใบ · ใบนี้ไม่มีรายการเหลือ — ออกจากบอร์ดแล้ว ไม่นับในยอดโต๊ะ · สั่งแทนให้โต๊ะ T5 · Toast ยกเลิก ยำหมูยอ แล้ว. **Void** ยกเลิกรายการ / Comp · #0040 · T2 · ครัว — เติมจาก "จัดการปัญหา": ยำหมูยอ · ของหมด · reasons ของหมด · สั่งผิด · ลูกค้าเปลี่ยนใจ · ของเสีย · บริการพิเศษ · อื่นๆ (rest = CD-02). **Replace** สั่งแทนรายการที่ยกเลิก: ยำหมูยอ / #0040 · ครัว ยกเลิกแล้ว (ของหมด) — รายการที่เพิ่มตรงนี้ส่งเป็นใบใหม่ของโต๊ะ T2.
#0040 is the same ticket as CD-08 J2 (T2 · ครัว · ยำหมูยอ + ถั่วทอดสมุนไพร).

## 7. Layout & tokens
- 1280×800 content 1192×744; smallest 1024×768 (R6). Page padding 20 / 24; title 26/700; summary StatusChips md.
- Columns `repeat(n, minmax(260px, 1fr))` — n = 3 kitchen screen off (ใหม่ · กำลังเตรียม · มีปัญหา), 4 on; at 1024×768 with 4 columns the issue column becomes a strip above the grid (R6: `--status-void-bg` / `-border`, one row per issue ticket, primary "จัดการปัญหา" md) — gap 12, `--bg-sunken` well with hairline; issue column border `--status-void-border` when non-empty.
- Card padding 12, `--r-card`; number 17/700 tabular; station Badge neutral; items max 4 lines + "+ n รายการ"; one full-width action Button md 44 (ใหม่ = primary).
- Drawer 400 (CD-02 pattern); void modal 420 (CD-02); toasts top-right max 380.

## 8. Components → platform (HeroUI v3)
| Part | HeroUI v3 |
|---|---|
| Summary / ticket status | StatusChip kind order (label override, R4) |
| Station filter | Tabs or Chip group (single select) |
| Column | custom section; ScrollShadow for scroll |
| Ticket card | Card + Badge + Button |
| Escalated / issue | Badge warning + void-tone strip |
| Drawer | Drawer placement right 400 |
| Void | CD-02 Modal (RadioGroup, Select, Input PIN, Alert) |
| Replace | CD-04 order screen + Alert info banner |
| Feedback | Alert · Toast · Skeleton |

## 9. Behaviour rules
- **Board (D1, D4, DR-013):** live tickets of the shift; kitchen screen off (S1 default) = one card per order, no station badge or filter; kitchen screen on = one card per station ticket, a placement with drinks + food = two cards sharing the number (R2) + station filter; charge-only tickets never appear; oldest first within a column; counter seats go กำลังเตรียม → เสิร์ฟแล้ว (DR-011); with the kitchen screen off (`venue.kitchen_display_enabled = false`, S1 default) **every** seat does, and the พร้อมเสิร์ฟ column + summary chip are hidden (DR-014 #1).
- **Sold out (DR-014 #3):** when a menu item is set sold out, items of it still waiting are auto-cancelled (`cancel_reason` ของหมด, by system) → struck on the card with "ยกเลิกอัตโนมัติ · ของหมด" + Toast "แจ้งลูกค้าโต๊ะ …"; never an issue. Issues stay for problems staff report themselves (J1 / J2).
- **Status actions:** same as the staff app, guarded by current status (409 → latest).
- **Issue (D2):** ทำต่อ = resolve → กำลังเตรียม. ยกเลิกรายการที่มีปัญหา = CD-02 void-comp pre-filled (item, ยกเลิก, ของหมด). เปลี่ยนรายการ = the same void, then CD-04 order entry for that table with a banner; the new item is a new ticket. No substitution model.
- **Void rules (CD-02):** reason required, manager PIN, or self-approve flagged when no manager on shift; blocked while a payment is pending (409 → cancel QR first). Last item voided → ticket `cancelled`, leaves the board, excluded from totals.
- **Permissions:** no `orders:void` → void / replace hidden with "ต้องใช้สิทธิ์ผู้จัดการ"; ทำต่อ stays.
- **Realtime:** new ticket highlighted + rail Badge; disconnected → banner, actions still allowed (server guards).
- **Standard questions:** Filters → station single select (ทั้งหมด default); summary counts follow the filter. Search → n/a. Long and short → 1024 drawn with the R6 strip (kitchen screen on; off = Q1); items clamp at 4. Interaction → DS pressed / pending; no hover reliance. Accessibility → each column is a labelled region; card action button names include number + table ("รับออเดอร์ #0045 T3 บาร์"). Data → from `GET /orders`; missing guest label → seat only.
- **User-mindset checks:** ✓ one dominant action per card / drawer · ✓ targets 44 · ✓ ack < 1 s · ✓ loss confirmed (void modal) · ✓ errors say how to fix · ✓ task cost stated · ✓ status has text · ☐ walkthrough with staff.

## 10. Revisions
| Rev | Date | Change | Authority |
|---|---|---|---|
| 0 | 2026-10-09 | Brief D1–D3 | Field |
| 0 | 2026-10-10 | D4 station tickets (DR-012) | Field |
| 1 | 2026-10-11 | First canvas built to `cd-template.md` v2: overview, J1 / J2, board / states / issue / detail / void / replace boards, flow; R1–R6 raised (R2, R4 parked) | Cowork — review pending |
| 2 | 2026-10-17 | Housekeeping: R6 issue strip at 1024 (board·2) · R7 DR-014 #1 kitchen-screen-off default = 3 columns (board·1, journeys, drawer after-void → เสิร์ฟแล้ว) + board·4 kitchen screen on · DR-014 #3 auto-cancel (board-states·5, flow lane) · R3 confirmed in VoidModal · stickies R1/R2/R3/R5/R6/R7 green · Q1 raised | Field decisions 12 + 17 Oct · Cowork drew |
| 3 | 2026-10-17 | DR-013 pass: kitchen off = single ticket (Board `kdsSplit`, Drawer / VoidModal / Order banner / toasts without station; filter only kitchen-on) · Q1 decided (column kept when kitchen off) · VoidModal PIN copy = manager's own 4-digit POS PIN, same as DR-014 #8 (Decided 2026-10-17 (Field), CD-02 Q1) | Field 17 Oct · Cowork drew |

## 11. Source snapshot
Pending — after Field approves rev 1. Lucide UMD `/_blob/661e8b249c393204378c95d0a1961593`.

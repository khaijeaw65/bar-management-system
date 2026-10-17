---
id: CD-02
title: POS — table grid, session panel, open / close table
revision: 4
status: review            # rev 1 approved 2026-09-28 (F1–F4, Q1–Q3); rev 2 = CD template retrofit; rev 3 = DR-014 + CD-15 R3 housekeeping
approved_by: Field        # rev 1
approved_on: 2026-09-28   # rev 1
canvas: https://claude.ai/artifact/WEfv8fV7z1FMAu8tFSqCRG
canvas_version: 1792218930-b067
ds_version: 1791561405-c72e
source: docs/design/source/CD-02/   # taken after rev 2 approval (§11)
surfaces: [web-pos]
sizes: [1280x800, 1024x768]
brief: CD-02-pos-tables-session.md
drs: [DR-009, DR-012, DR-013, DR-014]
depends_on: [CD-00, CD-01, CD-03, CD-04, CD-15]
supersedes: brief paste text and acceptance where they conflict (see brief "Revisions")
---

# CD-02 — POS: table grid, session panel, open / close table

Built on The Loft Bar Design System (real DS components; every board has a dark/light Theme tweak). **Do not port canvas markup** — build with HeroUI v3 + tokens (`docs/rules/frontend.md`, BRIEF-014 utilities). Sample data only. Template: `cd-template.md` · boards: `board-convention.md`. Shared children on the canvas: `PosFrame` (rail + top bar), `Grid` (props mode / disconnected / calling / selected / t3 / t5 / t6 / c3 / ring / longNames), `Panel` (modes active / open / loading / blocked / idle / limited / joined).

## 0. Review items
Rev 1 decisions F1–F4, Q1–Q3 stay (§10). Rev-2 items (✓ = accepted; rev 3 applied R6 + CD-15 R3, 17 Oct):

| # | Item | Recommendation |
|---|---|---|
| R1 ✓ | **Pain point.** Root observed at both bars (CD-14 R8: paper / verbal orders, no single place everyone sees). The POS-specific part is an **assumption**: the cashier doesn't know which tables are open, how much each owes, or opens a seat that already has guests. | Field: confirm or correct from the field visits. **Confirmed 2026-10-12** (field experience + research — `docs/research/Claude_verified_ops_findings.md`, DR-014). |
| R2 ✓ | **Open collision asks before joining** (Field 2026-10-10, BRIEF-011 Q3): `POST /visits` → `200 attached:true` shows a dialog with opener (staff name or "ลูกค้า (สแกน QR)" from `openedVia`), time and guest label; "เข้าโต๊ะเดิม (…)" opens that seat's panel, "เลือกโต๊ะอื่น" returns to the form with the seat cleared. Replaces rev 1's silent "เข้าร่วมโต๊ะเดิมแล้ว" info. Same rule as CD-14 J2. | Done (open-table·4, J2). |
| R3 ✓ | **DR-012 in the panel:** one order group = one station ticket with a station label (บาร์ / ครัว); item rows carry no progress chip, only "ยกเลิก" (struck); ticket chip `accepted` = "กำลังเตรียม · ชื่อ". | Done (panel). |
| R4 ✓ | **New states:** panel without `orders:void` / `visits:close` (buttons hidden, "ต้องใช้สิทธิ์ผู้จัดการ" — panel·6) · grid at the smallest size 1024×768 with long guest names (grid·2) · without `visits:open` the "+ เปิดโต๊ะ" button is hidden and free cards are not tappable (rule only, same pattern as CD-14 seat-sheet·3). | Accept. **Accepted 2026-10-12** (Field). |
| R5 ✓ | **Needs API** (not in any brief): comp an item (catalog has only `POST /order-items/:id/cancel`), manager PIN check for void / comp, acknowledge call-staff ("รับทราบ", shared with CD-08 R10-2). | Add to BRIEF-012 (void + comp + PIN) and the customer-QR brief (ack). **Accepted 2026-10-12** (Field). |
| R6 ✓ | **DR-014 impact (canvas update):** idle = warning only, no auto-close (#2) · counter seats opened by staff, counter QR optional (#5) · POS staff switch with 4-digit PIN — every action attributed to the person (#8). | Field approved DR-014 2026-10-12. **Applied rev 3:** #2 idle Alert "…— ระบบไม่ปิดโต๊ะเอง" (panel·5) · #5 open-table·7 counter C3 success = no QR step, Toast + card open · #8 the PIN switch UI belongs to the shell (CD-01, not in this pass); CD-02 already attributes items ("สั่งโดย …", ticket chip "กำลังเตรียม · บีม"). |
| R7 ✓ | **CD-15 R3 — void reason "ของหมด"** first in the void-comp reason list (sold-out reported apart from spoilage). | **Accepted 2026-10-17** (Field). Applied rev 3 (void-comp). |
| R8 ✓ | **CD-04 R6 — "สั่งแทนลูกค้า" in the panel meta row** when the table already has orders (Button secondary sm, hidden without `orders:create`). | **Accepted 2026-10-12** (Field, via CD-04 R6). Applied rev 3 (Panel, all modes with orders). |
| Q1 ✓ | **New in rev 3 — PIN length:** DR-014 #8 says the staff-switch PIN is 4 digits; void-comp still draws "PIN ผู้จัดการ · 4–6 หลัก". Is manager approval the same 4-digit PIN? **Not changed** — needs Field. | Cowork: yes, one 4-digit PIN per person (switch + approval), fewer things to remember. **Decided 2026-10-17 (Field):** void / comp approval = the manager's own 4-digit POS PIN (same PIN as DR-014 #8). Applied rev 4 (void-comp "PIN 4 หลักของผู้จัดการ — ตัวเดียวกับที่ใช้สลับคนที่ POS"). |
| R9 ✓ | **DR-013 single ticket (redraw pass).** | **Decided 2026-10-17 (Field), applied rev 4:** panel groups = one ticket per order when the kitchen screen is off (19:02 drinks + fries = one group), no บาร์ / ครัว label; split + labels only with the kitchen screen on. |

## 1. Overview
- **Goal:** the cashier sees every seat on one screen (free, open, owing, calling) — opens a table in 2 taps and can only close it when it is paid.
- **Pain point:** see R1 (root = field research; POS-specific part = assumption).
- **User + context:** cashier / manager at the POS tablet · Friday 22:00, full bar, standing, touch only, several groups arriving and leaving at once.
- **Entry → exit:** rail "โต๊ะ" = POS home `/pos/tables`. Exit: ชำระเงิน → CD-03 · สั่งแทนลูกค้า → CD-04 · order issues → CD-15.
- **Outcome:** open a table in 2 taps (free card → เปิดโต๊ะ; assumes a guest name is optional); a collision never creates a second visit or joins silently; a table with a payment in flight or a balance cannot be closed.
- **Out of scope:** move / merge tables, reservations, per-item split, offline, member QR, printed receipts, LINE OA.
- **Journeys:** J1 walk-in: tap free T6 → เปิดโต๊ะ (guest แพร) → QR → T6 open (E1–E3) · J2 collision: + เปิดโต๊ะ → T5 → `200 attached` → ask → เข้าโต๊ะเดิม → T5 panel (E1–E3, alternate เลือกโต๊ะอื่น).

## 2. Boards
| Board | Type | States |
|---|---|---|
| `overview` | OVERVIEW | goal, pain point (R1), user/context, outcome, entry/exit, journeys, out of scope, key decisions |
| `journey-1` | JOURNEY | grid (E1 T6) → open-table form T6 + แพร (E2 เปิดโต๊ะ) → QR (E3 เสร็จสิ้น) → grid T6 เปิดแล้ว |
| `journey-2` | JOURNEY | grid T5 looks free (E1 + เปิดโต๊ะ) → form T5 (E2) → ask dialog (E3 เข้าโต๊ะเดิม; alt เลือกโต๊ะอื่น) → T5 panel "เข้าโต๊ะเดิมแล้ว" |
| `grid` | STATES | 1 1280 T3 selected · 2 1024×768 + long guest names |
| `grid-states` | STATES | 1 loading · 2 empty · 3 error + retry · 4 disconnected |
| `panel` | STATES | 1 active (4 tickets) · 2 open, no orders · 3 loading · 4 close blocked (409) · 5 idle 25 min · 6 no void / close permission · 7 joined (after J2) |
| `open-table` | STATES | 1 from "+ เปิดโต๊ะ" (Select open, free seats only) · 2 from a free card (preselected) · 3 submitting · 4 collision → ask before joining · 5 error · 6 success QR (table) · 7 success counter seat, counter QR off → no QR, Toast (DR-014 #5) |
| `close-confirm` | STATES | fully paid · remaining → ไปชำระเงิน · closed Toast |
| `void-comp` | STATES | default · wrong PIN · no manager on shift (self-approve, flagged) — reasons start with ของหมด (R7) |
| `qr-actions` | STATES | menu · regenerate confirm · reprint preview |
| `realtime` | STATES | `visit.opened` from QR · `staff.called` sticky Toast |
| `flow` | FLOW MAP | grid ↔ open-table ↔ panel ↔ close / pay / void |
Shared (not boards to review): `PosFrame`, `Grid`, `Panel`.

## 3. State coverage
✓ drawn · n/a (reason) · shared (where) · rule (§9, not drawn).

| State | Grid | Panel | Open-table | Close-confirm | Void-comp | QR actions |
|---|---|---|---|---|---|---|
| default | ✓ grid·1 | ✓ ·1 | ✓ ·1 ·2 | ✓ paid | ✓ default | ✓ menu |
| loading | ✓ grid-states·1 | ✓ ·3 | n/a (seats from grid) | n/a (from panel) | n/a | n/a |
| empty | ✓ grid-states·2 | ✓ ·2 no orders | rule: no free seat → Select shows "ไม่มีโต๊ะว่าง", เปิดโต๊ะ disabled | n/a | n/a | n/a |
| error + retry | ✓ grid-states·3 | shared grid-states·3 pattern | ✓ ·5 | shared open-table·5 pattern | shared | shared |
| validation | n/a | n/a | ✓ ·1 (no seat → disabled) | n/a | ✓ wrong PIN · reason required | n/a |
| pending | n/a | ✓ ·4 (pay pending) | ✓ ·3 | rule: primary isPending | rule | rule |
| success feedback | ✓ realtime / J1·4 | ✓ ·7 | ✓ ·6 QR · ·7 counter Toast | ✓ Toast "ปิดโต๊ะ T3 แล้ว" | rule: item struck + Toast | rule |
| failure per reason | ✓ grid-states·3 | ✓ ·4 (409 PAYMENT_IN_FLIGHT) | ✓ ·4 (attached) ·5 | ✓ remaining | ✓ wrong PIN / no manager | rule |
| stale / conflict | realtime (F3) | ✓ ·7 | ✓ ·4 | ✓ remaining (re-read on open) | rule: item already cancelled → refetch | n/a |
| disconnected | ✓ grid-states·4 | shared grid banner | n/a | n/a | n/a | n/a |
| permission denied | rule (no `visits:open`, R4) | ✓ ·6 | rule (entry hidden) | ✓ ·6 (hidden) | ✓ ·6 (hidden) | rule: no `tables:manage` → "สร้าง QR ใหม่" hidden |
| long Thai text | ✓ grid·2 | rule: names wrap, meta 1 line | n/a (short labels) | n/a | rule: item names wrap | n/a |
| smallest size | ✓ grid·2 (1024×768) | shared (drawer fixed 400, body scrolls) | n/a (modal 420) | n/a | n/a | n/a |
| keyboard open | n/a (tablet, hardware-less: on-screen keyboard covers lower half — modal stays centered above it, rule) | n/a | rule | n/a | rule | n/a |
| session expired | global: 401 → CD-01 login | ← | ← | ← | ← | ← |

## 4. Action table
| Action | API (status) | Permission | Success → UI | Failure → UI | Recovery | Data kept | Idempotency |
|---|---|---|---|---|---|---|---|
| Load grid | `GET /tables` (available, BRIEF-011; `total` / `itemCount` filled by BRIEF-012, `staffCalled` by customer-QR brief) | `tables:read` | grid·1 | network → grid-states·3 · socket down → ·4 | ลองอีกครั้ง; reconnect + refetch | — | n/a |
| Live seats | WS `/staff` room `pos`: `visit.opened`, `visit.state_changed` (BRIEF-011); `order.created` (BRIEF-012); `staff.called` (customer-QR brief) | `tables:read` | card changes in place (F3), Toasts (realtime) | socket down → banner | refetch on reconnect | — | upsert by seat id |
| Open table | `POST /visits {tableSeatId, guestLabel?, via:'pos'}` (available, BRIEF-011) | `visits:open` | `201 attached:false` → QR (open-table·6); counter seat with counter QR off → Toast "เปิด C3 แล้ว", no QR (open-table·7, DR-014 #5) | `200 attached:true` + `openedBy`, `openedVia` → ask (open-table·4, R2) · network → ·5 · 403 → entry hidden (R4) | เข้าโต๊ะเดิม → panel · เลือกโต๊ะอื่น → form | guest name | not needed: attach returns the live visit, creates nothing |
| Open panel | `GET /visits/:id` (available header, BRIEF-011; orders / totals BRIEF-012, payments BRIEF-013) | `visits:read` | panel·1 / ·2 | network → panel error (grid-states·3 pattern) | retry | — | n/a |
| Close table | `POST /visits/:id/close` (available, BRIEF-011; `409 PAYMENT_IN_FLIGHT` added by BRIEF-013) | `visits:close` | close-confirm → Toast, card free | remaining > 0 → close-confirm "ไปชำระเงิน" · `409 PAYMENT_IN_FLIGHT` → panel·4 · `409 INVALID_STATE_TRANSITION` (already closed) → refetch | pay first / wait | — | second close → 409, UI refetches |
| Void item | `POST /order-items/:id/cancel` (planned BRIEF-012) | `orders:void` + manager PIN | item struck + reason; ticket `cancelled` if it was the last item (DR-012) | wrong PIN → void-comp·2 · no manager → self-approve flagged (void-comp·3) | re-enter PIN | modal input | one call per item; repeat → 409 refetch |
| Comp item | **needs API** (R5) | `orders:void` + PIN | item ฿0, "Comp" note | as void | as void | — | — |
| Verify manager PIN | **needs API** (R5) | — | — | wrong PIN → void-comp·2 | — | — | — |
| Pay | → CD-03 (`POST /visits/:visitId/payments`, planned BRIEF-013) | `payments:create` | — | — | — | — | Idempotency-Key (CD-03) |
| Order for guest | → CD-04 | `orders:create` | — | — | — | — | — |
| Regenerate QR | `POST /tables/:id/qr/regenerate` (available, BRIEF-011) | `tables:manage` | new QR shown, old invalid | network → Alert, old QR still valid | retry | — | each call = new token (confirm dialog guards it) |
| Reprint QR | client only (same token) | `tables:read` | print preview | — | — | — | — |
| Acknowledge call-staff | **needs API** (R5; CD-08 R10-2) | — | Toast closes, card normal | — | — | — | — |

## 5. e2e script
- **J1** E1 tap free T6 → open-table form with T6 preselected · type guest "แพร" · E2 tap เปิดโต๊ะ → one `POST /visits {tableSeatId:T6, guestLabel:'แพร', via:'pos'}` → `201 attached:false` → QR modal "เปิดโต๊ะ T6 แล้ว" · E3 tap เสร็จสิ้น → grid, T6 card "เปิดแล้ว" selected.
- **J2** E1 tap "+ เปิดโต๊ะ" → form, Select lists free seats · choose T5, guest "แพร" · E2 tap เปิดโต๊ะ → `200 attached:true`, `openedVia:'qr'` → ask dialog shows "ลูกค้า (สแกน QR)", time, guest "ฝน"; QR modal NOT shown · E3 tap "เข้าโต๊ะเดิม (ฝน)" → T5 panel with info "เข้าโต๊ะเดิมแล้ว"; exactly one visit for T5 · alt: "เลือกโต๊ะอื่น" → form, seat cleared, T5 shown seated.
- **Edge:** close with remaining → "ไปชำระเงิน", no close call · close during payment → 409 → panel·4 · void last item of a ticket → ticket disappears from the panel's active groups (cancelled).

## 6. Strings & sample data
Sample data lives in `Grid` / `Panel` `renderVals()` and the board files. New in rev 2 (**bold**): **"T5 เพิ่งถูกเปิดไปแล้ว" · เปิดโดย / เวลา / แขก · "ลูกค้า (สแกน QR)" · "ถ้าเป็นลูกค้ากลุ่มเดียวกัน ออเดอร์จะเข้าบิลเดียวกัน — ถ้าเป็นคนละกลุ่ม ให้เลือกโต๊ะอื่น" · "เข้าโต๊ะเดิม (ฝน)" · "เลือกโต๊ะอื่น" · Alert "เข้าโต๊ะเดิมแล้ว" / "เปิดโดยลูกค้า (QR) 21:12 น. · แขก ฝน — ออเดอร์จะเข้าบิลเดียวกัน" · "ยกเลิกรายการ / Comp และปิดโต๊ะ ต้องใช้สิทธิ์ผู้จัดการ" · station labels "บาร์" / "ครัว" · ticket chip "กำลังเตรียม · บีม"**. Rev-1 strings (still valid except where DR-012 / R2 changed them):

### Shared chrome (CD-01 shell)
PosRail 88 px (โต๊ะ active, ออเดอร์ Badge 3) · TopBar 56 px: "THE LOFT BAR · เดอะ ลอฟท์ บาร์" · Chip "กะเปิด 18:00 · Beam (Manager)" (**now `nowrap`** — CD-01 changed too) · clock "HH:MM น." · NotificationBell items "T2 เรียกพนักงาน · เมื่อกี้", "ออเดอร์ใหม่ T3 · โอลด์แฟชั่น · สิงห์ดราฟต์ 2× · 3 นาทีที่แล้ว" · theme "ธีมสว่าง / ธีมมืด" · avatar "Beam".

### CD-02/grid (1280) · CD-02/grid · 1024 — loaded, T3 selected
| String | Element |
|---|---|
| โต๊ะ | page title |
| ใช้งาน 6 | summary Chip neutral outline + dot (= open + active + idle; no enum) |
| ว่าง 8 | summary StatusChip free |
| เรียกพนักงาน 1 | summary StatusChip calling (solid accent + pulse) |
| + เปิดโต๊ะ | Button primary, plus icon |
| เคาน์เตอร์ / โต๊ะ | section headings (`table_seat.kind`) |
| Compact card: `C1` · chip · guests "ฟ้า" · "0:42" · `฿480.00` | active — **total shown, no item count** |
| Compact open: `C4` · เปิดแล้ว (own row) · รอออเดอร์ | open |
| Large card: `T3` · มีแขก · "ต้น, บีม" · "5 รายการ · 1:24" · `฿1,240.00` · Badge "ออเดอร์ใหม่ 2" | active |
| Large idle: `T4` · ไม่มีความเคลื่อนไหว · "กอล์ฟ" · "ไม่มีความเคลื่อนไหว 25 นาที" | idle |
| Large call-staff: `T2` · เรียกพนักงาน · "มิ้นท์, เจ, ต้อม" · "7 รายการ · 2:10" · `฿1,980.00` | active + calling flag |
| Free: label only, muted, no chip | no visit |
Sort: by `sort_order` only — call-staff does **not** move (F3). 1024: counter 6/row, tables 4/row, cards don't shrink.

### CD-02/grid-states (2 boards: loading+empty · error+disconnected)
| State | Strings / behaviour |
|---|---|
| loading | 3 Skeleton pills for summary; Skeleton 120×96 ×8, 140h ×6; เปิดโต๊ะ disabled |
| empty | "ยังไม่มีโต๊ะ — เพิ่มโต๊ะในหน้าตั้งค่า" + Button "ไปที่ตั้งค่า"; summary hidden; เปิดโต๊ะ disabled |
| error | Alert danger "โหลดข้อมูลโต๊ะไม่สำเร็จ" / "เกิดข้อผิดพลาด" + Button "ลองอีกครั้ง"; summary + sections hidden |
| disconnected | Alert warning (wifi-off) above sections "การเชื่อมต่อขาด ข้อมูลอาจไม่อัปเดต"; grid keeps last data |

### CD-02/panel · panel-states — Drawer
States: active (มีออเดอร์) · open (ยังไม่มีออเดอร์) · loading · close blocked (409) · idle.
| String | Element |
|---|---|
| โต๊ะ T3 · Chip มีแขก | header |
| ตัวเลือกเพิ่มเติม (⋯) · ปิด (x) | IconButton labels |
| เปิด 1:24 · ต้น | meta (clock, user icons) |
| "19:02 น." + order Chip (ใหม่ / กำลังเตรียม / เสิร์ฟแล้ว) + station label (บาร์ / ครัว, DR-012) | order group header = one station ticket |
| item Chip only when cancelled (ยกเลิก, DR-012) · "2× ช้างดราฟต์" · muted "น้ำแข็งก้อนใหญ่ · สั่งโดย บีม" · `฿240.00` | item row; ยกเลิก = struck through, no dot, reason shown ("สั่งผิด · สั่งโดย ต้น") |
| ยอดรวมย่อย · รวมทั้งสิ้น | footer (total 40/700 accent) |
| ชำระเงิน | Button primary lg block → CD-03 |
| ยกเลิกรายการ / Comp | Button danger outline md → void-comp |
| ปิดโต๊ะ | Button ghost md → close-confirm |
| สั่งแทนลูกค้า | Button secondary sm in the meta row when the table has orders → CD-04 (R8; hidden without `orders:create`) |
| open: "ยังไม่มีออเดอร์" · "ออเดอร์จาก QR ของโต๊ะจะขึ้นที่นี่ทันที" · Button "สั่งแทนลูกค้า" | ชำระเงิน + void disabled, ปิดโต๊ะ enabled, ฿0.00 |
| blocked: Alert danger "มีการชำระเงินค้างอยู่ ปิดโต๊ะไม่ได้" / "รอให้การชำระเงินเสร็จก่อน แล้วลองอีกครั้ง" | ชำระเงิน isPending, ปิดโต๊ะ disabled |
| idle: Alert warning "โต๊ะนี้ไม่มีความเคลื่อนไหว 25 นาที" / "ยังมีลูกค้าอยู่หรือไม่ — ระบบไม่ปิดโต๊ะเอง" (DR-014 #2) + "ยังใช้งานอยู่" / "ปิดโต๊ะ" (ghost → close-confirm, never closes directly) | top of body |

### CD-02/open-table · open-table · QR — Modal
States: default (from + เปิดโต๊ะ, Select open) · from card (preselected) · submitting · already opened · error · success QR.
| String | Element |
|---|---|
| เปิดโต๊ะ | title / primary Button (isPending when submitting) |
| โต๊ะ / ที่นั่ง · เลือกโต๊ะที่ว่าง · แสดงเฉพาะโต๊ะที่ว่าง | Select label / placeholder / description (free seats only) |
| ชื่อแขก (ไม่บังคับ) · เช่น ต้น | Input label / placeholder |
| ยกเลิก | Button secondary |
| ~~"โต๊ะนี้เพิ่งถูกเปิดโดยลูกค้า — เข้าร่วมโต๊ะเดิมแล้ว" + only Button "เสร็จสิ้น"~~ | **superseded by R2** — the ask dialog (open-table·4); not drawn in any frame |
| "เปิดโต๊ะไม่สำเร็จ ลองอีกครั้ง" | Alert danger, fields editable |
| counter success (QR off): Toast "เปิด C3 แล้ว" / "แขก ต้น · รอออเดอร์ — เคาน์เตอร์ไม่ใช้ QR" · success: "เปิดโต๊ะ T3 แล้ว" · QR 240 · "สแกนเพื่อสั่งอาหาร — T3" · "แชร์ QR ให้เพื่อนในโต๊ะได้" · "พิมพ์ QR" · "เสร็จสิ้น" | QR modal → grid |

### CD-02/close-confirm — Modal
States: fully paid · remaining · closed.
"ปิดโต๊ะ T3?" · body (**see §1 fix**) · summary ยอดรวม / ชำระแล้ว / คงเหลือ (remaining in `--text-danger`) · remaining → Alert danger "ยังมียอดค้างชำระ ฿320.00" and primary becomes "ไปชำระเงิน" → CD-03 · paid → primary "ปิดโต๊ะ" · buttons "ยกเลิก" · success Toast "ปิดโต๊ะ T3 แล้ว", card returns to free.

### CD-02/void-comp — Modal
States: default · wrong PIN · no manager on shift.
| String | Element |
|---|---|
| ยกเลิกรายการ / Comp | title |
| เลือกรายการ | selectable Card rows (non-cancelled items; name + price). Checkbox list is acceptable too |
| ประเภท: ยกเลิก · Comp ฟรี | RadioGroup horizontal |
| เหตุผล (จำเป็น): **ของหมด** · สั่งผิด · ลูกค้าเปลี่ยนใจ · ของเสีย · บริการพิเศษ · อื่นๆ | Select required (ของหมด added rev 3 — CD-15 R3) |
| PIN ผู้จัดการ · 4 หลัก · "PIN 4 หลักของผู้จัดการ — ตัวเดียวกับที่ใช้สลับคนที่ POS" · error "PIN ไม่ถูกต้อง" | Input password, numeric, maxLength 4 (Q1) |
| no manager: Alert warning "อนุมัติด้วยตัวเอง — จะถูกบันทึกให้เจ้าของตรวจสอบ" / "ไม่มีผู้จัดการในกะนี้" | replaces PIN field (FRD §8 solo self-approve, flagged in audit) |
| ปิด (secondary — not "ยกเลิก", which means void here) · ยืนยันการยกเลิก (danger) / ยืนยัน Comp (primary) | actions; confirm label follows the type |

### CD-02/qr-actions
Drawer ⋯ Dropdown: "พิมพ์ QR ซ้ำ" (printer) · "สร้าง QR ใหม่" (refresh-cw). Regenerate → AlertDialog (not dismissable) "สร้าง QR ใหม่?" · danger body "QR เดิมจะใช้ไม่ได้ทันที ลูกค้าที่สแกน QR เดิมจะเห็น 'QR ไม่ถูกต้อง กรุณาติดต่อพนักงาน'" · "ยกเลิก" / "สร้าง QR ใหม่" (danger) → `POST /api/tables/:id/qr/regenerate`. Reprint → print preview Card 320 wide: brand · QR 220 · table label · "สแกนเพื่อสั่งอาหาร" (client-only, same token).

### CD-02/realtime
- `visit.opened` from customer QR: card free → active; Toast info (qr-code) "T5 เปิดโต๊ะจาก QR" / "ออเดอร์แรก 2 รายการ".
- `staff.called`: card gets calling skin; Toast warning (bell-ring) "T2 เรียกพนักงาน" + action "รับทราบ", **persistent** (duration 0). รับทราบ clears the flag.

### CD-02/flow
grid → (แตะ ว่าง / + เปิดโต๊ะ) open-table → (สำเร็จ) QR → (เสร็จสิ้น) grid active · customer first order → grid active · grid → (แตะที่มีแขก) panel → ชำระเงิน (CD-03) / ปิดโต๊ะ → close-confirm → grid free, or → CD-03 if remaining · panel → void-comp → panel · idle → ยังใช้งานอยู่ (panel) / ปิดโต๊ะ (close-confirm).


## 7. Layout & tokens
- Viewports 1280×800 (primary), 1024×800. Content 1192×744 @1280, 936×744 @1024.
- Grid page padding 20 / 24 / 24; header gap 16, mb 20; title 26/700; summary chips gap 8; section heading 17/600 muted, mb 12.
- Counter grid `repeat(auto-fill, 120px)` gap 12, mb 28 (8/row @1280, 6/row @1024). Table grid `repeat(auto-fill, minmax(200px, 1fr))` gap 12, pt 4 (5 cols @1280, 4 @1024).
- **TableCard** radius `--r-card` 12. Compact 120×96 p 10: label 17/700 + chip sm · guests + time small · total 15/700 tabular bottom. Large 100%×140 p 14: label 21/700 + chip sm · guests (users 16) · idle line · bottom "n รายการ · h:mm" small faint + total 19/700.
  Skins: free transparent, 1px `--line`, label `--text-faint` · open 1.5px dashed `--line-accent` · active `--surface-card`, 1px `--line`, `--shadow-card` + `--highlight-top` · idle `--warning-bg`, 1.5px `--status-new-border`, idle line `--warning-fg` 13/600 · calling `--accent-soft`, 1.5px `--accent`, solid chip + pulse · selected `0 0 0 2px --bg-app, 0 0 0 4px --accent`.
  New-order Badge: absolute top −10 right 10, h 20, px 8, pill, `--accent`/`--text-on-accent`, 2px `--bg-app` border, 11/700 tabular, `--z-raised`.
- **Drawer** 400×744, top 56 right 0 (below top bar), `--surface-overlay`, 1px `--line` left, `--shadow-dialog`, `--z-dialog`. Scrim covers content only (left 88, top 56), `--scrim` .5 — rail and top bar stay usable. Header p 14 12 12 20; IconButtons 44. Body p 14 20, scrolls; order group top hairline, pt 10 mt 6. Item row grid `64px 1fr auto` gap 10 py 8; name 15/600. Footer sticky p 14 20 16, gap 10, top border, `--shadow-sheet`, total 40/700; primary lg 52 block; second row gap 8 (danger flex 1, ghost auto) md 44.
- **Modals** width `min(420px, 100% − 32px)`, p 20, radius 16, `--shadow-dialog`, scrim + `--blur-overlay`; title 21/600 mb 8; field gap 16; actions right, gap 8, mt 20; inputs 48 high radius 10. QR 240 (success) / 220 (print) on `--qr-bg`, padding 6%, radius 8.
- **Toast** max 380, radius 10, 3px tone rule, top-right.

- Smallest size: **1024×768** (grid·2) — counters 6/row, tables 4/row, cards keep their size; guest names truncate with "…".
- Tailwind mapping: `app/frontend/src/app/globals.css` (BRIEF-014) — DS utilities only, no arbitrary px.

## 8. Components → platform (HeroUI v3)
| Part | HeroUI v3 |
|---|---|
| Summary "ใช้งาน n" | Chip variant soft/outline neutral + dot |
| Summary ว่าง / เรียกพนักงาน · table/order/item status | StatusChip (CD-00, Chip) |
| เปิดโต๊ะ | Button primary md, startContent plus |
| TableCard | Card (custom composition, see F4) + Chip sm + Badge |
| Loading | Skeleton |
| Error / disconnected / blocked / idle / info | Alert (danger / warning / info) |
| Session panel | Drawer placement right, 400 |
| ⋯ menu | Dropdown (2 items) |
| Panel actions | Button primary lg fullWidth · Button danger (outline) md · Button ghost md · Button secondary sm |
| Open-table / close / void-comp | Modal · Select · Input/TextField · RadioGroup + Radio · Button |
| Regenerate confirm | AlertDialog (Modal, isDismissable false) |
| Live updates | Toast (info; warning with action, duration 0) |
Not used: Tooltip (removed — touch tablet, no hover).


## 9. Behaviour rules
- **Grid:** sort by `sort_order` only; call-staff never moves a card (F3). Free card tap → open-table preselected; occupied tap → panel. Without `visits:open` the "+ เปิดโต๊ะ" button is hidden and free cards are inert (R4).
- **Open:** `POST /visits` with `via:'pos'`. `201` → QR. `200 attached:true` is a normal outcome, never an error, but the POS **never joins silently** — the ask dialog shows who opened it (`openedBy.displayName`, or "ลูกค้า (สแกน QR)" when `openedVia = qr`), when, and the guest label (R2). One live visit per seat stays the rule.
- **Panel (DR-012/013):** groups = tickets — one per order when the kitchen screen is off (no station label), station tickets with บาร์ / ครัว when it is on; newest first, each with time + station label + ticket chip; items show no progress chip, cancelled items struck with reason; a ticket whose items are all cancelled is shown as cancelled and drops out of the totals. Totals exclude cancelled items.
- **No auto-close (DR-014 #2):** idle only warns (grid card + panel·5); a table is closed only by a person.
- **Counter seats (DR-014 #5):** staff open them on the POS / staff app; counter QR is a venue option, off by default → no QR modal after opening a counter seat (open-table·7). Table QR unchanged.
- **Close:** always via close-confirm; remaining > 0 → "ไปชำระเงิน" (no close call); payment in flight → 409 → panel·4; idle "ปิดโต๊ะ" also goes to close-confirm, never closes directly.
- **Void / comp:** manager PIN unless no manager is on shift → self-approve flagged in the audit log (FRD §8). Comp + PIN check need APIs (R5).
- **QR:** reprint = same token (client); regenerate = confirm dialog, old token invalid immediately.
- **Realtime:** `visit.opened` → card updates in place + Toast; `staff.called` → sticky Toast with "รับทราบ" (ack API pending, R5); disconnected → banner, grid keeps last data, refetch on reconnect.
- **Touch only:** no hover, no tooltips; targets ≥ 44, primary 52.
- **Standard questions (`cd-template.md` §5):** Filters → n/a (no filters on the grid; summary chips are counts). Search → n/a. Long and short → 1024×768 smallest, 1280×800 design; guest names truncate on cards, wrap in the panel; empty grid → grid-states·2. Interaction → DS Button / Card pressed + disabled + pending; selected card = accent ring; DS motion tokens only. Accessibility → each TableCard is a button labelled "T3 มีแขก ต้น, บีม ฿1,240.00"; icon-only buttons have labels (ตัวเลือกเพิ่มเติม, ปิด); drawer = dialog labelled "โต๊ะ T3"; reading order rail → top bar → summary → counters → tables. Data → seat + visit summary from `GET /tables`; panel from `GET /visits/:id`; missing guest label → "—"; missing total (before BRIEF-012) → hidden.
- **User-mindset checks:** ✓ one dominant action per screen (เปิดโต๊ะ / ชำระเงิน) · ✓ targets · ✓ acknowledgement < 1 s (pending / Toast) · ✓ meaningful loss confirmed (close, void, regenerate) · ✓ errors say how to fix · ✓ task cost "2 taps to open" · ✓ status never by colour alone · ✓ long Thai drawn (grid·2) · ☐ walkthrough with staff.

## 10. Revisions
| Rev | Date | Change | Authority |
|---|---|---|---|
| 1 | 2026-09-28 | Claude Design boards; F1 money `฿1,240.00` · F2 compact idle / call-staff short chips · F3 call-staff doesn't move cards · F4 TableCard replaces TableTile · Q1 `table_seat.kind` · Q2 tables always shared · Q3 QR reprint + regenerate | Field |
| 1 | 2026-10-09 | Ported to the Design canvas (full-size boards, close-confirm copy fix applied) | Cowork |
| 2 | 2026-10-10 | CD template retrofit: overview, J1 / J2, pills + sections, 1024×768 + long names, panel·6 permission, panel·7 joined; R2 ask before joining (open-table·4); R3 DR-012 station tickets in the panel; R1 pain point assumption; R5 API gaps | Field (R2, R3) · R1, R4, R5 pending |
| 3 | 2026-10-17 | Housekeeping: R6 DR-014 (#2 idle never auto-closes · #5 counter open without QR, open-table·7 · #8 noted → CD-01) · R7 ของหมด void reason · R8 "สั่งแทนลูกค้า" in the panel meta row (CD-04 R6) · stickies R1 / R4 green · Q1 PIN length raised | Field decisions 12 + 17 Oct · Cowork drew |
| 4 | 2026-10-17 | DR-013 pass (single-ticket panel, R9) · Q1 decided: 4-digit manager POS PIN in void-comp | Field 17 Oct · Cowork drew |

## 11. Source snapshot
Pending — after Field approves rev 2 (`cd-template.md` §6). Lucide blob `/_blob/2813c665b3ba7d45ea80d6ebc447f36b` (CD-02 only). QR images are placeholders (conic-gradient CSS in board `<helmet>`), not assets.

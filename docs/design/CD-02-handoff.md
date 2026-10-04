# CD-02 — Developer handoff (from Claude Design, 2026-09-28)

Source: Claude Design project https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457 · files `ui_kits/pos-v2/cd-02/` (dark) and `cd-02/light/` (light = dark file with `?theme=light`) · brief `CD-02-pos-tables-session.md`.
Screenshots: `docs/design/assets/CD-02/` (see §7). Tokens: `docs/design/tokens-v2.css` / `docs/design-system.md` v2.1.
**Do not port Claude Design's JSX.** Build with HeroUI v3 + our tokens; the design is the visual/behaviour spec only. All order/guest/amount values are sample data.

## 0. Decisions (all resolved 2026-09-28)
| # | Item | Recommendation |
|---|---|---|
| F1 | **Money format — ✅ Decided (Field, 2026-09-28): `฿1,240.00`** (prefix ฿, 2 decimals, `tabular-nums`). | One `formatBaht()` helper; CD project readme `1,240 ฿` is superseded. |
| F2 | **Compact counter card idle / call-staff — ✅ Decided (Field, 2026-09-28): option B** — short chip text on its own row: idle "ไม่เคลื่อนไหว", call-staff "เรียก" (+ pulse dot), card skin as on large cards. | Drawn on board `CD-02/decisions`. Full label in the drawer. |
| F3 | **Call-staff ordering — ✅ Decided (Field, 2026-09-28): option A** — cards keep their `sort_order` position; call-staff shown by accent skin + pulse + summary chip only. | Simpler; no card moves under the finger. Supersedes the realtime board's "move to front" caption. |
| F4 | **✅ Decided (Field, 2026-09-28): TableCard replaces DS `TableTile`** (compact + large, content model in §5). | Build PR adds TableCard to `components/bar/`, removes TableTile, updates `design-system.md` §6. |

## 1. Design bugs to fix in the build (not blocking)
- **close-confirm body copy is wrong:** "QR ของโต๊ะนี้จะใช้ไม่ได้ และโต๊ะจะกลับเป็นว่าง". Closing ends the **visit**; the static table QR keeps working and starts a new visit on the next scan (FRD §3). Only *regenerate* invalidates a QR. → Use **"โต๊ะจะกลับเป็นว่าง ลูกค้าที่สแกน QR หลังจากนี้จะเริ่มบิลใหม่"**.
- Served items show item chip "พร้อม" (item enum has no served value) — correct per schema; the order chip "เสิร์ฟแล้ว" carries the served meaning. No change.
- `TableCard` state names in CD code use `seated` → code uses schema `visit_state` (`active`). Call-staff is a flag, not a state.

## 2. Artboards, states, strings

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
| "19:02 น." + order Chip (ใหม่ / กำลังทำ / เสิร์ฟแล้ว) | order group header |
| item Chip (รอ / กำลังทำ / พร้อม / ยกเลิก) · "2× ช้างดราฟต์" · muted "น้ำแข็งก้อนใหญ่ · สั่งโดย บีม" · `฿240.00` | item row; ยกเลิก = struck through, no dot, reason shown ("สั่งผิด · สั่งโดย ต้น") |
| ยอดรวมย่อย · รวมทั้งสิ้น | footer (total 40/700 accent) |
| ชำระเงิน | Button primary lg block → CD-03 |
| ยกเลิกรายการ / Comp | Button danger outline md → void-comp |
| ปิดโต๊ะ | Button ghost md → close-confirm |
| open: "ยังไม่มีออเดอร์" · "ออเดอร์จาก QR ของโต๊ะจะขึ้นที่นี่ทันที" · Button "สั่งแทนลูกค้า" | ชำระเงิน + void disabled, ปิดโต๊ะ enabled, ฿0.00 |
| blocked: Alert danger "มีการชำระเงินค้างอยู่ ปิดโต๊ะไม่ได้" / "รอให้การชำระเงินเสร็จก่อน แล้วลองอีกครั้ง" | ชำระเงิน isPending, ปิดโต๊ะ disabled |
| idle: Alert warning "โต๊ะนี้ไม่มีความเคลื่อนไหว 25 นาที" + "ยังใช้งานอยู่" / "ปิดโต๊ะ" (ghost → close-confirm, never closes directly) | top of body |

### CD-02/open-table · open-table · QR — Modal
States: default (from + เปิดโต๊ะ, Select open) · from card (preselected) · submitting · already opened · error · success QR.
| String | Element |
|---|---|
| เปิดโต๊ะ | title / primary Button (isPending when submitting) |
| โต๊ะ / ที่นั่ง · เลือกโต๊ะที่ว่าง · แสดงเฉพาะโต๊ะที่ว่าง | Select label / placeholder / description (free seats only) |
| ชื่อแขก (ไม่บังคับ) · เช่น ต้น | Input label / placeholder |
| ยกเลิก | Button secondary |
| "โต๊ะนี้เพิ่งถูกเปิดโดยลูกค้า — เข้าร่วมโต๊ะเดิมแล้ว" + only Button "เสร็จสิ้น" | Alert **info**, fields disabled (API: second open attaches) |
| "เปิดโต๊ะไม่สำเร็จ ลองอีกครั้ง" | Alert danger, fields editable |
| success: "เปิดโต๊ะ T3 แล้ว" · QR 240 · "สแกนเพื่อสั่งอาหาร — T3" · "แชร์ QR ให้เพื่อนในโต๊ะได้" · "พิมพ์ QR" · "เสร็จสิ้น" | QR modal → grid |

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
| เหตุผล (จำเป็น): สั่งผิด · ลูกค้าเปลี่ยนใจ · ของเสีย · บริการพิเศษ · อื่นๆ | Select required |
| PIN ผู้จัดการ · 4–6 หลัก · error "PIN ไม่ถูกต้อง" | Input password, numeric, maxLength 6 |
| no manager: Alert warning "อนุมัติด้วยตัวเอง — จะถูกบันทึกให้เจ้าของตรวจสอบ" / "ไม่มีผู้จัดการในกะนี้" | replaces PIN field (FRD §8 solo self-approve, flagged in audit) |
| ปิด (secondary — not "ยกเลิก", which means void here) · ยืนยันการยกเลิก (danger) / ยืนยัน Comp (primary) | actions; confirm label follows the type |

### CD-02/qr-actions
Drawer ⋯ Dropdown: "พิมพ์ QR ซ้ำ" (printer) · "สร้าง QR ใหม่" (refresh-cw). Regenerate → AlertDialog (not dismissable) "สร้าง QR ใหม่?" · danger body "QR เดิมจะใช้ไม่ได้ทันที ลูกค้าที่สแกน QR เดิมจะเห็น 'QR ไม่ถูกต้อง กรุณาติดต่อพนักงาน'" · "ยกเลิก" / "สร้าง QR ใหม่" (danger) → `POST /api/tables/:id/qr/regenerate`. Reprint → print preview Card 320 wide: brand · QR 220 · table label · "สแกนเพื่อสั่งอาหาร" (client-only, same token).

### CD-02/realtime
- `visit.opened` from customer QR: card free → active; Toast info (qr-code) "T5 เปิดโต๊ะจาก QR" / "ออเดอร์แรก 2 รายการ".
- `staff.called`: card gets calling skin; Toast warning (bell-ring) "T2 เรียกพนักงาน" + action "รับทราบ", **persistent** (duration 0). รับทราบ clears the flag.

### CD-02/flow
grid → (แตะ ว่าง / + เปิดโต๊ะ) open-table → (สำเร็จ) QR → (เสร็จสิ้น) grid active · customer first order → grid active · grid → (แตะที่มีแขก) panel → ชำระเงิน (CD-03) / ปิดโต๊ะ → close-confirm → grid free, or → CD-03 if remaining · panel → void-comp → panel · idle → ยังใช้งานอยู่ (panel) / ปิดโต๊ะ (close-confirm).

## 3. Layout specs
- Viewports 1280×800 (primary), 1024×800. Content 1192×744 @1280, 936×744 @1024.
- Grid page padding 20 / 24 / 24; header gap 16, mb 20; title 26/700; summary chips gap 8; section heading 17/600 muted, mb 12.
- Counter grid `repeat(auto-fill, 120px)` gap 12, mb 28 (8/row @1280, 6/row @1024). Table grid `repeat(auto-fill, minmax(200px, 1fr))` gap 12, pt 4 (5 cols @1280, 4 @1024).
- **TableCard** radius `--r-card` 12. Compact 120×96 p 10: label 17/700 + chip sm · guests + time small · total 15/700 tabular bottom. Large 100%×140 p 14: label 21/700 + chip sm · guests (users 16) · idle line · bottom "n รายการ · h:mm" small faint + total 19/700.
  Skins: free transparent, 1px `--line`, label `--text-faint` · open 1.5px dashed `--line-accent` · active `--surface-card`, 1px `--line`, `--shadow-card` + `--highlight-top` · idle `--warning-bg`, 1.5px `--status-new-border`, idle line `--warning-fg` 13/600 · calling `--accent-soft`, 1.5px `--accent`, solid chip + pulse · selected `0 0 0 2px --bg-app, 0 0 0 4px --accent`.
  New-order Badge: absolute top −10 right 10, h 20, px 8, pill, `--accent`/`--text-on-accent`, 2px `--bg-app` border, 11/700 tabular, `--z-raised`.
- **Drawer** 400×744, top 56 right 0 (below top bar), `--surface-overlay`, 1px `--line` left, `--shadow-dialog`, `--z-dialog`. Scrim covers content only (left 88, top 56), `--scrim` .5 — rail and top bar stay usable. Header p 14 12 12 20; IconButtons 44. Body p 14 20, scrolls; order group top hairline, pt 10 mt 6. Item row grid `64px 1fr auto` gap 10 py 8; name 15/600. Footer sticky p 14 20 16, gap 10, top border, `--shadow-sheet`, total 40/700; primary lg 52 block; second row gap 8 (danger flex 1, ghost auto) md 44.
- **Modals** width `min(420px, 100% − 32px)`, p 20, radius 16, `--shadow-dialog`, scrim + `--blur-overlay`; title 21/600 mb 8; field gap 16; actions right, gap 8, mt 20; inputs 48 high radius 10. QR 240 (success) / 220 (print) on `--qr-bg`, padding 6%, radius 8.
- **Toast** max 380, radius 10, 3px tone rule, top-right.

## 4. Components → HeroUI v3
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

## 5. New in the CD project
- Tokens: **none**. DS components: **none**.
- Kit-local (not exported): TableCard, NewOrderBadge, SummaryChips, GridView, TablePanel (+ OrderGroup, ItemRow), Cd02DropdownMenu, Cd02Shell, QRMock (placeholder — real QR encodes the signed table token).
- Changed: `ui_kits/pos-v2/Shell.jsx` shift chip `white-space: nowrap` (affects CD-01 top bar); `readme.md` CD-02 index + "มีแขก = active only; summary uses ใช้งาน".

## 6. Accepted deviations (Cowork default — Field may override at BRIEF approval)
1. Summary "ใช้งาน n" (Field's revision) — counts open + active + idle.
2. No hover anywhere; counter cards show total, item count in drawer/large cards only (Field's revision).
3. 1024 drawn inside a 1280 card with a notes column.
4. State boards scaled (grid-states 90%, panel-states 58.5%, open-table 76%, void-comp 80%, close-confirm 90%) — use the full-size boards (grid, panel, open-table · QR) for pixel values.
5. Drawer below the top bar; only content dimmed.
6. Free cards have no chip; compact open card puts the chip on its own row.
7. "Outline danger" = DS danger button with transparent fill.
8. Void-comp item picker = selectable Cards (Checkbox acceptable).
9. Added copy listed in §2 (ไปที่ตั้งค่า, เกิดข้อผิดพลาด, เสร็จสิ้น, ปิด, ยืนยันการยกเลิก / ยืนยัน Comp, summary and field labels) — accepted, except the close-confirm body (§1).
10. QR codes are placeholders.

## 7. Screenshots (`docs/design/assets/CD-02/`)
Pending — Field to export: `grid-dark.png`, `grid-light.png`, `grid-1024.png`, `grid-states-loading.png`, `grid-states-error.png`, `panel-dark.png`, `panel-light.png`, `panel-states.png`, `open-table.png`, `open-table-qr.png`, `close-confirm.png`, `void-comp.png`, `qr-actions.png`, `realtime.png`, `flow.png`.

---
id: CD-06
title: Customer QR — scan → nickname → menu → item → cart → running tab, call staff
revision: 1
status: review
approved_by:
approved_on:
canvas: https://claude.ai/artifact/6f5CBjGzpN4zYFotFQauGi
canvas_version: 1791708052-d3a9
ds_version: 1791561405-c72e
source: docs/design/source/CD-06/   # taken after approval (§11)
surfaces: [web-customer]
sizes: [390x844, 360x780]
brief: CD-06-customer-qr-order.md
drs: [DR-009, DR-010, DR-012]
depends_on: [CD-00, CD-04, CD-07, CD-12]
supersedes: brief paste text and acceptance where they conflict (see brief "Revisions")
---

# CD-06 — Customer QR: order at the table

Built on The Loft Bar Design System (real DS components; every board has a dark/light Theme tweak). **Do not port canvas markup** — build with Next.js + HeroUI v3 + tokens (`docs/rules/frontend.md`, BRIEF-014 utilities). Sample data only; menu "photos" are placeholder illustrations (R6). Template: `cd-template.md` · boards: `board-convention.md`. One shared child renders every phone: `Screen` (props `screen` welcome / menu / item / cart / tab / call · `state` · `ring` · `w` / `h`) — all state and sample data live in its `renderVals()`.

## 0. Review items
Brief decisions Q1 (photos) and D1–D4 apply (§10). Rev-1 items (✓ = accepted):

| # | Item | Recommendation |
|---|---|---|
| R1 ✓ | **Pain point = field research** (Field 2026-10-11): same root as CD-14 R8 (verbal orders); in small bars it happens only at rush hour / when the bar is full — guests wait long before they can order. | Done (overview). |
| R2 ✓ | **Every tap opens a sheet — no quick add** (Field's idea 2026-10-11, drawn by Cowork). "+" or card → bottom sheet. No-option item: half sheet with qty + note; if already in the cart it opens at the current qty, button "อัปเดตตะกร้า", qty 0 → danger "ลบออกจากตะกร้า" (item·1–3). Item with options: full-screen sheet; always adds a new line, with a hint that an existing line (different options) is edited in the cart (item·7). Cost: +1 tap per item (J1 = 5 taps for one drink) for no accidental adds and qty edits without leaving the menu; same pattern as CD-14. | Field: confirm the drawn version. **Accepted 2026-10-17** (Field) — drawn version confirmed. |
| R3 ⏸ | **Parked — discuss separately** (Field 2026-10-11). Where the nickname is changed (drawn in the cart: "สั่งในชื่อ ต้น · เปลี่ยนชื่อ"; brief said tab header); skipped nickname → "สั่งโดย ลูกค้า". Tied to R4. | — |
| R4 ⏸ | **Parked — discuss separately** (Field 2026-10-11). "ของฉัน" must not match by name → needs a per-phone id (visit-session token on `order_record`). Decides how customer sessions work. | — |
| R5 ⏸ | **Parked until R3 + R4** (Field 2026-10-11). Customer-QR API contract: menu `imageUrl` + `available_now` + window · running tab per ticket · call-staff + 60 s throttle · WS `/customer`. The customer-QR brief stays on hold. | — |
| R6 ✓ | **Photos** (Field 2026-10-11): canvas uses placeholder illustrations; real photos = `menu_item.image_key` from CD-12; no photo = category icon on `--surface-raised`, 4:3 — both drawn. | Done. |
| R7 | **DR-014 #10 impact:** promo items show the promo price as-is — no crossed-out "was" price on alcohol. | Field approved DR-014 2026-10-12; apply in the next canvas revision. |

## 1. Overview
- **Goal:** a guest scans the table QR, orders on their own phone without login, sees the whole table's orders with status, and can call staff.
- **Pain point (field research, R1):** orders are verbal; in small bars this bites at rush hour / when full — guests wait long before they can order.
- **User + context:** guest at a table / counter · Friday 22:00 with 3–4 friends, dim light, one hand holding a glass, won't install or register anything.
- **Entry → exit:** scan QR → `/q/:token`. Exit: ชำระเงิน → CD-07 · table closed → scan again.
- **Outcome:** scan → order a no-option drink in 5 taps (ดูเมนู → + → เพิ่มลงตะกร้า → ดูตะกร้า → สั่งเลย; assumes nickname typed or skipped); one shared bill with names; sold-out / expired promo caught before send; retry never duplicates.
- **Out of scope:** payment (CD-07), LINE login, PDPA consent, bottle keep, recommendations, multi-language, staff / POS screens.
- **Journeys:** J1 ต้น scans T3 → nickname → ช้าง ×2 (qty sheet) → โอลด์แฟชั่น (full sheet) → ถั่วทอด → cart → send → tab with 2 tickets (E1–E8) · J2 ยำหมูยอ sold out at send → 409 → remove → send (E1–E3).

## 2. Boards
| Board | Type | States |
|---|---|---|
| `overview` | OVERVIEW | goal, pain point (R1), user/context, outcome, entry/exit, journeys, out of scope, key decisions |
| `journey-1` | JOURNEY | welcome (E1 ดูเมนู) → menu (E2 + ช้าง) → qty sheet 2 (E3 เพิ่ม) → added (E4 card โอลด์แฟชั่น) → item (E5 เพิ่ม; E6 + ถั่วทอด → sheet) → cart bar 4 (E7 ดูตะกร้า) → cart (E8 สั่งเลย) → tab ฿1,840.00 |
| `journey-2` | JOURNEY | cart ยำหมูยอ + ช้าง (E1) → 409 void line (E2 ลบออก) → cart (E3) → tab ฿1,480.00 |
| `welcome` | STATES | 1 default · 2 typing + keyboard · 3 loading · 4 invalid QR · 5 360×780 |
| `menu` | STATES | 1 loaded · 2 loading · 3 error · 4 no result · 5 cart bar · 6 sold out live · 7 promo · 8 disconnected · 9 search + long names + keyboard · 10 nickname skipped · 11 360×780 |
| `item` | STATES | 1 qty sheet new · 2 qty sheet already in cart · 3 qty 0 → remove · 4 options default · 5 required missing · 6 max toppings · 7 options + already in cart · 8 full sheet + keyboard |
| `cart` | STATES | 1 normal · 2 sending · 3 sold out 409 · 4 promo expired 409 · 5 network error · 6 table closed · 7 empty · 8 360×780 |
| `tab` | STATES | 1 all · 2 ของฉัน · 3 ticket ready (live) · 4 after send · 5 empty · 6 disconnected · 7 360×780 |
| `call-staff` | STATES | 1 open · 2 sending · 3 done + 60 s lock · 4 error |
| `flow` | FLOW MAP | enter & order · after order · errors |
Shared (not a board to review): `Screen`.

## 3. State coverage
✓ drawn · n/a (reason) · shared (where) · rule (§9).

| State | Welcome | Menu | Item | Cart | Tab | Call |
|---|---|---|---|---|---|---|
| default | ✓ ·1 | ✓ ·1 | ✓ ·1 | ✓ ·1 | ✓ ·1 | ✓ ·1 |
| loading | ✓ ·3 | ✓ ·2 | n/a (from menu data) | n/a (local) | rule: skeleton cards (menu·2 pattern) | n/a |
| empty | n/a | ✓ ·4 (no result) · rule: empty category → "ยังไม่มีเมนูในหมวดนี้" | n/a | ✓ ·7 | ✓ ·5 | n/a |
| error + retry | ✓ ·4 (404 = no retry, ask staff) | ✓ ·3 | n/a | ✓ ·5 | shared menu·3 pattern | ✓ ·4 |
| validation | rule: nickname ≤ 30 chars, trimmed | n/a | ✓ ·2 ·3 | n/a | n/a | n/a |
| pending | n/a | n/a | n/a | ✓ ·2 | n/a | ✓ ·2 |
| success feedback | n/a | ✓ J1·3 Toast | rule: sheet closes, card count + Toast | ✓ tab·4 | ✓ ·3 ·4 | ✓ ·3 |
| failure per reason | ✓ ·4 | n/a | n/a | ✓ ·3 ·4 ·5 ·6 | n/a | ✓ ·4 |
| stale / conflict | n/a | ✓ ·6 | rule: option unavailable → FieldError on add | ✓ ·3 ·4 | ✓ ·3 | rule: already called by another phone → still allowed |
| disconnected | n/a | ✓ ·8 | n/a | rule: send still tried | ✓ ·6 | rule |
| permission denied | n/a (no login) | n/a | n/a | ✓ ·6 (closed table = no access) | n/a | n/a |
| long Thai text | n/a | ✓ ·9 | rule: name wraps | rule: names wrap | rule: names wrap | n/a |
| smallest size | ✓ ·5 | ✓ ·11 | rule: body scrolls, footer sticky | ✓ ·8 | ✓ ·7 | n/a (sheet) |
| keyboard open | ✓ ·2 | ✓ ·9 (cart bar hidden) | ✓ ·5 (footer above keyboard) | n/a | n/a | n/a |
| session expired | n/a — visit-session token lives as long as the visit; closed visit = cart·6 | ← | ← | ← | ← | ← |

## 4. Action table
| Action | API (status) | Permission | Success → UI | Failure → UI | Recovery | Data kept | Idempotency |
|---|---|---|---|---|---|---|---|
| Open QR | `GET /public/qr/:token` (planned, customer-QR brief) | public token | welcome·1 | 404 → welcome·4 | ask staff | — | n/a |
| Load menu | `GET /public/menu` (planned; `imageUrl`, `available_now`, window — R5) | visit-session token | menu·1 | network → menu·3 | ลองอีกครั้ง | cart | n/a |
| Live menu | WS `/customer` `menu.availability_changed` + refetch 60 s (DR-010) | session | card → หมด + Toast (menu·6) | socket down → menu·8 | refetch on reconnect | cart | upsert by item id |
| Add / change qty / remove (sheet) | client | — | count + Toast; qty 0 removes the line | required missing → item·5 | pick | cart (this phone) | — |
| Send order | `POST /public/visits/:id/orders` + Idempotency-Key (planned); first order on a free table opens the visit (FRD §3) | session | `201` → tab·4 + Toast | `409 ITEM_UNAVAILABLE` sold_out → cart·3 · out_of_window → cart·4 · `409` visit closed → cart·6 · network → cart·5 | remove line / retry / scan again | cart | key per cart, reused on retry, new after success or edit |
| Running tab | `GET` tab of the visit (planned, R5) + WS `order.status_changed` | session | tab·1, live ·3 | socket down → tab·6 | refetch | — | n/a |
| Call staff | `POST /public/visits/:id/call-staff {reason?}` (planned, R5) | session | call·3, 60 s lock | network → call·4 · 429 → same as ·3 (already called) | retry | reason | server throttle 60 s |
| Pay | → CD-07 | session | — | — | — | — | — |

## 5. e2e script
- **J1** E1 open `/q/:token` for T3, type "ต้น", tap ดูเมนู → menu, header "โต๊ะ T3 · ต้น" · E2 tap + on ช้างดราฟต์ → qty sheet at 1 · tap stepper + → 2, button "เพิ่มลงตะกร้า · ฿240.00" · E3 add → card count 2, cart bar "ตะกร้า 2 รายการ ฿240.00", Toast · E4 tap the โอลด์แฟชั่น card → full sheet, defaults ปกติ · เชอร์รี่ · ก้อนใหญ่, button "เพิ่มลงตะกร้า · ฿280.00" · E5 add → cart bar 3 · E6 + ถั่วทอดสมุนไพร → sheet → add → 4 / ฿600.00 · E7 ดูตะกร้า → cart, "สั่งในชื่อ ต้น" · E8 สั่งเลย → one `POST` with Idempotency-Key, `orderedByName:'ต้น'` → `201` → tab: new placement 20:34 with เครื่องดื่ม · ส่งแล้ว (ช้าง ×2, โอลด์แฟชั่น) and อาหาร · ส่งแล้ว (ถั่วทอด), รวมทั้งโต๊ะ ฿1,840.00.
- **J2** cart ยำหมูยอ + ช้าง ×2 · E1 สั่งเลย → `409 ITEM_UNAVAILABLE reason sold_out` → nothing created; void line at top, struck ฿150.00, Alert, สั่งเลย disabled · E2 ลบออก → enabled, total ฿240.00 · E3 สั่งเลย → `201`, tab total ฿1,480.00.
- **Edge:** network error then retry → one order · closed table → cart·6, no send · call staff twice within 60 s → second press disabled (client) and 429 (server) · old / regenerated QR → welcome·4.

## 6. Strings & sample data
All copy and sample data are in `Screen.dc.html` `renderVals()` and markup. Key strings: **welcome** The Loft Bar · โต๊ะ T3 · บอกชื่อเล่นของคุณ · เพื่อให้พนักงานเรียกเมื่อเครื่องดื่มพร้อม · ชื่อเล่น / เช่น ต้น · ดูเมนู · ข้ามขั้นตอนนี้ · ไม่ต้องสมัครสมาชิก · ชื่อเล่นใช้กับโต๊ะนี้เท่านั้น · กำลังเปิดเมนูของโต๊ะ… · QR ไม่ถูกต้อง กรุณาติดต่อพนักงาน / QR นี้อาจถูกเปลี่ยนแล้ว หรือโต๊ะยังไม่พร้อม — ขอ QR ใหม่จากพนักงานที่บาร์. **menu** โต๊ะ T3 · ต้น · เรียกพนักงาน · ดูออเดอร์ของโต๊ะ ฿1,240.00 · ค้นหาเมนู · ทั้งหมด · โปรโมชั่น · เบียร์สด · ค็อกเทล · ไฮบอล · อาหาร · เริ่มต้น · หมด · โปร · ถึง 21:00 / โปร · เริ่ม 22:00 (ศ.–ส.) · ตะกร้า n รายการ · ดูตะกร้า · การเชื่อมต่อขาด กำลังลองใหม่ / สถานะเมนูอาจไม่ล่าสุด — ยังสั่งได้ ร้านตรวจของหมดอีกครั้งตอนส่ง · โหลดเมนูไม่สำเร็จ / ตรวจสัญญาณอินเทอร์เน็ตแล้วลองอีกครั้ง ตะกร้าที่เลือกไว้ยังอยู่ · ลองอีกครั้ง · ไม่พบเมนูที่ค้นหา · Toast เพิ่ม ช้างดราฟต์ แล้ว / แตะ + อีกครั้งเพื่อเพิ่มจำนวน · ถั่วทอดสมุนไพร หมดแล้ว / เลือกเมนูอื่นได้เลย. **item** ตัวเลือก · ต้องเลือก 1 · ท็อปปิ้ง · ไม่บังคับ · สูงสุด 2 · ระดับน้ำแข็ง · กรุณาเลือกระดับน้ำแข็ง · หมายเหตุ (ไม่บังคับ) · เพิ่มลงตะกร้า · ฿x. **cart** ตะกร้าของฉัน · สั่งในชื่อ ต้น · เปลี่ยนชื่อ · หมดแล้ว — ลบออกเพื่อสั่งต่อ · หมดเวลาโปร — ลบออกเพื่อสั่งต่อ · ลบออก · รวม · สั่งเลย · เลือกเมนูเพิ่ม · สั่งไม่สำเร็จ ลองอีกครั้ง / ตะกร้ายังอยู่ครบ — กดสั่งซ้ำจะไม่เกิดออเดอร์ซ้ำ · โต๊ะนี้ปิดแล้ว / สแกน QR อีกครั้งเพื่อเริ่มบิลใหม่ — รายการนี้ยังไม่ถูกส่ง · ตะกร้ายังว่าง. **tab** ออเดอร์ของโต๊ะ T3 · อัปเดต 20:34 น. · ทั้งหมด · ของฉัน · เพิ่งสั่ง · เครื่องดื่ม / อาหาร · ส่งแล้ว · ร้านกำลังเตรียม · พร้อมเสิร์ฟ · เสิร์ฟแล้ว · สั่งโดย {name} · รายการถูกยกเลิก · รวมทั้งโต๊ะ · ของฉัน (ต้น) · สั่งเพิ่ม · ชำระเงิน · ยังไม่มีออเดอร์ · Toast ส่งออเดอร์แล้ว พนักงานกำลังเตรียม · เครื่องดื่มพร้อมเสิร์ฟแล้ว. **call** เรียกพนักงาน · ขอเช็คบิล · ขอน้ำแข็ง / แก้ว · อื่นๆ · แจ้งพนักงานแล้ว · พนักงานจะมาที่โต๊ะ T3 เร็วๆ นี้ · เรียกอีกครั้งได้ใน 0:45 · เรียกไม่สำเร็จ ลองอีกครั้ง.
Tab sample = the same T3 bill as CD-02 / CD-03 / CD-04 (฿1,240.00; ต้น ฿660.00).

## 7. Layout & tokens
- Phone web 390×844, smallest 360×780. No app chrome; header blurred `--surface-bar` with `--blur-bar`.
- Menu grid: 2 columns, gap 12, side 16; card radius `--r-card`, photo 4:3 `object-fit: cover`; name 15/600 2-line clamp (min 40); price 16/700 accent; add button 44×44 accent; in-cart count pill top-right on the photo.
- Item sheet: full screen, photo 16:9, close IconButton on the photo; footer sticky (stepper lg + primary lg block), lifted above the keyboard.
- Cart / tab footers: total 32/700, buttons lg 52; tab tickets inside a placement card, items indented 24.
- Call staff: BottomSheet radius `--r-sheet`.
- Toast placement top on phones (DS Toast note).

## 8. Components → platform (HeroUI v3 web)
| Part | HeroUI v3 |
|---|---|
| Menu card | Card + Image + Button isIconOnly (custom composition — DS `MenuItemCard` tile is 108 high with a letter fallback; candidate update: 4:3 + icon fallback) |
| Categories | Tabs (drawn as DS Tag chips, scrollable) |
| Search | SearchField |
| Item sheet | Modal size full + RadioGroup + CheckboxGroup + TextField + NumberField |
| Cart line | DS QuantityStepper + Button isIconOnly |
| Ticket status | StatusChip kind order with customer `label` (ส่งแล้ว / ร้านกำลังเตรียม / พร้อมเสิร์ฟ / เสิร์ฟแล้ว) |
| Call staff | Drawer placement bottom (sheet) + Chip (selectable) + Button |
| Feedback | Alert · Toast · Skeleton · EmptyState · Spinner |

## 9. Behaviour rules
- **No login.** The QR token gives a visit-session token stored on this phone; nickname is optional (D1), ≤ 30 chars, trimmed, sent as `orderedByName`.
- **Sheet before add (R2):** "+" and card tap always open a sheet. No-option item → half sheet (qty + note); already in cart → starts at current qty, "อัปเดตตะกร้า", qty 0 → "ลบออกจากตะกร้า". Item with options → full sheet, always a new line (existing lines with other options are edited in the cart).
- **Charge items** (corkage etc.) are not on the customer menu; when staff add one it appears in the tab with no status (D3).
- **Promos (DR-010):** promo tab; out-of-window greyed, no "+", start time shown; server decides; expired in cart → cart·4.
- **Send:** one `POST` per cart with Idempotency-Key; cart locked while pending; the first order on a free table opens the visit.
- **Tab (D2, D3, DR-012):** whole table, newest placement first; one status per station ticket (เครื่องดื่ม / อาหาร), no item progress; cancelled items struck "รายการถูกยกเลิก" and excluded from totals; "ของฉัน" filters by this phone (R4), not by name.
- **Realtime:** `/customer` room; on disconnect show banner, keep last data, refetch on reconnect.
- **Call staff:** reason optional; button disabled 60 s after success (client) and throttled on the server (R5).
- **Standard questions:** Filters → category chips single select, ทั้งหมด default; tab filter ทั้งหมด / ของฉัน single select, cannot de-select both. Search → trimmed, Thai substring match on name, clears with the field's ✕ (query only; category kept). Long and short → 360×780 drawn; names clamp 2 lines on cards, wrap elsewhere. Interaction → DS pressed / disabled / pending; no hover reliance (touch). Accessibility → each card has "ดู {name}" and "เพิ่ม {name}" buttons; ticket status read as "{station} {status}"; reading order header → search → categories → cards → cart bar. Data → photo from `imageUrl` (missing → category icon); prices from the API.
- **User-mindset checks:** ✓ one dominant action per screen · ✓ targets ≥ 44 (primary 52) in thumb reach · ✓ ack < 1 s (Toast / pending) · ✓ errors say how to fix · ✓ task cost 5 taps (no-option drink, R2) · ✓ status has text · ✓ long Thai drawn (menu·9) · ☐ walkthrough with a guest.

## 10. Revisions
| Rev | Date | Change | Authority |
|---|---|---|---|
| 0 | 2026-10-09 | Brief: Q1 photos (`menu_item.image_key`), D1–D4 | Field |
| 0 | 2026-10-10 | D3 per station ticket (DR-012), customer label "ร้านกำลังเตรียม" (DR-012 A1) | Field |
| 1 | 2026-10-10 | First canvas built to `cd-template.md` v2: overview, J1 / J2, 6 state boards, flow; R1–R6 raised | Cowork |
| 1 | 2026-10-11 | Field review: R1 + R6 accepted · R2 Field's sheet-before-add idea drawn (item·1–3, ·7; J1 now E1–E8) · R3 / R4 / R5 parked for a separate discussion | Field (R1, R6) · R2 pending |

## 11. Source snapshot
Pending — after Field approves rev 1 (`cd-template.md` §6). Assets on the canvas: Lucide UMD `/_blob/8d9605710cbf0935649fa04801cfffca`; placeholder photo illustrations `/_blob/0521bae84b976a31c39d9d4d511ef00e` (beer), `e2a89ae45cad300bf94455372a662b88` (bottle), `15f3198af1081fec566d0ff51ed73e39` (rocks), `84a7473d8958d44bf3c9747c67a1d684` (negroni), `9bd9f6147882a151e9ebf0676c1debc3` (food).

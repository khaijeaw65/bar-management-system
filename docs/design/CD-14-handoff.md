---
id: CD-14
title: Staff app — new order
revision: 3
status: review            # rev 3 = CD template pilot; rev 2 was Field OK
approved_by: Field        # rev 2
approved_on: 2026-10-10   # rev 2
canvas: https://claude.ai/artifact/VXJCDCG4BLQrXvXMaBFPTW
canvas_version: 1791606968-5fa0
ds_version: 1791561405-c72e
surfaces: [expo-staff]
sizes: [390x844, 360x780]
brief: CD-14-staff-app-new-order.md
drs: [DR-009, DR-010]
depends_on: [CD-08, CD-04]
supersedes: brief paste text and acceptance where they conflict (see brief "Revisions")
---

# CD-14 — Staff app: new order

Built on The Loft Bar Design System (real DS components mounted; every board has a dark/light Theme tweak). **Do not port canvas markup** — build with HeroUI Native + Uniwind + tokens (`docs/rules/mobile.md`). Sample data only. Template: `cd-template.md` · board rules: `board-convention.md`.

## 0. Review items
Rev 2 items R1–R5 accepted by Field 2026-10-10 (summary in §10). Rev-3 pilot items (✓ = accepted by Field 2026-10-10):

| # | Item | Recommendation |
|---|---|---|
| R6 ✓ | **Cart lifetime.** Kept in memory per visit while the app runs or is backgrounded; lost if the app is killed or the session expires (401 → login). No offline ordering (cut scope). | Accept for S1. Persisting drafts = later. |
| R7 ✓ | **No-permission UI.** Permissions are known at login (ACL cache): without `orders:create` the "+ ออเดอร์" FAB and "สั่งออเดอร์" are hidden; without `visits:open` free seats are locked ("ให้ POS เปิด", seat-sheet 3). The 403 state (cart 11) only covers a permission revoked mid-session. | Accept. |
| R9 | **Join confirmation needs who opened the table.** Field 2026-10-10: a collision must ask before joining (could be a different group). `POST /visits` → `200 attached:true` creates nothing, so cancelling is free — but the dialog shows "เปิดโดย ต้น · POS · 21:02 · แขก กลุ่มมิ้นท์". BRIEF-011's attach response has `guestLabel` + `openedAt` but no opener. | Amend BRIEF-011 (not implemented yet): attached response adds `openedBy { staffId, displayName }` and `openedVia` (`pos`/`app`/`qr`). Field decides. Same dialog later on POS (CD-02 retrofit). |
| R8 ✓ | **Overview pain point** confirmed by Field 2026-10-10: bars without POS / QR take orders on paper or verbally. Consequence (lost orders, under-charging) stated as risk. | Done. |

## 1. Overview
- **Goal:** staff take an order at the table/counter on their phone and send it straight to the bar queue, without walking to the POS.
- **User + context:** server / bartender · Friday 22:00, full bar, dim light, one hand, several guests ordering at once.
- **Entry → exit:** (1) FAB "+ ออเดอร์" on the queue → pick seat; (2) "สั่งออเดอร์" in the CD-08 table summary sheet (seat known). Exit: sent → queue; discard → queue.
- **Outcome:** 2 taps per drink (no-option item: tap row → add; assumes default quantity 1); retry never duplicates an order; sold-out / expired promo caught before send.
- **Out of scope:** payment, close, void/comp, bottle-keep orders, guest profile, customer QR ordering (CD-06).
- **Journeys:** J1 seated T3, 2× ช้างดราฟต์ + 1× โอลด์แฟชั่น (E1–E7) · J2 free seat C3: open then order, or POS opened it first → confirm before joining (E1–E4b).

## 2. Boards & images
Images: export at approval to `docs/design/img/CD-14/<board>.png` (pending — Field, canvas Share › Export).

| Board | Type | States |
|---|---|---|
| `overview` | OVERVIEW | cover: goal, pain point, user/context, outcome, entry/exit, journeys, out of scope, key decisions |
| `journey-1` | JOURNEY | queue → T3 → menu → ช้างดราฟต์ qty sheet (2) → โอลด์แฟชั่น item sheet → cart → sent (E1–E7) |
| `journey-2` | JOURNEY | queue → seat sheet (C3 free) → opening → 4a opened (201) · 4b collision (200 attached) → **confirm dialog** (who/when/guest) → 5b joined after "สั่งเข้าโต๊ะเดิม" (E1, E2, E3a, E3b, E4b) |
| `menu` | STATES | 1 loaded · 2 loading · 3 error + retry · 4 no result · 5 added from sheet (Toast) · 6 360×780 · 7 promo category (DR-010) · 8 disconnected · 9 typing + long names (2-line clamp) + keyboard |
| `item-sheet` | STATES | 1 default · 2 required missing · 3 max toppings · 4 no-option item (qty + สั่งโดย + หมายเหตุ) |
| `leave` | STATES | discard-cart dialog |
| `cart` | STATES | 1 normal · 2 charge "คิดกับใคร?" · 3 sending · 4 success → queue · 5 sold out (409) · 6 network error · 7 visit closed (409) · 8 360×780 · 9 promo expired (409) · 10 long text · 11 permission revoked (403) |
| `seat-sheet` | STATES | 1 loading · 2 error + retry · 3 no `visits:open` (free seats locked) — default / opening / attached are in J2 |
| `flow` | FLOW MAP | from queue · from table (options + charge) · leave & errors |

## 3. State coverage
✓ = drawn (board · state) · n/a = does not apply (reason) · shared = drawn elsewhere.

| State | Seat sheet | Menu | Item sheet | Cart | Leave |
|---|---|---|---|---|---|
| default | ✓ J2·2 | ✓ menu·1 | ✓ ·1 / ·4 | ✓ ·1 | ✓ |
| loading | ✓ ·1 | ✓ ·2 | n/a (data from menu) | n/a (local) | n/a |
| empty | n/a (seeded seats) | ✓ ·4 no result | n/a | n/a (bar hidden when empty) | n/a |
| error + retry | ✓ ·2 | ✓ ·3 | n/a | ✓ ·6 | n/a |
| validation | n/a | n/a | ✓ ·2 / ·3 | ✓ ·2 (charge name) | n/a |
| pending | ✓ J2·3 | n/a | n/a (local add) | ✓ ·3 | n/a |
| success feedback | ✓ J2·4a | ✓ ·5 | shared menu·5 | ✓ ·4 | n/a |
| failure per reason | ✓ ·3 (403 → locked) | n/a | n/a | ✓ ·5 ·7 ·9 ·11 | n/a |
| stale / conflict | ✓ J2·4b confirm → 5b | ✓ ·7 / realtime | n/a | ✓ ·5 ·9 | n/a |
| disconnected | shared menu·8 pattern | ✓ ·8 | n/a | shared ·6 | n/a |
| permission denied | ✓ ·3 | n/a (entry hidden, R7) | n/a | ✓ ·11 | n/a |
| long Thai text | n/a (seat labels short) | ✓ ·9 | shared cart·10 | ✓ ·10 | n/a |
| smallest size | shared (fits 360) | ✓ ·6 | rule R3 (body scrolls) | ✓ ·8 | n/a |
| keyboard open | n/a | ✓ ·9 | rule §9 (sheet rises above keyboard) | n/a | n/a |
| session expired | global: 401 → CD-08 login, cart lost (R6) | ← | ← | ← | ← |

## 4. Action table
| Action | API (status) | Permission | Success → UI | Failure → UI | Recovery | Data kept | Idempotency |
|---|---|---|---|---|---|---|---|
| Open seat sheet | `GET /tables` (available, BRIEF-011) | `tables:read` | sheet with live chips (J2·2) | network → seat-sheet·2 | retry | — | n/a |
| Pick seated seat | none (uses `currentVisit.id` from `/tables`) | `orders:create` (entry hidden without, R7) | menu for that visit (J1·3) | — | — | — | n/a |
| Open free seat | `POST /visits {tableSeatId}` (available, BRIEF-011) | `visits:open` (free tiles locked without, seat-sheet·3) | `201 attached:false` → menu, chip เปิดแล้ว, Toast "เปิดโต๊ะ C3 แล้ว" (J2·4a) · `200 attached:true` → **confirm dialog** (J2·4b): "สั่งเข้าโต๊ะเดิม" → menu, chip มีแขก, info Toast (J2·5b) · "เลือกโต๊ะอื่น" → back to sheet, C3 shown seated | network → Toast error, stay on sheet · 403 → lock tiles + Toast | retry (safe) | — | not needed: attach returns the live visit and creates nothing; cancel has no side effect |
| Load menu | `GET /menu/categories`, `GET /menu/items` (planned: menu-management brief) | `menu:read` | rows with `available_now` + window | network → menu·3 · socket down → menu·8 | retry; refetch every 60 s + on `menu.availability_changed` | cart | n/a |
| Add item | client; item detail `GET /menu/items/:id` (planned) | — | badge + cart bar + Toast (menu·5) | required option missing → FieldError (item-sheet·2) · sold out / out of window → row not tappable | pick option | cart (memory, R6) | — |
| Charge item | client | — | line with "ค่าบริการ" | no name → add disabled (cart·2) | pick name | cart | — |
| Send order | `POST /visits/:visitId/orders` + `Idempotency-Key` (planned, BRIEF-012) | `orders:create` | `201` → queue, Toast, new card highlighted (cart·4) | `409 ITEM_UNAVAILABLE {reason: sold_out\|out_of_window, itemIds}` → void lines (cart·5 / ·9) · `409 INVALID_STATE_TRANSITION` → cart·7 · `403` → cart·11 · network / timeout → cart·6 | remove void lines · retry · back to queue | cart until `201` | key created on first send of this cart; **reused** on retry/timeout (a timeout after a successful submit replays the original order); **new key** after any cart edit or after `201` |
| Discard cart | client | — | dialog → queue (leave) | — | อยู่ต่อ | cart cleared | key dropped |

## 5. e2e script
- **J1** E1 tap FAB "ออเดอร์" → seat sheet visible · E2 tap T3 → header "สั่งออเดอร์ — T3" · E3 tap ช้างดราฟต์ → short sheet (no option groups) · E4 stepper → 2, เพิ่มลงตะกร้า → row badge 2, bar "ตะกร้า 2 รายการ · ฿240.00" · E5 tap โอลด์แฟชั่น → item sheet · E6 defaults + เพิ่มลงตะกร้า, open cart → total ฿520.00 · E7 ส่งออเดอร์ → queue, Toast "ส่งออเดอร์ T3 แล้ว · 3 รายการ", new card highlighted; exactly one `POST …/orders` with an `Idempotency-Key`.
- **J2** E1 tap FAB · E2 tap free C3 → Spinner, other seats disabled · E3a `POST /visits` → `201 attached:false` → menu C3 chip เปิดแล้ว + success Toast · E3b `POST /visits` → `200 attached:true` → confirm dialog shows opener, time, guest label; menu NOT opened yet · E4b tap "สั่งเข้าโต๊ะเดิม" → menu C3 chip มีแขก + info Toast; no second visit exists · alt: tap "เลือกโต๊ะอื่น" → sheet, C3 seated, no visit changed.
- **Edge:** timeout then retry with the same key → one order · edit cart after a 409 → next send uses a new key · without `visits:open` free seats are not tappable.

## 6. Strings
- **Seat sheet:** สั่งให้โต๊ะไหน? · เคาน์เตอร์ · โต๊ะ · เปิดโต๊ะและสั่ง · กำลังเปิด… · ให้ POS เปิด · "บัญชีนี้สั่งได้เฉพาะโต๊ะที่เปิดแล้ว — โต๊ะว่างให้ POS หรือผู้จัดการเปิด" · โหลดโต๊ะไม่สำเร็จ · Toast "เปิดโต๊ะ C3 แล้ว" / "เลือกเมนูเพื่อเริ่มสั่งได้เลย" · Dialog "C3 เพิ่งถูกเปิดไปแล้ว" · เปิดโดย / เวลา / แขก · "ถ้าเป็นลูกค้ากลุ่มเดียวกัน ออเดอร์จะเข้าบิลเดียวกัน — ถ้าเป็นคนละกลุ่ม ให้เลือกโต๊ะอื่น" · สั่งเข้าโต๊ะเดิม (กลุ่มมิ้นท์) · เลือกโต๊ะอื่น · Toast "สั่งเข้าโต๊ะ C3 ของกลุ่มมิ้นท์" / "ออเดอร์จะเข้าบิลเดียวกัน".
- **Menu:** สั่งออเดอร์ — T3 · ค้นหาเมนู · ทั้งหมด · โปรโมชั่น · เบียร์สด · ค็อกเทล · ไฮบอล · อาหาร · ค่าบริการ · มีตัวเลือก · ค่าบริการ · ต้องระบุชื่อ · เริ่มต้น ฿260.00 · โปร · ถึง 21:00 · โปร · เริ่ม 22:00 (ศ.–ส.) · ตะกร้า n รายการ · ดูตะกร้า · โหลดเมนูไม่สำเร็จ / "ตรวจการเชื่อมต่อแล้วลองอีกครั้ง ตะกร้าที่เลือกไว้ยังอยู่" · ลองอีกครั้ง · ไม่พบเมนูที่ค้นหา / "ลองค้นหาด้วยคำอื่น หรือเลือกหมวด ทั้งหมด" · การเชื่อมต่อขาด / "สถานะเมนูอาจไม่ล่าสุด — ยังสั่งได้ ระบบตรวจของหมด / โปรหมดเวลาอีกครั้งตอนส่ง" · Toast "เพิ่ม ช้างดราฟต์ ×2 แล้ว" / "สั่งโดย ต้น · แก้ได้ในตะกร้า".
- **Item sheet:** ตัวเลือก · ต้องเลือก 1 · ท็อปปิ้ง · ไม่บังคับ · สูงสุด 2 · ระดับน้ำแข็ง · ก้อนใหญ่ / ปกติ / ไม่ใส่ · สั่งโดย · + ชื่อใหม่ · หมายเหตุ (ไม่บังคับ) / "เช่น หวานน้อย" · เพิ่มลงตะกร้า · ฿280.00 · "กรุณาเลือกระดับน้ำแข็ง" · "เลือกได้สูงสุด 2 — เอาออกก่อนเพื่อเลือกอันอื่น".
- **Cart:** ตะกร้า · T3 · รายการใหม่สั่งโดย · สั่งโดย {name} · ค่าบริการ · รวม · ส่งออเดอร์ · คิดกับใคร? · "ค่าบริการต้องระบุชื่อลูกค้า" · หมดแล้ว — ลบออกเพื่อส่งต่อ · หมดเวลาโปร — ลบออกเพื่อส่งต่อ · ลบออก · "มีรายการที่หมดแล้ว 1 รายการ" / "ลบออกก่อนจึงจะส่งได้" · "โปรหมดเวลาแล้ว 1 รายการ" / "โปรนี้ถึง 21:00 — ลบออก หรือสั่งเมนูปกติแทน" · "ส่งออเดอร์ไม่สำเร็จ ลองอีกครั้ง" / "ตะกร้ายังอยู่ครบ — ส่งซ้ำจะไม่เกิดออเดอร์ซ้ำ" · ลองส่งอีกครั้ง · "โต๊ะนี้ถูกปิดแล้ว" / "ออเดอร์ไม่ถูกส่ง เลือกโต๊ะใหม่จากคิวออเดอร์" · กลับไปคิวออเดอร์ · "บัญชีนี้ไม่มีสิทธิ์ส่งออเดอร์แล้ว" / "ตะกร้ายังอยู่ — ให้ผู้จัดการตรวจสิทธิ์ หรือให้พนักงานอื่นส่งแทน" · Toast "ส่งออเดอร์ T3 แล้ว · n รายการ" / "#0045 · ฿620.00".
- **Leave:** ยกเลิกตะกร้า? · รายการในตะกร้าจะไม่ถูกส่ง · อยู่ต่อ · ทิ้งตะกร้า.

## 7. Layout & tokens
Pushed stack screen (no tab bar): header top pad 48, IconButton back + title `--text-title` + table StatusChip. SearchField full width (gutter 16), height 44. Category chips = DS Tag, horizontal scroll. Menu rows min 60, name `--fs-subhead`/600 clamped to 2 lines, price bold tabular accent, hairline dividers. Cart bar: `--surface-bar` + blur + grab handle, total `--fs-subhead` bold, primary lg "ดูตะกร้า"; pull up or tap → cart BottomSheet (top 56, radius `--r-sheet`). Item sheet: option rows 48 (selected `--accent-soft` + `--line-accent`, invalid `--danger` border), sticky footer stepper lg + primary lg block. Seat tiles 72, 3/row, gap 8. FAB: primary lg, right 16, 92 above bottom, `--shadow-raised`. Touch targets ≥ 44, primary 52.

## 8. Components → platform
| Design system | Expo (HeroUI Native) | Notes |
|---|---|---|
| Button / IconButton | Button / Button `isIconOnly` | primary lg = 52 |
| SearchField | SearchField | full width, 44 |
| Tag | Chip (selectable) | category + name chips |
| StatusChip | Chip (custom tones) | table / menu / order |
| Badge | Chip size sm | count, "ค่าบริการ", "หมดเวลาโปร" |
| Card / rows | Card / Pressable rows (ListGroup) | |
| Dialog | Dialog (alert) | canvas drew it from tokens |
| Radio / Checkbox | RadioGroup / CheckboxGroup | wrapped in 48 px option rows |
| QuantityStepper | NumberField | |
| Alert · Toast · Skeleton · EmptyState · Spinner | same names | Toast has no action buttons |
| — | BottomSheet | seat sheet, item sheet, cart, charge |
| custom | `SeatTile` (`app/mobile/src/components/table/`, `compact` 72 px) | from CD-08 R4 |
| custom | CartLine, CartBar | composition of the above |

## 9. Behaviour rules
- **No quick add on the staff app** (Field 10 Oct; POS keeps it): every item opens the item sheet; no-option items get the short sheet. Charge item → "คิดกับใคร?" first.
- Cart newest-first; name chips set `สั่งโดย` for new lines only. Cart bar hidden while the keyboard is open; item sheet rises above the keyboard (หมายเหตุ field stays visible).
- Free seat: `POST /visits`; attach (`200 attached:true`) is a normal outcome, not an error — but the app **never joins silently**: it shows the confirm dialog (opener, time, guest label) first (Field 2026-10-10). One live visit per seat stays the rule; a different group picks another seat.
- Realtime `menu.availability_changed` updates rows and void lines live; menu refetches every 60 s while open (DR-010 rule 12). Disconnected: ordering still allowed; server re-validates on send.
- Promos (DR-010): server decides the window; out-of-window rows greyed, tap does nothing; expired promo in cart → same void-line flow as sold out.
- Status never by colour alone (chips carry text). User-mindset checks (`cd-template.md` §5): ✓ dominant action per screen · ✓ targets · ✓ acknowledgement < 1 s (Toast / pending) · ✓ discard cart confirmed · ✓ every error says how to fix · ✓ "2 taps per drink" with its assumption · ☐ large-text Thai (not yet drawn) · ☐ walkthrough with staff (before final presentation).

## 10. Revisions
| Rev | Date | Change | Authority |
|---|---|---|---|
| 1 | 2026-10-10 | first canvas (pick-seat, menu, item sheet, cart, leave, flow) | Cowork, brief D1–D3 |
| 2 | 2026-10-10 | Journey pilot (J1, J2), full-width search, **no quick add**, DR-010 promo states, highlight fix; R1 queue keeps CD-08 order · R2 seat tiles 3/row · R3 ice in one row · R4 CD-08 sheet gets "สั่งออเดอร์" · R5 "ค่าบริการ" badge neutral — **approved** | Field |
| 3 | 2026-10-10 | collision now asks before joining (J2 4b dialog → 5b) — Field · CD template pilot: overview + seat-sheet boards, menu 8–9, cart 10–11, YAML header, state matrix, action table; J2 E3b corrected to `200 attached:true` (BRIEF-011) | Cowork — awaiting Field (R6–R8) |

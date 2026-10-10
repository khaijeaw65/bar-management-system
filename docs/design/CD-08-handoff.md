---
id: CD-08
title: Staff app — login, order queue, order detail + status, tables, more
revision: 2
status: review            # rev 1 approved 2026-10-10 (R1–R5); rev 2 = CD template retrofit, R6–R7 + R12–R16 decided, canvas rev 3 drawn; R8–R11 parked (Field 10 Oct)
approved_by: Field        # rev 1
approved_on: 2026-10-10   # rev 1
canvas: https://claude.ai/artifact/E1EzrLh3piE3esih4VyRwB
canvas_version: 1791642402-add2
ds_version: 1791561405-c72e
source: docs/design/source/CD-08/   # taken after rev 2 approval (§11)
surfaces: [expo-staff]
sizes: [390x844, 360x780]
brief: CD-08-staff-app-core.md
drs: [DR-002, DR-003, DR-005, DR-009, DR-011, DR-012]
depends_on: [CD-00, CD-02, CD-14, CD-15]
supersedes: brief paste text and acceptance where they conflict (see brief "Revisions")
---

# CD-08 — Staff app: login, queue, detail, tables, more

Built on The Loft Bar Design System (real DS components mounted; every board has a dark/light Theme tweak). **Do not port canvas markup** — build with HeroUI Native + Uniwind + tokens (`docs/rules/mobile.md`). Sample data only. Template: `cd-template.md` · board rules: `board-convention.md` · reference example: `CD-14-handoff.md`.

## 0. Review items
Rev 1 items R1–R5 accepted by Field 2026-10-10 (summary in §10). Rev-2 items (✓ = accepted):

| # | Item | Recommendation |
|---|---|---|
| R6 ✓ | **Pain point = field research at both bars** (Field 2026-10-10, not an assumption). Same root as CD-14 R8: orders on paper or verbal, no single place everyone sees. For CD-08: staff don't know which table is waiting, or what has already been served. | Done. |
| R7 ✓ | **"+ ออเดอร์" FAB stays bottom-right** on every queue state (entry 1 of CD-14; hidden without `orders:create`). **Card layout changed instead** (Field 2026-10-10): status chip + who accepted move to the top row; the status button sits bottom-left, max 190 px wide, so it is never under the FAB (FAB x 234–374, button x 30–220 at 390 wide); list bottom padding 160 so the last card scrolls clear. A tap that lands under the FAB can only hit card body (opens detail — harmless), never a status change. Applied to CD-14 too (CD-14 rev 4). | Done. |
| R8 | **Table summary sheet** gets the primary "สั่งออเดอร์" (CD-14 R4, already accepted) **and a new "เสิร์ฟแล้ว" section** listing the visit's served orders (time served + items). Answers "what has already been served". Data: `GET /orders?visitId=` (planned BRIEF-012). | Accept. |
| R9 | **After "เสิร์ฟแล้ว"**: success Toast "เสิร์ฟ #0041 แล้ว · C2" and the card leaves the queue. **No undo** — there is no API to revert `sent`; a mis-tap is fixed at the POS. One tap, no confirm (speed at the bar). | Accept for S1. |
| R10 | **Needs API** (not in any brief yet): (1) `GET /orders/:id` — push tap when the order is not in the queue cache (e.g. already served) → BRIEF-012; (2) staff acknowledge of a call-staff ("รับทราบ") — clears `staffCalled` → customer-QR brief; (3) register Expo push token (DR-003 `staff_push_token`) → notifications brief; (4) realtime room for the staff app — BRIEF-011 emits to room `pos` only → BRIEF-012. | Accept; Cowork adds them when writing those briefs. |
| R11 | **Filter behaviour**: single select, "ทั้งหมด" default; when an action moves a card out of the active filter it leaves the list at once, counts update, the Toast confirms (no lingering card). | Accept. |
| R12 ✓ | **After "ส่งให้ POS"** (Field 2026-10-10): the manager at the POS cancels the item or substitutes (CD-15) → `order.status_changed` → the phone shows the order back in กำลังเตรียม, the cancelled item struck through with "ยกเลิกโดย POS · ของหมด", and an info Toast "POS แก้ #0040 แล้ว — ยำหมูยอ ถูกยกเลิก — แจ้งลูกค้าโต๊ะ T2" so staff tell the guest (J2 E5, detail·12). **Open question for CD-15 / BRIEF-012:** if every item of an order is cancelled, which status ends the order? (`order_status` has no `cancelled`.) | Done; question carried to CD-15. |
| R13 ✓ | **Persistent mobile session** (Field 2026-10-10 → DR-005 Amendment 2): tokens in SecureStore, refresh rotation, **mobile refresh TTL 30 days sliding** (web stays 7). No re-auth before actions: the phone cannot move money (void / pay / close = POS, DR-009), every action is permission-checked and audited with the staff id, and the owner can revoke one device instantly (`sid`). Login·5 now = "ถูกออกจากระบบ" with the real causes (own logout, device revoked, unused > 30 days). | Done. |
| R14 ✓ | **Simultaneous "รับออเดอร์"** (Field 2026-10-10): server transitions only from the expected state (conditional update) → first wins; the second gets `409 INVALID_STATE_TRANSITION` with the current order incl. who changed it → **info** Toast "เอ รับออเดอร์ #0041 แล้ว / ไม่ต้องทำซ้ำ" (not a warning). Card + detail chip show **"กำลังเตรียม · ชื่อ"** (label per R16) so two bartenders never make the same drinks. Name = `order_record.updated_by` (no schema change). | Done; BRIEF-012 returns `updatedBy { staffId, displayName }` on orders and in the 409 body. |
| R15 ✓ | **When to tap** (Field 2026-10-10 → DR-011): รับออเดอร์ = I start it (claims it) · พร้อมแล้ว = all items made, waiting at the pass for a runner · เสิร์ฟแล้ว = reached the guest, whoever carried it taps. **Counter seats** (`table_seat.kind = counter`): กำลังเตรียม → เสิร์ฟแล้ว in one tap (bartender hands it over; READY skipped). Tables keep 3 steps. | Done; FRD §6 updated; BRIEF-012 allows `accepted → sent` for counter seats only. |
| R16 | **DR-012 order status granularity** (Field 2026-10-10, approved): (1) `accepted` label "กำลังทำ" → **"กำลังเตรียม"** everywhere (chip, filter, Toasts, "กำลังเตรียม · ชื่อ"); (2) **no item progress chips** — an item row shows only "ยกเลิก" (struck) when cancelled; (3) **station tickets:** a placement with drinks + food arrives as **two cards** (bar / kitchen), each with its own status and button; charge-only tickets never appear (created as `sent`); (4) every item cancelled → ticket `cancelled`, leaves the queue. | Canvas rev 3: relabel chips + filter; drop item chips on detail; add a station label on card + detail (proposed "T3 · ต้น · บาร์" / "· ครัว" — Field confirms wording); J1 uses a mixed placement (beer served before fries). |

## 1. Overview
- **Goal:** staff see every order and every table in one place, change status in one tap, and know at once which table is waiting and what has been served.
- **Pain point (field research, 2 bars — R6):** orders written on paper or said aloud; nowhere everyone can see → staff don't know which table is waiting or what has already been served. Root shared with CD-14 R8.
- **User + context:** bartender / server · Friday 22:00, full bar, dim light, wet hands, one hand on the phone; works the queue first-in first-out.
- **Entry → exit:** open app → LINE login → queue · push tap → order detail. Exit: new order → CD-14 · issue that can't be fixed on the phone → POS (CD-15) · payment / close table → POS.
- **Outcome:** 1 tap per status change from the queue card (assumes the order needs no detail check); counter seats need 2 taps per order (รับ → เสิร์ฟ), tables 3; new orders appear without refresh (realtime + push); two devices pressing at once always end on the latest state, and the card says who is making it.
- **Out of scope:** new order (CD-14), payment, close table, reject / remove / void items (POS), guest profile, AI summary, bottle keep (CD-09, S2), iPad layouts.
- **Journeys:** J1 #0044 T3: accept → ready → served → visible as served in the T3 summary (E1–E5) · J2 #0040 T2 ยำหมูยอ sold out: report issue → send to POS → POS cancels the item, phone shows the result (E1–E4 + E5 system; alternate "แก้แล้ว ทำต่อ").

## 2. Boards
Images: none exported for rev 2 (optional, presentation only). Rev-1 screenshots in `docs/design/assets/CD-08/` are **stale**.

| Board | Type | States |
|---|---|---|
| `overview` | OVERVIEW | goal, pain point, user/context, outcome, entry/exit, journeys, out of scope, key decisions |
| `journey-1` | JOURNEY | queue (E1 รับออเดอร์ on #0044) → กำลังเตรียม · บีม (E2 พร้อมแล้ว) → พร้อมเสิร์ฟ (E3 เสิร์ฟแล้ว) → Toast + card gone (E4 tab โต๊ะ) → tables (E5 T3) → summary: #0044 under เสิร์ฟแล้ว, #0039 still ยังไม่เสิร์ฟ |
| `journey-2` | JOURNEY | queue (E1 card #0040) → detail ใหม่ (E2 รายงานปัญหา) → sheet ของหมด + ยำหมูยอ (E3) → issue state (E4 ส่งให้ POS; alt แก้แล้ว ทำต่อ) → escalated → E5 system: POS cancels ยำหมูยอ → detail กำลังเตรียม, item struck, Toast (success) |
| `login` | STATES | 1 default · 2 signing in · 3 failed · 4 not registered (request sent) · 5 signed out (401: own logout / device revoked / unused > 30 days — rare, R13) |
| `queue` | STATES | 1 loaded · 2 loading · 3 empty (filter ใหม่) · 4 error + retry · 5 new order (realtime) · 6 disconnected · 7 accepted by someone else first (409 → info Toast, R14) · 8 no `orders:update_status` (read-only) · 9 360×780 + long Thai · 10 counter seat กำลังเตรียม → เสิร์ฟแล้ว (R15) |
| `detail` | STATES | 1 ใหม่ · 2 กำลังเตรียม · บีม · 3 พร้อมเสิร์ฟ · 4 เสิร์ฟแล้ว · 5 pending · 6 409 (other change) · 7 loading (from push) · 8 network failure · 9 read-only · 10 360×780 + long Thai · 13 ten-item order, top (header "10 รายการ · 14 ชิ้น") · 14 ten-item order scrolled to the end (back bar fixed, last item clears the footer) · 11 counter กำลังเตรียม → เสิร์ฟแล้ว (R15) · 12 resolved by POS, item cancelled (R12) |
| `issue` | STATES | 1 report sheet · 2 issue state · 3 escalated · 4 อื่นๆ without detail (validation) + keyboard open |
| `tables` | STATES | 1 loaded · 2 call-staff (T2) · 3 summary sheet (ยังไม่เสิร์ฟ / เสิร์ฟแล้ว / สั่งออเดอร์) · 4 loading · 5 empty · 6 error + retry · 7 disconnected · 8 360×780 |
| `more` | STATES | 1 list · 2 logout dialog |
| `notifications` | STATES | a first-run permission · b lock-screen push copy · c in-app call-staff Toast |
| `flow` | FLOW MAP | bartender main path · shortcuts/status · tables & account · to CD-14 (FAB, สั่งออเดอร์) |

## 3. State coverage
✓ = drawn (board · state) · n/a = does not apply (reason) · shared = drawn elsewhere.

| State | Login | Queue | Detail | Issue sheet | Tables | Summary sheet | More |
|---|---|---|---|---|---|---|---|
| default | ✓ ·1 | ✓ ·1 | ✓ ·1–4 | ✓ ·1 | ✓ ·1 | ✓ tables·3 | ✓ ·1 |
| loading | ✓ ·2 | ✓ ·2 | ✓ ·7 | n/a (local form) | ✓ ·4 | shared tables·4 pattern (Skeleton cards in sheet) | n/a |
| empty | n/a | ✓ ·3 | n/a (order ≥ 1 item) | n/a | ✓ ·5 | ✓ J1·6 "ไม่มีออเดอร์ค้าง" | n/a |
| error + retry | ✓ ·3 | ✓ ·4 | shared queue·4 (Alert + ลองอีกครั้ง) | n/a | ✓ ·6 | shared tables·6 (Alert in sheet) | n/a |
| validation | n/a | n/a | n/a | ✓ ·4 | n/a | n/a | n/a |
| pending | ✓ ·2 | shared detail·5 (card button isPending) | ✓ ·5 | shared detail·5 (danger button isPending) | n/a | n/a | n/a |
| success feedback | n/a (lands on queue) | ✓ J1·4 Toast · in-place chip change J1·2–3 | ✓ in-place chip change | ✓ ·2 / ·3 | n/a | n/a | n/a |
| failure per reason | ✓ ·3 ·4 | ✓ ·7 (409 taken) | ✓ ·6 (409) ·8 (network) | shared detail·6 / ·8 | ✓ ·6 | shared tables·6 | n/a |
| stale / conflict | n/a | ✓ ·7 | ✓ ·6 ·12 | shared detail·6 | realtime (rule §9) | realtime (rule §9) | n/a |
| disconnected | n/a | ✓ ·6 | shared queue·6 banner | n/a | ✓ ·7 | shared tables·7 | n/a |
| permission denied | ✓ ·4 (not registered) | ✓ ·8 | ✓ ·9 | n/a (entry hidden with ·9) | n/a (`tables:read` is base) | rule R7: "สั่งออเดอร์" hidden without `orders:create` | n/a |
| long Thai text | n/a (fixed copy) | ✓ ·9 | ✓ ·10 | shared detail·10 (wraps) | rule §9 (guest line 1 line) | rule §9 | n/a |
| smallest size | shared (centred, fits 360) | ✓ ·9 | ✓ ·10 | rule §9 (body scrolls, footer fixed) | ✓ ·8 | rule §9 | shared |
| keyboard open | n/a | n/a | n/a | ✓ ·4 | n/a | n/a | n/a |
| signed out | ✓ ·5 — global: any 401 after a failed refresh → login·5 (rare, R13) | ← | ← | ← | ← | ← | ← |

## 4. Action table
| Action | API (status) | Permission | Success → UI | Failure → UI | Recovery | Data kept | Idempotency |
|---|---|---|---|---|---|---|---|
| Log in with LINE | `POST /auth/mobile/token` (planned, mobile auth brief — DR-005) | public | first run → notifications·a, else queue; stays signed in (refresh 30 days sliding, R13) | `login_failed` → login·3 · `NOT_REGISTERED` → login·4 (access request: `staff_access_request`, creation planned with CD-13/IAM) | retry · wait for owner | — | n/a |
| Load queue | `GET /orders?status=pending,accepted,ready,issue` (planned BRIEF-012; mocked in BRIEF-010) | `orders:read` | queue·1, oldest first | network → queue·4 · socket down → queue·6 | ลองอีกครั้ง / pull-to-refresh; socket auto-reconnect then refetch | filter | n/a |
| Receive new order / status change | WS `order.created`, `order.status_changed` (planned BRIEF-012; staff-app room = R10-4) | `orders:read` | card inserted at its time position, highlighted + Toast + tab badge (queue·5) | socket down → queue·6 | reconnect + refetch | — | event carries the order id; client upserts by id |
| Accept / ready / served (card or detail) | `POST /orders/:id/accept` · `/ready` · `/send` (planned BRIEF-012; `/send` accepts `accepted` for counter seats, R15) | `orders:update_status` | chip ("กำลังเตรียม · ชื่อ") + button change in place (J1·2–3); `send` → success Toast, card leaves queue (J1·4, R9) | `409 INVALID_STATE_TRANSITION` + current order with `updatedBy`: the order already reached this step by someone else → info Toast "เอ รับออเดอร์ #0041 แล้ว" (queue·7, R14); any other current state → warning Toast + latest state (detail·6) · `403` → read-only (queue·8 / detail·9) · network / timeout → danger Toast, state unchanged (detail·8) · `401` → login·5 | tap again after checking · ask manager | — | state-checked server side: a replayed transition returns 409 and the UI shows the latest state — never a double change |
| Open detail | from queue cache; from push → `GET /orders/:id` (**needs API**, R10-1) | `orders:read` | detail | loading → detail·7 · not found / network → Alert + ลองอีกครั้ง (queue·4 pattern) | retry · back | — | n/a |
| Report issue | `POST /orders/:id/flag-issue {reason, itemId?, note?}` (planned BRIEF-012) | `orders:update_status` | sheet closes → issue·2 (all devices via `order.status_changed`) | `อื่นๆ` without note → issue·4 · 409 / network → as above, sheet stays open | fill note · retry | sheet input | as above |
| Resolve issue | `POST /orders/:id/resolve {resolution: substitute \| escalate, note?}` (planned BRIEF-012) | `orders:update_status` | `substitute` → กำลังเตรียม · `escalate` → issue·3 + badge "ส่งให้ POS แล้ว" (J2·5) | 409 / network → as above | retry | — | as above |
| Receive POS resolution | WS `order.status_changed` + `order_item.status_changed` (planned BRIEF-012, from CD-15 actions) | `orders:read` | detail·12: back to กำลังเตรียม, cancelled item struck, info Toast "POS แก้ #0040 แล้ว" (R12); push to the staff who escalated | socket down → refetch on reconnect | — | — | upsert by id |
| Load tables | `GET /tables` (available, BRIEF-011) | `tables:read` | tables·1 | network → tables·6 · socket down → tables·7 | retry · reconnect | — | n/a |
| Live seats | WS `visit.opened`, `visit.state_changed` (BRIEF-011, room `pos` — staff room R10-4) | `tables:read` | tile updates | — | refetch on reconnect | — | n/a |
| Open table summary | `currentVisit` from `/tables` + `GET /orders?visitId=` (planned BRIEF-012) | `orders:read` | tables·3: ยังไม่เสิร์ฟ / เสิร์ฟแล้ว (R8) | network → Alert + retry in sheet (tables·6 pattern) | retry | — | n/a |
| สั่งออเดอร์ (summary) | client nav → CD-14 menu for this visit | `orders:create` (hidden without, R7) | CD-14 J1·3 | — | — | — | — |
| + ออเดอร์ (queue FAB) | client nav → CD-14 seat sheet | `orders:create` (hidden without) | CD-14 J1·2 | — | — | — | — |
| Acknowledge call-staff | **needs API** (R10-2); `staffCalled` placeholder in BRIEF-011, filled by customer-QR brief | — | sticky Toast closes, T2 back to normal skin | — | — | — | — |
| Enable notifications | OS permission (expo-notifications) + register token — **needs API** (R10-3, DR-003) | — | queue; More shows "เปิดอยู่" | denied → More "ปิดอยู่" → opens OS settings | อื่นๆ › การแจ้งเตือน | — | token upsert (UNIQUE `expo_push_token`) |
| Log out | `POST /auth/logout` (BRIEF-007; mobile variant with DR-005 brief) | session | dialog → login | network → still clear local session, go to login | — | — | n/a |

## 5. e2e script
- **J1** E1 tap "รับออเดอร์" on #0044 (T3) → chip "กำลังเตรียม · บีม", button "พร้อมแล้ว" at the card's left, count ใหม่ −1 · E2 tap "พร้อมแล้ว" → chip พร้อมเสิร์ฟ, button "เสิร์ฟแล้ว" · E3 tap "เสิร์ฟแล้ว" → Toast "เสิร์ฟ #0044 แล้ว · T3", #0044 not in the queue, ทั้งหมด 2 · E4 tap tab โต๊ะ → grid · E5 tap T3 → sheet "โต๊ะ T3", #0044 under "เสิร์ฟแล้ว" with time, #0039 under "ยังไม่เสิร์ฟ"; exactly one `POST /orders/:id/accept`, `/ready`, `/send` each.
- **J2** E1 tap card #0040 → detail #0040 chip ใหม่ · E2 tap "รายงานปัญหา" → sheet · E3 choose ของหมด + 1× ยำหมูยอ, tap "รายงานปัญหา" → chip มีปัญหา, Alert "ยำหมูยอ · ของหมด" · E4 tap "ส่งให้ POS" → badge "ส่งให้ POS แล้ว", only "แก้แล้ว ทำต่อ" left; one `flag-issue` + one `resolve {escalate}` · E5 (system) POS cancels the item → detail chip กำลังเตรียม, ยำหมูยอ struck through, Toast "POS แก้ #0040 แล้ว" · alt: tap "แก้แล้ว ทำต่อ" → chip กำลังเตรียม.
- **Edge:** second device accepts first → this device's tap shows the info Toast with the other name and the card "กำลังเตรียม · เอ", no second transition · counter seat: กำลังเตรียม card shows "เสิร์ฟแล้ว", one `/send` from `accepted` · อื่นๆ without detail → submit blocked with field error · read-only account → no action buttons anywhere.

## 6. Strings & sample data
Sample data lives in each board's `renderVals()` (Journey1, Detail, Tables) or literal markup (Queue, Issue, Journey2).
- **Tabs / header:** ออเดอร์ · โต๊ะ · อื่นๆ · FAB "ออเดอร์" (+ icon).
- **Filters:** ทั้งหมด n · ใหม่ n · กำลังเตรียม n · พร้อมเสิร์ฟ n · มีปัญหา n (red dot when > 0).
- **Card / detail actions:** รับออเดอร์ · พร้อมแล้ว · เสิร์ฟแล้ว · ดูปัญหา · รายงานปัญหา · "เสิร์ฟเมื่อ 20:41 น. · ไม่มีการทำงานต่อ".
- **Toasts:** ออเดอร์ใหม่ T5 / "3 รายการ · ต่อท้ายคิวแล้ว" · **เสิร์ฟ #{n} แล้ว · {seat} / "{items} · ดูได้ที่สรุปโต๊ะ"** · ออเดอร์นี้ถูกอัปเดตจากเครื่องอื่นแล้ว / "แสดงสถานะล่าสุดแล้ว ตรวจก่อนกดอีกครั้ง" · **{ชื่อ} รับออเดอร์ #{n} แล้ว / "ไม่ต้องทำซ้ำ — ข้ามไปออเดอร์ถัดไปได้เลย"** · **POS แก้ #{n} แล้ว / "{item} ถูกยกเลิก — แจ้งลูกค้าโต๊ะ {seat}"** · **บันทึกไม่สำเร็จ / "สถานะยังไม่เปลี่ยน ตรวจการเชื่อมต่อแล้วกดอีกครั้ง"** · T2 เรียกพนักงาน + รับทราบ.
- **Alerts:** โหลดออเดอร์ไม่สำเร็จ · การเชื่อมต่อขาด / "ข้อมูลอาจไม่อัปเดต กำลังเชื่อมต่อใหม่" · **โหลดโต๊ะไม่สำเร็จ / "ตรวจการเชื่อมต่อแล้วลองอีกครั้ง"** · **การเชื่อมต่อขาด / "สถานะโต๊ะอาจไม่ล่าสุด กำลังเชื่อมต่อใหม่"** · ลองอีกครั้ง.
- **Chips:** "กำลังเตรียม · {ชื่อคนรับ}" (order accepted) · item cancelled "ยกเลิก" + "ยกเลิกโดย POS {เวลา} · {สาเหตุ}".
- **Read-only:** **"บัญชีนี้ดูคิวได้อย่างเดียว — เปลี่ยนสถานะไม่ได้ ให้ผู้จัดการตรวจสิทธิ์"** · **"บัญชีนี้ดูได้อย่างเดียว — ให้ผู้จัดการตรวจสิทธิ์"**.
- **Login:** เข้าสู่ระบบด้วย LINE · เฉพาะพนักงาน The Loft Bar · กำลังเปิด LINE เพื่อยืนยันตัวตน · เข้าสู่ระบบไม่สำเร็จ / "ลองอีกครั้ง หากยังไม่ได้ ให้ตรวจว่าเปิดแอป LINE ในเครื่องนี้แล้ว" · บัญชี LINE นี้ยังไม่ได้ลงทะเบียน / "ส่งคำขอเข้าใช้งานถึงเจ้าของร้านแล้ว เข้าสู่ระบบอีกครั้งเมื่อได้รับอนุมัติ" · กลับไปหน้าเข้าสู่ระบบ · ติดต่อเจ้าของร้านหากรอนาน · **ออกจากระบบแล้ว / "เข้าสู่ระบบอีกครั้งเพื่อทำงานต่อ — เกิดเมื่อออกจากระบบเอง เจ้าของร้านถอนสิทธิ์เครื่องนี้ หรือไม่ได้เปิดแอปเกิน 30 วัน"**.
- **Issue:** รายงานปัญหา · สาเหตุ · ของหมด · อุปกรณ์มีปัญหา · อื่นๆ · รายการที่มีปัญหา (ไม่บังคับ) · รายละเอียด / "ต้องกรอกเมื่อเลือก อื่นๆ" · **error "กรอกรายละเอียดเมื่อเลือก อื่นๆ"** · ยกเลิก · มีปัญหากับออเดอร์นี้ · แก้แล้ว ทำต่อ · ส่งให้ POS · ส่งให้ POS แล้ว · "การลบหรือยกเลิกรายการทำที่ POS" · "ถ้าแก้เองได้แล้ว กดเพื่อทำต่อ — POS จะเห็นว่าแก้แล้ว".
- **Tables / summary:** โต๊ะ · เคาน์เตอร์ · "ใช้งาน 9 · ว่าง 4" · ยังไม่มีโต๊ะ · **ยังไม่เสิร์ฟ · เสิร์ฟแล้ว · "ไม่มีออเดอร์ค้าง" · "#0044 · เสิร์ฟ 21:22 น."** · **สั่งออเดอร์** · ชำระเงินและปิดโต๊ะทำที่ POS.
- **More / notifications:** unchanged from rev 1 (การแจ้งเตือน เปิดอยู่/ปิดอยู่ · ธีม ตามระบบ · เวอร์ชันแอป · ออกจากระบบ? · "เครื่องนี้จะไม่ได้รับการแจ้งเตือนออเดอร์จนกว่าจะเข้าสู่ระบบอีกครั้ง" · เปิดการแจ้งเตือน · ไว้ทีหลัง · push copy "ออเดอร์ใหม่ · T5" / "T2 เรียกพนักงาน" / "ออเดอร์ #0042 พร้อมเสิร์ฟ").
Bold = new in rev 2.

## 7. Layout & tokens
Tab screens: header top pad 56, title `--text-title`, clock `--text-small` tabular. Filter chips 44 high pill, horizontal scroll, gap 8. Cards (R7): DS `Card` padding 14, list gap 12, gutter 16, list bottom padding 160; row 1 = order no. + status chip (with acceptor name) left, time right; seat line `--text-subhead` 1 line; items `--text-small` 1 line each, max 3 + "+ n รายการ"; status button Button md (44) **left-aligned, max width 190** — never in the FAB column. FAB: primary lg (52), right 16, 92 above bottom, `--shadow-raised`, above the list, below Toasts. Tab bar `--surface-bar` + `--blur-bar`, icon 20, label `--fs-micro`. Detail (pushed, no tab bar): header top pad 48, qty pill 36×28 `--accent-soft-strong`; sticky footer padding 12/16/28, `--shadow-sheet`, buttons lg 52 (danger flex 1 + primary flex 1.4). BottomSheet radius `--r-sheet`, grab 36×4, `--surface-overlay` over `--scrim`; sheet rises above the keyboard. Seat tiles 84 (counter, 3/row) / 104 (table, 2/row), radius `--r-card`. Smallest size 360×780. Tailwind mapping: `app/frontend/src/app/globals.css` (BRIEF-014) — Expo theme mapping is the mobile brief's job.

## 8. Components → platform
| Design system | Expo (HeroUI Native) | Notes |
|---|---|---|
| Button | Button (primary / secondary / ghost / danger; md 44, lg 52; `isPending`) | DS has no success variant → "เสิร์ฟแล้ว" = primary (R3) |
| Card | Card / Pressable | `selected` = new-order highlight |
| StatusChip | Chip (custom tones) | order / item / table / menu sets, CD-00 §2 |
| Badge | Chip size sm | DS tone `info` = alias of `making` ("ส่งให้ POS แล้ว") |
| Alert · Toast · Skeleton · EmptyState · Spinner · Avatar | same names | Toast duration 0 for call-staff and 409 |
| Radio / Input | RadioGroup / TextField | `error` text under the field |
| Dialog | Dialog (alert) | logout |
| — | BottomSheet | issue report, table summary |
| — | Expo Router Tabs (themed) | 3 tabs |
| custom | `SeatTile` (`app/mobile/src/components/table/`) | R4; shared with CD-14 (`compact` 72) |
| custom | `OrderCard`, filter chip row | BRIEF-010 already names `OrderCard` |

## 9. Behaviour rules
- **Queue:** oldest first (FIFO). `sent` orders never show. One primary button per card = the next status. A card tap (outside the button) opens detail. New orders insert at their time position, highlighted (Card `selected`) until acted on or the user leaves the tab, + info Toast + tab badge.
- **Filters (R11):** single select; "ทั้งหมด" default and always available; tapping the active chip does nothing. Counts always reflect the whole queue. When an action moves a card out of the active filter, it leaves the list immediately; the Toast confirms. Empty filter → EmptyState for that filter.
- **Status:** per station ticket (D3, DR-012) — a mixed placement shows as two cards (bar / kitchen), each with a station label; item rows carry no progress chip, only "ยกเลิก" when cancelled; a ticket whose items are all cancelled becomes `cancelled` and leaves the queue. No reject / remove / void on the phone (D1, D2). Served = one tap, no confirm, no undo (R9).
- **Meaning of each tap (R15):** รับออเดอร์ = I start it (claims it; card shows my name) · พร้อมแล้ว = every item made, waiting at the pass (runners: filter พร้อมเสิร์ฟ + push) · เสิร์ฟแล้ว = reached the guest, tapped by whoever carried it. **Counter seats** skip พร้อมแล้ว: กำลังเตรียม shows "เสิร์ฟแล้ว" (DR-011).
- **Who is making it (R14):** accepted orders show "กำลังเตรียม · ชื่อ" on card, detail and table summary; the name is the staff who accepted.
- **Conflict:** every transition is a conditional update from the expected state. 409 where someone else already did this step → info Toast with their name (normal, nothing to fix); 409 for any other state → warning Toast + refetched order, look before tapping again. Network failure leaves the state unchanged and says so.
- **Permissions (known at login, ACL cache):** without `orders:update_status` action buttons are replaced by the read-only line; without `orders:create` the FAB and "สั่งออเดอร์" are hidden; a mid-session 403 switches to read-only after refetching permissions.
- **Realtime:** reconnect → refetch queue/tables; banner shows while disconnected; actions stay enabled (server re-validates).
- **Tables:** read-only grid. Summary sheet lists the visit's orders split ยังไม่เสิร์ฟ / เสิร์ฟแล้ว (served: newest first, time served), body scrolls when long; payment and close stay at the POS. Call-staff tile = accent skin + sticky Toast "รับทราบ" (ack needs API, R10-2).
- **Long orders:** card shows 3 lines then "+ n รายการ · รวม m ชิ้น" (pieces = sum of quantities); detail header shows "n รายการ · m ชิ้น" (cancelled excluded); detail list scrolls under a fixed back bar and footer with 120 px bottom padding so the last item clears the footer (detail·13–14). Lines keep entry order.
- **Card tap:** the whole card opens detail; the status button handles only its own press (RN: nested `Pressable` — the inner one wins, no `stopPropagation`; web: `e.stopPropagation()`); pressing the button never shows card pressed feedback; screen readers get the card summary as its label and the status step as an `accessibilityActions` entry.
- **Long Thai / small screen:** seat and item lines 1 line with ellipsis on cards; detail wraps names and notes fully; at 360×780 the list and sheet bodies scroll, footers stay fixed; guest names on tiles 1 line.
- **Session (R13):** stays signed in across restarts; access token refreshed silently; refresh 30 days sliding (DR-005 Amendment 2). Only a failed refresh (own logout, device revoked, unused > 30 days, reuse detected) → login·5; nothing unsent is kept (CD-14 R6).
- **After escalation (R12):** the phone waits for the POS; the result arrives by realtime + push to the staff who escalated; staff tell the guest.
- **Standard questions (`cd-template.md` §5):** Filters → above. Search → n/a (no search in CD-08). Long and short → 360×780 smallest, 390×844 design size; truncation as above; 0 orders → EmptyState. Interaction → DS Button pressed/disabled/pending states; DS motion tokens, no custom animation; new-card highlight only. Accessibility → filter row = group "ตัวกรองสถานะ"; each card's accessible name = "#0041 C2 ฟ้า ใหม่ 1 รายการ"; FAB label "ออเดอร์ใหม่"; seat tiles labelled with seat + state; reading order header → filters → list → FAB → tabs. Data → number/status/tableLabel/createdAt/items/orderedByName from `GET /orders`; "n นาทีที่แล้ว" client `timeAgo()`; seats + guestLabel from `GET /tables`; missing `orderedByName` → seat line shows the table only; missing `guestLabel` → no name line.
- **User-mindset checks:** ✓ one dominant action per screen · ✓ targets ≥ 44 / primary 52, FAB and footers in thumb reach · ✓ acknowledgement < 1 s (in-place chip change / pending / Toast) · ✓ meaningful loss: none on the phone (no void); served without undo accepted as R9 · ✓ every error says how to fix · ✓ task cost "1 tap per status from the card" · ✓ status never by colour alone (chips carry text) · ✓ long Thai drawn (queue·9, detail·10) · ☐ walkthrough with staff (before the final presentation).

## 10. Revisions
| Rev | Date | Change | Authority |
|---|---|---|---|
| 1 | 2026-10-09 | First canvas: login, queue, detail, issue, tables, more, notifications, flow (brief D1–D4) | Cowork, brief defaults |
| 1 | 2026-10-10 | R1 not-registered → access request sent · R2 LINE brand button · R3 served = primary · R4 custom SeatTile, counters 3/row · R5 escalated keeps only "แก้แล้ว ทำต่อ" — **approved** | Field |
| 2 | 2026-10-10 | Field review: R7 card layout (status button left ≤ 190 px, chip + acceptor on top, FAB kept) · R12 POS resolution in J2 + detail·12 · R13 persistent session, login·5 relabelled · R14 info Toast + acceptor name · R15 counter seats skip READY (queue·10, detail·11); J1 now follows #0044 at T3 | Field (R6, R7, R12–R15) · R8–R11 pending |
| 2 | 2026-10-10 | CD template retrofit: overview + journeys J1/J2, STATES / FLOW MAP pills; FAB (R7); summary sheet "สั่งออเดอร์" + "เสิร์ฟแล้ว" (R8); served Toast (R9); new states login·5, queue·7–9, detail·7–10, issue·4, tables·6–8; flow row to CD-14; `style` on DS buttons moved to wrappers (canvas gotcha); R6 pain point; R10 API gaps; R11 filter rule | Field (R6) · R7–R11 pending |
| 3 | 2026-10-10 | DR-012 (R16): label "กำลังเตรียม" (DR-012 Amendment 1 — was "รับแล้ว"), item chips removed (cancelled only), station tickets (two cards per mixed placement, station label), `cancelled` ticket — canvas rev 3 drawn (queue, journeys, detail, issue, tables, flow, overview; J2 #0040 = kitchen ticket ยำหมูยอ + ถั่วทอดสมุนไพร); detail·13–14 long order; card tap rule | Field (DR-012) |

## 11. Source snapshot
Pending — taken after Field approves rev 2 (`cd-template.md` §6): version pin, byte copy to `docs/design/source/CD-08/`, inventory + SHA-256, dependency closure (Lucide blob `/_blob/50b4e33ae4752b698e43636e0482591d`, CD-08 only), repo drift vs the Expo theme.

# CD-02 — POS: table grid, session panel, open-table

**Status:** Ready — Q1–Q3 decided by Field (2026-09-28) · **Surface:** web desktop/tablet (1280 px; also 1024 px) · **Used by:** Sprint 3 (session + order flow) — POS home `/pos/tables`

## Attach
**Open inside the existing Claude Design project** (Design systems tab → The Loft Bar Design System, not the home "What should we create?" box): https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457
`docs/design/CD-00-handoff.md` (status chips §2) · `docs/design/CD-01-handoff.md` (shell) · FRD §3 (tables/visits), §6 (orders), §8 (void/comp)

## Data this screen has (API catalog)
- `GET /api/tables` → per seat: `label`, `sortOrder`, `kind` (`table` | `counter`), current visit summary (`state`, `total`, `since`)
- `GET /api/visits/:id` → orders, items (`orderedByName`, status, modifiers, notes), totals, payments
- `POST /api/visits` `{ tableSeatId }` → first write wins, second attaches · `POST /api/visits/:id/close` → **409 if payment in flight**
- Realtime: `visit.opened`, `visit.state_changed`, `order.created`, `order_item.status_changed`, `staff.called`

## Decisions needed (Field)
- **Q1 — Counter vs table zones. ✅ Decided (Field, 2026-09-28): add `table_seat.kind` (`table` | `counter`).** FRD §15 has two zones but `table_seat` has no kind/zone column. **Recommend:** add `kind` enum (`table` | `counter`) to `table_seat`; the grid groups by it. Alternative: one flat grid sorted by `sort_order` (no schema change, weaker UX).
- **Q2 — Shared vs separate at open. ✅ Decided (Field, 2026-09-28): option A — tables are always shared (merge or split-equal); separate = counter seats only. Reason: simple, fits how groups pay in bars. Upgrade path if needed later: multiple visits per table (option C).** FRD §3 says separate = per-seat QR, but a *table* has no sub-seats in the schema. **Recommend (Phase 1):** no toggle in the open dialog. Counter seats are already one person each. A table that wants separate bills settles by split-equal (CD-03). Keeps the schema as is.
- **Q3 — QR reprint / regenerate. ✅ Decided (Field, 2026-09-28): draw both; add `POST /api/tables/:id/qr/regenerate`.** FRD §3 requires both, but no endpoint exists yet. **Recommend:** draw both in the table's action menu now, add `POST /api/tables/:id/qr/regenerate` (`tables:manage`) to the catalog; reprint = print the same token (client only).
- Note: `visit_state` has `abandoned` (auto-closed after ignored idle) — FRD state machine doesn't list it; drawn as a chip only, FRD §3 to be updated.

## Paste into Claude Design
> Work inside **The Loft Bar Design System** project. Extend CD-01's POS shell (top bar 56 px + PosRail 88 px, rail item "โต๊ะ" active). Thai copy, Noto Sans Thai, **tokens only**, **dark and light** for every artboard. HeroUI v3 components only (Card, Chip, Button, Drawer, Modal, Tabs, Alert, Skeleton, Toast, Dropdown, Input, RadioGroup, Badge, Tooltip); name the HeroUI component on each part. Table/visit chips use the CD-00 status set keyed by schema enums: no visit ว่าง · `open` เปิดแล้ว · `active` มีแขก · `idle` ไม่มีความเคลื่อนไหว · `closed` ปิดโต๊ะ · `abandoned` ทิ้งโต๊ะ · call-staff flag เรียกพนักงาน (solid accent + pulse dot). Artboards named `CD-02/<id>`. **Static state boards** — all states side by side, no clickable switchers. Every preview card renders standalone (Lucide loaded in-card, explicit 1280×800 size).
>
> 1. **CD-02/grid** — POS home. Header: "โต๊ะ" + summary chips "มีแขก 6 · ว่าง 8 · เรียกพนักงาน 1"; right: Button primary "+ เปิดโต๊ะ". Two sections: **"เคาน์เตอร์"** (seats C1–C8, compact cards ~120×96) and **"โต๊ะ"** (T1–T6, cards ~200×140). Card content by state: *ว่าง* — label only, muted; *เปิดแล้ว* — dashed accent border, "รอออเดอร์"; *มีแขก* — label, guest name(s) "ต้น, บีม", item count "5 รายการ", running total `฿1,240.00` (tabular numerals), time open "1:24"; *ไม่มีความเคลื่อนไหว* — warning tone + "ไม่มีความเคลื่อนไหว 25 นาที"; *เรียกพนักงาน* — pulse dot + chip, sorted visually prominent. Card with a pending order shows a small Badge "ออเดอร์ใหม่ 2". Selected card = accent ring. Draw at 1280 and 1024.
> 2. **CD-02/grid-states** — loading skeleton grid · empty "ยังไม่มีโต๊ะ — เพิ่มโต๊ะในหน้าตั้งค่า" · error Alert "โหลดข้อมูลโต๊ะไม่สำเร็จ" + "ลองอีกครั้ง" · realtime disconnected banner "การเชื่อมต่อขาด ข้อมูลอาจไม่อัปเดต" (warning Alert, top of grid).
> 3. **CD-02/panel** — click an occupied card → right **Drawer 400 px**, grid stays visible and dims slightly. Header: "โต๊ะ T3" + chip + "เปิด 1:24" + guest "ต้น" + close ✕ + Dropdown (⋯): "พิมพ์ QR ซ้ำ", "สร้าง QR ใหม่". Body: orders grouped by order (order time + order chip), each item row = item-status chip + name + modifiers/notes (muted) + "สั่งโดย บีม" + price right. Cancelled items struck through, stay visible. Sticky footer: subtotal, total (large, accent), buttons: primary "ชำระเงิน", outline danger "ยกเลิกรายการ / Comp", ghost "ปิดโต๊ะ". States side by side: **active with orders** · **open, no orders** ("ยังไม่มีออเดอร์" + secondary "สั่งแทนลูกค้า") · **loading** skeleton · **close blocked** — Alert "มีการชำระเงินค้างอยู่ ปิดโต๊ะไม่ได้" (409 payment in flight) · **idle** — Alert on top "โต๊ะนี้ไม่มีความเคลื่อนไหว 25 นาที" + buttons "ยังใช้งานอยู่" / "ปิดโต๊ะ".
> 4. **CD-02/open-table** — Modal from "+ เปิดโต๊ะ" or clicking a ว่าง card. Fields: table/seat (preselected when from a card, else a Select listing only free seats), guest name (optional) "ชื่อแขก (ไม่บังคับ)". Buttons "ยกเลิก" / primary "เปิดโต๊ะ". After success: show the table QR large + label "สแกนเพื่อสั่งอาหาร — T3" + "แชร์ QR ให้เพื่อนในโต๊ะได้" + buttons "พิมพ์ QR" / "เสร็จสิ้น". States: default · submitting (button loading) · **already opened** — info Alert "โต๊ะนี้เพิ่งถูกเปิดโดยลูกค้า — เข้าร่วมโต๊ะเดิมแล้ว" (first-write-wins, attached to existing visit, not an error) · error "เปิดโต๊ะไม่สำเร็จ ลองอีกครั้ง".
> 5. **CD-02/close-confirm** — Modal "ปิดโต๊ะ T3?" with summary (total, paid, remaining). If remaining > 0 → danger Alert "ยังมียอดค้างชำระ ฿320.00" and primary button changes to "ไปชำระเงิน". Success Toast "ปิดโต๊ะ T3 แล้ว".
> 6. **CD-02/void-comp** — Modal from "ยกเลิกรายการ / Comp": pick item(s), RadioGroup type (ยกเลิก / Comp ฟรี), reason Select (required: สั่งผิด, ลูกค้าเปลี่ยนใจ, ของเสีย, บริการพิเศษ, อื่นๆ), manager PIN input (4–6 digits, masked). States: default · wrong PIN "PIN ไม่ถูกต้อง" · no manager on shift → warning "อนุมัติด้วยตัวเอง — จะถูกบันทึกให้เจ้าของตรวจสอบ".
> 7. **CD-02/qr-actions** — confirm Modal for "สร้าง QR ใหม่": danger text "QR เดิมจะใช้ไม่ได้ทันที ลูกค้าที่สแกน QR เดิมจะเห็น 'QR ไม่ถูกต้อง กรุณาติดต่อพนักงาน'" + buttons. Reprint = print preview card only (QR + table label + bar name).
> 8. **CD-02/realtime** — small board showing live updates on the grid: a card turning ว่าง → มีแขก when a customer's first order arrives (Toast "T5 เปิดโต๊ะจาก QR"), a call-staff Toast "T2 เรียกพนักงาน" with button "รับทราบ".
> 9. **CD-02/flow** — arrows: grid → click ว่าง → open-table → QR → grid (มีแขก) · grid → click occupied → panel → ชำระเงิน (→ CD-03) / ปิดโต๊ะ → close-confirm → grid (ว่าง) · panel → void-comp → panel · idle alert → ยังใช้งานอยู่ / ปิดโต๊ะ · customer QR first order → card becomes มีแขก.
>
> Out of scope (do not draw): moving/merging tables, reservations, item-level split, offline mode, member QR, printed receipts, LINE OA.

## Acceptance (Field checks)
- Every artboard in dark + light; grid and panel also at 1024 px.
- Chips exactly match CD-00 §2 (schema enums), no new status colours.
- Only HeroUI v3 components + existing custom ones (PosRail); any new component listed in the handoff.
- "Already opened" is drawn as info (joined), not as an error.
- No out-of-scope items appear.

## Result
- Claude Design link: <after run>
- Handoff: `docs/design/CD-02-handoff.md` · screenshots `docs/design/assets/CD-02/`

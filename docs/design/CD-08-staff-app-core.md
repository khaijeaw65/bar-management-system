# CD-08 — Staff app (Expo): login, order queue, order detail + status, tables, more

**Status:** Done (2026-10-09, Cowork Design canvas) — rev 1 approved by Field 2026-10-10 (R1–R5); **rev 2 (CD template retrofit) in review** — handoff `CD-08-handoff.md` wins where it differs (see Revisions) · **Surface:** Expo staff app, phone 390×844 (also 360×780) · **Used by:** BRIEF-010 (Metee, Week 0 — login + queue), next mobile briefs (status actions, detail, tables) · DR-009 staff-app scope

## Attach
**Open inside the existing Claude Design project** (Design systems tab → The Loft Bar Design System, not the home "What should we create?" box): https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457
`docs/design/CD-00-handoff.md` (§2 chips, Toast, bottom sheet) · `docs/design/CD-02-handoff.md` (table states, money) · `docs/briefs/ui/staff-mobile.md` Screens 1–3 (content reference only — PWA/old tokens ignored) · FRD §6 · DR-009

## Data this screen has (API catalog)
- `GET /api/orders?status=pending,accepted,ready,issue` → orders: `number`, `status`, `tableLabel`, `createdAt`, items (`name`, `variantName`, `quantity`, `status`, `orderedByName`, `notes`, modifiers)
- `POST /api/orders/:id/accept` · `/ready` · `/send` · `/flag-issue` `{ reason, itemId?, note? }` · `/resolve` `{ resolution: substitute | escalate, note? }`
- `GET /api/tables` → seats + live visit summary (read-only on mobile)
- Realtime `/staff`: `order.created`, `order.status_changed`, `visit.opened`, `visit.state_changed`, `staff.called`

## Defaults (Field confirms or overrides)
- **D1 — No "ปฏิเสธ" (reject) on pending.** The old brief had it, but rejecting = cancelling = void → POS only (DR-009). Pending offers **รับออเดอร์** + **รายงานปัญหา**.
- **D2 — ISSUE resolution on mobile = 2 options:** "แก้แล้ว ทำต่อ" (substitute/resolved → `accepted`) and "ส่งให้ POS" (escalate — removal/void happens at the POS). No "ลบรายการ" on mobile.
- **D3 — Status is per order** (one big action button); item chips follow the order (FRD §6 state machine is order-level).
- **D4 — Bottom tabs: ออเดอร์ · โต๊ะ · อื่นๆ** (3 tabs). Payment / guest tabs are S2 (CD-09); no FAB for new order here (CD-14).

## Paste into Claude Design
> Work inside **The Loft Bar Design System** project. **Staff app (Expo React Native) — HeroUI Native components only**, name the component on each part (Button, Card, Chip, Tabs, Dialog, BottomSheet, TextField, Select/RadioGroup, Skeleton, Spinner, Toast, Avatar, Divider, Alert); anything without a HeroUI Native component = mark "custom". Thai copy, Noto Sans Thai, **tokens only**, **dark and light** for every artboard. Phone frame **390×844** (safe areas, home indicator), bottom tab bar 3 tabs: **ออเดอร์** (clipboard-list) · **โต๊ะ** (layout-grid) · **อื่นๆ** (menu). Touch targets ≥ 44, primary actions 52 (wet hands, low light). Chips keyed by schema enums (CD-00 §2): order `pending` ใหม่ · `accepted` กำลังทำ · `ready` พร้อมเสิร์ฟ · `sent` เสิร์ฟแล้ว · `issue` มีปัญหา; item `pending` รอ · `preparing` กำลังทำ · `ready` พร้อม · `cancelled` ยกเลิก (struck). Times "2 นาทีที่แล้ว", clock "20:34 น.". Artboards `CD-08/<id>`. **Static state boards** — all states side by side, no clickable switchers. Every preview card renders standalone (Lucide loaded in-card, explicit 390×844 size).
>
> 1. **CD-08/login** — logo mark + "The Loft Bar" + "ระบบจัดการบาร์", Button lg block "เข้าสู่ระบบด้วย LINE" (LINE green is the only brand colour exception), footer "เฉพาะพนักงาน The Loft Bar". States: default · signing in (isPending) · error Alert "เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้ง" · not registered: "บัญชี LINE นี้ยังไม่ได้ลงทะเบียน" + "ติดต่อเจ้าของร้านเพื่อเพิ่มบัญชี".
> 2. **CD-08/queue** — header "ออเดอร์" + clock; filter chips row (horizontal scroll) **ทั้งหมด · ใหม่ · กำลังทำ · พร้อมเสิร์ฟ · มีปัญหา** (count in each, "มีปัญหา" red dot when > 0). Order Card: "#0042" + "2 นาทีที่แล้ว" · "T3 · ต้น" (16/600) · items "2× ช้างดราฟต์" (max 3 lines, then "+ 2 รายการ") · bottom row: order chip + **one action button** by status — ใหม่ → "รับออเดอร์" (primary) · กำลังทำ → "พร้อมแล้ว" (primary) · พร้อมเสิร์ฟ → "เสิร์ฟแล้ว" (success) · มีปัญหา → "ดูปัญหา" (danger outline). Oldest first. Pull-to-refresh. States side by side: **loaded** · **loading** (Skeleton ×4) · **empty** "ยังไม่มีออเดอร์" (per filter) · **error** Alert "โหลดออเดอร์ไม่สำเร็จ" + "ลองอีกครั้ง" · **new order arrives** (card slides in at its position + Toast "ออเดอร์ใหม่ T5 · 3 รายการ") · **disconnected** banner "การเชื่อมต่อขาด ข้อมูลอาจไม่อัปเดต".
> 3. **CD-08/detail** — tap a card → screen: back "ออเดอร์", title "#0042", sub "T3 · ต้น · 20:30 น.", large order chip. Item rows (Card): qty chip "2×" + name 15/600 + variant/modifiers muted + note "หมายเหตุ: ไม่ใส่น้ำแข็ง" + "สั่งโดย ต้น" + item chip. Sticky footer by status: ใหม่ → "รับออเดอร์" primary lg + "รายงานปัญหา" danger outline · กำลังทำ → "พร้อมแล้ว" + "รายงานปัญหา" · พร้อมเสิร์ฟ → "เสิร์ฟแล้ว" success lg · เสิร์ฟแล้ว → no actions, chip only. States: each status · action pending (button isPending) · conflict Toast "ออเดอร์นี้ถูกอัปเดตจากเครื่องอื่นแล้ว" (409) then refreshed state.
> 4. **CD-08/issue** — "รายงานปัญหา" → BottomSheet: RadioGroup reason (**ของหมด · อุปกรณ์มีปัญหา · อื่นๆ**), optional item picker "รายการที่มีปัญหา" (radio list of the order's items), TextField "รายละเอียด" (required for อื่นๆ), buttons "ยกเลิก" / danger "รายงานปัญหา". Detail in issue state: Alert warning top "มีปัญหากับออเดอร์นี้" + "ยำหมูยอ · ของหมด" + two actions: **"แก้แล้ว ทำต่อ"** (primary → กำลังทำ) and **"ส่งให้ POS"** (secondary → stays มีปัญหา with chip "ส่งให้ POS แล้ว"); helper "การลบหรือยกเลิกรายการทำที่ POS".
> 5. **CD-08/tables** — tab โต๊ะ: read-only grid of seats, sections **เคาน์เตอร์** (C1–C8, 4 per row) and **โต๊ะ** (T1–T6, 2 per row). Card: label + visit chip (CD-00 table set: ว่าง · เปิดแล้ว · มีแขก · ไม่มีความเคลื่อนไหว · เรียกพนักงาน solid + pulse) + guest name + time open. Tap occupied → BottomSheet summary: "โต๊ะ T3", guests, "5 รายการ · ฿1,240.00", list of open orders with chips, note "ชำระเงินและปิดโต๊ะทำที่ POS". States: loaded · loading · call-staff highlighted (T2) · empty "ยังไม่มีโต๊ะ".
> 6. **CD-08/more** — tab อื่นๆ: Avatar + "บีม" + role chip "บาร์เทนเดอร์" + "กะเปิด 18:00"; list: "การแจ้งเตือน" (status: เปิดอยู่ / ปิดอยู่ → open settings), "ธีม: ตามระบบ" (read-only), app version; danger Button "ออกจากระบบ" → Dialog "ออกจากระบบ?" / "ออกจากระบบ" / "ยกเลิก".
> 7. **CD-08/notifications** — (a) first-run permission screen "เปิดการแจ้งเตือน" "รับแจ้งเมื่อมีออเดอร์ใหม่หรือลูกค้าเรียกพนักงาน แม้ไม่ได้เปิดแอป" + "เปิดการแจ้งเตือน" / "ไว้ทีหลัง"; (b) system push previews on lock screen: "ออเดอร์ใหม่ · T5" "สิงห์ดราฟต์ 2× · โอลด์แฟชั่น", "T2 เรียกพนักงาน", "ออเดอร์ #0042 พร้อมเสิร์ฟ · T3"; (c) in-app Toast for call-staff (warning, sticky) "T2 เรียกพนักงาน" + "รับทราบ".
> 8. **CD-08/flow** — login → queue · queue card action (in-place status change) · card → detail → actions → back to queue · detail → รายงานปัญหา → issue sheet → detail (มีปัญหา) → แก้แล้ว ทำต่อ / ส่งให้ POS · tab โต๊ะ → summary sheet · push tap → detail · อื่นๆ → logout → login.
>
> Out of scope (do not draw): new order / order taking (CD-14), payment, close table, void/comp, remove item, guest profile, AI summary, bottle keep (CD-09, S2), settings beyond the list above, iPad layouts.

## Acceptance (Field checks)
- Every artboard dark + light at 390×844; queue and detail also at 360×780.
- Exactly one primary action per order card; no reject/void/remove anywhere.
- Chips match CD-00 §2; HeroUI Native components named; customs listed.
- No out-of-scope items appear.

## Result
- Design canvas: https://claude.ai/artifact/E1EzrLh3piE3esih4VyRwB (8 boards, Theme tweak dark/light)
- Handoff: `docs/design/CD-08-handoff.md` · screenshots `docs/design/assets/CD-08/`

## Revisions
Once the handoff is approved it wins over the paste text above (`cd-template.md` §2).

| Rev | Date | Change vs this brief | Where |
|---|---|---|---|
| 1 | 2026-10-10 | Not-registered copy = access request sent (R1); counters 3/row, custom SeatTile (R4); escalated keeps only "แก้แล้ว ทำต่อ" (R5) | handoff §0, §10 |
| 2 | 2026-10-10 | D4 "no FAB" superseded: queue gets "+ ออเดอร์" → CD-14 (R7) · table summary gets "สั่งออเดอร์" + "เสิร์ฟแล้ว" section (R8, CD-14 R4) · served Toast, no undo (R9) · filter rule (R11) · added states (session expired, 409 on card, read-only, loading from push, network failure, validation + keyboard, tables error/disconnected, 360×780) · API gaps listed (R10) | handoff §0–§9 (rev 2, review) |

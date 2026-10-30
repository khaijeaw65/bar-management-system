# BRIEF-050 — Customer QR: running tab, call staff, live updates, table closed (C4)

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | frontend · backend (small) |
| **Revision** | 1 |
| **Depends on** | BRIEF-047 ✅ (#97) · BRIEF-048 ✅ (#98) · BRIEF-049 ✅ (merged) — seed is based on an older local `main`: **merge `origin/main` first** |
| **References** | CD-06 handoff (boards `tab`, `call-staff`, menu·6 ·8, cart·6; §3, §6 copy, §7, §9; D2/D3) · canvas https://claude.ai/artifact/6f5CBjGzpN4zYFotFQauGi · DR-028 · DR-012 (status per ticket, customer labels) · audits BRIEF-048 Findings 5–6, BRIEF-049 Suggestions 2, 4, 8 |
| **Audit depth** | Full (guest auth binding + customer realtime) |
| **Size** | ~1.5–2 days · est. ~1,000–1,300 net-new lines incl. tests (backend ~150) |

---

## Interview — Selected (by KJ), 2026-10-30
| Q | Selected (by KJ) |
|---|---|
| Seat-only phone after the table gets a visit | **Bind on read** — a guarded request binds a seat-only session to the seat's live visit (backend) |
| Navigation | Header "บิลโต๊ะ" button + existing cart bar; after send → `/customer/tab` |
| Bell entry | Header icon on every customer page → bottom sheet |
| Scope | One brief, backend + frontend |
| *(carried, audits)* | `RATE_LIMITED` notice in the cart (049 S2) · hide guest categories with no items (049 S4) · dismiss Toasts on route change (049 S8) |
| *(proposed)* Seat room ping | When a visit opens on a seat (POS or guest), phones in `seat:{id}` get `tab.changed { visitId }` so a browsing phone binds without waiting for a refetch |
| *(proposed)* Closed vs expired | WS `sessionEnded` or a 409 `INVALID_STATE_TRANSITION` at send → "โต๊ะนี้ปิดแล้ว" screen; any other 401 → the existing "เซสชันหมดอายุ" screen |

## 1. Goal
Every phone at a table sees the whole table's bill live (status per station, cancelled lines struck, "ของฉัน" filter), can ring the bell for staff, and is told clearly when the table is closed.

## 2. Scope
### In — backend (`modules/customer`, `modules/venue`, `modules/notifications`)
- **Bind on read:** in `GuestSessionService` resolve path — seat-only session (`visit_id NULL`) on a seat that now has a live visit → `bindVisit(sessionId, visitId)` (same write as BRIEF-048) → view returns the `visitId`; then `CustomerTabGateway.bindSession(sessionId, visitId)` so its sockets join `visit:{id}`. Expiry rules unchanged (bound = life of the visit, DR-028).
- **Seat room ping *(proposed)*:** `VisitService` announces an opened visit (`announceOpened`, staff and guest paths) → `NotificationsService.emitSeatVisitOpened(tableSeatId, visitId)` → the customer gateway emits `tab.changed { visitId }` to `seat:{tableSeatId}`. Same sink pattern as `emitTabChanged`; no staff payload on `/customer`.
- **Hide empty guest categories:** `CustomerMenuService` drops categories with no item left after the charge/hidden filters.
- Tests: e2e — seat-only session + POS opens the visit → `GET /customer/tab` returns that visit's orders and the session row has `visit_id`; a socket in `seat:` receives `tab.changed` on POS open; empty category absent from `/customer/menu`.

### In — frontend (`src/app/customer/**`, `src/lib/socket/`)
- **Header (all customer pages):** "โต๊ะ T3 · ต้น", bell `Button isIconOnly` (`aria-label="เรียกพนักงาน"`, 44 px), "บิลโต๊ะ" button with the table total once a visit exists (from the tab query).
- **`/customer/tab`** (CD-06 tab·1–7): filter ทั้งหมด / ของฉัน (single select, cannot clear both); placement cards newest first — time, "#001", ticket chips per station with the customer labels (`pending` ส่งแล้ว · `accepted` ร้านกำลังเตรียม · `ready` พร้อมเสิร์ฟ · `sent` เสิร์ฟแล้ว · ticket `cancelled` → chip hidden, its lines struck), lines with modifiers, `สั่งโดย {name}` (null → "ลูกค้า"), cancelled lines struck "รายการถูกยกเลิก" and excluded from the total; charge lines with no status (D3); footer "รวมทั้งโต๊ะ ฿…" + "อัปเดต 20:34" (`asOf`); empty state; "สั่งเพิ่ม" → menu.
- **After send:** cart 201 → `router.replace('/customer/tab')` + Toast "ส่งออเดอร์แล้ว · #001" (replaces BRIEF-049's stay-on-menu, as planned there).
- **Call staff sheet** (CD-06 call·1–4): `Drawer` bottom; chips เช็คบิล (`bill`) / อื่นๆ (`other` + note ≤ 100) / no reason; ส่ง → `POST /customer/call-staff` → sent state "แจ้งพนักงานแล้ว" + button disabled 60 s with a countdown; `429` → same locked state with the server message; network → error + retry.
- **Live (`lib/socket/customer-socket.ts`):** `io(<api origin>/customer, { path: '/api/customer/socket.io', withCredentials: true })`, connected while the `/customer` layout is mounted; `tab.changed` → invalidate the tab + session queries; `sessionEnded: true` → closed screen; connection lost → banner "การเชื่อมต่อขาดหาย · ข้อมูลอาจไม่ล่าสุด" on menu and tab (menu·8, tab·6) keeping last data; reconnect → refetch. Handshake rejected → treat as expired (same signal as a 401).
- **Table closed screen:** "โต๊ะนี้ปิดแล้ว ขอบคุณที่มาใช้บริการ" + "สแกน QR ที่โต๊ะเพื่อเริ่มใหม่"; reached from WS `sessionEnded`, or cart send `409 INVALID_STATE_TRANSITION` (CD-06 cart·6); cart for that seat cleared.
- **Cart notice for `RATE_LIMITED`:** `sendFailure` maps it to a notice showing the server message ("กรุณารอสักครู่ก่อนสั่งอีกครั้ง"); the cart stays editable and the key is kept.
- **Toasts:** dismiss open Toasts on customer route change (keep the one raised by the navigation itself).
- **Live sold-out:** stays on the 60 s / focus menu refetch from BRIEF-049 (no menu event on `/customer`, BRIEF-048 decision).

### Out (do NOT build here)
- Payment / "ชำระเงิน" (C5) · POS bell UI, sound, badge (C6) · staff-app acknowledge (mobile brief) · guest cancelling an order · push notifications · new WS events beyond `tab.changed`.

## 3. Contract
- **Uses:** `GET /customer/tab`, `POST /customer/call-staff`, `GET /customer/session`, `POST /customer/orders`, WS `/customer` `tab.changed` (BRIEF-048).
- **Backend changes (no new endpoint, no contract field change):** bind-on-read behaviour of the guard path · `tab.changed` also sent to `seat:{id}` rooms on visit open · empty categories filtered.
- **Contracts changes:** none.
- **Business rules:** whole table visible to every phone on the visit, `mine` only for this phone (CD-06 D2, R4) · status per ticket, no item progress (DR-012) · bound session lives as long as the visit (DR-028) · one bell per seat, newer call overwrites (BRIEF-048).

## 4. Acceptance Criteria
- **AC-1 (BE)** — Phone B scans a free seat; POS opens the visit; phone A orders → B's `GET /customer/tab` shows A's order with `mine: false`, and B's `guest_session.visit_id` = the visit. B's socket (connected before) receives `tab.changed` when the POS opens the visit.
- **AC-2 (BE)** — A category whose only items are charge items (or hidden) is absent from `GET /customer/menu`.
- **AC-3** — After a 201 the phone lands on `/customer/tab` with the new placement on top and the success Toast; ของฉัน shows only this phone's orders; totals exclude cancelled lines; charge line shows with no status.
- **AC-4** — POS accepts the ticket → the phone's chip changes to "ร้านกำลังเตรียม" without reload (WS); POS 86-voids a line → struck "รายการถูกยกเลิก", total drops.
- **AC-5** — Bell: เช็คบิล → `POST /customer/call-staff {reason:'bill'}` → sent state, button locked ~60 s; second tap during lock does nothing; a 429 shows the locked state.
- **AC-6** — POS closes the table → every phone on it shows the closed screen (WS `sessionEnded`); sending from a stale cart → 409 → closed screen; the seat's stored cart is cleared.
- **AC-7** — Socket dropped → banner on menu and tab, last data kept; reconnect → banner gone, data refetched.
- **AC-8** — `RATE_LIMITED` at send shows the server message as a notice; cart remains editable; retry after the wait succeeds with the same key.
- **AC-9** — Navigating menu → cart → tab dismisses stale Toasts; header bell and บิลโต๊ะ reachable on all three pages; 360×780 no horizontal scroll.
- **AC-10** — Gates + run proof pass.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2 | integration (real Postgres + Redis, socket.io client) | `app/backend/test/customer-order.e2e-spec.ts` / `customer-ws.e2e-spec.ts` (extend) · `customer-session.e2e-spec.ts` |
| AC-3 – AC-9 | component (Vitest + Testing Library, mocked socket) | `app/frontend/src/app/customer/**/_components/*.test.tsx`, `src/lib/socket/customer-socket.test.ts` |
| AC-3, AC-5, AC-6 | e2e (Playwright 390×844, MSW + mocked socket events) | `app/frontend/e2e/customer-tab.spec.ts` |

Gate commands (all must pass):
```bash
pnpm --filter @bar/contracts build
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck && pnpm --filter @bar/backend test && pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/frontend lint && pnpm --filter @bar/frontend typecheck && pnpm --filter @bar/frontend test && pnpm --filter @bar/frontend test:e2e && pnpm --filter @bar/frontend build
```
Run proof (real stack, ports BRIEF-046; stop dev servers before e2e): two phone windows (A, B at 390×844) + POS window. B scans T3 first (free) → POS opens T3 → A scans, orders → B's tab shows A's order without reload → POS accepts → both phones show "ร้านกำลังเตรียม" live → B rings เช็คบิล → `curl` `GET /api/tables` shows T3 `staffCall.reason = 'bill'` (POS bell UI is C6) → POS closes T3 → both phones show "โต๊ะนี้ปิดแล้ว". Screenshots in `docs/handoffs/assets/BRIEF-050/`: tab (ทั้งหมด), tab (ของฉัน), live status change (before/after), bell sheet + sent state, disconnected banner, closed screen.

### Local Sonar scan
- **Required: yes** (new customer surface + guest auth path).
- Approved exclusions: none.

## 6. Constraints
- `docs/rules/frontend.md` Hard Limits; DS tokens only; HeroUI v3 (Drawer, Chip, Button, Alert, Toast, Skeleton, EmptyState); StatusChip "kind order" with the customer labels (CD-06 §8) — use the DS component if it exists in the app, else Chip with the status tokens.
- One customer socket per tab of the browser; no staff socket on customer pages.
- Backend: binding writes only through the existing `bindVisit`; no new table/column; guest emits only via the notifications sink (no customer payload mirrors staff events).
- Thai copy from CD-06 §6; targets ≥ 44 px.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):** routes `src/app/customer/tab/page.tsx`; socket client `src/lib/socket/customer-socket.ts`; bind-on-read in `GuestSessionService`; `NotificationsService.emitSeatVisitOpened`; status label map above; the two *(proposed)* rows once Field approves.
- **Stop and raise a DR if:** binding on read needs a schema change · a new WS event or payload field seems needed · the closed/expired split can't be made from the existing codes.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2 (≤ 3 working days)
- [x] No unresolved decision blocking the main outcome
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-30 | Initial Draft (Cowork) — customer side C4 |

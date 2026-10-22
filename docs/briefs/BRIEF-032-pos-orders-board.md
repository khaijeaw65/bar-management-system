# BRIEF-032 — Web POS: orders board (status + issues)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-22 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | frontend |
| **Revision** | 1 |
| **Depends on** | **BRIEF-029 merged** (socket hook) · BRIEF-012 ✅ (`GET /tickets`, accept / ready / send) · BRIEF-017 ✅ (`issue`, `?escalated`, `resolve`) · BRIEF-027 (optional — auto-void display and `updatedAt` are used when present) |
| **References** | CD-15 handoff (board·1, ·4 · board-states·1–5 · detail · issue·1 · §9) · DR-011 (counter seats skip ready) · DR-012 · DR-013 · DR-014 #1 #3 · `docs/api/README.md` (Orders) |
| **Audit depth** | Compact (UI; transitions are server-guarded) |
| **Size** | ~1 day · est. ~450–550 net-new lines |

---

## 1. Goal
The POS sees every open ticket of the shift by status, moves tickets along itself (bars without phones), and can send an escalated issue back to "ทำต่อ". Shows the live, multi-device side of the system in the demo.

## 2. Scope
### In
- **Route `/pos/orders`** (rail "ออเดอร์"; rail Badge = number of `pending` tickets, live).
- **Board (CD-15 board·1 / ·4):** `GET /tickets?status=pending,accepted,ready,issue` + `GET /venue`. Columns: kitchen screen **off** (default) → ใหม่ · กำลังเตรียม · มีปัญหา; **on** → ใหม่ · กำลังเตรียม · พร้อมเสิร์ฟ · มีปัญหา + station filter ทั้งหมด / เฉพาะบาร์ / เฉพาะครัว (DR-014 #1). Summary chips with counts. Oldest first within a column.
- **Card:** `#orderNumber` · seat label · station Badge (kitchen on only) · time · up to 4 lines "{qty}× {name}" + "+ n รายการ" · "กำลังเตรียม · {acceptedBy}" · cancelled lines struck (with "ยกเลิกอัตโนมัติ · ของหมด" when the line's cancellation is system — BRIEF-027 field) · one full-width action:
  | Status | Action | Call |
  |---|---|---|
  | pending | รับออเดอร์ (primary) | `POST /tickets/:id/accept` |
  | accepted, kitchen on + table seat | พร้อมแล้ว | `POST /tickets/:id/ready` |
  | accepted, otherwise | เสิร์ฟแล้ว | `POST /tickets/:id/send` |
  | ready | เสิร์ฟแล้ว | `POST /tickets/:id/send` |
  | issue | จัดการปัญหา → drawer | — |
  Button pending while the call runs; `409` → Toast "ออเดอร์ #{n} เปลี่ยนสถานะแล้ว" + refetch (CD-15 §9). `sent` / `cancelled` tickets leave the board.
- **Detail / issue drawer (CD-15 detail·1, issue·1):** tap a card → drawer 400 with all lines, seat, times; "ไปที่โต๊ะ {seat}" → `/pos/tables?visit=<visitId>` (`Ticket` has no `visitId`: take it from the `['tables']` query — `TableSummary.id = ticket.seat.id` → `currentVisit.id`; no new endpoint). For an `issue` ticket: reason · item · note · "รายงานโดย {name}" · escalated time ("ส่งมาจากแอปพนักงาน") · **ทำต่อ** → `POST /tickets/:id/resolve { resolution: 'substitute' }` → Toast, card to กำลังเตรียม. "ยกเลิกรายการที่มีปัญหา" / "เปลี่ยนรายการ" shown disabled with "ต้องใช้สิทธิ์ผู้จัดการ — รอระบบยกเลิกรายการ" (void = BRIEF-018).
- **Live (board-states·3–5):** `order.created` → refetch, new card highlighted 3 s + Toast "ออเดอร์ใหม่ {seat}" · `ticket.status_changed` / `ticket.issue_escalated` → refetch (skip a payload whose `updatedAt` is older than the shown ticket, when the field exists) · `menu.availability_changed` (after 027) → refetch + Toast warning "{item} หมด — ยกเลิกอัตโนมัติ n รายการ · แจ้งลูกค้าโต๊ะ {seats}" from `autoVoided`; `notVoided` listed as "กำลังทำอยู่ / รอชำระ — ตรวจกับลูกค้า". Disconnected banner (029 component); actions still allowed.
- **States:** loading skeleton per column · empty column "ไม่มีออเดอร์" · error Alert + retry.
- MSW: `/tickets` (all statuses, an escalated issue), transitions (200 / 409), `/venue` both modes.

### Out (do NOT build here)
- Void / replace / comp + PIN (BRIEF-018) · kitchen display screen (S2) · 1024×768 issue strip for the kitchen-on layout (CD-15 R6; default venue is kitchen off, where 3 columns fit) · flagging an issue from the POS · order history.

## 3. Contract
- **Endpoints used (all exist):** `GET /tickets` (`TicketListQuerySchema` → `TicketList`) · `POST /tickets/:id/accept|ready|send` → `Ticket` · `POST /tickets/:id/resolve` (`ResolveIssueRequestSchema`) → `Ticket` · `GET /venue`.
- **WS events:** `order.created`, `ticket.status_changed`, `ticket.issue_escalated` (room `staff`) · `menu.availability_changed` (after 027).
- **Contracts changes:** none.
- **Permissions:** `orders:read`, `orders:update_status` (server-side).
- **Business rules:**
  - `ready` only with the kitchen screen on and a table seat; counters go กำลังเตรียม → เสิร์ฟแล้ว → DR-011 · DR-014 #1.
  - Kitchen off = one card per order, no station badge or filter → DR-013 · CD-15 R8.
  - Every transition is state-guarded server-side; 409 → show latest → CD-15 §9 · api README Concurrency.
  - Sold-out auto-cancel shows as cancelled lines, never as an issue → DR-014 #3.
  - Until BRIEF-018, an escalated issue resolves only by "ทำต่อ" → BRIEF-017 Q2.

### 3b. Under the hood
- **Where:** `app/pos/orders/page.tsx` · `_components/{OrdersBoard,BoardColumn,TicketCard,TicketDrawer,IssuePanel}.tsx` · `lib/api/tickets.ts` · rail Badge in `app/pos/_components/PosRail.tsx` via `hooks/usePendingTicketCount.ts`.
- **How:** `useQuery(['tickets','board'])` → group by status (+ station filter) → action → `useMutation` → invalidate; socket events invalidate the same key.
- **Why:** one query feeds both the board and the rail count, so they never disagree.

## 4. Acceptance Criteria
- **AC-1** — Kitchen off: tickets land in ใหม่ / กำลังเตรียม / มีปัญหา, oldest first, no station badge; kitchen on: four columns, station badges and a working filter.
- **AC-2** — รับออเดอร์ on a pending ticket sends one `accept` and the card moves to กำลังเตรียม with the accepter's name; a counter-seat ticket in กำลังเตรียม shows เสิร์ฟแล้ว even with the kitchen screen on.
- **AC-3** — A transition answered with `409` shows the Toast, refetches and leaves no stuck pending button.
- **AC-4** — An escalated `issue` ticket shows reason / item / reporter / escalated time in the drawer; ทำต่อ sends `resolve { resolution: 'substitute' }` and the card moves to กำลังเตรียม; void / replace are visibly unavailable.
- **AC-5** — `order.created` adds a highlighted card and the rail Badge increases without reload; after `send` the card leaves the board and the Badge stays correct.
- **AC-6** — With BRIEF-027 merged: a `menu.availability_changed` with `autoVoided` T2 / T5 shows the Toast naming both tables and T5's card leaves the board (ticket cancelled). Without 027 the board still builds and passes (the handler is inert).
- **AC-7** — Loading / empty / error+retry states per §2.
- **AC-8** — Gates pass; run proof done.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2, AC-7 | component | `src/app/pos/orders/_components/OrdersBoard.test.tsx` (MSW, both venue modes) |
| AC-3, AC-4 | component | `TicketCard.test.tsx` · `TicketDrawer.test.tsx` |
| AC-5, AC-6 | component | `OrdersBoard.test.tsx` (fake socket events) |
| AC-2, AC-4 | e2e | `e2e/orders-board.spec.ts` (MSW) |

Gate commands (all must pass):
```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend test:e2e
pnpm --filter @bar/frontend build
```
Run proof: BRIEF-028 run proof. UI change: place an order in tab 1 (031) → tab 2 `/pos/orders` shows it live → รับออเดอร์ → เสิร์ฟแล้ว → card leaves; the table drawer in tab 1 shows the new ticket status. Screenshot in the handoff.

### Local Sonar scan
- **Required for this brief: yes** (Field, 2026-10-22 — scan every UI brief from 031 on). Follow `docs/quality/README.md`: `docker compose -f infra/docker-compose.yml --profile sonar up -d` → `pnpm sonar` → fix every issue in files this brief adds or changes → re-scan until the Quality Gate passes, or each remaining issue has a written reason → `pnpm sonar:report` output in the handoff's Sonar section.
- Approved exclusions / "won't fix": none — any exclusion, "won't fix", "false positive" or gate change needs Field's approval first.

## 6. Constraints
- Board never changes a ticket locally before the server answers (no optimistic moves) — 409s stay honest.
- Card action button names include number + seat ("รับออเดอร์ #0045 T3"); columns are labelled regions (CD-15 §9).
- `frontend.md` Hard Limits; tokens only; DS StatusChip labels per DR-012 A1 ("กำลังเตรียม", not "กำลังทำ" — CD-15 R4 label override).

## 7. Decision Points (Field Guard)
- **Pre-decided:** route `/pos/orders` · query key `['tickets','board']` shared with the rail Badge · paths above · no new packages.
- **Likely DRs:** none expected.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-21 | Initial Draft (Cowork) — 10 Nov UI slice #6 (should-have) |
| 1 | 2026-10-22 | Ready — Field approved Rev 1 in session ("approve BRIEF-032 Rev 1 Ready") |

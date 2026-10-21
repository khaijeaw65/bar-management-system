# BRIEF-030 — Web POS: session panel + close table

| | |
|---|---|
| **Status** | Ready |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | frontend |
| **Revision** | 1 |
| **Depends on** | **BRIEF-029 merged ✅ (#70)** (grid, `?visit=` contract, socket hook, `LoadError`) · BRIEF-011 ✅ (`GET /visits/:id`, `POST /visits/:id/close`) · BRIEF-012 ✅ (orders + tickets in visit detail) · BRIEF-013 ✅ (`bill`, `409 PAYMENT_IN_FLIGHT` on close) |
| **References** | CD-02 handoff (panel·1–4, ·7 · close-confirm · §9) · DR-012 · DR-013 (one ticket per order when the kitchen screen is off) · DR-014 #1 #2 · `docs/api/README.md` (Tables & visits) |
| **Audit depth** | Compact (UI; close is server-guarded) |
| **Size** | ~0.5–1 day · est. ~400–500 net-new lines |

---

## 1. Goal
Tapping an occupied table shows what it ordered, what it owes and whether it's paying; the cashier can close a table only when it is paid.

## 2. Scope
### In
- **Drawer (CD-02 panel):** right side, 400 wide, over the grid (grid stays visible) whenever `?visit=<id>` is set; ✕ / Esc / tapping another card updates the param. Data: `GET /visits/:id` (`VisitDetailSchema`) + `GET /venue` (`kitchenDisplayEnabled`, cached).
  - **Header:** "โต๊ะ {seatLabel}" + state chip · meta "เปิด h:mm · {guest}".
  - **Order groups** (newest first): one group per ticket — kitchen screen **off** → one group per order, no station label (DR-013); **on** → per station ticket with label บาร์ / ครัว. Group header: time (`createdAt`, HH:MM น.) · `#orderNumber` · ticket chip (pending ใหม่ · accepted "กำลังเตรียม · {acceptedBy.displayName}" · ready พร้อมเสิร์ฟ · sent เสิร์ฟแล้ว · issue มีปัญหา · cancelled ยกเลิกทั้งใบ).
  - **Lines:** "{qty}× {name}" (+ variant when not the only one) · muted modifiers / note / "สั่งโดย {orderedByName}" · `lineTotal`. Cancelled line (`cancelledAt` set) = struck, muted, chip "ยกเลิก" (+ reason when BRIEF-027's `cancellation` field is present). Items have no progress chip (DR-012).
  - **Footer (sticky):** ยอดรวม `bill.total` · ชำระแล้ว `bill.paid` (when > 0) · คงเหลือ `bill.remaining` (large, accent) · button **ปิดโต๊ะ** (ghost). "ชำระเงิน" and "สั่งแทนลูกค้า" are **added by 033 / 031**, not here.
  - **Open, no orders (panel·2):** "ยังไม่มีออเดอร์" · ฿0.00 · ปิดโต๊ะ enabled.
  - **Paying (panel·4):** `bill.locked` → Alert danger "มีการชำระเงินค้างอยู่ ปิดโต๊ะไม่ได้" / "รอให้การชำระเงินเสร็จก่อน แล้วลองอีกครั้ง"; ปิดโต๊ะ disabled.
- **Close confirm (CD-02 close-confirm):** modal "ปิดโต๊ะ {label}?" with ยอดรวม / ชำระแล้ว / คงเหลือ (re-read on open):
  - `remaining > 0` → Alert "ยังมียอดค้างชำระ ฿{remaining}"; primary disabled (033 turns it into "ไปชำระเงิน").
  - `remaining = 0` → primary "ปิดโต๊ะ" → `POST /visits/:id/close` → Toast "ปิดโต๊ะ {label} แล้ว", drawer closes, `['tables']` invalidated, card free.
  - `409 PAYMENT_IN_FLIGHT` → modal closes, panel·4 Alert · `409 INVALID_STATE_TRANSITION` (closed elsewhere) → Toast "โต๊ะนี้ถูกปิดไปแล้ว", drawer closes, refetch · network → Alert in the modal, retry.
- **Live:** on `order.created`, `ticket.status_changed`, `payment.status_changed` (same `visitId`) and `visit.state_changed` (same visit) → invalidate `['visits', id]`; a visit closed elsewhere → drawer closes with the Toast above.
- **States:** loading (skeleton rows) · error = shared `components/ui/LoadError` (029) · 404 → Toast "ไม่พบโต๊ะนี้" + param cleared.
- MSW handlers for `/visits/:id`, `/visits/:id/close`, `/venue`.

### Out (do NOT build here)
- Payment entry + "ไปชำระเงิน" → 033 · order entry entry point → 031.
- Void / comp (BRIEF-018) · ⋯ QR actions · idle warning + "ยังใช้งานอยู่" · join banner panel·7 (029 selects the joined visit; no extra Alert) · receipt print · permission hiding.

## 3. Contract
- **Endpoints used (all exist):** `GET /visits/:id` → `VisitDetail` · `POST /visits/:id/close` → `Visit` · `GET /venue` → `VenueSettings`.
- **WS events:** `order.created`, `ticket.status_changed`, `payment.status_changed` (room `staff`) · `visit.state_changed` (room `pos`).
- **Contracts changes:** none.
- **Permissions:** `visits:read`, `visits:close`, `venue:read` (server-side).
- **Business rules:**
  - Close only through the confirm; remaining > 0 never calls close → CD-02 §9.
  - While any payment is pending the bill is locked and close returns 409 → FRD §7 · BRIEF-013.
  - Groups = tickets; one ticket per order when the kitchen screen is off → DR-013 · CD-02 R9.
  - Totals come from the server (`bill`, `lineTotal`); cancelled lines are already excluded → BRIEF-012 · api README Money.
  - A table is closed only by a person (no auto-close) → DR-014 #2.

### 3b. Under the hood
- **Where:** `app/pos/tables/_components/{SessionDrawer,OrderGroup,OrderLineRow,BillFooter,CloseConfirmModal}.tsx` · `lib/api/visits.ts` · `lib/api/venue.ts`.
- **How:** `useSearchParams().get('visit')` → `useQuery(['visits', id])` → render; close → `useMutation` → on success invalidate `['tables']`, remove `['visits', id]`, clear the param.
- **Failure:** 409 codes branch as §2; everything else = Alert + retry.
- **Why:** URL state lets a reload or a link reopen the same drawer, and keeps 029 and 030 decoupled.

## 4. Acceptance Criteria
- **AC-1** — Given a visit with two orders (kitchen screen off), the drawer shows two groups newest first, each with time, `#orderNumber` and ticket chip, lines with qty / modifiers / orderer / `lineTotal`, and the footer `bill` values.
- **AC-2** — With `kitchenDisplayEnabled = true`, one order with bar + kitchen items shows two groups labelled บาร์ / ครัว sharing the order number.
- **AC-3** — A cancelled line is struck with "ยกเลิก" and the ticket with all lines cancelled shows "ยกเลิกทั้งใบ"; footer totals equal the server `bill`.
- **AC-4** — Given `remaining = 0`, close confirm → exactly one `POST /visits/:id/close` → Toast, drawer closes, card free. Given `remaining > 0`, the confirm shows the outstanding Alert and sends no request.
- **AC-5** — `bill.locked = true` → paying Alert and ปิดโต๊ะ disabled; a close that returns `409 PAYMENT_IN_FLIGHT` shows the same Alert; `409 INVALID_STATE_TRANSITION` closes the drawer with "โต๊ะนี้ถูกปิดไปแล้ว".
- **AC-6** — An `order.created` for this visit refetches the drawer (new group on top) without closing it.
- **AC-7** — Loading / error+retry / 404 states per §2.
- **AC-8** — Gates pass; run proof done.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1–AC-3, AC-7 | component | `src/app/pos/tables/_components/SessionDrawer.test.tsx` |
| AC-4, AC-5 | component | `src/app/pos/tables/_components/CloseConfirmModal.test.tsx` |
| AC-6 | component | `SessionDrawer.test.tsx` (fake socket event) |
| AC-4 | e2e | `e2e/tables.spec.ts` (open → drawer → close, MSW) |

Gate commands (all must pass):
```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend test:e2e
pnpm --filter @bar/frontend build
```
Run proof: BRIEF-028 run proof. UI change: open a table → tap it → drawer "ยังไม่มีออเดอร์" → ปิดโต๊ะ → card free. With an order placed via the API (`POST /visits/:id/orders`, seeded menu) the drawer shows the group and total. Screenshot in the handoff.

### Local Sonar scan
- Optional — Field's brief.

## 6. Constraints
- Never compute money; show server strings with `฿` via `formatTHB()` (`frontend.md` utils).
- Drawer is a dialog labelled "โต๊ะ {label}"; icon buttons labelled (CD-02 §9 accessibility).
- `frontend.md` Hard Limits; tokens only; Thai strings from CD-02 §6.

## 7. Decision Points (Field Guard)
- **Pre-decided:** URL param `visit` (from 029) · paths above · no new packages.
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
| 1 | 2026-10-21 | Initial Draft (Cowork) — 10 Nov UI slice #3 |
| 1 | 2026-10-21 | 029 merged (#70); error state reuses `LoadError` |
| 1 | 2026-10-21 | Field approved Rev 1 → Ready ("approve BRIEF-030 Rev 1 Ready") — recorded by Cowork on Field's explicit instruction |

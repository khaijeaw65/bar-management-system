# BRIEF-029 — Web POS: table grid, open table, live updates

| | |
|---|---|
| **Status** | Ready |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | frontend |
| **Revision** | 1 |
| **Depends on** | **BRIEF-028 merged ✅ (#69)** (axios client, session gate) · BRIEF-011 ✅ (`GET /tables`, `POST /visits`, `visit.*` events) · BRIEF-012 ✅ (`total`, `itemCount`, `order.created`) · BRIEF-013 ✅ (`paymentPending`, `payment.status_changed`) |
| **References** | CD-02 handoff (grid · grid-states · open-table · realtime · §9) · FRD §3 · DR-014 #2 #5 · BRIEF-011 Q3 (ask before joining) · `docs/api/README.md` §1 Realtime · `docs/rules/frontend.md` Real-time |
| **Audit depth** | Compact (UI; no money writes) |
| **Size** | ~1 day · est. ~500–600 net-new lines |

---

## 1. Goal
The cashier sees every seat on one screen (free / open / active / paying), opens a table in two taps, never joins someone else's table silently, and the grid updates live. `/pos/tables` becomes the POS home.

## 2. Scope
### In
- **Route `/pos/tables`** (rail "โต๊ะ" links here; `/` redirects here instead of `/pos/menu` — update `e2e/menu.spec.ts` to open `/pos/menu` directly).
- **Grid (CD-02 grid·1–2):** `GET /tables` (`TableListSchema`) → sections เคาน์เตอร์ / โต๊ะ by `kind`, sorted by `sortOrder` only. Summary chips: ใช้งาน n (seats with a visit) · ว่าง n. Card states:
  | State | Rule | Shows |
  |---|---|---|
  | free | `currentVisit = null` | label only, muted |
  | open | visit, `itemCount = 0` | label · "เปิดแล้ว" · "รอออเดอร์" · guest |
  | active | visit, `itemCount > 0` | label · guest · "n รายการ · h:mm" (since `openedAt`, ticks each minute) · `total` |
  | paying | `paymentPending = true` | active + chip "รอชำระ" |
  Long guest names truncate on cards (grid·2). 1024×768 layout per CD-02 §7.
- **Tap:** free card → open-table modal with the seat preselected · occupied card → `/pos/tables?visit=<visitId>` (URL state; the drawer is BRIEF-030 — here the card only gets the selected ring).
- **Open table modal (CD-02 open-table·1–5, ·7):** "+ เปิดโต๊ะ" opens it with a Select of free seats (none → "ไม่มีโต๊ะว่าง", button disabled); guest name optional (≤ 100, contracts message). Submit → `POST /visits { tableSeatId, guestLabel, via: 'pos' }`:
  - `201 attached:false` → Toast "เปิด {label} แล้ว" (+ "แขก {guest}"), modal closes, card updates (no QR step — see Out).
  - `200 attached:true` → **ask dialog (open-table·4, R2):** "{label} เพิ่งถูกเปิดไปแล้ว" · เปิดโดย (`openedBy.displayName`, or "ลูกค้า (สแกน QR)" when `openedVia = qr`) · เวลา · แขก · "เข้าโต๊ะเดิม ({guest})" → closes, selects that visit (`?visit=`) · "เลือกโต๊ะอื่น" → back to the form, seat cleared.
  - error → Alert "เปิดโต๊ะไม่สำเร็จ ลองอีกครั้ง", fields kept; button pending while submitting.
- **Realtime (first socket use):** `lib/socket/socket.ts` singleton — `socket.io-client`, URL = API origin + namespace `/staff`, `withCredentials: true`; `hooks/useSocketEvent(event, handler)` with cleanup. On `visit.opened`, `visit.state_changed`, `order.created`, `payment.status_changed` → invalidate `['tables']` (events notify, client refetches — api README §1). `connect_error` with an auth error → one refresh through the BRIEF-028 client, then reconnect.
- **Disconnected banner (grid-states·4):** socket down > 3 s → Alert warning "การเชื่อมต่อขาด ข้อมูลอาจไม่อัปเดต", grid keeps last data; on reconnect → refetch, banner hides.
- **States:** loading skeleton · empty "ยังไม่มีโต๊ะ — เพิ่มโต๊ะในหน้าตั้งค่า" (no button: settings page doesn't exist) · error Alert + "ลองอีกครั้ง".
- **Shared error state (BRIEF-028 audit S3):** `components/ui/LoadError.tsx` = HeroUI `Alert` (danger) + "ลองอีกครั้ง" `Button`, used by the grid error state and by `SessionGate`'s non-auth error fallback (replaces its plain `<p>` + `<button>`).
- MSW handlers for `/tables`, `/visits` (201 + attached) for tests.

### Out (do NOT build here)
- Session drawer, close table → **BRIEF-030** · order entry → 031 · payment → 033.
- QR success modal (open-table·6), reprint / regenerate QR — the customer QR route doesn't exist yet; table opens show the Toast only.
- Staff-called flag + "รับทราบ" (customer-QR brief) · idle warning (no last-activity field) · "แก้วที่ขายแล้ว" / sales stat tiles (dashboard) · permission hiding (IAM).

## 3. Contract
- **Endpoints used (all exist):** `GET /tables` → `TableList` · `POST /visits` → `OpenVisitResponse` (201 / 200).
- **WS events (namespace `/staff`):** `visit.opened` (room `pos`, payload `TableSummary`) · `visit.state_changed` (`pos`) · `order.created` (`staff`) · `payment.status_changed` (`staff`). Server joins every staff socket to both rooms.
- **Contracts changes:** none.
- **Permissions:** `tables:read`, `visits:open` (server-side).
- **Business rules:**
  - Attach is a normal outcome, never an error, and the POS never joins silently → BRIEF-011 Q3 · CD-02 R2.
  - Sort by `sortOrder` only; no card moves on state change → CD-02 F3.
  - Counter seats: no QR step after opening → DR-014 #5.
  - Elapsed time from `openedAt`; money shown as returned (`฿` + string), never computed → api README §1 Money.

### 3b. Under the hood
- **When:** POS home load · any seat change on any device.
- **Where:** `app/pos/tables/page.tsx` · `_components/{TableGrid,TableCard,OpenTableModal,AttachDialog,DisconnectedBanner}.tsx` · `lib/api/tables.ts` · `lib/socket/socket.ts` · `hooks/useSocketEvent.ts`.
- **How:** 1. `useQuery(['tables'])` → `GET /tables`. 2. open → `useMutation` → `POST /visits` → branch on `attached`. 3. socket event → `invalidateQueries(['tables'])`.
- **Failure:** socket down → banner + last data; REST failure → error state.
- **Why:** refetch-on-event keeps one source of truth (REST) and survives missed events.

## 4. Acceptance Criteria
- **AC-1** — Given seats with no visit / an open visit with 0 items / an active visit / a visit with a pending payment, the grid shows the four card states of §2 in `sortOrder` within เคาน์เตอร์ and โต๊ะ, with correct summary counts.
- **AC-2** — Given a free seat, tapping it then "เปิดโต๊ะ" with guest "แพร" sends exactly one `POST /visits { tableSeatId, guestLabel: 'แพร', via: 'pos' }`; on `201` a Toast "เปิด {label} แล้ว" shows and the card becomes "open".
- **AC-3** — Given the server answers `200 attached:true, openedVia:'qr'`, the ask dialog shows "ลูกค้า (สแกน QR)", time and guest; "เข้าโต๊ะเดิม" sets `?visit=<that id>`; "เลือกโต๊ะอื่น" returns to the form with the seat cleared; no second request is sent.
- **AC-4** — "+ เปิดโต๊ะ" lists only free seats; with none, the Select reads "ไม่มีโต๊ะว่าง" and the button is disabled. A failed open shows the Alert and keeps the guest name.
- **AC-5** — When `visit.opened` / `order.created` / `payment.status_changed` arrives, the grid refetches and the card changes in place without a page reload (e2e: emit via a second browser opening a table, or the run proof).
- **AC-6** — Socket down > 3 s → warning banner, data kept; reconnect → banner hides and one refetch runs.
- **AC-7** — Loading / empty / error+retry states render per §2; tapping an occupied card sets `?visit=` and the selected ring.
- **AC-8** — Gates pass; run proof done.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-7 | component | `src/app/pos/tables/_components/TableGrid.test.tsx` |
| AC-2–AC-4 | component | `src/app/pos/tables/_components/OpenTableModal.test.tsx` |
| AC-5, AC-6 | unit | `src/hooks/useSocketEvent.test.ts` (fake socket) |
| AC-2, AC-3 | e2e | `e2e/tables.spec.ts` (MSW) |

Gate commands (all must pass):
```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend test:e2e
pnpm --filter @bar/frontend build
```
Run proof: BRIEF-028 run proof (backend + `seed:venue` + frontend dev, mocks off, Field's LINE session). UI change: `/pos/tables` → open a free table with a guest name → card turns "open"; in a second tab open another seat → first tab updates live. Screenshot in the handoff.

### Local Sonar scan
- Optional — Field's brief.

## 6. Constraints
- One socket per tab; listeners removed in `useEffect` cleanup (`frontend.md` Real-time).
- Server state in React Query only; modal open/selected seat = local state or URL.
- `frontend.md` Hard Limits; tokens only; Thai strings from CD-02 §6.
- Touch targets ≥ 44, primary 52; no hover-only affordances (CD-02 §9).

## 7. Decision Points (Field Guard)
- **Pre-decided:** `socket.io-client@^4.8.4` (same version as the backend's test dependency in the lockfile) · route `/pos/tables` · URL param `visit` as the drawer contract with BRIEF-030 · no other new packages.
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
| 1 | 2026-10-21 | Initial Draft (Cowork) — 10 Nov UI slice #2 |
| 1 | 2026-10-21 | + shared `LoadError` (BRIEF-028 S3); 028 merged (#69) |
| 1 | 2026-10-21 | Field approved Rev 1 → Ready ("approve BRIEF-029 Rev 1 Ready") — recorded by Cowork on Field's explicit instruction |

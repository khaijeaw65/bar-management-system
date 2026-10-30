# Handoff — BRIEF-050 Customer QR: running tab, call staff, live updates, table closed (C4)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-30 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-050-customer-tab-bell-live` |
| **Commit** | Work SHA: see chat |
| **Status** | Implemented — awaiting `audit BRIEF-050` (Cowork) |

## Summary
**Backend**
- Bind on read: `GuestSessionService` binds a seat-only session to the seat's live visit (`TableSeatService.findLiveVisitId` → existing `bindVisit`); the view carries `justBound`, and `GuestSessionGuard` then calls `CustomerTabGateway.bindSession` so open sockets join `visit:{id}`.
- Seat ping: `VisitService.announceOpened(seatId, visitId)` → `NotificationsService.emitSeatVisitOpened` → `CustomerGateway` emits `tab.changed { visitId }` to `seat:{id}` (staff + guest open paths).
- `CustomerMenuService` drops categories with no guest item left (049 S4).
**Frontend**
- `/customer/tab` (filter ทั้งหมด/ของฉัน, cards newest first, chips per station, struck cancelled lines, total + "อัปเดต"), header with bell + "บิลโต๊ะ ฿…", `CallStaffSheet` (Drawer, 60 s lock, 429 → locked with server message), `lib/socket/customer-socket.ts` + `useCustomerLive` (tab.changed → refetch, `sessionEnded` → closed screen, lost → banner, reconnect → refetch, refused handshake → expired), `GuestClosed`, RATE_LIMITED cart notice (`cart.rateLimited`, cart stays editable), send → `/customer/tab` with the Toast raised on the tab screen, Toasts cleared on route change.
- Closed = `cart.closed` (socket `sessionEnded` or 409 at send); `saveCart` drops the stored cart when closed.
- ~1.9k lines incl. tests.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | e2e `customer-order` (bind on read), `customer-ws` (seat ping), unit `guest-session.service.spec` |
| AC-2 | ✅ | e2e `customer-session` (ค่าบริการ absent) |
| AC-3 | ✅ | `TabScreen.test`, e2e `customer-tab` |
| AC-4 | ✅ | `CustomerShell.test` (ping refetch), e2e ping, real-stack run |
| AC-5 | ✅ | `CallStaffButton.test`, e2e |
| AC-6 | ✅ | `CustomerShell.test`, e2e, real-stack run |
| AC-7 | ✅ | `CustomerShell.test`, e2e (mock socket handlers) |
| AC-8 | ✅ | `CartScreen.test` |
| AC-9 | ✅ | `CustomerFrame` effect cleanup clears Toasts; e2e 360 no sideways scroll |
| AC-10 | ✅ | below |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| contracts build · backend lint · typecheck | 0 | clean |
| backend `test` | 0 | 176 passed |
| backend `test:e2e` | 0 | 204 passed (dev backend stopped first; an earlier run with it up failed 2 unrelated tests) |
| frontend lint · typecheck | 0 | clean |
| frontend `test` | 0 | 220 passed |
| frontend `test:e2e` | 0 | 34 passed (customer-tab ×5) |
| frontend `build` | 0 | `/customer/tab` listed |

Run proof (real API :3011 + `next dev` :3010, dev `bar`, T3, 390×844, work SHA): B scanned free T3 (seat-only) → POS opened T3 (API, minted staff token) → A (curl cookie jar, second phone) scanned + ordered 2× ช้างดราฟต์ → B's header showed "บิลโต๊ะ ฿240.00" without reload, tab showed A's order → POS accepted the ticket → chip "ส่งแล้ว" → "ร้านกำลังเตรียม" live → B bell เช็คบิล → sent + locked 60 s, `GET /api/tables` T3 `staffCall.reason = 'bill'` → POS closed T3 → closed screen. Screenshots: `docs/handoffs/assets/BRIEF-050/` (1 tab before, 2 live chip, 3 bell sent, 4 closed).
Not captured on the real stack: tab "ของฉัน" screenshot, disconnected banner, 86-void strike (covered by unit + e2e with mock socket). Phone A was curl, not a second browser window (cookies are shared per origin in one pane).

## Sonar
Not run — SonarQube stopped; required by the brief → run before the PR if wanted.

## Decisions Raised
- none

## Deviations / Notes
- E2E hooks: in mock mode `connectCustomerSocket` exposes handlers on `window.__customerSocket` and `mocks/browser.ts` exposes `window.__customerMock` (gated by `NEXT_PUBLIC_API_MOCKING`, dev only).
- Ticket status `issue` has no customer label in the brief; shown as "ร้านกำลังเตรียม". Station label food = "ครัว".
- Setup gaps (names only): backend `EASYSLIP_BASE_URL`, frontend `NEXT_PUBLIC_API_MOCKING` missing from local env files.
- Dev `bar` DB: T3 closed, orders #5 left.
- AI usage: **High** — executor wrote the code; KJ is full reviewer.

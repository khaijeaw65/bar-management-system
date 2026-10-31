# BRIEF-059 — Staff app: queue on the real API, live updates, card actions (M3)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-31 (in session) |
| **Implementer** | metee (learning mode — writes ≥ 70 % himself; agent ≤ 20 %, workflow §8) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **PR** | <executor fills> |
| **Affected apps** | mobile |
| **Revision** | 1 |
| **Depends on** | **BRIEF-010 merged** (queue screen on `TicketList` mocks) · **BRIEF-022 merged** (API client, Bearer, refresh) |
| **References** | `docs/design/CD-08-handoff.md` (queue·1–11, R7, R14, R15, R17, R18, action table rows "Load queue" / "Receive new order" / "Accept / ready / served") · DR-012, DR-013 (single ticket when kitchen screen off), DR-014 #1 (READY only when kitchen screen on) · BRIEF-012 / BRIEF-017 (tickets API) · BRIEF-054 (`GET /me/permissions`) · `docs/rules/mobile.md` |
| **Audit depth** | Full (writes order state; realtime) |
| **Size** | ~10–12 h (evenings) |

---

## 1. Goal
The bartender's phone shows the real queue, a new order appears by itself within ~2 s, and one tap on the card moves it forward (รับออเดอร์ → เสิร์ฟแล้ว, with พร้อมเสิร์ฟ only when the kitchen screen is on). Two people tapping the same card never double-change it. This is the first mobile brief that does real work in the bar.

## 2. Scope
### In
- **Real queue:** `getTicketQueue()` real branch → `GET /tickets?status=pending,accepted,ready,issue` via the BRIEF-022 client, validated with `TicketListSchema`. Mock branch (`EXPO_PUBLIC_USE_MOCKS=1`) keeps working.
- **Venue mode:** `GET /venue` (`VenueSettingsSchema`, cached 5 min) → `kitchenDisplayEnabled`:
  - **off (default, DR-014 #1):** no "พร้อมเสิร์ฟ" filter; accepted card button = "เสิร์ฟแล้ว" (`/send`).
  - **on:** "พร้อมเสิร์ฟ" filter shown; accepted card at a **table** = "พร้อมเสิร์ฟ" (`/ready`), at a **counter** seat = "เสิร์ฟแล้ว" (R15); ready card = "เสิร์ฟแล้ว".
  - **Station label (R18):** "· บาร์" / "· ครัว" on the seat line **only when the order has more than one ticket** in the list (split); otherwise "T3 · ต้น". *This corrects BRIEF-010's always-on station label.*
- **Card actions (R7):** status chip + acceptor ("กำลังเตรียม · บีม" from `acceptedBy`) on the top row; one action button bottom-left (≤ 190 px): pending → "รับออเดอร์" (`POST /tickets/:id/accept`), then per venue mode above. Button shows pending while the call runs; success replaces the ticket in the cache with the returned `Ticket`.
  - `send` success → Toast "เสิร์ฟ #0044 แล้ว · T3", card leaves the queue (R9).
  - `issue` tickets: no action button in this brief (detail + issue flow = M4); card shows the issue chip only.
- **Conflicts (R14):** `409 INVALID_STATE_TRANSITION` → refetch the queue, then:
  - the ticket is now at or past the step the user tried → **info** Toast "{acceptedBy.displayName} รับออเดอร์ #0041 แล้ว" / "ไม่ต้องทำซ้ำ" (for accept; for ready/send: "#0041 อัปเดตแล้ว");
  - otherwise → warning Toast "สถานะเปลี่ยนแล้ว ลองอีกครั้ง".
  The API's 409 carries no ticket, so the toast is built from the **refetched** ticket.
- **Read-only (queue·8):** `GET /me/permissions` (`MyPermissionsSchema`, refetch on app focus). Without `orders:update_status` → no action buttons. A `403` from an action → warning Toast + refetch permissions + queue.
- **Live (WS):** one socket.io client `src/lib/realtime/socket.ts` → namespace `/staff` at the API origin, `auth: { token: <access token> }`.
  - `order.created` → refetch queue; new ticket ids are highlighted (DS highlight token, ~3 s) + Toast "ออเดอร์ใหม่ #0050 · T3" + tab badge on ออเดอร์ (queue·5).
  - `ticket.status_changed` → refetch queue (no highlight).
  - `connect` after a drop → refetch; while disconnected > 3 s → banner queue·6 "การเชื่อมต่อขาด กำลังเชื่อมต่อใหม่…".
  - `connect_error` "unauthorized" → refresh tokens once via the BRIEF-022 client, then reconnect with the new token; refresh fails → login·5 (BRIEF-022 path).
  - Socket connects only while signed in; disconnects on logout.
- Pull-to-refresh and the BRIEF-010 loading / empty / error states stay.

### Out (do NOT build here)
- Order detail screen, report / resolve issue (CD-08 detail·*, issue·*) → **M4**.
- Menu availability (86) on the phone → M5 · push notifications, staff call → M6 · new order (CD-14) → later.
- Sold-out auto-cancel UI (queue·11 Toast) — the refetch already shows the struck line; the warning Toast is M4.
- Any change to `app/backend`, `app/frontend`, `app/packages/contracts` — if something is missing, tell Field.

## 3. Contract
Built by BRIEF-012 / BRIEF-017 / BRIEF-054 — consume, don't change.
| Call | Permission | Returns |
|---|---|---|
| `GET /tickets?status=pending,accepted,ready,issue` | `orders:read` | `TicketList` (charge tickets excluded) |
| `POST /tickets/:id/accept` · `/ready` · `/send` | `orders:update_status` | `Ticket` · `409 INVALID_STATE_TRANSITION` (no body data) · `403 FORBIDDEN` |
| `GET /venue` | `venue:read` (พนักงาน has it) | `VenueSettings` |
| `GET /me/permissions` | any staff | `MyPermissions` |
| WS `/staff` | access token in `auth.token` | `order.created` (`OrderCreatedPayloadSchema`), `ticket.status_changed` (`TicketStatusChangedPayloadSchema`) |
Server rules the UI mirrors (not re-implements): `ready` only when kitchen on **and** seat kind `table`; `send` from `ready`, or from `accepted` when READY is skipped (`ticket-transition.ts`).
- **Contracts changes:** none · **New WS events:** none.

## 4. Acceptance Criteria
- **AC-1** — Given `EXPO_PUBLIC_USE_MOCKS=0` and a signed-in staff, when ออเดอร์ opens, then `GET /tickets?status=pending,accepted,ready,issue` is called once and cards render from the response (oldest first).
- **AC-2 (kitchen off)** — Given `kitchenDisplayEnabled=false`, then no "พร้อมเสิร์ฟ" filter exists; pending → "รับออเดอร์" calls `/accept` once; the returned ticket shows "กำลังเตรียม · {name}" and button "เสิร์ฟแล้ว"; tapping it calls `/send` once, Toast "เสิร์ฟ #… แล้ว · {seat}", card gone. **No `/ready` call ever.**
- **AC-3 (kitchen on)** — Given `kitchenDisplayEnabled=true`, then "พร้อมเสิร์ฟ" filter shows; an accepted **table** ticket shows "พร้อมเสิร์ฟ" (`/ready`); an accepted **counter** ticket shows "เสิร์ฟแล้ว" (`/send`); a ready ticket shows "เสิร์ฟแล้ว".
- **AC-4 (station label)** — Given an order with 2 tickets in the list, then both cards show "· บาร์" / "· ครัว"; given an order with 1 ticket, then no station label.
- **AC-5 (conflict)** — Given `/accept` returns 409 and the refetched ticket is `accepted` by "เอ", then an **info** Toast "เอ รับออเดอร์ #0041 แล้ว" shows and the card shows the refetched state; given the refetched ticket is in any other state, then a warning Toast shows. In both cases no second action call is made.
- **AC-6 (read-only)** — Given `/me/permissions` without `orders:update_status`, then no card has an action button; given an action returns 403, then a warning Toast shows and permissions + queue are refetched.
- **AC-7 (live new order)** — Given the socket emits `order.created`, then the queue refetches, the new card is highlighted, Toast "ออเดอร์ใหม่ #… · {seat}" shows and the ออเดอร์ tab shows a badge; `ticket.status_changed` refetches without a Toast.
- **AC-8 (connection)** — Given the socket disconnects for > 3 s, then the queue·6 banner shows; on reconnect the banner hides and the queue refetches. Given `connect_error` "unauthorized", then exactly one token refresh happens and the socket reconnects with the new token.
- **AC-9 (issue)** — Given an `issue` ticket, then its card shows the issue chip and **no** action button.
- **AC-10 (real device)** — Android dev build against the dev backend over the tunnel: POS creates an order → card appears on the phone within ~2 s with Toast → phone รับออเดอร์ → POS orders board shows "กำลังเตรียม · {name}" → phone เสิร์ฟแล้ว → gone on both → POS and phone both tap รับออเดอร์ on another order within 1 s → one wins, the other gets the info Toast. Screen recording in the handoff.
- **AC-11** — Gates pass; mocks mode still runs the whole app with no backend (socket not created in mock mode).

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1–AC-6, AC-9 | component (mock the API module / client transport) | `src/__tests__/app/orders-actions.test.tsx` |
| AC-4 | unit | `src/__tests__/lib/tickets/seat-line.test.ts` |
| AC-7, AC-8 | unit / component (mock `socket.io-client`) | `src/__tests__/lib/realtime/socket.test.ts` · `src/__tests__/app/orders-live.test.tsx` |
| AC-10 | manual | screen recording in the handoff |
| AC-11 | command | gates + `EXPO_PUBLIC_USE_MOCKS=1` smoke |

Gate commands (all must pass):
```bash
pnpm --filter @bar/mobile lint
pnpm --filter @bar/mobile typecheck
pnpm --filter @bar/mobile test
pnpm --filter @bar/mobile export:check
```
A required script that doesn't exist yet = **BLOCKED** — report it, never skip silently.

### Local Sonar scan
- Required: yes (always for Metee). Approved exclusions: none.

## 6. Constraints
- `docs/rules/mobile.md` throughout. Screens never call axios / socket directly — `src/lib/api/*` and `src/lib/realtime/socket.ts` only.
- **Next action is derived in one pure function** `nextAction(ticket, kitchenOn): 'accept' | 'ready' | 'send' | null` (`src/lib/tickets/next-action.ts`) — used by the card and tested alone. It mirrors the server rule; the server stays the authority (409 handles drift).
- Permissions only from `/me/permissions` — never from group names.
- Copy exactly as §2 / CD-08 (queue·5–8, R9, R14).
- **Learning mode:** Metee writes `nextAction`, the 409 handling, the socket module and all tests himself. An agent may explain socket.io auth / reconnect and review. Handoff: AI usage Low / Medium / High + what for.
- **G3 walkthrough topic (suggested):** why the app refetches on every event instead of patching the cache from the payload, and when that stops being good enough.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact only):**
  | Package | Version | How |
  |---|---|---|
  | `socket.io-client` | `^4.8.4` (same as web) | `pnpm add socket.io-client` in `app/mobile` |
  - Refetch-on-event (no cache patching) · highlight ~3 s · disconnect banner after 3 s · venue cache 5 min · permissions refetch on app focus.
- **Likely DRs:** socket.io over the ngrok tunnel fails on Android (e.g. websocket upgrade blocked) → tell Field before switching transports; any extra package → DR.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions (BRIEF-010 + BRIEF-022 merged)
- [x] No unresolved decision blocking the main outcome
- [x] Field explicitly approved this revision (2026-10-31, in session)

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-31 | Initial Draft (Cowork) — M3 of the mobile queue; Field chose the split (detail + issue = M4) in session |
| 1 | 2026-10-31 | Ready — Rev 1 approved by Field in session ("approve BRIEF-059 Rev 1 Ready") |

# BRIEF-010 — Staff app: shell, mock login, order queue (read-only, mocks)

| | |
|---|---|
| **Status** | Ready — Rev 3 approved by Field 2026-10-31 (in session) · Rev 1 2026-10-04 · Rev 2 2026-10-10 (DR-012) |
| **Implementer** | metee (learning mode — writes ≥ 70 % himself; agent ≤ 20 %) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **PR** | <executor fills> |
| **Affected apps** | mobile |
| **Revision** | 3 |
| **Depends on** | **BRIEF-002 merged** (Expo scaffold) ✅ · contracts `TicketListSchema` exists (BRIEF-009 / BRIEF-012 merged) ✅ — nothing blocks start |
| **References** | `docs/rules/mobile.md` · DR-008, DR-009 (staff app scope), DR-012 (station tickets, labels) · DR-005 (auth, mocked here) · FRD §6 (order states, order card) · `docs/design/CD-00-handoff.md` §2 (order chips) · `docs/design/CD-02-handoff.md` F1 (money) · `docs/briefs/ui/staff-mobile.md` Screen 1–2 (content reference only — old tokens/PWA wording ignored) |
| **Audit depth** | Compact (UI on mocks, no auth/payment logic) |
| **Size** | ~8–10 h (Week 0, evenings) |

---

## 1. Goal
A staff member opens the app, "logs in" with a mock session, and lands on **ออเดอร์** — a live-looking order queue (from fixtures) filtered by status, with loading / empty / error states. This is the base every later mobile brief builds on, and the gate-demo screen.

## 2. Scope
### In
- **Providers** in `src/app/_layout.tsx`: keep BRIEF-002 setup, add `QueryClientProvider` (one `QueryClient`, `retry: 1`), and an **auth gate**: no session → `/login`, session → `(tabs)`.
- **Mock session** `src/lib/auth/session.ts`: `signIn()` (mock: stores `{ staffName: 'บีม', role: 'bartender' }` in memory, 500 ms delay), `signOut()`, `useSession()`. Shape ready for DR-005 later; **no SecureStore yet**.
- **Login screen** `src/app/login.tsx`: bar name "The Loft Bar", subtitle "ระบบจัดการบาร์", HeroUI Native `Button` "เข้าสู่ระบบด้วย LINE" (mock `signIn`, pending state while signing in), footer "เฉพาะพนักงาน The Loft Bar". Error state: Alert "เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้ง" (triggered by a mock flag in tests).
- **Tabs** `src/app/(tabs)/_layout.tsx`: bottom tabs **ออเดอร์** (active, `ClipboardList`) and **อื่นๆ** (`Menu`) only. อื่นๆ screen = staff name + Button "ออกจากระบบ" → `signOut()` → `/login`.
- **Order queue** `src/app/(tabs)/orders.tsx`:
  - Header "ออเดอร์".
  - Filter tabs (HeroUI Native `Tabs` or `Chip` row, horizontal scroll): **ทั้งหมด · ใหม่ · กำลังเตรียม · พร้อมเสิร์ฟ · มีปัญหา** → `all | pending | accepted | ready | issue`. `sent` orders are not shown in the queue. "มีปัญหา" shows a dot when any `issue` exists.
  - `FlatList` of **OrderCard** (`src/components/order/OrderCard.tsx`): row 1 order no. "#0042" + time ago "2 นาทีที่แล้ว" · row 2 "T3 · ต้น · บาร์" (`seat.label` · first non-null `items[].orderedByName` · station label บาร์ / ครัว from `station`) · items "2× ช้างดราฟต์" (`quantity`× `name`) max 3 lines then "+ 2 รายการ" · status chip (CD-00 §2 label + tone). Order no. = `orderNumber` padded "#0042". Item lines carry no status chip; a line with `cancelledAt` is struck through (DR-012).
  - Pull-to-refresh (`refetch`).
  - States: loading (Skeleton ×4) · empty per filter "ยังไม่มีออเดอร์" · error Alert "โหลดออเดอร์ไม่สำเร็จ" + Button "ลองอีกครั้ง".
  - Sort: oldest first (bartender works FIFO).
- **API layer + mocks** (mobile.md → Mocks): `src/lib/api/tickets.ts` `getTicketQueue(): Promise<TicketList>` → returns `src/mocks/tickets.ts` when `EXPO_PUBLIC_USE_MOCKS=1` (300 ms delay); real branch throws `Error('API not wired — M3')` for now (BRIEF-022 adds the client, M3 wires it). Hook `src/hooks/useTicketQueue.ts` (`['tickets', 'queue']`).
- **Fixtures** typed as `TicketList` from `@bar/contracts`: 8 tickets covering every queue status, 1–5 lines each, mixed seats (T1–T6 `table`, C1–C8 `counter`), 2 with no `orderedByName`, 1 with a cancelled line (`cancelledAt` + `cancellation` set), 1 `issue` ticket with `issue` filled, **1 order = 2 tickets (bar + food) sharing an `orderId`** (DR-012).
- **Utils** `src/lib/utils/`: `formatBaht()` (`฿1,240.00`, not used on cards yet — tested now for later), `timeAgo()` (Thai: "เมื่อกี้", "n นาทีที่แล้ว", "n ชม.ที่แล้ว").
- Replace BRIEF-002's placeholder `src/app/index.tsx` (redirect only) — its `OrderStatusSchema` demo import goes with it.
- Map design tokens into `src/global.css` for the colors this brief uses (chip tones, surface, text) from `docs/design/tokens-v2.css`; no hex in `.tsx`.

### Out (do NOT build here)
- Status actions (รับออเดอร์ / พร้อมแล้ว / เสิร์ฟแล้ว / แก้ไข), order detail screen → next mobile brief.
- Real LINE login, SecureStore, `expo-web-browser` (DR-005 brief), axios client, socket.io, push, table list, new order, guest, bottle keep, payment tabs.
- Any change to `app/backend`, `app/frontend`, `app/packages/contracts`.

## 3. Contract
- **Endpoint (real, built by BRIEF-012):** `GET /api/tickets?status=pending,accepted,ready,issue` (`orders:read`) → `TicketList`. Charge tickets are excluded server-side, so `station` is always `bar | food` in the queue. Mocked here; wired in M3.
- **Schema:** import `TicketListSchema`, `TicketList`, `Ticket`, `OrderStatus` from `@bar/contracts` — **no local copy** of order/ticket schemas. Fields used: `id`, `orderId`, `orderNumber`, `station`, `status`, `seat.label`, `items[].{quantity,name,orderedByName,cancelledAt}`, `issue`, `createdAt`.
- **Envelope:** mocks return `data` only (the client that unwraps `{status, code, message, data}` comes with BRIEF-022).
- **Contracts changes:** none · **Permissions:** none (mocked).

## 4. Acceptance Criteria
- **AC-1** — Given no session, when the app starts, then the login screen shows; when "เข้าสู่ระบบด้วย LINE" is pressed, then the button shows pending and the app lands on ออเดอร์.
- **AC-2** — Given a session, when อื่นๆ → "ออกจากระบบ", then the app returns to login and the back gesture cannot reach the queue.
- **AC-3** — Given fixtures, when ออเดอร์ opens, then Skeletons show during the mock delay and then cards render oldest first with order no., time ago, "table · name", ≤ 3 item lines + "+ n รายการ", and the CD-00 chip label for the status.
- **AC-4** — Given each filter tab, when selected, then only tickets with that status show; `sent` and `cancelled` never show; "มีปัญหา" shows a dot while any `issue` ticket exists.
- **AC-5** — Given a filter with no orders, then "ยังไม่มีออเดอร์" shows; given the mock in error mode, then the error Alert shows and "ลองอีกครั้ง" refetches.
- **AC-6** — The fixture list passes `TicketListSchema` from `@bar/contracts` (test).
- **AC-7** — `formatBaht(1240)` → `฿1,240.00`; `timeAgo` returns the Thai strings above for 30 s, 2 min, 90 min.
- **AC-8** — Dark and light both render with token colors only (no hex in `.tsx` — grep).
- **AC-9** — Gates pass; no local order/ticket schema in `app/mobile` (`grep -rn "z.enum(\['pending'\|OrderQueueSchema" app/mobile/src` → none).

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2 | component | `src/__tests__/app/login.test.tsx`, `src/__tests__/app/tabs-more.test.tsx` |
| AC-3–AC-5 | component | `src/__tests__/app/orders.test.tsx` |
| AC-6 | unit | `src/__tests__/mocks/tickets.test.ts` |
| AC-7 | unit | `src/__tests__/lib/utils.test.ts` |
| AC-8 | manual + grep | 4 screenshots (login + queue, dark + light) from the Android dev build in the handoff · `grep -rn "#[0-9a-fA-F]\{3,6\}" app/mobile/src --include=*.tsx` → none |
| AC-9 | command | gates + grep above → none |

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
- Follow `docs/rules/mobile.md` (routes only under `src/app/`, tests under `src/__tests__/`, named exports, limits 150/100/40 lines, ≤ 3 `useState`).
- HeroUI Native components first; name any custom component in the PR. Lucide icons only.
- Thai strings exactly as written in §2 / CD-00 §2.
- Learning mode: Metee writes the screens, hooks and tests himself; an agent may help with setup, test scaffolding and explaining errors. Note in the handoff which parts an agent wrote.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact only):**
  | Package | Version | How |
  |---|---|---|
  | `@tanstack/react-query` | `^5.103.2` (same as web) | `pnpm add` in `app/mobile` |
  | `zod` | `4.6.5` (exact, same pin as web/backend) | `pnpm add` in `app/mobile` |
  - Env: `EXPO_PUBLIC_USE_MOCKS=1` in `app/mobile/.env.example` (+ local `.env`, gitignored).
  - Tabs layout via Expo Router `Tabs` (already installed with `expo-router`) — no extra navigation package.
- **Likely DRs:** HeroUI Native has no tab-bar / filter component that fits → use Expo Router `Tabs` + HeroUI `Chip` row; anything needing a new package → DR.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions (BRIEF-002 merged)
- [x] No unresolved decision blocking the main outcome
- [x] Field explicitly approved this revision (Rev 3, 2026-10-31, in session)

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-04 | Initial — replaces the old "BRIEF-010 menu-list redesign" (web, now Field's per DR-008) |
| 2 | 2026-10-10 | DR-012 + Amendment 1: `accepted` label "กำลังเตรียม"; card = station ticket (`placementId`, `station`, label บาร์ / ครัว); no item status chips, cancelled struck; `order_status += cancelled`; fixture with a 2-ticket placement (Field approved in session) |
| 3 | 2026-10-31 | Real API exists now: provisional local schema → `TicketListSchema` from `@bar/contracts`; endpoint `GET /tickets`; field map (`orderNumber`, `seat.label`, `orderId` replaces `placementId`, `cancelledAt` replaces item status); files renamed orders → tickets; real branch wired in M3. Screens, copy, states unchanged (Cowork) |
| 3 | 2026-10-31 | Ready — Rev 3 approved by Field in session ("approve 010 Rev 3 and 022 Rev 2") |

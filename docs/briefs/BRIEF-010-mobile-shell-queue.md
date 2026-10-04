# BRIEF-010 — Staff app: shell, mock login, order queue (read-only, mocks)

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | metee (learning mode — writes ≥ 70 % himself; agent ≤ 20 %) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **PR** | <executor fills> |
| **Affected apps** | mobile |
| **Revision** | 1 |
| **Depends on** | **BRIEF-002 merged** (Expo scaffold). Does **not** wait for BRIEF-009 — uses provisional local schemas (§3) |
| **References** | `docs/rules/mobile.md` · DR-008, DR-009 (staff app scope) · DR-005 (auth, mocked here) · FRD §6 (order states, order card) · `docs/design/CD-00-handoff.md` §2 (order chips) · `docs/design/CD-02-handoff.md` F1 (money) · `docs/briefs/ui/staff-mobile.md` Screen 1–2 (content reference only — old tokens/PWA wording ignored) |
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
  - Filter tabs (HeroUI Native `Tabs` or `Chip` row, horizontal scroll): **ทั้งหมด · ใหม่ · กำลังทำ · พร้อมเสิร์ฟ · มีปัญหา** → `all | pending | accepted | ready | issue`. `sent` orders are not shown in the queue. "มีปัญหา" shows a dot when any `issue` exists.
  - `FlatList` of **OrderCard** (`src/components/order/OrderCard.tsx`): row 1 order no. "#0042" + time ago "2 นาทีที่แล้ว" · row 2 "T3 · ต้น" (table label · first `orderedByName`) · items "2× ช้างดราฟต์" max 3 lines then "+ 2 รายการ" · status chip (CD-00 §2 label + tone).
  - Pull-to-refresh (`refetch`).
  - States: loading (Skeleton ×4) · empty per filter "ยังไม่มีออเดอร์" · error Alert "โหลดออเดอร์ไม่สำเร็จ" + Button "ลองอีกครั้ง".
  - Sort: oldest first (bartender works FIFO).
- **API layer + mocks** (mobile.md → Mocks): `src/lib/api/orders.ts` `getOrderQueue(): Promise<OrderQueue>` → returns `src/mocks/orders.ts` when `EXPO_PUBLIC_USE_MOCKS=1` (300 ms delay); real branch throws `Error('API not wired — BRIEF-012+')` for now. Hook `src/hooks/useOrderQueue.ts` (`['orders', 'queue']`).
- **Fixtures**: 8 orders covering every queue status, 1–5 items each, mixed tables (T1–T6, C1–C8), 2 with no `orderedByName`, 1 with a cancelled item.
- **Utils** `src/lib/utils/`: `formatBaht()` (`฿1,240.00`, not used on cards yet — tested now for later), `timeAgo()` (Thai: "เมื่อกี้", "n นาทีที่แล้ว", "n ชม.ที่แล้ว").
- Replace BRIEF-002's placeholder `src/app/index.tsx` (redirect only) — **remove its `OrderStatus` import from `@bar/contracts`** (that enum is replaced by BRIEF-009).
- Map design tokens into `src/global.css` for the colors this brief uses (chip tones, surface, text) from `docs/design/tokens-v2.css`; no hex in `.tsx`.

### Out (do NOT build here)
- Status actions (รับออเดอร์ / พร้อมแล้ว / เสิร์ฟแล้ว / แก้ไข), order detail screen → next mobile brief.
- Real LINE login, SecureStore, `expo-web-browser` (DR-005 brief), axios client, socket.io, push, table list, new order, guest, bottle keep, payment tabs.
- Any change to `app/backend`, `app/frontend`, `app/packages/contracts`.

## 3. Contract
- **Endpoint (future, catalog):** `GET /api/orders?status=pending,accepted,ready,issue` (`orders:read`). Mocked here.
- **Provisional schema** — local in `src/lib/api/orders.ts` (moves to `@bar/contracts` when the orders backend brief lands; field names must stay):
  ```ts
  const OrderStatusLocal = z.enum(['pending','accepted','ready','sent','issue']);           // = schema.sql order_status
  const OrderItemStatusLocal = z.enum(['pending','preparing','ready','cancelled']);        // = order_item_status
  const QueueItem = z.object({ id: z.string().uuid(), name: z.string(), variantName: z.string().nullable(),
    quantity: z.number().int().positive(), status: OrderItemStatusLocal, orderedByName: z.string().nullable(), notes: z.string().nullable() });
  const QueueOrder = z.object({ id: z.string().uuid(), number: z.number().int(), status: OrderStatusLocal,
    tableLabel: z.string(), visitId: z.string().uuid(), createdAt: z.string().datetime(), items: z.array(QueueItem).min(1) });
  export const OrderQueueSchema = z.object({ items: z.array(QueueOrder) });
  export type OrderQueue = z.infer<typeof OrderQueueSchema>;
  ```
- **Envelope:** mocks return `data` only (the client that unwraps `{status, code, message, data}` comes with the API-wiring brief).
- **Contracts changes:** none · **Permissions:** none (mocked).

## 4. Acceptance Criteria
- **AC-1** — Given no session, when the app starts, then the login screen shows; when "เข้าสู่ระบบด้วย LINE" is pressed, then the button shows pending and the app lands on ออเดอร์.
- **AC-2** — Given a session, when อื่นๆ → "ออกจากระบบ", then the app returns to login and the back gesture cannot reach the queue.
- **AC-3** — Given fixtures, when ออเดอร์ opens, then Skeletons show during the mock delay and then cards render oldest first with order no., time ago, "table · name", ≤ 3 item lines + "+ n รายการ", and the CD-00 chip label for the status.
- **AC-4** — Given each filter tab, when selected, then only orders with that status show; `sent` never shows; "มีปัญหา" shows a dot while any `issue` order exists.
- **AC-5** — Given a filter with no orders, then "ยังไม่มีออเดอร์" shows; given the mock in error mode, then the error Alert shows and "ลองอีกครั้ง" refetches.
- **AC-6** — Every fixture passes `OrderQueueSchema` (test).
- **AC-7** — `formatBaht(1240)` → `฿1,240.00`; `timeAgo` returns the Thai strings above for 30 s, 2 min, 90 min.
- **AC-8** — Dark and light both render with token colors only (no hex in `.tsx` — grep).
- **AC-9** — Gates pass; no import of `OrderStatus` / `SessionState` / `StaffRole` from `@bar/contracts` remains in `app/mobile`.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2 | component | `src/__tests__/app/login.test.tsx`, `src/__tests__/app/tabs-more.test.tsx` |
| AC-3–AC-5 | component | `src/__tests__/app/orders.test.tsx` |
| AC-6 | unit | `src/__tests__/mocks/orders.test.ts` |
| AC-7 | unit | `src/__tests__/lib/utils.test.ts` |
| AC-8 | manual + grep | 4 screenshots (login + queue, dark + light) from the Android dev build in the handoff · `grep -rn "#[0-9a-fA-F]\{3,6\}" app/mobile/src --include=*.tsx` → none |
| AC-9 | command | gates + `grep -rn "OrderStatus\b\|SessionState\|StaffRole" app/mobile/src` → none |

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
- [ ] Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-04 | Initial — replaces the old "BRIEF-010 menu-list redesign" (web, now Field's per DR-008) |

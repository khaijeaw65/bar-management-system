# Handoff — BRIEF-010 Staff app: shell, mock login, order queue (read-only, mocks)

| | |
|---|---|
| **Implementer** | methee (Antigravity) |
| **Date** | 2026-11-05 |
| **Brief revision** | 3 |
| **Branch** | `feat/BRIEF-010-mobile-shell-queue` (PR opens after audit PASS) |
| **Work Commit** | `<pending commit>` |
| **Status** | Implemented — awaiting audit |

> Created at Implemented. Updated once in the PASS commit. Frozen at merge.

---

## Part 1: Objective Receipts (Gate G1 & Run Proof)

### Gate Execution Results
| Gate | Command | Exit | Counts / Result |
|---|---|---|---|
| Lint | `pnpm --filter @bar/mobile lint` | 0 | pass (expo lint clean) |
| Typecheck | `pnpm --filter @bar/mobile typecheck` | 0 | pass (tsc --noEmit clean) |
| Scoped Unit Tests | `pnpm --filter @bar/mobile test` | 0 | 5 test suites passed, 12 tests passed |
| Project Build / Bundle Check | `pnpm --filter @bar/mobile export:check` | 0 | pass (Android bundle bundled 4,272 modules into `.expo-export/`) |
| Local Sonar scan | `pnpm sonar` | — | Not run (SONAR_TOKEN missing in repo root .env; local Sonar server not configured) |

### Grep Invariant Proofs
- **AC-8 (No hex in .tsx):**
  `grep -rn "#[0-9a-fA-F]\{3,6\}" app/mobile/src --include="*.tsx"` → **0 matches (exit 1)**
- **AC-9 (No local order/ticket schema copy):**
  `grep -rn "z.enum(\['pending'\|OrderQueueSchema" app/mobile/src` → **0 matches (exit 1)**

### Run Proof (Bundle Export Receipt)
Metro bundler successfully built the complete Android bundle:
```text
Android Bundled 10597ms node_modules/.pnpm/expo-router@57.0.23_a9c0b37da4f42659c5095816f7f19ee5/node_modules/expo-router/entry.js (4272 modules)
› Assets (36):
  NotoSansThai fonts (100–900), MaterialSymbols, expo-router assets
› android bundles (1):
  _expo/static/js/android/entry-bb8d3d2441126e8cebdac37435f3eb7b.hbc (7.4MB)
› Files (1):
  metadata.json (2.4KB)
Exported: .expo-export
```

---

## Part 2: Field Intelligence & Disclosures

### Gaps Found (Spec vs. Reality)
1. **React 19 & Testing Library v14 `render()` is Async:**
   `@testing-library/react-native` v14 with React 19 returns a Promise from `render()`. All test helpers and invocations must `await render(...)`.
2. **HeroUI Native in Jest:**
   Requires `<HeroUINativeProvider>` mounted in the test tree for animation and theme contexts. Mocked `react-native-worklets` and `useReducedMotion` in `jest.setup.js` to ensure reliable non-animated test execution. Added `uniwind` to `transformIgnorePatterns` in `jest.config.js`.
3. **Contracts Types & Schema Requirements:**
   `MoneySchema` requires a 2-decimal string (`'160.00'`), not a number. `StaffRefSchema` requires `{ staffId: string, displayName: string }`. All mock tickets in `src/mocks/tickets.ts` strictly adhere to `@bar/contracts` `TicketListSchema`.

### Issues & Compromises From Work
- Mock session uses in-memory state (`src/lib/auth/session.ts`) with 0 delay in test environments and 500 ms in development mode.
- Mock API (`src/lib/api/tickets.ts`) provides simulated 300 ms network latency when `EXPO_PUBLIC_USE_MOCKS=1`, with error simulation support (`setMockTicketsError(true)`) for testing error and retry states.

### Caller & Boundary Impact
- **Modified files:**
  - `app/mobile/package.json` (added `@tanstack/react-query`, `zod`)
  - `app/mobile/jest.config.js`, `app/mobile/jest.setup.js`
  - `app/mobile/src/global.css` (design tokens mapped into `@theme inline`)
  - `app/mobile/src/app/_layout.tsx` (QueryClientProvider, AuthGate, HeroUINativeProvider)
  - `app/mobile/src/app/index.tsx` (auth-aware redirect)
- **New files:**
  - `app/mobile/src/app/login.tsx`
  - `app/mobile/src/app/(tabs)/_layout.tsx`, `orders.tsx`, `more.tsx`
  - `app/mobile/src/components/order/OrderCard.tsx`
  - `app/mobile/src/hooks/useTicketQueue.ts`
  - `app/mobile/src/lib/api/tickets.ts`
  - `app/mobile/src/lib/auth/session.ts`
  - `app/mobile/src/lib/utils/format.ts`, `index.ts`
  - `app/mobile/src/mocks/tickets.ts`
  - Unit tests under `app/mobile/src/__tests__/`
- **Zero impact outside `app/mobile/**`**: contracts, backend, frontend untouched.

### Operational & Living Docs Sync
- `app/mobile/.env.example` created with `EXPO_PUBLIC_USE_MOCKS=1`.

---

## Acceptance Criteria Verification

| AC | Met? | Evidence |
|---|---|---|
| AC-1 | ✅ | `src/__tests__/app/login.test.tsx`: login screen renders with title/button, pending spinner during signIn, error alert when mock fails. |
| AC-2 | ✅ | `src/__tests__/app/tabs-more.test.tsx`: อื่นๆ tab renders staff name, "ออกจากระบบ" calls signOut and redirects to `/login`. |
| AC-3 | ✅ | `src/__tests__/app/orders.test.tsx`: orders rendered oldest first, padded #0042, time ago, seat/name/station, items ≤3 + "+ n รายการ", CD-00 status chips. |
| AC-4 | ✅ | `src/__tests__/app/orders.test.tsx`: filter tabs (ทั้งหมด · ใหม่ · กำลังเตรียม · พร้อมเสิร์ฟ · มีปัญหา) correctly filter queue; `sent` and `cancelled` excluded; issue tab shows dot. |
| AC-5 | ✅ | `src/__tests__/app/orders.test.tsx`: empty state renders "ยังไม่มีออเดอร์", error mode shows alert "โหลดออเดอร์ไม่สำเร็จ" and "ลองอีกครั้ง" refetches. |
| AC-6 | ✅ | `src/__tests__/mocks/tickets.test.ts`: all 8 mock tickets validate cleanly against `TicketListSchema.safeParse`. |
| AC-7 | ✅ | `src/__tests__/lib/utils.test.ts`: `formatBaht(1240)` → `฿1,240.00`; `timeAgo` returns Thai relative times for 30s ("เมื่อกี้"), 2m ("2 นาทีที่แล้ว"), 90m ("1 ชม.ที่แล้ว"). |
| AC-8 | ✅ | `global.css` tokens mapped for dark/light; grep for hex in `.tsx` yields 0 matches. |
| AC-9 | ✅ | All gates pass; grep for local ticket/order schema copies in `app/mobile/src` yields 0 matches. |

---

## AI Usage
Implemented by Antigravity under Metee's executor identity per DR-030 (full agent implementation, Cowork audit, Field merge authority).

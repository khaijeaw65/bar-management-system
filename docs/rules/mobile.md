# Mobile — Expo staff app (React Native)

> Scoped to `app/mobile/**`. Workspace-wide rules in `docs/rules/core.md` also apply, **except** the `.js` extension rule (backend/NodeNext only).
> Decisions: DR-002 (HeroUI, Lucide, dual theme, Expo = only background-push channel) · DR-003 (push token) · DR-004 (shared Zod) · DR-005 (mobile auth) · DR-007 (axios) · DR-008 (Metee owns this app, Field reviews) · DR-009 (staff app = the only staff surface).
> Reference scaffold: BRIEF-002. Written 2026-10-04 at Field's request; effective when merged.

---

## Scope (DR-009)
Staff app for bartenders and waiters on their own phones. **Same backend API as the web — never ask for a mobile-only endpoint** (exception: DR-005 auth endpoints). Need a backend/contracts change → raise it to Field (brief or DR); never edit `app/backend` or `app/packages/contracts` from a mobile brief.
**Never on mobile:** close table, void/comp, cash, manual payment confirm, settings, back-office screens.

## Stack
- Expo SDK 57, Expo Router (file routes), React 19, TypeScript strict, `noUncheckedIndexedAccess`
- **HeroUI Native** (`heroui-native`) + **Uniwind** (Tailwind v4 classes via `className`) · `lucide-react-native` · Noto Sans Thai
- Server state: **TanStack Query v5** · HTTP: **axios** (one instance, same pattern as web DR-007) · Zod 4 (same pin as web/backend) via `@bar/contracts`
- UI state: `useState` / Zustand (add with the first screen that needs cross-component state)
- Auth storage: `expo-secure-store` only (DR-005) · Push: `expo-notifications` (DR-003)
- Tests: Jest (`jest-expo`) + `@testing-library/react-native`
- **Every dependency** is added only through a brief Pre-decided item (exact version) — native ones with `npx expo install`.

## File Structure
```
app/mobile/src/
├── app/                    ← routes ONLY (Expo Router turns every file into a route)
│   ├── _layout.tsx         ← providers: GestureHandlerRoot, HeroUINativeProvider, QueryClientProvider, auth gate
│   ├── login.tsx
│   └── (tabs)/             ← signed-in area; group allowed here because tabs share a layout
│       ├── _layout.tsx
│       └── orders.tsx
├── components/
│   ├── ui/                 ← HeroUI Native wrappers reused 2+ times with the same config
│   └── [domain]/           ← order/, table/ … shared by 2+ screens
├── hooks/                  ← useOrders(), useAuth() … (React Query hooks live here)
├── lib/
│   ├── api/                ← client.ts (only HTTP entry) + one file per domain
│   ├── auth/               ← token storage + session (DR-005)
│   └── utils/              ← formatBaht(), formatTime(), cn()
├── mocks/                  ← fixtures + mock implementations of lib/api/* (see Mocks)
├── stores/                 ← Zustand (UI state only)
└── __tests__/              ← all tests (never under src/app/)
```
Create a folder when its first file is needed — no empty placeholders.

## Components
- Function components, one per file, filename = component (PascalCase), **named exports**. Route files (`_layout.tsx`, screens in `app/`) use **default exports** (Expo Router).
- Route files compose; logic lives in hooks, UI in `components/`.
- Use the HeroUI Native component first (Button, Card, Chip, TextField, Dialog, BottomSheet, Skeleton, Toast …). Build a custom component only when HeroUI Native has nothing — name it in the PR.
- Touch targets ≥ 44 px; primary actions ≥ 52 px (wet hands, low light — FRD §6).

## Styling & Theming
- Uniwind `className` only. No `StyleSheet.create` for anything a class can express, no inline `style` for colors, **no hex** — tokens only (`docs/design-system.md`, `docs/design/tokens-v2.css` mapped into `src/global.css`).
- Dark + light follow the phone setting (`userInterfaceStyle: automatic`). No manual toggle until a brief adds one.
- Status chips keyed by schema enums with the same Thai labels as web (CD-00 handoff §2).
- Money: `formatBaht()` → `฿1,240.00`, tabular numerals (CD-02 F1).

## Language
Thai-primary, hardcoded strings, no i18n. Same Thai term per concept as the web (check CD handoffs before inventing one).

## API Client
- `lib/api/client.ts` is the **only** place that talks HTTP: base URL from `EXPO_PUBLIC_API_URL`, `Authorization: Bearer <access>` from SecureStore, envelope `{ status, code, message, data }` unwrapped, `data` validated with the contracts Zod schema, non-2xx → `ApiError(status, code, message)`.
- 401 → one shared refresh promise (`POST /api/auth/mobile/refresh`) → retry once; refresh failure → clear SecureStore → `/login`.
- Domain wrappers: `lib/api/orders.ts` exports `getOrderQueue(): Promise<OrderQueue>` etc. Screens never import axios.
- React Query keys `['domain', 'entity', id?]` — same keys as web where the resource is the same.
- UI branches on `error.code`, shows `error.message`.

## Mocks (until the backend endpoint exists)
- `EXPO_PUBLIC_USE_MOCKS=1` → `lib/api/<domain>.ts` returns `mocks/<domain>.ts` implementations with the **same signature**, fixtures typed from `@bar/contracts`, plus a small artificial delay (300 ms) so loading states are real.
- Fixtures must pass the contracts Zod schema (a test asserts it) — mocks drift = test fails.
- Switching to the real API = flip the env var; screens and hooks don't change.

## Auth (DR-005)
System browser + PKCE + `barapp://auth` + one-time code → Bearer pair in `expo-secure-store`. Never AsyncStorage, never log tokens. Until the backend auth brief is merged, login uses a **mock session** behind `EXPO_PUBLIC_USE_MOCKS`.

## Real-time
- socket.io client singleton in `lib/socket.ts` (added by the brief that wires realtime), auth via the access token. Events notify; hooks invalidate React Query keys (no event-sourced client state).
- Remove listeners in `useEffect` cleanup; reconnect on app foreground (`AppState`).
- Background delivery = Expo push (DR-003), not the socket.

## Testing
- Jest + RNTL; tests in `src/__tests__/` mirroring the source path.
- Every screen: loading, empty, error, success rendered from mocks. Every hook: one test with mocks.
- Gate (all must pass before PR): `pnpm --filter @bar/mobile lint` · `typecheck` · `test` · `export:check`.
- Manual evidence: Android dev build screenshots (dark + light) for each new screen. Android is the demo target; iOS optional.

## Hard Limits (same as web)
| Thing | Max |
|---|---|
| Component file | 150 lines |
| Route (screen) file | 100 lines |
| JSX returned by one component | 40 lines |
| `useState` in one component | 3 — more → custom hook |

## DO NOT
- Put non-route files (components, tests, utils) under `src/app/`
- Call axios/fetch from a component, or create a second HTTP client
- Store tokens anywhere but SecureStore; log tokens or full API responses
- Add a dependency without a brief Pre-decided item; use `pnpm add` for native packages
- Hardcode colors, use another component library, or copy Claude Design JSX
- Add features DR-009 keeps off mobile (close table, void/comp, payments confirm, settings)
- Commit `ios/`, `android/`, `.expo/`, `.expo-export/`; create EAS projects or store builds without a brief
- Add offline mode, member QR, staff performance analytics (cut)

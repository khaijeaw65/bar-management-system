# Frontend — Next.js 16 web app + Tailwind v4

> Scoped to `app/frontend/**`. Workspace-wide rules in `docs/rules/core.md` also apply.
> Stack decisions: DR-002 (HeroUI, theming, no PWA), DR-004 (shared Zod), DR-007 (axios). Reference pattern: `/pos/menu` (BRIEF-005).

---

## Stack
- Next.js 16 (App Router, Turbopack) — **web app, not a PWA** (DR-002 #1: no `next-pwa`, no manifest, no service worker except MSW's dev worker)
- React 19, TypeScript, strict mode
- Tailwind CSS v4 + **HeroUI v3** (`@heroui/react`, `@heroui/styles`) — React Aria underneath
- `next-themes` — dark (default) + light, per device
- TanStack Query v5 — server state · Zustand — UI state only (add when a screen needs it)
- **axios** — HTTP client (DR-007; switch happens in the frontend auth brief — until then `lib/api/client.ts` uses `fetch`)
- Zod 4 (`4.6.5`, same pin as backend) — validate every API response
- `react-hook-form` + Zod resolver — forms (add with the first form)
- `lucide-react` — icons · `clsx` + `tailwind-merge` → `cn()`
- MSW 2 (dev + tests) · Vitest + Testing Library · Playwright
- `@bar/contracts` for shared enums / schemas

### Module resolution
The web app uses `moduleResolution: "bundler"` (Next). **Relative imports have no `.js` extension** — the `.js` rule in `core.md` is for the backend (NodeNext) only. Use the `@/*` alias for anything outside the current folder.

---

## Target Surfaces

| Route | Device | Purpose |
|---|---|---|
| `/pos/*` | Desktop / tablet | POS: menu, sessions, payment, end-of-day |
| `/staff/*` | Phone browser | Staff web surface (the Expo app covers native + push) |
| `/t/…` (planned) | Customer phone | QR ordering — path decided in the customer-QR brief |

Plain URL segments with their own `layout.tsx` — no route groups unless two surfaces must share a layout without a URL segment.
No offline mode — cut from scope.

---

## File Structure (App Router)

```
app/frontend/src/
├── app/
│   ├── layout.tsx              ← root: fonts, <html lang="th">, Providers
│   ├── providers.tsx           ← 'use client': ThemeProvider, QueryClientProvider, MSW start (dev)
│   ├── page.tsx                ← redirect → /pos/menu
│   ├── pos/
│   │   ├── layout.tsx          ← POS shell
│   │   └── menu/
│   │       ├── page.tsx
│   │       └── _components/    ← private to this route
│   └── staff/
├── components/
│   ├── ui/                     ← wrappers for HeroUI components reused 2+ times with the same config
│   └── [domain]/               ← domain components shared by 2+ routes
├── hooks/                      ← custom hooks
├── lib/
│   ├── api/                    ← client.ts (the only HTTP entry point) + one file per domain
│   └── utils/                  ← cn(), formatTHB(), formatDate()
├── mocks/                      ← MSW handlers, browser.ts, node.ts
├── stores/                     ← Zustand slices (UI state only)
├── test/                       ← Vitest setup
└── proxy.ts                    ← route guard (Next 16 name for middleware) — auth brief
```

---

## Component Rules
- Functional components only; one component per file, filename = component name (PascalCase)
- Named exports for components — `page.tsx` / `layout.tsx` use default exports (Next requirement)
- `'use client'` only for browser APIs, event handlers or hooks — default to Server Components
- Props interface inline above the component
- **Pages and layouts declare props only when they use them.** A page without params takes no props; use `PageProps<'/route/[id]'>` / `LayoutProps<'/route'>` only when reading `params` / `searchParams` / `children`. Never `void params`.
- HeroUI: import `@heroui/react` directly anywhere. Wrap in `components/ui/` only when the **same component with the same config** is used 2+ times (DR-002 #5).

---

## Styling & Theming
- Tailwind utilities only; no custom CSS except `globals.css` (tokens, `@theme`, HeroUI variable mapping, `@layer base`)
- **Colors only from design-system tokens** (`bg-bg`, `bg-surface`, `text-text-primary`, `text-accent-text`, …) — no hex in `.tsx`, no `dark:` color utilities (`docs/design-system.md` → Theming)
- Dark + light via `next-themes` (`attribute="class"`, `defaultTheme="dark"`, `enableSystem`), stored per device. **No wrong-theme flash:** the theme class must be on `<html>` before first paint in every mode (incl. MSW dev mode).
- No `style={{ }}` · `cn()` for conditional classes · no `@apply`
- Mobile-first for `/staff`; desktop-first for `/pos`

---

## App Language
- **Thai-primary.** UI strings hardcoded in Thai, common English loanwords as-is (Menu, QR, Happy Hour…). No i18n library, locale files or language switcher.
- One Thai term per concept, used everywhere. Code / DB / enums in English.

---

## State Management
- Server state: TanStack Query — keys `['domain', 'entity', id?]` (e.g. `['menu', 'items']`)
- UI state: Zustand (`stores/`) — cross-component UI state only
- Local state: `useState` / `useReducer`
- No Redux, no Context for server state

---

## API Client

Every backend response is the envelope `{ status, message, data }` (`backend.md` → API Response).

```typescript
// lib/api/menu.ts — domain wrapper: schema + one function per endpoint
export function getMenuItems(): Promise<MenuList> {
  return apiFetch('/menu/items', menuListSchema);   // returns `data`, validated
}
```
- `lib/api/client.ts` is the **only** place that talks HTTP: base URL from `NEXT_PUBLIC_API_URL`, cookies included, envelope unwrap, Zod validation of `data`, non-2xx → `ApiError(status, body, message)`.
- Transport = **axios** (DR-007): one instance, `withCredentials: true`, response interceptor for envelope + errors, 401 interceptor with one shared refresh promise. Migrated from `fetch` in the frontend auth brief; domain wrapper signatures don't change.
- Components never call `fetch` / axios — always a `lib/api/` wrapper through a React Query hook.
- Schemas move to `@bar/contracts` when the backend endpoint exists (DR-004); `lib/api/` keeps only local, provisional ones.

---

## Real-time (WebSocket)
- socket.io client singleton in `lib/socket/socket.ts`, `useSocket()` hook, rooms `'pos'` | `'bar-display'` | `'kitchen-display'`
- Always remove listeners in the `useEffect` cleanup

---

## Auth (LINE SSO + JWT)
- LINE login → backend sets HttpOnly cookies; the frontend never reads tokens
- Current user: `useQuery(['auth', 'me'])` → `/api/auth/me`
- Route guard in `proxy.ts` (Next 16) — cookie present? else redirect `/login`
- Refresh on 401 via the axios interceptor (DR-007)

---

## Forms
- `react-hook-form` + Zod resolver; errors inline under each field; submit calls a React Query mutation

---

## Testing
- Vitest + Testing Library (jsdom) + MSW node server for component/unit tests — co-located `*.test.ts(x)`
- Playwright for e2e (`e2e/`), local now; CI runs it for order → pay → close later (workflow G2)
- `typecheck` = `next typegen && tsc --noEmit` (works on a clean checkout)

---

## Performance
- `next/image` for content images; `next/font` in the root layout only
- Exception: the PromptPay QR is a backend base64 PNG → plain `<img>` (DR-002 #12)
- `dynamic()` for heavy components; no barrel `index.ts` re-exporting components

---

## DO NOT
- Use the `pages/` router or `middleware.ts` (use `proxy.ts`)
- Add a PWA (`next-pwa`, manifest, custom service worker)
- Add another component library (MUI, Ant, shadcn) — HeroUI only
- Hardcode colors or use `dark:` for colors
- Call `fetch` / axios in components, or create a second HTTP client
- Put server state in Zustand
- Declare page/layout props you don't use (`void params`)
- Add `.js` extensions to relative imports in the web app
- Add i18n libraries, locale files or language switching
- Add offline mode, member QR, staff performance analytics (cut)
- Build kitchen display UI in Semester 1

---

## Component Decomposition

### Hard Limits
| Thing | Max |
|---|---|
| Component file | 150 lines |
| Page file | 100 lines (pages compose, they don't render) |
| JSX returned by one component | 40 lines |
| `useState` calls in one component | 3 — if more, extract a custom hook |
| State/effect logic | 20 lines — if more, extract a custom hook |

### When to Extract a Component
Split when:
- A section has its own visual boundary (card, row, modal, empty state)
- It could appear in more than one place
- It has its own loading/error state
- The parent JSX becomes hard to scan because of it

Do NOT split when:
- It's 3–5 lines that only appear once
- Splitting creates more prop-drilling than it saves in clarity

### Where Extracted Components Go
```
# Used only in one route → co-locate under _components/
app/pos/menu/
  page.tsx
  _components/
    MenuList.tsx
    MenuItemRow.tsx
    MenuListError.tsx

# Reused across 2+ routes → promote to shared
components/ui/        ← primitives (Button, Badge, Input, Modal)
components/order/     ← domain-specific shared components
```

`_components/` = private to that route. Never import from outside its parent folder.

### Rule for Agents
Before adding more than 40 lines of JSX to an existing component — stop and extract.
Before adding a 4th `useState` — stop and extract a custom hook.

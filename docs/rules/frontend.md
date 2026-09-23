# Frontend — Next.js 16 PWA + Tailwind

> Scoped to `app/frontend/**`. Workspace-wide rules in `docs/rules/core.md` also apply.
> Read `docs/state/<person>.md` and the active brief before starting any task (see `docs/rules/workflow.md`).

---

## Stack
- Next.js 16 (App Router) — PWA via next-pwa
- React 19, TypeScript 6, strict mode
- Tailwind CSS v4 — utility-first, no component library (no shadcn, no MUI)
- pnpm, ESM, NodeNext module resolution (same `.js` extension rule as backend)
- `@bar/contracts` for shared enums (`OrderStatus`, `PaymentStatus`, etc.)
- `socket.io-client` for real-time updates
- React Query (TanStack Query v5) — server state
- Zustand — UI state only
- Zod — API response validation on the client side
- `react-hook-form` + Zod resolver — all forms

---

## Target Surfaces

Two distinct UX targets — always know which you are building:

| Surface | Device | Purpose |
|---|---|---|
| `(staff)` | Mobile (phones) | Order taking, table management, notifications |
| `(pos)` | Desktop / Tablet | Payment flow, session management, end-of-day |

Design mobile-first. POS views use responsive overrides for wider viewports.
No offline mode — cut from scope. Assume stable WiFi in the venue.

---

## File Structure (App Router)

```
app/frontend/src/
├── app/
│   ├── (staff)/                ← staff mobile route group
│   │   ├── layout.tsx
│   │   ├── orders/
│   │   └── tables/
│   ├── (pos)/                  ← POS desktop route group
│   │   ├── layout.tsx
│   │   └── payment/
│   ├── api/                    ← thin proxy / webhooks only
│   └── layout.tsx              ← root layout (providers, fonts)
├── components/
│   ├── ui/                     ← primitive, reusable (Button, Input, Badge…)
│   ├── [domain]/               ← domain-specific (order/, menu/…)
│   └── layout/                 ← shell (Sidebar, BottomNav, Header)
├── hooks/                      ← custom hooks (useOrders, useSocket…)
├── lib/
│   ├── api/                    ← typed fetch wrappers per domain
│   ├── socket/                 ← socket.io-client setup + event types
│   └── utils/                  ← cn(), formatCurrency(), formatDate()
├── stores/                     ← Zustand slices (UI state only)
├── types/                      ← frontend-only types
└── middleware.ts               ← auth redirect
```

---

## Component Rules

- Functional components only — no class components
- `'use client'` only when the component uses browser APIs, event handlers, or hooks
- Default to Server Components — fetch data at the page/layout level
- One component per file — filename matches component name (PascalCase)
- Props interface defined inline above the component
- Named exports for all components — no default exports
  - Exception: `page.tsx` and `layout.tsx` MUST use default exports (Next.js requirement)

---

## Styling (Tailwind v4)

- No custom CSS files except `globals.css` (CSS variables + `@layer base` only)
- No `style={{ }}` inline — use Tailwind utilities
- Responsive: mobile-first (`sm:` `md:` `lg:` breakpoints for POS overrides)
- Dark mode: class-based (`dark:` prefix) — venue preference stored in `venue` table
- Use `cn()` utility (`lib/utils/cn.ts`) for conditional class merging
- Color tokens defined as CSS variables in `globals.css` — no hardcoded hex values
- Avoid `@apply` — compose with `cn()` instead

---

## App Language

- **Thai-primary.** UI strings hardcoded in Thai — common English loanwords included as-is (Filter, QR, Order, Menu, Happy Hour, etc.). This is normal Thai UI, NOT bilingual.
- **No i18n library. No locale files. No language switcher.**
- Pick one Thai term per concept and use it consistently everywhere.
- Free-text content (menu names, guest notes) entered by staff — no constraint.
- Full English / multi-language = CUT — future work only if tourist need emerges.
- Code, DB columns, enums = English (convention).

---

## State Management

- Server state: React Query (`useQuery`, `useMutation`) — all API calls go through here
  - Cache keys: `['domain', 'entity', id]` — e.g. `['orders', 'list', visitId]`
- UI state: Zustand (`stores/`) — cross-component UI state only (selected table, drawer open, etc.)
- Local state: `useState` / `useReducer` — component-internal only
- No Redux, no Context for server state

---

## API Client Pattern

```typescript
// lib/api/orders.ts
export async function getOrders(visitId: string): Promise<OrderResponse[]> {
  const res = await fetch(`/api/orders?visitId=${visitId}`);
  if (!res.ok) throw new ApiError(res.status, await res.json());
  return OrderResponseSchema.array().parse(await res.json());
}
```

- Always validate API responses with Zod schemas at the call site
- `ApiError` class in `lib/api/errors.ts` — consistent error type across the app
- No axios — native fetch with typed wrappers

---

## Real-time (WebSocket)

- Socket.io client: singleton in `lib/socket/socket.ts`
- `useSocket()` hook for component subscriptions
- Rooms: `'pos'` | `'bar-display'` | `'kitchen-display'`
- Always clean up listeners in `useEffect` return:
  ```typescript
  useEffect(() => {
    socket.on('order:updated', handler);
    return () => { socket.off('order:updated', handler); };
  }, []);
  ```

---

## Auth (LINE SSO + JWT)

- Login via LINE SSO — redirect to `/auth/line`
- JWT in HttpOnly cookie (managed by backend) — frontend never reads it
- Auth state: `useQuery(['auth', 'me'])` hitting `/api/auth/me`
- Protected routes: `middleware.ts` checks cookie presence, redirects to `/login`

---

## Form Handling

- `react-hook-form` + Zod resolver for all forms
- No uncontrolled inputs — always register with `react-hook-form`
- Validation errors displayed inline below each field
- Submit handler calls React Query mutation — no direct `fetch` in `onSubmit`

---

## PWA

- Service worker managed by `next-pwa` — do not write a custom SW
- Cacheable: static assets, menu images (S3 CDN)
- Not cached: API responses (real-time data must be fresh)
- No offline functionality — if SW intercepts a failed request, show "reconnecting" UI

---

## Performance

- Images: always `next/image` — never `<img>`
- Fonts: `next/font` — root layout only, not per-page
- Dynamic imports for heavy components:
  ```typescript
  const Chart = dynamic(() => import('@/components/Chart.js'), { ssr: false });
  ```
- No barrel `index.ts` that re-exports all components (breaks tree-shaking)

---

## DO NOT

- Use `pages/` router — App Router only
- Add shadcn/ui, MUI, Ant Design, or any component library
- Hardcode colors — use CSS variables via Tailwind tokens
- Use axios — use typed fetch wrappers in `lib/api/`
- Put server state in Zustand — use React Query
- Use default exports for components (pages/layouts are the exception)
- Use `<img>` — use `next/image`
- Use `style={{ }}` inline
- Call `fetch` directly in components — go through `lib/api/` wrappers
- Add i18n libraries, locale files, or language switching (hardcoded Thai)
- Add offline mode, member QR, staff performance analytics (cut from scope)
- Build kitchen display UI in Semester 1 (routing shell only)
- Omit `.js` extensions on relative imports

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
app/(staff)/orders/
  page.tsx
  _components/
    OrderList.tsx
    OrderCard.tsx
    EmptyOrderState.tsx

# Reused across 2+ routes → promote to shared
components/ui/        ← primitives (Button, Badge, Input, Modal)
components/order/     ← domain-specific shared components
```

`_components/` = private to that route. Never import from outside its parent folder.

### Rule for Agents
Before adding more than 40 lines of JSX to an existing component — stop and extract.
Before adding a 4th `useState` — stop and extract a custom hook.

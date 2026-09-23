# DR-002 — Frontend stack: HeroUI v3, no PWA, dual theme, supporting libraries

| | |
|---|---|
| **Status** | Pending |
| **Raised by** | Field via Cowork · 2026-09-23 |
| **Brief** | none (input to FE-000; MB-000 for icons) |
| **Category** | Dependency |

## Context
`docs/rules/frontend.md` was written before Next.js 16 and before the Expo staff app was planned. Gaps found:
- `next-pwa` is unmaintained and webpack-only; Next 16 builds with Turbopack by default.
- Next 16 renamed `middleware.ts` → `proxy.ts`.
- `frontend.md` (class-based dark mode, per-venue) contradicts `design-system.md` (dark only).
- "No component library" means hand-building accessible modals, drawers, date pickers, toasts.
- `cn()` is required by the rules, but its dependencies are not listed. There are no icon, toast, testing or API-mock choices.

Items discussed with Field 2026-09-23. Each line below is agreed in principle and waits for this DR's approval.

## Options
Main option = the UI framework (others below are single-choice items):
**A) HeroUI v3** — React Aria + Tailwind v4 native, built-in theming, official **HeroUI Native** for Expo, npm package (upgrades by version bump) / stable only since mid-2026, opinionated look to restyle.
**B) shadcn/ui** (Base UI) — code copied into repo, full ownership, Tailwind v4 native / we maintain the copied code; React Native port is community-only.
**C) Mantine** — rich component set, easy / own CSS system, awkward with Tailwind-first rules; no React Native.

## Recommendation
**A) HeroUI v3.** It is the only option with an official React Native counterpart, so web and the Expo app share one design language. Tailwind v4 and dark/light theming work out of the box. Validate with one real screen (menu list) before FE-000 is Ready.

### Full decision list

| # | Item | Decision | Why |
|---|---|---|---|
| 1 | PWA | **Removed.** No `next-pwa`, no service worker, no Web Push, no manifest install | Staff native experience + background push → Expo app. Web = online in-app UI only |
| 2 | Real-time | WebSocket (`socket.io-client`) only on web | Background delivery is the Expo app's job |
| 3 | Notification log | Stored + shown like a bell/feed on web — see **DR-003** | History survives a closed tab |
| 4 | UI framework | **HeroUI v3** (`@heroui/react`) | See Recommendation |
| 5 | Wrapper rule | `@heroui/react` may be imported anywhere. The **same component + same config used 2+ times** → wrap in `components/ui/` | Reusable without wrapping everything (over-engineering) |
| 6 | Class merge | `clsx` + `tailwind-merge` → `cn()` in `lib/utils/cn.ts` | Our components + `className` overrides on HeroUI. Don't rely on transitive deps |
| 7 | Theme | **Dark + light.** `next-themes`, `attribute="class"`, `defaultTheme="dark"`, `enableSystem`. Stored **per device** (localStorage), **not per venue** — no DB column | Avoids the wrong-theme flash on SSR; ~2 KB, no deps |
| 8 | Icons | **Lucide** — `lucide-react` (web), `lucide-react-native` (Expo). Brand logos (LINE) as SVG files | Same set on both platforms; react-icons has no RN support + mixes styles |
| 9 | Toasts / drawers / date inputs | HeroUI built-ins — no `sonner`, no `vaul` | One library |
| 10 | Dates | HeroUI/React Aria date inputs with the **Thai Buddhist calendar** (`@internationalized/date`, comes with React Aria); display via `Intl` `th-TH` | No date library |
| 11 | Money display | `Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })`. **Frontend never does money math** — totals come from the backend | See money note below |
| 12 | PromptPay QR | Backend returns a **base64 PNG**; frontend renders it with a plain `<img>`, not `next/image` | No QR library on the frontend |
| 13 | Charts | **Deferred** to Sprint 6 (dashboard) | Not needed yet |
| 14 | API mocking | **MSW** (dev + tests), early phase | FE work isn't blocked on BE-000 |
| 15 | Testing | **Vitest + Testing Library** (unit/component), **Playwright** (e2e gate) | Matches the brief testing gate |
| 16 | Route guard | `proxy.ts` (Next 16) replaces `middleware.ts` | Framework rename |
| 17 | Kept as is | TanStack Query v5, Zustand (UI state only), Zod, `react-hook-form` + Zod resolver, native fetch wrappers, no i18n library | — |

**Money note:** `docs/schema.sql` already uses `NUMERIC(10,2)`/`NUMERIC(12,2)`, which is exact. No schema change. Money travels in the API as a decimal **string** (e.g. `"120.00"`), and the frontend only formats it for display. The exact wire format is settled with the shared schemas in **DR-004**.

**New dependencies (frontend):** `@heroui/react` (+ its documented peer deps), `next-themes`, `clsx`, `tailwind-merge`, `lucide-react`. Dev: `msw`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@playwright/test`. Exact versions pinned in FE-000.

**Follow-ups (Field, manual — protected files), after approval:**
- `docs/rules/frontend.md` — Stack list, "PWA" section → removed, Styling (dark mode line → `next-themes`, dual theme), DO NOT list (drop "no component library"; add the wrapper rule), `middleware.ts` → `proxy.ts` in the tree + Auth section.
- `CLAUDE.md` / `AGENTS.md` / `docs/rules/core.md` — "Next.js 16 PWA" → "Next.js 16 web app"; frontend stack row.
- `docs/FRD.md` §13 Notifications (Web Push → Expo push; web = WebSocket + stored log) and §"PWA, installable" line.
- `docs/design-system.md` — light theme tokens: **done on this branch** (not a protected file).
- Delete `app/frontend/public/sw.js` / manifest if any appear (none today).

---

## Decision — Field only
**Decision:** <Approved: A · Rejected · Approved with change: …>
**Why:**
**Date:**

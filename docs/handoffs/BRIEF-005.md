# Handoff — BRIEF-005 Frontend scaffold: HeroUI, theme, data layer, tests + menu-list spike

| | |
|---|---|
| **Implementer** | Field (Cursor) |
| **Date** | 2026-09-24 |
| **Brief revision** | 2 |
| **Branch / PR** | `feat/BRIEF-005-frontend-scaffold` · PR (opened with this handoff) |
| **Commit** | `97f9748` (local gates). Screenshot script removed in the following commit; it is not part of the app. |
| **Status** | Implemented — awaiting audit |

> Created at `Implemented`. Update it if review requests changes. Frozen at merge.

## Summary
The web app now has Sarabun, dark/light tokens mapped onto HeroUI, TanStack Query, and `apiFetch` (envelope in, `data` out). `/` redirects to `/pos/menu`, a read-only HeroUI table fed by MSW. `/staff` is a placeholder. HeroUI v3 Table rendered under Next 16 without an SSR or token failure.

## How the data flows
MSW `GET */api/menu/items` returns `{ status, message, data: { items } }`. With `NEXT_PUBLIC_API_MOCKING=enabled`, `Providers` starts the browser worker before the tree renders; production builds do not register it. `MenuList` uses `useQuery(['menu', 'items'])` → `getMenuItems()` → `apiFetch`, which sends `credentials: 'include'`, validates the envelope, and returns `data` only. The table, error, empty, and skeleton views render from that result.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `docs/handoffs/assets/BRIEF-005/menu-dark.png` — `/pos/menu`, four Thai items, `฿120.00` / `฿180.00` / `฿150.00` / `฿220.00`, one หมด chip. `e2e/menu.spec.ts` opens `/` and lands on `/pos/menu` |
| AC-2 | ✅ | `menu-error.png` (เกิดข้อผิดพลาด + ลองอีกครั้ง), `menu-empty.png` (ยังไม่มีเมนู). Retry: `MenuList.test.tsx` — `shows the error state and retries` |
| AC-3 | ✅ | `menu-light.png` — ธีมสว่าง selected, light tokens. After reload, `aria-pressed` on ธีมสว่าง stayed `true`. First paint with no saved choice is dark (`:root` holds the dark tokens) |
| AC-4 | ✅ | `rg -n "#[0-9A-Fa-f]{3,8}" app/frontend/src --glob '*.tsx'` — no matches. `rg -n "dark:" app/frontend/src --glob '*.tsx'` — no matches |
| AC-5 | ✅ | `src/lib/api/client.test.ts` — envelope `data` only, `ApiError` status + message, `ZodError`, `credentials: 'include'` |
| AC-6 | ✅ | `src/lib/utils/format.test.ts` — `formatTHB('1234.50')` → `฿1,234.50` |
| AC-7 | ✅ | `src/app/pos/menu/_components/MenuList.test.tsx` — loaded / error / empty |
| AC-8 | ✅ | `e2e/menu.spec.ts` — heading เมนู and 4 `rowheader`s. 1 passed |
| AC-9 | ✅ | `pnpm --filter @bar/frontend typecheck` after `rm -rf app/frontend/.next` — `next typegen` then `tsc --noEmit`, exit 0. Root layout uses `LayoutProps<'/'>` |
| AC-10 | ✅ | Gates below, all exit 0 on the `97f9748` tree. `pnpm --version` 10.0.0. Production `.next` has no `setupWorker` / `mockServiceWorker`. `ci` link filled in after the PR run |
| AC-11 | ✅ | `wc -l` — largest component `providers.tsx` 47, `MenuList.tsx` 40, pages ≤ 11. Returned JSX in each component is under 40 lines |

## Gate Evidence (G1)
Commands run on the `97f9748` tree before that commit (`pnpm --version` 10.0.0). The next commit only deletes `e2e/screenshots.mjs`.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/frontend lint` | 0 | pass |
| `pnpm --filter @bar/frontend typecheck` | 0 | `next typegen && tsc --noEmit` pass on a deleted `.next` |
| `pnpm --filter @bar/frontend test` | 0 | 7 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/frontend build` | 0 | pass. `rg` of `.next` for `setupWorker` and `mockServiceWorker` — no matches |
| `pnpm --filter @bar/frontend test:e2e` | 0 | 1 passed · 0 failed · 0 skipped (local; not in CI) |
| `pnpm install --frozen-lockfile` | 0 | pass (pnpm 10.0.0). pnpm warned that the `msw` install script was ignored; `public/mockServiceWorker.js` is already committed from `msw init` |

## Decisions Raised
- none

## Deviations from Brief
- None.

## Known Gaps / Follow-ups
- `next-themes` injects a `<script>` from a client component. React 19 logs that this script does not run on the client (the "1 Issue" badge in the dev screenshots). The saved class still applies after hydration. First load with no saved choice stays dark because `:root` is the dark palette. A saved light theme can flash dark for one frame.
- `app/frontend/package.json` `packageManager` is the pre-existing `pnpm@11.21.0` pin. Repo root is pnpm 10. Playwright starts `next dev` on port 3100 because Docker already listens on 3000.
- HeroUI did not need a React provider. Tokens are mapped by pointing HeroUI's `--background`, `--surface`, `--accent`, and status variables at the design-system tokens.

## AI Usage
**High** — Cursor wrote the scaffold, tests, and this handoff.

## Notes for Reviewer
- Start at `src/lib/api/client.ts`, then `src/app/pos/menu/_components/MenuList.tsx`. That is the pattern later screens copy.
- Screenshots: `docs/handoffs/assets/BRIEF-005/`.
- Dev command: `NEXT_PUBLIC_API_MOCKING=enabled pnpm --filter @bar/frontend dev`.

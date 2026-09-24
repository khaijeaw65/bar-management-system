# Handoff — BRIEF-005 Frontend scaffold: HeroUI, theme, data layer, tests + menu-list spike

| | |
|---|---|
| **Implementer** | Field (Cursor) |
| **Date** | 2026-09-24 |
| **Brief revision** | 3 |
| **Branch / PR** | `feat/BRIEF-005-frontend-scaffold` · PR #17 |
| **Commit** | `09df010` (Rev 3 local gates). Earlier `ci` on `96e3d4a`; Rev 3 `ci` fills in after push |
| **Status** | Implemented — Rev 3 awaiting re-audit |

> Created at `Implemented`. Updated for Rev 3 after changes requested. Frozen at merge.

## Summary
Rev 3 applies the audit notes. Pages that do not read route params take no props. `ThemeProvider` stays in the server HTML in mock mode, so a saved light theme is on `<html>` before paint and React no longer warns about the `next-themes` script. The frontend package no longer pins its own pnpm version; the root lockfile is the only one.

## How the data flows
MSW `GET */api/menu/items` returns `{ status, message, data: { items } }`. With `NEXT_PUBLIC_API_MOCKING=enabled`, `Providers` starts the browser worker before the data tree renders; `ThemeProvider` is outside that gate. Production builds do not register the worker. `MenuList` uses `useQuery(['menu', 'items'])` → `getMenuItems()` → `apiFetch`, which sends `credentials: 'include'`, validates the envelope, and returns `data` only.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `docs/handoffs/assets/BRIEF-005/menu-dark.png` — four Thai items, baht prices, one หมด chip. `e2e/menu.spec.ts` opens `/` and lands on `/pos/menu` |
| AC-2 | ✅ | `menu-error.png`, `menu-empty.png`. Retry: `MenuList.test.tsx` — `shows the error state and retries` |
| AC-3 | ✅ | `menu-light.png`. Rev 3 strengthens this in AC-13 |
| AC-4 | ✅ | `rg -n "#[0-9A-Fa-f]{3,8}" app/frontend/src --glob '*.tsx'` — no matches. `rg -n "dark:" app/frontend/src --glob '*.tsx'` — no matches |
| AC-5 | ✅ | `src/lib/api/client.test.ts` |
| AC-6 | ✅ | `src/lib/utils/format.test.ts` — `formatTHB('1234.50')` → `฿1,234.50` |
| AC-7 | ✅ | `src/app/pos/menu/_components/MenuList.test.tsx` — loaded / error / empty |
| AC-8 | ✅ | `e2e/menu.spec.ts` — heading เมนู and 4 `rowheader`s. 1 passed |
| AC-9 | ✅ | `typecheck` after `rm -rf app/frontend/.next` — exit 0. Root layout uses `LayoutProps<'/'>` |
| AC-10 | ✅ | Gates below, all exit 0 on the `09df010` tree. `pnpm --version` 10.0.0. Production `.next` has no `setupWorker` / `mockServiceWorker` |
| AC-11 | ✅ | `wc -l` — `providers.tsx` 47, `ThemeToggle.tsx` 46, pages ≤ 10. Returned JSX stays under 40 lines |
| AC-12 | ✅ | `rg -n "void params" app/frontend/src` — no matches. `page.tsx`, `pos/menu/page.tsx`, and `staff/page.tsx` take no props. Layouts that use `children` keep `LayoutProps` |
| AC-13 | ✅ | Saved `theme=light`. At `DOMContentLoaded`, `<html>` class includes `light` in both modes. Screenshots: `rev3-light-dev.png` (`pnpm dev`, API down so the error state is light), `rev3-light-msw.png` (mocking on, four rows, ธีมสว่าง pressed). Console: `rev3-console-dev.png`, `rev3-console-msw.png` — no `next-themes` / script-tag warning. Playwright e2e log also no longer prints that warning |
| AC-14 | ✅ | `rg packageManager app/frontend/package.json` — no matches. `app/frontend/pnpm-lock.yaml` deleted. `pnpm install --frozen-lockfile` at the root — exit 0 |

## Gate Evidence (G1)
Commands run on the `09df010` tree (`pnpm --version` 10.0.0).

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/frontend lint` | 0 | pass |
| `pnpm --filter @bar/frontend typecheck` | 0 | `next typegen && tsc --noEmit` pass on a deleted `.next` |
| `pnpm --filter @bar/frontend test` | 0 | 7 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/frontend build` | 0 | pass. `rg` of `.next` for `setupWorker` and `mockServiceWorker` — no matches |
| `pnpm --filter @bar/frontend test:e2e` | 0 | 1 passed · 0 failed · 0 skipped (local; not in CI) |
| `pnpm install --frozen-lockfile` | 0 | pass (pnpm 10.0.0), already up to date |

## Decisions Raised
- none

## Deviations from Brief
- None. A hand-written theme script was not needed: moving `ThemeProvider` outside the MSW gate was enough.

## Known Gaps / Follow-ups
- F1 (`apiFetch` body handling) stays for DR-007 in the frontend auth brief.
- Playwright still starts `next dev` on port 3100 because Docker listens on 3000.

## AI Usage
**High** — Cursor wrote the Rev 3 fixes and updated this handoff.

## Notes for Reviewer
- F4: `src/app/providers.tsx` — `ThemeProvider` wraps the tree; only the children wait for MSW.
- F3: pages with no params declare no props.
- F5: root `package.json` `packageManager` (pnpm 10) and root `pnpm-lock.yaml` only.
- Rev 3 screenshots: `docs/handoffs/assets/BRIEF-005/rev3-*`.

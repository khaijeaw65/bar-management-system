# Audit — BRIEF-005 Frontend scaffold

| | |
|---|---|
| **Auditor** | Cowork |
| **Date** | 2026-09-24 |
| **PR / commit** | #17 · code `97f9748` · handoff `06fd022` · CI run 36016628822 green |
| **Depth** | Compact (+ data-layer pattern checked in detail) |
| **Brief revision** | 2 |
| **Recommendation** | **PASS WITH NOTES** ← Field makes the final call |

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `menu-dark.png`, `e2e/menu.spec.ts` (`/` → `/pos/menu`) | |
| AC-2 | ✅ | `menu-error.png`, `menu-empty.png`, retry test in `MenuList.test.tsx` | |
| AC-3 | ✅ | `menu-light.png`, reload keeps choice, dark first paint | One-frame flash for a saved light theme — see F4 |
| AC-4 | ✅ | `rg` for hex / `dark:` in `*.tsx` — none | |
| AC-5 | ✅ | `client.test.ts` — envelope → `data`, `ApiError` status + message, Zod error, `credentials: 'include'` | Matches `backend.md` → API Response |
| AC-6 | ✅ | `formatTHB('1234.50')` → `฿1,234.50` | |
| AC-7 | ✅ | `MenuList.test.tsx` loaded / error / empty (MSW node) | |
| AC-8 | ✅ | Playwright 1 passed (local) | Not in CI — as briefed |
| AC-9 | ✅ | `next typegen && tsc --noEmit` on a deleted `.next`; `LayoutProps<'/'>` back | Closes BRIEF-001 audit F2 |
| AC-10 | ✅ | lint / typecheck / test (7) / build exit 0; no MSW in the prod bundle; `ci` green | |
| AC-11 | ✅ | largest component 47 lines, pages ≤ 11 | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Deps = §7 exactly | ✅ | HeroUI + peers, next-themes, TanStack Query, `zod` `4.6.5` (same pin as backend), clsx, tailwind-merge, lucide; dev: msw, vitest 4, jsdom 27, RTL, jest-dom 6, Playwright. No `@vitejs/plugin-react`. |
| Scope | ✅ | No auth / proxy.ts / PWA / Zustand. `next.config.ts` `typedRoutes: true` is part of the typed-routes item. |
| Tokens / theming | ✅ | HeroUI variables point at design-system tokens; no HeroUI provider needed (spike result: HeroUI v3 works on Next 16 / React 19 / TW v4). |
| Protected files | ✅ | none touched |

## Findings
| # | Severity | Current → Updated |
|---|---|---|
| F1 | Med | **Current:** `apiFetch` calls `response.json()` unconditionally. A `204 No Content`, or an HTML error page from a proxy/load balancer (502/504), throws a raw `SyntaxError` instead of an `ApiError`, so the error state and messages break. Every later screen copies this function. → **Updated:** read the body safely (`text()` → `JSON.parse` in try/catch; empty body → `undefined`); non-2xx always becomes `ApiError(status, body, message ?? statusText)`. Add two tests (204 and non-JSON 502). Carry into the first frontend feature brief (auth/login). |
| F2 | Low (rules gap) | **Current:** `frontend.md` still says NodeNext + `.js` extensions on relative imports, but the Next app uses `moduleResolution: bundler` and imports without `.js` — correctly. → **Updated:** fix the rule in the DR-002 `frontend.md` follow-up (bundler resolution, no `.js`, `@/*` alias). |
| F3 | Low | **Current:** pages take `PageProps<…>` and then `void params` just to use the type. → **Updated:** pages without params take no props; use `PageProps` only when a route has params. Cosmetic — next frontend brief. |
| F4 | Info | `next-themes` script warning under React 19 and a one-frame dark flash for a saved light theme. Acceptable now; revisit if `next-themes` ships a React 19 fix. |
| F5 | Info | `app/frontend/package.json` still pins `packageManager: pnpm@11.21.0` (root is 10) — already queued in the config-truth brief. |

## Recommendation to Field
**PASS WITH NOTES.** All 11 ACs met, deps exact, the HeroUI spike succeeded, and the `apiFetch → React Query → component + states` pattern is clean and readable. F1 is the one to fix early (next frontend brief) because the pattern will be copied; F2 is a rules edit; F3–F5 need nothing now. Safe to merge #17.

## Update — 2026-09-24
Field's decisions: **F1** → DR-007 (switch to axios + TanStack Query in the frontend auth brief; no fetch patch now). **F2** → fixed in `docs/rules/frontend.md` (bundler resolution, no `.js`) + `core.md` carve-out, together with all DR-002 `frontend.md` follow-ups and the PWA wording in CLAUDE.md / AGENTS.md / `core.md`. **F3, F4, F5** → BRIEF-005 **Rev 3 — changes requested** (AC-12..14). Re-audit after Cursor's Rev 3 commit.

# Handoff — BRIEF-008 POS shell and design-system v2 tokens

| | |
|---|---|
| **Implementer** | kj (Cursor) |
| **Date** | 2026-10-10 |
| **Brief revision** | 1 |
| **Branch / PR** | `feat/BRIEF-008-pos-shell-tokens` · PR #27 |
| **Commit** | `98fdcb4` (implementation). Follow-up on the same PR marks props `Readonly`, replaces `role="group"` with a `fieldset`, and uses `outline-focus-ring`. |
| **Status** | Implemented — awaiting audit |

> Created at `Implemented`. Update it if review requests changes. Frozen at merge.

## Summary
`/pos/menu` now sits in the CD-01 shell: a 56 px top bar and an 88 px rail. Colour values are the v2 tokens, and the UI font is Noto Sans Thai. Only เมนู navigates; the other rail items are disabled until their screens exist.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `docs/handoffs/assets/BRIEF-008/menu-dark.png`, `menu-light.png`. At 1280×800: header 56 px, rail 88×800, main starts at x=88. `e2e/menu.spec.ts` — rail `เมนูหลัก` visible |
| AC-2 | ✅ | `PosRail.test.tsx` — order, `aria-current="page"`, six `title="เร็ว ๆ นี้"` spans. `e2e/menu.spec.ts` — `aria-current="page"` |
| AC-3 | ✅ | Keyboard on the loaded page: Tab reaches เมนู, then ธีมมืด / ธีมสว่าง / ตามระบบ. Each has `outline: solid 2px rgb(227, 167, 91)` (`--focus-ring` `#E3A75B`). `focus-menu.png`, `focus-theme.png`. Light `--focus-ring` computed `#B87020` |
| AC-4 | ✅ | `LiveClock.test.tsx` — `13:30 น.` then `13:31 น.` after 60 s (Asia/Bangkok). Browser text `13:45 น.`. Playwright console on the loaded page: no hydration warning |
| AC-5 | ✅ | Grep below. No hex in `src/**/*.tsx`. No `dark:` colour utilities |
| AC-6 | ✅ | Dark `--bg-app` `#1c1610`, light `#f6efe2`. ธีมมืด / ธีมสว่าง / ตามระบบ set the `html` class (system followed the OS: dark in the IDE browser, light in headless Playwright). `providers.tsx` unchanged, so the BRIEF-005 pre-paint script still runs. No hydration warning |
| AC-7 | ✅ | Computed `body` font-family: `"Noto Sans Thai", "Noto Sans Thai Fallback", Sarabun, system-ui, sans-serif`. No `Sarabun` import from `next/font` |
| AC-8 | ✅ | Loaded + error, dark and light: `menu-*.png`, `menu-error-*.png`. Empty: `MenuList.test.tsx` — `shows the empty state` |
| AC-9 | ✅ | `wc -l` below. `PosRail` returned JSX is lines 48–84 (37) |
| AC-10 | partial | G1 commands below, all exit 0 on `98fdcb4`. `ci` not green yet (PR #27). Sonar not run — Docker Desktop is manually paused |

## Gate Evidence (G1)
Commands run on the `98fdcb4` tree after the `min-h-dvh` shell fix. `pnpm --version` 10.0.0.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/frontend lint` | 0 | pass |
| `pnpm --filter @bar/frontend typecheck` | 0 | `next typegen && tsc --noEmit` pass |
| `pnpm --filter @bar/frontend test` | 0 | 10 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/frontend build` | 0 | pass |
| `pnpm --filter @bar/frontend test:e2e` | 0 | 1 passed · 0 failed · 0 skipped (local) |
| `pnpm sonar && pnpm sonar:report` | — | **not run.** `docker info`: Docker Desktop is manually paused |

### AC-5 grep
`rg -n -- "--color-(bg|surface|border|text-|accent-text|accent-subtle|error|success-subtle|warning-subtle|bottle-keep)" app/frontend/src`

Every hit is an `@theme inline` `--color-<new-token>` line in `globals.css` (178–185, 187–192, 220–222). No hex in `src/**/*.tsx`. No `dark:` in `src/**/*.tsx`.

### AC-9 line counts
`PosTopBar.tsx` 18 · `PosRail.tsx` 85 · `LiveClock.tsx` 39 · `pos/layout.tsx` 14 · `menu/page.tsx` 10 · `ThemeToggle.tsx` 47 · `layout.tsx` 25. All under the component/page caps. `PosRail` returned JSX is 37 lines.

## Sonar (local scan)
- Scanned commit: not scanned · Quality Gate: not run
- Issues by severity: none recorded — the scan did not start
- Remaining issues + reason: Docker Desktop is manually paused (`docker info`: unpause it from the Whale menu). No findings to waive
- Who fixed: n/a

## Decisions Raised
- none

## Deviations from Brief
- None.

## Known Gaps / Follow-ups
- Local Sonar still needs a run once Docker Desktop is unpaused.
- Shift chip, bell, avatar, and rail log-out stay out of scope (brief §2).
- The Next.js dev overlay shows "1 Issue" on the error screenshots because the capture aborted `/api/**` (and, on an earlier attempt, blocked the MSW worker). The loaded-page console had no error, warning, or hydration message.

## AI Usage
**High** — Cursor implemented the shell, token rename, and tests. DR-008 moved this brief from Metee to kj; Field does not hand-code.

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-008`
- PR: https://github.com/khaijeaw65/bar-management-system/pull/27 · Work SHA: `98fdcb4` · self-check: token values match `docs/design/tokens-v2.css` (property diff, `[data-theme]` selectors dropped); rail order and Lucide names match CD-01 §1; menu chips use served/void tones

## Notes for Reviewer
- Clock text stays `"--:-- น."` until mount, then updates on the next minute boundary. Server HTML and the first client render match, so there is no hydration warning.
- Disabled rail items are `<span aria-disabled="true" title="เร็ว ๆ นี้">`, not links and not in the tab order. Native `title` is the brief's fallback; HeroUI Tooltip was not used.
- Active item uses `bg-accent-soft-strong` (AC-2 and CD-01 §2). CD-00's PosRail line says `accent-soft`.
- HeroUI already emits utilities for `--accent`, `--accent-soft`, `--accent-hover`, `--success`, `--warning`, `--danger`, and `--surface-hover`, so those are not repeated under `@theme`.
- Follow-up before review: `ThemeToggle` is a `fieldset` (Sonar `typescript:S6819`). Focus rings use `outline-focus-ring`. `MenuItemRow`, `MenuListError`, and `Providers` props are `Readonly` (Sonar `typescript:S6759`).
- The shell is `min-h-dvh`. `min-h-full` left the rail at the content height, because the body's used height comes from `min-height`, which a child's percentage does not resolve against.
- Token hex values were compared to `docs/design/tokens-v2.css`: no missing or different custom properties after dropping `[data-theme]` selectors.

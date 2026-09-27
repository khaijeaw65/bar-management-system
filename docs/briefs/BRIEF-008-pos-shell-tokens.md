# BRIEF-008 — POS shell (top bar + 88 px rail) and design-system v2 tokens + Noto Sans Thai

| | |
|---|---|
| **Status** | Ready |
| **Implementer** | methee |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **PR** | <executor fills> |
| **Affected apps** | frontend |
| **Revision** | 1 |
| **Depends on** | BRIEF-005 (Done — `/pos/menu`, theme, MSW) |
| **References** | **`docs/design/tokens-v2.css`** (token values + HeroUI mapping) · `docs/design-system.md` v2.1 (§1 usage, §2 type, §7 layout) · `docs/design/CD-00-handoff.md` §3 PosRail, §4 · `docs/design/CD-01-handoff.md` §1 POS-shell, §2 top bar + PosRail, §5 deviations · screenshots `docs/design/assets/CD-01/03-shell-floor.png`, `05-menu-loaded.png` · DR-002 · `docs/rules/frontend.md` |
| **Audit depth** | Compact (UI) — check token mapping + a11y of the rail |

---

## 1. Goal
The POS web app wears the new design: design-system v2 token names, Noto Sans Thai, and the CD-01 shell — 56 px top bar + 88 px icon rail — around the existing `/pos/menu` page. Every later POS screen plugs into this shell.

## 2. Scope
### In
1. **Tokens (`src/app/globals.css`)** — replace every old `--color-*` token block with the blocks from **`docs/design/tokens-v2.css`**, copied as-is: dark (`:root, .dark`), light (`.light`), theme-independent, and the HeroUI mapping. Drop the `[data-theme=…]` selectors (next-themes uses the class). Then expose the **semantic colour tokens** to Tailwind in `@theme inline` as `--color-<token>` (e.g. `--color-bg-app: var(--bg-app)` → `bg-bg-app`, `--color-text-muted` → `text-text-muted`, `--color-line` → `border-line`, `--color-status-served-bg` → `bg-status-served-bg`). Tokens HeroUI already owns (`--accent`, `--accent-soft`, `--success`, `--warning`, `--danger`, `--surface-hover`) are not re-declared under `@theme` if HeroUI already provides the utility — check, and note what you did. Shadows, z-index and `--num` stay plain CSS variables (use `shadow-(--shadow-card)`, `z-(--z-sticky)` etc.). Use `tabular-nums` where numbers show.
2. **Rename usages** in `src/**/*.tsx` to the new utilities (≈ 25 occurrences today). No old token name may remain.
3. **Font (`src/app/layout.tsx`)** — `Noto_Sans_Thai` from `next/font/google`, weights 400/600/700, subsets `thai` + `latin`, variable `--font-noto-sans-thai`; stack `var(--font-noto-sans-thai), "Sarabun", system-ui, sans-serif`. Remove the Sarabun `next/font` import.
4. **Shell (`src/app/pos/layout.tsx`)** composed from co-located components in `src/app/pos/_components/`:
   - `PosTopBar.tsx` — height 56, bg `bg-sunken`, bottom border `line-hairline`, padding 24. Left: eyebrow "THE LOFT BAR" (700 13 px, letter-spacing .08em) · 1×20 divider · "เดอะ ลอฟท์ บาร์". Right: `LiveClock` then `ThemeToggle` (existing component, restyled with new tokens only).
   - `LiveClock.tsx` — `HH:MM น.` in Thai time zone, 600 13 px, `tabular-nums`, updates every minute, **no hydration mismatch** (render after mount or suppress correctly — explain your choice in the handoff).
   - `PosRail.tsx` — width 88, bg `bg-sunken`, right border `line-hairline`. **Top section 56 px** (lines up with the top bar, bottom border `line-hairline`): two-line mark "THE / LOFT" (700 12 px, letter-spacing .08em, `text-text-accent`). Bottom section (log-out) is **not** built here. Nav padding 8 0, gap 2; items 64×64, radius 10, Lucide icon **24 px** stroke 1.75 + label 600 10 px. Items in this order: โต๊ะ `Grid2x2` · ออเดอร์ `ReceiptText` · ชำระเงิน `Banknote` · เมนู `BookOpen` · แขก `Users` · รายงาน `ChartColumn` · ตั้งค่า `Settings`. Active = `accent-soft` fill + `text-text-accent` (CD-00 PosRail spec); inactive = `text-text-faint`, hover `bg-surface-hover`. Active item from `usePathname()`.
   - Only **เมนู** links (`/pos/menu`). The other six render **disabled** (not links, `aria-disabled="true"`, tooltip/title "เร็ว ๆ นี้") until their screens exist.
   - `<nav aria-label="เมนูหลัก">`; active link has `aria-current="page"`; focus-visible ring uses `--focus-ring`.
5. **Tests (Methee writes them):** `PosRail.test.tsx` (order, active state, disabled items), `LiveClock.test.tsx` (fake timers: shows time, updates after a minute), update `e2e/menu.spec.ts` (rail visible, เมนู has `aria-current="page"`). Existing tests stay green.

### Out (do NOT build here)
- Menu-list redesign (search, category chips, no-result, new states) → **BRIEF-010** (after BRIEF-009 contracts).
- Shift chip, notification bell, avatar / sign-out, rail log-out, rail badges → need auth / shift / notification data (BRIEF-007 and later).
- Login, not-registered, session-expired screens → with BRIEF-007 frontend.
- Floor view (StatTile / TableTile) → CD-02.
- New packages, a shared `components/ui` wrapper layer, 1024 px special layout (rail stays 88 px).

## 3. Contract — tokens
- **Values:** `docs/design/tokens-v2.css` exactly (CD-00, both themes final). Hex values appear only in the copied token blocks of `globals.css` — never in `.tsx`.
- **Old → new names (for the rename):** `--color-bg`→`--bg-app` · `--color-surface`→`--surface-card` · `--color-surface-raised`→`--surface-raised` · `--color-border`→`--line` · `--color-text-primary`→`--text-body` · `--color-text-secondary`→`--text-muted` · `--color-text-disabled`→`--text-faint` · `--color-accent-text`→`--text-accent` · `--color-accent-subtle`→`--accent-soft` · `--color-success/-subtle`→`--success/--success-bg` · `--color-warning/-subtle`→`--warning/--warning-bg` · `--color-error/-subtle`→`--danger/--danger-bg` · `--color-bottle-keep/-subtle`→`--bottle-keep/--bottle-keep-bg`.
- Menu status chip (existing page): พร้อมขาย = served tone (`status-served-bg` / `status-served-fg`), หมด = void tone.

## 4. Acceptance Criteria
- **AC-1** — Given `/pos/menu`, the shell shows a 56 px top bar (brand left; clock + theme toggle right) and an 88 px rail with the 7 items in §2.4 order, Thai labels and the listed Lucide icons; the page content sits to the right of the rail. Matches the chrome (rail + top bar, ignoring shift chip / bell / avatar and the "ARTBOARD STATE" annotation row) in `05-menu-loaded.png` (dark).
- **AC-2** — On `/pos/menu`, เมนู is active (`aria-current="page"`, accent-soft-strong bg, text-accent); the other six are disabled (`aria-disabled="true"`, not links, not focusable as links) and show "เร็ว ๆ นี้" on hover.
- **AC-3** — Keyboard: Tab reaches เมนู and the theme toggle; focus ring visible in both themes.
- **AC-4** — The clock shows `HH:MM น.` (Asia/Bangkok), updates at the next minute, uses tabular numbers, and the browser console has no hydration warning.
- **AC-5** — Tokens: `grep -rnE -- "--color-(bg|surface|border|text-|accent-text|accent-subtle|error|success-subtle|warning-subtle|bottle-keep)" app/frontend/src` → only the `@theme inline` `--color-<new-token>` lines; no hex in `src/**/*.tsx`; no `dark:` colour utilities.
- **AC-6** — Dark ↔ light ↔ system still works with no wrong-theme flash (BRIEF-005 AC-3/AC-13 still hold); both themes use `tokens-v2.css` values (spot-check `--bg-app` = `#1C1610` dark / `#F6EFE2` light in DevTools).
- **AC-7** — Computed `font-family` on `body` starts with the Noto Sans Thai `next/font` family; Sarabun `next/font` import is gone.
- **AC-8** — Existing menu page states (loaded / error / empty) still render correctly with the new tokens.
- **AC-9** — Component limits from `frontend.md` hold (≤ 150 lines/component, ≤ 100 lines/page, ≤ 40 lines JSX).
- **AC-10** — `lint`, `typecheck`, `test`, `build` exit 0; `ci` green; local Sonar quality gate passes (or each remaining issue is listed with a reason).

## 5. Test Gate
| AC | Test type | Location |
|---|---|---|
| AC-1, AC-6, AC-8 | manual — screenshots dark + light (menu loaded, error) side by side with `05-menu-loaded.png` | handoff |
| AC-2 | component | `src/app/pos/_components/PosRail.test.tsx` |
| AC-2 | e2e (local) | `e2e/menu.spec.ts` |
| AC-3, AC-4 (console), AC-7 | manual — short note + console screenshot | handoff |
| AC-4 | unit (fake timers) | `src/app/pos/_components/LiveClock.test.tsx` |
| AC-5, AC-9 | `grep` / `wc -l` output | handoff |
| AC-10 | command output + `ci` link + `pnpm sonar:report` | handoff |

```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend build
pnpm --filter @bar/frontend test:e2e   # local
pnpm sonar && pnpm sonar:report        # local, before each commit you push
```

### Local Sonar scan
- Required for this brief: **yes** (Methee).
- Approved exclusions / "won't fix": none.

## 6. Constraints
- **Learning mode (workflow §8):** Methee writes the components and **all tests**; agents explain, review and unblock (≤ 20%). Handoff states AI usage `Low / Medium / High` + one line.
- **Do not port Claude Design JSX.** Build with HeroUI v3 components where one fits (e.g. `Tooltip`, `Button`) and plain semantic HTML + Tailwind for the rail; tokens only.
- Rail items are data (an array of `{ key, label, icon, href? }`), rendered by one map — don't repeat 7 blocks of JSX.
- `'use client'` only where needed (`PosRail` for `usePathname`, `LiveClock`); the top bar and layout stay server components.
- Named exports; `_components/` stays private to `app/pos/`.
- Touch only `app/frontend/**`. Do not touch `app/backend/**`, `app/packages/**`, `infra/**`, `.github/**`, root configs.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact only):** no new packages · token values = `docs/design/tokens-v2.css`, renames in §3 · utility naming `--color-<token>` · Lucide icons `Grid2x2`, `ReceiptText`, `Banknote`, `BookOpen`, `Users`, `ChartColumn`, `Settings` · paths `src/app/pos/_components/{PosTopBar,PosRail,LiveClock}.tsx` · top bar padding 24 (CD-01 deviation #5).
- **Likely DRs:** a Lucide icon name missing in the installed `lucide-react` (use the nearest and note it — no DR if it's only a rename) · HeroUI `Tooltip` can't wrap a disabled item (fallback: `title` attribute — note it, no DR) · `Noto_Sans_Thai` not available in `next/font/google` for this Next version (stop → DR).

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-09-27 | Initial draft (Cowork) from CD-01 handoff + design-system v2; updated same day with CD-00 final tokens (`tokens-v2.css`), rail icon 24, no temporary light values |
| 1 | 2026-09-28 | Ready — approved by Field in session ("approve B8") |

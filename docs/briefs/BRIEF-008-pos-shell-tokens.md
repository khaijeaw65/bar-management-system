# BRIEF-008 — POS shell (top bar + 88 px rail) and design-system v2 tokens + Noto Sans Thai

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | methee |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **PR** | <executor fills> |
| **Affected apps** | frontend |
| **Revision** | 1 |
| **Depends on** | BRIEF-005 (Done — `/pos/menu`, theme, MSW) |
| **References** | `docs/design-system.md` v2 (§1 tokens + HeroUI mapping, §2 type, §7 layout) · `docs/design/CD-01-handoff.md` §1 POS-shell, §2 top bar + PosRail, §5 deviations · screenshots `docs/design/assets/CD-01/03-shell-floor.png`, `05-menu-loaded.png` · DR-002 · `docs/rules/frontend.md` |
| **Audit depth** | Compact (UI) — check token mapping + a11y of the rail |

---

## 1. Goal
The POS web app wears the new design: design-system v2 token names, Noto Sans Thai, and the CD-01 shell — 56 px top bar + 88 px icon rail — around the existing `/pos/menu` page. Every later POS screen plugs into this shell.

## 2. Scope
### In
1. **Tokens (`src/app/globals.css`)** — replace every old `--color-*` token with the v2 semantic names from §3 (dark on `:root, .dark`, light on `.light`). Remap HeroUI variables (`--background`, `--foreground`, `--surface`, `--overlay`, `--default`, `--muted`, `--accent`, `--accent-foreground`, `--border`, `--separator`, `--focus`, `--link`, `--success`, `--danger`, `--warning`) per design-system §1. Expose each semantic token to Tailwind in `@theme inline` as `--color-<token>` (e.g. `--color-bg-app: var(--bg-app)` → `bg-bg-app`, `--color-text-muted` → `text-text-muted`, `--color-line` → `border-line`). Add `tabular-nums` utility use where numbers show.
2. **Rename usages** in `src/**/*.tsx` to the new utilities (≈ 25 occurrences today). No old token name may remain.
3. **Font (`src/app/layout.tsx`)** — `Noto_Sans_Thai` from `next/font/google`, weights 400/600/700, subsets `thai` + `latin`, variable `--font-noto-sans-thai`; stack `var(--font-noto-sans-thai), "Sarabun", system-ui, sans-serif`. Remove the Sarabun `next/font` import.
4. **Shell (`src/app/pos/layout.tsx`)** composed from co-located components in `src/app/pos/_components/`:
   - `PosTopBar.tsx` — height 56, bg `bg-sunken`, bottom border `line-hairline`, padding 24. Left: eyebrow "THE LOFT BAR" (700 13 px, letter-spacing .08em) · 1×20 divider · "เดอะ ลอฟท์ บาร์". Right: `LiveClock` then `ThemeToggle` (existing component, restyled with new tokens only).
   - `LiveClock.tsx` — `HH:MM น.` in Thai time zone, 600 13 px, `tabular-nums`, updates every minute, **no hydration mismatch** (render after mount or suppress correctly — explain your choice in the handoff).
   - `PosRail.tsx` — width 88, bg `bg-sunken`, right border `line-hairline`; nav padding 8 0, gap 2; items 64×64, radius 10, Lucide icon 22 px stroke 1.75 + label 600 10 px. Items in this order: โต๊ะ `Grid2x2` · ออเดอร์ `ReceiptText` · ชำระเงิน `Banknote` · เมนู `BookOpen` · แขก `Users` · รายงาน `ChartColumn` · ตั้งค่า `Settings`. Active = `bg-accent-soft-strong` + `text-text-accent`; inactive = `text-text-faint`, hover `bg-surface-hover`. Active item from `usePathname()`.
   - Only **เมนู** links (`/pos/menu`). The other six render **disabled** (not links, `aria-disabled="true"`, tooltip/title "เร็ว ๆ นี้") until their screens exist.
   - `<nav aria-label="เมนูหลัก">`; active link has `aria-current="page"`; focus-visible ring uses `--focus-ring`.
5. **Tests (Methee writes them):** `PosRail.test.tsx` (order, active state, disabled items), `LiveClock.test.tsx` (fake timers: shows time, updates after a minute), update `e2e/menu.spec.ts` (rail visible, เมนู has `aria-current="page"`). Existing tests stay green.

### Out (do NOT build here)
- Menu-list redesign (search, category chips, no-result, new states) → **BRIEF-009**.
- Shift chip, notification bell, avatar / sign-out, rail log-out, rail badges → need auth / shift / notification data (BRIEF-007 and later).
- Login, not-registered, session-expired screens → with BRIEF-007 frontend.
- Floor view (StatTile / TableTile) → CD-02.
- Final light-theme values → CD-00 (use the temporary light values in §3).
- New packages, a shared `components/ui` wrapper layer, 1024 px special layout (rail stays 88 px).

## 3. Contract — token mapping
Dark values = `docs/design-system.md` v2. Light values are **temporary** (current light palette under the new names) until CD-00.

| Old token | New token | Dark | Light (temporary) |
|---|---|---|---|
| `--color-bg` | `--bg-app` | `#1C1610` | `#FAF6EF` |
| — | `--bg-sunken` | `#12100C` | `#F2EADD` |
| `--color-surface` | `--surface-card` | `#2C2318` | `#FFFDF9` |
| `--color-surface-raised` | `--surface-raised` | `#362B1E` | `#F2EADD` |
| — | `--surface-overlay` | `#241D15` | `#FFFDF9` |
| — | `--surface-input` | `#241D15` | `#FFFDF9` |
| — | `--surface-hover` | `#423424` | `#EFE5D6` |
| `--color-border` | `--line` | `rgba(240,230,208,.12)` | `#E3D6C2` |
| — | `--line-hairline` | `rgba(240,230,208,.07)` | `#ECE2D2` |
| — | `--line-strong` | `rgba(240,230,208,.22)` | `#CDBDA5` |
| `--color-text-primary` | `--text-body` | `#F0E6D0` | `#2A2016` |
| `--color-text-secondary` | `--text-muted` | `#C4B698` | `#735E49` |
| `--color-text-disabled` | `--text-faint` | `#8E8069` | `#A8977F` |
| `--color-accent-text` | `--text-accent` | `#E3A75B` | `#A5601A` |
| — | `--text-on-accent` | `#241608` | `#241608` |
| — | `--text-danger` | `#E0745C` | `#C23B3B` |
| `--color-accent` | `--accent` | `#D4872A` | `#D4872A` |
| `--color-accent-subtle` | `--accent-soft` | `rgba(212,135,42,.14)` | `#F6E6CF` |
| — | `--accent-soft-strong` | `rgba(212,135,42,.24)` | `#EFD6B3` |
| — | `--focus-ring` | `#E3A75B` | `#A5601A` |
| `--color-success` / `-subtle` | `--success` / `--success-bg` | `#7FA85C` / `#2E3A20` | `#2A8055` / `#E3F1E8` |
| `--color-warning` / `-subtle` | `--warning` / `--warning-bg` | `#E3A11B` / `#40300B` | `#9A6512` / `#F8EBD3` |
| `--color-error` / `-subtle` | `--danger` / `--danger-bg` | `#C4503A` / `#40190F` | `#C23B3B` / `#F9E1E1` |
| — | `--info` / `--info-bg` | `#6E93A8` / `#1E2F38` | `#3F6F8A` / `#E1ECF2` |
| `--color-bottle-keep` / `-subtle` | `--bottle-keep` / `--bottle-keep-bg` | `#8B93D4` / `#262840` | `#5A62B0` / `#E6E8F6` |

HeroUI `--accent-foreground` → `var(--text-on-accent)` (no hex in the mapping block). Hex values live **only** in the two token blocks.

## 4. Acceptance Criteria
- **AC-1** — Given `/pos/menu`, the shell shows a 56 px top bar (brand left; clock + theme toggle right) and an 88 px rail with the 7 items in §2.4 order, Thai labels and the listed Lucide icons; the page content sits to the right of the rail. Matches the chrome in `05-menu-loaded.png` (dark).
- **AC-2** — On `/pos/menu`, เมนู is active (`aria-current="page"`, accent-soft-strong bg, text-accent); the other six are disabled (`aria-disabled="true"`, not links, not focusable as links) and show "เร็ว ๆ นี้" on hover.
- **AC-3** — Keyboard: Tab reaches เมนู and the theme toggle; focus ring visible in both themes.
- **AC-4** — The clock shows `HH:MM น.` (Asia/Bangkok), updates at the next minute, uses tabular numbers, and the browser console has no hydration warning.
- **AC-5** — Tokens: `grep -rnE -- "--color-(bg|surface|border|text-|accent-text|accent-subtle|error|success-subtle|warning-subtle|bottle-keep)" app/frontend/src` → only the `@theme inline` `--color-<new-token>` lines; no hex in `src/**/*.tsx`; no `dark:` colour utilities.
- **AC-6** — Dark ↔ light ↔ system still works with no wrong-theme flash (BRIEF-005 AC-3/AC-13 still hold); light uses the §3 temporary values.
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
- **Pre-decided (exact only):** no new packages · token names and values in §3 · utility naming `--color-<token>` · Lucide icons `Grid2x2`, `ReceiptText`, `Banknote`, `BookOpen`, `Users`, `ChartColumn`, `Settings` · paths `src/app/pos/_components/{PosTopBar,PosRail,LiveClock}.tsx` · top bar padding 24 (CD-01 deviation #5).
- **Likely DRs:** a Lucide icon name missing in the installed `lucide-react` (use the nearest and note it — no DR if it's only a rename) · HeroUI `Tooltip` can't wrap a disabled item (fallback: `title` attribute — note it, no DR) · `Noto_Sans_Thai` not available in `next/font/google` for this Next version (stop → DR).

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions
- [x] No unresolved decision blocking the main outcome
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-09-27 | Initial draft (Cowork) from CD-01 handoff + design-system v2 |

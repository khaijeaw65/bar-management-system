# BRIEF-014 — Design tokens as Tailwind utilities (type, radius, tracking, motion) + no-arbitrary-px gate

| | |
|---|---|
| **Status** | Draft rev 2 — waiting for Field approval (rev 1 was Ready; Phase A findings changed §3.1, §3.4, AC-2, §7) |
| **Implementer** | kj (Cursor) — Field may reassign |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **PR** | <executor fills> |
| **Affected apps** | frontend |
| **Revision** | 2 |
| **Depends on** | BRIEF-008 (Done — merged PR #27: v2 colour tokens + Noto Sans Thai in `globals.css`) |
| **References** | DS tokens: `docs/design/poc-source-handoff/source/project/ds/theloftbardesignsystem_99bbff/tokens/{typography,spacing,radius,motion}.css` · `docs/design/tokens-v2.css` · `docs/rules/frontend.md` (Styling) · `docs/design/cd-template.md` §6 · POC finding (BRIEF-900): only colours had utilities, so the agent fell back to `text-[13px]`, `rounded-[10px]`, `duration-[140ms]` |
| **Audit depth** | Compact (UI tooling, no behaviour change) |

## 1. Goal
Every DS type style, radius, tracking and easing token has a Tailwind utility, so agents write `text-label rounded-btn tracking-caps` instead of hard-coded pixels — and lint fails when someone writes an arbitrary px/number value in a class.

## 2. Scope
### In
- `app/frontend/src/app/globals.css`: DS primitives in `:root` + utility tokens in `@theme inline` (§3), plus a comment block with the DS → Tailwind mapping (§3 tables) so agents translate canvas source mechanically.
- Replace the 6 existing arbitrary values (§3.5).
- `app/frontend/eslint.config.mjs`: the no-arbitrary-value gate (§3.6).
- Unit-free test that the gate catches a bad class (§5).

### Out (do NOT build here)
- Changing colours, shadows, z-index, HeroUI variable mapping, `layout.tsx` fonts.
- Overriding Tailwind / HeroUI's existing scale names (`text-sm`, `rounded-sm/md/lg/xl…`) or resetting default scales.
- Migrating existing default utilities (`text-sm`, `rounded-lg`, … — 9 usages on main, listed in the Phase A report) to DS names. Report them; a later brief decides.
- Expo / HeroUI Native theme (separate surface).
- New dependencies (no eslint-plugin-tailwindcss).

## 3. Contract

### 3.1 Primitives in `:root` (theme-independent block), copied byte-for-byte from the DS token files
`--fs-*` (display 34, title 26, heading 21, subhead 17, body 15, small 13, micro 11, price 19, pos-total 40) · `--lh-*` (display 1.35, title 1.4, heading 1.45, body 1.62, tight 1.5) · `--fw-*` (400/600/700) · `--ls-display -0.01em` · `--ls-caps 0.08em` · `--r-*` (xs 6, sm 8, btn 10, input 10, card 12, card-lg 16, sheet 20, pill 999) · `--border-w 1px`, `--border-w-strong 1.5px` · `--dur-*` (instant 90, fast 140, base 200, slow 300, sheet 340 ms) · `--ease-ds-out` (= DS `--ease-out` value) · `--ease-sheet` · `--press-scale .97`.
Names stay identical to the DS so canvas `var(--…)` references resolve unchanged — **except easing**: DS `--ease-out` / `--ease-in-out` are **not** declared under those names, because an unlayered `:root --ease-out` would override Tailwind's `--ease-out`, which HeroUI 3.2.6 uses in 178 places (modal, alert-dialog, table…). DS `--ease-in-out` equals Tailwind's default, so it is not copied at all. Not copied either: `--ls-body` (0) and `--num` (already in globals.css).

### 3.2 Type — `@theme inline`, one class = one DS composite style
| DS (canvas) | Class | size / line-height / weight / tracking |
|---|---|---|
| `--text-display` | `text-display` | fs-display / lh-display / fw-bold / ls-display |
| `--text-title` | `text-title` | fs-title / lh-title / fw-bold |
| `--text-heading` | `text-heading` | fs-heading / lh-heading / fw-semibold |
| `--text-subhead` | `text-subhead` | fs-subhead / lh-tight / fw-semibold |
| `--text-body-md` | `text-body-md` | fs-body / lh-body / fw-regular |
| `--text-body-strong` | `text-body-strong` | fs-body / lh-body / fw-semibold |
| `--text-small` | `text-small` | fs-small / 1.5 / fw-regular |
| `--text-label` | `text-label` | fs-micro / 1.4 / fw-semibold |
| `--text-price` | `text-price` | fs-price / 1.3 / fw-bold (add `tabular-nums` in markup) |
| (DS bundle POS total) | `text-pos-total` | fs-pos-total / 1.1 / fw-bold (add `tabular-nums`) |

Form: `--text-label: var(--fs-micro); --text-label--line-height: 1.4; --text-label--font-weight: var(--fw-semibold);` (+ `--letter-spacing` for display).
Type utilities set size, line-height, weight (and tracking for display) only — the app font is already the body font; numeric styles add `tabular-nums` in markup.
**Do not** name a size `body` — `--text-body` is already the body **colour** token. That is why the classes mirror the DS composite names.

### 3.3 Radius and tracking — `@theme inline`
| DS | Class | Why this name |
|---|---|---|
| `--r-btn` | `rounded-btn` | |
| `--r-input` | `rounded-input` | |
| `--r-card` | `rounded-card` | |
| `--r-card-lg` | `rounded-card-lg` | |
| `--r-sheet` | `rounded-sheet` | |
| `--r-pill` | `rounded-pill` | |
| `--r-xs` | `rounded-ds-xs` | `rounded-xs/sm` are taken: HeroUI 3.2.6 redefines `--radius-sm/md/lg/xl…` from `--radius` (12 px → sm 6, md 9, lg 12, xl 18); overriding them would change every HeroUI component. |
| `--r-sm` | `rounded-ds-sm` | same |
| `--ls-caps` | `tracking-caps` | |
| `--ls-display` | `tracking-display` | |

Borders: `border` (1px) is the DS `--border-w`; `--border-w-strong` (1.5px) → `border-(length:--border-w-strong)`.

### 3.4 Spacing, sizes, motion
- **Spacing and sizes: Tailwind's numeric scale (1 unit = 4 px), no new tokens.** Every DS spacing value is on the 2 px grid, and v4 accepts any multiple (`w-22` = 88 px, `w-100` = 400 px). Mapping (put in the globals.css comment):

  | DS | px | Tailwind | | DS | px | Tailwind |
  |---|---|---|---|---|---|---|
  | sp-1 | 2 | 0.5 | | sp-7 | 20 | 5 |
  | sp-2 | 4 | 1 | | sp-8 | 24 | 6 |
  | sp-3 | 6 | 1.5 | | sp-9 | 32 | 8 |
  | sp-4 | 8 | 2 | | sp-10 | 40 | 10 |
  | sp-5 | 12 | 3 | | sp-11 | 48 | 12 |
  | sp-6 | 16 | 4 | | sp-12 | 64 | 16 |

  Semantic sizes: tap-min 44 → `11` · tap-comfortable 52 → `13` · bar-height 56 → `14` · pos-key 64 → `16`.
- **Durations:** `duration-(--dur-fast)` etc. (Tailwind v4 has no duration theme namespace; the `(--token)` form references the DS variable, no brackets.)
- **Easing:** add `--ease-ds-out` and `--ease-sheet` in `@theme inline` → `ease-ds-out`, `ease-sheet`. Canvas `var(--ease-out)` → `ease-ds-out`; canvas `var(--ease-in-out)` → Tailwind `ease-in-out` (same curve). Tailwind's `ease-out` / `ease-in-out` stay untouched so HeroUI motion does not change.
- **Press scale:** `scale-(--press-scale)`.

### 3.5 Replace the 6 existing arbitrary values
| File:line (main) | Now | Becomes |
|---|---|---|
| `pos/_components/LiveClock.tsx:35` | `text-[13px] font-semibold` | `text-small font-semibold` |
| `pos/_components/PosRail.tsx:36` | `rounded-[10px] text-[10px] font-semibold leading-[1.2]` | `rounded-btn text-label` (10 → 11 px, 1.2 → 1.4: DS has no 10 px, and Thai needs ≥ 1.4) |
| `pos/_components/PosRail.tsx:49` | `w-[88px]` | `w-22` |
| `pos/_components/PosRail.tsx:50` | `text-[12px] font-bold leading-none tracking-[0.08em]` | `text-small font-bold leading-none tracking-caps` (12 → 13 px: no 12 px in the DS) |
| `pos/_components/PosTopBar.tsx:8` | `text-[13px] font-bold tracking-[0.08em]` | `text-small font-bold tracking-caps` |
| `pos/_components/PosTopBar.tsx:10` | `text-[13px]` | `text-small` |

Two visual changes (rail label 10 → 11, rail monogram 12 → 13): attach before/after screenshots of the POS shell (dark, 1280×800) to the PR.

### 3.6 Gate — no arbitrary numeric values in classes
`no-restricted-syntax` in `app/frontend/eslint.config.mjs`, files `src/**/*.{ts,tsx}`, error level, on string literals **and** template literal parts whose text contains an arbitrary value that starts with a digit, `-digit`, `.digit` or `#`, or contains `px` — e.g. `text-[13px]`, `w-[88px]`, `leading-[1.2]`, `duration-[140ms]`, `bg-[#fff]`, `grid-cols-[1fr_320px]`.
Message: `Use a design token utility (see globals.css mapping) — no arbitrary values.`
Allowed (not matched): `(--token)` forms, non-numeric arbitrary values such as `grid-cols-[auto_1fr]`, `content-['']`.
No disable comments anywhere in the PR.

- **Endpoints / WS / contracts / permissions:** none.

## 4. Acceptance Criteria
- **AC-1** — Given the new tokens, when a component uses `text-display`, `text-label`, `rounded-card`, `rounded-ds-sm`, `tracking-caps`, `ease-ds-out`, `ease-sheet`, `duration-(--dur-fast)`, then the computed styles equal the DS values in §3 (checked in a test or the built CSS).
- **AC-2** — HeroUI components look unchanged: `rounded-sm/md/lg/xl`, `text-sm/base/lg`, `ease-out`, `ease-in-out` (and the `--ease-out` variable), and all colour utilities resolve to the same values as before (diff of the built CSS for those utilities is empty).
- **AC-3** — The 6 usages in §3.5 are replaced; `git grep -nE '\-\[(#|-?\.?[0-9])|\-\[[^]]*px' app/frontend/src` returns nothing.
- **AC-4** — `pnpm --filter @bar/frontend lint` fails on a file containing `className="text-[13px]"` and passes on `className="text-small"` and on `grid-cols-[auto_1fr]`.
- **AC-5** — `globals.css` has the mapping comment (§3.2–§3.4 tables, short form).

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2 | build-CSS check (script or Vitest reading `.next` CSS output) — or manual with the output pasted in the PR | your choice; report which |
| AC-3 | grep (command above) | PR description |
| AC-4 | ESLint `RuleTester`-style unit test, or a fixture file linted in a Vitest test | `app/frontend/src/lib/lint/no-arbitrary-values.test.ts` |
| visual | screenshots before/after, POS shell dark 1280×800 | PR description |

Gate commands (all must pass):
```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend build
```
### Local Sonar scan
- Required: optional — styling/tooling only.

## 6. Constraints
- Tailwind v4 CSS-first config: tokens in `@theme inline` inside `globals.css`; no `tailwind.config.*`.
- Values copied from the DS token files, never retyped from memory; keep DS variable names.
- Before writing: grep `@heroui/styles` 3.2.6 for every new theme key (`--text-display … --text-pos-total`, `--radius-btn … --radius-ds-sm`, `--tracking-caps`, `--tracking-display`, `--ease-sheet`). Any collision → stop and report (Phase A).
- Two-phase: **Phase A** report (collision check result, the 11 default-utility usages, test approach for AC-1/AC-4) → stop → Field/Cowork answer → **Phase B** build.

## 7. Decision Points (Field Guard)
**Pre-decided (exact):**
1. Type classes = DS composite names (§3.2); no `text-body` size.
2. Radius names (§3.3) incl. `rounded-ds-xs` / `rounded-ds-sm`; HeroUI's `rounded-sm/md/lg/xl` untouched.
3. Spacing = Tailwind numeric scale, no new spacing tokens (§3.4).
4. Durations via `duration-(--dur-*)`; easing = new `--ease-ds-out` + `--ease-sheet` only; no override of Tailwind/HeroUI `--ease-out` / `--ease-in-out` (rev 2).
5. Replacements exactly as §3.5, including the two visual changes.
6. Gate = ESLint `no-restricted-syntax` in `app/frontend/eslint.config.mjs` (§3.6), no new dependency.
7. Branch `feat/BRIEF-014-design-tokens-tailwind` from main.
8. Tests as in the Phase A report: Vitest compiles `globals.css` with `@tailwindcss/postcss` + `@source inline(...)` probe classes (AC-1, AC-2 byte-identical selectors); AC-4 via `ESLint.lintText` on a virtual `src/…tsx` path, bad sample built by string concatenation, no failing fixture file.
9. Phase A inferences accepted: copy only the §3.1 list; `text-pos-total` line-height 1.1; no font-family in type utilities; `docs/design/tokens-v2.css` not edited; DS spacing extras (`--gutter-*`, `--card-pad*`, `--stack*`, `--section-gap`, `--sheet-grab`) not added.

**Likely DRs:** none expected. A HeroUI collision on any new name → report, don't rename on your own.

## 8. Unlocked Protected Files
- `none`

**Field action (protected file, outside this brief):** after merge, add one line to `docs/rules/frontend.md` → Styling, under the colour rule:
> - **Type, radius, tracking, motion only from design-system utilities** (`text-label`, `rounded-card`, `tracking-caps`, `duration-(--dur-fast)`, …); spacing and sizes from Tailwind's numeric scale. No arbitrary values (`text-[13px]`, `w-[88px]`) — enforced by lint. Mapping: `globals.css`.

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions
- [x] No unresolved decision blocking the main outcome
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-10 | Initial (from the BRIEF-900 POC finding); Field approved → Ready |
| 2 | 2026-10-10 | From Cursor Phase A + Cowork check: no `--ease-out`/`--ease-in-out` override (HeroUI uses `--ease-out` 178×) → `ease-ds-out`; usage count 9; Phase A inferences and test approach recorded as Pre-decided 8–9 |

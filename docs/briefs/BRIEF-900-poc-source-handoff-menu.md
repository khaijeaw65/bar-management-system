# BRIEF-900 — POC: Bar menu page from an approved design source snapshot

| | |
|---|---|
| **Status** | Ready — Field approved in session 2026-10-10 ("go with exception — it's just for testing workflow") |
| **Implementer** | kj (Cursor) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **PR** | <executor fills> |
| **Affected apps** | frontend |
| **Revision** | 1 |
| **Depends on** | BRIEF-008 (Done — merged PR #27, v2 tokens + Noto Sans Thai) |
| **References** | **Contract: `docs/design/poc-source-handoff/handoff.md`** + `source/project/Main.dc.html`, `NoResults.dc.html` (canvas `1791613503-f864`) · `docs/design-system.md` §5 · `docs/rules/frontend.md` |
| **Audit depth** | Compact (UI) |

> **Experiment (900-series).** Tests the workflow *approved canvas → source snapshot → coding agent*. Built on its own branch and **never merged to main**. Delete the branch after Field's comparison.

## 1. Goal
An isolated `/poc/menu` page that matches the two approved boards, built only from the source snapshot + handoff (no screenshots), so Field can judge whether snapshots are a sufficient handoff.

## 2. Scope
### In
- `app/frontend/src/app/poc/menu/page.tsx` + `_components/` (files as in your Phase A plan: MenuScreen, MenuHeader, CategoryFilters, ResultsLine, MenuGrid, MenuItemCard, MenuEmpty, menu-data.ts) + co-located tests.
- Sample data, search and category behaviour exactly as handoff §4–§5; both designed states.

### Out (do NOT build here)
- Editing `globals.css`, `layout.tsx`, shared components, production routes, or `docs/design/poc-source-handoff/` (read-only, untracked — do not commit it).
- Cart, auth, API, realtime, light theme, responsive/mobile layout, loading/error states, new dependencies.

## 3. Contract
- Design contract = handoff + the two boards. Where they differ, the **board** wins, and you report it.
- No endpoints, WS events, contracts changes or permissions.

## 4. Acceptance Criteria
- **AC-1** — Default state matches `Main.dc.html`: eyebrow, title, search 400×44, five tags with counts, `แสดง 4 รายการ`, 4-column grid of the four items (exact Thai copy and prices; long name wraps, never truncated).
- **AC-2** — Sold-out `ยำหมูยอ`: whole card (chip included) at opacity .5, chip `หมด` (void soft fill, dot on); available cards have no label and no add button.
- **AC-3** — Typing `มาร์การิต้า` shows `NoResults.dc.html`: results line, empty state (search-x, title, description), secondary `ล้างคำค้นหา`; the button and the in-field clear both clear the query only and keep the selected category.
- **AC-4** — Search (trimmed substring, `toLocaleLowerCase('th')`) AND single-select category combine; tag counts stay fixed.
- **AC-5** — Tokens only, no hex in `.tsx`, no new dependencies; gate commands pass.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-3, AC-4 | unit (Vitest + Testing Library) | `app/frontend/src/app/poc/menu/_components/MenuScreen.test.tsx` — default renders 4 cards; `ช้าง` → 1; category `food` → 1 (sold out); `มาร์การิต้า` → empty state; clear restores 4 with category kept |
| AC-1, AC-2 | manual | Field compares against the canvas (POC checklist) |

Gate commands (all must pass):
```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend build
```
### Local Sonar scan
- Required: no — throwaway experiment, never merged.

## 6. Constraints
- Canvas source is reference only — do not port `<x-dc>`, `<x-import>`, `sc-for`, `{{holes}}`, `DCLogic`, `support.js`, `_ds_bundle.js`, the Lucide UMD.
- `docs/rules/frontend.md` component rules and size limits apply.
- Report every inferred value (not literally in the source, the handoff or §7 below).

## 7. Decision Points (Field Guard)
**Pre-decided (exact):**
1. **Type / space / radius / motion tokens that have no utility** (not in `globals.css`, which stays untouched): use Tailwind's built-in scale where the value is identical (`p-10`=40, `px-12`=48, `gap-6`=24, `gap-2`=8, `gap-1`=4, `pb-16`=64, `font-normal/semibold/bold`, `leading-normal`=1.5); otherwise **arbitrary values equal to the snapshot token value**, each with a trailing comment naming the token, e.g. `text-[34px] leading-[1.35] tracking-[-0.01em] /* --text-display */`, `leading-[1.62] /* --lh-body */`, `rounded-[10px] /* --r-input */`, `rounded-[12px] /* --r-card */`, `rounded-full /* --r-pill */`. Shadows: `shadow-(--shadow-card)` form (BRIEF-008). This gap is a **finding of the experiment** — do not fix it in globals.css.
2. **Page box:** outer `div` = `dark min-h-screen bg-bg-app` (forces the dark token set for this subtree regardless of the saved theme); inner `main` = `w-[1280px] min-h-[800px] mx-auto` with the board's padding and gaps. No `overflow: hidden`, not responsive.
3. **Tag group:** `TagGroup` single selection with `disallowEmptySelection` (clicking the selected tag keeps it); count rendered as a child after the label with `tabular-nums` (opacity 1 selected, .85 otherwise, as the DS Tag).
4. **In-field clear:** compose `SearchField.ClearButton` (aria-label `ล้างคำค้นหา`) and keep Escape-to-clear — this matches the DS SearchField; clears the query only.
5. **Placeholder colour:** HeroUI's field placeholder token (`--text-faint`); no override.
6. **Motion:** hover states as the DS functions (card → `surface-hover` when not sold out, tag/button hover) with a 140 ms ease-out transition (`duration-[140ms] ease-[cubic-bezier(.2,0,0,1)]`); **no press-scale**.
7. **Search height 44** (board), not the component default 40. Empty state uses the board's icon/title/description; `variant` naming is irrelevant to the result.
8. **Results line:** tabular numbers on the default line only, as the boards.
9. **Font stack:** the app's (`var(--font-noto-sans-thai), "Sarabun", system-ui, sans-serif`); do not add the snapshot TTFs.
10. **Branch:** `poc/BRIEF-900-source-handoff-menu` from main. Open a PR for review only; **do not merge**.

**Likely DRs:** none (experiment). Anything not covered above → report, don't decide.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependency BRIEF-008 Done
- [x] No unresolved decision blocking the main outcome (Cursor Phase A questions answered in §7)
- [x] Exact pre-decisions; Field explicitly approved this revision in session 2026-10-10

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-10 | Created by Cowork from Cursor's Phase A report; Field approved (POC exception) |
| — | 2026-10-10 | **Outcome: POC passed** (audit PASS, Field visual check "looks clean"). PR #28 closed without merge, branch deleted. Snapshot + handoff committed on `docs/ui-design-cd06` as the worked example for cd-template v2 §6; the "do not commit" note in §2 applied to the experiment branch only. |

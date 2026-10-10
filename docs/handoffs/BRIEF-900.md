# Handoff — BRIEF-900 POC menu from the design snapshot

| | |
|---|---|
| **Implementer** | kj (Cursor) |
| **Date** | 2026-10-10 |
| **Brief revision** | 1 |
| **Branch / PR** | `poc/BRIEF-900-source-handoff-menu` · https://github.com/khaijeaw65/bar-management-system/pull/28 |
| **Commit** | `38b6a6f` |
| **Status** | Implemented — awaiting audit. **Do not merge.** |

> Experiment. The branch exists so Field can compare the page with the canvas. Delete it after that comparison.

## Summary
`/poc/menu` rebuilds the two boards from the source snapshot: four sample items, search, fixed category counts, and the no-results state. Production routes, `globals.css`, and `layout.tsx` are unchanged.

## Acceptance Criteria
| AC | Result | Evidence |
|---|---|---|
| AC-1 | ✅ | Browser on the existing dev server (`localhost:3010/poc/menu`). Computed: main 1280×min 800, padding 40/48, gap 24, search 44×radius 10, h1 34/700/1.35, eyebrow 11/600, thumb 108, four cards at 278 px. Long cocktail name wraps (`white-space: normal`, no line clamp). |
| AC-2 | ✅ | Sold-out card computed opacity 0.5. Chip fill `rgb(64, 25, 15)`, text `rgb(232, 138, 115)`, dot present. Available cards have no `หมด`. Food filter shows only ยำหมูยอ. |
| AC-3 | ✅ | Typing `มาร์การิต้า` showed the empty copy and both clear controls. The text button restored four cards with ทั้งหมด still selected. `MenuScreen.test.tsx` also clears via the in-field button and Escape, and keeps อาหาร selected. |
| AC-4 | ✅ | `MenuScreen.test.tsx`: ` ช้าง ` → 1 card, tag still shows 4; food + search combine; clear keeps the category. |
| AC-5 | ✅ | No hex in the new `.tsx`. No dependency changes. Gates below. |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/frontend lint` | 0 | pass |
| `pnpm --filter @bar/frontend typecheck` | 0 | pass |
| `pnpm --filter @bar/frontend test` | 0 | 14 passed (4 new) |
| `pnpm --filter @bar/frontend build` | 0 | `/poc/menu` static |

Sonar: not required (brief §5).

## Inferred values
- The no-results sentence inserts `query.trim()`, not the raw field text.
- `TagGroup` repeats `aria-label="หมวดเมนู"` so the grid has a name. The board labels only the `<nav>`.

## Next
`audit BRIEF-900` (Cowork). Do not merge.

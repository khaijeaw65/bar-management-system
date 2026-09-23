# Handoff — <ID> <Title>

| | |
|---|---|
| **Implementer** | <person> |
| **Date** | YYYY-MM-DD |
| **Brief revision** | <n> |
| **Branch / PR** | <branch> · PR #<n> |
| **Commit** | `<sha>` (the commit the evidence below was run on) |
| **Status** | Implemented — awaiting audit · Changes requested · Merged (frozen) |

> Created at `Implemented`. Update it if review requests changes. Frozen at merge.

## Summary
<2–4 lines: what was built.>

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `<path>::<test name>` |

## Gate Evidence (G1)
One row per gate command from the brief. Exact command, run on the commit above.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/<pkg> lint` | 0 | pass |
| `pnpm --filter @bar/<pkg> typecheck` | 0 · — | pass · **BLOCKED — script missing** |
| `pnpm --filter @bar/<pkg> test` | 0 | <n> passed · 0 failed · <n> skipped |
| `pnpm --filter @bar/<pkg> test:e2e` | 0 · — | <n> passed · 0 failed · <n> skipped · not in brief · BLOCKED |

## Decisions Raised
- <DR-### — status> (or none)

## Deviations from Brief
- None. <Any deviation must list an Approved DR.>

## Known Gaps / Follow-ups
- <proposed only — not done, not in scope>

## AI Usage
**Low · Medium · High** — <one line: tool + what for>  e.g. `Low — Cursor: explained WS reconnect, reviewed tests`

## Notes for Reviewer
- <where to look first, tricky parts>

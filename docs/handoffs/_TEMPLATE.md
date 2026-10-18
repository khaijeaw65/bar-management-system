# Handoff — <ID> <Title>

| | |
|---|---|
| **Implementer** | <person> |
| **Date** | YYYY-MM-DD |
| **Brief revision** | <n> |
| **Branch** | <branch> (PR opens after audit PASS) |
| **Commit** | `<sha>` (the commit the evidence below was run on) |
| **Status** | Implemented — awaiting audit · Changes requested · Audit PASS (merged PR determines Done) |

> Created at `Implemented` (one docs commit). Updated once in the PASS commit. Frozen at merge.

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
| run proof: stack up → `migration:run` → `start:dev` → `curl -fsS localhost:3001/api/health` | 0 · — | health 200 on the commit above · n/a (docs/tooling only) · BLOCKED |

UI exercised: <screen + action → result, or n/a>

## Sonar (local scan)
- Scanned commit: <sha> · Quality Gate: <passed / failed / not available yet>
- Issues by severity: <Blocker n · High n · Medium n · Low n · Info n> (paste `pnpm sonar:report` output)
- Remaining issues + reason: <none, or list>
- Who fixed: <developer / agent-assisted on blocker: what>

## Decisions Raised
- <DR-### — status> (or none)

## Deviations from Brief
- None. <Any deviation must list an Approved DR.>

## Known Gaps / Follow-ups
- <proposed only — not done, not in scope>

## AI Usage
**Low · Medium · High** — <one line: tool + what for>  e.g. `Low — Cursor: explained WS reconnect, reviewed tests`

## Review Routing
- Assigned auditor: <Cowork / Field-assigned Codex>
- Next command: `audit <ID>`
- Work SHA: <sha> · self-check source/contract comparison: <evidence>

## Notes for Reviewer
- <where to look first, tricky parts>

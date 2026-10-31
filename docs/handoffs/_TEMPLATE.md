# Handoff — BRIEF-### <Title>

| | |
|---|---|
| **Implementer** | <id> (<tool>) |
| **Date** | YYYY-MM-DD |
| **Brief revision** | <n> |
| **Branch** | `feat/BRIEF-###-<slug>` (PR opens after audit PASS) |
| **Commit** | `<sha>` (the commit the evidence below was produced on) |
| **Status** | Implemented — awaiting audit · Changes requested · Audit PASS (merged PR determines Done) |

> Created at Implemented (one docs commit). Updated once in the PASS commit. Frozen at merge.

## Summary
<What now works, in 3–5 lines. Facts, not effort.>

## Acceptance Criteria
| AC | Result | Evidence |
|---|---|---|
| AC-1 | ✅ / ❌ / BLOCKED | <test name, run link, file> |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/<pkg> lint` | 0 | pass |
| `pnpm --filter @bar/<pkg> typecheck` | 0 | pass |
| `pnpm --filter @bar/<pkg> test` | 0 | <n> passed · 0 failed · <n> skipped |
| `pnpm --filter @bar/<pkg> test:e2e` | 0 | <n> passed · 0 failed · <n> skipped |
| `<run proof: start/rebuild + health>` | 0 | <rebuilt from this commit · migrations applied · health 200 (mobile: installed + launched) — or not available yet> |

UI exercised: <screen + action → result, or n/a>

Not run is never pass — write BLOCKED + reason.

## Sonar (local scan)
- Scanned commit: <sha> · Quality Gate: <passed / failed>
- Issues by severity: <Blocker n · High n · Medium n · Low n · Info n> (paste `pnpm sonar:report` output)
- Remaining issues + reason: <none, or list>
- Who fixed: <developer / agent-assisted on blocker: what>

## Decisions Raised
- <DR-### — status, or none>

## Deviations from Brief
- <none, or exact deviation + approving DR>

## Known Gaps / Follow-ups
- <…>

## AI Usage
**Low / Medium / High** — <tool: what it was used for>

## Notes for Reviewer
- <where to look first>

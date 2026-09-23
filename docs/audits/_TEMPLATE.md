# Audit — <ID> <Title>

| | |
|---|---|
| **Auditor** | Cowork · Codex (cross-check) |
| **Date** | YYYY-MM-DD |
| **PR / commit** | #<n> · `<sha>` (the audited commit) |
| **Depth** | Full · Compact |
| **Brief revision** | <n> |
| **Recommendation** | PASS · PASS WITH NOTES · FAIL  ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ / ❌ | | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | | |
| No unapproved deviations / deps | | |
| `PermissionsGuard` only, no inline checks | | |
| `save()` not `update()` on audited entities | | |
| ESM `.js` imports · contracts as source of truth | | |
| Agent boundaries respected | | |

## Test Quality
<Do the tests actually assert the ACs? Anything mocked away that should be real? Missing edge cases?>

## Findings
| # | Severity | Current → Updated |
|---|---|---|
| 1 | High / Med / Low | |

## Recommendation to Field
<one paragraph>

> Compact audits: AC table + Findings + Recommendation only.
> Re-audit after changes: append `## Re-audit — <date> · <sha>` below; don't rewrite the original.

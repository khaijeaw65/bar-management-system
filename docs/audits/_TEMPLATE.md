# Audit — <ID> <Title>

| | |
|---|---|
| **Auditor** | <actual Cowork / Codex reviewer; session reference> |
| **Assignment** | <brief auditor + Field instruction/date; fallback/reassignment reason> |
| **Date** | YYYY-MM-DD |
| **PR / commit** | #<n> · `<sha>` (the audited commit) |
| **Depth** | Full · Compact |
| **Brief revision** | <n> |
| **Recommendation** | PASS · CHANGES REQUIRED · BLOCKED  ← Field makes the final call |

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
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Must fix / Suggestion | High / Med / Low | |

## Recommendation to Field
<one paragraph>

> Compact audits: retain reviewer/assignment/commit metadata and Evidence Coverage; shorten the body to AC table + Findings + Recommendation.
> Re-audit after changes: append `## Re-audit — <date> · <sha>` below; don't rewrite the original.

## Evidence Coverage
- Reviewed work SHA: <S>
- Sources/diff inspected independently: <paths, ACs>
- Tests run or independently inspected: <commands, SHA, results, limitations>
- Audit is committed after S; pre-merge summary must verify S..head contains evidence-only changes (§7).
- Repeated blocker: <attempts/evidence and decision needed, or none>

## Sonar (local scan)
- Handoff Sonar section present for the scanned commit = S (or later scan): <yes / no>
- Remaining issues have reasons; no unapproved "won't fix"/exclusions: <yes / findings>
- Learning mode respected (Methee fixed his own issues): <yes / notes>

# Audit — <ID> <Title>

| | |
|---|---|
| **Auditor** | <actual reviewer; session reference> |
| **Assignment** | <brief auditor + Field instruction/date; fallback reason> |
| **Date** | YYYY-MM-DD |
| **Branch / commit** | `<branch>` · `<sha>` (the audited commit `S`) |
| **Depth** | Full · Compact |
| **Brief revision** | <n> |
| **Recommendation** | PASS · CHANGES REQUIRED · BLOCKED  ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.
> Hard rule: an agent session that implemented, seeded, fixed, or paired on this brief must never run or write this audit.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ / ❌ | | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | | |
| Seeded `.e2e-spec.ts` files untouched by executor (`git diff <seed>..<S> -- <e2e-files>` empty) | | |
| Feature `design.md` / `requirements.md` synced if code map or contracts changed (no spec drift) | | |
| No unapproved deviations / dependencies | | |
| Locked architecture rules (`CLAUDE.md`) respected | | |
| `PermissionsGuard` only, no inline checks | | |
| `save()` not `update()` on audited entities | | |
| ESM `.js` imports · `@bar/contracts` as source of truth · OpenAPI regenerated | | |
| Scoped rule file & coding style (`docs/rules/<kind>.md` + `core.md` anti-patterns) respected | | |
| Agent boundaries respected (only Section 7 *Unlocked protected files* touched) | | |
| Runs in the real runtime — run proof from the audited SHA `S` (rebuilt, not restarted; UI exercised on the real screen, not just a 200 or a green build) | | |

## Test Quality
<Do the seeded `.e2e-spec.ts` and unit `*.spec.ts` tests pass and assert real outcomes/state without over-mocking? Missing edge cases?>

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Must fix / Suggestion | High / Med / Low | |

## Recommendation to Field
<one paragraph>

**Next → in <Executor>:** <CHANGES REQUIRED → `fix BRIEF-### (#…)` · PASS → `ship BRIEF-###` · BLOCKED → the DR or Field decision needed>

> Compact audits: keep metadata and Evidence Coverage; shorten the body to AC table + Findings + Recommendation.
> Re-audit: append `## Re-audit — <date> · <sha>` below; don't rewrite the original.

## Evidence Coverage
- Reviewed work SHA: `<S>` (seed SHA: `<seed>`)
- Sources/diff inspected independently: `<paths, ACs>`
- Tests run or inspected: `<commands, SHA, results, limitations>`
- Written uncommitted; the executor commits it unchanged at PASS (`H`). Pre-merge check (`/review`) verifies `S..H` contains evidence-only changes (workflow Section 7).

## Sonar (local scan)
- Handoff Sonar section present for the scanned commit = S (or later scan): <yes / no>
- Remaining issues have reasons; no unapproved "won't fix"/exclusions: <yes / findings>
- Learning mode respected (Metee fixed his own issues): <yes / notes>

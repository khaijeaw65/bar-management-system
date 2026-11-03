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
| Seeded `.e2e-spec.ts` untouched (`git diff <seed>..<S>` empty, or `Approved-by: Field (e2e-typo-fix)` trailer present per QA Patch 5, or legacy n/a per #54) | | |
| Feature `design.md` or living docs (`docs/api/README.md`) synced if code map or contracts changed (no spec drift #55) | | |
| No unapproved deviations / dependencies | | |
| Locked architecture rules (`CLAUDE.md`) respected | | |
| Scoped rule file & coding style (`docs/rules/<kind>.md` + `core.md` anti-patterns) respected | | |
| Agent boundaries respected (only Section 7 *Unlocked protected files* touched) | | |
| Hardened Run proof from audited SHA `S` (rebuilt; real auth request + dynamic timestamp #57; UI exercised on screen) | | |

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
- Independent CI (Grade A): `<green / gh run list --commit S / n/a>`
- Local Gates (Grade B): Verified via handoff receipt (exit codes 0)
- Run Proof (Grade B): Verified via raw HTTP response / dynamic server timestamp
- Auditor Environment: Sandboxed VM (runtime not re-run locally; verified via Grade A & B artifacts)
- Written uncommitted; the executor commits it unchanged at PASS (`H`). Pre-merge check (`pr-review`) verifies `S..H` contains evidence-only changes (workflow Section 7).

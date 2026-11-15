# Audit — BRIEF-### <Title>

| | |
|---|---|
| **Auditor** | <tool> (assigned by <source>) · **Date** YYYY-MM-DD |
| **Brief revision** | <n> · **Audited S** `<sha>` · **Lock commit** `<sha>` |
| **Flags** | <from brief — which flag checklists apply> |
| **Recommendation** | PASS · CHANGES REQUIRED · BLOCKED |

## Rows
Rows and references: `docs/rules/audit.md`. One line per row — `pass` + evidence · `fail` → finding # · `n/a` + why. Delete rows of sections that are off.

| Row | Result | Evidence (`path:line` · test name · screenshot) |
|---|---|---|
| A1 | | |
| T1 · T2 | | |
| P1 · P2 | | |
| F: <TX-1 … / SEC-… / INT-… / MIG-…> | | |
| U1 · U2 *(ui)* | | |
| R1 | | |
| D1 · D2 | | |

## Findings
Every `Must fix` cites a row **and** its reference (AC · rule ID · flag-checklist ID · `ui.md` row · brief section). No reference → it belongs in *Outside the checklist*.

| # | Row | Reference | Must fix / Suggest | `path:line` | Current → Updated |
|---|---|---|---|---|---|
| 1 | | | | | |

`Suggest` never blocks PASS.

## Outside the checklist (never blocks by itself)
| # | Type | What | `path:line` | Owner decision |
|---|---|---|---|---|
| | `taste` (not specified by the brief or the rules) · `risk` (looks like a real defect, nothing covers it) | | | `risk` only: fix now · accept · add to `docs/rules/audit.md` |

## FIX
<CHANGES REQUIRED only — the list the executor works from, nothing else: one line per `Must fix`: `#<n> [<row>] <what must be true after the fix>`.>

## Next
`Next → in <Executor>: ship BRIEF-###` · `fix BRIEF-### — audit round <n>` · BLOCKED: <DR / decision needed>

<!-- Re-audits append: ## Re-audit — YYYY-MM-DD · <new S> · round <n>
     Scope: the fixed findings + the fix commits' diff only (docs/rules/audit.md §4). -->

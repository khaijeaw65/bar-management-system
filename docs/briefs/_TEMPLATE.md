# BRIEF-### — <Title>

| | |
|---|---|
| **Owner** | Field · **Implementer** <id> (<tool>) · **Auditor** Cowork |
| **Type** | Feature · Defect · Chore |
| **Link** | `Feature: <f>` → [requirements](../features/<f>/requirements.md) · `Defect: DEFECT-###` · `standalone` (cites `docs/FRD.md` section) |
| **Status** | Draft · Ready (merged PR = Done) · **Revision** 1 |
| **Depends on** | <`BRIEF-###` — merged / not merged · or `none`> · **Unblocks** <`BRIEF-###` or `none`> |
| **Sections on** | <tokens: `e2e` `runproof` `ui` `guard` `repro`> |
| **UI** | none · small (existing screen improved: before / after screenshots, no new design) · screens (approved boards from `/new-feature` Stage 3) |
| **Run with** | build: <standard · strongest> / <low · medium · high · max> · audit: <tier> / <effort> — from workflow §4 *Model and effort* |
| **Flags** | <none · or: new pattern · concurrency/tx · money/auth/personal data · integration · migration on existing rows · unknowns> — hard flags ≤ 1 (or `owner-accepted oversize`) |

## 1. Goal
<1–2 plain lines: who gets what outcome; requirement IDs `R1..Rn` if a feature brief.>

## 2. Scope
**In:** <ACs / files / modules.> **Out:** <excluded items and where they go.>

## 3. Acceptance Criteria
| AC | When | Then |
|---|---|---|
| 1 | <trigger> | <observable result> |

## 4. Code map
| File | Owns |
|---|---|
| `<path>` | <responsibility> |

## Read list
Executor and auditor read **only these sections** of the linked files (plus this brief). Reading beyond it is allowed — note what and why in the handoff.
| File | Section / rows | Why |
|---|---|---|
| `docs/features/<f>/requirements.md` | <R ids · AC ids · Flow steps> | <ACs of this slice> |
| `docs/features/<f>/design.md` | <Contracts → `METHOD /path` · Code map rows> | <what to build against> |
| `docs/features/<f>/ui.md` *(ui)* | <screen · state rows · action-table rows> | <behaviour> |
| `docs/features/<f>/design-source/` *(ui)* | <board names> | <look> |

## 5. Gates
```bash
<lint> · <typecheck / build> · <unit> · <e2e (if e2e on)>
```

<!-- ===== Switchable sections: keep only those listed in "Sections on" ===== -->

## 6. Acceptance test plan  *(e2e · repro)*
Executor writes these at Step 0, runs them red, commits test files only as `test(BRIEF-###): acceptance (red)` — locked from then on.
| AC | Given | When | Then | File |
|---|---|---|---|---|
| 1 | <state> | <request / action> | <observable result> | `<test path>` |
*Type: Defect* → the first row is the repro from `DEFECT-###` (must fail red on current code).

## 7. Run proof  *(runproof)*
```bash
<start / rebuild> · <migrations> · <health check> · <real request on the changed path>
```
<!-- UI: name the screen + action; the executor attaches one result screenshot per screen AC (mandatory). Defect: replay the repro. Not feasible → narrow it here before Ready. -->

## 8. UI  *(ui)*
`small`: the screen, what changes, and the before screenshot (`.field-kit/proof/before-<screen>.png`, taken at Step 0). `screens`: <Screens, `ui.md` rows and design boards this brief delivers (approved snapshot only); tokens/components used. Values the boards leave open (found by the Dry Run) are Pre-decided in §9.>

## 9. Guard — unlocks and pre-decided items  *(guard)*
- **Unlocked protected files** (exact paths, or `none`):
- **Pre-decided** (exact `pkg@version`, endpoint, schema change — each with `Source: Field, <how>, <date>`):

## 10. Dry Run — walk the build steps (before Ready)
Walked by a **fresh agent that has only this brief and the repo** (what the executor will have) — §11 in order, **as if doing the work**: can each step be done, and what would it hit? One row per build step. `Ready` only when no row still has an open blocker or a value to guess.
| Step | Touches (`path:line`, or `new`) | Needs → exists? (`path:line`) | Would block / have to guess → resolved by |
|---|---|---|---|
| 0 | | | |
| 1 | | | |

*Needs* to look for at each step: schema / entity · wiring + protected file (→ §9 unlock) · `package@version` *(guard)* · contract field, error code, nullability = DB nullability · token / component / board, and every value the boards leave open *(ui)* · e2e isolation config *(e2e)* · something an **earlier step must create first** (wrong order).
*Resolved by:* Pre-decided item (§9) · **Builder's choice** (below) · new or reordered step · spec fix · owner answer · DR. Never leave a repo-readable fact as *Assumed*.

**Builder's choice** — what the executor may decide alone, inside a stated bound; each one is reported in the handoff. Never a Guard trigger (dependency, schema / contract, auth / payment / personal data, protected file) and never user-visible behaviour — those are Pre-decided or a DR.
| Item | Bound |
|---|---|
| <e.g. private helper names, file split inside the code-map folder> | <e.g. within `src/modules/visit/`, no new exports> |

Whole-brief checks (delete rows of sections that are off):
| # | Check | `path:line` evidence | Result |
|---|---|---|---|
| A | Gate scripts in §5 exist | | |
| B | Depends-on merged · no code-map overlap with briefs in flight | | |
| C | Design snapshot approved; its tokens/font match the frontend (no drift) *(ui)* | | |
| D | Run proof feasible — accounts, keys, callbacks, devices; result screenshots can be taken *(runproof · ui)* | | |
| E | Every Read list section exists and names the exact rows | | |

**Executor scan** (required when the brief has a hard flag; otherwise optional): <`scan BRIEF-###` by <tool>, YYYY-MM-DD — <n> gaps, all resolved above · or `not required — no hard flag`>

## 11. Build steps (ordered steps, never "phases" · inside → out · 1 step = 1 commit · stop after 2 failed fixes)
| # | Step | Done when |
|---|---|---|
| 0 | Verify executor *Assumed* rows · write e2e from §6 → red → lock commit *(e2e/repro)* | red assertion output in handoff |
| 1 | <step> | <check green> |
| N | Gates + run proof + sync `design.md` / living docs | all green, proof recorded |

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | YYYY-MM-DD | Initial draft |

# <Feature> — requirements

> Spec-Anchored feature requirements (`docs/features/<feature>/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Draft · Active · Built |
| **Backlog item** | <ClickUp task link or `docs/product/BACKLOG.md` item, or none> |
| **Design** | [design.md](design.md) — flow, contracts, code map |
| **UI** | [ui.md](ui.md) — screens, states, actions · owner: <member id> *(or `none — backend only`)* |
| **Briefs** | [BRIEF-###](../../briefs/BRIEF-###-<slug>.md) <one-line slice purpose> · … *(links + purpose only — status lives in the brief/PR)* |

## Why / who

<2–3 lines in plain language: who uses this, what outcome they get, and what existing behaviour it replaces (or "nothing — new").>

## Requirements

Every line must have a **Source** (who, how: verbal / interview / doc, date). Agents never invent a requirement — gaps go to *Open questions*.

| R | Requirement | Source |
|---|---|---|
| R1 | <plain-language requirement> | Field, interview, YYYY-MM-DD |
| R2 | <plain-language requirement> | Field, verbal, YYYY-MM-DD |

## Invariants

Business rules that must never break — even when another feature changes. Each one gets an index row in `docs/features/INVARIANTS.md` (name + link + what it touches) and an enforcement row in `design.md`. No enforcing test or constraint = not an invariant.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | <plain-language rule, e.g. "order price never changes after the order is placed"> | <why it matters> | Field, interview / DR-###, YYYY-MM-DD |

## Acceptance criteria

Group ACs by endpoint, screen, or user flow (one table per group). Pull shared details (e.g. cookie attributes, error codes) into `design.md → Contracts` and reference by name. State check order explicitly when multiple checks run on one route.

**`<Endpoint or Flow 1>`** (rows in check order)

| AC | When | Then | R | Brief |
|---|---|---|---|---|
| 1 | <trigger / condition> | <observable outcome> | 1 | BRIEF-### |
| 2 | <error / edge condition> | <observable error / cleanup> | 1 | BRIEF-### |

## Not handled (on purpose)

- < Deliberate exclusion — why it is out of scope now >

## Open questions

Unanswered questions stay here and block the listed brief from `Ready` — never turn an unconfirmed guess into scope.

| # | Question | Recommended | Blocks |
|---|---|---|---|
| Q1 | <question + what each choice changes> | <recommended option> | BRIEF-### |

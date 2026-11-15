# ML insight — requirements

> Spec-Anchored feature requirements (`docs/features/ml-insight/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Draft |
| **Backlog item** | DR-031 Must #8 · DR-032 (M1, M2, M4) |
| **Design** | [design.md](design.md) — As-is mapped · To-be **proposals** awaiting Field (P# in its *Open questions*) |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → ML insight |
| **UI** | not yet — CD-19 in the design plan · owner: kj |
| **Briefs** | none yet — sliced at stage 4 of `/new-feature` |
| **Sources** | DR-032 · DR-033 (`ml` task) · notes Topic 8 |

## Why / who

The advisor requires machine learning we train ourselves (no LLM). The owner gets a reorder forecast, alerts about unusual shifts and a page showing the models are healthy. Replaces DR-014 #11 (LLM owner insight, never built).

## Flow (user steps)

Business words only — no tables, columns or endpoints. Tech (`design.md`) and UI (`ui.md`, Claude Design) both read this table.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Daily job runs after the 06:00 cut-off | results stored with the run date | Job failure keeps the previous results visible with their date |
| 2 | Owner opens the reorder list | "ควรสั่ง Jameson 4 ขวดก่อนศุกร์" | Forecast per stock item per day |
| 3 | Owner opens alerts | "ยอด void กะนี้สูงกว่าค่าปกติ 3 เท่า — ควรตรวจสอบ" | Facts + "ควรตรวจสอบ"; may name the staff involved; never a ranking or score |
| 4 | Manager plans the roster | busy level per night ("ศุกร์ — ยุ่งมาก") | — |
| 5 | Owner opens ML health | last run, status, each model vs its baseline | Owner only |

## Requirements

Every line has a **Source**. Written 2026-11-15 from the approved interview notes and DRs — no new requirement.

| R | Requirement | Source |
|---|---|---|
| R1 | M1 demand forecast: usage per stock item per day → reorder hint + busy level per night on the roster; inputs weekday, payday window, holidays, no-sale days, promo, event type, tickets sold | Field, interview, 2026-11-08 (notes Topic 8 M1 · DR-032) |
| R2 | M2 anomaly: voids / comps, void after payment attempt, manual vs verified payments, cash over / short, loss per container, unmet "ยังมีของ" claims, tickets sold vs checked in → owner-only alert list, facts + "ควรตรวจสอบ"; may name staff; never a ranking or score | Field, interview, 2026-11-08 (notes Topic 8 M2 · DR-032) |
| R3 | M4 ML health page (owner only): last run, status, each model's metrics vs its baseline | Field, interview, 2026-11-08 (notes Topic 8 M4 · DR-032) |
| R4 | Sales summary = SQL report + Thai template text — no model | DR-032 |
| R5 | No LLM anywhere; explanations are Thai templates filled from the numbers | DR-032 |
| R6 | Training data = synthetic generator (with injected fraud patterns) + one public dataset; the pipeline retrains on a pilot bar's data without code changes | DR-032 Data plan |
| R7 | Daily Python batch job → Postgres (`ml_*` tables); NestJS reads the latest successful run | DR-032 Option A |

## Invariants

Business rules that must never break. Each one gets an index row in `docs/features/INVARIANTS.md` once `design.md` names its enforcing test or constraint.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | No staff ranking or score anywhere | FRD cut: staff performance analytics | DR-032 · DR-031 |

## Acceptance criteria

Written when the feature is sliced into briefs (`/new-feature` stage 4), grouped by endpoint, screen or flow.

## Not handled (on purpose)

- On-demand predictions — next daily run only (DR-032 Option A)
- Recommendations → `guest-intelligence`

## Open questions

Unanswered questions block the listed brief from `Ready`.

| # | Question | Recommended | Blocks |
|---|---|---|---|
| Q1 | Which public dataset validates the forecast | choose in `design.md` | first ML brief |

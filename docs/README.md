# Docs map — AI-Powered Bar Management System

New here? Read in this order:
1. `AGENTS.md` — project, stack, the Field Guard, hard rules.
2. `docs/FRD.md` — what the product does and which features exist.
3. `docs/rules/workflow.md` — how work flows (brief → execute → audit → PR).
4. `docs/rules/core.md` + the rule file for the app you touch.
5. The brief you are working on, and the sections its Read list names.

| Folder / file | What it is | Who writes | Read when |
|---|---|---|---|
| `FRD.md` | Product overview + feature list | Field (planning) | Starting any feature |
| `features/<f>/` | Deep spec of one feature, written in order: requirements (business) → design (tech) → ui (+ approved `design-source/` snapshot) | Planning session, Field-approved | The sections your brief's Read list names |
| `features/INVARIANTS.md` | Rules that must never break | Planning session | Planning; diff touches *Touches* |
| `briefs/` | One executable slice each | Planning session | Executing / auditing it |
| `defects/` | Every defect: log, root cause, "caught at" | Planning session | Fixing it; improving rules |
| `decisions/` | One decision each (DR) | Anyone proposes; Field decides | Before touching what it locks |
| `handoffs/` | Executor evidence per brief | Executor | Auditing |
| `audits/` | Independent review per brief | Auditor | Reviewing / merging |
| `BACKLOG.md` | Queue, follow-ups, parked work, milestones (was the state *Carry over*) | Planning session | Planning |
| `rules/` | Workflow, workspace and stack rules; `audit.md` = audit rows + flag checklists | Field (protected) | Session start / before editing |

## Living docs — update in the same PR as the change
| Doc | Owner | Update when |
|---|---|---|
| `docs/schema.sql` + `docs/erd.html` | Field (Cowork drafts, Field-approved) | Schema / migration changes |
| `docs/api/openapi.json` | generated (`openapi:export`, checked in CI) | Endpoint or DTO changes |
| `docs/infra.md` | Field | Infra changes |
| `docs/design-system.md` + `docs/design/` | Field (Claude Design) | Tokens / components change; new CD snapshot |
| `docs/BACKLOG.md` | Field / planning session | Follow-ups, parked work, milestones change |

Also: `docs/research/` (interview notes = Source for the DR-031 feature specs, re-scope), `docs/design/` (Claude Design CD briefs + handoffs + pre-Rev-24 snapshots), `docs/briefs/ui/` (screen content for built surfaces without a feature folder — retired as folders appear), `docs/quality/README.md` (SonarQube, opt-in), `docs/handoff.md` (frozen log, decisions up to 2026-09-23). Decks live in `presentation/` (local, not in Git).

## Feature folders
Built (as-built record, 2026-11-15): `ordering` · `menu` · `payments` · `pos-payment-page` · `tables-visits` · `guest-qr` · `staff-access` · `reports-dashboard` · `notifications`. Planned: `staff-order-entry` · `stock` · `purchasing` · `shift-cash-close` · `expenses-pnl` · `compliance-lock` · `events-reservations` · `ticketing` · `bottle-keep` · `ml-insight` · `guest-intelligence` · `staff-schedule` (business stage — `requirements.md`; `design.md` → `ui.md` follow per `/new-feature`).

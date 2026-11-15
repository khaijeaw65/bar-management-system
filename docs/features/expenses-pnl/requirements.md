# Expenses + P&L — requirements

> Spec-Anchored feature requirements (`docs/features/expenses-pnl/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Draft |
| **Backlog item** | DR-031 Must #4 |
| **Design** | [design.md](design.md) — As-is mapped · To-be **proposals** awaiting Field (P# in its *Open questions*) |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Expenses + P&L |
| **UI** | not yet — CD-19 in the design plan (expenses + P&L + ML insights) · owner: kj |
| **Briefs** | none yet — sliced at stage 4 of `/new-feature` |
| **Sources** | DR-031 #4 · notes Topic 4 |

## Why / who

The owner wants to see what the shop really made this month and which items earn the most — today revenue is visible, costs are not. New.

## Flow (user steps)

Business words only — no tables, columns or endpoints. Tech (`design.md`) and UI (`ui.md`, Claude Design) both read this table.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Owner records an expense | "ค่าไฟ ต.ค. ฿6,200 · หมวด ค่าน้ำค่าไฟ" | Categories are editable |
| 2 | Recurring costs appear by themselves | "ค่าเช่า ฿25,000" created on the 1st | Fixed costs auto-created monthly |
| 3 | Performer fees and supplier bills flow in | "DJ คืนศุกร์ ฿3,000" from the event · receipts from purchasing | — |
| 4 | Owner opens P&L for the month | "รายได้ ฿412,000 · ต้นทุนขาย ฿131,000 · ของเสีย/หาย ฿9,800 · กำไรขั้นต้น … · ค่าใช้จ่าย … · กำไรสุทธิ ฿61,500 · vs เดือนก่อน +8 %" | Waste and loss both subtracted; loss excludes comps / voids |
| 5 | Owner looks at margin per menu item | "Jameson highball margin 71 %" | Only items with a recipe have a cost |

## Requirements

Every line has a **Source**. Written 2026-11-15 from the approved interview notes and DRs — no new requirement.

| R | Requirement | Source |
|---|---|---|
| R1 | Editable default categories (rent, wages, utilities, performer fees, repairs, other); recurring fixed costs auto-created monthly; performer fees (events) and supplier bills (purchasing) flow in automatically | Field, interview, 2026-11-08 (notes Topic 4 E1) |
| R2 | Cost of goods sold = recipe × weighted average cost for tracked items; untracked purchases (ice, garnish) are an expense in the month bought | Field, interview, 2026-11-08 (notes Topic 4 E2) |
| R3 | P&L = revenue (after voids) − cost sold − comps (at cost) − waste (at cost) − loss (at cost) = gross profit − expenses by category = net profit; compared with last month; margin per menu item | Field, interview, 2026-11-08 (notes Topic 4 E3 · DR-031 "P&L subtracts loss") |
| R4 | Wages from payroll lite post to P&L as the wages expense when the owner marks a pay run paid | Field, interview, 2026-11-08 (notes Topic 4 E4) |

## Invariants

Business rules that must never break. Each one gets an index row in `docs/features/INVARIANTS.md` once `design.md` names its enforcing test or constraint.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | A cost is counted once: loss excludes comps / voids; waste and loss are separate lines | P&L must not double-count | Topic 4 E3 |

## Acceptance criteria

Written when the feature is sliced into briefs (`/new-feature` stage 4), grouped by endpoint, screen or flow.

## Not handled (on purpose)

- VAT, full accounting / general ledger, e-Tax invoice — cut (DR-031)
- Payroll itself → `staff-schedule`

## Open questions

Unanswered questions block the listed brief from `Ready`.

None open — functional decisions locked in the 2026-11-08 interview.

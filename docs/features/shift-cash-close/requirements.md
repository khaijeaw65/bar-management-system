# Shift & cash close — requirements

> Spec-Anchored feature requirements (`docs/features/shift-cash-close/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Draft |
| **Backlog item** | DR-031 Must #3 (builds on DR-014 #7) |
| **Design** | [design.md](design.md) — As-is mapped · To-be **proposals** awaiting Field (P# in its *Open questions*) |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Shift & cash close |
| **UI** | not yet — CD-18 slot in the design plan (shift close + roster + check-in + payroll lite) · owner: kj |
| **Briefs** | none yet — sliced at stage 4 of `/new-feature` |
| **Sources** | DR-031 #3 · DR-014 #7 · notes Topic 2 |

## Why / who

The bar closes cash by hand today; the owner cannot see expected vs counted cash or who handled the drawer. New (FRD §8 cashout superseded).

## Flow (user steps)

Business words only — no tables, columns or endpoints. Tech (`design.md`) and UI (`ui.md`, Claude Design) both read this table.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Manager opens the shift | "กะกลางคืน · เงินทอนตั้งต้น ฿2,000" | One open shift per venue at a time (one drawer) |
| 2 | Staff record a pay-in / pay-out | "จ่ายค่าน้ำแข็ง ฿150" | Every entry has a reason; adjusts expected cash |
| 3 | Manager starts closing | "ยังมีบิลค้าง 2 โต๊ะ" | Close is allowed; open tabs carry to the next shift |
| 4 | Manager counts the drawer blind | enters "฿7,840" before seeing the expected amount | Blind count |
| 5 | System shows PromptPay / transfer totals and the difference | "คาด ฿7,900 · นับได้ ฿7,840 · ขาด ฿60" | — |
| 6 | Staff tick the low-stock checklist | pre-filled from system stock | Feeds the reorder list |
| 7 | Manager reviews the summary and closes | summary locked; owner sees it on the phone | Staff not checked out are checked out at close (if staff-schedule is on) |

## Requirements

Every line has a **Source**. Written 2026-11-15 from the approved interview notes and DRs — no new requirement.

| R | Requirement | Source |
|---|---|---|
| R1 | Sequential shifts, one open at a time per venue; day / night handover works | Field, interview, 2026-11-08 (notes Topic 2 S1) |
| R2 | Pay-in / pay-out entries with a reason adjust expected cash; a cash buy "paid from drawer" creates the pay-out automatically | Field, interview, 2026-11-08 (notes Topic 2 S2) |
| R3 | One close flow: open-tab warning → blind cash count → PromptPay / transfer totals → low-stock checklist → summary → manager review | Field, interview, 2026-11-08 (notes Topic 2 S3) |
| R4 | Close is allowed with open tabs; they carry over; a payment counts in the shift that takes the money | Field, interview, 2026-11-08 (notes Topic 2 S4) |
| R5 | Three separate cut-offs: business day (06:00, accounting) · alcohol sale hours (compliance) · shift close (cash) | Field, interview, 2026-11-08 (notes Topic 2) |
| R6 | Close lists staff "ยังไม่ได้ออกงาน" and checks them out at close | Field, interview, 2026-11-08 (notes Topic 4b A4) |

## Invariants

Business rules that must never break. Each one gets an index row in `docs/features/INVARIANTS.md` once `design.md` names its enforcing test or constraint.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | Only one open shift per venue at any time | One drawer = one cash count | Topic 2 S1 |

## Acceptance criteria

Written when the feature is sliced into briefs (`/new-feature` stage 4), grouped by endpoint, screen or flow.

## Not handled (on purpose)

- Alcohol after hours — handled by `compliance-lock`, no bypass here
- Multiple drawers / multi-branch — cut

## Open questions

Unanswered questions block the listed brief from `Ready`.

None open — functional decisions locked in the 2026-11-08 interview.

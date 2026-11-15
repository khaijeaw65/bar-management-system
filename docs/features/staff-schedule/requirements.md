# Staff schedule + check-in + payroll lite — requirements

> Spec-Anchored feature requirements (`docs/features/staff-schedule/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Draft |
| **Backlog item** | DR-031 Should #10 |
| **Design** | [design.md](design.md) — As-is mapped · To-be **proposals** awaiting Field (P# in its *Open questions*) |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Staff schedule + payroll lite |
| **UI** | not yet — CD-18 slot in the design plan + CD-23 (staff app check-in) · owner: kj (POS) · methee (staff app) |
| **Briefs** | none yet — sliced at stage 4 of `/new-feature` |
| **Sources** | DR-031 #10 · notes Topic 4b, Topic 4 E4 |

## Why / who

Owners pay staff by days worked and track it on paper. A roster, a quick check-in and a simple pay run remove that — attendance for pay only. New; Should tier.

## Flow (user steps)

Business words only — no tables, columns or endpoints. Tech (`design.md`) and UI (`ui.md`, Claude Design) both read this table.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Manager makes the weekly roster | "ศ. 21 พ.ย. — บี, ซี, ดี" | Staff see it in the staff app + push reminder |
| 2 | Staff check in | scan the QR on the POS → "เข้างาน 19:58" | Rotating QR (~30 s); manager can check in for them, logged |
| 3 | Shift close | "ยังไม่ได้ออกงาน: ซี" → checked out at close | — |
| 4 | Owner runs pay | "บี 6 วัน × ฿500 + โบนัส ฿200 − เบิก ฿1,000 = ฿2,200" → จ่ายแล้ว | Owner only; posts to P&L as wages |

## Requirements

Every line has a **Source**. Written 2026-11-15 from the approved interview notes and DRs — no new requirement.

| R | Requirement | Source |
|---|---|---|
| R1 | Attendance is for pay only — no scores, no ranking (staff performance analytics stays cut) | Field, interview, 2026-11-08 (notes Topic 4b Boundary) |
| R2 | Check-in / out by scanning a rotating QR (~30 s signed code) on the POS from the staff app; fallback: manager checks staff in, logged "checked in by manager"; GPS only if the advisor asks | Field, interview, 2026-11-08 (notes Topic 4b A1, A1a, A1b) |
| R3 | Weekly roster by owner / manager; staff see it in the staff app + push reminder; no swap workflow | Field, interview, 2026-11-08 (notes Topic 4b A2) |
| R4 | Factual attendance record (scheduled vs actual), owner-only | Field, interview, 2026-11-08 (notes Topic 4b A3) |
| R5 | Missing check-out → listed at shift close and checked out there | Field, interview, 2026-11-08 (notes Topic 4b A4) |
| R6 | Payroll lite: pay profile (daily rate or monthly salary + pay period) · attendance · advances = drawer pay-out linked to staff, auto-deducted · pay run = days × rate (or salary) + manual bonus − advances → owner marks paid → wages expense; owner-only (`payroll`) | Field, interview, 2026-11-08 (notes Topic 4 E4) |

## Invariants

Business rules that must never break. Each one gets an index row in `docs/features/INVARIANTS.md` once `design.md` names its enforcing test or constraint.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | No staff score, ranking or performance view anywhere | FRD cut | Topic 4b Boundary |

## Acceptance criteria

Written when the feature is sliced into briefs (`/new-feature` stage 4), grouped by endpoint, screen or flow.

## Not handled (on purpose)

- Tax withholding, social security, OT rules, payslips, tip pooling — cut
- Shift swaps — manager edits
- GPS check-in — only if the advisor asks

## Open questions

Unanswered questions block the listed brief from `Ready`.

None open — functional decisions locked in the 2026-11-08 interview.

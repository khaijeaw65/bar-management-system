# Purchasing — requirements

> Spec-Anchored feature requirements (`docs/features/purchasing/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Draft |
| **Backlog item** | DR-031 Must #2 + Should #11 (reorder → PO) · build order steps 2, 5 |
| **Design** | [design.md](design.md) — As-is mapped · To-be **proposals** awaiting Field (P# in its *Open questions*) |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Purchasing · Reorder list → PO |
| **UI** | [ui.md](ui.md) — from CD-18 rev 1 (question — R1–R7 open) · owner: kj |
| **Briefs** | none yet — sliced at stage 4 of `/new-feature` |
| **Sources** | DR-031 #2, #11 · notes Topic 3 · CD-18 |

## Why / who

Stock must enter with its real cost so the owner sees true margins and P&L. Owners buy both from distributors (orders) and with cash at Makro / the market. New.

## Flow (user steps)

Business words only — no tables, columns or endpoints. Tech (`design.md`) and UI (`ui.md`, Claude Design) both read this table.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Owner adds a supplier and a default supplier per stock item | "ร้านเหล้าเจริญ · LINE @charoen · Jameson → เจริญ" | Owner / manager only |
| 2 | Owner creates a purchase order | "PO-012 เจริญ · Jameson 2 ลัง (= 24 ขวด)" | Order in purchase units; stock is kept in base units (1 ลัง = 12 ขวด) |
| 3 | Owner copies / shares the PO as a Thai message | message ready to paste into LINE | LINE OA auto-send is later (venue opt-in) |
| 4 | Delivery arrives; owner receives what came | "มาจริง 1 ลัง · ฿8,400 · ค้างจ่าย ครบกำหนด 30 พ.ย." | Receive what arrived; PO closes with the shortfall noted; no backorder |
| 5 | Owner buys at Makro without a PO ("ซื้อหน้าร้าน") | "โซดา 2 แพ็ค ฿180 · จ่ายจากลิ้นชัก · รูปใบเสร็จ" | Optional receipt photo; "paid from drawer" creates a pay-out in the open shift |
| 6 | Owner opens the reorder list → one tap | one draft PO per supplier | Should tier; ML forecast hint later |

## Requirements

Every line has a **Source**. Written 2026-11-15 from the approved interview notes and DRs — no new requirement.

| R | Requirement | Source |
|---|---|---|
| R1 | Owner / manager only, IAM permission `purchasing`; no approval step — permission-gated + audit log | Field, interview, 2026-11-08 (notes Topic 3 Users, P2) |
| R2 | Two intake paths: PO for distributors (order → receive) and quick "ซื้อหน้าร้าน" receipt without PO, optional receipt photo (S3) | Field, interview, 2026-11-08 (notes Topic 3 P1) |
| R3 | Receive what arrived; the PO closes with the shortfall noted; no backorder tracking | Field, interview, 2026-11-08 (notes Topic 3 P3) |
| R4 | Paid / unpaid + due date per receipt; unpaid shown on the owner dashboard; cost flows to P&L | Field, interview, 2026-11-08 (notes Topic 3 P4) |
| R5 | Purchase unit + conversion per stock item (e.g. 1 case = 12 bottles); order / receive in purchase units, stock in base units | Field, interview, 2026-11-08 (notes Topic 3 P8) |
| R6 | Cost method = weighted average cost | Field, interview, 2026-11-08 (notes Topic 3 P7 · DR-031 lock) |
| R7 | PO is sent by copy / share of a Thai message now; LINE OA auto-send + "รับทราบ" later on the same message builder (venue opt-in) | Field, interview, 2026-11-08 (notes Topic 3 P6) |
| R8 | Reorder list → one tap → one PO per supplier, using each item's default supplier (Should) | Field, interview, 2026-11-08 (notes Topic 3 P5 · DR-031 #11) |
| R9 | A cash buy marked "paid from drawer" creates the pay-out in the open shift | Field, interview, 2026-11-08 (notes Topic 2 S2) |

## Invariants

Business rules that must never break. Each one gets an index row in `docs/features/INVARIANTS.md` once `design.md` names its enforcing test or constraint.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | Stock enters only through a receipt (PO receive or cash buy) — never by editing quantity on hand | Cost and quantity must stay traceable for P&L and loss | Topic 1 Q6 |

## Acceptance criteria

Written when the feature is sliced into briefs (`/new-feature` stage 4), grouped by endpoint, screen or flow.

## Not handled (on purpose)

- PO approval, backorder tracking — rejected in the interview
- LINE OA supplier auto-send now (later, venue opt-in)
- Supplier payments through the system — only paid / unpaid status

## Open questions

Unanswered questions block the listed brief from `Ready`.

| # | Question | Recommended | Blocks |
|---|---|---|---|
| Q1 | CD-18 R1–R7 (canvas questions) | answer in the purchasing brief session | purchasing UI brief |

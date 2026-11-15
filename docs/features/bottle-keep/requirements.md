# Bottle keep — requirements

> Spec-Anchored feature requirements (`docs/features/bottle-keep/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Draft |
| **Backlog item** | DR-031 Must #7 (builds on DR-014 #9) |
| **Design** | [design.md](design.md) — As-is mapped · To-be **proposals** awaiting Field (P# in its *Open questions*) |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Bottle keep |
| **UI** | not yet — CD-22 in the design plan · owner: kj |
| **Briefs** | none yet — sliced at stage 4 of `/new-feature` |
| **Sources** | DR-031 #7 · DR-014 #9 · notes Topic 7 |

## Why / who

Regulars keep their bottle at the bar; today it is a post-it and memory, and pours from a kept bottle are easy to mix up with sales. New (FRD §11 superseded).

## Flow (user steps)

Business words only — no tables, columns or endpoints. Tech (`design.md`) and UI (`ui.md`, Claude Design) both read this table.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Bartender closes a bill that has a bottle | "ฝากขวด?" next to "Jameson 700 ml" | One tap |
| 2 | Bartender records the guest | "คุณบี · 08x-xxx-xxxx · ฝาก 15 พ.ย." | Free text if unknown; optional link to the customer profile |
| 3 | Guest returns; staff pick the bottle | pour at ฿0; mixers charged | No stock deduction; compliance lock applies |
| 4 | Owner filters bottles not touched for a while | "ไม่ได้แตะ 90 วัน" | Owner marks finished with a reason |

## Requirements

Every line has a **Source**. Written 2026-11-15 from the approved interview notes and DRs — no new requirement.

| R | Requirement | Source |
|---|---|---|
| R1 | At checkout, bottle items show "ฝากขวด?" → one tap → record linked to the order line; guest name + phone (free text if unknown), optional link to the customer profile | Field, interview, 2026-11-08 (notes Topic 7 B1) |
| R2 | No level tracking; staff may add a note ("เหลือครึ่งขวด"); the post-it stays the truth | Field, interview, 2026-11-08 (notes Topic 7 B2 · DR-014) |
| R3 | Serving from a kept bottle: pick the bottle → pour at ฿0, no stock deduction; mixers charged normally; compliance lock applies | Field, interview, 2026-11-08 (notes Topic 7 B3) |
| R4 | No expiry; "ไม่ได้แตะนาน" filter (no activity for X days) → owner marks finished with a reason | Field, interview, 2026-11-08 (notes Topic 7 B4) |

## Invariants

Business rules that must never break. Each one gets an index row in `docs/features/INVARIANTS.md` once `design.md` names its enforcing test or constraint.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | A pour from a kept bottle never deducts stock and never charges the bottle again | It was already sold | Topic 7 B3 |

## Acceptance criteria

Written when the feature is sliced into briefs (`/new-feature` stage 4), grouped by endpoint, screen or flow.

## Not handled (on purpose)

- Guest self-order from their bottle — S2
- Level tracking, expiry reminders — rejected

## Open questions

Unanswered questions block the listed brief from `Ready`.

None open — functional decisions locked in the 2026-11-08 interview.

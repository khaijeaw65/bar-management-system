# Guest intelligence — requirements

> Spec-Anchored feature requirements (`docs/features/guest-intelligence/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Draft |
| **Backlog item** | DR-031 Must #8 · DR-032 (M3) — project title "with Guest Intelligence" |
| **Design** | [design.md](design.md) — As-is mapped · To-be **proposals** awaiting Field (P# in its *Open questions*) |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Guest intelligence |
| **UI** | not yet — CD-23 (staff app) and the POS seat panel in the design plan · owner: kj (POS) · methee (staff app) |
| **Briefs** | none yet — sliced at stage 4 of `/new-feature` |
| **Sources** | DR-032 (M3, guest intelligence) · notes Topic 8 · FRD §4 |

## Why / who

Bartenders who join later do not know what regulars usually drink. When a guest is identified, staff see their preferences — never judgments. Replaces the dropped AI guest summary (FRD §10 superseded).

## Flow (user steps)

Business words only — no tables, columns or endpoints. Tech (`design.md`) and UI (`ui.md`, Claude Design) both read this table.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Owner turns guest intelligence on | "ข้อมูลลูกค้าประจำ: เปิด" | Off by default |
| 2 | A guest is attached to a seat | via QR login, staff attach at seat open, or reservation "ลูกค้ามาแล้ว" | Guest consent required |
| 3 | Bartender opens the seat panel | "สั่งประจำ: Jameson highball · แนะนำ: Negroni · แพ้ถั่ว · ขวดฝาก 1" | Preferences only; never spend |
| 4 | A new guest with no history | venue's popular items | Cold start |

## Requirements

Every line has a **Source**. Written 2026-11-15 from the approved interview notes and DRs — no new requirement.

| R | Requirement | Source |
|---|---|---|
| R1 | Shown when a guest is attached (QR login, staff attach, reservation arrival): usual order (top 3 items + modifiers), recommended items, flags (allergy, VIP), active bottle keep, staff notes — on the POS seat panel + staff app | Field, interview, 2026-11-08 (notes Topic 8 M3 · DR-032) |
| R2 | Two-layer opt-in: venue setting (default off) and the guest's PDPA consent; either off → nothing collected or shown | DR-032 · FRD §4 |
| R3 | Never shown: spend amounts or behaviour judgments | Field, interview, 2026-11-08 (notes Topic 8 M3 · DR-032) |
| R4 | Recommendations from item-based collaborative filtering on order history; cold start → venue's popular items | DR-032 M3 |
| R5 | Guest attach on the POS must be fast (search by name / phone) — counter QR is off by default | DR-032 Known risk |

## Invariants

Business rules that must never break. Each one gets an index row in `docs/features/INVARIANTS.md` once `design.md` names its enforcing test or constraint.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | Nothing about a guest is shown or stored unless both the venue setting and the guest's consent are on | PDPA | DR-032 |

## Acceptance criteria

Written when the feature is sliced into briefs (`/new-feature` stage 4), grouped by endpoint, screen or flow.

## Not handled (on purpose)

- LLM summaries — cut (DR-032)
- Spend or behaviour labels

## Open questions

Unanswered questions block the listed brief from `Ready`.

None open — functional decisions locked in the 2026-11-08 interview.

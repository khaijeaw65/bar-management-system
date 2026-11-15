# Ordering & tickets — requirements

> Spec-Anchored feature requirements (`docs/features/ordering/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.
> **As-built record (2026-11-15).** Written after the feature shipped, from the FRD, DRs, approved CDs and merged briefs — it records what was built and why; no new requirement. Field confirms it once; later briefs change it like any feature spec.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Built |
| **Backlog item** | FRD §6, §8 · core vertical (order → pay → close) |
| **Design** | [design.md](design.md) — as built |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Order queue & tickets · Comps & voids |
| **UI** | [ui.md](ui.md) · owner: kj (web) · methee (staff app queue) |
| **Briefs** | [BRIEF-012](../../briefs/BRIEF-012-orders.md) · [BRIEF-017](../../briefs/BRIEF-017-ticket-issue-flow.md) · [BRIEF-018](../../briefs/BRIEF-018-void-comp-pin.md) · [BRIEF-027](../../briefs/BRIEF-027-sold-out-auto-void.md) · [BRIEF-031](../../briefs/BRIEF-031-pos-order-entry.md) · [BRIEF-032](../../briefs/BRIEF-032-pos-orders-board.md) · [BRIEF-034](../../briefs/BRIEF-034-pos-orders-board-polish.md) · [BRIEF-042](../../briefs/BRIEF-042-order-name-snapshot.md) · [BRIEF-070](../../briefs/BRIEF-070-web-pos-void-comp.md) · [BRIEF-010](../../briefs/BRIEF-010-mobile-shell-queue.md) |

## Why / who

Staff take orders for a seat at the POS (or the guest from the QR — `guest-qr`), the bar works them as tickets, and mistakes are corrected with void / comp under manager PIN. This is the "order" part of the core slice.

## Flow (user steps)

Business words only.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Bartender opens a seated table and adds items | "T3 · 2× ช้างดราฟต์ · 1× โอลด์แฟชั่น (ก้อนใหญ่)" | Price and name are frozen at order time |
| 2 | Bartender sends | "#014" appears on the orders board as a bar ticket (and a food ticket when the kitchen screen is on) | One order number per business day; one ticket per station |
| 3 | Bar taps accept → sent | ticket moves "กำลังเตรียม" → "เสิร์ฟแล้ว" | Status per ticket, never per item |
| 4 | Item runs out mid-order | bartender marks it 86 → waiting lines auto-voided, "แจ้งลูกค้าโต๊ะ T3" | Sent tickets untouched |
| 5 | A line was wrong | void (off the bill) or comp (฿0) with reason + manager PIN | Solo self-approve is flagged |
| 6 | Problem with a ticket | flag ISSUE → resolve (substitute / remove) |  |

## Requirements

Every line cites where it was decided.

| R | Requirement | Source |
|---|---|---|
| R1 | Order = one send; numbered per business day (#001, reset at the cut-off); ticket = one station's part and owns the status; item belongs to one ticket | FRD §6 · DR-012, DR-013 |
| R2 | Status per ticket: pending → accepted → (ready) → sent, cancelled when all items cancelled; READY only with the kitchen screen; counter seats skip READY | FRD §6 · DR-011, DR-012, DR-014 |
| R3 | Kitchen screen off → one bar ticket; on → split bar / food at placement, never redone; charge items on their own ticket created as sent | FRD §6 · DR-013 |
| R4 | Line price and item / variant / option names are snapshots frozen at order time | DR-022 · FRD §9 |
| R5 | Retry with the same Idempotency-Key replays the same order; a different body with the same key is rejected | DR-017 |
| R6 | Manual 86 auto-cancels the item on tickets still waiting (pending / accepted), reason ของหมด, alert to staff; sent tickets untouched | FRD §5 · DR-014 |
| R7 | Void (off the bill) or comp (served at ฿0) per line with reason + manager PIN; solo self-approve allowed but flagged; cancelled lines stay visible | FRD §6, §8 · DR-016 |
| R8 | ISSUE branch on a ticket: substitute → accepted, remove → line cancelled, escalate → manager | FRD §6 · BRIEF-017 |
| R9 | Order card shows who ordered each line ("สั่งโดย") | FRD §6 |

## Invariants

Indexed in `docs/features/INVARIANTS.md`; enforcement in `design.md`.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | Order line price and names never change after the order is placed | A rename or price change must not rewrite past bills | DR-022 |
| I-2 | A retried send never creates a second order | Flaky networks at the bar | DR-017 |
| I-3 | Order numbers are unique per business day; one ticket per station per order | Staff call orders by number | DR-012, DR-013 |
| I-4 | A void / comp always records its kind, reason and approver (or is flagged self-approved) | Fraud control | DR-016 |

## Acceptance criteria

Delivered and verified in the merged briefs above (each brief's §3 ACs + audit). New ACs are added here by the next brief that changes this feature.

## Not handled (on purpose)

- Per-item progress (DR-012)
- Item-level bill split (FRD §14)
- Kitchen display screen `/pos/kitchen` (Later)
- Stock deduction on order — added by `stock` (DR-031)

## Open questions

None — built.

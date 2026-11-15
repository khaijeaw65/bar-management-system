# Guest QR ordering & pay — requirements

> Spec-Anchored feature requirements (`docs/features/guest-qr/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.
> **As-built record (2026-11-15).** Written after the feature shipped, from the FRD, DRs, approved CDs and merged briefs — it records what was built and why; no new requirement. Field confirms it once; later briefs change it like any feature spec.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Built |
| **Backlog item** | FRD §3, §4, §6, §7 (guest side) |
| **Design** | [design.md](design.md) — as built |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Guest QR ordering |
| **UI** | [ui.md](ui.md) · owner: kj |
| **Briefs** | [BRIEF-047](../../briefs/BRIEF-047-customer-qr-session.md) · [BRIEF-048](../../briefs/BRIEF-048-customer-order-tab-call.md) · [BRIEF-049](../../briefs/BRIEF-049-customer-order-ui.md) · [BRIEF-050](../../briefs/BRIEF-050-customer-tab-bell-live.md) · [BRIEF-051](../../briefs/BRIEF-051-pos-bell-qr-cues.md) · [BRIEF-052](../../briefs/BRIEF-052-customer-pay.md) |

## Why / who

A guest scans the table QR and orders without logging in, sees the running tab, calls staff, and can pay by PromptPay from the phone. Staff see QR orders and bells live on the POS.

## Flow (user steps)

Business words only.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Guest scans the table QR | menu loads, optional nickname "บี" | No login; cookie session |
| 2 | Guest adds items and sends | order appears on the POS ("จาก QR") | Charge items are staff-only |
| 3 | Guest opens the tab | items, total, status per ticket, cancelled struck through | Live updates |
| 4 | Guest taps the bell | POS: "T3 เรียกพนักงาน" | Staff acknowledge |
| 5 | Guest pays | amount-locked PromptPay QR → "แจ้งโอนแล้ว" | Staff verify the slip |

## Requirements

Every line cites where it was decided.

| R | Requirement | Source |
|---|---|---|
| R1 | Scan → guest session cookie (opaque token, hash stored), no login; seat-only session expires 2 h sliding, bound session lives until the visit closes | DR-028 · BRIEF-047 |
| R2 | Guest menu with availability and promo windows; nickname snapshot onto order lines | FRD §4, §6 · DR-010 · CD-06 R3 |
| R3 | Guest order opens the visit if the seat is free; charge items rejected for guests | FRD §3 · BRIEF-048 |
| R4 | Running tab: own session's items, total, status per ticket, cancelled lines struck through | FRD §6 · BRIEF-048, BRIEF-050 |
| R5 | Call staff (bell) with a reason → POS cue; staff acknowledge | FRD §6 · BRIEF-048, BRIEF-051, BRIEF-061 |
| R6 | Guest pays by amount-locked PromptPay; "แจ้งโอนแล้ว" notifies staff; cancel own attempt | FRD §7 · BRIEF-052 |
| R7 | Guest actions throttled per session / IP | BRIEF-047 |

## Invariants

Indexed in `docs/features/INVARIANTS.md`; enforcement in `design.md`.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | A guest session token is never stored in plain text | Leaked DB rows must not grant access | DR-028 |

## Acceptance criteria

Delivered and verified in the merged briefs above (each brief's §3 ACs + audit). New ACs are added here by the next brief that changes this feature.

## Not handled (on purpose)

- LINE connect + PDPA consent (FRD §4 — Planned)
- Self-cancel of an order (DEF-02, open)
- Split-equal (DR-019)

## Open questions

None — built.

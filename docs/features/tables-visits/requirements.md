# Tables, seats & visits — requirements

> Spec-Anchored feature requirements (`docs/features/tables-visits/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.
> **As-built record (2026-11-15).** Written after the feature shipped, from the FRD, DRs, approved CDs and merged briefs — it records what was built and why; no new requirement. Field confirms it once; later briefs change it like any feature spec.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Built |
| **Backlog item** | FRD §3 · core vertical |
| **Design** | [design.md](design.md) — as built |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Tables, seats & sessions |
| **UI** | [ui.md](ui.md) · owner: kj |
| **Briefs** | [BRIEF-011](../../briefs/BRIEF-011-backend-tables-visits.md) · [BRIEF-029](../../briefs/BRIEF-029-pos-floor-open-table.md) · [BRIEF-030](../../briefs/BRIEF-030-pos-session-panel-close.md) · [BRIEF-066](../../briefs/BRIEF-066-tables-admin-api.md) · [BRIEF-069](../../briefs/BRIEF-069-web-tables-admin.md) |

## Why / who

A visit (the table's session) ties to the seat, not a person: staff open it, everyone at the table orders into it, one bill, and staff close it by hand. The owner sets up tables, counter seats and their QR codes.

## Flow (user steps)

Business words only.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Bartender taps a free seat | "เปิดโต๊ะ T3 · กลุ่มคุณเอ" | One live visit per seat |
| 2 | Second device opens the same seat | joins the existing visit (attach) | First write wins |
| 3 | Table goes quiet | idle warning on the POS | Nothing closes by itself |
| 4 | Bartender closes the table | seat free again | Always manual |
| 5 | Owner adds / renames / retires seats and regenerates a QR | "T7 · โต๊ะ · QR ใหม่" | Active labels unique |

## Requirements

Every line cites where it was decided.

| R | Requirement | Source |
|---|---|---|
| R1 | Session (visit) ties to the table / seat; one seat = one live visit = one bill | FRD §3 |
| R2 | Opens by staff or by the first QR order; concurrent opens attach to the existing visit | FRD §3 · BRIEF-011 |
| R3 | Close is always manual; idle only warns | DR-014 |
| R4 | Visit records who opened it and where (`pos` / `app` / `qr`) for the join dialog | BRIEF-011 Q3 · CD-14 R9 |
| R5 | Seats are tables or counter seats; counter QR off by default | FRD §3 · DR-014 #5 |
| R6 | Owner manages seats: create, rename, order, deactivate / activate, regenerate QR (old QR invalid) | FRD §3 · BRIEF-066 |
| R7 | Staff acknowledge a guest call on the seat | BRIEF-061 |

## Invariants

Indexed in `docs/features/INVARIANTS.md`; enforcement in `design.md`.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | A seat has at most one live visit | One table = one bill | FRD §3 |
| I-2 | Active seat labels are unique | Staff call tables by label | BRIEF-066 |

## Acceptance criteria

Delivered and verified in the merged briefs above (each brief's §3 ACs + audit). New ACs are added here by the next brief that changes this feature.

## Not handled (on purpose)

- Several visits on one table (upgrade path, not Phase 1)
- Auto-close (DR-014)
- Reservations — `events-reservations`

## Open questions

None — built.

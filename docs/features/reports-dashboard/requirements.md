# Reports & dashboard — requirements

> Spec-Anchored feature requirements (`docs/features/reports-dashboard/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.
> **As-built record (2026-11-15).** Written after the feature shipped, from the FRD, DRs, approved CDs and merged briefs — it records what was built and why; no new requirement. Field confirms it once; later briefs change it like any feature spec.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Built |
| **Backlog item** | FRD §12 |
| **Design** | [design.md](design.md) — as built |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Owner / manager dashboards |
| **UI** | [ui.md](ui.md) · owner: kj |
| **Briefs** | [BRIEF-036](../../briefs/BRIEF-036-reports-api.md) · [BRIEF-037](../../briefs/BRIEF-037-dashboard-ui.md) |

## Why / who

The owner sees sales by business day, trends, top and slow items, and comps / voids by reason; the manager sees today live. P&L and ML insight build on these numbers.

## Flow (user steps)

Business words only.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Owner opens รายงาน | "วันนี้ ฿18,420 · 63 ออเดอร์" | Business day cut-off 06:00 |
| 2 | Owner switches to week / month | trend chart |  |
| 3 | Owner checks items | "ขายดี / ขายน้อย" | Slow movers need ≥ 7 days of history |
| 4 | Owner checks comps / voids | by reason | Fraud view, no staff ranking |

## Requirements

Every line cites where it was decided.

| R | Requirement | Source |
|---|---|---|
| R1 | Reports follow the venue business day (default 06:00 Asia/Bangkok) | DR-014 #4 · FRD §12 |
| R2 | Summary, daily series, items (top / slow), today live | FRD §12 · BRIEF-036 |
| R3 | Comps / voids grouped by reason; no staff performance leaderboard | FRD §12 · FRD §14 |
| R4 | Charts with the approved chart library | DR-015 |

## Invariants

Indexed in `docs/features/INVARIANTS.md`; enforcement in `design.md`.

None of its own.

## Acceptance criteria

Delivered and verified in the merged briefs above (each brief's §3 ACs + audit). New ACs are added here by the next brief that changes this feature.

## Not handled (on purpose)

- P&L — `expenses-pnl`
- Forecast / anomaly — `ml-insight`
- Staff ranking (cut)

## Open questions

None — built.

# Ordering & tickets — UI

> Screens, states and actions for `docs/features/ordering/`. Requirements: [requirements.md](requirements.md) · Design: [design.md](design.md).
> **As-built.** The approved Claude Design handoffs below hold the full Screen × State matrix, action table and strings the briefs were built from; this file indexes them and the shipped screens. A redesign writes the matrix here (kit UI stage).

| | |
|---|---|
| **Design** | `docs/design/CD-04-handoff.md` — POS — order for customer <br> `docs/design/CD-15-handoff.md` — POS — orders board + issue resolution <br> `docs/design/CD-08-handoff.md` — Staff app — login, queue, order detail, tables, more |
| **Design system** | `docs/design-system.md` + `app/frontend/src/app/globals.css` (HeroUI v3 + Tailwind v4) · staff app: HeroUI Native |
| **Approved by** | Field, per handoff front matter (pre-Rev-24 CDs) |
| **Frontend brief(s)** | BRIEF-031, BRIEF-032, BRIEF-034, BRIEF-070, BRIEF-010 |
| **UI owner** | kj (web) · methee (staff app queue) |

## Screens

| Screen | Route | Purpose |
|---|---|---|
| Order entry | `/pos/tables/[visitId]/order` | menu → options → cart → send (CD-04) |
| Orders board | `/pos/orders` | tickets by status, ISSUE resolution (CD-15) |
| Void / comp modal | `/pos/tables` session panel | reason + PIN (CD-02, CD-15) |
| Staff app queue | staff app tab ออเดอร์ | tickets + status (CD-08) |

## Screen × State matrix

See each handoff's §3 *State coverage* (matrix as approved). Deviations made during build are recorded in the briefs' handoffs.

## Action table

See each handoff's §4 *Action table*; endpoints are listed in [design.md](design.md) → Contracts.

## Design input (what goes into Claude Design)

Not needed — built. A redesign writes one block per screen here from requirements → *Flow*.

## Design source snapshot

None — these CDs were approved before source snapshots started (first snapshot: CD-14). A redesign snapshots into `design-source/`.

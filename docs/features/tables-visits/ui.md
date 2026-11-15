# Tables, seats & visits — UI

> Screens, states and actions for `docs/features/tables-visits/`. Requirements: [requirements.md](requirements.md) · Design: [design.md](design.md).
> **As-built.** The approved Claude Design handoffs below hold the full Screen × State matrix, action table and strings the briefs were built from; this file indexes them and the shipped screens. A redesign writes the matrix here (kit UI stage).

| | |
|---|---|
| **Design** | `docs/design/CD-02-handoff.md` — POS — table grid, session panel, open / close table <br> `docs/design/CD-13-handoff.md` — Back office — tables & QR, staff, groups, policies |
| **Design system** | `docs/design-system.md` + `app/frontend/src/app/globals.css` (HeroUI v3 + Tailwind v4) · staff app: HeroUI Native |
| **Approved by** | Field, per handoff front matter (pre-Rev-24 CDs) |
| **Frontend brief(s)** | BRIEF-029, BRIEF-030, BRIEF-069 |
| **UI owner** | kj |

## Screens

| Screen | Route | Purpose |
|---|---|---|
| Floor | `/pos/tables` | seat grid, open table (CD-02) |
| Session panel | `/pos/tables` (drawer) | orders, checkout, close (CD-02) |
| Tables admin | `/pos/settings/tables` | seats + QR (CD-13) |

## Screen × State matrix

See each handoff's §3 *State coverage* (matrix as approved). Deviations made during build are recorded in the briefs' handoffs.

## Action table

See each handoff's §4 *Action table*; endpoints are listed in [design.md](design.md) → Contracts.

## Design input (what goes into Claude Design)

Not needed — built. A redesign writes one block per screen here from requirements → *Flow*.

## Design source snapshot

None — these CDs were approved before source snapshots started (first snapshot: CD-14). A redesign snapshots into `design-source/`.

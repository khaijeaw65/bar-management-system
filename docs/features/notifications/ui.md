# Notifications & push — UI

> Screens, states and actions for `docs/features/notifications/`. Requirements: [requirements.md](requirements.md) · Design: [design.md](design.md).
> **As-built.** The approved Claude Design handoffs below hold the full Screen × State matrix, action table and strings the briefs were built from; this file indexes them and the shipped screens. A redesign writes the matrix here (kit UI stage).

| | |
|---|---|
| **Design** | `docs/design/CD-11-handoff.md` — Journeys + notifications end-to-end |
| **Design system** | `docs/design-system.md` + `app/frontend/src/app/globals.css` (HeroUI v3 + Tailwind v4) · staff app: HeroUI Native |
| **Approved by** | Field, per handoff front matter (pre-Rev-24 CDs) |
| **Frontend brief(s)** | BRIEF-061, BRIEF-063, BRIEF-064 |
| **UI owner** | kj (web) · methee (staff app push — BRIEF-065 open) |

## Screens

| Screen | Route | Purpose |
|---|---|---|
| POS alerts + feed | POS shell (toast, bell icon) | sound, toast, feed (CD-11) |
| Staff app push | staff app | BRIEF-065 (open) |

## Screen × State matrix

See each handoff's §3 *State coverage* (matrix as approved). Deviations made during build are recorded in the briefs' handoffs.

## Action table

See each handoff's §4 *Action table*; endpoints are listed in [design.md](design.md) → Contracts.

## Design input (what goes into Claude Design)

Not needed — built. A redesign writes one block per screen here from requirements → *Flow*.

## Design source snapshot

None — these CDs were approved before source snapshots started (first snapshot: CD-14). A redesign snapshots into `design-source/`.

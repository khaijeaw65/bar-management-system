# Menu & sold-out — UI

> Screens, states and actions for `docs/features/menu/`. Requirements: [requirements.md](requirements.md) · Design: [design.md](design.md).
> **As-built.** The approved Claude Design handoffs below hold the full Screen × State matrix, action table and strings the briefs were built from; this file indexes them and the shipped screens. A redesign writes the matrix here (kit UI stage).

| | |
|---|---|
| **Design** | `docs/design/CD-12-handoff.md` — Back office — menu management <br> `docs/design/CD-01-handoff.md` — POS — login, shell, menu list, session expired |
| **Design system** | `docs/design-system.md` + `app/frontend/src/app/globals.css` (HeroUI v3 + Tailwind v4) · staff app: HeroUI Native |
| **Approved by** | Field, per handoff front matter (pre-Rev-24 CDs) |
| **Frontend brief(s)** | BRIEF-040, BRIEF-041, BRIEF-045 |
| **UI owner** | kj |

## Screens

| Screen | Route | Purpose |
|---|---|---|
| Menu list | `/pos/menu` | items by category, 86 state (CD-12) |
| Item editor | `/pos/menu/[id]`, `/pos/menu/new` | variants, photo, groups (CD-12) |
| Modifier groups | `/pos/menu/modifiers` | groups + options (CD-12) |

## Screen × State matrix

See each handoff's §3 *State coverage* (matrix as approved). Deviations made during build are recorded in the briefs' handoffs.

## Action table

See each handoff's §4 *Action table*; endpoints are listed in [design.md](design.md) → Contracts.

## Design input (what goes into Claude Design)

Not needed — built. A redesign writes one block per screen here from requirements → *Flow*.

## Design source snapshot

None — these CDs were approved before source snapshots started (first snapshot: CD-14). A redesign snapshots into `design-source/`.

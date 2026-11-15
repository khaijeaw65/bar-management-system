# Staff access (auth + IAM) — UI

> Screens, states and actions for `docs/features/staff-access/`. Requirements: [requirements.md](requirements.md) · Design: [design.md](design.md).
> **As-built.** The approved Claude Design handoffs below hold the full Screen × State matrix, action table and strings the briefs were built from; this file indexes them and the shipped screens. A redesign writes the matrix here (kit UI stage).

| | |
|---|---|
| **Design** | `docs/design/CD-01-handoff.md` — POS — login, shell, menu list, session expired <br> `docs/design/CD-13-handoff.md` — Back office — tables & QR, staff, groups, policies |
| **Design system** | `docs/design-system.md` + `app/frontend/src/app/globals.css` (HeroUI v3 + Tailwind v4) · staff app: HeroUI Native |
| **Approved by** | Field, per handoff front matter (pre-Rev-24 CDs) |
| **Frontend brief(s)** | BRIEF-028, BRIEF-056, BRIEF-057, BRIEF-058 |
| **UI owner** | kj |

## Screens

| Screen | Route | Purpose |
|---|---|---|
| Login | `/login` | LINE login (CD-01) |
| Staff | `/pos/settings/staff`, `/pos/settings/staff/[staffId]` | members, access, PIN (CD-13) |
| Groups · policies | `/pos/settings/groups`, `/pos/settings/policies` | IAM admin (CD-13) |
| Staff app login | staff app | LINE login (CD-08) |

## Screen × State matrix

See each handoff's §3 *State coverage* (matrix as approved). Deviations made during build are recorded in the briefs' handoffs.

## Action table

See each handoff's §4 *Action table*; endpoints are listed in [design.md](design.md) → Contracts.

## Design input (what goes into Claude Design)

Not needed — built. A redesign writes one block per screen here from requirements → *Flow*.

## Design source snapshot

None — these CDs were approved before source snapshots started (first snapshot: CD-14). A redesign snapshots into `design-source/`.

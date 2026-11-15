# Guest QR ordering & pay — UI

> Screens, states and actions for `docs/features/guest-qr/`. Requirements: [requirements.md](requirements.md) · Design: [design.md](design.md).
> **As-built.** The approved Claude Design handoffs below hold the full Screen × State matrix, action table and strings the briefs were built from; this file indexes them and the shipped screens. A redesign writes the matrix here (kit UI stage).

| | |
|---|---|
| **Design** | `docs/design/CD-06-handoff.md` — Customer QR — scan → menu → cart → tab, call staff <br> `docs/design/CD-07-handoff.md` — Customer QR — pay from the phone |
| **Design system** | `docs/design-system.md` + `app/frontend/src/app/globals.css` (HeroUI v3 + Tailwind v4) · staff app: HeroUI Native |
| **Approved by** | Field, per handoff front matter (pre-Rev-24 CDs) |
| **Frontend brief(s)** | BRIEF-049, BRIEF-050, BRIEF-051, BRIEF-052 |
| **UI owner** | kj |

## Screens

| Screen | Route | Purpose |
|---|---|---|
| Scan | `/scan/[qrToken]` | start session (CD-06) |
| Menu · cart | `/customer/menu`, `/customer/cart` | order (CD-06) |
| Tab | `/customer/tab` | running tab, bell (CD-06) |
| Pay | `/customer/pay` | PromptPay (CD-07) |

## Screen × State matrix

See each handoff's §3 *State coverage* (matrix as approved). Deviations made during build are recorded in the briefs' handoffs.

## Action table

See each handoff's §4 *Action table*; endpoints are listed in [design.md](design.md) → Contracts.

## Design input (what goes into Claude Design)

Not needed — built. A redesign writes one block per screen here from requirements → *Flow*.

## Design source snapshot

None — these CDs were approved before source snapshots started (first snapshot: CD-14). A redesign snapshots into `design-source/`.

# Payments — UI

> Screens, states and actions for `docs/features/payments/`. Requirements: [requirements.md](requirements.md) · Design: [design.md](design.md).
> **As-built.** The approved Claude Design handoffs below hold the full Screen × State matrix, action table and strings the briefs were built from; this file indexes them and the shipped screens. A redesign writes the matrix here (kit UI stage).

| | |
|---|---|
| **Design** | `docs/design/CD-03-handoff.md` — POS — payment (QR, cash, manual confirm, split-equal, in-flight lock) |
| **Design system** | `docs/design-system.md` + `app/frontend/src/app/globals.css` (HeroUI v3 + Tailwind v4) · staff app: HeroUI Native |
| **Approved by** | Field, per handoff front matter (pre-Rev-24 CDs) |
| **Frontend brief(s)** | BRIEF-033 |
| **UI owner** | kj |

## Screens

| Screen | Route | Purpose |
|---|---|---|
| Checkout modal | `/pos/tables` (session panel) and `/pos/payment` | QR, slip scan, cash, manual confirm (CD-03) |
| Payment settings | `/pos/settings` | PromptPay ID, mode (CD-03 / CD-13) |

## Screen × State matrix

See each handoff's §3 *State coverage* (matrix as approved). Deviations made during build are recorded in the briefs' handoffs.

## Action table

See each handoff's §4 *Action table*; endpoints are listed in [design.md](design.md) → Contracts.

## Design input (what goes into Claude Design)

Not needed — built. A redesign writes one block per screen here from requirements → *Flow*.

## Design source snapshot

None — these CDs were approved before source snapshots started (first snapshot: CD-14). A redesign snapshots into `design-source/`.

# Compliance lock + no-alcohol day mode — requirements

> Spec-Anchored feature requirements (`docs/features/compliance-lock/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Draft |
| **Backlog item** | DR-031 Must #5 |
| **Design** | [design.md](design.md) — As-is mapped · To-be **proposals** awaiting Field (P# in its *Open questions*) |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Compliance lock |
| **UI** | not yet — CD-22 in the design plan (compliance + no-alcohol mode + bottle keep) · owner: kj |
| **Briefs** | none yet — sliced at stage 4 of `/new-feature` |
| **Sources** | DR-031 #5 · notes Topic 6 |

## Why / who

Thai alcohol law limits sale hours and bans sales on some days; today staff must remember. The POS should follow the law by itself, and on no-sale days the bar can still open as a restaurant. New.

## Flow (user steps)

Business words only — no tables, columns or endpoints. Tech (`design.md`) and UI (`ui.md`, Claude Design) both read this table.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Owner checks sale hours and the no-sale calendar | "ขายได้ 11:00–24:00 · วันงดขาย: วันมาฆบูชา …" | Defaults = current law + yearly preset; owner can edit to the licence |
| 2 | Clock passes the end of sale hours | alcohol greyed on POS / staff app with the reason; hidden on guest QR | Orders placed before the lock are still served; open tabs still paid |
| 3 | A no-sale day starts | POS banner "วันนี้งดขายแอลกอฮอล์ — โหมดร้านอาหาร"; optional "เมนูวันงดขาย" shown | No override |
| 4 | Owner creates an event on a no-sale day | warning shown | — |
| 5 | Owner compares ban-day vs normal-day revenue | report | — |

## Requirements

Every line has a **Source**. Written 2026-11-15 from the approved interview notes and DRs — no new requirement.

| R | Requirement | Source |
|---|---|---|
| R1 | Sale hours = venue setting, default current law (11:00–24:00), editable to the licence; no-sale calendar = yearly preset of major Buddhist holidays, owner can add / remove days | Field, interview, 2026-11-08 (notes Topic 6 K1) |
| R2 | Outside hours / on a no-sale day: alcohol items hidden on guest QR and greyed with the reason on POS + staff app; no override; bottle-keep serving locked too | Field, interview, 2026-11-08 (notes Topic 6 K2) |
| R3 | Orders placed before the lock are still served and open tabs still paid — the lock never cancels orders | Field, interview, 2026-11-08 (notes Topic 6 K2 · DR-031 lock) |
| R4 | No-alcohol day mode turns on by itself on no-sale days: banner, optional no-sale-day menu / mocktail promo shown that day only, warning when creating an event that day, ban-day vs normal-day revenue report | Field, interview, 2026-11-08 (notes Topic 6 K3) |
| R5 | Required alcohol flag on every menu item and modifier option (e.g. "+ shot"); one-time review list for existing items | Field, interview, 2026-11-08 (notes Topic 6 K4) |

## Invariants

Business rules that must never break. Each one gets an index row in `docs/features/INVARIANTS.md` once `design.md` names its enforcing test or constraint.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | No alcohol can be ordered outside legal hours or on a no-sale day, from any surface — no override | Legal compliance | Topic 6 K2 · DR-031 |

## Acceptance criteria

Written when the feature is sliced into briefs (`/new-feature` stage 4), grouped by endpoint, screen or flow.

## Not handled (on purpose)

- Venue licence paperwork — outside the system
- Staff override of the lock — rejected

## Open questions

Unanswered questions block the listed brief from `Ready`.

| # | Question | Recommended | Blocks |
|---|---|---|---|
| Q1 | K1 legal rules (hours, ban days, after-hours tabs) — advisor advice before building | ask the advisor first | every compliance brief |

# Ticketing — requirements

> Spec-Anchored feature requirements (`docs/features/ticketing/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Draft |
| **Backlog item** | DR-031 Should #9 |
| **Design** | [design.md](design.md) — As-is mapped · To-be **proposals** awaiting Field (P# in its *Open questions*) |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Ticketing |
| **UI** | not yet — CD-20 in the design plan · owner: kj |
| **Briefs** | none yet — sliced at stage 4 of `/new-feature` |
| **Sources** | DR-031 #9 · notes Topic 5 T1–T2 |

## Why / who

Ticketed concerts need online sales that bots cannot grab and a door check that stops copied tickets. New; Should tier — cut first if time runs short.

## Flow (user steps)

Business words only — no tables, columns or endpoints. Tech (`design.md`) and UI (`ui.md`, Claude Design) both read this table.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Guest opens the event page and buys | "ชื่อ · เบอร์ · 2 ใบ" → PromptPay QR (฿900, ถือที่ 15 นาที) | Hold expires after 15 min; capacity per event |
| 2 | Guest pays; slip is verified | e-ticket page with a QR | LINE push only if the venue enabled LINE OA |
| 3 | Staff scan the ticket at the door | "ใช้ได้" / "ใช้แล้ว" / "ผิดงาน" | One use only; fallback search by name / phone |
| 4 | Owner checks sold vs checked in | "ขาย 120 · เข้างาน 112" | — |

## Requirements

Every line has a **Source**. Written 2026-11-15 from the approved interview notes and DRs — no new requirement.

| R | Requirement | Source |
|---|---|---|
| R1 | Web-first sale: event page → name + phone + qty → amount-locked PromptPay QR → slip verify → e-ticket page with QR (+ LINE push if the venue enabled LINE OA) | Field, interview, 2026-11-08 (notes Topic 5 T1) |
| R2 | 15-min hold while paying (expiry job); capacity per event; one price + optional early-bird; refunds manual outside the system | Field, interview, 2026-11-08 (notes Topic 5 T1) |
| R3 | Anti-bot, all five: Cloudflare Turnstile before a hold (new dependency → its own DR) · Redis rate limit per IP / phone · caps per order and per phone per event · hold auto-release · payment + slip check as the final gate | Field, interview, 2026-11-08 (notes Topic 5 T1a) |
| R4 | Door: staff app scans the ticket QR → valid / already used / wrong event; one use; fallback name / phone search; report sold vs checked in | Field, interview, 2026-11-08 (notes Topic 5 T2) |

## Invariants

Business rules that must never break. Each one gets an index row in `docs/features/INVARIANTS.md` once `design.md` names its enforcing test or constraint.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | A ticket can be checked in once | Copied tickets must fail | Topic 5 T2 |
| I-2 | Tickets sold never exceed event capacity (holds included) | No overselling | Topic 5 T1 |

## Acceptance criteria

Written when the feature is sliced into briefs (`/new-feature` stage 4), grouped by endpoint, screen or flow.

## Not handled (on purpose)

- Refunds through the system — manual
- Cover charge — dropped (T3)

## Open questions

Unanswered questions block the listed brief from `Ready`.

| # | Question | Recommended | Blocks |
|---|---|---|---|
| Q1 | Turnstile dependency DR (DR-034 is taken) | raise when ticketing starts | first ticketing brief |

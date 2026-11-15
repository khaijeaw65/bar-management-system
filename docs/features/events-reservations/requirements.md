# Events + reservations — requirements

> Spec-Anchored feature requirements (`docs/features/events-reservations/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Draft |
| **Backlog item** | DR-031 Must #6 |
| **Design** | [design.md](design.md) — As-is mapped · To-be **proposals** awaiting Field (P# in its *Open questions*) |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Events + reservations |
| **UI** | not yet — CD-20 (events + CMS + public page) and CD-21 (reservations on the POS floor) in the design plan · owner: kj |
| **Briefs** | none yet — sliced at stage 4 of `/new-feature` |
| **Sources** | DR-031 #6 · notes Topic 5 |

## Why / who

Event nights and private bookings are a big part of bar revenue; the owner wants to run them, promote them and see whether each event was worth it. Bookings today live in chat. New.

## Flow (user steps)

Business words only — no tables, columns or endpoints. Tech (`design.md`) and UI (`ui.md`, Claude Design) both read this table.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Owner creates an event | "Live jazz · ศ. 21 พ.ย. 21:00 · ประเภท live / DJ · นักดนตรี ฿3,000" | Types: ticketed concert · live / DJ night · private (auto from a whole-bar booking) |
| 2 | Owner edits the public page | venue profile + upcoming events; link to share | Form-based, fixed template, no login for guests |
| 3 | Staff enter a table booking from a call / chat | "โต๊ะ 5 · คุณเอ · 4 คน · 20:00 · ปล่อย 21:00" | No deposit, no minimum spend |
| 4 | POS shows upcoming bookings | "จอง 20:00 · คุณเอ · 4 คน · ปล่อย 21:00" | Walk-ins can still be seated after a warning |
| 5 | 5 min before the booking / release time | warning to staff | No auto-release — staff extend or cancel |
| 6 | Guest arrives; staff tap "ลูกค้ามาแล้ว" | seat opens with name + headcount | Free guest attach for guest intelligence |
| 7 | Owner books the whole bar for a party | "เหมาร้าน ส. 29 พ.ย. · ค่าเหมาร้าน ฿5,000 · ยืนยันแล้ว" | Fee is separate revenue; blocks overlapping bookings and ticket sales |
| 8 | Owner looks at the event report | "ยอดคืนนี้ vs ศุกร์ปกติ +32 % · หักค่านักดนตรี" | — |

## Requirements

Every line has a **Source**. Written 2026-11-15 from the approved interview notes and DRs — no new requirement.

| R | Requirement | Source |
|---|---|---|
| R1 | Event types: ① ticketed concert · ② live / DJ night (no ticket, linked DR-010 promo) · ③ private (auto from a whole-bar booking; calendar only) | Field, interview, 2026-11-08 (notes Topic 5) |
| R2 | Event report: compared with the same weekday without an event, minus the performer fee | Field, interview, 2026-11-08 (notes Topic 5 Goal) |
| R3 | Form-based CMS: event (title, poster, description, date / time, type, ticket price + capacity, performer) + venue profile block; public page from a fixed template, no login | Field, interview, 2026-11-08 (notes Topic 5 C1, V2) |
| R4 | Table / seat bookings entered by staff; no deposit, no minimum spend; held until a release time | Field, interview, 2026-11-08 (notes Topic 5 V3, Table bookings) |
| R5 | Reservation scope = whole bar or selected tables / seats (no zones); whole bar shows "Private" on the calendar and "ปิดรับลูกค้าทั่วไป" on the public page, and blocks overlapping table bookings + ticket sales | Field, interview, 2026-11-08 (notes Topic 5 P-1) |
| R6 | Whole-bar booking fee per booking via amount-locked PromptPay + slip verify; separate revenue, not deducted from the party bill; cancel → owner chooses manual refund (recorded) or forfeit | Field, interview, 2026-11-08 (notes Topic 5 F1) |
| R7 | One host bill for the party; no minimum spend | Field, interview, 2026-11-08 (notes Topic 5 F2 / P-3) |
| R8 | No auto-release; warnings 5 min before the booking time and 5 min before the release time; staff extend or cancel; past release shows "เลยเวลาปล่อย" | Field, interview, 2026-11-08 (notes Topic 5 R1) |
| R9 | POS shows bookings from X min before (venue setting); walk-ins warned, never blocked | Field, interview, 2026-11-08 (notes Topic 5 R2) |
| R10 | "ลูกค้ามาแล้ว" opens the seat with name + headcount pre-filled | Field, interview, 2026-11-08 (notes Topic 5 R3) |
| R11 | IAM: `event:manage` (owner / manager — events, tickets, CMS, whole-bar bookings) · `reservation:write` (staff default) | Field, interview, 2026-11-08 (notes Topic 5 F3) |
| R12 | A reservation records only its own status (arrived / released / cancelled) — no per-guest no-show count | Field, interview, 2026-11-08 (notes Topic 5 Privacy) |

## Invariants

Business rules that must never break. Each one gets an index row in `docs/features/INVARIANTS.md` once `design.md` names its enforcing test or constraint.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | A whole-bar booking blocks overlapping table bookings and ticket sales for that time | No double-selling the venue | Topic 5 P-1 |

## Acceptance criteria

Written when the feature is sliced into briefs (`/new-feature` stage 4), grouped by endpoint, screen or flow.

## Not handled (on purpose)

- Ticket sales and door check-in → `ticketing` (Should)
- Guest self-booking from the public page — later
- Open bar / per-head packages, cover charge, zones — rejected
- Orders are not tagged to events (attribution = business date + event time window, DR-031)

## Open questions

Unanswered questions block the listed brief from `Ready`.

None open — functional decisions locked in the 2026-11-08 interview.

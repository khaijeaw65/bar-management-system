# DR-009 — Surface boundaries: customer web · staff app · POS web · back-office web

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Field via Cowork · 2026-10-04 |
| **Brief** | Re-plan 2026-10-04 · follows DR-008 (ownership split) |
| **Category** | Flow/Architecture |

## Context
DR-008 split ownership (Methee = Expo app, Field = backend + web). Surfaces were still blurry: CLAUDE.md planned a web `/staff` segment as well as the Expo app, FRD §2 put Bartender on "Mobile" including payments, and nothing owned order entry for the 8 Nov gate (customer QR ordering is after the gate).

## Decision rule
**Surface by context (where the person is working), access by IAM permission (who they are).** Roles are default groups, never hard-coded; every screen and action is gated by `PermissionsGuard` permissions. A user in several groups (owner who bartends) uses whichever surface fits the moment.

## Surfaces
| Surface | Route / app | Device | Context | Owner |
|---|---|---|---|---|
| Customer web | `/q/:token` (LINE OA / LIFF in S2) | guest phone, no login | ordering & paying for themselves | Field |
| Staff app | Expo `app/mobile/` | staff's own phone | moving on the floor | Methee (Field reviews) |
| POS web | `/pos` | counter tablet / desktop, **≥ 1024 px only** | fixed station | Field |
| Back-office web | `/admin` | laptop + phone (**responsive**) | managing the business | Field |

Rules: no web `/staff` (staff app is the only staff surface) · POS is not made phone-responsive · only back office is fully responsive · duplication across surfaces allowed for **read-only views** only; writes live on one surface · same backend API for all (no mobile-only endpoints).

## Roles (default groups)
| Role | Main surface | Also |
|---|---|---|
| Guest (no login) | Customer web | LINE OA (S2) |
| Waiter | Staff app | — |
| Bartender | Staff app | POS at the counter (payments, close) |
| Manager | POS + back office | Staff app (optional) |
| Owner | Back office (laptop + phone) | POS |
| Admin | Back office (setup, tables/QR, IAM) | — |

## Features per surface — **G** = 8 Nov gate · **S1** = by 20 Nov · **S2** = Semester 2
**Customer web:** QR → menu, nickname S1 · cart → order, running tab S1 · call staff S1 · pay (PromptPay merge/split-equal) S1 · PDPA consent → LINE login S2 · order-from-bottle, recommendations S2 · LINE OA (My Bottle, reminders, promos) S2.
**Staff app:** login (mocked token first, DR-005) **G** · order queue + status (pending → preparing → ready → sent, ISSUE) **G** · table/session list (read-only) S1 · push (new order, call staff, ready, idle, restock) S1 · take order (3 taps/drink) S1 · 86'd + restock request S2 · guest profile + AI summary + notes S2 · bottle keep S2 · payment handoff (show QR at table) S2. **Never on mobile:** close table, void/comp, cash, manual confirm, settings.
**POS web:** login + shell **G** · table grid + realtime **G** · open table + QR show/print **G** (regenerate S1) · session panel **G** · order for customer (CD-01 menu + cart) **G** · payment: PromptPay, cash, split, manual confirm (CD-03) **G** · close + idle **G** · void/comp + manager PIN S1 · 86'd toggle S1 · kitchen display `/pos/kitchen` S2 (optional).
**Back office:** menu mgmt S1 · tables/seats setup S1 · staff + IAM S1 · dashboards (owner money / manager action) S1 if time else S2 · inventory, cost, variance, restock queue S2 · shift cashout S2 · happy hour / promotions S2 · fraud view + audit log S2 · forget-me S2. **Gate uses seeded menu, tables and staff.**

## Notifications
| Event | Staff app | POS | Back office | Customer |
|---|---|---|---|---|
| New order | push + queue | toast + badge | — | status |
| Call staff | push | sticky toast | — | — |
| Order ready | push (waiter) | item chip | — | status |
| Payment confirmed | — | toast | feed | success |
| Idle table | push | card + alert | — | — |
| Restock / low stock | — | toast | feed | — |

## Gate demo (8 Nov)
POS: open table → order for customer → payment (PromptPay sandbox / cash) → close. Bonus if ready: staff app shows the order arriving live and marks it ready → POS item chip updates. **The core slice never depends on the staff app.**

## Refinement
This is the high-level boundary. Details found while writing briefs are added as a brief **Pre-decided** item (within these boundaries) or as an amendment to this DR (if they move a feature between surfaces or phases).

**Follow-ups:** FRD §1/§2/§13/§14 updated in this PR · CLAUDE.md "Shape" (drop web `/staff`, mobile exists, Methee = mobile) — Field edits (protected) · `docs/briefs/ui/staff-mobile.md` stale (PWA, old tokens) — reference only.

---

## Decision — Field only
**Decision:** Approved: surface boundaries as above; gate = POS full slice + staff app login + order queue.
**Why:** Context-based surfaces with permission-based access fit small bars where one person holds several roles, keep the gate independent of the staff app, and remove the duplicate web staff surface.
**Date:** 2026-10-04 · recorded by Cowork on Field's explicit instruction (planning session); Field signs off by merging the PR

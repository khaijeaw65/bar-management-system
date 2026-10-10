# CD template — what every design package contains (v1, 2026-10-10)

> Status: **v1, approved direction by Field 2026-10-10** (merged from Cowork proposal + Codex review). Pilot: CD-14. After CD-14 passes: retrofit CD-01–04, CD-08; CD-06 onward built to this.
> Board layout rules: `board-convention.md`. This file says **what** a CD must contain; the convention says **how boards look**.

A CD = **canvas** (Claude Design artifact) + **handoff** (`CD-##-handoff.md`) + **images** (`assets/CD-##/`). It is the contract for a screen: inputs, states, transitions, errors, dependencies.

Consumers: **D** developer · **A** AI agent (cannot open the canvas) · **P** presentation (advisor) · **F** Figma later (exploratory).

---

## 1. Canvas boards

| Board | Required | Contents | For |
|---|---|---|---|
| **Overview** | always, leftmost of row 1 | goal (one line) · who + context line ("Friday 22:00, one hand, dim light") · surface + sizes · entry points / exit · out of scope · pain point solved (field research) vs assumption · journeys index · status + revision | D A P |
| **Journey** | 1–2 | main path + highest-risk alternate. Rules in `board-convention.md` (one subject followed, E# steps, tap rings, legend). Must be drawn from the same markup as the States boards. | D A P |
| **States** | one per screen | only states that apply (§3), side by side, `STATES` pill | D A |
| **Flow map** | when journeys don't cover all navigation (back, cancel, cross-surface handoff) | boxes + arrows, each box names its board | D P |

Naming: board titles `CD-##/<screen>` and state labels `<n> · <state>`; design tokens only (no raw hex); dark + light via the theme tweak (no duplicated light boards).

## 2. Handoff file — fixed section order

```yaml
---
id: CD-14
title: Staff app — new order
revision: 2            # bump on any approved change
status: draft | review | approved | superseded
approved_by: Field
approved_on: 2026-10-10
canvas: https://claude.ai/artifact/…
canvas_version: <version id at approval>
ds_version: <design-system version>
surfaces: [expo-staff]          # web-pos | web-backoffice | web-customer | expo-staff
sizes: [390x844, 360x780]
brief: CD-14-staff-app-new-order.md
drs: [DR-009, DR-010]
depends_on: [CD-08, CD-04]
supersedes: brief paste text where it conflicts
---
```

| § | Section | Content |
|---|---|---|
| 0 | Review items | R# table (item, recommendation, decision). Empty when approved. |
| 1 | Overview | same facts as the Overview board, in text (agents read this, not the image) |
| 2 | Boards & images | board → states list → image path `assets/CD-##/<board>.png` |
| 3 | **State coverage** | screen × state matrix: ✓ drawn / n/a (reason) / shared (where) — see §3 below |
| 4 | **Action table** | see §4 below — the core contract |
| 5 | e2e script | J# E# → what the test asserts (from the Journey arrows) |
| 6 | Strings | exact Thai copy, grouped by screen |
| 7 | Layout & tokens | sizes, spacing, token names that matter |
| 8 | Components → platform | DS name → HeroUI (web) / HeroUI Native (Expo) → custom component path |
| 9 | Behaviour rules | rules that are not visible in a picture |
| 10 | Revisions | rev, date, change, authority (Field / DR / R#) |

**Authority rule:** once `status: approved`, the handoff wins over the brief's original paste text; the brief carries a "Revisions" table pointing here. Implementation briefs cite `CD-## rev N`. A Field OK on a CD is design approval only — code still needs a Ready brief (workflow §5).

## 3. State list (pick what applies, per screen)

| State | Applies when |
|---|---|
| default / loaded | always |
| loading (first load) | screen fetches data |
| empty | list can be empty |
| error + retry | any fetch |
| validation error | form / required choice |
| pending (action in flight, controls locked) | any submit — different from loading |
| success feedback (acknowledge < 1 s, not network completion) | any submit |
| failure per error reason | each reason in the action table |
| stale / conflict (someone else changed it) | shared data (orders, visits, menu) |
| disconnected / reconnecting | realtime screens |
| permission denied | action is permission-gated |
| long Thai text (names, notes, combining marks) | user-entered or menu text |
| smallest size | phone: 360×780 · POS: 1024×768 |
| keyboard open | screen has text input (phone) |

## 4. Action table (one row per user action)

| Action | API (status) | Permission | Success → UI | Failure reason → UI | Recovery | Data kept | Idempotency |
|---|---|---|---|---|---|---|---|
| e.g. send order | `POST /visits/:id/orders` (planned BRIEF-012) | `orders:create` | Toast + back to queue | `409 ITEM_UNAVAILABLE` (sold_out / out_of_window) → void line · network → Alert | remove line / retry | cart | key per cart, reused on retry, new after success or cart edit |

Rules: mark each API **available / planned (brief)**; never invent an endpoint — if none exists, write "needs API" and raise it. Every failure reason maps to one UI state that is drawn (§3).

## 5. User-mindset checks (tick in §9 or note why not)
- One **dominant** action per screen.
- Touch targets ≥ 44 px (primary 52); main actions in thumb reach (phone).
- Every tap acknowledged < 1 s.
- Meaningful loss (discard cart, cancel order) → confirm or undo; reversible edits don't need it.
- Every error message says how to fix it.
- Task cost stated with its assumption (e.g. "2 taps per drink, no options").
- Status never shown by colour alone (label or icon too).
- Large-text Thai checked on one board.

## 6. Evidence (not a gate per CD)
- **Images:** at approval, Field exports one PNG per board (canvas Share › Export, PNG 1x, dark) to `docs/design/assets/CD-##/`, renamed `<board>.png` (no spaces, no `@1x`), and sets `canvas_version` — agents implement from images + handoff.
- **Walkthrough:** one short run with a real or stand-in staff member per distinct flow that appears in a demo, before the final presentation. Note observed problems in §0.

## 7. Approval checklist (Field)
- [ ] Overview board + §1 match
- [ ] §3 matrix has no blank cells
- [ ] §4 every action has API status, permission, every failure drawn
- [ ] §5 checks ticked
- [ ] brief has a Revisions table if anything changed
- [ ] images exported, `canvas_version` set, `status: approved`, revision bumped

## Not included (on purpose)
Per-component redlines (the DS covers them) · copied canvas JSX · duplicated API schemas (link the brief / OpenAPI) · prototypes for every CD (only demo journeys) · light-mode duplicate boards · spacing annotations · speculative Figma integration.

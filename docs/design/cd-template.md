# CD template — what every design package contains (v2, 2026-10-10)

> Status: **v2, approved direction by Field 2026-10-10.** v1 = Cowork proposal + Codex review, piloted on CD-14. v2 adds the **source snapshot** handoff proven by the POC (`docs/design/poc-source-handoff/`, BRIEF-900): agents implement from the approved canvas source, not from images.
> Board layout rules: `board-convention.md`. This file says **what** a CD must contain; the convention says **how boards look**.

A CD = **canvas** (Claude Design artifact) + **handoff** (`CD-##-handoff.md`) + **source snapshot** (`docs/design/source/CD-##/`) + optional **images** (`assets/CD-##/`). It is the contract for a screen: inputs, states, transitions, errors, dependencies.

Consumers: **D** developer · **A** AI agent (cannot open the canvas — reads the snapshot) · **P** presentation (advisor) · **F** Figma later (exploratory).

---

## 1. Canvas boards

| Board | Required | Contents | For |
|---|---|---|---|
| **Overview** | always, leftmost of row 1 | goal (one line) · who + context line ("Friday 22:00, one hand, dim light") · surface + sizes · entry points / exit · out of scope · pain point solved (field research) vs assumption · journeys index · status + revision | D A P |
| **Journey** | 1–2 | main path + highest-risk alternate. Rules in `board-convention.md` (one subject followed, E# steps, tap rings, legend). Must be drawn from the same markup as the States boards. | D A P |
| **States** | one per screen | only states that apply (§3), side by side, `STATES` pill | D A |
| **Flow map** | when journeys don't cover all navigation (back, cancel, cross-surface handoff) | boxes + arrows, each box names its board | D P |

Naming: board titles `CD-##/<screen>` and state labels `<n> · <state>`; design tokens only (no raw hex, no raw px for type/space/radius where a token exists); dark + light via the theme tweak (no duplicated light boards). Sample data lives in each board's `renderVals()` — that data is the exact copy agents will use.

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
canvas_version: <version id the snapshot was read from>
ds_version: <design-system version copied into the canvas>
source: docs/design/source/CD-14/
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
| 1 | Overview | same facts as the Overview board, in text |
| 2 | Boards | board ID (canvas title) → snapshot file → states list → image path if exported |
| 3 | **State coverage** | screen × state matrix: ✓ drawn / n/a (reason) / shared (where) — see §3 below |
| 4 | **Action table** | see §4 below — the core contract |
| 5 | e2e script | J# E# → what the test asserts (from the Journey arrows) |
| 6 | Strings & sample data | exact Thai copy grouped by screen; point to `renderVals()` for the data |
| 7 | Layout & tokens | sizes and token names that matter; Tailwind mapping is in `app/frontend/src/app/globals.css` (BRIEF-014) |
| 8 | Components → platform | DS name → HeroUI (web) / HeroUI Native (Expo) → custom component path |
| 9 | Behaviour rules | rules a picture can't show, incl. answers to the standard questions (§5) |
| 10 | Revisions | rev, date, change, authority (Field / DR / R#) |
| 11 | **Source snapshot** | approval record, file inventory + SHA-256, dependencies, repo drift — see §6 below |

**Authority rule:** once `status: approved`, the handoff wins over the brief's original paste text; the brief carries a "Revisions" table pointing here. Where the handoff and a board disagree, the **board** wins and the implementer reports it. Implementation briefs cite `CD-## rev N`. A Field OK on a CD is design approval only — code still needs a Ready brief (workflow §5).

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

## 5. Checks before approval

### User-mindset (tick in §9 or note why not)
- One **dominant** action per screen.
- Touch targets ≥ 44 px (primary 52); main actions in thumb reach (phone).
- Every tap acknowledged < 1 s.
- Meaningful loss (discard cart, cancel order) → confirm or undo; reversible edits don't need it.
- Every error message says how to fix it.
- Task cost stated with its assumption (e.g. "2 taps per drink, no options").
- Status never shown by colour alone (label or icon too).
- Large-text Thai checked on one board.

### Standard behaviour questions (answer each in §9, or "n/a — reason")
Static boards hide these; in the POC every one came back as an implementer question.
- **Filters:** single or multi select? Can the selected one be de-selected (or does "all" stay)? Do counts change while searching?
- **Search:** trimmed? case / Thai normalisation? substring or prefix? In-field clear button and Escape-to-clear — what do they reset (query only, or filters too)?
- **Long and short:** smallest and largest window/size; what wraps, what truncates; a category or list with 0 items.
- **Interaction:** hover, pressed, focus ring, disabled; motion (duration token, press-scale yes/no).
- **Accessibility:** accessible names for groups, grids, icon-only buttons; reading order.
- **Data:** where each value comes from (API field or fixed copy); what happens when it's missing.

## 6. Source snapshot (at approval — replaces image-based handoff)

Why: the canvas source has exact tokens, copy, sample data and component props. Images lose all of that, and agents can't open the canvas. Proven in the POC: Cursor built the page from the snapshot + handoff with no screenshots and no verbal explanation.

**Steps (Cowork, after Field approves the canvas):**
1. **Pin the version.** Record `canvas` + `canvas_version` (the version the files are read from) and `ds_version` from `canvas.json`.
2. **Byte copy.** Read every canvas file at that version through the artifact service into `docs/design/source/CD-##/project/**` (boards `*.dc.html`, `canvas.json`, `ds/<namespace>/**` incl. tokens, `_ds_bundle.js`, fonts). Assets referenced as `/_blob/<id>` → `source/CD-##/blobs/<id>.<ext>`. Never retype or "clean up" a file — copy bytes.
3. **Inventory.** Handoff §11 lists every file: SHA-256, bytes, path, what it is. Verify by re-reading from the service and comparing hashes.
4. **Dependency closure.** Every `src` / `href` / `x-import` in the boards is either in the snapshot or listed as missing with the reason. `./support.js` is the editor runtime (not a file) — boards **cannot** be opened as plain HTML; they are read as text.
5. **Repo drift check.** Compare the snapshot's DS tokens with `app/frontend/src/app/globals.css` (web) / the Expo theme. Every mismatch is a blocking **D#** item in §11 with the fix (brief or DR) — not left for the implementer to discover.
6. **Images (optional).** Export PNGs to `assets/CD-##/<board>.png` only when needed for a presentation or a PR description. Agents do not need them.

**Then, for the implementation brief:**
7. **Phase A (executor, read-only).** The executor reads the snapshot + handoff and reports: component plan, gaps, source↔handoff conflicts, every value it would have to infer. Then stops.
8. **Brief.** Cowork turns each Phase A answer into a numbered **Pre-decided** item; Field approves → Ready.
9. **Phase B (build).** The executor builds and lists every inferred value in its report. Audit, then Field compares visually at the board sizes.

Rules for implementers (copy into the brief's Constraints): the canvas source is **reference, not code** — never port `<x-dc>`, `<x-import>`, `<sc-for>`, `<sc-if>`, `{{holes}}`, `DCLogic`, `support.js`, `_ds_bundle.js` or blob UMDs; rebuild with the repo stack. Read DS component implementations in `_ds_bundle.js` for exact sizes. Token → Tailwind via the `globals.css` mapping; no arbitrary px.

Size note: each snapshot repeats the DS bundle, fonts and icon UMD (~850 KB). Git stores identical file content once, so repeated copies across CDs cost almost nothing.

## 7. Evidence (not a gate per CD)
- **Walkthrough:** one short run with a real or stand-in staff member per distinct flow that appears in a demo, before the final presentation. Note observed problems in §0.

## 8. Approval checklist (Field)
- [ ] Overview board + §1 match
- [ ] §3 matrix has no blank cells
- [ ] §4 every action has API status, permission, every failure drawn
- [ ] §5 checks ticked, standard questions answered
- [ ] brief has a Revisions table if anything changed
- [ ] `status: approved`, revision bumped → then Cowork takes the snapshot (§6) and fills §11 (hashes verified, no unexplained missing dependency, drift items listed)

## Not included (on purpose)
Per-component redlines (the DS covers them) · hand-copied or retyped canvas code (the snapshot is a byte copy, reference only) · duplicated API schemas (link the brief / OpenAPI) · prototypes for every CD (only demo journeys) · light-mode duplicate boards · spacing annotations · speculative Figma integration.

## Changelog
| Ver | Date | Change |
|---|---|---|
| v1 | 2026-10-10 | Initial (Cowork + Codex), pilot CD-14 |
| v2 | 2026-10-10 | Source snapshot replaces images as the agent handoff (§6, handoff §11); images optional; standard behaviour questions; Phase A before the brief; repo drift check. Field approved. |

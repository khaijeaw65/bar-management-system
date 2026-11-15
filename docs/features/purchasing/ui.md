# Purchasing — UI

> Screens, states and actions for `docs/features/purchasing/`. Requirements: [requirements.md](requirements.md) · Design: [design.md](design.md). Every row here is an AC source for the frontend brief.
> Built from the Claude Design handoff(s) `docs/design/CD-18-handoff.md` (written before workflow Rev 24 — the CD came before `design.md`). The handoff stays the record of the canvas; this file is what briefs cite.

| | |
|---|---|
| **Design** | CD-18 rev 1 — **question** (approved_on: ) · canvas https://claude.ai/artifact/TFr5arFaRwatUC4rPnkgSB · version `1794745744-b8f6` |
| **Design system** | DS version `1791561405-c72e` (The Loft Bar Design System) · `docs/design-system.md` · web = HeroUI v3, staff app = HeroUI Native |
| **Approved by** | CD-18: approved_on: |
| **Frontend brief(s)** | none yet — purchasing brief (planned 30 Nov) |
| **UI owner** | kj |

## Overview

- **Goal:** stock enters with its real cost every time — from a PO sent to the sales rep or a cash buy — and the owner sees who is owed what.
- **User + context:** Beam (manager, `purchasing`) · afternoon before opening on a laptop (reorder → PO) · delivery day at the back door on a phone (receive) · back from Makro (cash buy).
- **Entry → exit:** rail สต็อก › จัดซื้อ › ต้องสั่ง · ใบสั่งซื้อ · รับของ / ใบเสร็จ · ผู้ขาย. Exit: stock + average cost (CD-16) · auto-86 restored · unpaid → owner dashboard / P&L (CD-22) · drawer pay-out → shift (CD-19).
- **Out of scope (D9):** LINE OA settings (CD-21) · expense categories + P&L (CD-22) · ML reorder (CD-26) · staff-app low-stock tap (CD-28) · close checklist (CD-19) · backorders (P3).
- **Journeys:** J1 reorder → 2 POs → send PO-0012 (copy) → receive with shortfall + price change + unpaid 30 days (E1–E4) · J2 Makro cash buy: 2 stock lines + ice as expense, paid from drawer (E1–E2).

## Screens (boards)

| Board | Type | States |
|---|---|---|
| `overview` | OVERVIEW | goal, pain (assumption), user, outcome, entry/exit, journeys, out of scope, decisions |
| `journey-1` | JOURNEY | reorder → PO draft → send sheet → receive shortfall → receipts + Toast |
| `journey-2` | JOURNEY | receipts → cash buy filled → receipts + Toast |
| `reorder · 1280` | STATES | 1 loaded (3 groups) · 2 loading · 3 empty · 4 error · 5 created (Toast) |
| `po` | STATES | 1 list (new drafts highlighted) · 2 sent + undo Toast · 3 draft editor · 4 validation · 5 LINE OA send (later) |
| `receive` | STATES | 1 default (received = ordered) · 2 shortfall + price change + photo · 3 validation · 4 saving · 5 1024 |
| `cash-buy` | STATES | 1 empty · 2 filled · 3 photo error · 4 drawer without open shift |
| `receipts` | STATES | 1 all · 2 unpaid filter · 3 mark paid dialog · 4 empty |
| `suppliers` | STATES | 1 list · 2 editor drawer · 3 no permission |
| `phone · 390` | STATES | reorder · send sheet (bottom sheet) · receive · cash buy |
| `flow` | FLOW MAP | PO lane · cash buy lane · paying suppliers lane |
| `Screen` | shared | screen component every board mounts (`renderVals()` = sample data) |

## Screen × State matrix

| State | Reorder | PO list | PO editor | Send | Receive | Cash buy | Receipts | Suppliers |
|---|---|---|---|---|---|---|---|---|
| default | ✓ ·1 | ✓ po·1 | ✓ po·3 | ✓ J1·3 | ✓ ·1 | ✓ ·2 | ✓ ·1 | ✓ ·1 |
| loading | ✓ ·2 | shared reorder·2 | shared | n/a | shared | n/a | shared | shared |
| empty | ✓ ·3 | **not drawn** (same pattern as receipts·4) | n/a | n/a | n/a | ✓ ·1 | ✓ ·4 | **not drawn** |
| error + retry | ✓ ·4 | shared | shared | **copy failed → not drawn** (fallback: select text) | network → Toast error (CD-16 pattern) | same | shared | shared |
| validation | n/a | n/a | ✓ po·4 | n/a | ✓ ·3 | ✓ ·4 | dialog required fields n/a | n/a (drawer, required name) |
| pending | ✓ (creating label) | n/a | n/a | n/a | ✓ ·4 | shared receive·4 | n/a | n/a |
| success feedback | ✓ ·5 | ✓ po·2 | n/a | ✓ po·2 | ✓ J1·5 | ✓ J2·3 | ✓ | n/a |
| permission denied | shared suppliers·3 | shared | shared | shared | shared | shared | shared | ✓ ·3 |
| smallest size | 390 ✓ | — | — | 390 ✓ | 1024 ✓ · 390 ✓ | 390 ✓ | — | — |

## Action table

No purchasing API yet — every row **needs API (purchasing brief, planned 30 Nov)**. Names are proposals.

| Action | API (status) | Permission | Success → UI | Failure → UI | Idempotency |
|---|---|---|---|---|---|
| reorder list | `GET /purchasing/reorder` (needs API) | `purchasing` | reorder·1 | ·4 | n/a |
| create POs from reorder | `POST /purchasing/reorder/purchase-orders {lines}` → one draft per supplier (needs API) | `purchasing` | reorder·5 Toast | network → Toast error | client key per tap |
| PO CRUD | `GET/POST/PATCH /purchasing/purchase-orders` · `DELETE` draft (needs API) | `purchasing` | po·1/3 | 400 → po·4 | n/a |
| mark sent / undo | `POST /purchasing/purchase-orders/:id/sent` · `DELETE …/sent` (needs API) — message text built client-side from the PO | `purchasing` | po·2 | retry | idempotent |
| send via LINE OA (later) | `POST /purchasing/purchase-orders/:id/send-line` (needs API, LINE OA module) | `purchasing` | "รับทราบ" status | OA not connected → copy fallback | per PO |
| receive PO | `POST /purchasing/purchase-orders/:id/receipts {lines[{received, unitCost}], payment, dueDate, photoKey}` (needs API) | `purchasing` | J1·5 | 400 → receive·3 | client key per form |
| cash buy | `POST /purchasing/receipts {shop, lines[{itemId|expense}], payment, photoKey}` (needs API) — drawer payment requires open shift (409 `NO_OPEN_SHIFT` → cash·4) | `purchasing` | J2·3 | 400 / 409 → cash·4 | client key per form |
| photo upload | presigned S3 (same as CD-12 R7 pattern) | `purchasing` | thumb | cash·3 | n/a |
| mark paid | `POST /purchasing/receipts/:id/payments {method, paidOn}` (needs API) | `purchasing` | row → จ่ายแล้ว | retry | idempotent |
| void receipt (R4) | `POST /purchasing/receipts/:id/void` (needs API) | `purchasing` | reverses stock + cost | 409 if stock already below the received qty → message | idempotent |
| suppliers | `GET/POST/PATCH /purchasing/suppliers` · `POST …/archive` (needs API) | `purchasing` | suppliers·1/2 | 400 name required | n/a |

## Messages & strings

All in `Screen.dc.html` `renderVals()` (groups, PL, PE, MSG send text, RCV / CASH, RP0, SP, TOASTS). Thai PO message template = `MSG` (greeting, venue, PO no + date, lines "ชื่อ — n หน่วยซื้อ (= n ขวด)", requested date, note, sign-off).

## Behaviour decisions

- PO lines are in purchase units; stock moves in containers (P8). Received cost = per purchase unit; average cost per container recalculated on save (P7).
- Shortfall closes the PO with a note — no backorder (P3). Receiving more than ordered: allowed, flagged "เกินที่สั่ง" (not drawn — brief decides cap).
- Receive restores auto-86 for items back above 0 (Q3). Open "ยังมีของ" claims are resolved by the receive (CD-17 override log).
- Due date default = receive date + supplier credit days; cash suppliers default to จ่ายแล้ว.
- **Standard questions:** filters single-select with counts · supplier search trimmed, substring, case-insensitive · min sizes 1024 / 390 · names truncate in tables, full in inputs · icon-only buttons have `aria-label` · status never colour only.

## Design input (what goes into Claude Design)

Already drawn — the CD brief(s) `docs/design/CD-18.md` hold the pasted input. A new version starts from requirements → *Flow* and this file, never the DB schema.

## Design source snapshot

**Not approved yet** (CD-18 status `question`, R1–R7 open). After approval, snapshot into `docs/features/purchasing/design-source/` and list the hashes here.

| File | SHA-256 |
|---|---|
| — | — |

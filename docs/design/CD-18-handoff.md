---
id: CD-18
title: Back office — suppliers · PO · receive · ซื้อหน้าร้าน · reorder → PO · copy / share
revision: 1
status: question   # parked 15 Nov — R1–R7 open; Field answers in the purchasing brief session (30 Nov)
approved_by:
approved_on:
canvas: https://claude.ai/artifact/TFr5arFaRwatUC4rPnkgSB
canvas_version: 1794745744-b8f6   # rev 1 as built; snapshot pinned at approval
ds_version: 1791561405-c72e
source: docs/design/source/CD-18/   # after approval
surfaces: [web-backoffice]
sizes: [1280x800, 1024x768, 390x844]
brief: CD-18-purchasing.md
drs: [DR-031]
depends_on: [CD-16, CD-17]
supersedes: brief paste text where they conflict
---

# CD-18 — จัดซื้อ: ต้องสั่ง · ใบสั่งซื้อ · รับของ · ซื้อหน้าร้าน · ผู้ขาย

Built on The Loft Bar Design System (real DS components; dark/light Theme tweak). **Do not port canvas markup** — HeroUI v3 + tokens. Sample data only (supplier names invented). Template `cd-template.md` v2.

## 0. Review items
| # | Item | Recommendation |
|---|---|---|
| R1 | **Pain point = สมมติฐาน** (Field 15 Nov: confirm in the brief session): order by LINE chat with the sales rep · pay on delivery or credit · cash buys with receipts in a drawer → real cost not recorded, unpaid bills remembered by hand. | Field confirms / corrects when writing the purchasing brief. |
| R2 | **Suggested qty** = refill to threshold × 2, rounded up to the purchase unit; editable; ML (CD-26) replaces it later. | Accept. |
| R3 | **Copy / share marks the PO "ส่งแล้ว"** at once, with undo in the Toast; the system can't know it was really sent. LINE OA (CD-21 opt-in) = direct send + supplier "รับทราบ". | Accept. |
| R4 | **Receipts are not editable after save** (stock + average cost already moved). Mistake → "ยกเลิกใบรับ" (reverses stock + cost) and re-enter. Payment status stays editable. | Accept. |
| R5 | **Cash buy lines** = stock item or "ค่าใช้จ่าย (ไม่นับสต็อก)" → expense categories in CD-22. Paid from drawer needs an open shift → creates a pay-out (CD-19); no shift → error with alternatives. | Accept. |
| R6 | **Prices include VAT, no VAT handling** (D8). Revisit only if the advisor or a pilot bar asks. | Accept. |
| R7 | **New IAM permission `purchasing`** (owner / manager group); suppliers archived, not deleted (CD-16 R4 pattern). IAM/seed change → brief Pre-decided item. | Accept. |

## 1. Overview
- **Goal:** stock enters with its real cost every time — from a PO sent to the sales rep or a cash buy — and the owner sees who is owed what.
- **User + context:** Beam (manager, `purchasing`) · afternoon before opening on a laptop (reorder → PO) · delivery day at the back door on a phone (receive) · back from Makro (cash buy).
- **Entry → exit:** rail สต็อก › จัดซื้อ › ต้องสั่ง · ใบสั่งซื้อ · รับของ / ใบเสร็จ · ผู้ขาย. Exit: stock + average cost (CD-16) · auto-86 restored · unpaid → owner dashboard / P&L (CD-22) · drawer pay-out → shift (CD-19).
- **Out of scope (D9):** LINE OA settings (CD-21) · expense categories + P&L (CD-22) · ML reorder (CD-26) · staff-app low-stock tap (CD-28) · close checklist (CD-19) · backorders (P3).
- **Journeys:** J1 reorder → 2 POs → send PO-0012 (copy) → receive with shortfall + price change + unpaid 30 days (E1–E4) · J2 Makro cash buy: 2 stock lines + ice as expense, paid from drawer (E1–E2).

## 2. Boards
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

## 3. State coverage
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

## 4. Action table
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

## 5. e2e script
- **J1:** E1 create from reorder → PO-0012 (3 lines, ฿23,280.00) + PO-0013 (฿7,200.00); หมูยอ (unchecked) stays · E2/E3 copy → PO-0012 status ส่งแล้ว · E4 receive: Jim Beam 1 @ ฿8,640, Bulleit 0, Jameson 1 → total ฿18,000.00, unpaid due 18 ธ.ค.; Jim Beam average cost ฿710.00 → ฿719.13; PO-0012 closed with shortfall 1 ลัง.
- **J2:** cash buy ฿720.00: หมูยอ +3 แพ็ค, น้ำเชื่อม +2 ขวด, น้ำแข็ง ฿120.00 as expense; paid from drawer → pay-out ฿720.00 in the open shift.

## 6. Strings & sample data
All in `Screen.dc.html` `renderVals()` (groups, PL, PE, MSG send text, RCV / CASH, RP0, SP, TOASTS). Thai PO message template = `MSG` (greeting, venue, PO no + date, lines "ชื่อ — n หน่วยซื้อ (= n ขวด)", requested date, note, sign-off).

## 7. Layout & tokens
CD-16 shell, Tabs → จัดซื้อ + SegmentedControl sub-nav. Receive / cash buy = lines table 1.7fr + payment card 1fr; phone single column. Send sheet = dialog 560 (desk) / bottom sheet (phone). Tokens only.

## 8. Components → platform
Tabs · SegmentedControl · Checkbox · Tag(count) · StatTile · Badge(dot) · Input(prefix/suffix) · Select · Radio(description) · Alert · Toast(action) · DataTable(loading) → HeroUI v3 equivalents (StatTile = DS custom). Drawer, dialogs and photo drop zone drawn from tokens (DS gap, CD-12 R8). **Toast without an action must pass `action` null** (CD-17 rev 2 bug).

## 9. Behaviour rules
- PO lines are in purchase units; stock moves in containers (P8). Received cost = per purchase unit; average cost per container recalculated on save (P7).
- Shortfall closes the PO with a note — no backorder (P3). Receiving more than ordered: allowed, flagged "เกินที่สั่ง" (not drawn — brief decides cap).
- Receive restores auto-86 for items back above 0 (Q3). Open "ยังมีของ" claims are resolved by the receive (CD-17 override log).
- Due date default = receive date + supplier credit days; cash suppliers default to จ่ายแล้ว.
- **Standard questions:** filters single-select with counts · supplier search trimmed, substring, case-insensitive · min sizes 1024 / 390 · names truncate in tables, full in inputs · icon-only buttons have `aria-label` · status never colour only.

## 10. Revisions
| Rev | Date | Change | Authority |
|---|---|---|---|
| 1 | 2026-11-15 | Canvas built (12 boards + shared Screen) · parked as **question** (R1–R7 open) | locked P1–P8; Field 15 Nov |

## 11. Source snapshot
After Field approval (cd-template §6).

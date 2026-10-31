# BRIEF-060 — Staff app: order detail + report / resolve issue (M4)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-31 (in session) |
| **Implementer** | metee (learning mode — writes ≥ 70 % himself; agent ≤ 20 %, workflow §8) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **PR** | <executor fills> |
| **Affected apps** | mobile |
| **Revision** | 1 |
| **Depends on** | **BRIEF-059 merged** (real queue, `nextAction`, socket, 409 handling) |
| **References** | `docs/design/CD-08-handoff.md` (detail·1–14, issue·1–4, J2, R12, queue·11, §6 Strings) · DR-012, DR-013, DR-014 #3 (sold-out auto-cancel) · BRIEF-017 (issue flow API) · BRIEF-027 (sold-out auto-void) · `docs/rules/mobile.md` |
| **Audit depth** | Full (writes order state) |
| **Size** | ~10 h (evenings) |

---

## 1. Goal
Staff tap a card to see the whole ticket, and when something is wrong (out of stock, broken blender) they report it from the phone, then either fix it themselves ("แก้แล้ว ทำต่อ") or hand it to the POS ("ส่งให้ POS"). When the POS or the system cancels an item, the phone tells them which table to inform.

## 2. Scope
### In
- **Detail screen** `src/app/ticket/[ticketId].tsx` (stack route over the tabs), opened by tapping a card (outside its button):
  - Data from the queue cache; not in cache (e.g. just sent) → `GET /orders/:orderId` (route param) and pick the ticket → loading detail·7, not found / network → Alert + ลองอีกครั้ง.
  - Header "#0044" + seat line (M3 rule, station only when split) + status chip; "n รายการ · m ชิ้น" (cancelled excluded).
  - Lines in entry order: "2× ช้างดราฟต์ · {variantName}", modifiers, notes, orderedByName. Cancelled lines struck with "ยกเลิกโดย POS {เวลา} · {สาเหตุ}" (`cancellation.system=false`) or "ยกเลิก · ของหมด (อัตโนมัติ)" (`system=true`).
  - Footer: the M3 `nextAction` button + secondary "รายงานปัญหา" for pending / accepted / ready. Sent → "เสิร์ฟเมื่อ 20:41 น. · ไม่มีการทำงานต่อ", no buttons. Read-only → no buttons + "บัญชีนี้ดูได้อย่างเดียว — ให้ผู้จัดการตรวจสิทธิ์".
  - List scrolls under a fixed back bar and footer, 120 px bottom padding (detail·13–14).
- **Report issue sheet** (issue·1–4): สาเหตุ = ของหมด · อุปกรณ์มีปัญหา · อื่นๆ (`out_of_stock | equipment | other`); "รายการที่มีปัญหา (ไม่บังคับ)" = one of the non-cancelled lines; "รายละเอียด" (≤ 500). อื่นๆ without detail → field error "กรอกรายละเอียดเมื่อเลือก อื่นๆ", nothing sent. Submit → `POST /tickets/:id/flag-issue` → sheet closes, chip มีปัญหา, Alert "{item} · {reason}". 409 / network → sheet stays open with its input, Toast as M3.
- **Issue state** (J2 E4): Alert "มีปัญหากับออเดอร์นี้" + two buttons "แก้แล้ว ทำต่อ" (`resolve {substitute}` → กำลังเตรียม) and "ส่งให้ POS" (`resolve {escalate}` → badge "ส่งให้ POS แล้ว", only "แก้แล้ว ทำต่อ" left) + hint "การลบหรือยกเลิกรายการทำที่ POS". `issue.escalatedAt` set → escalated view.
- **Queue card for `issue` tickets:** button "ดูปัญหา" → detail (replaces M3's no-button).
- **Change notices** — one pure function `changeNotices(before: TicketList, after: TicketList)` run after every queue refetch:
  - a line newly cancelled with `cancellation.system=true` → warning Toast "แจ้งลูกค้าโต๊ะ {seat}" / "{item} · ของหมด (อัตโนมัติ)" (queue·11, DR-014 #3);
  - a ticket that was `issue` + escalated and is now `accepted` → info Toast "POS แก้ #{n} แล้ว" / "{item} ถูกยกเลิก — แจ้งลูกค้าโต๊ะ {seat}" (R12; without a newly cancelled line: "POS แก้ #{n} แล้ว" only).
  First load (no `before`) → no notices.

### Out (do NOT build here)
- Cancelling / voiding / substituting items on the phone (POS only — "การลบหรือยกเลิกรายการทำที่ POS").
- Tables tab + table summary, new order (CD-14), menu availability (M5), push (M6).
- Any change to `app/backend`, `app/frontend`, `app/packages/contracts`.

## 3. Contract
Built by BRIEF-012 / BRIEF-017 / BRIEF-027 — consume, don't change.
| Call | Permission | Body / returns |
|---|---|---|
| `GET /orders/:id` | `orders:read` | `Order` (all its tickets) |
| `POST /tickets/:id/flag-issue` | `orders:update_status` | `FlagIssueRequestSchema` `{ reason, itemId?, note? }` (note required for `other`) → `Ticket` · from pending / accepted / ready only |
| `POST /tickets/:id/resolve` | `orders:update_status` | `ResolveIssueRequestSchema` `{ resolution: substitute \| escalate, note? }` → `Ticket` · escalate twice → 409 "ใบงานนี้ส่งให้ POS แล้ว" |
| WS `ticket.status_changed` | — | already handled by M3 (refetch) |
- **Contracts changes:** none. Validate the sheet with `FlagIssueRequestSchema` (same rule as the server).

## 4. Acceptance Criteria
- **AC-1** — Given a queue card, when tapped outside its button, then detail opens with header, seat line, chip, "n รายการ · m ชิ้น" (cancelled excluded) and every line in entry order; the card button still acts without opening detail.
- **AC-2** — Given a ticket not in the queue cache, then detail calls `GET /orders/:orderId` once and shows that ticket; given a network error, then the Alert with "ลองอีกครั้ง" shows and retries.
- **AC-3** — Given cancelled lines, then a POS cancel shows "ยกเลิกโดย POS {เวลา} · {สาเหตุ}" and a system cancel shows "ยกเลิก · ของหมด (อัตโนมัติ)", both struck.
- **AC-4** — Given a sent ticket, then the footer shows "เสิร์ฟเมื่อ {เวลา} น. · ไม่มีการทำงานต่อ" and no buttons; given no `orders:update_status`, then no buttons and the read-only notice.
- **AC-5** — Given the sheet with อื่นๆ and empty detail, when submitted, then the field error shows and **no** request is sent; given ของหมด + one line, then exactly one `flag-issue` `{ reason: 'out_of_stock', itemId }` is sent and the Alert "{item} · ของหมด" shows.
- **AC-6** — Given an issue ticket, when "ส่งให้ POS", then one `resolve {escalate}`, badge "ส่งให้ POS แล้ว", only "แก้แล้ว ทำต่อ" remains; when "แก้แล้ว ทำต่อ", then one `resolve {substitute}` and chip กำลังเตรียม.
- **AC-7** — Given a 409 or network error on flag / resolve, then the sheet / buttons keep their input and state, and the M3 Toast rules apply.
- **AC-8** — `changeNotices`: (a) newly system-cancelled line → one warning Toast naming seat + item; (b) escalated issue → accepted with a newly cancelled line → one info Toast "POS แก้ #n แล้ว" naming item + seat; (c) first load → none; (d) the same refetch twice → no duplicate Toast. Unit-tested with fixture pairs.
- **AC-9** — Given an `issue` card in the queue, then it shows "ดูปัญหา" which opens detail.
- **AC-10 (real device)** — J2 on the dev stack: phone reports ของหมด on a line → POS board shows the issue → phone "ส่งให้ POS" → POS cancels the item (BRIEF-017/018 flow) → phone shows กำลังเตรียม, struck line, info Toast. Then set a menu item sold out on POS with a waiting order → phone warning Toast "แจ้งลูกค้าโต๊ะ …". Screen recording in the handoff.
- **AC-11** — Gates pass; mocks mode runs the whole flow (mock flag / resolve update the mock store).

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1–AC-4, AC-9 | component | `src/__tests__/app/ticket-detail.test.tsx` |
| AC-5–AC-7 | component | `src/__tests__/app/issue-sheet.test.tsx` |
| AC-8 | unit | `src/__tests__/lib/tickets/change-notices.test.ts` |
| AC-10 | manual | screen recording in the handoff |
| AC-11 | command | gates + `EXPO_PUBLIC_USE_MOCKS=1` smoke |

Gate commands (all must pass):
```bash
pnpm --filter @bar/mobile lint
pnpm --filter @bar/mobile typecheck
pnpm --filter @bar/mobile test
pnpm --filter @bar/mobile export:check
```
A required script that doesn't exist yet = **BLOCKED** — report it, never skip silently.

### Local Sonar scan
- Required: yes (always for Metee). Approved exclusions: none.

## 6. Constraints
- `docs/rules/mobile.md` throughout; HeroUI Native first (BottomSheet / Dialog, RadioGroup, TextField, Alert, Chip).
- Copy exactly as CD-08 handoff §6 (Strings); if §2 differs, CD-08 §6 wins.
- `changeNotices` is pure and is the only place that decides these Toasts.
- **Learning mode:** Metee writes the sheet validation, `changeNotices` and all tests himself. Handoff: AI usage Low / Medium / High + what for.
- **G3 walkthrough topic (suggested):** how `changeNotices` avoids duplicate Toasts when two refetches return the same data.

## 7. Decision Points (Field Guard)
- **Pre-decided:** no new package (HeroUI Native sheet/dialog; if missing, a `Modal` from React Native is fine). Detail route `ticket/[ticketId]` with `orderId` as a search param.
- **Likely DRs:** HeroUI Native has no bottom sheet that works with the keyboard on Android → tell Field before adding a sheet package.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions (BRIEF-059 merged)
- [x] No unresolved decision blocking the main outcome
- [x] Field explicitly approved this revision (2026-10-31, in session)

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-31 | Initial Draft (Cowork) — M4 per Field's split (detail + issue separate from M3) |
| 1 | 2026-10-31 | Ready — Rev 1 approved by Field in session ("approve 059 Rev 2 and 060 Rev 1") |

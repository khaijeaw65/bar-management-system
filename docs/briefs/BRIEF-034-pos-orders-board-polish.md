# BRIEF-034 — Web POS: orders board polish (BRIEF-032 audit notes)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-22 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | frontend |
| **Revision** | 1 |
| **Depends on** | **BRIEF-032 merged** (#75) ✅ |
| **References** | `docs/audits/BRIEF-032.md` Findings 1–4 · CD-15 (board·1, issue·1, §9) · BRIEF-017 (`?escalated`) |
| **Audit depth** | Compact (UI) |
| **Size** | ~0.5 day · est. ~150–250 net-new lines incl. tests |

---

## 1. Goal
Close the four BRIEF-032 audit notes so the orders board is clean before the 8 Nov gate: valid card markup, a spinner per tapped card, one socket subscription, and the issue column showing what Field decides (Q1).

## 2. Scope
### In
- **N1 — card markup (`TicketCard.tsx`):** the open `<button>` holds only phrasing content. Lines render as `<span className="block">` (or the list moves outside the button and the button keeps the header row). Visual result unchanged; accessible name stays "ดูรายละเอียด #n {seat}".
- **N2 — per-card pending (`useTicketActions.ts`):** track in-flight ticket ids in a `Set` (add on mutate, remove on settle) instead of one shared `pendingId`, so tapping card A then card B keeps both spinners until each answer arrives; a card's button is pending only while its own request runs. 409 / error handling unchanged.
- **N3 — one socket subscription:** `order.created` / `ticket.status_changed` / `ticket.issue_escalated` invalidation for `['tickets','board']` is registered once per page (e.g. a `useTicketBoardEvents()` called once in the POS layout, or a subscribe-once guard), not in every `useTicketBoard()` caller. Board + rail still read the same query; stale-payload skip kept.
- **N4 — issue column = escalated issues only (Q1 = A):** the มีปัญหา column shows `issue` tickets with `issue.escalatedAt` set — via `GET /tickets?status=issue&escalated=true` merged with the other statuses, or a client-side filter on the same board query (executor's choice; one query key, no contract change). Non-escalated issues stay off the POS board; the rail Badge is unaffected (pending only).

### Out (do NOT build here)
- Any new board feature, kitchen-on 1024×768 strip (CD-15 R6), void / replace (BRIEF-018), backend or contracts changes.

## 3. Contract
- **Endpoints:** unchanged (`GET /tickets` — `escalated` query param exists, BRIEF-017). **Contracts changes:** none. **Packages:** none.
- **Business rules:** unchanged from BRIEF-032 (no optimistic moves; 409 → Toast + refetch).

## 4. Acceptance Criteria
- **AC-1** — A card's lines are not inside the button element (DOM test); the card looks the same (screenshot in handoff).
- **AC-2** — Accept on card A, then on card B before A answers: both buttons show pending; A's button stops pending only when A's request settles (test with delayed MSW responses).
- **AC-3** — With the board page open (rail + board mounted), one `ticket.status_changed` event causes exactly one `GET /tickets` refetch (test counts requests).
- **AC-4** — With one escalated and one non-escalated `issue` ticket, only the escalated one appears in มีปัญหา and in its summary-chip count.
- **AC-5** — BRIEF-032 tests still pass; gates pass; Sonar: no open issue in changed files.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1 | component | `src/app/pos/orders/_components/TicketCard.test.tsx` |
| AC-2, AC-3, AC-4 | component | `src/app/pos/orders/_components/OrdersBoard.test.tsx` |

Gate commands (all must pass):
```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend test:e2e
pnpm --filter @bar/frontend build
```
Run proof: BRIEF-032 run proof repeated once (tab 1 order → tab 2 board live → รับออเดอร์ → เสิร์ฟแล้ว), plus two quick taps on two cards. Screenshot in the handoff.

### Local Sonar scan
- **Required for this brief: yes** (UI brief). Same procedure as BRIEF-032.

## 6. Constraints
- Behaviour visible to staff stays the same except the spinners (N2) and the issue column (N4).
- `frontend.md` Hard Limits; tokens only.

## 7. Decision Points (Field Guard)
- **Q1 — Which issues show in มีปัญหา on the POS? ✅ Decided (Field, 2026-10-22): A — escalated only.** Today the board shows every `issue` ticket, including ones the staff app flagged but has **not escalated** (staff may still fix them on the floor).
  - *Cowork recommends:* **A — escalated only** (`GET /tickets?status=issue&escalated=true` merged with the other statuses, or filter client-side on `issue.escalatedAt`). Matches CD-15 ("ส่งมาจากแอปพนักงาน") and avoids the POS acting on something staff are already handling.
  - *Alternative:* **B — all issues, badge "ยังไม่ส่งต่อ" on non-escalated cards** — POS sees everything, more noise.
  - *Alternative:* **C — keep as is** (no change; N4 dropped).
- **Pre-decided:** paths in §2 · no new packages · query key `['tickets','board']` unchanged.
- **Likely DRs:** none expected.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-22 | Initial Draft (Cowork) — from BRIEF-032 audit Findings 1–4 (Field: "add four notes" → new polish brief) |
| 1 | 2026-10-22 | Ready — Field in session: "034 Q1 = A, approve BRIEF-034 Rev 1 Ready" |

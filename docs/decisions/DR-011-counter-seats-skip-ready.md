# DR-011 — Counter seats skip READY

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Field via Cowork · 2026-10-10 |
| **Brief** | none yet — found in CD-08 review (R15); affects BRIEF-012 (orders), CD-08, CD-15 |
| **Category** | Flow/Architecture |

## Context
FRD §6 has `PENDING → ACCEPTED → READY → SENT`. READY means "made, waiting at the pass for a runner". At a counter seat the bartender who makes the drink hands it straight to the guest — there is no pass and no runner, so READY is an extra tap that carries no information.

## Options
**A) Same 3 steps everywhere** — one rule / an empty tap on every counter order; at peak it gets skipped or tapped late.
**B) Counter seats (`table_seat.kind = counter`) go `ACCEPTED → SENT` in one tap; tables keep all steps** — matches the real handover / one extra allowed transition, checked server side by seat kind.

## Recommendation
B. The status follows what really happens at the counter, and fewer taps keeps the staff app faster than walking to the POS.

---

## Decision — Field only
**Decision:** Approved: B — counter seats `accepted → sent` (READY skipped); tables keep รับแล้ว → พร้อมแล้ว → เสิร์ฟแล้ว. The server allows `accepted → sent` only when the ticket's seat is `counter`.
**Why:** No pass or runner at the counter; READY there is a wasted tap (CD-08 R15).
**Date:** 2026-10-10

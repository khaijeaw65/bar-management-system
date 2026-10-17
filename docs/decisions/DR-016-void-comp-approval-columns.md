# DR-016 — Void / comp on `order_item`: kind + approver columns

| | |
|---|---|
| **Status** | Pending |
| **Raised by** | Field via Cowork · 2026-10-17 |
| **Brief** | BRIEF-017 (void / comp + PIN, issue flow, sold-out) |
| **Category** | Data · Sensitive (fraud controls, FRD §8) |

## Context
FRD §8: every comp / void needs a reason, a manager PIN, and a solo self-approve that is "heavily flagged for owner review". DR-014 #11 builds anomaly alerts on "voids/comps by reason and person". `schema.sql` (DR-013) has `order_item.cancelled_at / cancelled_by / cancel_reason / cancel_note` only:
1. **No comp.** A comp keeps the item (it was served) at ฿0; a void removes it. Nothing records which one happened.
2. **No approver.** `cancelled_by` is the person who pressed the button; the manager whose PIN approved it, or the fact that nobody did, is not stored.
3. **System cancels** (sold-out auto-cancel, DR-014 #3) need to be told apart from staff actions.
4. `audit_log` is not migrated yet; the order row is where the AI insight SQL will look first.

## Options
**A) Reuse the cancel columns + 2 new columns** (recommended)
```sql
CREATE TYPE item_adjustment AS ENUM ('void', 'comp');
ALTER TABLE order_item
  ADD COLUMN cancel_kind  item_adjustment,                    -- NULL = active line
  ADD COLUMN approved_by  UUID REFERENCES staff_user(id);     -- PIN approver; NULL = no approver
-- rules (CHECK): cancel_kind IS NULL  ⇔ cancelled_at IS NULL
-- reading:   cancelled_by NULL                     → system (sold-out auto-cancel)
--            cancelled_by set, approved_by set      → approved by PIN
--            cancelled_by set, approved_by NULL     → self-approved — flagged
```
*Pros:* +1 enum, +2 columns; one "adjusted line" concept for totals, reports and AI queries. *Cons:* `cancelled_*` also describes a comp — the column names read as "void only"; needs a schema comment and a mapper that exposes `adjustment: { kind, at, by, approvedBy, reason, note }` instead of raw names.

**B) Separate comp columns** — `comped_at`, `comped_by`, `comp_reason`, `comp_note`, plus `void_approved_by`, `comp_approved_by`.
*Pros:* names say exactly what happened. *Cons:* +6 columns, two parallel paths for totals and reports, a line could be both voided and comped unless another CHECK forbids it.

## Recommendation
**A.** One adjusted-line model is simpler for totals (`cancel_kind IS NULL` = billable at full price; `comp` = ฿0; `void` = off the bill) and for the anomaly SQL. The naming risk is handled by a schema comment and the API shape (`adjustment.kind`), so the confusion stays out of the client.

---

## Decision — Field only
**Decision:** <Approved: A · Approved: B · Rejected · Approved with change: …>
**Why:**
**Date:**

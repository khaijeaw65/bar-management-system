# DEF-07 — Missing POS Order & Item Void / Cancel Capability

| | |
|---|---|
| **Defect ID** | DEF-07 |
| **Status** | Open |
| **Surface** | Web POS (`app/frontend`) |
| **Severity** | Critical (Operational Flow) |
| **Discovered** | 2026-11-01 (Hands-on test for Demo) |

---

## 1. Summary
When an order mistake occurs (e.g., customer changes their mind, wrong table selected, accidental double entry), the POS interface provides no mechanism for staff or managers to cancel, void, or comp an order item.

## 2. Current Behavior
- Orders sent to the kitchen/bar station cannot be cancelled or removed from the bill by staff.
- Once placed, the bill accumulates all items without recourse.

## 3. Expected Behavior
- Staff/Manager should be able to select an item on the active session or order ticket and initiate a **Void** (remove from bill with reason) or **Comp** (free with reason).
- For fraud control, voiding/comping should require a Manager 4-digit POS PIN (or flagged self-approval if solo manager).
- Voided items should remain visible in audit logs and station tickets marked as cancelled.

## 4. Context & Planned Resolution
- **Backend Spec:** Pre-drafted in **`BRIEF-018`** (`feat/BRIEF-018-void-comp-pin`) following **DR-016**.
- **Frontend Spec Needed:** A dedicated Web brief for the Void/Comp modal on the POS tables & orders screens.

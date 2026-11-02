# DEF-15 — Order Lifecycle Conflict: Early Payment & Cancellation vs Kitchen Acceptance

| | |
|---|---|
| **Defect ID** | DEF-15 |
| **Status** | Open (Architecture / Flow Analysis) |
| **Surface** | System Flow (Customer Pay / Kitchen Ticket / Order Adjustment) |
| **Severity** | High (Edge Case / Operational Integrity) |
| **Discovered** | 2026-11-02 (Hands-on test for Demo) |

---

## 1. Summary
In counter bars, customers may pay their bill immediately after ordering (via PromptPay QR on mobile), before the bartender or kitchen accepts (`accept` / `preparing`) or serves (`sent`) the ticket. This creates lifecycle edge cases between order fulfillment and billing.

## 2. Identified Conflicts

### A. Pre-Service Payment Locking Adjustments
- While a customer PromptPay QR is pending, the bill is locked. Attempting to void or comp an item on POS throws `409 PAYMENT_IN_FLIGHT`.
- If the bartender discovers an item is out of stock after the guest already opened the payment QR, the ticket cannot be adjusted until the guest cancels the QR attempt.

### B. Void After Completed Payment
- If a customer completes PromptPay payment immediately, but the bar subsequently marks the item as out of stock / issue, the system currently prevents voids after full payment because `paid > total`.
- Requires the post-payment comp/refund reconciliation flow (noted in `SESSION_STATE.md` carry-over line 35 for BRIEF-018).

### C. Self-Cancellation Race Condition
- A guest should only be allowed to self-cancel an order while the ticket status is strictly `pending`.
- Once the kitchen/bar moves the status to `preparing` or `sent`, customer-side cancellation must be blocked to prevent waste.

## 3. Recommended Rules for Execution
1. Allow bar ticket status progression (`pending` → `preparing` → `ready` → `sent`) independently of payment status.
2. Restrict guest self-cancel strictly to tickets in `pending` status.
3. When payment is completed, adjustments must transition to manager-approved `comp` or cash refund rather than silent invoice voiding.

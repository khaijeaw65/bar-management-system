# DEF-02 — No Customer-Side Cancel Order Option

| | |
|---|---|
| **Defect ID** | DEF-02 |
| **Status** | Open |
| **Surface** | Customer Web (`app/frontend/src/app/customer`) |
| **Severity** | High (Flow / UX) |
| **Discovered** | 2026-11-01 (Hands-on test for Demo) |

---

## 1. Summary
After a customer submits an order from their mobile browser, there is no option or button to cancel the order, even if placed by mistake seconds earlier.

## 2. Current Behavior
- Customer submits cart → order enters system.
- Customer order tracker displays status, but provides no "Cancel Order" (ยกเลิกออเดอร์) option.

## 3. Expected Behavior
- Customer should be able to cancel an order within a grace window or while ticket status is strictly `pending`.
- Once the kitchen/bar moves the ticket status to `preparing` (กำลังเตรียม), self-cancel should lock with a note: *"เครื่องดื่มกำลังจัดเตรียม หากต้องการยกเลิกกรุณาแจ้งพนักงานโดยตรง"*.

## 4. Suggested Fix
- Add a cancel order API endpoint/mutation for guest sessions under ticket `pending` state.
- Render a cancel button in the customer order tracking view when eligible.

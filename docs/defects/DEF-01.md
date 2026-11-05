# DEF-01 — Toast "ดูออเดอร์" Should Open Order Details Drawer

| | |
|---|---|
| **Defect ID** | DEF-01 |
| **Status** | Open |
| **Surface** | Web POS (`app/frontend`) |
| **Severity** | Medium (UX) |
| **Discovered** | 2026-11-01 (Hands-on test for Demo) |

---

## 1. Summary
When a new order arrives, the POS receives a notification toast with a **"ดูออเดอร์"** (View Order) button. Tapping this button on the orders page currently does not open the specific order's detail sidebar/drawer, leaving staff having to manually hunt for the new order card in the list.

## 2. Current Behavior
- Tapping "ดูออเดอร์" navigates to `/pos/orders` (or keeps the user there if already on the page), but does not select or open the order drawer for that specific incoming order ticket.

## 3. Expected Behavior
- Tapping "ดูออเดอร์" should directly set `selectedOrderId` to open the order detail drawer/sidebar immediately.
- If staff is on `/pos/tables`, it should either open the Table Session Drawer for that table or open the Order Sheet directly.

## 4. Suggested Fix
- Pass the `orderId` payload inside the toast notification action.
- Wire the button onClick to trigger the state that opens the order drawer for that `orderId`.

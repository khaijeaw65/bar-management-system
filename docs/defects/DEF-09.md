# DEF-09 — Empty Cart Flash on Order Submit Before Redirect

| | |
|---|---|
| **Defect ID** | DEF-09 |
| **Status** | Open |
| **Surface** | Customer Web (`app/frontend/src/app/customer/cart`) |
| **Severity** | Low (Visual Polish / UX) |
| **Discovered** | 2026-11-02 (Hands-on test for Demo) |

---

## 1. Summary
When a customer submits their order from the cart screen, the cart state is immediately reset to empty before the Next.js router redirect to the table bill (`/customer/tab`) finishes. This causes the UI to briefly flash the empty cart screen (*"ตะกร้ายังว่าง"*) for 100–300 milliseconds.

## 2. Current Behavior
- In `useSendOrder.ts`, `onSuccess` calls `dispatch({ type: "reset" })` immediately before calling `router.replace("/customer/tab")`.
- Because client route navigation is asynchronous, `CartScreen` re-renders with `state.lines.length === 0`, flashing the empty cart illustration and button before transitioning to `/customer/tab`.

## 3. Expected Behavior
- The transition from cart submission to `/customer/tab` should be visually seamless without flashing the empty cart message.

## 4. Suggested Fix
- Maintain a local submitting/transitioning state, or only reset cart lines upon unmounting/navigating away, or display a brief success/redirect loader instead of the empty cart view while `router.replace` resolves.

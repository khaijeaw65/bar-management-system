# DEF-11 — POS Settings Payment Radio Button Label Stacked Underneath

| | |
|---|---|
| **Defect ID** | DEF-11 |
| **Status** | Open |
| **Surface** | Web POS (`app/frontend/src/app/pos/settings`) |
| **Severity** | Low (Visual Alignment) |
| **Discovered** | 2026-11-02 (Hands-on test for Demo) |

---

## 1. Summary
Under the "การชำระเงิน" section of the POS Settings page (`/pos/settings`), the label for the payment options (e.g., "PromptPay ของร้าน", "Gateway") renders underneath the radio button circle instead of horizontally beside it.

## 2. Current Behavior
- `<Radio>` in `PaymentSection.tsx` lacks horizontal flex layout styling, causing the radio indicator (`<Radio.Control>`) and text label (`<Radio.Content>`) to stack vertically.

## 3. Expected Behavior
- The label should be aligned horizontally to the right/side of the radio button circle (`flex items-center gap-2`).

## 4. Suggested Fix
- Add `className="flex items-center gap-2.5"` or flex-row styling to the `<Radio>` wrappers in `PaymentSection.tsx`.

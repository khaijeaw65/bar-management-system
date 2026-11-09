# DEF-14 — Void/Comp Dialog Item Details Card Has No Gap Above Action Radios

| | |
|---|---|
| **Defect ID** | DEF-14 |
| **Status** | Open |
| **Surface** | Web POS (`app/frontend/src/app/pos/tables/_components/VoidCompModal.tsx`) |
| **Severity** | Low (Visual Polish / Spacing) |
| **Discovered** | 2026-11-02 (Hands-on test for Demo) |

---

## 1. Summary
In the "ยกเลิกรายการ / Comp" modal, the item details card (showing item name, variant, and price) is flush against the top edge of the action selector buttons ("ยกเลิก" / "Comp ฟรี") with 0px spacing.

## 2. Evidence
- Screenshot attached showing the dark grey item card directly touching the border of the radio buttons below it.

## 3. Root Cause
- In `VoidCompModal.tsx`, the item details `div` sits outside the `<div className="flex flex-col gap-4">` container and has no bottom margin.

## 4. Suggested Fix
- Move the item details container inside `<div className="flex flex-col gap-4">` or add `mb-3` / `mb-4` to the item card.

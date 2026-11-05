# DEF-10 — POS Settings "QR ที่เคาน์เตอร์" Switch Does Nothing After Click

| | |
|---|---|
| **Defect ID** | DEF-10 |
| **Status** | Open |
| **Surface** | Web POS (`app/frontend/src/app/pos/settings`) |
| **Severity** | Medium (UX / Interaction) |
| **Discovered** | 2026-11-02 (Hands-on test for Demo) |

---

## 1. Summary
On the POS Settings page (`/pos/settings`), clicking the switch for **"QR ที่เคาน์เตอร์"** (Counter QR) under the "การทำงาน" section does not toggle or provides no visual feedback.

## 2. Current Behavior
- Tapping or clicking the switch element fails to toggle the switch thumb, or the interaction is intercepted/unresponsive.

## 3. Expected Behavior
- Clicking either the switch thumb or its label/description should immediately toggle the state.
- Form should mark as dirty and enable the "บันทึก" (Save) button.

## 4. Suggested Fix
- Verify HeroUI `<Switch>` event props in `SettingSwitch.tsx` (`onChange` vs `onSelectionChange`). Ensure click target covers both the control and content, and that state updates propagate to `draft.counterQrEnabled`.

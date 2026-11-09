# DEF-03 — Staff Call Toast Missing Inline "รับทราบ" (Acknowledge) Button

| | |
|---|---|
| **Defect ID** | DEF-03 |
| **Status** | Open |
| **Surface** | Web POS (`app/frontend`) |
| **Severity** | Medium (Touchscreen UX) |
| **Discovered** | 2026-11-01 (Hands-on test for Demo) |

---

## 1. Summary
When a customer uses the "เรียกพนักงาน" (Staff Call) feature, a toast notification pops up on the POS screen. However, unlike the notification center feed where each call has a **"รับทราบ"** (Acknowledge) button, the toast itself lacks this button.

## 2. Current Behavior
- Staff must dismiss the toast, open the notification drawer/feed, find the call notification, and tap "รับทราบ" there.

## 3. Expected Behavior
- The incoming staff call toast should feature an inline **"รับทราบ"** action button.
- Tapping "รับทราบ" directly on the toast acknowledges the call in one tap, dismisses the toast, and notifies the backend/customer.

## 4. Suggested Fix
- Include the acknowledge action button in the toast component for staff call notification types.

# DEF-05 — Staff Call "อื่นๆ" Textarea Formatting and Resizing

| | |
|---|---|
| **Defect ID** | DEF-05 |
| **Status** | Open |
| **Surface** | Customer Web (`app/frontend/src/app/customer`) |
| **Severity** | Low (Polish / Layout) |
| **Discovered** | 2026-11-01 (Hands-on test for Demo) |

---

## 1. Summary
In the customer "เรียกพนักงาน" (Staff Call) modal, choosing the "อื่นๆ" (Other) option reveals a note textarea. The input field lacks a fixed default height (appears as 1 line or unstable height) and retains the native browser resize grip, which can distort the mobile sheet layout.

## 2. Current Behavior
- Native resize handle allows accidental stretching.
- Default height is too cramped for multi-word notes.

## 3. Expected Behavior
- Textarea should default to 3–5 rows (`rows={3}` to `rows={5}` or `min-h-[80px]`).
- Disable native resizing (`resize-none` in Tailwind or `resize: none;`).

## 4. Suggested Fix
- Apply `rows={4}` and class `resize-none` to the textarea component.

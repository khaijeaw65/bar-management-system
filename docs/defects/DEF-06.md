# DEF-06 — Toast Close Button Relies on Hover on Tablet POS

| | |
|---|---|
| **Defect ID** | DEF-06 |
| **Status** | Open |
| **Surface** | Web POS (`app/frontend`) |
| **Severity** | High (Tablet / Touchscreen Ergonomics) |
| **Discovered** | 2026-11-01 (Hands-on test for Demo) |

---

## 1. Summary
Toast notification close buttons are styled to reveal or brighten on `:hover` (e.g. `opacity-0 group-hover:opacity-100` or subtle contrast). Because POS hardware is tablet/iPad-based, touch screens do not trigger hover states reliably, making it difficult or impossible for cashiers/bartenders to dismiss toasts manually.

## 2. Current Behavior
- Close button is hidden or dim until hover occurs.
- On touch devices, tapping doesn't reliably register a close event.

## 3. Expected Behavior
- Toast close (`✕`) button should always be visible (`opacity-100`).
- Minimum touch target should meet accessibility and touchscreen standards (≥ 44×44px hit area).

## 4. Suggested Fix
- Remove hover-dependent visibility classes on toast close elements. Ensure persistent visibility and adequate touch padding.

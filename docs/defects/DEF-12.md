# DEF-12 — Toast Close Button Overlaps Action Button

| | |
|---|---|
| **Status** | Fixed (merged) |
| **Fixed by** | BRIEF-071 (PR #123) |
| **Surface** | Web POS (`app/frontend/src/hooks/usePosAlerts.ts` / HeroUI Toast) · **Severity** Medium (Visual / Touch Interaction) |
| **Found** | 2026-11-02 · hands-on test for demo |
| **Should have been caught at** | — not assessed (logged before workflow Rev 24; fill when the defect is next touched) |

---

## 1. Summary
On notification toasts containing an action button (e.g. *"ออเดอร์ใหม่จาก QR · T2 · #002"* with the orange *"ดูออเดอร์"* button), the circular toast close button (`✕`) is positioned directly on top of the right edge of the action button.

## 2. Evidence
- Screenshot attached showing the dark close button circle overlapping the text and tap target of *"ดูออเดอร์"*.

## 3. Root Cause
- HeroUI `<Toast>` default layout renders the close button in a fixed position on the right without allocating margin or padding-right for `actionProps`.

## 4. Suggested Fix
- Add `mr-7` or `mr-8` to the action button class in `actionProps` (or configure toast padding) so the action button has adequate clearance from the close icon.

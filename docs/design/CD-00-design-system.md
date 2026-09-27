# CD-00 — Design system refresh + feedback kit

**Status:** Ready for Claude Design · **Surface:** all (web dark/light, phone, Expo) · **Used by:** every CD brief and every frontend/mobile brief

## Attach
`docs/design-system.md` · existing canvas https://claude.ai/artifact/3bffc3c8-7223-4803-bd39-bb74de243226 · screenshot `docs/handoffs/assets/BRIEF-005/menu-dark.png` and `menu-light.png` (what's already built)

## Paste into Claude Design
> Refresh the design system for **The Loft Bar**, a bar-management product for small counter bars in Thailand. Aesthetic: cozy loft — warm neutrals, amber accent, calm (no bouncy motion). Font **Sarabun**; all UI copy in **Thai**, English loanwords as-is (Menu, QR, Happy Hour). Two themes with the same token names: **dark (default)** and **light**. Use only the tokens in the attached `design-system.md` — no new hex values; if you need a new token, name it and propose both theme values.
>
> Produce these artboards, each in **dark and light** side by side:
> 1. **DS-colors** — every token swatch with name + both values; contrast note for text tokens.
> 2. **DS-type** — the 7 type styles in Thai + English sample lines; show a rem equivalent (base 16px).
> 3. **DS-spacing-radius-elevation** — spacing scale, radius scale, shadow per theme, z-index layers.
> 4. **DS-controls** — Button (primary, secondary, ghost, danger) × (default, hover, pressed, focus-visible, disabled, loading); icon button; Input, Select, Textarea, Search (default, focus, filled, error with message, disabled); Checkbox, Radio, Switch; Segmented control (used for ธีมมืด / ธีมสว่าง / ตามระบบ).
> 5. **DS-data** — Card; Table row (default, hover, selected); Status chips for order (PENDING, ACCEPTED, READY, SENT, ISSUE), table (ว่าง, มีแขก, รอชำระ, ปิดโต๊ะ), payment (รอชำระ, ชำระแล้ว, ล้มเหลว), bottle-keep (indigo); 86'd item style; cancelled item style; price display `฿1,234.00`; avatar/initials.
> 6. **DS-feedback** — **Toast** (success, info, warning, error; with/without action; stacked max 3; position top-right desktop, top-center phone; auto-dismiss 4s, error stays until closed); **Inline banner** (page-level: offline/reconnecting, permission denied); **Confirm dialog** (normal + destructive); **Bottom sheet** (phone); **Empty state**, **Loading skeleton**, **Error state with retry** (use the `/pos/menu` wording: ยังไม่มีเมนู · เกิดข้อผิดพลาด · ลองอีกครั้ง).
> 7. **DS-notifications** — Notification **bell** with unread badge (0, 3, 99+); **feed panel** (desktop dropdown / phone full screen) with items: ออเดอร์ใหม่, อาหารพร้อมเสิร์ฟ, ชำระเงินสำเร็จ, โต๊ะไม่มีความเคลื่อนไหว, ขอเติมสต็อก, เรียกพนักงาน — each with icon, title, one-line body, time-ago, unread dot, click target; "อ่านทั้งหมด"; empty feed; **phone push notification** preview (lock-screen style, no guest personal data in the text).
> 8. **DS-icons** — Lucide icons used in nav and statuses at 16/20/24px, stroke 1.5.
>
> Keep components HeroUI-v3-compatible (web) and HeroUI-Native-compatible (Expo): standard React Aria patterns, no exotic widgets.

## Acceptance (Field checks before marking Done)
- Both themes on every artboard; only existing/proposed tokens; Thai copy.
- Every control shows focus-visible and disabled; toast/dialog/empty/loading/error all present.
- Proposed new tokens (if any) listed with both values → copied into `design-system.md`.

## Result
- Claude Design link: <paste>
- design-system.md changes: <none / PR link>

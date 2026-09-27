# CD-00 — Design system gap-fill (light theme, HeroUI alignment, feedback kit)

**Status:** Done 2026-09-27 — handoff `docs/design/CD-00-handoff.md`, values `docs/design/tokens-v2.css` · **Surface:** all · **Used by:** every CD brief and every frontend/mobile brief
**Decisions:** Field A–G, 2026-09-27 (see `docs/design-system.md` → Decisions)

## Attach
**Open inside the existing Claude Design project:** https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457 (extend it; do not start a new project)
`docs/design-system.md` (v2)

## Paste into Claude Design
> Extend **this** design system (The Loft Bar). Keep every existing token name and dark value unless listed below. Thai-first copy.
>
> **CD-01 already exists in this project** (dark only) and created some components (Skeleton, Alert/Banner, Table rows, PosRail, NotificationBell, Toast). **Reuse and refine those — don't create duplicates.** When done, add the light theme to the CD-01 artboards too.
>
> **Library constraint (important):** the product is built with **HeroUI v3** (web, React Aria) and **HeroUI Native** (Expo staff app). Every general component must correspond to a HeroUI component and its theme variables — Button, TextField, Select, SearchField, Checkbox, RadioGroup, Switch, Tabs (also as segmented control), Chip, Badge, Card, Table, Modal / AlertDialog / drawer-sheet, Toast, Tooltip, Popover, Dropdown, Skeleton, Spinner, Avatar, Alert. Match their anatomy, sizes and states; do not invent interaction patterns HeroUI can't do. Only these are custom: MenuItemCard, OrderTicket, CartLine, QuantityStepper, TableTile, StatTile, PosRail, NotificationBell/Feed, PromptPay QR panel. Label each DS component with its HeroUI counterpart.
>
> 1. **Light theme** — define light values for every semantic token (bg, surface-*, text-*, line-*, accent-*, status, feedback, shadows). Warm paper/cream, not white-grey; amber stays the accent; `text-on-accent` stays dark. All text and status colours ≥ 4.5:1. Add a theme switch and show **every DS artboard in dark and light**.
> 2. **New tokens** — `--surface-bar` (replaces rgba .82/.9/.92 bars), `--danger-fg/-bg/-border` (replaces hard-coded danger button colours), `--bottle-keep`/`-bg` (indigo), z-index scale (base 0, raised 10, sticky 20, dropdown 30, scrim 40, dialog 50, toast 60). Replace every remaining hard-coded colour (TableTile borders, accent card border, QR panel) with tokens.
> 3. **Numbers** — `tabular-nums` on price, totals, counts, times.
> 4. **Icons** — Lucide, pinned version, stroke 1.75 everywhere, sizes 16/20/24; Select chevron and checkbox tick use Lucide icons.
> 5. **Missing states** — hover / pressed / focus-visible (`focus-ring`) / disabled / loading for Button, IconButton, SegmentedControl, Checkbox, Radio, Switch, Tag, Select, Input; Select error state.
> 6. **Status chips** — exact labels:
>    - Order: ใหม่ (pending) · กำลังทำ (accepted) · พร้อมเสิร์ฟ (ready) · เสิร์ฟแล้ว (sent) · มีปัญหา (issue)
>    - Item: รอ · กำลังทำ · พร้อม · ยกเลิก (struck through)
>    - Table/visit: ว่าง · เปิดแล้ว · มีแขก · ไม่มีความเคลื่อนไหว · ปิดโต๊ะ · ทิ้งโต๊ะ · เรียกพนักงาน (pulse dot)
>    - Payment: รอชำระ · ชำระแล้ว · ไม่สำเร็จ · คืนเงินแล้ว
>    - Bottle keep (indigo): ฝากอยู่ · หมดขวด · หมดอายุ
>    - Menu: หมด (86'd)
> 7. **Missing components** — Alert/Banner (info, success, warning, danger; dismissible), Skeleton (row, card, tile), Error state (icon, "เกิดข้อผิดพลาด", "ลองอีกครั้ง"), Avatar (image, initials, sizes 24/32/40), Table rows (header, row, hover, selected, sortable header, pagination) for POS, **PosRail** (88 px, items 64×64, icon + label 10 px, active = accent-soft + text-accent, badge).
> 8. **Feedback kit** — Toast (success / error / info / warning, with action, stacking, top-right desktop / top phone, auto-dismiss 4 s), Dialog (confirm, destructive), Bottom sheet, Empty / Loading / Error trio.
> 9. **Notifications** — NotificationBell (0, 3, 99+), NotificationFeed panel (unread/read, grouped Today/Earlier, mark all read) with the 6 triggers: new order, order ready, call staff, payment received, payment failed, bottle keep expiring; lock-screen push mock for the Expo app.
>
> Artboards: `CD-00/DS-colors`, `DS-type`, `DS-space-radius-elevation-z`, `DS-controls`, `DS-status-chips`, `DS-data` (table, avatar, skeleton), `DS-feedback`, `DS-notifications`, `DS-icons`, `DS-heroui-map` (one table: DS component → HeroUI v3 → HeroUI Native).

## Acceptance (Field checks)
- Light values exist for every semantic token; every DS artboard shown in both themes.
- No hard-coded colours left in components; z-index tokens exist.
- Every general component names its HeroUI counterpart (`DS-heroui-map`).
- Status chip labels exactly as listed.

## Result (paste back for Cowork)
- Claude Design link: <paste>
- Export of **new/changed tokens only** (light values, new tokens) as text: <paste>
- Anything that couldn't match HeroUI: <none / list>

# CD-00 — Developer handoff (from Claude Design, 2026-09-27)

Source: The Loft Bar Design System (Claude Design, https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457). Screenshots: none (boards too large) — the text below is the spec.
**Token values:** `docs/design/tokens-v2.css` (dark, light, theme-independent, HeroUI mapping). **Do not port Claude Design JSX** or its specimen-only props (`forceState`, `forceStateFor`, `isOpen`, `forceHoverKey`).

## 1. Component → HeroUI v3 → HeroUI Native
| DS component | HeroUI v3 (web) | HeroUI Native (Expo) |
|---|---|---|
| Button / IconButton | `Button` / `Button isIconOnly` | same |
| Input | `TextField` (Label / Input / Description / FieldError) | `TextField` |
| Select | `Select` (Trigger / Value / Indicator / Popover › ListBox) | `Select` |
| SearchField | `SearchField` | `SearchField` |
| Checkbox / Radio / Switch | `Checkbox`(`Group`) / `RadioGroup › Radio` / `Switch` | `Checkbox` / `RadioGroup › Item` / `Switch` |
| SegmentedControl / Tabs | `Tabs variant="secondary"` / `Tabs` | same |
| Tag | `TagGroup › Tag` | `Chip` (pressable) |
| Badge / StatusChip | `Chip` (soft + dot) | `Chip` |
| Count badge (rail, bell) | `Badge` | none → View + Typography |
| Card | `Card` | `Card` / `Surface` |
| DataTable | `Table` | none → FlatList of Card |
| Dialog / danger / sheet | `Modal` / `AlertDialog` / `Drawer placement="bottom"` | `Dialog` / `Dialog` / `BottomSheet` |
| Toast + region | `Toast` (ToastProvider placement) | `Toast` |
| Tooltip | `Tooltip` | none (not used on phones) |
| Select list / bell panel | `Popover` | `Popover` |
| POS avatar menu | `Dropdown` | `Menu` |
| Skeleton / Spinner / Avatar / Alert | same names | same (`SkeletonGroup` available) |
| EmptyState | composition | composition |
| TopBar / TabBar | custom | Expo Router Stack header / Tabs |
Custom by design (built from HeroUI Card / Chip / Button): MenuItemCard, OrderTicket, CartLine, QuantityStepper, TableTile, StatTile, PosRail, NotificationBell, NotificationFeed, PromptPayPanel.
Gaps: no HeroUI app bar; Table pagination = icon Buttons (no confirmed Pagination component); HeroUI Native has no Table / Tooltip / Badge.

## 2. Status chips (label + tone; code uses **schema enum values**)
Tones (fill / text, dot = `--status-*`): neutral `status-neutral-bg/-fg` · accent `accent-soft-strong / text-accent` · new `status-new-bg/-fg` · making `status-making-bg/-fg` · served `status-served-bg/-fg` · void `status-void-bg/-fg` · bottle `bottle-keep-bg / bottle-keep` · solid accent `accent / text-on-accent`.

| Domain | Schema value (CD name) → label → tone |
|---|---|
| Order `order_status` | `pending` ใหม่ new · `accepted` กำลังทำ making · `ready` พร้อมเสิร์ฟ served · `sent` เสิร์ฟแล้ว neutral · `issue` มีปัญหา void |
| Item `order_item_status` | `pending` (CD `waiting`) รอ neutral · `preparing` (CD `making`) กำลังทำ making · `ready` พร้อม served · `cancelled` ยกเลิก neutral, struck through, no dot |
| Table / visit | no visit (CD `free`) ว่าง neutral · `open` เปิดแล้ว accent · `active` (CD `seated`) มีแขก served · `idle` ไม่มีความเคลื่อนไหว new · `closed` ปิดโต๊ะ neutral · `abandoned` ทิ้งโต๊ะ void · call-staff flag (CD `calling`) เรียกพนักงาน solid accent + pulse dot |
| Payment `payment_status` | `pending` รอชำระ new · `completed` (CD `paid`) ชำระแล้ว served · `failed` ไม่สำเร็จ void · `refunded` คืนเงินแล้ว making |
| Bottle keep `bottle_keep_status` | `active` ฝากอยู่ bottle · `finished` (CD `empty`) หมดขวด neutral · `expired` หมดอายุ void |
| Menu | `is_available=false` (CD `soldout`) หมด void |

## 3. Components and states
**All controls:** hover · pressed (scale .97) · focus-visible (`--glow-focus`) · disabled (raised fill + `text-faint`, no opacity) · pending (Spinner replaces leading icon, label stays). Matches HeroUI `data-hovered / data-pressed / data-focus-visible`.
- **Alert** — info / success / warning / danger; Lucide icon, title, description, optional actions, dismiss ×. One tinted style (no `variant`).
- **Skeleton** — bar / circle + presets row, card, tile; `sk-shimmer`.
- **Avatar** — sm 24 / md 32 / lg 40; image → initials fallback; online / away / offline dot.
- **DataTable** — sticky header; sortable (`aria-sort`, Lucide arrows); hover; selected = `accent-soft` + 2 px accent inset; selection none / single / multiple (checkbox column, indeterminate header); loading = skeleton rows; empty keeps header; pagination "แสดง x–y จาก n", prev/next, pages with ellipsis; numeric columns tabular.
- **PosRail** — 88 px; items 64×64, icon **24**, label 10 px; default / hover / focus-visible / active (`accent-soft` + `text-accent`); count badge max 99+; log-out IconButton at bottom.
- **NotificationBell** — count 0 (hidden) / 1–99 / 99+; hover, open; opens NotificationFeed in a Popover (`--z-dropdown`).
- **NotificationFeed** — header with unread count + "อ่านทั้งหมดแล้ว" (disabled when none unread); groups วันนี้ / ก่อนหน้านี้; unread tinted + dot, read muted, hover, empty state; triggers `order_new`, `order_ready`, `call_staff`, `payment_received`, `payment_failed`, `bottle_expiring`.
- **Toast** — success / error / warning / info; optional title + action `{label, onPress}`; close; auto-dismiss 4 s with progress hairline (`duration={0}` = sticky); region newest-first, max 3; top-right desktop / top phone; `--z-toast`.
- **Dialog** — centre confirm (Modal); destructive `tone="danger"` → AlertDialog with triangle-alert in `danger-bg` circle; `isDismissable` controls Esc / scrim; actions right-aligned; scrim `--z-scrim`, panel `--z-dialog`. **Bottom sheet** = `variant="sheet"`: grab handle, 20 px top radius, `--shadow-sheet`.
- **Spinner** 16 / 20 / 24, `currentColor` · **StatusChip** (§2) · **PromptPayPanel** pending (countdown) / paid / failed / expired (QR dimmed), QR on `--qr-bg` both themes · **EmptyState** empty / noresult / loading / error (error default "เกิดข้อผิดพลาด" + "ลองอีกครั้ง").

## 4. Deviations from the CD-00 prompt — Cowork decisions (Field may override)
| # | What CD did | Decision |
|---|---|---|
| 1 | Dark `--text-faint` #8E8069 → **#A39377** (old failed 4.5:1 on cards) | **Accept** — accessibility rule wins |
| 2 | Added `--status-*-fg`, `--success/warning/info-fg` (status text on own fill was 3.3–4.4:1) | Accept |
| 3 | Extra tokens: `--status-*-border`, `--line-accent(-soft)`, `--status-neutral-*`, `--danger-bg-hover`, `--qr-*`, `--brand-line*`, `--num`, light ramps (`--paper-*`, `--ink-*`, …) | Accept; ramps stay in CD (code uses semantic tokens only) |
| 4 | Light `--danger` #A0351F (used as text too) | Accept |
| 5 | LINE button white on #06C755 ≈ 2.3:1 | Accept — LINE brand requirement |
| 6 | Chip tone choices (เสิร์ฟแล้ว neutral, คืนเงินแล้ว making, ไม่มีความเคลื่อนไหว new) | Accept |
| 7 | Breaking: Avatar sm 24 / md 32 / lg 40 (no 36, xs, xl); icons only 16/20/24 stroke 1.75 (22, 28 and stroke 2 gone); Alert has no `variant` | Accept — CD-01 handoff values superseded (rail icon 24, avatar md 32) |
| 8 | CD legacy prop aliases (old status names, `danger` toast) | CD-only — code uses schema enums + HeroUI prop names only |
| 9 | "Badge" in DS = HeroUI `Chip`; HeroUI `Badge` = count bubble only | Accept — follow §1 |
| 10 | Lock-screen push = generic mock | Accept |
| 11 | Older guideline cards / thumbnails still dark only; CD-01 light = separate `ui_kits/pos-v2/light/` cards | OK for now |
| 12 | CD-00 artboards not verified rendered at handoff | **Field to eyeball** DS-controls, DS-data, DS-feedback, DS-notifications for blank cards |
| 13 | HeroUI mapping extended by Cowork: `*-soft` / `*-soft-foreground`, `accent-soft-foreground`, `field-foreground` (verified against @heroui/styles 3.2.6) | In `tokens-v2.css` |

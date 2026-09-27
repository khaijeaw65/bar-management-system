# Design System — The Loft Bar (v2)

**Source of truth for visuals:** Claude Design project https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457 — this file mirrors it in text for agents and code.
**Status:** v2 — 2026-09-27. Reconciled from the CD export (2026-09-27) with Field's decisions A–G. Dark theme defined; **light theme pending CD-00**.
**Aesthetic:** cozy loft — warm clay neutrals, amber accent, calm motion (no bounce).
**Component libraries:** web = **HeroUI v3** (`@heroui/react`, React Aria) · Expo = **HeroUI Native** + Uniwind. Designs must use components these libraries provide (see §5 mapping); custom components only for bar-specific pieces listed in §6.
**Older canvas (superseded):** https://claude.ai/artifact/3bffc3c8-7223-4803-bd39-bb74de243226

## Decisions (Field, 2026-09-27)
| # | Decision |
|---|---|
| A | Font **Noto Sans Thai** (400/600/700); Sarabun only as fallback in the stack |
| B | Token naming = CD project: primitives (`clay-*`, `amber-*`, `leaf/brick/honey/slate-*`) + semantic tokens (`bg-app`, `surface-*`, `text-*`, `line-*`, `accent-*`, status, feedback) |
| C | Statuses follow `docs/schema.sql` enums exactly (§4) |
| D | Feedback colours from CD (leaf / brick / honey / slate) |
| E | Light theme is required (DR-002) — CD-00 defines values |
| F | POS sidebar = 88 px icon rail with labels |
| G | Staff app = Expo (HeroUI Native), not PWA |

---

## 1. Colour

### Primitives (dark values; primitives are theme-independent)
| Token | Value | | Token | Value |
|---|---|---|---|---|
| `--clay-1000` | `#12100C` | | `--amber-100` | `#F7E0BC` |
| `--clay-950` | `#1C1610` | | `--amber-200` | `#EFC78D` |
| `--clay-900` | `#241D15` | | `--amber-300` | `#E3A75B` |
| `--clay-850` | `#2C2318` | | `--amber-400` | `#D4872A` |
| `--clay-800` | `#362B1E` | | `--amber-500` | `#B87020` |
| `--clay-750` | `#423424` | | `--amber-600` | `#955718` |
| `--clay-700` | `#4E3E2B` | | `--amber-700` | `#6B3E11` |
| `--clay-600` | `#6A563B` | | `--amber-900` | `#3A2611` |
| `--clay-500` | `#8E8069` | | `--leaf-400` / `--leaf-700` | `#7FA85C` / `#2E3A20` |
| `--clay-300` | `#C4B698` | | `--brick-400` / `--brick-700` | `#C4503A` / `#40190F` |
| `--clay-100` | `#F0E6D0` | | `--honey-400` / `--honey-700` | `#E3A11B` / `#40300B` |
| | | | `--slate-400` / `--slate-700` | `#6E93A8` / `#1E2F38` |
| | | | `--indigo-400` / `--indigo-700` *(new — bottle keep)* | `#8B93D4` / `#262840` |

Light-theme primitives (lighter clay ramp etc.) → **CD-00**.

### Semantic tokens (components use only these)
| Token | Dark | Light | Usage |
|---|---|---|---|
| `--bg-app` | `clay-950` | CD-00 | Screen background |
| `--bg-sunken` | `clay-1000` | CD-00 | Behind frames, POS rail |
| `--surface-card` | `clay-850` | CD-00 | Cards |
| `--surface-raised` | `clay-800` | CD-00 | Secondary button, raised card, tag |
| `--surface-overlay` | `clay-900` | CD-00 | Dialog, toast, sheet |
| `--surface-input` | `clay-900` | CD-00 | Inputs, select, stepper, segmented, checkbox, radio |
| `--surface-hover` | `clay-750` | CD-00 | Hover fill |
| `--surface-press` | `clay-800` | CD-00 | Pressed fill |
| `--surface-bar` *(new)* | `rgba(28,22,16,.82)` | CD-00 | TopBar / TabBar / cart bar (replaces 3 hard-coded values) |
| `--scrim` | `rgba(12,10,8,.72)` | CD-00 | Dialog backdrop |
| `--text-body` | `clay-100` | CD-00 | Primary text |
| `--text-muted` | `clay-300` | CD-00 | Secondary text |
| `--text-faint` | `clay-500` | CD-00 | Tertiary text, inactive nav |
| `--text-on-accent` | `#241608` | CD-00 | Text on amber |
| `--text-accent` | `amber-300` | CD-00 | Prices, active nav, links |
| `--text-danger` | `#E0745C` | CD-00 | Field error message |
| `--line-hairline` / `--line` / `--line-strong` | `rgba(240,230,208,.07/.12/.22)` | CD-00 | Dividers / borders / control borders |
| `--accent` / `-hover` / `-press` | `amber-400` / `amber-300` / `amber-500` | CD-00 | Primary CTA, checked controls |
| `--accent-soft` / `--accent-soft-strong` | `rgba(212,135,42,.14/.24)` | CD-00 | Accent tints, active nav |
| `--focus-ring` | `amber-300` | CD-00 | Focus-visible outline (must be used by every control) |
| `--success` / `--warning` / `--danger` / `--info` | `leaf-400` / `honey-400` / `brick-400` / `slate-400` | CD-00 | Toast tones, deltas |
| `--success-bg` / `--warning-bg` / `--info-bg` *(new)* | `leaf-700` / `honey-700` / `slate-700` | CD-00 | Chip / alert backgrounds for feedback tones |
| `--danger-fg` / `--danger-bg` / `--danger-border` *(new)* | `#F3C9BD` / `brick-700` / `rgba(196,80,58,.5)` | CD-00 | Danger button (replaces hard-coded values) |
| `--bottle-keep` / `--bottle-keep-bg` *(new)* | `indigo-400` / `indigo-700` | CD-00 | Bottle-keep chips/icons only |

Light theme rule: same token names, every text/status token ≥ 4.5:1 on `bg-app` and `surface-card`; `--text-on-accent` stays dark on amber in both themes.

### HeroUI v3 mapping (web — `app/frontend/src/app/globals.css`)
`--background`→`bg-app` · `--foreground`→`text-body` · `--surface`/`--surface-foreground`→`surface-card`/`text-body` · `--overlay`/`--overlay-foreground`→`surface-overlay`/`text-body` · `--default`/`--default-foreground`→`surface-raised`/`text-body` · `--muted`→`text-muted` · `--accent`/`--accent-foreground`→`accent`/`text-on-accent` · `--border`/`--separator`→`line` · `--focus`→`focus-ring` · `--link`→`text-accent` · `--success`/`--warning`/`--danger`→ same names. Expo (HeroUI Native + Uniwind) uses the same semantic names in its theme.

## 2. Typography
Stack: `"Noto Sans Thai", "Sarabun", system-ui, sans-serif` (Noto Sans Thai 400/600/700 loaded via `next/font` / `@expo-google-fonts`). Numbers: same font with **`font-variant-numeric: tabular-nums`** for prices, totals, counts, times.

| Style | Weight | Size | Line height | Usage |
|---|---|---|---|---|
| `text-display` | 700 | 34 | 1.35 | Brand, hero (letter-spacing −0.01em) |
| `text-title` | 700 | 26 | 1.4 | Large numbers, page titles |
| `text-heading` | 600 | 21 | 1.45 | Dialog title, POS header, table label |
| `text-subhead` | 600 | 17 | 1.5 | TopBar title, ticket table, empty-state title |
| `text-body-md` | 400 | 15 | 1.62 | Body, inputs, lists |
| `text-body-strong` | 600 | 15 | 1.62 | Item names, active tab |
| `text-small` | 400 | 13 | 1.5 | Meta, descriptions |
| `text-label` | 600 | 11 | 1.4 | Micro labels, badges (Latin caps +0.08em) |
| `text-price` | 700 | 19 | 1.3 | Prices, totals (tabular) |
| POS total | 700 | 40 | 1.1 | Bill / payment total |
Buttons: sm 600/13 · md 600/15 · lg 700/17.

## 3. Space, shape, elevation, motion, layers
- **Spacing** `--sp-0…12`: 0 · 2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64. Aliases: gutter phone 16 / desktop 24 · card-pad 16 (lg 20) · stack 8/12/20 · section-gap 32 · tap-min **44** · tap-comfortable 52 · POS key 64 · bar-height 56 · sheet-grab 36.
- **Radius**: xs 6 · sm 8 · btn/input 10 · card 12 · card-lg 16 · sheet 20 · pill 999. Border 1 px, strong 1.5 px (selected).
- **Shadows**: card `0 1px 2px rgba(0,0,0,.4)` · raised `0 4px 14px rgba(0,0,0,.45)` · sheet `0 -8px 32px rgba(0,0,0,.55)` · dialog `0 24px 64px rgba(0,0,0,.6)` · accent `0 4px 16px rgba(212,135,42,.28)` · highlight-top inset · glow-focus `0 0 0 2px rgba(212,135,42,.55)`. Blur: overlay 12 px, bar 18 px. Light-theme shadows → CD-00.
- **Motion**: instant 90 ms · fast 140 · base 200 · slow 300 · sheet 340; ease-out `cubic-bezier(.2,0,0,1)` · in-out `(.4,0,.2,1)` · sheet `(.22,1,.36,1)`; press scale .97. Bottom sheet uses sheet duration/easing for enter + exit.
- **Z-index tokens** *(new)*: base 0 · raised 10 · sticky 20 (top bar, tab bar) · dropdown/tooltip 30 · scrim 40 · dialog/sheet 50 · toast 60.
- **Icons**: Lucide, one pinned version per app; sizes 16 / 20 (default) / 24; stroke **1.75** everywhere; chevrons and check marks are Lucide icons, not Unicode glyphs.

## 4. Status chips (from `docs/schema.sql`)
| Domain | Enum value → Thai label | Tone (bg / text) |
|---|---|---|
| Order (`order_status`) | `pending` ใหม่ · `accepted` กำลังทำ · `ready` พร้อมเสิร์ฟ · `sent` เสิร์ฟแล้ว · `issue` มีปัญหา | honey · slate · leaf · neutral (surface-raised / text-muted) · brick |
| Order item (`order_item_status`) | `pending` รอ · `preparing` กำลังทำ · `ready` พร้อม · `cancelled` ยกเลิก (struck through, stays visible) | honey · slate · leaf · brick |
| Visit / table (`visit_state`) | no visit ว่าง · `open` เปิดแล้ว · `active` มีแขก · `idle` ไม่มีความเคลื่อนไหว · `closed` ปิดโต๊ะ · `abandoned` ทิ้งโต๊ะ | neutral · accent-soft · leaf · honey · faint · brick |
| Call staff (flag) | เรียกพนักงาน | honey + pulse dot |
| Payment (`payment_status`) | `pending` รอชำระ · `completed` ชำระแล้ว · `failed` ไม่สำเร็จ · `refunded` คืนเงินแล้ว | honey · leaf · brick · neutral |
| Bottle keep (`bottle_keep_status`) | `active` ฝากอยู่ · `finished` หมดขวด · `expired` หมดอายุ | indigo · neutral · brick |
| Menu | 86'd หมด | faint, name struck through |
Tones map to `status/feedback` tokens — CD-00 finalises exact `-bg` pairs and light values.

## 5. Component → library mapping
| Need | Web (HeroUI v3) | Expo (HeroUI Native) | CD project component |
|---|---|---|---|
| Button / IconButton | `Button` (variants, `isIconOnly`, `isPending`) | `Button` | Button, IconButton |
| Text input / select / textarea / search | `TextField`, `Select`, `SearchField` | equivalents | Input, Select |
| Checkbox / radio / switch | `Checkbox`, `RadioGroup`, `Switch` | equivalents | same |
| Segmented control / tabs | `Tabs` (segmented style) | `Tabs` | SegmentedControl, Tabs |
| Chips / badges | `Chip`, `Badge` | `Chip` | Badge, Tag |
| Card | `Card` | `Card` | Card |
| Data table | `Table` | list rows | *missing → CD-00* |
| Dialog / bottom sheet | `Modal`, `AlertDialog`, drawer/sheet | `Dialog`, `BottomSheet` | Dialog (center / sheet) |
| Toast | HeroUI toast | HeroUI Native toast | Toast |
| Tooltip / popover / dropdown | `Tooltip`, `Popover`, `Dropdown` | `Popover` | Tooltip |
| Skeleton / spinner | `Skeleton`, `Spinner` | `Skeleton`, `Spinner` | *missing → CD-00* |
| Avatar | `Avatar` | `Avatar` | *missing → CD-00* |
| Banner / alert | `Alert` | `Alert` | *missing → CD-00* |
Exact component names are verified against the installed HeroUI version during implementation; designs must not require behaviour these components can't express without a DR.

## 6. Bar-specific components (custom, built on HeroUI primitives)
MenuItemCard (row / tile / sold-out) · OrderTicket · CartLine · QuantityStepper · TableTile (free / open / active / idle / call-staff / paid / selected) · StatTile · PosRail (88 px icon rail) · NotificationBell + NotificationFeed *(CD-00)* · PromptPay QR panel.

## 7. Layout
- **Phone** (customer QR, staff Expo): 390×844 reference, safe areas, 56 px top bar, tab bar + safe area, gutter 16.
- **POS desktop**: 1280×800 reference (also 1024): top bar 56 px · **icon rail 88 px** (items 64×64, radius 10, label 600/10) · main content · right panel 400 px for session detail · payment as dialog.

## 8. Voice
Thai-primary, short, friendly, never blaming the user ("ลองอีกครั้ง", not "คุณทำผิด"). English loanwords as-is.

## 9. Open gaps → CD-00
Light theme (all tokens) · banner, skeleton, error state, notification bell/feed, avatar, data table rows, PosRail as a DS component · loading state on all components · hover/focus/disabled on IconButton, Segmented, Checkbox, Radio, Tag, Select + Select error · z-index + new tokens in the CD project · tabular numerals · icon stroke/version pinning · status chips for order (5), payment, bottle keep, visit.

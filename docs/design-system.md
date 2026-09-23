# Design System — The Loft Bar

**Status:** Established 2026-09-20  
**Canvas:** https://claude.ai/artifact/3bffc3c8-7223-4803-bd39-bb74de243226  
**Aesthetic:** Cozy loft — warm neutrals, amber accent, dark mode only

---

## Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `--color-bg` | `#1C1610` | Page/app background |
| `--color-surface` | `#2C2318` | Cards, panels, modals |
| `--color-surface-raised` | `#3A2F22` | Elevated cards, dropdowns |
| `--color-border` | `#4A3B2A` | Dividers, input borders |
| `--color-text-primary` | `#F0E6D0` | Body text, headings |
| `--color-text-secondary` | `#A89070` | Labels, captions, metadata |
| `--color-text-disabled` | `#6B5A48` | Disabled states |
| `--color-accent` | `#D4872A` | Primary CTA, active states (dark surfaces) |
| `--color-accent-light` | `#C07820` | Primary CTA on lighter surfaces |
| `--color-accent-subtle` | `#3D2810` | Accent background tint |
| `--color-success` | `#4CAF7D` | Confirmed, paid, ready states |
| `--color-warning` | `#E8A838` | ISSUE state, attention needed |
| `--color-error` | `#E05A5A` | Errors, cancelled items |
| `--color-bottle-keep` | `#8B93D4` | Bottle-keep accent (indigo) |

> **Rule:** Dark mode only. No light mode. Do not add `prefers-color-scheme` media queries.

---

## Typography

**Font:** Sarabun (Google Fonts)  
**Language:** Thai-primary. All UI strings hardcoded in Thai. No i18n library.

| Scale | Weight | Size | Line Height | Usage |
|---|---|---|---|---|
| `display` | 700 | 28px | 1.3 | Screen titles, hero text |
| `heading` | 600 | 20px | 1.4 | Section headers, card titles |
| `subheading` | 500 | 16px | 1.4 | Subsections, tab labels |
| `body` | 400 | 15px | 1.6 | Body text, descriptions |
| `body-sm` | 400 | 13px | 1.5 | Captions, metadata, timestamps |
| `label` | 500 | 13px | 1.3 | Form labels, chips, badges |
| `button` | 600 | 15px | 1 | Button text |

> **Import:** `https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap`

---

## Spacing Scale

Base unit: `4px`

| Token | Value | Usage |
|---|---|---|
| `--space-1` | `4px` | Micro gaps, icon padding |
| `--space-2` | `8px` | Tight internal padding |
| `--space-3` | `12px` | Component internal padding |
| `--space-4` | `16px` | Standard padding, gaps |
| `--space-5` | `20px` | Card padding |
| `--space-6` | `24px` | Section spacing |
| `--space-8` | `32px` | Large section gaps |
| `--space-10` | `40px` | Page-level padding |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `8px` | Chips, badges, small elements |
| `--radius-md` | `10px` | Buttons, inputs |
| `--radius-lg` | `12px` | Cards |
| `--radius-xl` | `16px` | Large cards, modals, bottom sheets |
| `--radius-full` | `9999px` | Pills, avatars |

---

## Component Patterns

### Buttons

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| Primary | `--color-accent` | `#1C1610` | none | Main CTA (สั่งอาหาร, ชำระเงิน) |
| Secondary | `--color-surface-raised` | `--color-text-primary` | `--color-border` | Secondary actions |
| Ghost | transparent | `--color-accent` | none | Tertiary, inline actions |
| Danger | `--color-error` at 15% opacity | `--color-error` | `--color-error` at 40% | Destructive actions |

Height: `48px` (touch), `40px` (desktop)  
Radius: `--radius-md` (10px)  
Font: `button` scale

### Cards

Background: `--color-surface`  
Border: `1px solid --color-border`  
Radius: `--radius-lg` (12px)  
Padding: `--space-5` (20px)  
Shadow: `0 2px 8px rgba(0,0,0,0.3)`

### Chips / Status Badges

Height: `24px`  
Padding: `4px 10px`  
Radius: `--radius-sm` (8px)  
Font: `label` scale

| Status | Background | Text |
|---|---|---|
| PENDING | `#3D2810` | `#D4872A` |
| ACCEPTED | `#1A2D20` | `#4CAF7D` |
| READY | `#4CAF7D` at 20% | `#4CAF7D` |
| SENT | `--color-surface-raised` | `--color-text-secondary` |
| ISSUE | `#3D2810` | `#E8A838` |
| ว่าง (empty) | `--color-surface-raised` | `--color-text-secondary` |
| มีแขก (occupied) | `#1A2D20` | `#4CAF7D` |
| รอชำระ (awaiting payment) | `#3D2810` | `#D4872A` |
| ปิดโต๊ะ (closed) | `--color-surface` | `--color-text-disabled` |

### Bottom Navigation (Staff Mobile)

Height: `64px` + safe area  
Background: `--color-surface` with top border `--color-border`  
4 tabs: ออเดอร์ / ชำระเงิน / แขก / อื่นๆ  
Active: icon + label in `--color-accent`  
Inactive: icon + label in `--color-text-secondary`

### Top Bar (POS Desktop)

Height: `56px`  
Background: `--color-surface`  
Bottom border: `--color-border`  
Contains: venue name (left), notifications + profile (right)

### Left Sidebar (POS Desktop)

Width: `220px`  
Background: `--color-bg`  
Right border: `--color-border`  
Active nav item: `--color-accent-subtle` background, `--color-accent` text

---

## Layout Patterns

### Phone (Customer QR + Staff Mobile)

Viewport: `390×844` (iPhone 14 reference)  
Safe areas: respect `env(safe-area-inset-*)` for notch + home indicator  
Bottom nav: fixed, 64px + safe area  
Content scrolls behind nav — add `padding-bottom` equal to nav height

### POS Desktop (Tablet / Monitor)

Persistent shell:
```
[Top Bar 56px]
[Left Sidebar 220px] | [Main Content flex:1]
```
Right panel (session detail): `400px` fixed, slides over main content  
Payment: modal overlay, not full page  
Table grid: responsive CSS grid, min `160px` per cell

---

## Motion

| Purpose | Duration | Easing |
|---|---|---|
| Micro interactions (button press) | 80ms | ease-out |
| Panel slide (right panel) | 200ms | ease-out |
| Modal appear | 150ms | ease-out |
| Status chip update | 120ms | ease-in-out |
| Bottom sheet | 250ms | cubic-bezier(0.4, 0, 0.2, 1) |

> Keep motion subtle. Avoid bounces or spring animations — cozy, not playful.

---

## Iconography

Library: **Lucide Icons** (consistent with Tailwind ecosystem)  
Size: `20px` (nav), `16px` (inline), `24px` (feature icons)  
Stroke width: `1.5px`  
Color: inherits from text context

---

## Elevation / Layering

| Layer | z-index | Usage |
|---|---|---|
| Base | 0 | Page content |
| Raised | 10 | Cards, sidebars |
| Sticky | 20 | Top bar, bottom nav |
| Dropdown | 30 | Menus, tooltips |
| Modal backdrop | 40 | Payment modal overlay |
| Modal | 50 | Modals, bottom sheets |
| Toast | 60 | Notifications |

---

## Special Accents

- **Bottle-keep items:** Indigo accent `#8B93D4` — used for chips, icons, and borders on bottle-keep entries only
- **86'd items:** Show item name struck through (`text-decoration: line-through`), text in `--color-text-disabled`, no interaction
- **Cancelled order items:** Struck through, `--color-error` tint, remain visible for audit trail (do NOT hide)

---

## Canvas Artboards Reference

| Artboard | Content |
|---|---|
| Colors | Full color palette with token names |
| Typography | Sarabun scale examples in Thai + English |
| Components | Buttons, cards, inputs, chips, nav |
| Surfaces | Full-screen mockups per surface |

Canvas: https://claude.ai/artifact/3bffc3c8-7223-4803-bd39-bb74de243226

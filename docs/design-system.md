# Design System — The Loft Bar

**Status:** Established 2026-09-20  
**Canvas:** https://claude.ai/artifact/3bffc3c8-7223-4803-bd39-bb74de243226  
**Aesthetic:** Cozy loft — warm neutrals, amber accent. **Dark (default) + light theme**  
**Updated:** 2026-09-23 — light theme added (see DR-002)

---

## Color Tokens

Two themes share the same token names — components never reference a theme directly.
Dark is the default and the design reference; light is the "daylight / bright venue" variant.

| Token | Dark (default) | Light | Usage |
|---|---|---|---|
| `--color-bg` | `#1C1610` | `#FAF6EF` | Page/app background |
| `--color-surface` | `#2C2318` | `#FFFDF9` | Cards, panels, modals |
| `--color-surface-raised` | `#3A2F22` | `#F2EADD` | Elevated cards, dropdowns |
| `--color-border` | `#4A3B2A` | `#E3D6C2` | Dividers, input borders |
| `--color-text-primary` | `#F0E6D0` | `#2A2016` | Body text, headings |
| `--color-text-secondary` | `#A89070` | `#735E49` | Labels, captions, metadata |
| `--color-text-disabled` | `#6B5A48` | `#A8977F` | Disabled states |
| `--color-accent` | `#D4872A` | `#D4872A` | Primary CTA background (both themes — text on it is always `#1C1610`) |
| `--color-accent-text` | `#D4872A` | `#A5601A` | Accent used as **text/icon** (links, ghost buttons, active nav) |
| `--color-accent-subtle` | `#3D2810` | `#F6E6CF` | Accent background tint |
| `--color-success` | `#4CAF7D` | `#2A8055` | Confirmed, paid, ready states |
| `--color-success-subtle` | `#1A2D20` | `#E3F1E8` | Success chip background |
| `--color-warning` | `#E8A838` | `#9A6512` | ISSUE state, attention needed |
| `--color-warning-subtle` | `#3D2810` | `#F8EBD3` | Warning chip background |
| `--color-error` | `#E05A5A` | `#C23B3B` | Errors, cancelled items |
| `--color-error-subtle` | `#3A1C1C` | `#F9E1E1` | Error chip / danger button background |
| `--color-bottle-keep` | `#8B93D4` | `#5A62B0` | Bottle-keep accent (indigo) |
| `--color-bottle-keep-subtle` | `#262840` | `#E6E8F6` | Bottle-keep chip background |

> **Contrast (light):** every text/status token is ≥ 4.5:1 on `--color-bg` and `--color-surface` (checked 2026-09-23). `--color-text-disabled` is intentionally lower — disabled only.
> **Removed:** `--color-accent-light` → replaced by `--color-accent-text` (clearer name, one token per role).

---

## Theming

- **Library:** `next-themes` (web) — `attribute="class"`, `defaultTheme="dark"`, `enableSystem` (user may pick ธีมมืด / ธีมสว่าง / ตามระบบ).
- **Stored per device** (localStorage). **Not per venue** — no DB column.
- Tokens defined in `globals.css`: dark values on `:root, .dark`, light values on `.light`. Map them onto HeroUI v3 theme variables so HeroUI components follow the same palette.
- Never use `dark:` utilities for colors — expose the tokens through Tailwind v4 `@theme` (e.g. `bg-surface`, `text-accent-text`) so one class works in both themes. `dark:` only for rare non-color tweaks (e.g. image dimming).
- New in this revision (dark values too): `--color-accent-text`, `--color-success-subtle`, `--color-warning-subtle`, `--color-error-subtle`, `--color-bottle-keep-subtle`.
- Expo app: same token values, theme from the OS / in-app toggle (MB brief).

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
| Primary | `--color-accent` | `#1C1610` (both themes) | none | Main CTA (สั่งอาหาร, ชำระเงิน) |
| Secondary | `--color-surface-raised` | `--color-text-primary` | `--color-border` | Secondary actions |
| Ghost | transparent | `--color-accent-text` | none | Tertiary, inline actions |
| Danger | `--color-error-subtle` | `--color-error` | `--color-error` at 40% | Destructive actions |

Height: `48px` (touch), `40px` (desktop)  
Radius: `--radius-md` (10px)  
Font: `button` scale

### Cards

Background: `--color-surface`  
Border: `1px solid --color-border`  
Radius: `--radius-lg` (12px)  
Padding: `--space-5` (20px)  
Shadow: dark `0 2px 8px rgba(0,0,0,0.3)` · light `0 1px 4px rgba(42,32,22,0.08)`

### Chips / Status Badges

Height: `24px`  
Padding: `4px 10px`  
Radius: `--radius-sm` (8px)  
Font: `label` scale

| Status | Background | Text |
|---|---|---|
| PENDING | `--color-accent-subtle` | `--color-accent-text` |
| ACCEPTED | `--color-success-subtle` | `--color-success` |
| READY | `--color-success` at 20% | `--color-success` |
| SENT | `--color-surface-raised` | `--color-text-secondary` |
| ISSUE | `--color-warning-subtle` | `--color-warning` |
| ว่าง (empty) | `--color-surface-raised` | `--color-text-secondary` |
| มีแขก (occupied) | `--color-success-subtle` | `--color-success` |
| รอชำระ (awaiting payment) | `--color-accent-subtle` | `--color-accent-text` |
| ปิดโต๊ะ (closed) | `--color-surface` | `--color-text-disabled` |

> Tokens only — no raw hex in chips, so both themes work automatically.

### Bottom Navigation (Staff Mobile)

Height: `64px` + safe area  
Background: `--color-surface` with top border `--color-border`  
4 tabs: ออเดอร์ / ชำระเงิน / แขก / อื่นๆ  
Active: icon + label in `--color-accent-text`  
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
Active nav item: `--color-accent-subtle` background, `--color-accent-text` text

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

Library: **Lucide** — `lucide-react` (web), `lucide-react-native` (Expo). Brand logos (LINE) as SVG files, not an icon library (DR-002)  
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

- **Bottle-keep items:** `--color-bottle-keep` (indigo) + `--color-bottle-keep-subtle` — chips, icons, and borders on bottle-keep entries only
- **86'd items:** Show item name struck through (`text-decoration: line-through`), text in `--color-text-disabled`, no interaction
- **Cancelled order items:** Struck through, `--color-error` tint, remain visible for audit trail (do NOT hide)

---

## Canvas Artboards Reference

| Artboard | Content |
|---|---|
| Colors | Full color palette with token names — **dark only; light theme not yet drawn** |
| Typography | Sarabun scale examples in Thai + English |
| Components | Buttons, cards, inputs, chips, nav |
| Surfaces | Full-screen mockups per surface |

Canvas: https://claude.ai/artifact/3bffc3c8-7223-4803-bd39-bb74de243226

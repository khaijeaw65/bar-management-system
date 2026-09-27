# CD-01 — Developer handoff (from Claude Design, 2026-09-27)

Source: Claude Design project https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457 · artboards `CD-01/*` · **dark only** (light comes from CD-00).
Screenshots: `docs/design/assets/CD-01/` (see §6). Tokens: `docs/design-system.md` v2.
**Do not port Claude Design's JSX.** Build with HeroUI v3 + our tokens; the design is the visual/behaviour spec only.

## 1. Artboards, states, strings

### POS-login — default · redirecting · error
| # | String | Element |
|---|---|---|
| 1 | THE LOFT BAR | Brand eyebrow (Latin caps) |
| 2 | เดอะ ลอฟท์ บาร์ | Brand heading (display) |
| 3 | ระบบจัดการบาร์ | Subtitle |
| 4 | เข้าสู่ระบบด้วย LINE | LINE button (default, error) |
| 5 | กำลังเปลี่ยนเส้นทาง... | LINE button (redirecting, with spinner) |
| 6 | เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้ง | Alert body (error, danger, dismissible) |
| 7 | เฉพาะพนักงานที่ลงทะเบียนแล้ว | Footer caption |

### POS-not-registered — single state
บัญชีนี้ยังไม่ได้ลงทะเบียน (heading) · บัญชี LINE นี้ยังไม่ได้ลงทะเบียนเป็นพนักงาน · ติดต่อเจ้าของร้านเพื่อเพิ่มสิทธิ์ · วิธีขอสิทธิ์ (sub-heading) · 1. แจ้งชื่อและหน้าที่ให้เจ้าของร้าน · 2. รอการยืนยันทาง LINE · 3. เข้าสู่ระบบใหม่อีกครั้ง · กลับไปหน้าเข้าสู่ระบบ (secondary button, min-width 200).
Card 440 px, icon circle 64 px (`status-new-bg`, `warning`), instructions block `surface-input`.

### POS-shell — default view โต๊ะ
**Top bar:** THE LOFT BAR + เดอะ ลอฟท์ บาร์ (left, 1×20 divider) · shift chip `กะเปิด 18:00 · Beam (Manager)` (centre) · clock `HH:MM น.` (tabular) · notification bell · theme toggle · avatar `Beam` / `Manager` → dropdown `ออกจากระบบ`.
**Notification dropdown (sample):** แจ้งเตือน · ออเดอร์ใหม่ โต๊ะ 4 / 2× ช้างดราฟต์ / เมื่อกี้ · โต๊ะ 5 เรียกพนักงาน / 3 นาทีที่แล้ว · ปิดบิลโต๊ะ 2 สำเร็จ / 420 ฿ / 8 นาทีที่แล้ว.
**PosRail (top → bottom):**
| value | label | Lucide |
|---|---|---|
| tables | โต๊ะ | `grid-2x2` |
| orders | ออเดอร์ | `receipt-text` |
| pay | ชำระเงิน | `banknote` |
| menu | เมนู | `book-open` |
| guests | แขก | `users` |
| reports | รายงาน | `chart-column` |
| settings | ตั้งค่า | `settings` |
| (bottom) | — | `log-out` |
**Floor (โต๊ะ) view:** StatTiles (ยอดขายวันนี้ 18,420 ฿ +12% จากเมื่อวาน · บิลเปิดอยู่ 5 เฉลี่ย 736 ฿ · แก้วที่ขายแล้ว 132 ช้างดราฟต์ขายดีที่สุด · เวลาเสิร์ฟเฉลี่ย 4:20 เร็วขึ้น 40 วิ) + 10 TableTiles (โต๊ะ 1–6, บาร์ 1–4; states free / open / waiting=เรียกพนักงาน / paid=รอเก็บโต๊ะ). → designed properly in **CD-02**.

### POS-menu-list — loaded · loading · empty · error · no-result
**Toolbar:** SearchField `ค้นหาเมนู` · ตัวกรอง (button) · เพิ่มเมนูใหม่ (primary button) · chips ทั้งหมด (default selected) / เบียร์ / ค็อกเทล / อาหาร.
**Columns:** ชื่อ · หมวด · ราคา · สถานะ.
**Loaded sample (8 rows):** ช้างดราฟต์ เบียร์สด ฿120.00 พร้อมขาย · สิงห์ดราฟต์ เบียร์สด ฿140.00 · ลีโอขวด เบียร์สด ฿100.00 · เนโกรนี ค็อกเทล ฿240.00 · โอลด์แฟชั่น ค็อกเทล ฿260.00 · ไฮบอลมะนาวโซดา ไฮบอล ฿180.00 · ยำหมูยอ อาหาร ฿150.00 **หมด** · ถั่วทอดสมุนไพร อาหาร ฿80.00.
**Empty:** ยังไม่มีเมนู / เพิ่มเมนูใหม่ได้จากปุ่มด้านบน / button เพิ่มเมนูแรก.
**No result:** ไม่พบเมนูที่ค้นหา / ลองค้นหาด้วยคำอื่น หรือล้างตัวกรอง (no button).
**Error:** Alert danger — โหลดข้อมูลไม่สำเร็จ / เกิดข้อผิดพลาดในการดึงข้อมูลเมนู / inline link ลองอีกครั้ง.
**Loading:** 5 skeleton rows (shimmer 1.5 s).

### POS-session-expired — blocking modal over dimmed floor
หมดเวลาการใช้งาน · ระบบจะพาไปหน้าเข้าสู่ระบบใน [N] วินาที (5 → 0, progress bar 5 s) · button เข้าสู่ระบบอีกครั้ง (full width) · caption กรุณาเข้าสู่ระบบอีกครั้งเพื่อดำเนินการต่อ.

## 2. Layout specs
**Top bar:** height 56 (`bar-height`) · bg `clay-1000` opaque · bottom 1 px `line-hairline` · side padding **24** (`gutter-desktop`; CD drew 20 — use 24) · group gap 12 · eyebrow 700 13 px, letter-spacing .08em · shift chip h 28, padding 6×14, pill, `surface-raised` · clock 600 13 px tabular · avatar 36 px, status dot 7 px.
**PosRail:** width 88 · bg `clay-1000` · right 1 px `line-hairline` · top section 56 (brand) · bottom section 56 (log-out) · nav padding 8 0, item gap 2 · item 64×64, radius 10 · icon 22 px stroke 1.75 · label 600 10/1.2 · active bg `accent-soft-strong` + `text-accent` · inactive `text-faint` · badge 16×16 min, 700 10 px, bg `accent`.
**Menu toolbar:** padding 14 top / 24 sides · row 1: SearchField (flex 1, max 320, height 40) · ตัวกรอง · spacer · เพิ่มเมนูใหม่ · row 2 (gap 10 below): chips, gap 6.
**Table:** radius 12 (`r-card`), 1 px `line` border · header `bg-sunken`, sticky, 600 13 px `text-faint`, padding 9×16 · rows ≈ 41 px (padding 14×16) · hover `surface-hover` · ราคา right-aligned, tabular, `฿120.00` · สถานะ chip: พร้อมขาย = served tone, หมด = void tone.
**Radii:** login / not-registered card 16 (padding 40×32 / 48×40) · button 10 · dialog 16 · chips pill · notification dropdown 16 · avatar dropdown 12 · content padding 24.

## 3. Components → HeroUI v3
| Part | HeroUI v3 | Notes |
|---|---|---|
| Login / not-registered card | `Card` | `shadow-dialog` |
| Error message | `Alert` (danger, flat, dismissible) | |
| LINE button | `Button` primary lg | bg `#06C755` exception; `isPending` for redirecting (use HeroUI spinner, not custom CSS) |
| Back button | `Button` secondary md | |
| Shift chip | `Chip` | |
| Avatar + menu | `Avatar` md + `Dropdown` | |
| Notification bell | custom `NotificationBell` on `Dropdown`/`Popover` | badge max **99+** (align with CD-00) |
| Theme toggle | `Button isIconOnly` | Lucide `sun`/`moon`, not custom SVG |
| PosRail | custom | |
| StatTile, TableTile | custom | CD-02 |
| SearchField | `SearchField` | height 40 |
| Filter chips | `Chip` / `ToggleButtonGroup` | selectable |
| Menu table | `Table` | skeleton rows while loading |
| Status chip | `Chip` | tones from §4 of design-system |
| Empty / no-result | custom `EmptyState` | |
| Session expired | `Modal` / `AlertDialog` (non-dismissable) | scrim + countdown |

## 4. New in the CD project (from CD-01)
Components: Alert, Skeleton (shimmer `sk-shimmer` 1.5 s), Avatar (xs 20 / sm 24 / md 36 / lg 40 / xl 56, status dot), SearchField (40 px, clear button), PosRail, NotificationBell, DataTable. No new tokens.

## 5. Accepted deviations (Cowork default — Field may override at BRIEF approval)
| # | Deviation | Decision |
|---|---|---|
| 1 | Placeholder LINE glyph | Use the official LINE Login button asset in code |
| 2 | Brand as text, no logo | Accept (text brand) |
| 3 | Session expired = blocking modal, not toast | **Accept** — expiry blocks all actions |
| 4 | No Tabs in menu list | Accept |
| 5 | Top bar padding 20 | Use token 24 |
| 6 | No 1024 artboard | Accept — rail fixed 88, content 936 |
| 7 | Row height ≈ 41 | Accept |
| 8 | English sub-name under Thai menu name | **Drop** — `menu_item` has no English name column |
| 9 | Filter chips hard-coded | Build chips from the categories in the data |
| 10 | `08-menu-error.png` shows the error Alert **and** the empty state (ยังไม่มีเมนู + เพิ่มเมนูแรก) | **Design bug** — in code the error state shows the Alert + retry only; the empty state appears only on a successful empty response |
| 11 | "ARTBOARD STATE" switcher row on the menu artboards | Annotation only — **never build it** |

## 6. Screenshots (`docs/design/assets/CD-01/`, dark)
`01-login-states.png` · `02-not-registered.png` · `03-shell-floor.png` · `04-shell-notifications-open.png` · `05-menu-loaded.png` · `06-menu-loading.png` · `07-menu-empty.png` · `08-menu-error.png` · `09-menu-no-result.png` · `10-session-expired.png` — all present (2026-09-27). Menu screenshots include the annotation switcher row (§5 #11).

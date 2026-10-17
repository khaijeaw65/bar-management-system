---
id: CD-01
title: POS — login, shell (rail + top bar), menu list, session expired
revision: 2
status: review            # rev 1 = Claude Design 2026-09-27, ported 2026-10-09; rev 2 = CD template retrofit
approved_by: Field        # rev 1
approved_on: 2026-09-27   # rev 1
canvas: https://claude.ai/artifact/GDCe3opjPBQ7YxAZ6RwEBo
canvas_version: 1791642955-8107
ds_version: 1791561405-c72e
source: docs/design/source/CD-01/   # taken after rev 2 approval (§11)
surfaces: [web-pos]
sizes: [1280x800, 1024x768]
brief: CD-01-pos-login-shell-menu.md
drs: [DR-005, DR-007, DR-012]
depends_on: [CD-00, CD-13]
supersedes: brief paste text and acceptance where they conflict (see brief "Revisions")
---

# CD-01 — POS: login, shell, menu list, session expired

Built on The Loft Bar Design System (real DS components; Theme tweak dark/light per board; shared `PosFrame` with props rail / w / notifOpen / badges). **Do not port canvas markup** — build with HeroUI v3 + tokens (BRIEF-008 shell already merged; BRIEF-014 utilities). Sample data only.

## 0. Review items
| # | Item | Recommendation |
|---|---|---|
| R1 ✓ | **Pain point is an assumption:** shared device / password, nobody knows who voided or took cash, staff who left can still get in. Root shared with CD-14 R8 (no single place everyone sees). | Field: confirm or correct from the field visits. **Confirmed 2026-10-12** (field experience + research — `docs/research/Claude_verified_ops_findings.md`, DR-014). |
| R2 ✓ | **Not-registered copy (rev-1 port note P1):** "ส่งคำขอเข้าใช้งานถึงเจ้าของร้านแล้ว · เข้าสู่ระบบอีกครั้งเมื่อได้รับอนุมัติ" + 3 steps (CD-13 Q1 access requests). Same as CD-08 R1, which Field accepted. | Accept. **Accepted 2026-10-17** (Field). |
| R3 ✓ | **Menu list:** new column "ส่งไปที่" (บาร์ / ครัว — `menu_item.kitchen_tag`, required by DR-012) · new state menu·6 = 1024×768 + long names (1 line, "…") + no `menu:write` ("เพิ่มเมนูใหม่" hidden, read-only note). | Accept. **Accepted 2026-10-17** (Field). |
| R4 ✓ | **Session expired** stays a blocking modal (rev 1 deviation 3), but appears only when the refresh fails (logged out elsewhere, revoked, unused > 7 days for web — DR-005 / BRIEF-007), not on every access-token expiry. | Done (board note). |

## 1. Overview
- **Goal:** staff enter the POS with LINE in one tap, always see what needs attention (rail badges + notifications), and can check which menu items are available or sold out.
- **Pain point:** R1 (assumption).
- **User + context:** manager / cashier at shift start, 18:00 before opening, standing at the counter tablet; notifications keep arriving during the shift.
- **Entry → exit:** open the POS web app → `/login` → LINE → `/pos/tables` (CD-02). Rail → each surface's CD. Avatar menu → ออกจากระบบ → `/login`.
- **Outcome:** 1 tap to log in (assumes the LINE app/session is already signed in on the device); every action afterwards carries a real staff identity; an unregistered LINE account gets no data but the owner gets an access request.
- **Out of scope:** password / PIN login, multi-venue, menu editing (CD-12), table grid (CD-02), offline.
- **Journeys:** J1 login → home → menu list (E1–E2) · J2 unregistered LINE → request sent → back to login (E1–E2).

## 2. Boards
| Board | Type | States |
|---|---|---|
| `overview` | OVERVIEW | goal, pain point (R1), user/context, outcome, entry/exit, journeys, out of scope, key decisions |
| `journey-1` | JOURNEY | login (E1 LINE) → redirecting → (system: LINE OK) → home rail โต๊ะ (E2 rail เมนู) → menu list |
| `journey-2` | JOURNEY | login (E1 LINE) → not registered, request sent (E2 กลับ) → login |
| `login` | STATES | 1 default · 2 redirecting · 3 error · 4 not registered (request sent) |
| `shell` | STATES | 1 default (rail โต๊ะ) · 2 notifications open |
| `menu-list` | STATES | 1 loaded · 2 loading · 3 empty · 4 error + retry · 5 no result · 6 1024×768 + long names + read-only |
| `session-expired` | STATES | countdown modal |
| `flow` | FLOW MAP | login · special cases · during use |

## 3. State coverage
| State | Login | Shell | Menu list | Session expired |
|---|---|---|---|---|
| default | ✓ ·1 | ✓ ·1 | ✓ ·1 | ✓ |
| loading | ✓ ·2 (redirecting) | n/a (shell renders from session) | ✓ ·2 | n/a |
| empty | n/a | n/a | ✓ ·3 / ·5 no result | n/a |
| error + retry | ✓ ·3 | rule: notifications fail → bell shows no badge, list "โหลดการแจ้งเตือนไม่สำเร็จ" + retry | ✓ ·4 | n/a |
| validation | n/a | n/a | n/a | n/a |
| pending | ✓ ·2 | n/a | n/a | rule: button isPending |
| success feedback | ✓ J1·3 (lands on home) | n/a | n/a | n/a |
| failure per reason | ✓ ·3 `login_failed` · ·4 `not_registered` | n/a | ✓ ·4 | n/a |
| stale / conflict | n/a | realtime badges (rule) | rule: refetch on `menu.availability_changed` | n/a |
| disconnected | n/a | rule: CD-02 banner pattern | rule: same banner pattern | n/a |
| permission denied | ✓ ·4 | rule: rail items without permission hidden | ✓ ·6 | n/a |
| long Thai text | n/a (fixed copy) | rule: shift chip `nowrap`, name truncates | ✓ ·6 | n/a |
| smallest size | rule (card 440 centred, fits) | rule (rail 88 fixed, content 936) | ✓ ·6 1024×768 | rule |
| keyboard open | n/a | n/a | rule: search field on tablet keyboard — list scrolls, toolbar stays | n/a |
| session expired | — | — | — | ✓ (global) |

## 4. Action table
| Action | API (status) | Permission | Success → UI | Failure → UI | Recovery | Data kept | Idempotency |
|---|---|---|---|---|---|---|---|
| Log in | `GET /auth/line/login` → `/auth/line/callback` (available, BRIEF-007) | public | cookies set → `/pos/tables` | `?error=login_failed` → login·3 · `?error=not_registered` → login·4 | retry · wait for approval | — | state single-use (BRIEF-007) |
| Create access request | on `not_registered` callback → `staff_access_request` row (schema ✓; creation **planned** with CD-13 / IAM brief — BRIEF-007 only logs the LINE sub today) | public | login·4 copy (R2) | — | — | — | one pending request per LINE id |
| Load session | `GET /auth/me` (available, BRIEF-007) | session | shell with name, role, permissions | 401 → refresh → fail → session-expired | log in again | — | n/a |
| Refresh | `POST /auth/refresh` (available, BRIEF-007) | refresh cookie | silent | reuse / revoked / expired → session-expired modal | log in | — | rotation + reuse detection |
| Log out | `POST /auth/logout` (available, BRIEF-007) | session | `/login` | network → still clear client state, go to `/login` | — | — | n/a |
| Notifications | `GET /notifications` + WS `notification.created` (planned, DR-003 notifications brief) | per-type permission | bell list + badge | error → list error + retry (rule) | retry | — | n/a |
| Load menu list | `GET /menu/items`, `GET /menu/categories` (planned, menu-management brief) | `menu:read` | menu·1 | network → menu·4 | ลองอีกครั้ง | search + chip | n/a |
| Add menu | → CD-12 editor | `menu:write` (hidden without, menu·6) | — | — | — | — | — |

## 5. e2e script
- **J1** E1 tap "เข้าสู่ระบบด้วย LINE" → button pending "กำลังเปลี่ยนเส้นทาง..." → (LINE mocked) callback sets cookies → `/pos/tables`, rail โต๊ะ active, top bar shows "Beam (Manager)" · E2 tap rail "เมนู" → menu list loads; ยำหมูยอ shows "หมด"; column "ส่งไปที่" shows ครัว for food.
- **J2** E1 tap LINE with an unregistered identity → callback `not_registered` → not-registered card, no shell rendered, no menu/table data requested · E2 tap "กลับไปหน้าเข้าสู่ระบบ" → `/login`.
- **Edge:** refresh-token reuse → session-expired modal, countdown 5 s → `/login` · user without `menu:write` → no "เพิ่มเมนูใหม่".

## 6. Strings & sample data
Rev 2 new (**bold**): **column "ส่งไปที่", values บาร์ / ครัว** · **"ดูอย่างเดียว — แก้เมนูต้องใช้สิทธิ์ menu:write"** · notifications use seat labels **"ออเดอร์ใหม่ T4" · "T5 เรียกพนักงาน" · "ปิดบิล T2 สำเร็จ"** (was "โต๊ะ 4" etc.). Not-registered copy per R2. Rev-1 strings:

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


## 7. Layout & tokens
**Top bar:** height 56 (`bar-height`) · bg `clay-1000` opaque · bottom 1 px `line-hairline` · side padding **24** (`gutter-desktop`; CD drew 20 — use 24) · group gap 12 · eyebrow 700 13 px, letter-spacing .08em · shift chip h 28, padding 6×14, pill, `surface-raised` · clock 600 13 px tabular · avatar 36 px, status dot 7 px.
**PosRail:** width 88 · bg `clay-1000` · right 1 px `line-hairline` · top section 56 (brand) · bottom section 56 (log-out) · nav padding 8 0, item gap 2 · item 64×64, radius 10 · icon 22 px stroke 1.75 · label 600 10/1.2 · active bg `accent-soft-strong` + `text-accent` · inactive `text-faint` · badge 16×16 min, 700 10 px, bg `accent`.
**Menu toolbar:** padding 14 top / 24 sides · row 1: SearchField (flex 1, max 320, height 40) · ตัวกรอง · spacer · เพิ่มเมนูใหม่ · row 2 (gap 10 below): chips, gap 6.
**Table:** radius 12 (`r-card`), 1 px `line` border · header `bg-sunken`, sticky, 600 13 px `text-faint`, padding 9×16 · rows ≈ 41 px (padding 14×16) · hover `surface-hover` · ราคา right-aligned, tabular, `฿120.00` · สถานะ chip: พร้อมขาย = served tone, หมด = void tone.
**Radii:** login / not-registered card 16 (padding 40×32 / 48×40) · button 10 · dialog 16 · chips pill · notification dropdown 16 · avatar dropdown 12 · content padding 24.

- Smallest size **1024×768**: rail 88 fixed, content 936; menu table name column flexes and truncates ("…").

## 8. Components → platform (HeroUI v3)
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


## 9. Behaviour rules
- **Login:** only LINE (BRIEF-007). The redirecting state disables the button. Errors from the callback query (`login_failed`, `not_registered`) map to login·3 / ·4; the error Alert is dismissible.
- **Not registered:** no shell, no data; the access request is created server-side (CD-13); the card names the LINE display name so the owner can match it (R2).
- **Session:** access token refreshes silently; the session-expired modal appears only when refresh fails; it cannot be dismissed; countdown 5 s or the button → `/login` (R4).
- **Rail:** items the user has no permission for are hidden (not disabled); badges come from realtime counts (orders = new tickets).
- **Menu list:** chips built from categories in the data (rev 1 deviation 9); single-select, "ทั้งหมด" default; search trims, matches substring of the Thai name, case-insensitive for Latin; search + chip combine; clearing search keeps the chip. Error state = Alert + retry only (rev 1 bug 10). Sold-out = "หมด" void tone + dot; station column from `kitchen_tag` (R3).
- **Accepted deviations from rev 1 (still valid):**
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

- **Standard questions (`cd-template.md` §5):** Filters → single select, ทั้งหมด default, counts not shown. Search → trimmed, substring, Thai as typed; clear button resets the query only. Long and short → 1024×768 smallest; long names truncate in the table; 0 items → empty state. Interaction → DS pressed / disabled / pending; no hover dependency (touch). Accessibility → rail = nav with labelled items; bell button labelled "การแจ้งเตือน (2)"; table has header cells. Data → menu rows from `GET /menu/items`; missing category → "ไม่มีหมวด"; missing station only possible for charge items (shown "—").
- **User-mindset checks:** ✓ one dominant action (LINE button / table) · ✓ targets (rail 64, button 52) · ✓ acknowledgement (redirecting state) · ✓ no destructive action here · ✓ errors say how to fix · ✓ "1 tap to log in" with its assumption · ✓ status not by colour alone ("หมด" text) · ✓ long Thai drawn (menu·6) · ☐ walkthrough.

## 10. Revisions
| Rev | Date | Change | Authority |
|---|---|---|---|
| 1 | 2026-09-27 | Claude Design boards (login, not-registered, shell, menu list, session expired) + accepted deviations 1–11 | Field |
| 1 | 2026-10-09 | Ported to the Design canvas; P1 not-registered copy (now R2) | Cowork |
| 2 | 2026-10-10 | CD template retrofit: overview, J1 / J2, pills + sections, menu "ส่งไปที่" column (DR-012), menu·6 (1024×768, long names, read-only), notifications use T-labels, `style`-on-DS-component fixes (Alert, Button, SearchField), PosFrame width prop | Field (R4) · R1–R3 pending |

## 11. Source snapshot
Pending — after Field approves rev 2 (`cd-template.md` §6). Lucide blob `/_blob/178d08a315f08b7cd6a9e308d6f49126` (CD-01 only). Screenshots in `docs/design/assets/CD-01/` are rev-1 Claude Design exports (stale).

# CD-01 — POS: login, not-registered, app shell, menu list

**Status:** Ready for Claude Design (after CD-00, or together if short on time) · **Surface:** web desktop/tablet (min width 1280 px; also show 1024 px) · **Used by:** BRIEF-008 (Methee, first frontend brief) and BRIEF-007 (auth redirects)

## Attach
**Open inside the existing Claude Design project:** https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457
`docs/design-system.md` · CD-00 result · `docs/briefs/ui/pos-desktop.md` (Screen 1, Shell, Screen 5) · screenshots `docs/handoffs/assets/BRIEF-005/menu-*.png` (current `/pos/menu`)

## Paste into Claude Design
> Using the **The Loft Bar** design system (CD-00), design the POS desktop entry and shell. Thai copy, Noto Sans Thai, semantic tokens only (`docs/design-system.md` v2), **dark and light** for each artboard. Build with HeroUI v3 components only (Button, Card, Alert, Table, Chip, SearchField, Tabs, Skeleton, Toast, Avatar, Dropdown) plus the custom PosRail; name the HeroUI component on each part.
>
> 1. **POS-login** — centred card, no shell. Logo + "The Loft Bar" + "ระบบจัดการบาร์"; LINE button (LINE green `#06C755` is the only allowed brand exception, white LINE logo SVG) "เข้าสู่ระบบด้วย LINE"; footer "เฉพาะพนักงานที่ลงทะเบียนแล้ว". States: default, redirecting (button loading), **error** `?error=login_failed` → inline error "เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้ง".
> 2. **POS-not-registered** — shown for `?error=not_registered`: friendly message "บัญชี LINE นี้ยังไม่ได้ลงทะเบียนเป็นพนักงาน", instruction "ติดต่อเจ้าของร้านเพื่อเพิ่มสิทธิ์", button "กลับไปหน้าเข้าสู่ระบบ". No technical IDs on screen.
> 3. **POS-shell** — top bar 56 px (logo+name left; shift chip centre "กะเปิด 18:00 · Beam (Manager)"; right: live clock, notification bell with badge, theme segmented control, avatar menu with "ออกจากระบบ"); left **PosRail 88 px** (items 64×64, Lucide icon + 10 px label): โต๊ะ, ออเดอร์, ชำระเงิน, เมนู, แขก, รายงาน, ตั้งค่า (active = `accent-soft` bg + `text-accent`; ออเดอร์ shows a count badge). Same rail at 1024 px.
> 4. **POS-menu-list** — inside the shell, nav "เมนู / สต็อก" active. Read-only HeroUI `Table` of items: ชื่อ, หมวด, ราคา (`฿120.00`, tabular numerals), สถานะ `Chip` (พร้อมขาย / หมด). Toolbar: search "ค้นหาเมนู", category filter chips (ทั้งหมด, เบียร์, ค็อกเทล, อาหาร). States: **loaded** (8 rows incl. one หมด), **loading** skeleton, **empty** "ยังไม่มีเมนู", **error** "เกิดข้อผิดพลาด" + "ลองอีกครั้ง", **search no result** "ไม่พบเมนูที่ค้นหา".
> 5. **POS-session-expired** — toast/banner when the session expires mid-use: "หมดเวลาการใช้งาน กรุณาเข้าสู่ระบบอีกครั้ง" → redirect to login.
> 6. **Flow board CD-01-flow** — arrows: login → (LINE) → shell/โต๊ะ; login → not-registered → login; any page → session expired → login; sidebar → menu list states.

## Acceptance (Field checks)
- Every state above drawn in dark + light; 1280 and 1024 widths for shell and menu list.
- Uses only CD-00 components (toast, alert/banner, skeleton, empty/error, chips) — each maps to HeroUI v3.
- POS rail is 88 px (not a 220 px sidebar).
- Copy exactly Thai as written (or improved Thai noted in Result).

## Result
- Claude Design link: <paste>
- Copy changes: <none / list>

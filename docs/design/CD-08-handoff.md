# CD-08 — Developer handoff: Staff app core (Cowork Design canvas, 2026-10-09)

Source: Design canvas "CD-08 Staff App Core" https://claude.ai/artifact/E1EzrLh3piE3esih4VyRwB (built by Cowork on The Loft Bar Design System https://claude.ai/artifact/AXVdDV921SWCiAxGJxD78D, real DS components mounted) · brief `CD-08-staff-app-core.md` (D1–D4).
**Status: pending Field review.** Every board has a **Theme tweak (dark / light)** — flip it in the Tweaks panel; light boards are not drawn separately.
**Do not port the canvas markup.** Build with HeroUI Native + Uniwind + tokens (`docs/rules/mobile.md`). Sample data only.

## 0. Review items for Field
| # | Item | Recommendation |
|---|---|---|
| R1 | **Not-registered login** now says "ส่งคำขอเข้าใช้งานถึงเจ้าของร้านแล้ว" (ties to CD-13 Q1 access requests) instead of "ติดต่อเจ้าของร้าน". | Accept — the rejected LINE login creates a `staff_access_request`. |
| R2 | **LINE button** = `--brand-line` with white text (~2:1 contrast). Brand-mandated by LINE, kept as the DS defines it. | Accept (third-party brand rule). |
| R3 | DS **Button has no success variant** → "เสิร์ฟแล้ว" uses `primary` (still the one committing action). | Accept. |
| R4 | **Phone seat tiles are a custom SeatTile** (Card + StatusChip), not DS `TableCard` — TableCard compact is 120 px wide and doesn't fit a phone. **Counters 3 per row** (fixed 2026-10-09: at 4 per row the ไม่เคลื่อนไหว chip overflowed), tables 2 per row; chip max-width 100% of the tile. Compact chips use the DS short labels (ไม่เคลื่อนไหว · เรียก, F2). | Accept; build `SeatTile` in `app/mobile/src/components/table/`. |
| R5 | **Escalated issue**: info chip "ส่งให้ POS แล้ว", only "แก้แล้ว ทำต่อ" remains. | Accept (POS side = CD-15). |

## 1. Boards (all 390×844, states side by side)
| Board | States |
|---|---|
| `login` | default · signing in (Spinner, label kept) · error Alert danger "เข้าสู่ระบบไม่สำเร็จ" · not registered (request sent, LINE name chip, "กลับไปหน้าเข้าสู่ระบบ") |
| `queue` | loaded (oldest first, filter chips with counts, issue dot) · loading Skeleton · empty "ยังไม่มีออเดอร์ใหม่" · error Alert + "ลองอีกครั้ง" · new order (Toast info "ออเดอร์ใหม่ T5", new card accent border, tab badge) · disconnected Alert warning |
| `detail` | ใหม่ · กำลังทำ · พร้อมเสิร์ฟ (one primary) · เสิร์ฟแล้ว (no actions, "เสิร์ฟเมื่อ …") · isPending · 409 Toast "ออเดอร์นี้ถูกอัปเดตจากเครื่องอื่นแล้ว" |
| `issue` | report BottomSheet (reason Radio ของหมด/อุปกรณ์มีปัญหา/อื่นๆ, item Radio, TextField required for อื่นๆ) · issue state (Alert, "ส่งให้ POS" / "แก้แล้ว ทำต่อ", helper "การลบหรือยกเลิกรายการทำที่ POS") · escalated |
| `tables` | loaded (counters 3/row, tables 2/row) · call-staff (T2 accent skin + sticky Toast "รับทราบ") · T3 summary BottomSheet ("ชำระเงินและปิดโต๊ะทำที่ POS") · loading · empty |
| `more` | profile (Avatar, role chip, shift) · list (การแจ้งเตือน, ธีม ตามระบบ, เวอร์ชัน) · logout Dialog "ออกจากระบบ?" |
| `notifications` | first-run permission · lock-screen push copy (3 examples) · in-app sticky call-staff Toast |
| `flow` | 3 rows: bartender main path · shortcuts/status · tables & account |

## 2. Strings (exact)
Tabs: ออเดอร์ · โต๊ะ · อื่นๆ. Filters: ทั้งหมด n · ใหม่ n · กำลังทำ n · พร้อมเสิร์ฟ n · มีปัญหา n. Card actions: รับออเดอร์ · พร้อมแล้ว · เสิร์ฟแล้ว · ดูปัญหา. Detail footer: รายงานปัญหา + (รับออเดอร์ | พร้อมแล้ว) · เสิร์ฟแล้ว. Issue: รายงานปัญหา · สาเหตุ · ของหมด · อุปกรณ์มีปัญหา · อื่นๆ · รายการที่มีปัญหา (ไม่บังคับ) · รายละเอียด ("ต้องกรอกเมื่อเลือก อื่นๆ") · ยกเลิก · มีปัญหากับออเดอร์นี้ · แก้แล้ว ทำต่อ · ส่งให้ POS · ส่งให้ POS แล้ว. Toasts: ออเดอร์ใหม่ T5 / "3 รายการ · ต่อท้ายคิวแล้ว" · T2 เรียกพนักงาน + รับทราบ · ออเดอร์นี้ถูกอัปเดตจากเครื่องอื่นแล้ว / "แสดงสถานะล่าสุดแล้ว ตรวจก่อนกดอีกครั้ง". Alerts: โหลดออเดอร์ไม่สำเร็จ · การเชื่อมต่อขาด / "ข้อมูลอาจไม่อัปเดต กำลังเชื่อมต่อใหม่". Push: "ออเดอร์ใหม่ · T5" "สิงห์ดราฟต์ 2× · โอลด์แฟชั่น" · "T2 เรียกพนักงาน" "ขอเช็คบิล" · "ออเดอร์ #0042 พร้อมเสิร์ฟ" "T3 · ต้น". Permission: เปิดการแจ้งเตือน · "รับแจ้งเมื่อมีออเดอร์ใหม่หรือลูกค้าเรียกพนักงาน แม้ไม่ได้เปิดแอป" · ไว้ทีหลัง · "เปลี่ยนได้ภายหลังที่ อื่นๆ › การแจ้งเตือน". Logout: ออกจากระบบ? · "เครื่องนี้จะไม่ได้รับการแจ้งเตือนออเดอร์จนกว่าจะเข้าสู่ระบบอีกครั้ง".

## 3. Layout
Header top pad 56 (safe area), title `--text-title`; filter chips 44 high pill; cards `Card` padding 14, gap 12, gutter 16; tab bar `--surface-bar` + blur, 3 items, icon 20, label micro; sticky footer padding 12/16/28 with `--shadow-sheet`, buttons lg 52 (row: danger flex 1 + primary flex 1.4); BottomSheet radius `--r-sheet` 20, grab 36×4; seat tiles 84 (counter) / 104 (table) high, radius `--r-card`.

## 4. Components → HeroUI Native
Button (primary/secondary/ghost/danger, md 44 / lg 52, isPending) · Card · Chip (StatusChip order/item/table/menu, Badge info) · Alert · Toast (duration 0 for call-staff + 409) · Skeleton · BottomSheet · Dialog · RadioGroup · TextField · Avatar · Spinner · Expo Router Tabs (themed). Custom: **SeatTile**, order card composition, lock-screen preview (copy only).

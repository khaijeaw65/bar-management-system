---
id: CD-11
title: Journey boards + notifications end-to-end (CD-10 merged) — presentation set
revision: 1
status: review
approved_by:
approved_on:
canvas: https://claude.ai/artifact/PpcMLoSNUudmcQU3kiYDsG
canvas_version: 1791711971-521d
ds_version: 1791561405-c72e
source: docs/design/source/CD-11/   # taken after approval (§11)
surfaces: [presentation]
sizes: [1920x1080]
brief: CD-11-journeys-notifications.md
drs: [DR-009, DR-011, DR-012]
depends_on: [CD-02, CD-03, CD-04, CD-05, CD-06, CD-07, CD-08, CD-12, CD-13, CD-15]
supersedes: brief paste text and acceptance where they conflict (see brief "Revisions")
---

# CD-11 — Journey boards + notifications (presentation set)

Seven 1920×1080 boards for the 8 Nov gate demo and the advisor presentation, **composed only from existing screens** — no new UI. The canvas has two pages:
- **ชุดนำเสนอ** — the 7 boards (dark default; each board has a Theme tweak for light).
- **Sources (copied)** — copies of the real components from CD-02 / 03 / 05 / 06 / 07 / 08 / 12 / 13 / 15, renamed with a canvas prefix (`c02_Grid`, `c15_Drawer` …). State boards from CD-02 / 03 / 08 got one extra prop `idx` that renders a single frame without the board chrome ("solo"); nothing else in them changed. Asset ids were re-pointed to this canvas's copies (Lucide, menu photos, QR).

**Do not edit the sources here** — fix the source CD, then re-copy (R1). This is not a build spec; build from each CD's own handoff.

## 0. Review items
| # | Item | Recommendation |
|---|---|---|
| R1 ✓ | **Built before the other reviews closed.** Boards use component copies at today's versions (§11). When Field approves changes in any CD, re-copy all sources in one pass before exporting. | Accept; re-copy before 8 Nov export. **Accepted 2026-10-17** (Field). |
| R2 ✓ | **Sample data doesn't line up across CDs:** walk-in customer is T3 while the staff queue shows T5 / #0039 · issue path ends on the T3 bill (เนโกรนี cancelled) instead of T2 ยำหมูยอ · admin: CD-12 marks ยำหมูยอ sold out, CD-06 shows ถั่วทอดสมุนไพร sold out · counter split / cash frames are the CD-03 T3 bill. Captions say "(ตัวอย่าง…)". | Field: accept captions, or add matching states to CD-06 / CD-03 / CD-08 later. **Accepted 2026-10-17** (Field): keep "(ตัวอย่าง…)" captions, no redraw. |
| R3 ✓ | **DR-009 notification table needs an amendment:** "Order ready → POS item chip" conflicts with DR-012 (no per-item progress chips; the ticket chip shows พร้อมเสิร์ฟ) · the brief's row "เมนูหมด" isn't a DR-009 event — shown as a footnote (greyed everywhere via `menu.availability_changed`) · the staff-app push for an idle table has no copy in CD-08 yet — drawn as "T4 ไม่มีความเคลื่อนไหว 25 นาที" (proposal). | Amend DR-009 (Field decision). **Accepted 2026-10-17** (Field): DR-009 Amendment 1 (all 3 items). |
| R4 ✓ | **Counter journey uses C3**, the free counter seat in the CD-02 sample, instead of the brief's C2 (C2 is occupied in the sample). | Accept. **Accepted 2026-10-17** (Field). |

## 1. Boards
| Board | Story | Composed from |
|---|---|---|
| `overview` | 4 surfaces side by side + Semester 2 teaser | CD-06 menu · CD-08 queue · CD-02 POS grid · CD-12 list (desktop) + CD-05 overview (phone) |
| `journey-walkin` | scan → order → queue buzzes → marked ready → customer sees พร้อมเสิร์ฟ → POS drawer | CD-06 welcome / cart / tab ready · CD-08 queue (new order, ready button) · CD-02 grid + panel |
| `journey-pay` | **headline:** PromptPay QR → bank webhook card "ธนาคารยืนยัน — ปลอมสลิปไม่ได้" (visual centre) → customer done → POS toast → table closes; manual-confirm side path flagged for the owner | CD-07 qr pending / done · CD-03 done · CD-02 close-confirm · CD-03 manual-confirm + CD-05 reference |
| `journey-counter` | open C3 → order at POS → split or cash → close | CD-02 open-table · CD-04 order (CD-15 copy with `table`) · CD-03 split / cash · CD-02 close-confirm |
| `notifications` | DR-009 matrix: events × surfaces, real component cells (Toast, StatusChip, TableCard, push copy) | copy from CD-02 / 06 / 07 / 08 / 15; footnote for เมนูหมด |
| `issue` | kitchen reports sold out → sends to POS → manager sees issue → void with reason + PIN → customer bill shows the cancelled line | CD-08 issue · CD-15 board + drawer + void modal · CD-06 tab |
| `admin` | owner on the phone: revenue → approve new staff → 86 an item → customer menu greys it | CD-05 · CD-13 · CD-12 · CD-06 |

Each board: pill + title + one-line subtitle, role chips (ลูกค้า · พนักงาน (แอป) · POS · เจ้าของ / ผู้จัดการ), numbered arrows, one-line captions, and the source CD under every screen.

## 2. Presentation rules
- Screens are scaled instances, never redrawn: phones 0.5–0.62, POS 0.34–0.42, back office 0.3.
- Only the webhook card, the matrix grid and the captions are presentation markup; every screen is a real component.
- Export: each board as PNG 1920×1080 (dark) → `docs/design/assets/CD-11/` after approval; the deck reuses them.

## 3. Notification matrix (as drawn, per DR-009 + R3)
| Event | Staff app | POS | Back office | Customer |
|---|---|---|---|---|
| ออเดอร์ใหม่ | push + queue | Toast + rail badge | — | status ส่งแล้ว |
| เรียกพนักงาน | push | Toast (stays until acknowledged) | — | — |
| พร้อมเสิร์ฟ | push (server) | ticket chip พร้อมเสิร์ฟ (DR-012) | — | status + Toast |
| ชำระแล้ว | — | Toast | feed | ชำระครบแล้ว |
| โต๊ะไม่เคลื่อนไหว | push (copy proposed, R3) | idle card + Alert | — | — |
| สต็อกต่ำ / ขอเติม | — | S2 | S2 | — |

## 10. Revisions
| Rev | Date | Change | Authority |
|---|---|---|---|
| 0 | 2026-10-09 | Brief; CD-10 merged into CD-11 | Field |
| 1 | 2026-10-11 | 7 presentation boards composed from copied components; Sources page; R1–R4 raised | Cowork — review pending |

## 11. Source snapshot
Pending — after Field approves rev 1. Component copies taken 2026-10-11 from: CD-02 `1791644102-686c` · CD-03 `1791644100-e257` · CD-08 `1791642402-add2` · CD-06 `1791708052-d3a9` · CD-07 `1791708326-9c5a` · CD-15 `1791708749-c85a` · CD-12 `1791711808-d035` · CD-13 `1791711811-7aff` · CD-05 `1791711450-7294` (CD-04 order screen via the CD-15 copy). Lucide UMD `/_blob/fbd1010b73666a50e9262334cd408a0b`.

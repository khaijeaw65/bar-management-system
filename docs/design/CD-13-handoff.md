---
id: CD-13
title: Back office — tables & QR setup, staff, groups, policies (IAM, time-bound membership)
revision: 1
status: review
approved_by:
approved_on:
canvas: https://claude.ai/artifact/PF5pdKMY4b2w1oaunrHJH3
canvas_version: 1791711811-7aff
ds_version: 1791561405-c72e
source: docs/design/source/CD-13/   # taken after approval (§11)
surfaces: [web-backoffice]
sizes: [1280x800, 1024x768, 390x844]
brief: CD-13-backoffice-tables-staff.md
drs: [DR-005, DR-009]
depends_on: [CD-01, CD-02, CD-12]
supersedes: brief paste text and acceptance where they conflict (see brief "Revisions")
---

# CD-13 — Back office: tables & QR, staff, groups, policies

Built on The Loft Bar Design System (real DS components; dark/light Theme tweak on every board). **Do not port canvas markup** — build with HeroUI v3 + tokens. Sample data only. One shared child `Screen` (props `device` desk / phone · `screen` settings / tables / print / staff / detail / groups / group / policies / policy · `state` · `nav` · `ring` · `w` / `h`) renders the CD-12 shell (rail "ตั้งค่า") and the page.

## 0. Review items
Brief Q1–Q2, D1–D4 apply (§10). Rev-1 items:

| # | Item | Recommendation |
|---|---|---|
| R1 | **Pain point is an assumption** (same as CD-01 R1): shared device / password, nobody knows who voided or took money, ex-staff can still log in, no way to give temporary manager rights. | Field: confirm or correct. |
| R2 | **Policy matrix:** the brief's fixed columns (ดู · สร้าง · แก้ไข · ยกเลิก · จัดการ) don't match the real permission catalog (`menu:toggle_availability`, `payments:mark_paid`, `visits:open/close` …). Drawn as one row per resource with a checkbox per real permission (Thai label + code) and a row "ทั้งหมด"; phone = one card per resource with Switches. | Accept. |
| R3 | **"ถึงสิ้นกะคืนนี้" = 06:00 next day** (business-day cut-off, as DR-013), Asia/Bangkok — not tied to a shift-close event (shift close = S2). | Field: confirm 06:00, or end at shift close later. |
| R4 | **Rejected request, then the person logs in again:** `staff_access_request` is UNIQUE (provider, external_id), so it stays `rejected` and doesn't reappear. Proposal: a "คำขอที่ปฏิเสธ (n)" link to reopen one. Alternative: a new login flips it back to `pending`. | Field decides. |
| R5 | **Tables:** sections เคาน์เตอร์ / โต๊ะ (2 columns at 1280) instead of a kind chip on every row · "พิมพ์ QR (n)" disabled until something is ticked · inactive seat = its QR stops working (CD-06 "QR ไม่ถูกต้อง") · seat with guests can't be deactivated. | Accept. |
| R6 | **Rules / states beyond the brief:** self-deactivate blocked (Switch disabled + Toast) · deactivate revokes refresh tokens on every device, including the 30-day mobile token (DR-005 A2) · expired membership struck "หมดอายุ" · delete-group dialog lists permissions that would be lost (computed most-permissive-wins) · policy in use by many → warning Alert. | Accept. |
| R7 | **Needs API (IAM brief):** 1) `GET /staff/access-requests`, `POST …/:id/approve {displayName, memberships[]}`, `POST …/:id/reject` · 2) memberships with `validUntil` · 3) `409 IAM_LOCKOUT` (no one left with `staff:manage` / last owner), `409 SELF_DEACTIVATE` · 4) deactivate → revoke sessions · 5) `409 SEAT_LABEL_TAKEN`, `409 SEAT_IN_USE` · 6) `GET /staff/:id/effective-permissions` with source per permission. | Add to the IAM brief. |
| R8 | **DS gaps:** no DatePicker / TimeInput (Input + icon used), Dropdown menu, Modal frame; Avatar shows initials (real build uses LINE `avatar_url`); A4 print preview drawn from tokens. | Add to DS, or use HeroUI directly. |

## 1. Overview
- **Goal:** owner / manager set up seats and print QR codes, let new staff in from a LINE login request, and give rights by group — permanent or until the end of the night.
- **Pain point:** see R1.
- **User + context:** owner / manager · first setup at a computer (seats, QR, groups) · during the night on a phone: approve a new hire, hand over manager rights before leaving.
- **Entry → exit:** rail / nav drawer "ตั้งค่า" → cards (โต๊ะและ QR · พนักงาน · กลุ่ม · นโยบายสิทธิ์ · ร้าน "เร็วๆ นี้"); subpages switch with Tabs (≥ 1024) or back (390). Requests come from CD-01 J2. Changes apply at once (Redis ACL invalidation); new / regenerated QR → CD-06.
- **Outcome:** every person has their own account · approve = 3 taps · temporary manager = 4 taps, expires by itself · deactivate signs out everywhere · the shop can't lock itself out.
- **Out of scope:** deny rules, shop settings, billing, shift cash-out, audit log viewer, LINE OA.
- **Journeys:** J1 1280 approve ฝน into บาร์เทนเดอร์ (E1–E3) · J2 390 give เจ ผู้จัดการ until end of shift (E1–E4).

## 2. Boards
| Board | Type | States |
|---|---|---|
| `overview` | OVERVIEW | goal, pain point, user/context, outcome, entry/exit, journeys, out of scope, key decisions |
| `journey-1` | JOURNEY | staff + 2 requests (E1 อนุมัติ) → approve modal (E2 tick บาร์เทนเดอร์) → ถาวร (E3 อนุมัติ) → ฝน row highlighted + Toast |
| `journey-2` | JOURNEY | 390 staff (E1 เจ) → detail (E2 เพิ่มกลุ่ม) → modal (E3 ถึงสิ้นกะคืนนี้, E4 เพิ่มกลุ่ม) → ผู้จัดการ ถึง 06:00 + new permissions + Toast |
| `settings` | STATES | 1 1280 · 2 1024 · 3 390 · 4 390 nav drawer |
| `tables` | STATES | 1 loaded · 2 bulk select · 3 ⋯ menu · 4 add · 5 duplicate name · 6 regenerate confirm |
| `tables (ต่อ) · print` | STATES | 7 deactivate blocked · 8 empty · print·1 A4 · print·2 counter cards · 9–10 390 · print·3 390 |
| `staff` | STATES | 1 loaded + requests · 2 no requests · 3 approve · 4 reject · 5 deactivate · 6 self → Toast |
| `staff · 390` | STATES | 1 loaded · 2 approve · 3 reject · 4 deactivate |
| `staff-detail` | STATES | 1 time-bound group · 2 add group custom date · 3 expired membership · 4 390 full length · 5 390 add group |
| `groups` | STATES | 1 list · 2 custom group · 3 default group (no delete) · 4 delete confirm · 5–6 390 |
| `policies` | STATES | 1 list · 2 edit · 3 saved · 4 used-by warning · 5 lock-out guard · 6 390 edit |
| `flow` | FLOW MAP | tables & QR · staff · groups & policies |

## 3. State coverage
✓ drawn · n/a (reason) · rule (§9).

| State | Tables / print | Staff | Detail | Groups | Policies |
|---|---|---|---|---|---|
| default | ✓ | ✓ | ✓ | ✓ | ✓ |
| loading | rule: Skeleton rows | rule | rule | rule: Skeleton cards | rule |
| empty | ✓ tables·8 | ✓ ·2 (no requests) | ✓ "ไม่มี" personal policy | n/a (4 defaults always) | n/a (defaults) |
| error + retry | rule: Alert + ลองอีกครั้ง | rule | rule | rule | rule |
| validation | ✓ ·5 | rule: name required, ≥ 1 group | rule: custom date in future | rule: name required, unique | ✓ ·5 lock-out |
| pending | rule: buttons isPending | rule | rule | rule | rule |
| success feedback | rule: Toast "เพิ่ม T7 แล้ว" | ✓ J1·4 | ✓ J2·4 | rule: Toast | ✓ ·3 |
| failure per reason | ✓ ·7 seat in use | ✓ ·6 self | rule: 409 lock-out | ✓ ·4 (lists losses) | ✓ ·5 |
| stale / conflict | rule: 409 → reload | rule: request already decided elsewhere → Toast + refresh | rule | rule | rule |
| permission denied | rule: no `tables:manage` → page hidden from settings | rule: no `staff:manage` → staff / groups / policies hidden | ← | ← | ← |
| long Thai text | rule: seat label max 20 | rule: name truncates | rule | rule | rule: wraps |
| smallest size | ✓ 390 | ✓ 390 | ✓ 390 | ✓ 390 | ✓ 390 |
| destructive confirm | ✓ ·6 regenerate | ✓ ·4 ·5 | rule: remove group → confirm only when it removes `staff:manage` from self | ✓ ·4 | n/a |
| session expired | global: 401 → CD-01 login | ← | ← | ← | ← |

## 4. Action table
| Action | API (status) | Permission | Success → UI | Failure → UI | Idempotency |
|---|---|---|---|---|---|
| Seats CRUD / reorder | `POST/PATCH /tables`, `PATCH /tables/order` (BRIEF-011 + planned) | `tables:manage` | list updates, Toast | `409 SEAT_LABEL_TAKEN` → ·5 · `409 SEAT_IN_USE` → ·7 | reorder sends full order |
| Regenerate QR | `POST /tables/:id/qr/regenerate` (available) | `tables:manage` | new QR, old invalid | network → Alert | each call = new token (confirm guards it) |
| Print QR | client-side (same token) | `tables:manage` | browser print dialog | — | n/a |
| Approve request | `POST /staff/access-requests/:id/approve` (planned, R7) | `staff:manage` | staff row + Toast | 409 already decided → refresh | one decision per request |
| Reject request | `POST …/:id/reject` (planned) | `staff:manage` | request removed | as above | as above |
| Deactivate staff | `PATCH /staff/:id {isActive:false}` + revoke sessions (planned) | `staff:manage` | Switch off, row greyed | `409 SELF_DEACTIVATE` → ·6 · `409 IAM_LOCKOUT` | idempotent |
| Add / remove membership | `POST/DELETE /staff/:id/memberships` (`validUntil`) (planned) | `staff:manage` | detail + permissions refresh, Toast | `409 IAM_LOCKOUT` | unique (user, group) — re-add updates `validUntil` |
| Groups / policies CRUD | `/staff-groups`, `/policies` (planned) | `staff:manage` | Toast "มีผลทันที" | `409 IAM_LOCKOUT` → policies·5 · default group delete → hidden | — |
| Effective permissions | `GET /staff/:id/effective-permissions` (planned, R7) | `staff:manage` | detail right column | — | n/a |

## 5. e2e script
- **J1** (1280) ฝน logs in with LINE → CD-01 J2 "ส่งคำขอแล้ว" → request appears · E1 อนุมัติ on Fon.P → modal, display name prefilled → typed ฝน · E2 tick บาร์เทนเดอร์ (until = ถาวร) · E3 อนุมัติ → staff_user + identity + membership created → row ฝน highlighted, Toast "อนุมัติ ฝน แล้ว"; ฝน's next login works.
- **J2** (390) E1 tap เจ → detail (บาร์เทนเดอร์ ถาวร) · E2 เพิ่มกลุ่ม → modal, Select ผู้จัดการ · E3 ถึงสิ้นกะคืนนี้ (06:00 · 12 ต.ค.) · E4 เพิ่มกลุ่ม → membership `validUntil` set → chip "ผู้จัดการ · ถึง 06:00", permissions column shows "จากกลุ่ม ผู้จัดการ · ถึง 06:00", Toast. At 06:00 the permissions drop without any action.
- **Edge:** Beam switches off his own account → Toast "ปิดบัญชีตัวเองไม่ได้" · untick `staff:manage` from จัดการร้าน → lock-out Alert, save disabled · deactivate T3 with guests → ·7 · add seat "T3" → ชื่อนี้มีอยู่แล้ว.

## 6. Strings & sample data
Copy and sample data live in `Screen` `renderVals()` and markup. Key strings: ตั้งค่า · โต๊ะและ QR · พนักงาน · กลุ่ม · นโยบายสิทธิ์ · ร้าน · เร็วๆ นี้ · คำขอ 2 · **Tables** เพิ่มที่นั่ง · พิมพ์ QR (n) · เคาน์เตอร์ / โต๊ะ · ใช้งาน · มีแขก · ปิดอยู่ · แก้ไข / พิมพ์ QR / สร้าง QR ใหม่ · เลือก n ที่นั่ง · ล้าง · ชื่อ (เช่น T7 หรือ C9) · ชื่อนี้มีอยู่แล้ว · สร้าง QR ให้อัตโนมัติ · สร้าง QR ใหม่ — T3? (CD-02 copy) · ปิดไม่ได้ — T3 มีแขกอยู่ / ปิดบิลหรือย้ายแขกก่อน แล้วค่อยปิดที่นั่ง · ยังไม่มีที่นั่ง · **Print** แผ่น A4 · 3×4 (โต๊ะ) · บัตรเล็ก · 2×5 (เคาน์เตอร์) · สแกนเพื่อสั่งอาหาร · แสดงให้พนักงานเมื่อออก · ตัดตามเส้นประ · QR เดิม · **Staff** คำขอเข้าใช้งาน · เข้าสู่ระบบด้วย LINE แต่ยังไม่ได้ลงทะเบียน · อนุมัติ / ปฏิเสธ · คุณ · ปิดใช้งาน · ชิป "ผู้จัดการ · ถึง 06:00" · อนุมัติคำขอเข้าใช้งาน · ชื่อที่แสดง · กลุ่ม (เลือกอย่างน้อย 1) · ถึงเมื่อไร ถาวร / ถึงสิ้นกะคืนนี้ (06:00) / กำหนดเอง · ปฏิเสธคำขอของ Nat_bkk? · ปิดการใช้งาน มิ้นท์? … ออกจากระบบทุกเครื่องทันที · ปิดบัญชีตัวเองไม่ได้ · **Detail** นโยบายเฉพาะบุคคล · สิทธิ์ที่ได้รับ · รวมจากทุกกลุ่มและนโยบาย — สิทธิ์มากที่สุดชนะ · จากกลุ่ม X · หมดอายุ · มีผลทันที · หมดเวลาแล้วสิทธิ์หายเอง · **Groups** ค่าเริ่มต้น · กลุ่มค่าเริ่มต้น — แก้ได้ ลบไม่ได้ · นโยบายที่แนบ · สิทธิ์รวมของกลุ่ม · ลบกลุ่ม แคชเชียร์? · **Policies** ไม่มีการห้าม (deny) — สิทธิ์มากที่สุดชนะ · บันทึกนโยบายแล้ว — มีผลทันที · บันทึกไม่ได้ — ต้องมีอย่างน้อย 1 คนที่จัดการพนักงานได้ · นโยบายนี้ใช้อยู่กับ 2 กลุ่ม · 3 คน.
Permission labels: ดูโต๊ะ · ตั้งค่าโต๊ะและ QR · ดูการเปิดโต๊ะ · เปิดโต๊ะ · ปิดบิล · ดูออเดอร์ · สั่งออเดอร์ · เปลี่ยนสถานะออเดอร์ · ยกเลิก / Comp · ดูการชำระ · รับชำระ · ยืนยันรับเงินเอง · ดูเมนู · แก้เมนู · เปิด / ปิด พร้อมขาย · ดูรายงาน · จัดการพนักงานและสิทธิ์.
Sample: ก้อง (เจ้าของ) · บีม (ผู้จัดการ, logged in) · ต้น · เจ (บาร์เทนเดอร์ + ผู้จัดการ ถึง 06:00) · มิ้นท์ · ปลา (ปิดใช้งาน) · requests Fon.P / Nat_bkk · seats C1–C8, T1–T6 (CD-02). Default policies ทั้งหมด · จัดการร้าน · งานบาร์ · งานเสิร์ฟ; custom รับชำระเงิน / group แคชเชียร์.

## 7. Layout & tokens
- Shell = CD-12 (rail 88 + top bar 56 ≥ 1024; top bar + nav Drawer < 768). Rail "ตั้งค่า".
- Settings landing: 3-column cards (1280) / list (390), card min-height 120 / 84, icon tile 44.
- Subpage header: breadcrumbs + title + actions, Tabs under it (≥ 1024); 390: back + title.
- Tables: 2 section cards (1280) / stacked (390); rows 52 (checkbox · grip · label · QR 32 · Switch · ⋯ 44). Dropdown 200.
- Dialogs 440 (wide 520 for approve) / full width minus 32 at 390. Toasts as CD-12.
- Print preview: A4 595×842 at 82 % (1280) / 56 % (390); A4 3 × 4 cells, QR 140 at 100 %; counter cards 2 × 5, QR 84.

## 8. Components → platform (HeroUI v3)
| Part | HeroUI v3 |
|---|---|
| Settings landing | Card (pressable) + Badge |
| Section switch | Tabs |
| Seats | Card sections + Checkbox + Switch + Dropdown + Image (QR) |
| Add seat / approve / add group | Modal + Input + RadioGroup + Checkbox + Select + DatePicker / TimeInput (R8) |
| Confirms | AlertDialog |
| Staff list | Table (1280) / Card list (390) + Avatar + Chip |
| Effective permissions | Listbox-like read-only list with icons |
| Policy matrix | Table rows + CheckboxGroup (1280) / Card + Switch (390) |
| Print | browser print stylesheet (A4) |
| Feedback | Alert · Toast · Skeleton |

## 9. Behaviour rules
- **Access (Q1):** a rejected LINE login creates a pending request (LINE name, picture, time). Approve = create staff_user + identity + memberships (≥ 1 group). The person logs in on the next try. Reject → R4.
- **Time-bound membership (D1):** ถาวร = `validUntil` NULL · ถึงสิ้นกะคืนนี้ = next 06:00 Asia/Bangkok (R3) · กำหนดเอง = future date-time. Expiry needs no job for correctness: effective permissions are computed per request with `validUntil > now()`; the Redis cache TTL is capped at the nearest expiry. Expired memberships show struck "หมดอายุ" until removed.
- **Effective permissions:** union of all active memberships' policies + personal policies (most-permissive-wins, no deny). Each permission shows its source; time-bound sources show the expiry.
- **Lock-out guards (D4):** at least one active member must keep the เจ้าของ group · at least one active person must keep `staff:manage` · nobody can deactivate themselves or remove their own `staff:manage` · default groups editable, not deletable · deleting a custom group / policy in use lists who loses what. Server enforces with `409 IAM_LOCKOUT`; UI disables save and shows the reason.
- **Deactivate (D3):** never delete staff or seats with history. Staff deactivate revokes all refresh tokens (POS + 30-day mobile, DR-005 A2) → signed out everywhere. Seat deactivate: blocked while a visit is open (`409 SEAT_IN_USE`); inactive seat disappears from the POS grid and its QR shows "QR ไม่ถูกต้อง" (CD-06).
- **QR (D2):** print = same token, client-side; regenerate = confirm, old token invalid at once (CD-02).
- **Every IAM change applies immediately** (Redis ACL invalidation, FRD §2).
- **Standard questions:** Filters → none (small lists). Search → n/a in S1 (≤ 20 staff). Long and short → names truncate, labels max 20. Interaction → DS pressed / pending; no hover reliance. Accessibility → checkbox labels name the seat / permission; dialogs `role=dialog/alertdialog`; time-bound chips include the time in text, not colour only. Data → missing LINE picture → initials.
- **User-mindset checks:** ✓ one dominant action per page · ✓ targets ≥ 44 · ✓ ack < 1 s · ✓ every loss confirmed (regenerate, reject, deactivate, delete group) · ✓ errors say how to fix · ✓ task cost stated (approve 3, temp manager 4) · ✓ status has text · ☐ walkthrough with an owner.

## 10. Revisions
| Rev | Date | Change | Authority |
|---|---|---|---|
| 0 | 2026-10-09 | Brief Q1 access requests, Q2 full policy editor in S1, D1–D4 | Field |
| 1 | 2026-10-11 | Toast failure tone fixed (DS has `error`, not `danger`) · First canvas built to `cd-template.md` v2: overview, J1 (1280) / J2 (390), settings, tables ×2 + print, staff ×2, staff-detail, groups, policies, flow; R1–R8 raised | Cowork — review pending |

## 11. Source snapshot
Pending — after Field approves rev 1. Lucide UMD `/_blob/9a3515b513ca33d99eba87f535e4db24`; QR placeholder `/_blob/f422f3d7cdccf5e05a16f2e793ee86b1` (copied from CD-07).

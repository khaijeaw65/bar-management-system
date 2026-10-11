# CD-13 — Back office: tables & QR setup, staff, groups (IAM, time-bound membership)

**Status:** Rev 1 canvas in review (2026-10-11) — Q1 (access requests), Q2 (full policy editor in S1), D1–D3 decided by Field (2026-10-09) · **Surface:** web responsive 1280 (also 1024) + 390 phone · **Used by:** S1 IAM brief + tables setup brief · FRD §2 (IAM), §3 (QR) · BRIEF-007 D1 (pre-registered staff)

## Attach
**Open inside the existing Claude Design project** (Design systems tab → The Loft Bar Design System): https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457
`docs/design/CD-12-handoff.md` (responsive shell) once it exists · `docs/design/CD-02-handoff.md` (QR actions, table chips) · FRD §2

## Data
Seats CRUD (`label`, `kind`, `sortOrder`, `isActive`, `qrToken`) + `POST /api/tables/:id/qr/regenerate` · staff users (`displayName`, LINE profile, `isActive`) · groups (`staff_group`), memberships (`validFrom`, `validUntil`), policies (`policy` → permissions `resource:action`) · permissions `tables:manage`, `staff:manage` (owner/manager — FRD §2 "only Owner/Manager assign memberships").

## Decisions (Field)
- **Q1 — How does a new staff member get in? ✅ Decided (Field, 2026-10-09): access-request list** — `staff_access_request` added to `schema.sql`. (BRIEF-007 D1 = pre-registered only, rejected LINE `sub` is logged.) **Recommend: "คำขอเข้าใช้งาน" list** — a rejected LINE login is stored as a pending request (LINE name + picture + time); owner taps "อนุมัติ" → picks group(s) → staff can log in next try. *Why:* no copy-pasting LINE IDs, no invite-link system. Needs a small `staff_access_request` table (schema change, in the IAM brief). *Alternative:* owner pastes the LINE user ID from a log (no schema change, painful).
- **Q2 — Policy editing in S1? ✅ Decided (Field, 2026-10-09): yes — full editor in S1** (custom groups, custom policies, direct user policies). Safeguards below. Original recommendation was: no. S1 ships 4 default groups with fixed policies (เจ้าของ · ผู้จัดการ · บาร์เทนเดอร์ · พนักงานเสิร์ฟ); back office assigns groups + time-bound membership and **shows** the permissions read-only. Custom policies / direct user policies → S2. *Why:* a permission editor is a big screen nobody uses in a small bar's first month.

## Defaults
- **D1 — Time-bound membership** drawn as "ถึงเมื่อไร": ถาวร · ถึงสิ้นกะคืนนี้ (until 06:00) · กำหนดเอง (date-time). Expired membership shows struck + "หมดอายุ".
- **D2 — QR print sheet**: select seats → print A4 grid (QR + label + "สแกนเพื่อสั่งอาหาร"); counter seats print as small paper cards.
- **D3 — Deactivate, never delete** staff and seats that have history.
- **D4 — Lock-out guards (from Q2):** at least one active member must keep the owner group; nobody can remove their own `staff:manage`; default groups can be edited but not deleted; deleting a custom policy/group in use asks to confirm and lists who loses access; every IAM change takes effect immediately (Redis ACL invalidation — FRD §2).

## Paste into Claude Design
> Work inside **The Loft Bar Design System** project. **Web back office, responsive** — every artboard at **1280×800 and 390×844**, CD-12 shell (rail "ตั้งค่า" active; phone = top bar + Drawer). HeroUI v3 components (Table, Card, Tabs, Button, Chip, Avatar, Switch, Select, Input, DatePicker/TimeInput, Checkbox, Modal, Drawer, Alert, Toast, Skeleton); name each part. Thai, Noto Sans Thai, **tokens only**, **dark and light**. Sample staff: บีม (ผู้จัดการ), ต้น (บาร์เทนเดอร์), มิ้นท์ (พนักงานเสิร์ฟ), เจ (บาร์เทนเดอร์ — ผู้จัดการแทนถึงสิ้นกะ). Artboards `CD-13/<id>`. **Static state boards**, standalone cards.
>
> 1. **CD-13/settings** — ตั้งค่า landing: Tabs or cards **โต๊ะและ QR · พนักงาน · กลุ่ม · นโยบายสิทธิ์** (+ "ร้าน" placeholder disabled "เร็วๆ นี้").
> 2. **CD-13/tables** — sections เคาน์เตอร์ / โต๊ะ; rows: drag handle, label, kind chip, Switch active, QR thumbnail, actions ⋯ (แก้ไข · พิมพ์ QR · สร้าง QR ใหม่). "+ เพิ่มที่นั่ง" → Modal (ชื่อ e.g. "T7", ประเภท RadioGroup โต๊ะ / เคาน์เตอร์). Bulk: Checkbox select → "พิมพ์ QR (3)". States: loaded · empty · validation "ชื่อนี้มีอยู่แล้ว" · deactivate blocked "ปิดไม่ได้ — โต๊ะนี้มีแขกอยู่" · regenerate confirm (reuse CD-02 copy).
> 3. **CD-13/print** — A4 print preview: 3×4 grid of QR cards (brand, QR 140, label "T3", "สแกนเพื่อสั่งอาหาร"); counter variant small cards 2×5 ("C1", "แสดงให้พนักงานเมื่อออก"). Buttons "พิมพ์" / "ปิด".
> 4. **CD-13/staff** — list (Table desktop / Cards phone): Avatar (LINE picture), name, groups as chips (time-bound chip shows "ถึง 06:00"), Switch ใช้งาน, last login. Top: **"คำขอเข้าใช้งาน 2"** Card with pending LINE logins (picture, LINE name, "เมื่อ 10 นาทีที่แล้ว") + "อนุมัติ" / "ปฏิเสธ". Approve → Modal: name to show (prefilled LINE name), group Checkboxes, "ถึงเมื่อไร" per group. States: loaded · no requests · approve modal · reject confirm · deactivate "ปิดการใช้งาน บีม? จะออกจากระบบทุกเครื่องทันที" · self-deactivate blocked "ปิดบัญชีตัวเองไม่ได้".
> 5. **CD-13/staff-detail** — page: Avatar + name + Switch; **กลุ่ม** list with validity ("ถาวร" / "ถึง 06:00 · 10 ต.ค." / expired struck "หมดอายุ"), "+ เพิ่มกลุ่ม" → Modal (Select group, RadioGroup ถาวร · ถึงสิ้นกะคืนนี้ · กำหนดเอง → DatePicker + TimeInput); **นโยบายเฉพาะบุคคล** list + "+ เพิ่มนโยบาย" (Select policy) · **สิทธิ์ที่ได้รับ** read-only grouped list (โต๊ะ · ออเดอร์ · ชำระเงิน · เมนู · รายงาน · พนักงาน) with check icons and the source of each ("จากกลุ่ม ผู้จัดการ" / "นโยบายเฉพาะบุคคล"), caption "รวมจากทุกกลุ่มและนโยบาย — สิทธิ์มากที่สุดชนะ".
> 6. **CD-13/groups** — groups as Cards (name, description, member count, Chip "ค่าเริ่มต้น" on the 4 defaults) + "+ สร้างกลุ่ม". Group page: name/description, **นโยบายที่แนบ** (chips + "แนบนโยบาย"), members (with validity), effective permission matrix (read-only, computed). States: default group (no delete button) · custom group delete confirm "ลบกลุ่ม แคชเชียร์? สมาชิก 2 คนจะเสียสิทธิ์ต่อไปนี้…".
> 7. **CD-13/policies** — list of policies (name, description, permission count, used by n groups / m people) + "+ สร้างนโยบาย". **Policy editor**: name, description, **permission matrix** — rows = resource (โต๊ะ tables · ออเดอร์ orders · ชำระเงิน payments · เมนู menu · รายงาน reports · พนักงาน staff), columns = actions (ดู read · สร้าง create · แก้ไข update/write · ยกเลิก/Comp void/comp · จัดการ manage), Checkbox per cell (dash where the action doesn't exist), row "เลือกทั้งหมด"; sticky "บันทึก". Phone: one Card per resource with Switch list. States: editing · save Toast "บันทึกนโยบายแล้ว — มีผลทันที" · lock-out guard Alert danger "บันทึกไม่ได้ — ต้องมีอย่างน้อย 1 คนที่จัดการพนักงานได้" · used-by warning "นโยบายนี้ใช้อยู่กับ 3 คน".
> 8. **CD-13/flow** — settings → tables → add/edit/print/regenerate · settings → staff → approve request → detail → add time-bound group / personal policy · settings → groups → group → attach policy · settings → policies → editor → save (or lock-out guard).
>
> Out of scope: explicit deny rules (model is most-permissive-wins), shop settings, billing, shift cashout, audit log viewer, LINE OA.

## Acceptance (Field checks)
- Every artboard at 1280 and 390, dark + light.
- Time-bound membership visible everywhere a group chip appears.
- Owner/manager-only actions only; no delete of staff/seats with history; lock-out guards shown.
- No out-of-scope items appear.

## Result
- Canvas: https://claude.ai/artifact/PF5pdKMY4b2w1oaunrHJH3 (built to `cd-template.md` v2)
- Handoff: `docs/design/CD-13-handoff.md` · source snapshot after approval

## Revisions
Once the handoff is approved it wins over the paste text above (`cd-template.md` §2).

| Rev | Date | Change vs this brief | Where |
|---|---|---|---|
| 1 | 2026-10-11 | Policy matrix = rows per resource with the real permission codes, not 5 fixed columns (R2) · "ถึงสิ้นกะคืนนี้" = 06:00 next day (R3) · rejected-request re-login open (R4) · seats in เคาน์เตอร์ / โต๊ะ sections, no kind chip per row (R5) · self-deactivate blocked, deactivate revokes all sessions, expired membership struck, delete-group lists lost permissions (R6) · API gaps (R7) · DS gaps (R8) | handoff §0, §9 |

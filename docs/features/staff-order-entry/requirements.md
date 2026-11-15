# Staff app — take order — requirements

> Spec-Anchored feature requirements (`docs/features/staff-order-entry/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Draft |
| **Backlog item** | DR-009 staff app "take order S1" · demo "phone order → POS live" |
| **Design** | [design.md](design.md) — As-is mapped · To-be **proposals** awaiting Field (P# in its *Open questions*) |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Staff app — take order |
| **UI** | [ui.md](ui.md) — from CD-14 rev 5 (approved) · owner: methee |
| **Briefs** | [BRIEF-074](../../briefs/BRIEF-074-mobile-order-menu-cart.md) pick seat, menu, item sheet, cart · [BRIEF-075](../../briefs/BRIEF-075-mobile-order-send.md) send safely + failures · [BRIEF-076](../../briefs/BRIEF-076-mobile-order-open-seat-live.md) open a free seat, live menu · [BRIEF-077](../../briefs/BRIEF-077-mobile-slip-verify.md) slip scan at the table (DR-027) |
| **Sources** | CD-14 rev 5 · DR-009 · DR-010 · DR-027 |

## Why / who

Bars without a POS at every table take orders on paper or by voice, and orders get lost or under-charged. Staff take the order on their phone at the table and it reaches the bar queue without walking to the POS.

## Flow (user steps)

Business words only — no tables, columns or endpoints. Tech (`design.md`) and UI (`ui.md`, Claude Design) both read this table.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Waiter taps "+ ออเดอร์" and picks a seat | "T3 · คุณเอ" (seated) / "C3 ว่าง" | Only staff allowed to take orders see the button |
| 2 | Waiter finds the drink and picks options | "โอลด์แฟชั่น · น้ำแข็งก้อนใหญ่ · สั่งโดย เอ" | Every item opens the item sheet (no quick add on the phone); required options enforced |
| 3 | Waiter checks the cart | "ตะกร้า 3 รายการ · ฿540" | Same item + options + name + note merge |
| 4 | Waiter sends | order reaches the bar queue and POS within ~2 s | A flaky network never makes a double order |
| 5 | Something changed | "หมดแล้ว — ลบออกเพื่อส่งต่อ" / "โต๊ะนี้ถูกปิดแล้ว" | The cart is kept; every error says what to do |
| 6 | Waiter opens a free seat | "เปิดโต๊ะ C3 แล้ว" — or "C3 เพิ่งถูกเปิดไปแล้ว (โดย POS 21:02)" → confirm before joining | Never joins someone else's table silently |
| 7 | Guest shows a transfer slip at the table | waiter scans the slip QR → "ยืนยันสลิปแล้ว · ฿1,240" | Manual confirm never happens on the phone (DR-027) |

## Requirements

Every line has a **Source**. Written 2026-11-15 from the approved interview notes and DRs — no new requirement.

| R | Requirement | Source |
|---|---|---|
| R1 | Take an order on the phone from the queue (seat picker) or the table summary sheet (seat known) | CD-14 §1 (Field approved 2026-10-10) |
| R2 | No quick add on the staff app — every item opens the item sheet | Field, verbal, 2026-10-10 (CD-14 §9) |
| R3 | Retry never duplicates an order (idempotency key per cart; new key on any edit) | CD-14 §4 (Field approved 2026-10-10) |
| R4 | Sold-out / expired-promo lines are caught before and at send; the cart is kept | CD-14 §9 · DR-010 |
| R5 | Opening a free seat never joins an existing visit silently — confirm dialog with who opened it, when, and the guest label | Field, verbal, 2026-10-10 (CD-14 R9) |
| R6 | Without `orders:create` the order entry points are hidden; without `visits:open` free seats are locked ("ให้ POS เปิด") | CD-14 R7 (Field approved 2026-10-10) |
| R7 | Cart lives in memory per visit while the app runs; lost if the app is killed or the session expires; no offline ordering | CD-14 R6 (Field approved 2026-10-10) |
| R8 | Slip scan at the table: QR payload only, confirm through the server; anything the bank check cannot confirm goes to the POS | DR-027 (Approved B) |

## Invariants

Business rules that must never break. Each one gets an index row in `docs/features/INVARIANTS.md` once `design.md` names its enforcing test or constraint.

None beyond the platform invariants (order snapshots, idempotent send — owned by the ordering / payment specs).

## Acceptance criteria

Written when the feature is sliced into briefs (`/new-feature` stage 4), grouped by endpoint, screen or flow. Current ACs live in BRIEF-074–077 §3 until those briefs link here.

## Not handled (on purpose)

- Payment create / cash / manual confirm / close table — POS only (DR-009, DR-027)
- Persisting the cart, offline ordering — cut
- Slip photo upload on the phone (BRIEF-077 Q1)

## Open questions

Unanswered questions block the listed brief from `Ready`.

| # | Question | Recommended | Blocks |
|---|---|---|---|
| Q1 | Q-lock: should mobile component tests be the locked acceptance set (`e2e` on)? | yes — decide once for all mobile briefs | BRIEF-074–077 Ready |
| Q2 | BRIEF-076 carries two flows (open seat + live menu) | split live menu out, or record owner-accepted oversize | BRIEF-076 Ready |

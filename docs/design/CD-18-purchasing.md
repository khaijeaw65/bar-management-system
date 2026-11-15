# CD-18 — Back office: suppliers · PO · receive · ซื้อหน้าร้าน · reorder → PO · copy / share

**Status:** Rev 1 canvas — **question** (parked 2026-11-15, R1–R7 open until the purchasing brief session) — pain point = สมมติฐาน (Field: confirm in the brief session) · D1–D9 Cowork defaults · **Surface:** web back office, responsive 1280 (also 1024) + phone 390 · **Used by:** purchasing brief(s) 30 Nov – 6 Dec (DR-031 module 2 + 3 Reorder → PO) · **Session:** CD session 1 of 5 (last of 3)

## Attach
Base project (The Loft Bar Design System) · `CD-16-handoff.md` + `CD-17-handoff.md` (approved — shell, rail สต็อก, tabs, quantity model, history types) · notes Topic 3 P1–P8, Topic 1 Q2 / Q3 / Q6, Topic 2 S2, Topic 4 E2 (`docs/research/2026-11-08-feature-interview-notes.md`)

## Data (API catalog)
**No purchasing API yet — every action = "needs API (purchasing brief, planned 30 Nov)".** New tables for the brief (not decided here): `supplier`, `purchase_order` + lines, `receipt` (from PO or cash buy) + lines, `reorder_item`. Stock-side fields already agreed in CD-16 R3 (default supplier, purchase unit + per-purchase qty, average cost). New permission `purchasing` (notes Topic 3 — owner / manager group).

## Locked inputs (Field, 8–15 Nov — do not re-ask)
P1 both flows: PO for distributors (order → receive) **and** quick "ซื้อหน้าร้าน" receipt without PO, optional receipt photo (S3) · P2 no approval — permission + audit log · P3 receive what arrived; PO closes with shortfall noted; no backorder · P4 paid / unpaid + due date per receipt; unpaid on owner dashboard; cost → P&L · P5 default supplier per item; reorder list → one tap → one PO per supplier · P6 copy / share a Thai PO message now; LINE OA auto-send + "รับทราบ" later on the same message (A2: LINE OA in scope, venue opt-in, copy / share stays) · P7 weighted average cost · P8 order / receive in purchase units, stock in containers · Q6 receiving only here · Q3 receive auto-restores auto-86 · Q2 reorder list fed by service tap + close checklist (CD-19 / CD-28) · S2 cash buy "paid from drawer" → pay-out in the open shift (CD-19) · E2 untracked buys (ice, garnish) = expense of the month.

## Pain point (open — Field)
- **Q1 → สมมติฐาน (Field 15 Nov: "unknown for now, refine in the brief session").** How do the bars you saw order and pay today? (e.g. message the sales rep on LINE, pay on delivery / credit 30 days, Makro run in the afternoon, receipts in a drawer.) If unknown → overview marked "สมมติฐาน".

## Defaults (Field confirms or overrides at canvas review)
- **D1 — Tab "จัดซื้อ"** (CD-16 R2) with sub-nav: ต้องสั่ง (reorder list, default) · ใบสั่งซื้อ · รับของ / ใบเสร็จ · ผู้ขาย. Shown with `purchasing`.
- **D2 — ต้องสั่ง (reorder list)** = system low / out items + staff reports (with who / when) grouped **by default supplier**; qty suggested in purchase units (to reach "threshold × 2" — editable); items with no supplier in a "ยังไม่มีผู้ขาย" group. One tap "สร้างใบสั่งซื้อ 2 ใบ" → one draft PO per supplier. ML hint slot left empty (CD-26).
- **D3 — PO** = draft → ส่งแล้ว → รับแล้ว (ครบ / ขาด) · ยกเลิก. Lines: item, qty in purchase unit, expected unit cost (pre-filled from last receipt). "ส่ง" = copy / share sheet with the Thai message preview (+ "ส่งทาง LINE OA" when the venue opted in — drawn as the later state). Sending marks ส่งแล้ว.
- **D4 — Receive from PO** = one screen: each line shows ordered vs received (default = ordered), actual unit cost, total; shortfall line shows "ขาด 1 ลัง"; then payment: จ่ายแล้ว (เงินสด / โอน / จากลิ้นชัก) or ยังไม่จ่าย + due date; optional photo. Save → stock + average cost updated, auto-86 restored, PO closed.
- **D5 — ซื้อหน้าร้าน** = same receive screen without a PO: shop name (free text or supplier), lines = stock item **or** a free-text expense line (e.g. น้ำแข็ง ฿120 → ค่าใช้จ่าย, CD-22), photo, paid from drawer / own pocket / transfer.
- **D6 — Supplier** = name, contact person, phone, LINE ID (for copy / share), payment terms (เงินสด / เครดิต N วัน → due date default), note, items supplied (read-only list from stock items' default supplier). Archive, not delete (CD-16 R4 pattern).
- **D7 — Unpaid** = filter on รับของ / ใบเสร็จ + "ค้างจ่าย ฿x · เลยกำหนด y" tile; mark paid (method + date). Owner dashboard card = CD-22 / CD-05 later.
- **D8 — Prices include VAT, no VAT handling** (small bars are rarely VAT-registered). Revisit only if the advisor / a pilot bar asks.
- **D9 — Out of CD-18:** LINE OA settings (CD-21) · expense categories + P&L (CD-22) · ML reorder forecast (CD-26) · staff-app low-stock tap (CD-28) · close checklist (CD-19).

## Paste into Claude Design
> Same base project and rules as CD-16 / CD-17. Sample suppliers (invented): เจริญผล ลิคเคอร์ (credit 30 days, Jameson / Jim Beam / Bulleit, ลัง 12 / 12 / 6) · ช้างทอง ดิสทริบิวชั่น (credit 7 days, ช้างดราฟต์ ถัง 30 L ฿3,600). Boards: overview · journey-1 · journey-2 · reorder · po · receive · cash-buy · receipts · suppliers · phone 390 · flow.

## Result
- Canvas: https://claude.ai/artifact/TFr5arFaRwatUC4rPnkgSB (rev 1, 15 Nov) · Handoff: `docs/design/CD-18-handoff.md` (question — R1–R7 open)

## Revisions
| Rev | Date | Change vs this brief | Where |
|---|---|---|---|
| 0 | 2026-11-15 | Pain point = assumption (Field) | this brief |

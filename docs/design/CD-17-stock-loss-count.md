# CD-17 — Back office: เปิดของใหม่ · loss report · override log · count · adjust

**Status:** Approved rev 2 (Field 2026-11-15, R2–R6 accepted) — Q1 = POS too (Field 15 Nov) · D1–D7 Cowork defaults (Field may override at canvas review) · **Surface:** web back office, responsive 1280 (also 1024) + phone 390 · **Used by:** stock brief(s) from 30 Nov (DR-031 module 1, step 4) · **Session:** CD session 1 of 5 (after CD-16, before CD-18)

## Attach
Base project (The Loft Bar Design System) · `docs/design/CD-16-handoff.md` (approved rev 2 — shell, rail สต็อก, tabs, quantity model, archive) · notes Topic 1 Q1–Q4, Q7 (`docs/research/2026-11-08-feature-interview-notes.md`)

## Data (API catalog)
**No stock API yet — every action = "needs API (stock brief, planned 30 Nov)".** Builds on CD-16 R3 schema gaps. New for this CD: `container_open` event (item, who, when, sold-since-previous-open), `stock_override` (item, who, when, system qty, claimed qty, status), `inventory_transaction` tx types `adjust` / `count` / `waste` with reason. Permission `inventory:manage`.

## Locked inputs (Field, 8–15 Nov — do not re-ask)
Loss = "เปิดของใหม่" tap per container (bottle, keg, food pack): sold since last open vs container size → missing; flag above a threshold (e.g. > 10 %); comps / voids excluded · sales beyond one container → assume a new container + flag "อาจลืมกดเปิดของใหม่" · auto-86 one-tap "ยังมีของ" + optional "เหลือเท่าไหร่" → override log (who, when, system vs claimed) → claim not met = unaccounted in loss report ("ควรตรวจสอบ") · void after served = waste (stays deducted) · adjustments with reason, logged · optional weekly / monthly full count by owner · low-stock checklist at close lives in shift close (CD-19) · archive not delete (CD-16 R4) · quantity = base unit + container (CD-16 D2).

## Pain point
Same as CD-16 R1 (Field 9 Nov): medium / large bars count by hand and send the count in a LINE group; the owner compares with POS by hand. CD-17 is where that comparison moves into the system.

## Open for Field
- **Q1 ✓ Field 15 Nov — also on the POS.** Where does the bartender tap "เปิดของใหม่" before the staff app has it?** The staff app gets it in CD-28 (Metee builds 15 Dec – 15 Jan), but stock ships 30 Nov – 6 Dec. **Recommend: also on the POS** — a "เปิดของใหม่" button on the stock list row + item page (same web app, the POS tablet at the bar already has it). Why: without it there is no loss data until mid-Jan and the 14 Dec demo can't show loss. Trade-off: one more web screen state (small); the staff app later reuses the same API.

## Defaults (Field confirms or overrides at canvas review)
- **D1 — Tab "นับสต็อก / ของหาย"** (CD-16 R2) holds 3 sub-views: ของหาย (loss report, default) · นับสต็อก · ประวัติ (all movements: receive, sale, waste, adjust, count, open, override).
- **D2 — "เปิดของใหม่" = one tap + undo Toast (5 s)**, no dialog. Shows right after: "Jameson ขวดที่ 3 · ขวดก่อนขายไป 640 / 700 ml (หาย 60 ml · 9 %)". Above threshold → warning Toast + row flagged in the loss report. Why: the bartender is mid-rush; undo is cheaper than confirm.
- **D3 — Loss report = per item, per period** (default 7 วันล่าสุด; also เดือนนี้ / กำหนดเอง): containers opened · expected vs sold · missing (unit + ฿ at average cost + %) · flags (เกินเกณฑ์ / อาจลืมกดเปิดของใหม่ / ยังมีของ ไม่ตรง). Sorted by ฿ lost. Row → item detail with each container as a line.
- **D4 — Loss threshold = venue setting, default 10 %**, one number for all items (per-item later if needed). Shown on the report header with a link to settings (CD-21).
- **D5 — Override log** = a section in ของหาย: open claims first ("ยังมีของ" → waiting for receive or count), then resolved. Each row: item, who, when, system 0 vs claimed "อีก 1 ขวด", status รอตรวจ / ตรงแล้ว / ไม่ตรง (qty). Owner marks "ตรวจแล้ว" with a note. Not-met qty also counts in the loss total.
- **D6 — Count = blind count sheet.** Owner (or delegated staff) enters containers + remainder per item **without seeing the system number**; after submit: variance per item (unit, ฿, %) → "ยืนยันปรับยอด" writes one `count` adjustment per item. Draft auto-kept until submitted. Category filter (A first). Why blind: same reason as the cash count in shift close — seeing the expected number biases the count. Also used for bulk first-time setup (CD-16 D6).
- **D7 — Adjust (single item)** from the item page: "ปรับยอด" Drawer — direction (เพิ่ม / ลด), qty, reason (แตก / หก · หมดอายุ / เสีย · นับใหม่ · ใช้ภายใน / ชิม · อื่น ๆ + note required), shows the ฿ effect. Lands in ประวัติ and the loss report as "ตัดออกมีเหตุผล" (not missing).
- **D8 — Out of CD-17:** staff-app taps (CD-28) · low-stock checklist at close (CD-19) · receive / PO (CD-18) · ML anomaly (CD-26).

## Paste into Claude Design
> Same base project and rules as CD-16 (HeroUI v3 components only, Thai, tokens only, dark + light, 1280 / 1024 / 390, CD-16 shell with rail สต็อก). Period sample 9–15 พ.ย. Stock + costs = CD-16 data (Jameson ฿780 / ขวด 700 ml, Jim Beam ฿710, ช้างดราฟต์ ฿3,600 / ถัง 30 L, หมูยอ ฿120 / แพ็ค 10, น้ำเชื่อม ฿120 / 750 ml). Threshold 10 %.
>
> 1. **overview** · 2. **journey-1** (ต้น bartender on the POS taps เปิดของใหม่ Jameson → warning Toast 14 % → next day Beam opens ของหาย → Jameson detail → ปรับยอด "หก 60 ml") · 3. **journey-2** (weekly blind count → variance → ยืนยันปรับยอด)
> 4. **loss** — sub-nav ของหาย · ยังมีของ · นับสต็อก · ประวัติ; stat tiles; table per item sorted by ฿; states loaded / loading / empty / error / เดือนนี้ / 1024 / no permission
> 5. **detail** — per container lines (opened when / by → next open, sold, missing, flag), comps excluded, ตัดออกมีเหตุผล list; forgot-to-open case
> 6. **open (POS)** — stock list as bartender (read-only + เปิดของใหม่ button): default · Toast normal 9 % · warning 14 % · อาจลืมกด · undone · error
> 7. **adjust** Drawer — default · validation (อื่น ๆ needs note) · pending
> 8. **override** (ยังมีของ) — open + resolved rows · mark checked dialog · empty
> 9. **count** — blind sheet empty · draft partial · validation · variance · confirming
> 10. **history** — all movements · filtered
> 11. **phone 390** — count · variance · loss · detail
> 12. **flow**

## Result
- Canvas: https://claude.ai/artifact/HhGhQQe3XrQWouuqAfVSjZ (rev 1, 15 Nov) · Handoff: `docs/design/CD-17-handoff.md` (approved rev 2, 15 Nov)

## Revisions
| Rev | Date | Change vs this brief | Where |
|---|---|---|---|
| 0 | 2026-11-15 | Q1 = POS too (Field) | this brief |
| 2 | 2026-11-15 | ยังมีของ = own sub-tab (R5, was D5 section) · explain ≠ adjust (R2) · new perm `inventory:open_container` (R3) · no delete after undo (R4) · count = inventory:manage (R6) | handoff §0 |

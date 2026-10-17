---
id: CD-05
title: Back office — dashboard (owner money view · manager today view · comps/voids)
revision: 3
status: review
approved_by:
approved_on:
canvas: https://claude.ai/artifact/WiY9xummEw5w2rPdnRqBdf
canvas_version: 1792226326-31c0
ds_version: 1791561405-c72e
source: docs/design/source/CD-05/   # taken after approval (§11)
surfaces: [web-backoffice]
sizes: [1280x800, 1024x768, 390x844]
brief: CD-05-dashboard.md
drs: [DR-009, DR-010, DR-014, DR-015]
depends_on: [CD-02, CD-03, CD-12, CD-15]
supersedes: brief paste text and acceptance where they conflict (see brief "Revisions")
---

# CD-05 — Back office: dashboard

Built on The Loft Bar Design System (dark/light Theme tweak on every board). **Do not port canvas markup** — build with HeroUI v3 + tokens; charts are simple SVG / CSS bars. Sample data only. One shared child `Screen` (props `device` · `screen` overview / today / comps · `state` loaded / loading / empty / error · `ring` · `w` / `h`) renders the CD-12 shell (rail "รายงาน") and the page.

## 0. Review items
Brief D1–D3 apply (§10). Rev-1 items:

| # | Item | Recommendation |
|---|---|---|
| R1 ✓ | **Pain point is an assumption:** the owner learns revenue from counting cash at close, doesn't know what sells; voids / comps leave no trace; the manager has no picture of tonight without walking every table. | Field: confirm or correct. **Confirmed 2026-10-12** (field experience + research — `docs/research/Claude_verified_ops_findings.md`, DR-014). |
| R2 ✓ | **DS gap — chart colours:** the DS has no chart tokens. Proposed `--chart-1` #B87020 (both themes) and `--chart-2` #7E80D8 dark / #6E6FC8 light. Both pass the dataviz validator (lightness band, chroma floor, CVD ΔE ≥ 16, normal-vision ΔE ≥ 19, contrast ≥ 3:1) in dark and light. Single-series charts use `--chart-1` only. | Add to `tokens/colors.css`. **Accepted 2026-10-17** (Field): add to DS `tokens/colors.css`; chart library = Recharts (DR-015). |
| R3 ✓ | **Today:** the brief says "โต๊ะที่เปิดอยู่ 5", but the shared sample (CD-02) has 8 open seats (4 tables + 4 counter). Drawn as 8 + total still open in bills; long-open seats show their time in warning colour (CD-02 idle). | Accept. **Accepted 2026-10-17** (Field). |
| R4 ✓ | **"สูงกว่าปกติ" rule:** > 2× the weekly average of the previous 4 weeks, per reason; no flag until 4 weeks of data exist. | Field: confirm the threshold. **Accepted 2026-10-17** (Field): > 2× the 4-week weekly average, no flag before 4 weeks of data. |
| R5 ✓ | **Needs API (dashboard brief):** `GET /reports/summary?from&to` (revenue, bills, average, payment split + previous period) · `/reports/daily` · `/reports/items?sort=top|bottom` · `/reports/today` (hourly, open seats, pending / issue counts) · `/reports/comps-voids` (by reason, by person, self-approved, spike flag). Business day cut-off 06:00 (as DR-013). | Add to the dashboard brief. **Accepted 2026-10-17** (Field). |
| R6 ✓ | **Counting rules:** bottom-5 excludes items that are unavailable or added < 7 days ago · average bill excludes ฿0 bills (whole-bill comp) · promos (`is_promo`, DR-010) can be split later, not in S1. | Accept. **Accepted 2026-10-17** (Field). |
| R7 ✓ | **DR-014 #11 impact (canvas update):** add the **AI owner insight** card (sales summary, anomaly/fraud alerts, menu & stock suggestions) — SQL calculates, AI explains, source numbers shown; alerts say "ควรตรวจสอบ". | Field approved DR-014 2026-10-12. **Drawn rev 2:** board `ai-insight` — 1 1280 (3 sections: ยอดขาย · ควรตรวจสอบ · เมนูและสต็อก, each item with its source numbers, alerts = Badge "ควรตรวจสอบ" + link to the list) · 2 390 stacked · 3 generating · 4 not enough data / failed; privacy line (totals only, staff as codes). |
| Q1 ✓ | **Placement + audience.** | **Decided 2026-10-17 (Field):** the AI card sits at the **top of ภาพรวมรายได้, under the KPI row** (no separate tab). Per-person staff alerts (names) = **Owner only**; Managers see the same alerts grouped by reason, no names (ai-insight·5). The overview screen frames are not redrawn with the card in place — placement is the §9 rule; build inserts it. |

## 1. Overview
- **Goal:** the owner sees money in, what sells and what doesn't, and unusual voids / comps; the manager sees tonight right now — from a computer or a phone.
- **Pain point:** see R1.
- **User + context:** owner — weekly check, often on the phone (DR-009) · manager — mid-shift glance.
- **Entry → exit:** rail / nav drawer "รายงาน" (`reports:read`); default tab by group (owner → ภาพรวมรายได้, manager → วันนี้; D2). Exits: มีปัญหา / ออเดอร์รอทำ → CD-15 · seat → CD-02 panel · manual confirmations → CD-03 list.
- **Outcome:** three questions answered on one screen (how much, what sells, anything unusual) with no staff ranking (D3).
- **Out of scope:** margin / cost / stock (S2, shown as a "เร็วๆ นี้" card), staff performance / leaderboards (cut), Excel export, AI "ask your data" (stretch, DR-014 #11), LINE OA. AI owner insight is **in** (DR-014 #11, board `ai-insight`).
- **Journeys:** J1 1280 owner: 30-day overview → comps / voids (E1) · J2 390 manager: tab วันนี้ → issue tile → CD-15 (E1–E2).

## 2. Boards
| Board | Type | States |
|---|---|---|
| `overview-board` | OVERVIEW | goal, pain point, user/context, outcome, entry/exit, journeys, out of scope, key decisions |
| `journey-1` | JOURNEY | overview 30 วัน (E1 ยกเลิก / Comp card) → comps-voids 7 วัน |
| `journey-2` | JOURNEY | 390 overview (E1 tab วันนี้) → today (E2 มีปัญหา → CD-15) → result |
| `overview` | STATES | 1 1280 with hover tooltip · 2 1024 · 3 390 full length |
| `today` | STATES | 1 1280 · 2 390 full length |
| `comps-voids` | STATES | 1 1280 · 2 390 full length |
| `ai-insight` | STATES | 1 1280 loaded · 2 390 · 3 generating · 4 not enough data + failed (DR-014 #11) |
| `states` | STATES | loading · empty period · error — at 1280 and 390 |
| `flow` | FLOW MAP | owner · manager · states |

## 3. State coverage
| State | Overview | Today | Comps / voids |
|---|---|---|---|
| default | ✓ | ✓ | ✓ |
| loading | ✓ states·1, ·4 | rule (same Skeleton) | rule |
| empty | ✓ states·2 | ✓ states·5 | rule: "ยังไม่มีการยกเลิกในช่วงนี้" |
| error + retry | ✓ states·3 | rule | ✓ states·6 |
| live update | n/a | ✓ "อัปเดต 21:14 น. · สด" | n/a |
| hover / tap detail | ✓ overview·1 tooltip | rule: bar tap → value | n/a |
| permission denied | rule: no `reports:read` → rail item hidden | ← | ← |
| long Thai text | rule: item names truncate 1 line | rule | rule |
| smallest size | ✓ 1024 · 390 | ✓ 390 | ✓ 390 |
| session expired | global: 401 → CD-01 login | ← | ← |

## 4. Action table
| Action | API (status) | Permission | Success → UI | Failure → UI |
|---|---|---|---|---|
| Load overview | `GET /reports/summary`, `/reports/daily`, `/reports/items` (planned, R5) | `reports:read` | tiles + chart + lists | Alert + ลองอีกครั้ง |
| Change period | same with `from`/`to` | `reports:read` | refetch, Skeleton | as above |
| Load today | `GET /reports/today` + WS / refetch every 60 s (planned) | `reports:read` | tiles + hourly + open seats | stale → keeps last data, live dot grey "ไม่ได้อัปเดต" |
| Load comps / voids | `GET /reports/comps-voids` (planned) | `reports:read` | tables | Alert + retry |
| Load AI insight | **needs API** (dashboard / AI brief): latest stored `ai_insight` for the period (DR-014 #11) | `reports:read` | ai-insight·1 | none yet → ·4 not enough data · failed → ·4 Alert, report numbers stay |
| Regenerate insight | **needs API**: enqueue BullMQ job, return when stored (DR-014 #11) | `reports:read` (owner — Q1) | Skeleton (·3) → ·1 | failed → ·4 |

## 5. e2e script
- **J1** (1280) owner opens รายงาน → ภาพรวมรายได้ · 30 วัน: ยอดขาย, จำนวนบิล, เฉลี่ยต่อบิล (each +x% vs previous 30 days), PromptPay 72% / เงินสด 28%, daily line (hover 10 ต.ค. ฿24,440.00), top / bottom 5 · E1 tap "ยกเลิก / Comp 10 รายการ · ฿1,460.00" → page, period 7 วัน: by reason (บริการพิเศษ "สูงกว่าปกติ") and by person sorted by name (ต้น "อนุมัติด้วยตนเอง 2").
- **J2** (390) manager opens รายงาน · E1 tab วันนี้ → ยอดวันนี้ ฿18,420.00, 8 open seats (T4, C5 in warning time), ออเดอร์รอทำ 3, มีปัญหา 1 · E2 tap มีปัญหา → CD-15 board (tablet).
- **Edge:** period with no paid bills → empty state · API fails → Alert + retry · no `reports:read` → no rail item.

## 6. Strings & sample data
Copy and data in `Screen` `renderVals()` and markup. Key strings: รายงาน · ภาพรวมรายได้ · วันนี้ · ช่วงเวลา วันนี้ / 7 วัน / 30 วัน / กำหนดเอง · ยอดขาย · จำนวนบิล · เฉลี่ยต่อบิล · สัดส่วนการชำระ · +12% จาก 30 วันก่อนหน้า · ยอดขายรายวัน · ดูเป็นตาราง · ขายดี 5 อันดับ (ตามยอดขาย) · ขายน้อย 5 อันดับ (ตามจำนวน · พิจารณาเอาออก) · ยืนยันชำระด้วยตนเอง 3 ครั้ง · ตรวจสอบ · ยกเลิก / Comp 10 รายการ · ต้นทุน กำไร และสต็อก · ต้องมีสูตรและสต็อก (S2) · เร็วๆ นี้ · ยอดขายวันนี้ · บิลปิด 25 · ที่นั่งที่เปิดอยู่ · ยอดในบิล · ออเดอร์รอทำ · มีปัญหา · ยำหมูยอ · ของหมด — จัดการ → · ยอดขายรายชั่วโมง · บิลที่ชำระแล้ว · 18:00–02:00 · 21:00 = ถึงตอนนี้ · ช่องเส้นประ = ยังไม่ถึง · อัปเดต 21:14 น. · สด · ยกเลิกรายการและ Comp · ไม่ใช่การจัดอันดับพนักงาน — เรียงตามชื่อ · ตามเหตุผล · ตามคนที่ทำรายการ · สูงกว่าปกติ · อนุมัติด้วยตนเอง n · ยังไม่มีข้อมูลในช่วงนี้ · โหลดรายงานไม่สำเร็จ.
Sample: 30 days 11 ก.ย. – 10 ต.ค. by weekday pattern (Fri / Sat peaks) → ฿440,660.00 · 600 bills · ฿734.43 · today ฿18,420.00 (18:00 ฿1,240 · 19:00 ฿3,180 · 20:00 ฿5,460 · 21:00 ฿8,540 so far) · open seats from CD-02 · voids 6 / ฿840.00 (ของหมด 2 · สั่งผิด 2 · ลูกค้าเปลี่ยนใจ 1 · ของเสีย 1), comps 4 / ฿620.00 (บริการพิเศษ 3 · อื่นๆ 1); reasons match CD-15 R3 (ของหมด).

## 7. Layout & tokens
- Shell = CD-12. Content padding 16 / 24; header row = breadcrumbs + title + period Select 180 (or live dot); Tabs below.
- Tiles: 4 columns (1280) / 2 × 2 (390); value 26 / 19 tabular; delta in `--success-fg` / `--text-danger`.
- Daily line: 2 px `--chart-1`, `vector-effect: non-scaling-stroke`, 3 hairline grid lines, y labels 30k / 20k / 10k / 0, 5 x labels; hover = crosshair + 10 px dot with 2 px surface ring + tooltip.
- Hourly bars: 9 columns, 4 px rounded tops, 6 px gaps, direct value labels on filled bars only, future hours dashed outline.
- Top / bottom lists: 6 px bars in `--chart-1`, scaled to the list max; numbers right-aligned tabular.
- Payment split: 8 px stacked bar, 2 px gap, legend + direct % labels (never colour alone).
- Overview at 1280 is taller than 744 (page scrolls); drawn full height.

## 8. Components → platform (HeroUI v3)
| Part | HeroUI v3 |
|---|---|
| Tabs / period | Tabs · Select (DateRangePicker for กำหนดเอง) |
| Tiles | Card (pressable) — DS StatTile has no slot for the split bar, so Card is used |
| Charts | Recharts (DR-015) with `--chart-1` / `--chart-2` + Tooltip on hover |
| AI insight | Card + Badge (warning "ควรตรวจสอบ") + Chip for source numbers + Skeleton / Alert |
| Lists / tables | Table |
| Flags | Chip (warning) |
| Feedback | Skeleton · Alert · EmptyState |

## 9. Behaviour rules
- **Metrics (D1):** only from orders + payments: revenue = paid payments in the period; bills = closed visits; average = revenue / bills (excl. ฿0, R6); payment split by method; manual confirmations = payments with `confirmed_via = manual` (CD-03 F1). Previous period = same length right before.
- **Tabs (D2):** default by group (owner / manager); anyone with `reports:read` can switch; last choice remembered per user.
- **No ranking (D3):** people sorted by name; no "top staff", no scores. Spikes flagged per reason (R4), self-approved flag from CD-02.
- **Today:** live via WS `payment.completed` + refetch every 60 s; hourly bars from paid bills; open seats sorted by time open; idle threshold as CD-02.
- **Business day:** 06:00 cut-off, Asia/Bangkok (venue setting, DR-014 #4).
- **AI insight (DR-014 #11):** SQL calculates every number; the model only explains and never computes; each insight shows its source numbers. Only totals go to OpenAI — no guest data, staff as aliases mapped back on our server. Alerts state facts + "ควรตรวจสอบ", never accuse. Stored in `ai_insight`, made by a daily / weekly BullMQ job or on demand ("สร้างใหม่"). Spike rule = R4.
- **AI insight placement / audience (Q1):** top of ภาพรวมรายได้, directly under the KPI tiles. Owner sees named staff alerts; Manager gets the same alert list with names removed and items grouped by reason (e.g. "อนุมัติยกเลิกด้วยตนเอง 2 ครั้ง"); card title "AI สรุป (ผู้จัดการ)".
- **Charts:** one axis only; single-series = `--chart-1`; numbers and labels in text tokens, never the series colour; a table view link for the line chart.
- **Standard questions:** Filters → period single select, 30 วัน default (owner) / วันนี้ fixed (today tab). Search → n/a. Long and short → item names 1 line. Interaction → hover tooltip on desktop, tap on phone. Accessibility → charts have `role="img"` + summary labels, table view link, split bar labelled. Data → missing previous period → no delta shown.
- **User-mindset checks:** ✓ one question per section · ✓ targets ≥ 44 on links · ✓ no destructive action · ✓ status has text · ✓ no colour-only meaning · ☐ walkthrough with the owner.

## 10. Revisions
| Rev | Date | Change | Authority |
|---|---|---|---|
| 0 | 2026-10-09 | Brief D1–D3 | Field |
| 1 | 2026-10-11 | First canvas built to `cd-template.md` v2: overview, J1 (1280) / J2 (390), overview / today / comps-voids / states boards, flow; R1–R6 raised; chart colours validated | Cowork — review pending |
| 2 | 2026-10-17 | R7 DR-014 #11 drawn: `ai-insight` board (4 states), overview out-of-scope + badges updated; stickies R1–R6 green; Q1 placement / audience raised | DR-014 (Field 12 Oct) · Cowork drew |
| 3 | 2026-10-17 | Q1 decided and drawn: ai-insight caption + frame 1 label (top, under KPI) · new frame 5 manager view (reason-grouped, no names) · board 5372 wide, stickies R7 / Q1 moved right · Q1 green | Decided 2026-10-17 (Field) · Cowork drew |

## 11. Source snapshot
Pending — after Field approves rev 1. Lucide UMD `/_blob/b453750cfe40fe5127eeb679cdc9317d`.

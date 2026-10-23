# BRIEF-037 — Web POS: owner dashboard (ภาพรวมรายได้ + วันนี้)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-22 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | frontend |
| **Revision** | 1 |
| **Depends on** | **BRIEF-036 merged** (reports API + `seed:demo-history`) · BRIEF-034 ✅ (POS shell, `BoardEvents`) |
| **References** | CD-05 boards `overview` (1 1280 · 2 1024), `today` (1 1280), `states`, §4 Action table, §7 Layout, §8 Components, §9 rules · CD-05 R2 (chart tokens, Field 17 Oct) · DR-015 (Recharts `^3.9.0`) |
| **Audit depth** | Compact (read-only UI; figures come from the server) |
| **Size** | ~1–1.5 days · est. ~550–650 net-new lines incl. tests |

---

## 1. Goal
The owner opens รายงาน on the POS and sees in one screen how much the bar made, what sells, and how tonight is going — the second half of the 10 Nov story after the POS.

## 2. Scope
### In
- **Route `/pos/reports`** (rail "รายงาน" gets `href`), header: title "รายงาน" + Tabs **ภาพรวมรายได้ · วันนี้** (last tab remembered per browser, `localStorage` in try/catch).
- **ภาพรวมรายได้ (CD-05 overview·1 / ·2):**
  - Period Select วันนี้ · 7 วัน · **30 วัน (default)** · กำหนดเอง (DateRangePicker, ≤ 92 days). Business dates computed from the venue cut-off (`GET /venue`), ending today.
  - 4 tiles (Card): ยอดขาย · จำนวนบิล · เฉลี่ยต่อบิล · การชำระเงิน (8 px stacked split bar PromptPay / เงินสด with direct % labels + legend). Delta vs previous period ("+12% จากช่วงก่อน") in `--success-fg` / `--text-danger`; no delta when previous = 0.
  - Daily revenue line (Recharts `LineChart`, 2 px `--chart-1`, 3 hairline grid lines, hover tooltip "10 ต.ค. ฿24,440.00") + "ดูเป็นตาราง" toggle showing the same data as a Table (accessibility, CD-05 §9).
  - ขายดี 5 อันดับ / ขายน้อย 5 อันดับ lists: name (1 line, truncate) · qty · revenue, 6 px bars scaled to list max in `--chart-1`.
  - Manual confirmations line under the split ("ยืนยันเอง n ครั้ง") — fact only, no names.
  - Out-of-scope card "ต้นทุนและสต็อก — เร็วๆ นี้" (CD-05 out of scope).
- **วันนี้ (CD-05 today·1):** tiles ยอดวันนี้ · บิลที่ปิดแล้ว · ออเดอร์รอทำ (→ link `/pos/orders`) · มีปัญหา (→ `/pos/orders`); hourly bars (Recharts `BarChart`, 4 px rounded tops, value labels on filled bars, future hours dashed — show from the first hour with data or 18:00, to the current hour + 2); open seats list (label · open time · total, oldest first, long-open in warning colour as CD-02 idle). "อัปเดต HH:MM น. · สด" live dot: refetch every 60 s + on `payment.status_changed` (completed) and `order.created`; socket down → grey "ไม่ได้อัปเดต", keep last data.
- **Chart tokens:** add `--chart-1` (#B87020 both themes) and `--chart-2` (#7E80D8 dark / #6E6FC8 light) to `app/frontend/src/app/globals.css` exactly as CD-05 R2 (Field accepted 17 Oct); charts read colours only from tokens.
- **Dependency:** `recharts@^3.9.0` (+ `react-is@^19.0.0` only if the install requires it) — DR-015 Approved.
- **States (CD-05 states board):** loading Skeletons per tile / chart · empty period "ยังไม่มียอดขายในช่วงนี้" · error Alert + ลองอีกครั้ง.
- `lib/api/reports.ts` + `useQuery` keys `['reports', kind, from, to]`; MSW handlers with the CD-05 §6 sample (30 days ฿440,660.00 · 600 bills · today ฿18,420.00).

### Out (do NOT build here)
- Comps / voids tab (with BRIEF-018) · AI insight card (AI epic) · phone 390 layout (responsive shell comes with the menu UI brief) · Excel export · per-staff anything (D3).

## 3. Contract
- **Endpoints used:** BRIEF-036 `/reports/summary`, `/daily`, `/items`, `/today` · `GET /venue` (cut-off).
- **WS events used:** `payment.status_changed`, `order.created` (existing).
- **Contracts changes:** none (schemas come from BRIEF-036).
- **Permissions:** `reports:read` (server-side; rail item hidden without it once IAM ships).
- **Business rules:** every number from the server — the client only formats (DR-004 money strings) and computes the delta % and bar widths · no ranking of people (CD-05 D3) · business day = venue cut-off.

## 4. Acceptance Criteria
- **AC-1** — Default 30 วัน: 4 tiles with server values, delta vs previous, split bar with % labels; switching to 7 วัน refetches with the right `from`/`to` (business dates, cut-off aware).
- **AC-2** — Daily line renders one point per day; tooltip shows date + ฿ value; "ดูเป็นตาราง" shows the same numbers.
- **AC-3** — Top / bottom lists show 5 rows each with qty and revenue; long names truncate to one line.
- **AC-4** — วันนี้: tiles, hourly bars, open seats oldest first; a `payment.status_changed` (completed) triggers a refetch and the "อัปเดต" time moves; socket down → grey "ไม่ได้อัปเดต" and data stays.
- **AC-5** — Loading / empty / error+retry per tab.
- **AC-6** — No hex colours in chart code; `--chart-1/2` defined in both themes.
- **AC-7** — Gates pass; run proof on `seed:demo-history` data.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-3, AC-5 | component | `src/app/pos/reports/_components/Overview.test.tsx` (MSW) |
| AC-2 | component | `RevenueChart.test.tsx` (table view + labels; chart internals not snapshot-tested) |
| AC-4 | component | `Today.test.tsx` (fake socket events, fake timers) |
| AC-1, AC-4 | e2e | `e2e/reports.spec.ts` (MSW) |

Gate commands (all must pass):
```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend test:e2e
pnpm --filter @bar/frontend build
```
Run proof (real API): `seed:demo-history` → `/pos/reports` 30 วัน + 7 วัน screenshots → วันนี้ tab → in a second tab pay a bill on the POS → วันนี้ updates without reload. Screenshots in the handoff.

### Local Sonar scan
- **Required for this brief: yes.**

## 6. Constraints
- `frontend.md` Hard Limits; tokens only; HeroUI v3 Tabs / Select / Card / Table / Skeleton / Alert; Recharts only for the two charts.
- Charts: `role="img"` + summary `aria-label`; numbers in text tokens, never the series colour; no colour-only meaning.

## 7. Decision Points (Field Guard)
- **Pre-decided:** overview + today only (Field 22 Oct) · `recharts@^3.9.0` (DR-015) · chart token values (CD-05 R2, Field 17 Oct) · route `/pos/reports`.
- **Q1 — Who lands on which tab? ✅ Decided (Field, 2026-10-22): A — ภาพรวมรายได้ for everyone, last tab remembered.** CD-05 D2: owner → ภาพรวมรายได้, manager → วันนี้, by group — groups don't exist until IAM. *Cowork recommends:* **A — default ภาพรวมรายได้ for everyone, remember the last tab** (by-group default comes with IAM). *Alternative:* **B — default วันนี้** (busier screen during service).
- **Likely DRs:** none.

## 8. Unlocked Protected Files
- `none` (`app/frontend/package.json` change is covered by DR-015).

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-22 | Initial Draft (Cowork) — owner side S5 #3 (dashboard UI); Field: overview + today only |
| 1 | 2026-10-22 | Ready — Field in session: "037 Q1 = A, approve BRIEF-037 Rev 1 Ready". Start only after BRIEF-036 is merged (merge `main` into this branch first). |

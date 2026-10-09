# CD-05 — Back office: dashboard (owner money view · manager action view · comps/voids)

**Status:** Draft — defaults D1–D3 for Field · **Surface:** web responsive 1280 (also 1024) + 390 phone (owner checks from the phone — DR-009) · **Used by:** S1 dashboard brief (if time) + advisor presentation · FRD §12

## Attach
**Open inside the existing Claude Design project** (Design systems tab → The Loft Bar Design System): https://claude.ai/design/p/99bbff1a-22a2-48d7-8dbc-3226d55e3457
`docs/design/CD-12-handoff.md` (responsive shell) once it exists · `docs/design/CD-01-handoff.md` (StatTiles on the old floor view) · FRD §12 · `docs/design-system.md` (chart colours via tokens)

## Data (endpoints added by the dashboard brief)
From orders + payments only in S1: revenue by day/week/month, bills count, average bill, items sold per menu item, payment method split (PromptPay vs cash, manual-confirm count), open tables now, comps/voids by reason (+ self-approved flag). Permission `reports:read`.

## Defaults (Field confirms or overrides)
- **D1 — S1 shows only metrics computable from orders + payments.** Margin, pour cost %, variance, low stock, dead stock, restock → **S2** (need inventory/recipes). Drawn as a disabled card "ต้นทุนและสต็อก — เร็วๆ นี้" so the advisor sees the plan.
- **D2 — One page, two tabs: "ภาพรวมรายได้" (owner) · "วันนี้" (manager)**, default by group; anyone with `reports:read` can switch.
- **D3 — Fraud view = comps/voids by reason + by person, no ranking/leaderboard** (FRD §12: no staff performance analytics). Spikes flagged with a warning chip, not a score.

## Paste into Claude Design
> Work inside **The Loft Bar Design System** project. **Web back office, responsive** — every artboard at **1280×800 and 390×844**, shell from CD-12 (rail "รายงาน" active). HeroUI v3 components (Card, Tabs, Chip, Select / DateRangePicker, Table, Skeleton, Alert, Tooltip-free); charts drawn as simple custom SVG (bar + line) using **tokens only** (`--accent`, `--chart-*` if present, else `--status-*`), tabular numerals, Thai labels. **Dark and light**. Money `฿18,420.00`. Artboards `CD-05/<id>`. **Static state boards**, standalone cards.
>
> 1. **CD-05/overview** (tab "ภาพรวมรายได้") — period Select (วันนี้ · 7 วัน · 30 วัน · กำหนดเอง). StatTiles: **ยอดขาย** ฿18,420.00 (+12% จากช่วงก่อน) · **จำนวนบิล** 25 · **เฉลี่ยต่อบิล** ฿736.80 · **สัดส่วนการชำระ** PromptPay 72% / เงินสด 28%. Line chart "ยอดขายรายวัน" (30 points). Two lists: **ขายดี 5 อันดับ** (name, qty, revenue, tiny bar) · **ขายน้อย 5 อันดับ**. Card "ยืนยันชำระด้วยตนเอง 3 ครั้ง" (warning chip, → list). Disabled Card "ต้นทุน กำไร และสต็อก — เร็วๆ นี้" (lock icon, muted).
> 2. **CD-05/today** (tab "วันนี้") — live: ยอดขายวันนี้, โต๊ะที่เปิดอยู่ 5 (mini list with T-labels + since + total), ออเดอร์รอทำ 3, มีปัญหา 1 (→ link), hourly bar chart "ยอดขายรายชั่วโมง" 18:00–02:00, "อัปเดต 21:14 น." with live dot.
> 3. **CD-05/comps-voids** — section/page "ยกเลิกรายการและ Comp": period Select, totals (ยกเลิก 6 รายการ ฿840.00 · Comp 4 รายการ ฿620.00), table by reason (สั่งผิด · ลูกค้าเปลี่ยนใจ · ของเสีย · บริการพิเศษ · อื่นๆ) and by person (name, count, amount, Chip "อนุมัติด้วยตนเอง 2" warning); spike flag Chip "สูงกว่าปกติ" on one reason. Note "ไม่ใช่การจัดอันดับพนักงาน".
> 4. **CD-05/states** — loading skeleton tiles + chart · empty period "ยังไม่มีข้อมูลในช่วงนี้" · error Alert "โหลดรายงานไม่สำเร็จ" + retry · phone layout of overview (tiles 2×2, chart full width, lists stacked).
>
> Out of scope: margin/cost/variance/stock (S2), staff performance/leaderboards (cut), export to Excel, AI insights (S2), LINE OA.

## Acceptance (Field checks)
- Every artboard at 1280 and 390, dark + light; charts use tokens only.
- No staff ranking anywhere; S2 metrics only as the disabled "เร็วๆ นี้" card.
- No out-of-scope items appear.

## Result
- Claude Design link: <after run>
- Handoff: `docs/design/CD-05-handoff.md` · screenshots `docs/design/assets/CD-05/`

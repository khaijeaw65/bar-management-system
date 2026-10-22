# BRIEF-036 — Backend: reports API (overview + today) + demo history seed

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-22 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 1 |
| **Depends on** | BRIEF-012 ✅ (orders, tickets) · BRIEF-013 ✅ (payments) · BRIEF-011 ✅ (visits) · BRIEF-016 ✅ (venue cut-off) |
| **References** | CD-05 R5, R6, §4, §9 · DR-014 #4 (business day) · DR-004 (money on the wire) · `order/application/business-date.ts` · `docs/schema.sql` §5–§7 |
| **Audit depth** | Full (money figures) |
| **Size** | ~1.5 days · est. ~500–600 net-new lines incl. tests |

---

## 1. Goal
The owner's dashboard gets correct numbers from the server: revenue, bills, average bill, payment split, daily trend, best / worst sellers, and a live "tonight" view — all by business day (cut-off, Asia/Bangkok). A dev-only seed fills 30 days of history so the dashboard can be demoed.

## 2. Scope
### In
- **New module `modules/reports/`** (layout per `docs/rules/backend.md`): `ReportsController` → `ReportsService` → `ReportsQueries` (read-only SQL over `payment`, `visit`, `order`, `order_item`, `menu_item`, `ticket`, `table_seat`; no writes, no other module's services) — see Q1.
- **`GET /reports/summary?from&to`** (business dates `YYYY-MM-DD`, inclusive, `from ≤ to`, ≤ 92 days) →
  `{ from, to, revenue, bills, averageBill, payments: { promptpay: { amount, count }, cash: { amount, count } }, manualConfirmations, previous: { from, to, revenue, bills, averageBill } }`
  - revenue = sum of `completed` payments whose `paid_at` falls in the period's business days · bills = visits **closed** in the period · averageBill = revenue / bills, excluding ฿0 bills (CD-05 R6); `"0.00"` when no bills · previous = same length right before.
- **`GET /reports/daily?from&to`** → `{ items: [{ date, revenue, bills }] }` — every date in range present (zeros filled), ascending.
- **`GET /reports/items?from&to&sort=top|bottom&limit=5`** (limit 1–20) → `{ items: [{ menuItemId, name, quantity, revenue }] }` — non-cancelled order lines whose order belongs to the period; revenue = `unit_price_snapshot × quantity`; **bottom** excludes items currently unavailable or created < 7 days ago, and includes items with 0 sales (CD-05 R6). Charge items excluded.
- **`GET /reports/today`** → `{ businessDate, revenue, bills, hourly: [{ hour, revenue }] (24 buckets starting at the cut-off hour), openSeats: [{ seatLabel, openedAt, total }] (oldest first), pendingTickets, escalatedIssues, generatedAt }`.
- Business day = `businessDate(paid_at | closed_at | order created_at, venue cut-off)` — reuse `order/application/business-date.ts` (move to `common/` if two modules need it — allowed, no behaviour change).
- Money = `MoneySchema` strings (DR-004), computed in SQL `NUMERIC`, never JS floats.
- Contracts: `ReportsPeriodQuerySchema`, `ReportItemsQuerySchema`, `ReportSummarySchema`, `ReportDailySchema`, `ReportItemsSchema`, `ReportTodaySchema`; OpenAPI; `docs/api/README.md` Reports table.
- **Dev seed `pnpm --filter @bar/backend seed:demo-history`** — 30 business days ending yesterday: realistic visits / orders / payments over the seeded menu and seats (Fri / Sat peaks, ~70 % PromptPay, a few manual confirmations, 1–2 cancelled lines per day). Idempotent (tags rows, re-run replaces only its own rows). **Refuses to run when `NODE_ENV=production`.** Rows go through repositories / `save()` so audit columns are filled (`created_by` = seeded staff).

### Out (do NOT build here)
- `/reports/comps-voids` (with BRIEF-018) · AI insight (`ai_insight`, AI epic) · margin / cost / stock · promo split (`is_promo`, S2) · Excel export · caching (data is small; revisit after AWS).

## 3. Contract
| Method | Path | Request → Response | Permission |
|---|---|---|---|
| GET | `/reports/summary` | `from`, `to` → `ReportSummary` | `reports:read` |
| GET | `/reports/daily` | `from`, `to` → `ReportDaily` | `reports:read` |
| GET | `/reports/items` | `from`, `to`, `sort`, `limit?` → `ReportItems` | `reports:read` |
| GET | `/reports/today` | → `ReportToday` | `reports:read` |
- **WS events:** none (UI refetches; `payment.status_changed` already exists).
- **Errors:** 400 `VALIDATION_ERROR` (bad dates, `from > to`, > 92 days, bad sort / limit).
- **Permissions:** `reports:read` (declared; enforcement → IAM brief).
- **Business rules:** CD-05 §9 Metrics (D1) · R6 counting rules · business day = venue cut-off (DR-014 #4) · no staff ranking anywhere (D3 — no per-person fields in these responses).

## 4. Acceptance Criteria
- **AC-1** — Fixture: 3 business days with known payments (incl. one at 01:30 → previous day, one ฿0 bill, one manual confirm, one cancelled payment) → `summary` returns exact revenue / bills / average / split / manual count; `previous` computed on the prior equal-length window.
- **AC-2** — `daily` returns every date in range with zeros filled; totals equal `summary`.
- **AC-3** — `items` top / bottom: cancelled lines and charge items excluded; bottom excludes an unavailable item and an item created 3 days ago, includes a 0-sales item.
- **AC-4** — `today`: hourly buckets start at the cut-off hour and sum to `revenue`; open seats oldest first with totals; pending / escalated counts match tickets.
- **AC-5** — Invalid query → 400 with field paths; > 92 days → 400.
- **AC-6** — `seed:demo-history` creates 30 days, re-run is idempotent (same counts), refuses with `NODE_ENV=production`.
- **AC-7** — Gates + run proof pass; OpenAPI + `openapi:check`; README updated.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1 – AC-5 | integration (real Postgres) | `app/backend/test/reports.e2e-spec.ts` |
| AC-1 | unit | business-day bucketing spec |
| AC-6 | integration | seed spec |

Gate commands (all must pass):
```bash
pnpm --filter @bar/contracts build
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck && pnpm --filter @bar/backend test && pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:check
```
Run proof: `seed:demo-history` on the local DB → `curl` (as Field's session) `summary` 30 days, `daily`, `items` top / bottom, `today` → paste trimmed JSON in the handoff; one figure cross-checked by a hand SQL query.

## 6. Constraints
- Read-only module: no `save()`, no writes outside the seed CLI.
- SQL parameterised; indexes only if a query plan shows a seq-scan problem on seeded data (then a migration — schema change → ask first).

## 7. Decision Points (Field Guard)
- **Pre-decided (Field 22 Oct, session):** overview + today only (comps / voids later with BRIEF-018) · demo history seed is dev-only.
- **Q1 — Where report SQL lives. ✅ Decided (Field, 2026-10-22): A — `reports` module with read-only SQL over other modules' tables.** *Cowork recommends:* **A — a `reports` module that reads other modules' tables with read-only SQL** (one place for every figure; the usual read-model pattern; no service-to-service calls). *Alternative:* **B — each module exposes a stats method** (order / payment / venue) and reports composes them — more files and cross-module calls, harder to keep periods consistent.
- **Likely DRs:** none (Q1 = A recorded here).

## 8. Unlocked Protected Files
- `none`

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
| 1 | 2026-10-22 | Initial Draft (Cowork) — owner side S5 #2 (dashboard backend); Field: overview + today only |
| 1 | 2026-10-22 | Ready — Field in session: "036 Q1 = A, approve BRIEF-036 Rev 1 Ready" |

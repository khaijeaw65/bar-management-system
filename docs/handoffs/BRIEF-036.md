# Handoff — BRIEF-036 Backend: reports API (overview + today) + demo history seed

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-23 |
| **Brief revision** | 2 |
| **Branch** | `feat/BRIEF-036-reports-api` (seed `eb3de28` + Rev 2 `341ebb5`; `main` merged in at `5136a83`; PR opens with the PASS commit) |
| **Work SHA** | `095e91b` |
| **Assigned auditor** | Cowork |
| **Status** | Implemented — waiting for `audit BRIEF-036` |

## Summary
- **Rev 2 — e2e on `bar_test` (done first).** `test/set-auth-env.ts` now *forces* `PGDATABASE` to `testDatabaseName()` = `PGDATABASE_TEST ?? 'bar_test'` (CI's `PGDATABASE: bar` is ignored on purpose). `test/test-database.ts` aborts when that name is `bar` or the `PGDATABASE` in `app/backend/.env`. `test/global-setup.ts` (Vitest `globalSetup` in `vitest.config.e2e.ts`) creates the database through the `postgres` maintenance DB if missing and runs all migrations on it. CI: same Postgres service, the `bar` superuser creates `bar_test` → **no workflow change** (the CI log line still prints `…/bar`; cosmetic, `.github/**` is protected).
- **`modules/reports/`** (Q1 = A): `ReportsController` → `ReportsService` → `REPORT_QUERIES` port → `ReportsTypeormQueries` (read-only `DataSource.query`, parameterised SQL in `reports.sql.ts`, no writes, no other module's services). Money summed / averaged in SQL `NUMERIC` (`ROUND(revenue / paid_bills, 2)`), formatted with `common/money.ts` (string, no floats).
  - Business day: a period = one half-open range `[businessDayStart(from), businessDayStart(to + 1))`; daily grouping in SQL = `(ts AT TIME ZONE 'Asia/Bangkok' − cutoff)::date` — the same rule as `businessDate()` (unit-tested against it). Cut-off read from `venue.business_day_cutoff` (schema default `06:00` if no venue row).
  - `summary`: revenue = `completed` payments by `paid_at` · bills = `closed` visits by `closed_at` · average = revenue ÷ closed bills whose completed payments > 0 (CD-05 R6) · split by method · `manualConfirmations` = `confirmed_via = 'manual'` · `previous` = same length ending the day before.
  - `daily`: zeros filled in the service (`fillDays`). `items`: orders by `order_record.business_date`, non-cancelled lines, revenue = `unit_price_snapshot × quantity` (as the brief says — modifier deltas not added), charge items excluded; `top` by revenue desc; `bottom` by quantity asc over every non-charge item that is available, in an active category and created ≥ 7 days before now (0 sales included).
  - `today`: business date = `businessDate(now, cutoff)`; `hourly` = 24 Bangkok hours from the cut-off hour; `openSeats` = live visits (`open/active/idle`), bill total as the POS (`BILL_SQL` — includes modifier deltas), oldest first; `pendingTickets` = the station queue (`pending/accepted/ready`, charge tickets excluded — same as `GET /tickets` default); `escalatedIssues` = `issue` with `issue_escalated_at`.
- **`businessDate` moved to `common/business-date.ts`** (+ `businessDayStart`, `addDays`, `daysBetweenInclusive`); `order/application/business-date.ts` keeps `businessDateUnder` only. No behaviour change (`previousDay` = `addDays(-1)`); specs split accordingly.
- **Contracts `schemas/reports.ts`:** `ReportsPeriodQuerySchema`, `ReportItemsQuerySchema` (`limit` coerced, default 5, 1–20), `ReportSummary/Daily/Items/TodaySchema`, `REPORT_MAX_PERIOD_DAYS = 92`. OpenAPI regenerated (`scripts/create-openapi-document.ts` now lists `ReportsController`); `docs/api/README.md` Reports table.
- **`seed:demo-history`** (`src/cli/demo-history*.ts`, `seed-demo-history.ts`, script in `app/backend/package.json` — the exact command named in the brief scope): 30 business days ending yesterday, deterministic per date (mulberry32) — weekday bills 11–16, Fri 28+, Sat 32+ · ~70 % PromptPay (≈ 8 % `manual`, rest `slip_verify`), cash `cash` · 1–2 cancelled lines per day (a visit left with only cancelled lines closes as a ฿0 bill, no payment). Visits tagged `guest_label = 'demo-history'`; a re-run deletes exactly the tagged rows (+ their orders / tickets / items / payments / links) and rewrites them in one transaction; order numbers continue after the day's max. Written with repositories + `save()`; the CLI has no Nest / CLS, so `created_by` / `updated_by` = first active staff and `created_at` = the historical time are set in the seed (comment in code). Refuses `NODE_ENV=production`.

## AC evidence
| AC | Evidence |
|---|---|
| AC-1 | `reports.e2e-spec.ts` summary: 3 days (12–14 Oct) — 01:30 payment + 01:40 close → 13 Oct, ฿0 bill (only a cancelled ฿999 payment), 1 manual confirm, previous window 9–11 Oct → exact `{ revenue 1500.00, bills 4, average 500.00, promptpay 1200.00/2, cash 300.00/1, manual 1, previous 200.00/1/200.00 }`; empty period → `"0.00"`. Unit: `report-period.spec.ts` (window edges, 01:30 → previous day, previous period), `common/business-date.spec.ts` |
| AC-2 | e2e daily 11–14 Oct → 4 rows, 11 Oct zeros; daily 12–14 sums = summary. Run proof: 30 rows sum ฿753,570.00 / 590 = summary |
| AC-3 | e2e top `[ปีกไก่ 4/720, เบียร์ 3/360, เมนูใหม่ 1/150, เลิกขาย 1/90]` (cancelled beer + charge line excluded, `limit=1` → 1); bottom `[ขายไม่ออก 0, เบียร์ 3, ปีกไก่ 4]` (unavailable + 3-day-old item skipped) |
| AC-4 | e2e today (clock 15 Oct 22:00): 06:30 + 21:10 payments → `hourly[0] = {6, 1000.00}`, hour 21 = 250.00, sum = revenue 1250.00, bills 2; open seats C1 19:00 (฿440 incl. ฿10 modifier) then C2 20:30; pending 2 (pending + accepted; issue tickets not counted), escalated 1 |
| AC-5 | e2e `it.each` 7 bad queries → 400 `VALIDATION_ERROR`, `data: null`, specific message; 92 days → 200, 93 → 400. **Field paths: not in the response — DR-021 Approved B** (see Deviations); paths per field are asserted on the shared schema in `contracts/schemas/reports.test.ts` |
| AC-6 | `demo-history-seed.e2e-spec.ts`: 30 days 22 Sep–21 Oct, Fri / Sat busiest weekdays, all orders / items / payments `created_by` = staff, `cash / manual / slip_verify` present, ≥ 30 cancelled lines; re-run → identical counts and a non-demo visit survives; `assertDemoSeedAllowed('production')` throws. Local: two runs → `30 days, 590 bills, 589 payments` both times |
| AC-7 | gates below; `openapi:check` exit 0; README Reports table |
| AC-8 | Local `bar` after `seed:staff` + `seed:venue` + `seed:menu` + `seed:demo-history`: `staff 1 · payment 589 · visit 590 · venue 1 · menu_item 11` before **and after** a full `test:e2e` (identical). `PGDATABASE_TEST=bar pnpm … test:e2e` → aborts in global setup: *e2e refused to run against "bar" — that is the dev database…* |

## Gate Evidence (G1)
Node v24, pnpm 10, Docker Postgres 16 + Redis 7, on `095e91b` (working tree = commit for app code).

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts build` (+ `test`) | 0 | build ok · 42 tests (9 files; new `reports.test.ts`) |
| `pnpm --filter @bar/backend lint` | 0 | oxlint + class-file check clean |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 102 passed (34 files) |
| `pnpm --filter @bar/backend test:e2e` | 0 | 120 passed (20 files; `reports` 14, `demo-history-seed` 3) — with the dev backend **stopped**, see Limitations |
| `pnpm --filter @bar/backend openapi:check` | 0 | no diff after commit (+781 lines, 4 paths, tag `reports`) |

## Run proof
On `095e91b`: backend from an earlier session on :3001 stopped · `migration:run` → no migrations pending · fresh `node dist/main.js` → `/api/health` **200** `status=ok`, `db=up`. The dev DB `bar` was empty (wiped by pre-Rev 2 e2e) → `seed:staff -- --line-user-id U-demo-owner --name "Field (demo)"`, `seed:venue` (cut-off 06:00), `seed:menu`, `seed:demo-history`. Session = `TokenService.createSession(<seeded staff>)` from a local script (no LINE). **Local data touched for the proof:** `UPDATE menu_item SET created_at = created_at - 30 days` (menu seeded tonight would otherwise be < 7 days old → bottom empty, by design); T1 + T2 opened and ordered via `POST /visits` + `/visits/:id/orders`, T2 paid cash + closed via the API.
```
summary 22 Sep–21 Oct  {revenue 753570.00, bills 590, averageBill 1279.41,
                        promptpay {530410.00, 422}, cash {223160.00, 167}, manualConfirmations 31,
                        previous {23 Aug–21 Sep, 0.00, 0, 0.00}}
daily                  30 items [22 Sep 16650.00/16, 23 Sep 17530.00/15 … 20 Oct 12960.00/13, 21 Oct 17740.00/16]
                       Σ 753570.00 / 590 = summary
items top limit 3      โอลด์แฟชั่น 688/212080.00 · ลีโอ 4 ขวด + ถังน้ำแข็ง 373/145470.00 · ค็อกเทล 1 แถม 1 348/83520.00
items bottom limit 3   ช้างดราฟต์ 342/41040.00 · เนโกรนี 344/82560.00 · ค็อกเทล 1 แถม 1 348/83520.00
today                  {businessDate 2026-10-22, revenue 240.00, bills 1, openSeats [T1 19:10Z 240.00],
                        pendingTickets 2 (= GET /tickets: T1, T2), escalatedIssues 0}; hourly 24, first hour 6, only hour 2 = 240.00
400                    from > to → ["วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น"] · limit=21 → ["limit ต้องอยู่ระหว่าง 1–20"]
hand SQL 17 Oct        SUM(amount) completed, (paid_at@BKK − 6 h)::date = 17 Oct → 43420.00 = daily 17 Oct 43420.00 (32 bills)
```

## Sonar (local scan)
Scanned `095e91b`. Gate ERROR: `new_coverage` 0 % (no coverage path — known) and `new_violations` 16 — HIGH 5 · MEDIUM 5 · LOW 6 · INFO 1, all pre-existing (`frontend/src/test/setup.ts`, order / payment / menu / seed, `globals.css`, `openapi/document.ts`). **17 open issues in the project, none in a file this brief changes or adds** (checked against `git diff --name-only main...HEAD`). No exclusions, won't-fix or gate change.

## Deviations / decisions
- **AC-5 "field paths" vs DR-021 (Approved B, 22 Oct):** no field-path envelope and option C (prefix messages with the path) was not chosen. Approved DR > brief → 400 keeps the standard envelope; each message is field-specific; the UI gets paths from the shared schema (as BRIEF-035 AC-2). I first built a reports-local path prefix and removed it before this SHA. Auditor: please confirm this reading.
- `app/backend/package.json`: one new script `seed:demo-history` — the exact command the brief scope names; no dependency change.
- Interpretations (no DR — inside brief wording): bottom also skips items in an inactive category (the menu treats them as unavailable); `pendingTickets` = station queue incl. `ready` (matches the CD-15 board the tile links to); open-seat total includes modifier deltas (POS bill), while `items` revenue does not (brief formula).
- Demo seed: PromptPay confirmations default to `slip_verify` (only `manual` exists in the app today; EasySlip = BRIEF-025) so "a few manual confirmations" stays a minority.

## Limitations / follow-ups
- **A running dev backend can make `test:e2e` fail** (`payment.e2e` expiry): both share Redis / BullMQ `payments`, so the dev worker may take the test's expiry job and look the payment up in `bar`. Seen once on this branch, passes with :3001 stopped. Before Rev 2 the shared DB hid this. Fix needs a Redis DB index / queue prefix for tests — BullMQ drops the DB index today (BRIEF-013 S2) → follow-up, not done here. Until then: stop the dev backend before e2e. (e2e `flushdb` also clears dev sessions — pre-existing.)
- `today` uses `businessDate(now, cutoff)`, not `businessDateUnder` — during the in-memory grace after a cut-off change (DR-021 / BRIEF-035) the dashboard's "today" may differ from order numbering until the next business day. Reports cannot read the in-process value (no cross-module service, Q1 = A).
- Historical periods use the **current** cut-off for every day (no cut-off history in the schema).
- `seed:demo-history` does not backdate the menu → on a freshly seeded menu `bottom` stays empty for 7 days (Field: say if the seed should backdate its menu for the 037 demo — would touch rows it does not own).
- Dev DB staff is now `Field (demo)` with LINE sub `U-demo-owner`; Field's own LINE sign-in will be `not_registered` until `seed:staff` runs with his sub (as after BRIEF-035).
- Size: ~1,790 net lines (excl. `openapi.json`), tests ≈ 675 (38 %) — ~3× the 500–600 estimate (Rev 2 setup + two fixture-heavy e2e specs).

## AI usage
High — Claude Code implemented the whole brief (Field = reviewer mode).

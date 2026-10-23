# Audit — BRIEF-036 Backend: reports API (overview + today) + demo history seed

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-23 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-23 |
| **Branch / commit** | `feat/BRIEF-036-reports-api` · `095e91b` (work; `main` merged at `5136a83`) · handoff `ef8fea1` · seeds `eb3de28` + Rev 2 `341ebb5` |
| **Depth** | Full (money figures) |
| **Brief revision** | 2 |
| **Recommendation** | **PASS** ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `PERIOD_TOTALS_SQL`: revenue = `completed` by `paid_at` in `[start, end)`, bills = `closed` by `closed_at`, average = `ROUND(revenue / paid_bills, 2)` in `NUMERIC` with ฿0 bills excluded, split by method, `manual` count · `reportWindow` = `[businessDayStart(from), businessDayStart(to + 1))` · `previousPeriod` same length · e2e fixture (01:30 → previous day, ฿0 bill, cancelled payment) exact values | |
| AC-2 | ✅ | `DAILY_TOTALS_SQL` buckets by `(ts AT TIME ZONE 'Asia/Bangkok' − cutoff)::date` (unit-tested against `businessDate`) · `fillDays` zero-fills · run proof: 30 rows Σ = summary; hand SQL for 17 Oct matches | |
| AC-3 | ✅ | `ITEM_SALES` excludes cancelled lines; top excludes `charge`; bottom = available, active category, `created_at ≤ now − 7 d`, 0-sales included · e2e lists | |
| AC-4 | ✅ | `hourlyBuckets` 24 from the cut-off hour; open seats oldest first with POS bill total (incl. modifiers); escalated issues only · e2e at a fixed clock | See Finding 2 (pending count includes `ready`) |
| AC-5 | ✅ | 7 bad queries → 400, 92 → 200, 93 → 400 | No field paths — **correct reading: DR-021 Approved B (22 Oct) supersedes the brief wording**; shared schema carries the per-field rules |
| AC-6 | ✅ | deterministic 30 days, tag `guest_label = 'demo-history'`, re-run deletes only tagged rows in one transaction (non-demo visit survives — tested), refuses `production` | |
| AC-7 | ✅ | gates exit 0 (handoff) · `openapi:check` 0 · README Reports table · Cowork re-ran backend `tsc --noEmit` on `ef8fea1`: exit 0 | |
| AC-8 (Rev 2) | ✅ | `set-auth-env.ts` **forces** `PGDATABASE = testDatabaseName()` (`PGDATABASE_TEST ?? 'bar_test'`); `test-database.ts` refuses `bar` and the `.env` value; `global-setup.ts` creates + migrates `bar_test` · row counts on `bar` identical before / after a full `test:e2e`; pointing at `bar` aborts | CI needs no workflow change ✅ |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Q1 = A (read-only reports module) | ✅ | port `REPORT_QUERIES` → `DataSource.query`, parameterised SQL only, no writes, no other module's services |
| Money (DR-004) | ✅ | all sums / averages in SQL `NUMERIC`, strings on the wire, no JS floats |
| No staff ranking (CD-05 D3) | ✅ | no per-person fields |
| Permissions | ✅ | `@RequirePermissions('reports:read')` on all four |
| Deps / protected files | ✅ | no dependency; `app/backend/package.json` = one script named in the brief scope; `.github/**` untouched |
| `businessDate` move to `common/` | ✅ | allowed by the brief, no behaviour change, specs split |
| Sonar | ✅ | none in changed files; 16 pre-existing |
| Size | ⚠️ ok | ~1,790 net lines vs 500–600 — ~3× (Rev 2 setup + fixture-heavy e2e). Noted for sizing |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Carry-over (before the next backend brief) | Medium | **Current:** e2e and the dev backend share **Redis** (BullMQ `payments` queue + sessions): a running dev backend can steal the test's expiry job (seen once), and e2e `flushdb` signs out dev sessions. **Updated:** give tests their own Redis DB index / queue prefix — depends on BRIEF-013 S2 (BullMQ drops the DB index), already planned before AWS. Until then: stop the dev backend before `test:e2e` (handoff note). |
| 2 | Suggestion (decide in BRIEF-037) | Low | `today.pendingTickets` counts `pending + accepted + ready`; CD-05 labels the tile **ออเดอร์รอทำ** ("waiting to be made"). With the kitchen screen on, `ready` tickets are made, waiting to be served. **Updated:** keep the number (it matches the board the tile links to) and label the tile **ออเดอร์ค้าง** in BRIEF-037 — UI copy only, no API change. |
| 3 | Info | — | Reports use the current cut-off for every day and `today` uses `businessDate` (not the in-memory grace from BRIEF-035) — acceptable, documented in the handoff. |
| 4 | Field action before Monday | — | Dev DB staff is now **"Field (demo)" / `U-demo-owner`** → your own LINE login returns `not_registered` until `seed:staff` runs with your LINE sub. Do it before the Monday update. |

## Recommendation to Field
PASS. Every figure is computed once, in SQL, on business days that match order numbering; the run proof cross-checks a day by hand; and Rev 2 finally protects your dev/demo data from test runs (proven with row counts). The Redis sharing (Finding 1) is the next leak of the same kind — fold it into BRIEF-013 S2.

**Next command:** `execute BRIEF-036` (PASS commit: this audit + handoff + state, then PR; merge when `ci` is green) → then `execute BRIEF-037` (merge `main` first; use label ออเดอร์ค้าง per Finding 2 if you agree).

## Evidence Coverage
- Reviewed work SHA: `095e91b` (handoff `ef8fea1`)
- Sources inspected independently: `reports.sql.ts` (all queries), `report-period.ts`, `reports.typeorm-queries.ts` (params), `reports.controller.ts` (permissions / parsing), `reports.service.ts` (7-day rule, today), `test/test-database.ts`, `test/global-setup.ts`, `test/set-auth-env.ts` diff, `cli/seed-demo-history.ts`, `cli/demo-history.ts` (delete scope, production guard, transaction)
- Tests: backend `tsc --noEmit` re-run on `ef8fea1` (exit 0); jest / e2e not re-run (Cowork shell) → GitHub `ci`
- Written uncommitted; the executor commits it unchanged at PASS.

## Field, 2026-10-23 (session): carry the DB / Redis issues in KJ state
Field asked to note the dev-environment issues in state and pick them up **after the current brief set (036–038) is done**. The PASS commit adds this exact line under `## Carry over` in `docs/state/kj/SESSION_STATE.md` (Field-instructed text, copied verbatim — executors otherwise keep Carry over unchanged):

`- Dev env isolation (Field 23 Oct — after 036–038): e2e still shares Redis with the dev backend (BullMQ payments queue steals test expiry jobs; e2e flushdb signs out dev sessions) → own Redis DB index / queue prefix for tests, together with BRIEF-013 S2 (BullMQ drops the DB index) · until then stop the dev backend before backend test:e2e · after any e2e/seed reset: re-run seed:staff with Field's LINE sub (dev DB staff is "Field (demo)" / U-demo-owner since BRIEF-036) · demo menu needs created_at ≥ 7 days for "ขายน้อย" (BRIEF-036 run proof backdated it by hand)`

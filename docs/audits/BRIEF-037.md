# Audit — BRIEF-037 Web POS: owner dashboard (ภาพรวมรายได้ + วันนี้)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-23 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-23 |
| **Branch / commit** | `feat/BRIEF-037-dashboard-ui` · work `3c3dd32` + fix `536b24b` (**S = `536b24b`**) · handoff `d26ba8c` · `main` merged at `5480281` (after BRIEF-036 #78) · seed `13dbaef` |
| **Depth** | Compact (read-only UI; figures from the server) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `useReportPeriod`: default preset `"30"`, range = `presetPeriod(preset, businessToday(now, venue.businessDayCutoff))` · `businessToday` = now + 7 h − cut-off → same result as backend `businessDate()` (`common/business-date.ts`), incl. the cut-off edge tests in `period.test.ts` · `SummaryTiles`: values = server strings via `formatTHB`, delta via `deltaPercent` on satang / counts, `null` when previous = 0 · `PaymentSplit` % from the two method amounts, `role="img"` + label · `Overview.test.tsx` asserts first request `from=2026-09-23&to=2026-10-22` at 05:30 BKK and 7 วัน → `2026-10-16…22` · run proof 1–2 | |
| AC-2 | ✅ | `RevenueChart`: one point per `daily.items` row, `Number()` only for positioning, tooltip/table show the server money string · `DailyTable` same rows · `role="img"` + summary `aria-label` · run proof 3 (Σ 7 rows = tile) | |
| AC-3 | ✅ | `getReportItems(…, limit=5)` top / bottom · `ItemsList`: name `truncate`, `ขาย n`, revenue, 6 px bar scaled to list max (`--chart-1`) · test asserts 5 + 5 rows and `truncate` | Top scaled by revenue, bottom by quantity — matches CD-05 labels "(ตามยอดขาย)" / "(ตามจำนวน)" |
| AC-4 | ✅ | `useTodayReport`: `refetchInterval` 60 s, refetch on `order.created` and on `payment.status_changed` parsed with the contracts schema and `status === "completed"` · `useDisconnected` (existing, 3 s) → `stale` → grey dot "ไม่ได้อัปเดต", `today.data` kept · open seats rendered in server order (oldest first) · `Today.test.tsx`: pending → no refetch, completed → refetch + time 21:14 → 21:20, 60 s timer, disconnect keeps data · run proof 4–5 (second-tab payment, no reload, 2 requests total) | `order.created` path untested — Finding 3 |
| AC-5 | ✅ | `ReportSkeleton` (`aria-busy`), `ReportEmpty`, `LoadError` + ลองอีกครั้ง on both tabs; overview retry targets only failed queries (or the venue query) · tests for both tabs | |
| AC-6 | ✅ | Cowork hex scan over `pos/reports/**` + `mocks/reports.ts` → none · chart colours via `var(--chart-1)` / `fill-chart-*` / `bg-chart-*` only · `globals.css`: `--chart-1 #B87020` in `:root,.dark` and `.light`; `--chart-2 #7E80D8` / `#6E6FC8`; `--color-chart-*` mapping — values exactly CD-05 R2 | |
| AC-7 | ✅ | Handoff: lint / typecheck / test (138) / e2e (15) / build exit 0 on `536b24b` · run proof on `seed:demo-history`, fresh backend, `/api/health` 200, 7 screenshots (Cowork viewed 30 วัน + วันนี้-after-payment: match code and CD-05 layout) · Cowork re-ran `tsc --noEmit` (exit 0) and `eslint` on all touched frontend files (exit 0) on `d26ba8c` | Vitest / Playwright / build not re-run by Cowork — see Evidence Coverage |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope (overview + today only) | ✅ | no comps/voids tab, AI card, phone layout, export or per-staff data; ComingSoon card per CD-05 |
| Business rules — server owns numbers (DR-004) | ✅ | client only formats, computes delta % and bar widths; no money arithmetic beyond `sumMoney` for the hourly aria label |
| No ranking of people (CD-05 D3) | ✅ | no staff fields anywhere |
| Contracts | ✅ | `lib/api/reports.ts` parses with BRIEF-036 schemas; no contract change; query keys `['reports', kind, from, to]` + `['reports','today']` |
| Dependency (DR-015) | ✅ | `app/frontend/package.json`: `recharts ^3.9.0` only (resolved 3.10.1); lockfile adds recharts' own tree (d3-*, redux toolkit, victory-vendor…); `react-is` already present → not added, as DR-015 allows |
| Protected files | ✅ | none touched (`globals.css` change is in brief scope) |
| HeroUI / Recharts only for the two charts | ✅ | Tabs / Select / DateRangePicker / Card / Table / Skeleton; split bar + list bars are plain SVG, no `style={{}}` |
| Storage | ✅ | `reports.tab` read/write each in try/catch, default ภาพรวมรายได้ (Q1 = A) |
| Accessibility (CD-05 §9) | ✅ | charts `role="img"` + summary label, table toggle, numbers in text tokens, long-open seat has icon + sr-only "เปิดนาน" (not colour-only) |
| Tile label ออเดอร์ค้าง (brief: ออเดอร์รอทำ) | ✅ | Follows BRIEF-036 audit Finding 2 (count includes `ready`); UI copy only, no AC or contract affected → not a Field Guard trigger |
| Sonar | ✅ | no issues in files this brief adds; only pre-existing `css:S4666` in `globals.css` |
| Size | ⚠️ | 1,468 net app lines (943 excl. tests + MSW sample) vs §2 ~500 and the brief's 550–650 estimate — Finding 4 |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Suggestion (Field confirm) | Low | **Current:** `OpenSeatsList` marks a seat "long-open" at ≥ 3 h open (`LONG_OPEN_MS`). CD-05 R3 says "warning colour as CD-02 idle", but CD-02 idle is *no activity for 25 min*, which `/reports/today` does not expose (no last-activity field). **Updated:** accept 3 h as a UI-only threshold for now (no data/flow effect), or note a follow-up to add `lastActivityAt` to `openSeats` when CD-02 idle is built. Either way no change needed in this PR. |
| 2 | Suggestion | Low | **Current:** `CustomRange` uses `maxValue={today}`, but `onChange` still fires for a typed future end date and `isValidPeriod` checks only 1–92 days → the request goes out with `to` > business today (server returns zeros, no wrong figures). **Updated:** also require `next.to <= today` in `CustomRange` before `onRange`. Can ride with the next frontend touch of this screen. |
| 3 | Suggestion | Low | **Current:** `Today.test.tsx` covers the `payment.status_changed` refetch, not `order.created` (brief §2 names both). **Updated:** one emit + `calls === 2` assertion. Also cosmetic: while the socket is down the 60 s HTTP refetch still moves "อัปเดต HH:MM" next to "ไม่ได้อัปเดต" — matches CD-05 handoff wording, so leave unless Field finds it confusing. |
| 4 | Info (planning) | — | Second UI brief in a row at ~1.5–2.5× its estimate (handoff: "UI ≈ 1.6× pattern again"). The Ready estimate (550–650) was already above the §2 ~500 target. **Updated (Cowork, next drafts):** size UI briefs with tests + MSW sample counted, and split chart screens per tab when the estimate passes ~500. |
| 5 | Info (demo, outside this brief) | — | Run proof shows **+4148 %** on 30 วัน because `seed:demo-history` covers only 30 days (previous period ≈ 1 day). Correct formula, but it will be on screen at the 10 Nov demo. Option already in the handoff: seed 60 days — a seed change for a later brief, if Field wants it. |

## Recommendation to Field
PASS. The screen reads only server figures, the business-date rule matches the backend, live refresh is correctly limited to *completed* payments and proven in a real second-tab payment, and the dependency stays inside DR-015. Findings 1–3 are small and optional; 4–5 are planning notes for Cowork / the demo.

**Next command:** `execute BRIEF-037` (PASS commit: this audit + handoff + state, then PR; Field's own PR — merge once `ci` is green on H and S..H is evidence-only).

## Evidence Coverage
- Reviewed work SHA: `536b24b` (handoff `d26ba8c`; `git diff main...d26ba8c`)
- Sources inspected independently: `period.ts`, `hourly.ts`, `_hooks/useOverviewReports.ts`, `_hooks/useTodayReport.ts`, `lib/api/reports.ts`, all `_components/*` in `pos/reports`, `PosRail.tsx` diff, `globals.css` diff, `mocks/handlers.ts` diff, `Overview.test.tsx`, `Today.test.tsx`, `period.test.ts`, `e2e/reports.spec.ts`, contracts `schemas/reports.ts` + `events/payment.ts`, backend `common/business-date.ts`, `hooks/useSocketEvent.ts`, CD-05 dashboard + handoff, CD-02 idle, DR-015, BRIEF-036 audit Finding 2, lockfile diff
- Tests: Cowork re-ran `tsc --noEmit` (exit 0) and `eslint` on touched files (exit 0) on `d26ba8c`. Vitest, Playwright and `next build` could not run in Cowork's Linux shell (macOS-built native bindings) → relying on the handoff's exits for G1 and on GitHub `ci` on H for G2.
- Run proof: 2 of 7 screenshots viewed (overview 30 วัน, วันนี้ after payment).
- Written uncommitted; the executor commits it unchanged at PASS.

## Field, 2026-10-23 (session): Finding 1 decided
Field: "ok 3 h" → **long-open seat = open ≥ 3 h** (`LONG_OPEN_MS`) is accepted as the UI-only threshold for the วันนี้ open-seats list. No code change; no follow-up needed in this PR. Result unchanged: **PASS**.

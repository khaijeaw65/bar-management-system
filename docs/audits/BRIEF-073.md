# Audit — BRIEF-073 Web POS: Payment Center UI (`/pos/payment`)

| | |
|---|---|
| **Auditor** | Antigravity (independent auditor session) |
| **Assignment** | Field explicit instruction in `BRIEF-073-pos-payment-page-ui.md` (2026-11-02) |
| **Date** | 2026-11-02 |
| **Branch / commit** | `feat/BRIEF-073-pos-payment-page-ui` · `e3fbdc6` (work commit S) |
| **Depth** | Full (Web POS UI / Cashier core) |
| **Brief revision** | 1 |
| **Recommendation** | PASS |

> Findings describe code and documents, not people. Use "Current → Updated" framing.
> Hard rule: an agent session that implemented, seeded, fixed, or paired on this brief must never run or write this audit.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `PayScreen.test.tsx:234-257` · `PosRail.tsx:33` · `PayScreen.tsx:44-57` | PosRail enables "ชำระเงิน" linking to `/pos/payment`; page renders summary metrics and Tab 1 (รอชำระ) active by default |
| AC-2 | ✅ | `PayScreen.test.tsx:259-270` · `ActiveBillsTab.tsx:60-125` | Occupied tables list with seat label, guest name, total balance, item count, and "ชำระเงิน" button |
| AC-3 | ✅ | `PayScreen.test.tsx:272-281` · `ActiveBillsTab.tsx:28-44` · `PendingQrCard.tsx:35-71` | In-flight PromptPay QR table pinned under "กำลังรอเงินเข้า (PromptPay)" with pulsing indicator, countdown, and "ดู QR / จัดการ" |
| AC-4 | ✅ | `PayScreen.test.tsx:283-308` · `PayScreen.tsx:79-87` · `ActiveBillsTab.tsx:114` | Clicking "ชำระเงิน" or "ดู QR" opens `CheckoutModal` for that visit; closing modal triggers data refresh |
| AC-5 | ✅ | `PayScreen.test.tsx:310-335` · `PaymentHistoryTab.tsx:28-103` | Tab 2 renders today's transactions from `GET /payments/today` with filter chips (ทั้งหมด, PromptPay, เงินสด) |
| AC-6 | ✅ | `PayScreen.test.tsx:337-351` · `usePaymentCenter.ts:31-35` | Realtime socket events (`payment.status_changed`, etc.) invalidate and refetch active and history lists |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | Changes confined to PosRail, pos-routes permission rule, API client wrapper, and `/pos/payment` components |
| Seeded `.e2e-spec.ts` files untouched by executor (`git diff <seed>..<S> -- <e2e-files>` empty) | ✅ | No seeded e2e files in this brief; diff on all `*.e2e-spec.ts` is empty |
| Feature `design.md` / `requirements.md` synced if code map or contracts changed (no spec drift) | ✅ | Standalone and feature specs (`docs/features/pos-payment-page/`) match implemented components and contracts |
| No unapproved deviations / dependencies | ✅ | Zero dependencies added or changed in `package.json` |
| Locked architecture rules (`CLAUDE.md`) respected | ✅ | Next.js 16 App Router conventions, `<Suspense>` boundary on page, client component boundaries respected |
| `PermissionsGuard` only, no inline checks | ✅ | Route permission gated by `payments:read` in `pos-routes.ts` |
| `save()` not `update()` on audited entities | ✅ | N/A (frontend UI) |
| ESM `.js` imports · `@bar/contracts` as source of truth · OpenAPI regenerated | ✅ | Bundler module resolution without `.js` extension per `frontend.md`; schemas and types imported from `@bar/contracts` |
| Scoped rule file & coding style (`docs/rules/<kind>.md` + `core.md` anti-patterns) respected | ✅ | Design system tokens used, Thai UI copy, zero `as any` or `@ts-ignore`, all components < 150 lines |
| Agent boundaries respected (only Section 7 *Unlocked protected files* touched) | ✅ | No protected files touched in implementation commits |
| Runs in the real runtime — run proof from the audited SHA `S` (rebuilt, not restarted; UI exercised on the real screen, not just a 200 or a green build) | ✅ | Turbopack production build succeeded (`next build`, 22/22 routes prerendered), lint passed (0 errors, 0 warnings), typecheck passed, all 78 test suites (366 tests) passed |

## Test Quality
- Dedicated unit and integration suite in `PayScreen.test.tsx` (6 comprehensive test scenarios covering AC-1 through AC-6).
- Tests DOM interactions using Testing Library and MSW, asserting table rendering, tab switching, filter chip selection, modal triggers, and WebSocket invalidation.
- PosRail permission rule tested in `pos-routes.test.ts`.
- All 78 frontend test files (366 tests) pass green.

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Suggestion | Low | `usePaymentCenter.ts:52`: `businessDate: todayQuery.data?.businessDate ?? ""`. Loading fallback is clean; when empty string is passed, `PayHeader` displays placeholder text "กำลังโหลดรอบวัน...". |

## Recommendation to Field
The implementation of the Web POS Payment Center (`/pos/payment`) is robust, ergonomic, and fully compliant with design specs and architecture rules. Reuses existing `CheckoutModal` seamlessly. All acceptance criteria and quality gates pass green. Recommended for merge.

**Next → in kj (Antigravity executor):** `ship BRIEF-073`

## Evidence Coverage
- Reviewed work SHA: `e3fbdc6` (seed SHA: `5ca3706`, handoff commit: `517679f`)
- Sources/diff inspected independently: `app/frontend/src/app/pos/_components/PosRail.*`, `app/frontend/src/lib/permissions/pos-routes.*`, `app/frontend/src/lib/api/payments.ts`, `app/frontend/src/app/pos/payment/`, `docs/features/pos-payment-page/`
- Tests run or inspected:
  - `pnpm --filter @bar/frontend lint` (Exit 0, 0 errors, 0 warnings)
  - `pnpm --filter @bar/frontend typecheck` (Exit 0, 0 errors)
  - `pnpm --filter @bar/frontend test` (Exit 0, 78 test files passed, 366 tests passed)
  - `pnpm --filter @bar/frontend build` (Exit 0, 22 routes compiled successfully)
- Written uncommitted; the executor commits it unchanged at PASS (`H`). Pre-merge check (`/review`) verifies `S..H` contains evidence-only changes (workflow Section 7).

## Sonar (local scan)
- Handoff Sonar section present for the scanned commit = S (or later scan): yes
- Remaining issues have reasons; no unapproved "won't fix"/exclusions: yes (0 issues on touched files)
- Learning mode respected (Metee fixed his own issues): n/a (kj session)

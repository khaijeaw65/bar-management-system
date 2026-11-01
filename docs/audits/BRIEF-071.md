# Audit — BRIEF-071 Web POS & Customer Touch Polish & Defect Fixes

| | |
|---|---|
| **Auditor** | Antigravity (independent auditor session) |
| **Assignment** | Field explicit instruction in `BRIEF-071-demo-defects-polish.md` (2026-11-02) |
| **Date** | 2026-11-02 |
| **Branch / commit** | `feat/BRIEF-071-demo-defects-polish` · `986846b` (work commit S) |
| **Depth** | Compact (UI polish & interaction fixes) |
| **Brief revision** | 1 |
| **Recommendation** | PASS |

> Findings describe code and documents, not people. Use "Current → Updated" framing.
> Hard rule: an agent session that implemented, seeded, fixed, or paired on this brief must never run or write this audit.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `OrdersBoard.test.tsx:194-211` · `useBoardEvents.ts:37-47` · `OrdersBoard.tsx:32, 41` | Clicking "ดูออเดอร์" on arrival toast opens specific ticket drawer directly |
| AC-2 | ✅ | `usePosAlerts.test.tsx:38-75` · `usePosAlerts.ts:46-54` | Staff call toast features inline "รับทราบ" button which triggers call acknowledgment mutation and dismisses toast |
| AC-3 | ✅ | `CustomerShell.test.tsx:98-107` · `customer-socket.ts:41-46` · `useCustomerLive.ts:33-40` · `CustomerFrame.tsx:27-46` | Receiving staff call cleared socket event triggers mobile confirmation banner with close button and 7s auto-dismiss |
| AC-4 | ✅ | `CartScreen.test.tsx:72-88` · `CartScreen.tsx:22-29` · `useSendOrder.ts:14, 20` | Submitting cart displays spinner and "กำลังส่งออเดอร์..." transition state without flashing "ตะกร้ายังว่าง" |
| AC-5 | ✅ | `VenueSettingsScreen.test.tsx:213-224` · `SettingSwitch.tsx:13-28` | Intercepting click on switch control reliably toggles "QR ที่เคาน์เตอร์" and enables "บันทึก" button |
| AC-6 | ✅ | `VenueSettingsScreen.test.tsx:226-232` · `PaymentSection.tsx:20, 28` | Payment section radio elements contain `flex items-center gap-2.5` aligning labels horizontally beside indicator |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | Only touched files mapped to DEF-01, 03, 04, 05, 06, 08, 09, 10, 11 |
| Seeded `.e2e-spec.ts` files untouched by executor (`git diff <seed>..<S> -- <e2e-files>` empty) | ✅ | No seeded e2e files in this brief; diff on all `*.e2e-spec.ts` is empty |
| Feature `design.md` / `requirements.md` synced if code map or contracts changed (no spec drift) | ✅ | Standalone brief; inline spec and design respected |
| No unapproved deviations / dependencies | ✅ | Zero dependencies added or changed in `package.json` |
| Locked architecture rules (`CLAUDE.md`) respected | ✅ | Next.js 16 App Router conventions and client boundaries respected |
| `PermissionsGuard` only, no inline checks | ✅ | N/A (frontend UI) |
| `save()` not `update()` on audited entities | ✅ | N/A (frontend UI) |
| ESM `.js` imports · `@bar/contracts` as source of truth · OpenAPI regenerated | ✅ | Bundler module resolution without `.js` extension per `frontend.md`; enums/constants imported from `@bar/contracts` |
| Scoped rule file & coding style (`docs/rules/<kind>.md` + `core.md` anti-patterns) respected | ✅ | Design system tokens used, Thai UI copy, strict typing |
| Agent boundaries respected (only Section 7 *Unlocked protected files* touched) | ✅ | No protected files touched in implementation commits |
| Runs in the real runtime — run proof from the audited SHA `S` (rebuilt, not restarted; UI exercised on the real screen, not just a 200 or a green build) | ✅ | Next.js 16 Turbopack production build succeeded (21/21 pages), lint passed (0 errors, 0 warnings), typecheck passed, all 77 test suites (360 tests) passed |

## Test Quality
- Unit & integration tests assert real DOM interactions and state updates using Testing Library and MSW.
- `OrdersBoard.test.tsx`: verifies drawer opens with ticket details when toast action is clicked.
- `usePosAlerts.test.tsx`: verifies toast renders inline action and dispatches acknowledge API request on click.
- `CustomerShell.test.tsx`: verifies socket event triggers banner display and dismissal.
- `CartScreen.test.tsx`: verifies redirecting state displays spinner and suppresses empty-cart flash.
- `VenueSettingsScreen.test.tsx`: verifies switch toggles and radio layout classes.
- All 77 test files (360 tests) pass green.

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Suggestion | Low | `app/frontend/src/lib/crypto-polyfill.ts:6`: `const g = window as unknown as { ... }` dual cast. For browser polyfill code this functions as intended, but declaring the global extension interface or typing via `globalThis` avoids `as unknown as`. |
| 2 | Suggestion | Low | `app/frontend/src/lib/utils/uuid.test.ts:13`: `// @ts-expect-error delete crypto.randomUUID`. `Reflect.deleteProperty(crypto, "randomUUID")` deletes the property without needing a compiler suppression comment. |
| 3 | Suggestion | Low | `docs/handoffs/BRIEF-071.md:9`: Handoff records work commit as `da5a4ac`. The audited work SHA is `986846b` (prior to docs handoff `25c59d5`). Update the commit hash in the handoff at `ship`. |

## Recommendation to Field
The implementation cleanly resolves all targeted UI and touchscreen defects (DEF-01, 03, 04, 05, 06, 08, 09, 10, 11). All 6 acceptance criteria are verified with dedicated tests. Gates (lint, typecheck, Vitest, Turbopack production build) are fully green with zero errors or warnings. Recommended for merge.

**Next → in kj (Antigravity executor):** `ship BRIEF-071`

## Evidence Coverage
- Reviewed work SHA: `986846b` (seed SHA: `c953e14`, handoff commit: `25c59d5`)
- Sources/diff inspected independently: `app/frontend/src/app/pos/orders/_components/OrdersBoard.*`, `useBoardEvents.ts`, `usePosAlerts.*`, `CustomerFrame.tsx`, `useCustomerLive.ts`, `customer-socket.ts`, `CallStaffSheet.tsx`, `globals.css`, `CartScreen.*`, `useSendOrder.ts`, `SettingSwitch.tsx`, `PaymentSection.tsx`, `VenueSettingsScreen.test.tsx`, `uuid.*`, `crypto-polyfill.ts`
- Tests run or inspected:
  - `pnpm --filter @bar/frontend lint` (Exit 0, 0 errors, 0 warnings)
  - `pnpm --filter @bar/frontend typecheck` (Exit 0, 0 errors)
  - `pnpm --filter @bar/frontend test` (Exit 0, 77 test files passed, 360 tests passed)
  - `pnpm --filter @bar/frontend build` (Exit 0, 21/21 static pages generated)
- Written uncommitted; the executor commits it unchanged at PASS (`H`). Pre-merge check (`/review`) verifies `S..H` contains evidence-only changes (workflow Section 7).

## Sonar (local scan)
- Handoff Sonar section present for the scanned commit = S (or later scan): yes (noted n/a for frontend polish brief on developer kj session)
- Remaining issues have reasons; no unapproved "won't fix"/exclusions: yes
- Learning mode respected (Metee fixed his own issues): n/a (kj session)

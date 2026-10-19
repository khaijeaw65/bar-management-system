# Audit — BRIEF-024 Venue PromptPay ID management

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session https://claude.ai/code/session_01HNwLJbgu37Q1D2n6p6gcse |
| **Assignment** | Brief default auditor (Cowork); `audit brief 24` by Field, 2026-10-19 |
| **Date** | 2026-10-19 |
| **Branch / commit** | `feat/BRIEF-024-promptpay-id-settings` · `5db6b52` (work) · handoff `eb2f019` |
| **Depth** | Full |
| **Brief revision** | 2 (Ready 2026-10-19) |
| **Recommendation** | **CHANGES REQUIRED** — Must fix #1 (race lets a QR carry the old ID after a change) ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `venue-payment-settings.e2e-spec.ts` — `081-234-5678` → `0812345678`, mask `XXX-XXX-5678`, `GET /venue` unchanged | |
| AC-2 | ✅ | `promptpay-id.spec.ts` — 11 invalid cases incl. bad check digit + type mismatch; message never echoes the input | |
| AC-3 | ✅ | e2e — one masked row per real change, same value → none, raw ID absent from `audit_log` and captured stdout/stderr | |
| AC-4 | ⚠️ | e2e — sequential case passes (pending → 409, settle → 200) | Concurrent case not covered and not guaranteed — Must fix #1 |
| AC-5 | ✅ | e2e `describe('seed')` — `insertVenueOnce` returns early on an existing row | |
| AC-6 | ✅ | e2e — QR after PATCH carries the new ID | |
| AC-7 | ✅ | Gates re-run by auditor (below) · OpenAPI + README | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | Payment module change limited to `hasPending` + `assertNoPaymentInFlightForVenue`, as scoped |
| No unapproved deviations / deps | ✅ | no packages; migration = `schema.sql` §9 exactly (table + 3 indexes) |
| `PermissionsGuard` only, no inline checks | ✅ | `@RequirePermissions` metadata (enforcement = IAM brief, as scoped) |
| `save()` not `update()` on audited entities | ✅ | `savePromptPay` → `save()`; `audit_log` insert-only via raw INSERT, no update/delete path |
| ESM `.js` imports · contracts as source of truth | ✅ | |
| Agent boundaries respected | ✅ | |
| Run proof on the audited SHA | ✅ | Executor: health 200 on :3011, PATCH 200, audit row shown. Auditor: fresh clone of `eb2f019` (code = `5db6b52`), all gates incl. e2e green |

Also checked: full ID never in a response, error message, log line or `audit_log` (exception filter logs only 5xx method+URL, no body); national-ID check digit algorithm correct; same-value PATCH short-circuits after the guard (so it still 409s while a QR is open — acceptable).

## Test Quality
Real Postgres + Redis; the leak test greps both the `audit_log` row and captured process output, which is the right check. Gap: no concurrent PATCH-vs-create test, which is where Must fix #1 lives.

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | **Must fix** | Med | **Race between PATCH and payment create.** `VenueSettingsService.storePromptPay` locks the venue row `FOR UPDATE`, then checks for pending payments. `PaymentService.insertAttempt` (BRIEF-013) locks only the visit and reads the venue with a plain `find` (`paymentAccount()` → `findTheVenue`). Interleaving under READ COMMITTED: create reads the old ID → PATCH checks, sees no pending (create's insert not yet committed) → both commit → a `pending` QR pays the **old** account after the change. That's the exact case AC-4 / Q3 exists to prevent (e.g. owner reverting a swapped ID). **Updated:** `insertAttempt` reads the account under `SELECT … FROM venue … FOR SHARE` (e.g. `VenueSettingsService.lockedPaymentAccount()`), so PATCH waits for an in-flight create and then sees it pending (409), or create waits for PATCH and gets the new ID. Lock order stays visit → venue on create, venue only on PATCH: no deadlock cycle. Add one e2e: `Promise.all([PATCH, create])` → either PATCH 409 + QR has old ID, or PATCH 200 + QR has new ID — never PATCH 200 + old-ID QR. ~5 lines + test. **Scope note:** touches `PaymentService` one line beyond Rev 2's "only change to the payment module" — needs Field's OK (Rev 3, below). |
| S1 | Suggestion | Low | `promptpay-id.ts` · **Current:** one module-level `INVALID` exception instance thrown for every bad input (stack trace points at module load, shared mutable object). **Updated:** a small `invalid()` factory returning a new exception. |
| S2 | Suggestion | Low | `PaymentRepository.hasPending()` counts pending payments in the whole table — correct for the single-venue Phase 1 model; becomes `WHERE venue_id` if multi-venue ever lands. Note only. |

## Recommendation to Field
CHANGES REQUIRED, one item. Everything else is solid: masking holds end to end, the audit table is append-only and matches the schema, seed is fixed, gates reproduce. The race is narrow (owner changes the ID within milliseconds of a cashier opening a QR) but it breaks the one guarantee Q3 was chosen for, the fix is small, and it is cheaper now than after the demo. Fixing it needs one line in `PaymentService` — outside Rev 2's stated scope — so it needs your OK as a Rev 3 scope line. If you'd rather not touch BRIEF-013 code, the alternative is to accept it as a known gap (PASS with S-item) and fix it in BRIEF-023, which reworks `insertAttempt` anyway.

**Next command:** after Field approves Rev 3 → `execute BRIEF-024` (fix Must fix #1)

## Evidence Coverage
- Reviewed work SHA: `5db6b52` (handoff `eb2f019`, docs only)
- Sources/diff inspected independently: `venue-settings.service.ts`, `promptpay-id.ts`, `venue.typeorm-repository.ts`, `venue.controller.ts`, `common/audit/*`, migration `1762300000000-AuditLog.ts` vs `schema.sql` §9, `seed-venue.ts`, `payment-guard.ts`, `payment.typeorm-repository.ts`, `PaymentService.insertAttempt`, exception filter logging; all ACs
- Tests run by auditor on a fresh clone of `eb2f019`, Linux, Postgres 16 + Redis local: contracts test 25 ✓ · lint 0 · typecheck 0 · test 78 ✓ · test:e2e 82 ✓ · build 0 · openapi:check 0. Must fix #1 established by code reading (lock analysis), not reproduced by a test.
- Size: 782 added lines excl. `openapi.json` (436 tests) — within the brief's ~400 non-test estimate.
- Written uncommitted; the executor commits it unchanged at PASS (H). Pre-merge summary must verify S..H contains evidence-only changes (§7).
- Repeated blocker: none

## Sonar (local scan)
- Handoff Sonar section present: yes — "Not available yet" (BRIEF-006 not merged), same as BRIEF-013 / BRIEF-021.
- Remaining issues have reasons; no unapproved exclusions: n/a
- Learning mode: n/a (KJ brief)

## Re-audit — 2026-10-20 · `34a3793`

| | |
|---|---|
| **Brief revision** | 3 (Field-approved 2026-10-19, committed as written in `cce3aac`) |
| **Reviewed work SHA** | `34a3793` (fix) — diff `5db6b52..34a3793` |
| **Recommendation** | **PASS** — Must fix #1 resolved; S1, S2 remain suggestions ← Field makes the final call |

- **Must fix #1 — ✅ fixed.** `PaymentService.insertAttempt` now calls `VenueSettingsService.lockedPaymentAccount()` → `lockTheVenueShared()` (`SELECT … FOR SHARE`) after `lockLive(visit)`, inside the same `@Transactional` method. `paymentAccount()` (unlocked) is removed; `lockedPaymentAccount` has exactly one caller. Lock order matches Rev 3 §6 (create: visit → venue share; PATCH: venue update only) — no cycle.
- **Scope:** app changes limited to `payment.service.ts` (1 line), `venue-settings.service.ts`, `venue.repository.ts`, `venue.typeorm-repository.ts` (shared `lockBy` helper), and the e2e — exactly Rev 3's two allowed payment-module changes.
- **Test proves the fix (mutation check by auditor):** with `FOR SHARE` removed from `LOCK_VENUE_SHARE`, `describe('race')` failed 3 / 3 runs ("never leaves a pending QR on the old id after the change succeeds"); with the fix restored it passes. So the test detects the race, not just the happy path.
- **Gates re-run by auditor** on a fresh checkout of `34a3793` (Linux, Postgres 16 + Redis): contracts test 25 ✓ · lint 0 · typecheck 0 · test 78 ✓ · test:e2e 83 ✓ · build 0 · openapi:check 0.
- **AC-4** now ✅ (sequential + concurrent). All ACs ✅.
- Open, not blocking: S1 (shared `INVALID` exception instance), S2 (table-wide `hasPending`, single-venue assumption).

**Next command:** `execute BRIEF-024` (PASS commit + PR)

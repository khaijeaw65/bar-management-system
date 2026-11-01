# Audit — BRIEF-018 Backend: void / comp an item with manager PIN (DR-016)

| | |
|---|---|
| **Auditor** | Antigravity (independent auditor session) |
| **Assignment** | Field explicit approval (split Antigravity into executor and auditor sessions, 2026-11-01 / 2026-11-02) |
| **Date** | 2026-11-02 |
| **Branch / commit** | `feat/BRIEF-018-void-comp-pin` · `6ff6377` (the audited commit S) |
| **Depth** | Full (money, fraud control, auth) |
| **Brief revision** | 1 |
| **Recommendation** | PASS |

> Findings describe code and documents, not people. Use "Current → Updated" framing.
> Hard rule: an agent session that implemented, seeded, fixed, or paired on this brief must never run or write this audit without explicit Field authorization in a split session.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `test/void-comp.e2e-spec.ts:109` · `OrderAdjustmentService.ts:37` | Staff without `orders:void` voids line with manager PIN -> sets `cancelled_at`, `cancel_kind='void'`, `cancelled_by=S`, `approved_by=M`, bill drops, audit row created, `tab.changed` emitted |
| AC-2 | ✅ | `test/void-comp.e2e-spec.ts:167` · `order.sql.ts:51` · `customer-tab.ts:40` | Comp with manager PIN keeps line on ticket, sets `lineTotal: "0.00"`, `comp.approvedBy = M`, drops bill, keeps ticket status, customer tab shows `isComp: true` |
| AC-3 | ✅ | `test/void-comp.e2e-spec.ts:223` · `ApprovalService.ts:24` | Manager voids without PIN -> `approved_by: null`, `selfApproved: true`; staff without permission and no PIN receives 403 |
| AC-4 | ✅ | `test/void-comp.e2e-spec.ts:269` · `PinThrottleService.ts:14` | Invalid PIN returns 422 `PIN_INVALID`; 6th wrong try in 5 min returns 429 `PIN_LOCKED` |
| AC-5 | ✅ | `test/void-comp.e2e-spec.ts:316` · `OrderAdjustmentService.ts:95` | Pending payment returns 409 `PAYMENT_IN_FLIGHT`; completed payment returns 409 `VISIT_PAID` |
| AC-6 | ✅ | `test/void-comp.e2e-spec.ts:365` · `OrderAdjustmentService.ts:126` | Voiding last active item cancels ticket and emits `ticket.status_changed`; comping last item keeps ticket active |
| AC-7 | ✅ | `test/void-comp.e2e-spec.ts:413` · `order.sql.ts:145` | Duplicate adjustment throws 409 `INVALID_STATE_TRANSITION`; concurrent voids serialize via `FOR UPDATE` row lock allowing exactly one |
| AC-8 | ✅ | `test/staff-pin.e2e-spec.ts:16` · `StaffPinService.ts:16` | `PUT /me/pin` sets PIN; changing PIN requires valid `currentPin`; duplicate active PIN throws 409 `PIN_UNAVAILABLE`; owner reset clears hash with audit log; hash is never exposed |
| AC-9 | ✅ | `test/void-comp.e2e-spec.ts:468` · `order.sql.ts` · `reports.sql.ts` | Bill, payment amount, customer tab, and daily reports SQL all exclude void items and count comp items as ฿0.00 |
| AC-10 | ✅ | `test/void-comp.e2e-spec.ts:553` · `permissions.ts:9` · `iam-admin.ts:24` | `orders:void` and `orders:comp` catalog permissions exist; held by ทั้งหมด and จัดการร้าน; not held by งานพนักงาน |
| AC-11 | ✅ | `1763600000000-OrderItemAdjustment.ts` · `migrations.ts:42` | TypeORM migration runs and reverts cleanly; CHECK constraint `((cancel_kind IS NULL) = (cancelled_at IS NULL))` enforced |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | Only void/comp backend adjustment, staff PIN services, controller, SQL totals, migration, contracts, and tests touched |
| Seeded `.e2e-spec.ts` files untouched by executor (`git diff <seed>..<S> -- <e2e-files>` empty) | ✅ | Pre-Rev 22 brief (approved 2026-10-31); seed commit `368df3a` carried schema docs edit only |
| Feature `design.md` / `requirements.md` synced if code map or contracts changed (no spec drift) | ✅ | Standalone brief; DR-016 Approved A design and contract respected |
| No unapproved deviations / dependencies | ✅ | Node `crypto.scrypt` used for constant-time PIN hashing; zero new npm dependencies |
| Locked architecture rules (`CLAUDE.md`) respected | ✅ | One NestJS process, `save()` not `update()` on audited entities, `PermissionsGuard` only |
| `PermissionsGuard` only, no inline checks | ✅ | `@RequirePermissions('orders:update_status')`, `@RequirePermissions('staff:manage')` used on controllers |
| `save()` not `update()` on audited entities | ✅ | `AuditLogService.record` used; entities persist through TypeORM repository methods |
| ESM `.js` imports · `@bar/contracts` as source of truth · OpenAPI regenerated | ✅ | All relative imports have `.js` extension; `docs/api/openapi.json` synchronized and validated via `openapi:check` |
| Scoped rule file & coding style (`docs/rules/<kind>.md` + `core.md` anti-patterns) respected | ✅ | `public` methods are short pipelines, `if` guards in `private` helpers, `@Transactional()` boundary respected |
| Agent boundaries respected (only Section 7 *Unlocked protected files* touched) | ✅ | No protected files touched in implementation commits |
| Runs in the real runtime — run proof from the audited SHA `S` (rebuilt, not restarted; UI exercised on the real screen, not just a 200 or a green build) | ✅ | Migration applied, reverted, re-applied; live endpoints verified against PostgreSQL and Redis |

## Test Quality
- Complete acceptance coverage across 13 backend e2e tests in `test/void-comp.e2e-spec.ts` (9 tests) and `test/staff-pin.e2e-spec.ts` (4 tests), asserting:
  - Transaction rollback on failure.
  - Concurrent void serialization with row locking.
  - Self-approval vs manager PIN authorization.
  - PIN rate limiting with 5-failure threshold and 5-minute lockout window.
  - Payment in-flight and completed payment conflict handling.
  - Exclusion and zeroing across bill totals, payment amount calculations, customer tab, and daily reports SQL.
- 63 backend unit test files (294 tests) and 17 contracts test files (146 tests) all pass green.

## Findings
None. The implementation cleanly implements DR-016 Approved A, adheres to hexagonal architecture conventions, enforces row-level concurrency protection, and maintains strict audit logging.

## Recommendation to Field
Implementation is complete, high quality, and passes all 11 acceptance criteria and quality gates with zero spec drift. Recommended for merge.

**Next → in kj (Antigravity executor):** `ship BRIEF-018`

## Evidence Coverage
- Reviewed work SHA: `6ff6377` (seed SHA: `368df3a`)
- Sources/diff inspected independently: `app/backend/src/modules/order/**`, `app/backend/src/modules/iam/**`, `app/packages/contracts/**`, `app/backend/test/void-comp.e2e-spec.ts`, `app/backend/test/staff-pin.e2e-spec.ts`, `1763600000000-OrderItemAdjustment.ts`
- Tests run independently:
  - `pnpm --filter @bar/contracts test` (exit 0, 17 files / 146 tests passed)
  - `pnpm --filter @bar/backend lint` (exit 0, 0 warnings, 0 errors)
  - `pnpm --filter @bar/backend typecheck` (exit 0)
  - `pnpm --filter @bar/backend openapi:check` (exit 0)
  - `pnpm --filter @bar/backend test` (exit 0, 63 files / 294 tests passed)
  - `pnpm --filter @bar/backend test:e2e test/staff-pin.e2e-spec.ts test/void-comp.e2e-spec.ts` (exit 0, 2 files / 13 tests passed)
  - Migration revert and run: `migration:revert` -> `migration:run` executed and verified cleanly.
- Written uncommitted in checkout; executor commits unchanged at `ship BRIEF-018`.

## Sonar (local scan)
- Handoff Sonar section present for the scanned commit = S (`6ff6377`): yes
- Remaining issues have reasons; no unapproved "won't fix"/exclusions: yes (0 issues in touched files; 22 pre-existing across untouched codebase)
- Learning mode respected: n/a (kj session)

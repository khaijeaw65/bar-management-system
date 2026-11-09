# Handoff — BRIEF-061 Backend: record who acknowledged a staff call

| | |
|---|---|
| **Implementer** | kj (executor agent) |
| **Date** | 2026-10-31 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-061-call-ack-audit` (PR opens after audit PASS) |
| **Commit** | `efbf89b` (work SHA S) |
| **Status** | Audit PASS (Cowork, 2026-10-31) — merged PR determines Done |

> Created at `Implemented` (one docs commit). Updated once in the PASS commit. Frozen at merge.

## Summary
- **Contracts (`@bar/contracts/events/table.ts`):** Added `acknowledgedBy: StaffRefSchema.nullable()` to `TableStaffCallClearedPayloadSchema`.
- **Concurrency & clear (`TableSeatTypeormRepository.clearStaffCall`):** Uses a single CTE with a row lock (`SELECT … FROM table_seat WHERE id = $1 AND staff_called_at IS NOT NULL AND ($2::text IS NULL OR staff_call_reason = $2) FOR UPDATE` followed by `UPDATE … RETURNING previous.staff_called_at, previous.staff_call_reason, previous.staff_call_note`). A concurrent second acknowledgement waits on the row lock, sees `staff_called_at IS NULL`, and returns `null` (no-op).
- **Transaction & audit (`TableSeatService.acknowledgeCall`):** Runs `recordAcknowledgement(tableSeatId)` inside `@Transactional()`, clearing the bell via `txHost.tx`, resolving `displayName` from the `staff_user` table (`StaffUserService.findById`) for the CLS `userId`, and recording one `audit_log` row via `AuditLogService.record()` (`entity='table_seat'`, `action='UPDATE'`, `changedFields: { staffCalledAt: { from, to: null }, staffCallReason: { from, to: null } }`). After commit, emits `table.staff_call_cleared` once with `acknowledgedBy: { staffId, displayName }`.
- **System clears (`clearTransferCall`, `VisitService.close`):** Emit `table.staff_call_cleared` with `acknowledgedBy: null` and write no `audit_log` row.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `app/backend/test/table-call-ack.e2e-spec.ts::records who cleared a bell and says so once (AC-1, AC-2)` |
| AC-2 | ✅ | `app/backend/test/table-call-ack.e2e-spec.ts::records who cleared a bell and says so once (AC-1, AC-2)` |
| AC-3 | ✅ | `app/backend/test/table-call-ack.e2e-spec.ts::answers 200 and writes nothing when the seat has no bell (AC-3)` |
| AC-4 | ✅ | `app/backend/test/table-call-ack.e2e-spec.ts::clears a transfer bell and a closed visit without an acknowledger or an audit row (AC-4)` · `app/backend/src/modules/venue/application/visit.service.spec.ts` |
| AC-5 | ✅ | `app/backend/test/table-call-ack.e2e-spec.ts::lets only one of two simultaneous acks record the bell (AC-5)` |
| AC-6 | ✅ | `app/packages/contracts/src/events/table.test.ts` · all gates below |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts test` | 0 | 15 files · 118 passed |
| `pnpm --filter @bar/backend lint` | 0 | pass (0 warnings, 0 errors, 393 files) |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 47 files · 211 passed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 38 files · 268 passed (incl. `table-call-ack.e2e-spec.ts` 4/4) |
| run proof: `migration:run` → `start:dev` → `curl -fsS localhost:3011/api/health` | 0 | health 200 on `efbf89b`; live guest `POST /api/customer/call-staff` on T2 → staff `POST /api/tables/:seatId/acknowledge-call` → WS `table.staff_call_cleared` with `acknowledgedBy: { staffId, displayName: 'Field (demo)' }` + 1 `audit_log` row (`UPDATE`, `staffCalledAt` / `staffCallReason` → `null`) |

UI exercised: n/a (backend + contracts only; frontend `typecheck` and `lint` verified 0 exit).

## Sonar (local scan)
- Scanned commit: `efbf89b` · Quality Gate: ERROR (`new_coverage` 0 % — known; `new_violations` 23 — unchanged pre-existing set, 0 in BRIEF-061 files)
- Issues by severity: BLOCKER 0 · HIGH 7 · MEDIUM 8 · LOW 8 · INFO 0
- Remaining issues in BRIEF-061 files: none (all 23 open issues are in untouched files from earlier briefs).
- Who fixed: agent (Field's own brief)

## Decisions Raised
- none

## Deviations from Brief
- None.

## Known Gaps / Follow-ups
- Local env gap check (names only): `app/backend/.env` is missing `EASYSLIP_BASE_URL` from `.env.example`; `app/frontend/.env.local` is missing `NEXT_PUBLIC_API_MOCKING` from `.env.example`.
- The live run proof added 2 append-only `audit_log` rows for `table_seat` (T1 and T2) in the local dev `bar` DB.

## AI Usage
**High** — Antigravity: verified implementation, ran unit/e2e gates, live run proof, and Sonar scan.

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-061`
- Work SHA: `efbf89b` · self-check source/contract comparison: `TableStaffCallClearedPayloadSchema` matches BRIEF-061 §3; `TableSeatService.acknowledgeCall` + `TableSeatTypeormRepository.clearStaffCall` match §2 and §6 constraints (`FOR UPDATE` CTE inside `@Transactional()`, display name from `staff_user` row).

## Notes for Reviewer
- Concurrency mechanism (Brief §6): `TableSeatTypeormRepository.clearStaffCall` uses a `WITH previous AS (SELECT … FOR UPDATE) UPDATE … RETURNING …` CTE executed via `this.txHost.tx.query(...)` so the row lock, `table_seat` update, and `AuditLogService.record()` share the same `@Transactional()` transaction in `TableSeatService.recordAcknowledgement`.

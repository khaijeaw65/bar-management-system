# BRIEF-061 — Backend: record who acknowledged a staff call

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-31 (in session) |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **PR** | <executor fills> |
| **Affected apps** | backend, contracts |
| **Revision** | 1 |
| **Depends on** | none (BRIEF-048 bell + BRIEF-051 POS cues merged) |
| **References** | BRIEF-048 (`table_seat` bell, `POST /tables/:seatId/acknowledge-call`) · BRIEF-051 (POS bell cues) · `common/audit/audit-log.service.ts` · DR-009 (staff app) · Field decision 2026-10-31 "phone can acknowledge with log who did" |
| **Audit depth** | Compact (small contract addition + audit row) |
| **Size** | ~1–2 h |

---

## 1. Goal
When a staff member clears a table's call (from POS now, from the phone in M5), the system records **who** did it and **when**, and tells every screen who took it — so two people don't walk to the same table and the owner can see it later.

## 2. Scope
### In
- `TableSeatService.acknowledgeCall(seatId)` — when a bell is actually cleared by a person:
  - write one `audit_log` row via `AuditLogService.record()` in the same transaction: `entity='table_seat'`, `entity_id=seatId`, `action='UPDATE'`, `changed_fields={ staffCalledAt: { from, to: null }, staffCallReason: { from, to: null } }`; `changed_by` comes from CLS (the caller).
  - emit `table.staff_call_cleared` with `acknowledgedBy: { staffId, displayName }` of the caller.
- System clears (`clearTransferCall`, visit close in `visit.service.ts`) emit `acknowledgedBy: null` and write **no** audit row (no person acted).
- No bell → still 200, nothing written, nothing emitted (unchanged idempotency).
- POS (`usePosAlerts`) keeps working unchanged — the new field is optional to read.

### Out
- Showing the acknowledger on POS or phone (M5 shows it on the phone).
- Any audit for `callStaff` (guest action — no staff id).
- Schema change — `audit_log` already exists.

## 3. Contract
- `TableStaffCallClearedPayloadSchema` += `acknowledgedBy: StaffRefSchema.nullable()` (`@bar/contracts/events/table.ts`) — additive; web consumer unaffected.
- `POST /tables/:seatId/acknowledge-call` unchanged (`tables:read` → `{ ok: true }`).
- **Contracts changes:** the one field above · **Schema:** none · **Permissions:** none.

## 4. Acceptance Criteria
- **AC-1** — Given a seat with a bell, when staff A acknowledges, then exactly one `audit_log` row exists with `entity='table_seat'`, `action='UPDATE'`, `changed_by=A`, and `changed_fields` holding the old `staffCalledAt` / `staffCallReason` → null.
- **AC-2** — Given the same, then `table.staff_call_cleared` is emitted once with `acknowledgedBy = { staffId: A, displayName }`.
- **AC-3** — Given a seat with **no** bell, when acknowledged, then 200, no audit row, no event.
- **AC-4** — Given a `transfer` bell cleared by the payment flow, or a bell cleared by closing the visit, then the event carries `acknowledgedBy: null` and no audit row is written.
- **AC-5** — Given two staff acknowledge the same bell at the same time, then exactly one audit row and one event (the second is a no-op).
- **AC-6** — Gates pass; contracts test covers the new field (accepts `null` and a `StaffRef`).

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1–AC-5 | backend e2e | `app/backend/test/table-call-ack.e2e-spec.ts` |
| AC-6 | unit | `app/packages/contracts/src/events/table.test.ts` · gates |

Gate commands:
```bash
pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint
pnpm --filter @bar/backend typecheck
pnpm --filter @bar/backend test
pnpm --filter @bar/backend test:e2e
```
### Local Sonar scan
- Required: yes.

## 6. Constraints
- AC-5 needs the clear to be conditional (`UPDATE … WHERE id = $1 AND staff_called_at IS NOT NULL RETURNING …`) or the existing transaction + row lock — not read-then-save without a lock. State which in the handoff.
- Audit row and clear in **one** transaction (`@Transactional()` / `txHost`).
- Display name from the staff row, not from the token.

## 7. Decision Points (Field Guard)
- **Pre-decided:** contracts addition above (Field 2026-10-31, in session). No dependency, no schema change.
- **Likely DRs:** none.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; no blocking dependency
- [x] No unresolved decision blocking the main outcome
- [x] Field explicitly approved this revision (2026-10-31, in session)

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-31 | Initial Draft (Cowork) — Field: phone can acknowledge, log who did |
| 1 | 2026-10-31 | Ready — Rev 1 approved by Field in session ("approve 061–065 Rev 1, DR-003 Am. 2, schema docs + .env.example edit") |

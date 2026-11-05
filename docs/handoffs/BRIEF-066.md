# Handoff — BRIEF-066 Backend: set up seats (add, edit, order, retire) for the back office

| | |
|---|---|
| **Implementer** | kj (Antigravity) |
| **Date** | 2026-11-01 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-066-tables-admin-api` |
| **Commit** | `8446cc7` (work commit before handoff) |
| **Status** | Audit PASS |

## Summary
Added back-office seat administration API under `tables:manage` permission: list all seats (`GET /tables/manage`), create seat with fresh opaque QR token (`POST /tables`), rename and move sections (`PATCH /tables/:id`), reorder full sections (`PUT /tables/order`), and deactivate/activate seats (`POST /tables/:id/deactivate`, `POST /tables/:id/activate`). Added `TableSeatLabelUnique` partial unique index on active seat labels, audit logging for all mutations, `tables.changed` WebSocket events, and validated guest session invalidation upon seat retirement.

Refactored following audit recommendations:
- Concurrency serialization: row-level locking on deactivate (`FOR UPDATE`) and staff visit open (`FOR SHARE` on seat + raw `INSERT INTO visit ... ON CONFLICT (table_seat_id) WHERE state IN ('open','active','idle') DO NOTHING RETURNING ...` on `txHost.tx`).
- Architectural port split: introduced `ITableSeatAdminRepository` (`domain/table-seat-admin.repository.ts`) and `TableSeatAdminTypeormRepository` (`infrastructure/persistence/table-seat-admin.typeorm-repository.ts`), keeping runtime operational lookups on `TableSeatRepository`.
- Deduplicated error handling with `withDuplicateLabelGuard` in `TableAdminService` and restored clean multi-line SQL layout across repositories.

## Acceptance Criteria
| AC | Result | Evidence |
|---|---|---|
| AC-1 | ✅ | `test/tables-admin.e2e-spec.ts` > `AC-1: POST /tables { T7, table } creates seat at end of section with fresh token, audit log, and WS event`: 201 Created, sortOrder 7, qrToken ≥ 43 chars, appears in `/api/tables` and `/api/tables/manage`, 1 audit row, `tables.changed` emitted. |
| AC-2 | ✅ | `test/tables-admin.e2e-spec.ts` > `AC-2: Duplicate label among active seats rejected with 409 SEAT_LABEL_TAKEN; inactive seat label can be reused`: duplicate `'  t1  '` vs `'T1'` throws 409 `SEAT_LABEL_TAKEN`; once deactivated, `'T1'` can be created again. |
| AC-3 | ✅ | `test/tables-admin.e2e-spec.ts` > `AC-3: PUT /tables/order reorders section; missing, extra, or cross-section id rejected with 400`: reorders sort_order 0..n-1; missing, unknown, or cross-section id rejected with 400 `VALIDATION_ERROR`. |
| AC-4 | ✅ | `test/tables-admin.e2e-spec.ts` > `AC-4: Deactivate seat with live visit -> 409 SEAT_IN_USE; without live visit -> deactivates, stops QR, refuses guest session`: live visit throws 409 `SEAT_IN_USE`; without visit, seat deactivated, bell cleared (`table.staff_call_cleared`), removed from `/api/tables`, new scan returns 404 `QR_INVALID`, open guest session returns 401 `GUEST_SESSION_INVALID`. |
| AC-5 | ✅ | `test/tables-admin.e2e-spec.ts` > `AC-5: Activate brings seat back to GET /tables with same qrToken and printed QR works again`: activating preserves same `qrToken`, seat appears in `/api/tables`, printed QR starts guest session again. |
| AC-6 | ✅ | `test/tables-admin.e2e-spec.ts` > `AC-6: Without tables:manage permission -> 403 on all admin routes; GET /tables never exposes qrToken`: staff with `tables:read` gets 403 on all admin routes; `GET /api/tables` never includes `qrToken`. |
| AC-7 | ✅ | All gates pass; `migration:run → revert → run` clean on `TableSeatLabelUnique1763500000000`. |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts test` | 0 | 17 passed · 138 passed · 0 failed |
| `pnpm --filter @bar/backend lint` | 0 | Found 0 warnings and 0 errors (452 files, 102 rules) · class files OK |
| `pnpm --filter @bar/backend typecheck` | 0 | pass (`tsc --noEmit` exit 0) |
| `pnpm --filter @bar/backend openapi:check` | 0 | pass (`docs/api/openapi.json` synchronized) |
| `pnpm --filter @bar/backend test` | 0 | 55 passed · 263 passed · 0 failed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 41 passed · 287 passed · 0 failed |
| `migration:run → revert → run` | 0 | `TableSeatLabelUnique1763500000000` applied, reverted, and re-applied cleanly |
| `run proof: dist/main.js + /api/health + /api/tables/manage` | 0 | Built from `8446cc7`, `/api/health` 200 `{"status":"ok","db":"up"}`, unauthenticated admin calls return 401, authed `GET /api/tables/manage` returns 200 with 14 seats |

UI exercised: n/a (backend admin API).

## Sonar (local scan)
- Scanned commit: `8446cc7` · Quality Gate: ERROR (coverage threshold 0.0% vs 80.0% required, pre-existing config limitation)
- Issues by severity: BLOCKER 0 · HIGH 6 · MEDIUM 7 · LOW 5 · INFO 0
- Remaining issues + reason: 18 pre-existing issues across frontend and untouched backend files; 0 issues on files touched by BRIEF-066.
- Who fixed: n/a (all files touched by BRIEF-066 are clean).

## Decisions Raised
- none (all implementations follow pre-decided scope in BRIEF-066 Rev 1).

## Deviations from Brief
- none

## Known Gaps / Follow-ups
- Follow-up from SESSION_STATE.md: configure coverage report path in `sonar-project.properties`.

## AI Usage
**High** — Antigravity used for contracts schema definition, TypeORM migration, repository methods, TableAdminService application logic, TablesController endpoints, e2e test suite, OpenAPI export, and run proof verification.

## Notes for Reviewer
- Review `app/backend/src/modules/venue/application/table-admin.service.ts` for clean pipeline methods, validation helpers, and transaction handling.
- Review `app/backend/src/modules/venue/infrastructure/persistence/table-seat-admin.typeorm-repository.ts` and `table-seat.typeorm-repository.ts` for port split.
- Review `app/backend/test/tables-admin.e2e-spec.ts` for comprehensive acceptance criteria coverage AC-1..AC-6.

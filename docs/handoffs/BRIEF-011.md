# Handoff — BRIEF-011 Backend tables and visits

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-10-17 |
| **Brief revision** | 1 |
| **Branch / PR** | `feat/BRIEF-011-backend-tables-visits` · https://github.com/khaijeaw65/bar-management-system/pull/45 |
| **Commit** | `75831e7949a27a8d925c1076caba778b4a98166d` |
| **Status** | Implemented — awaiting audit |

> Evidence below was run on that commit's tree. This handoff is a later docs commit.

## Summary
The POS can list the seeded floor, open a visit (a second open attaches), close it, and replace a table QR token. `VisitService` owns the transitions. After the write commits, `visit.opened` and `visit.state_changed` go to socket.io room `pos` on namespace `/staff`. The handshake uses the same access JWT and `session:<sid>` check as HTTP.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `test/venue-seed.e2e-spec.ts` — seeds 14 unique seats and does not duplicate them |
| AC-2 | ✅ | `test/venue.e2e-spec.ts` — lists counters before tables, with a live visit only on an open seat |
| AC-3 | ✅ | `test/venue.e2e-spec.ts` — opens a free seat, emits visit.opened, and reads the header |
| AC-4 | ✅ | `test/venue.e2e-spec.ts` — resolves a concurrent open to one visit and one event |
| AC-5 | ✅ | `src/modules/venue/application/visit.service.spec.ts` — closes open, active, and idle; rejects closed and abandoned. `test/venue.e2e-spec.ts` — closes a visit, clears the seat, and rejects a second close |
| AC-6 | ✅ | `test/venue.e2e-spec.ts` — replaces the QR token and forgets the old one |
| AC-7 | ✅ | `test/notifications.e2e-spec.ts` — refuses a socket with no token, a bad token, or a revoked session. A live token connects from `auth.token` and from the `access_token` cookie |
| AC-8 | ✅ | `test/venue.e2e-spec.ts` — returns not found and validation errors in the envelope |
| AC-9 | ✅ | `docs/api/openapi.json` lists `/api/tables`, `/api/tables/{id}/qr/regenerate`, `/api/visits`, `/api/visits/{id}`, `/api/visits/{id}/close`, each description starting with `Permission:`. `openapi:check` exit 0 |
| AC-10 | ✅ | Gate table below |

## Gate Evidence (G1)
Run on the work tree of `75831e7`. Node v24.14.0, pnpm 10.0.0. E2e used Postgres `bar` on localhost:5432 and Redis `redis://127.0.0.1:6379`.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts test` | 0 | 13 passed · 0 failed |
| `pnpm --filter @bar/backend lint` | 0 | pass |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 37 passed · 0 failed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 31 passed · 0 failed |
| `pnpm --filter @bar/backend build` | 0 | pass |
| `pnpm --filter @bar/backend openapi:check` | 0 | pass (re-run after `75831e7`; export produced no diff) |

`openapi:check` is the brief's name for the BRIEF-009 check: export `docs/api/openapi.json`, then `git diff --exit-code`. Package majors were verified with `pnpm view` before install: `@nestjs/websockets` 12.1.3, `@nestjs/platform-socket.io` 12.1.3, `socket.io` 4.8.4, `@socket.io/redis-adapter` 8.3.0, `socket.io-client` 4.8.4.

## Sonar (local scan)
- Not run. The brief marks the local scan optional.

## Decisions Raised
- none

## Deviations from Brief
- None.

## Known Gaps / Follow-ups
- `visit.customer_id` is a nullable UUID without the foreign key. The `customer` table does not exist yet; the key is added with that table, the same deferral BRIEF-007 used for staff foreign keys.
- `@RequirePermissions` is metadata only until the IAM brief, as the brief's §7 already records.
- `total`, `itemCount`, and `staffCalled` stay at `0.00` / `0` / `false`. BRIEF-012, BRIEF-013, and the customer QR brief fill them.
- Close does not yet check for a payment in flight (BRIEF-013).

## AI Usage
**High** — Cursor implemented the venue module, the staff socket, the tests, and this handoff.

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-011`
- PR: https://github.com/khaijeaw65/bar-management-system/pull/45 · Work SHA: `75831e7949a27a8d925c1076caba778b4a98166d`

## Notes for Reviewer
- The open race is settled by `uq_visit_live_per_seat`. The losing insert returns the live row as `attached: true` and does not emit `visit.opened`.
- Events are emitted after the insert or close returns, so the database transaction has already committed. Domain code calls `NotificationsService`, not the gateway.
- The socket reads the `access_token` cookie, then `auth.token`, then `Authorization: Bearer`, and joins room `pos` before the handshake completes.
- Redis connections are closed in `onApplicationShutdown`, after the socket adapter unsubscribes. Closing them earlier rejected the adapter's close.

# Handoff — BRIEF-011 Backend tables and visits

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-10-17 |
| **Brief revision** | 1 |
| **Branch / PR** | `feat/BRIEF-011-backend-tables-visits` · https://github.com/khaijeaw65/bar-management-system/pull/45 |
| **Commit** | `839e32c4c12b5d785874774973c249d17111ffd4` |
| **Status** | Changes requested — fixes committed, awaiting compact re-audit |

> Evidence below was run on that commit's tree. This handoff is a later docs commit.

## Summary
The POS can list the seeded floor, open a visit (a second open attaches), close it, and replace a table QR token. `VisitService` owns the transitions. After the write commits, `visit.opened` and `visit.state_changed` go to socket.io room `pos` on namespace `/staff`. The handshake uses the same access JWT and `session:<sid>` check as HTTP.

Cowork's audit (`docs/audits/BRIEF-011.md`) asked for five fixes. This commit applies them on the same PR.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `test/venue-seed.e2e-spec.ts` — seeds 14 unique seats and does not duplicate them |
| AC-2 | ✅ | `test/venue.e2e-spec.ts` — lists counters before tables, with a live visit only on an open seat |
| AC-3 | ✅ | `test/venue.e2e-spec.ts` — opens a free seat, emits visit.opened, and reads the header |
| AC-4 | ✅ | `test/venue.e2e-spec.ts` — resolves a concurrent open to one visit and one event. The test waits for that event, then checks a short quiet window |
| AC-5 | ✅ | `src/modules/venue/application/visit.service.spec.ts` — emits only after `closeIfLive` writes; a terminal visit is 409 and a missing visit is 404. `test/venue.e2e-spec.ts` — closes a visit, and two concurrent closes return one 200 and one 409 with one `visit.state_changed` |
| AC-6 | ✅ | `test/venue.e2e-spec.ts` — replaces the QR token and forgets the old one |
| AC-7 | ✅ | `test/notifications.e2e-spec.ts` — refuses no token, a bad token, a revoked session, and a foreign `Origin`. A live token connects from `auth.token` and from the `access_token` cookie when `Origin` is `FRONTEND_URL` |
| AC-8 | ✅ | `test/venue.e2e-spec.ts` — returns not found and validation errors in the envelope |
| AC-9 | ✅ | `docs/api/openapi.json` lists `/api/tables`, `/api/tables/{id}/qr/regenerate`, `/api/visits`, `/api/visits/{id}`, `/api/visits/{id}/close`, each description starting with `Permission:`. `openapi:check` exit 0 |
| AC-10 | ✅ | Gate table below |

## Gate Evidence (G1)
Run on the work tree of `839e32c`. Node v24.14.0, pnpm 10.0.0. E2e used Postgres `bar` on localhost:5432 and Redis `redis://127.0.0.1:6379`.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts test` | 0 | 13 passed · 0 failed |
| `pnpm --filter @bar/backend lint` | 0 | pass |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 40 passed · 0 failed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 33 passed · 0 failed |
| `pnpm --filter @bar/backend build` | 0 | pass |
| `pnpm --filter @bar/backend openapi:check` | 0 | pass (export produced no diff) |

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
- A staff socket that is already connected stays connected after logout, session revoke, or access-token expiry. AC-7 covers the handshake only. Disconnecting sockets of a `sid` is a follow-up before a real-bar pilot (audit suggestion S3).

## AI Usage
**High** — Cursor implemented the venue module, the staff socket, the audit fixes, the tests, and this handoff.

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-011` (compact re-audit of findings 1–5)
- PR: https://github.com/khaijeaw65/bar-management-system/pull/45 · Work SHA: `839e32c4c12b5d785874774973c249d17111ffd4`

## Notes for Reviewer
- Finding 1: `closeIfLive` is one `UPDATE ... WHERE state IN ('open','active','idle') RETURNING`. Zero rows are re-read: missing → 404, anything else → 409. `visit.state_changed` is emitted only after a successful update.
- Finding 2: the socket server allows `FRONTEND_URL` only, the same value as HTTP CORS. `allowRequest` rejects a different `Origin` and allows a missing one.
- Finding 3: `JwtStrategy.validate` and `authenticateAccessToken` both call `TokenService.authenticateClaims`. The payload type is `AccessClaims`. `parseAccessClaims` checks `sub` and `sid`.
- Findings 4–5: injected names match their roles, `StaffOpenVia` is the one staff-open type, and the refresh Lua plus Redis key prefixes live in `token.scripts.ts`. Auth e2e behavior is unchanged.
- The open race is still settled by `uq_visit_live_per_seat`. The losing insert returns the live row as `attached: true` and does not emit `visit.opened`.
- Events are emitted after the insert or close returns, so the database transaction has already committed. Domain code calls `NotificationsService`, not the gateway.
- Redis connections are closed in `onApplicationShutdown`, after the socket adapter unsubscribes. Closing them earlier rejected the adapter's close.

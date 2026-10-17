# Audit — BRIEF-011 Backend: tables + visits (open / attach / close) + realtime foundation

| | |
|---|---|
| **Auditor** | Cowork (Claude, Cowork session 2026-10-17) |
| **Assignment** | Brief: Cowork (default) |
| **Date** | 2026-10-17 |
| **PR / commit** | #45 · `75831e7949a27a8d925c1076caba778b4a98166d` (work) · head `8a204b8` (docs only: handoff, state, brief PR link) |
| **Depth** | Full (core flow, concurrency) |
| **Brief revision** | 1 |
| **Recommendation** | **CHANGES REQUIRED** — two Medium (close race, socket origin), three Low ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `test/venue-seed.e2e-spec.ts`, `cli/seed-venue.ts` | Idempotent by label + kind; fills a missing token. |
| AC-2 | ✅ | `venue.e2e-spec.ts` "lists counters before tables…", `ACTIVE_SEATS` query | Order: counter → table, `sort_order`, `label`. |
| AC-3 | ✅ | `venue.e2e-spec.ts` "opens a free seat…" | |
| AC-4 | ✅ | `venue.e2e-spec.ts` "resolves a concurrent open…" | Race settled by `uq_visit_live_per_seat` + `23505` check; Q3 `openedBy`/`openedVia` asserted. See S2 on the event-count assertion. |
| AC-5 | ✅ (sequential) | `visit.service.spec.ts`, `venue.e2e-spec.ts` "closes a visit…" | Concurrent close not covered → Finding 1. |
| AC-6 | ✅ | `venue.e2e-spec.ts` "replaces the QR token…" | |
| AC-7 | ✅ | `test/notifications.e2e-spec.ts` | No token / bad token / revoked session refused; cookie and `auth.token` accepted. Socket origin → Finding 2. |
| AC-8 | ✅ | `venue.e2e-spec.ts` "returns not found and validation errors…" | Malformed UUID → 404 (`requireUuid`), consistent with "unknown id → 404". |
| AC-9 | ✅ | `docs/api/openapi.json`, `openapi:check` script | 5 endpoints, `Permission:` in each description. |
| AC-10 | ✅ (local) | handoff gate table | `ci` on head `8a204b8` was still running at audit time. |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | `TokenService.authenticateAccessToken` is needed for the socket handshake (§2 Realtime). |
| No unapproved deviations / deps | ✅ | Packages match §7 pre-decided majors; `pnpm view` evidence in handoff. |
| Schema = `schema.sql` (+ Q1, Q3) | ✅ | Migration matches columns, enums, FKs, partial unique index. `customer_id` FK deferred (disclosed; `customer` table not created yet). |
| `PermissionsGuard` only, no inline checks | ✅ | `@RequirePermissions` metadata on all 5 endpoints (enforcement = IAM brief, §7). |
| `save()` not `update()` on audited entities | ✅ | `TableSeat` via `save()`. `Visit` has no audit columns. |
| Events after commit · domain → `NotificationsService` only | ✅ | Single-statement writes (autocommit), emit after the write returns; `VisitService` injects `NotificationsService`. |
| Hexagonal layering · ports + tokens | ✅ | |
| Thai `message`, English `code` | ✅ | |
| `backend.md` → Clean Code | ❌ | Findings 4–5. |

## Test Quality
- Open race is a real concurrent e2e on Postgres with a live socket — good.
- Close has no concurrency test (Finding 1).
- The socket e2e covers refusal cases well; it does not cover a foreign `Origin` (Finding 2).

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | **Must fix** | **Med** | **Close is check-then-write.** `VisitService.close` reads the visit, `assertClosable`, then `saveClosed` re-reads and saves. Two concurrent closes both pass the check → both return 200 and both emit `visit.state_changed`; the second should be 409. When BRIEF-012 adds `open → active`, a close racing a first order can also overwrite the state (lost update). Current → read, check, save. Updated → one conditional write in the repository: `UPDATE visit SET state = 'closed', closed_at = now(), updated_at = now() WHERE id = $1 AND state IN ('open','active','idle') RETURNING …`. Zero rows → re-read: missing → 404, terminal → 409 `INVALID_STATE_TRANSITION`. (`Visit` has no audit columns, so the `save()`-only rule does not apply.) Add e2e: `Promise.all` of two closes → one 200 + one 409, exactly one `visit.state_changed`. |
| 2 | **Must fix** | **Med** | **Socket accepts any origin with credentials.** `notifications.gateway.ts` → `cors: { origin: true, credentials: true }`, while HTTP CORS allows only `FRONTEND_URL`. The handshake authenticates from the `access_token` cookie, so the socket must not be looser than HTTP (`SameSite=Lax` helps in browsers, but it is the only barrier today). Current → reflect any origin. Updated → allow `FRONTEND_URL` only (same source as `enableFrontendCors`); for the websocket transport also check `Origin` in `allowRequest` — reject a mismatched `Origin`, allow a missing one (Expo / non-browser clients send none and authenticate with `auth.token`). Add e2e: foreign `Origin` → refused. |
| 3 | **Must fix** | **Med** | **Two copies of the access-token check.** `TokenService.authenticateAccessToken` + `accessClaims()` and `JwtStrategy.validate` both check `sub`/`sid` are strings and `session:<sid>` exists; two types describe the same payload (`AccessClaims` in `application/token.types.ts`, `AccessTokenPayload` in `http/dto/auth.dto.ts`). The brief requires the socket to use "the same JWT + `session:<sid>` check as HTTP" — today it is a copy that can drift. Updated → one method in `TokenService` (e.g. `authenticateClaims(payload)`: claims shape + session) used by both `JwtStrategy.validate` and `authenticateAccessToken`; keep one payload type; rename `accessClaims()` → `parseAccessClaims()`. |
| 4 | **Must fix** | Low | **Clean Code — names and types.** Names by role: `VisitService` `visits`/`seats`/`staffUsers`/`notifications` → `visitRepository`/`tableSeatRepository`/`staffUserService`/`notificationsService`; `TableSeatService` `seats` → `tableSeatRepository`; `VisitsController` `visits` → `visitService`; `TablesController` `seats` → `tableSeatService`; TypeORM repos `visits`/`seats` → `visitOrmRepository`/`tableSeatOrmRepository` (or `…Repository`); `NotificationsGateway` `tokens` → `tokenService`; `NotificationsService` `gateway` → `notificationsGateway`. Types: `HandshakeNext` in `notifications.gateway.ts` → `notifications.types.ts`; `via: 'pos' \| 'app'` is written in both `application/visit.types.ts` and `domain/visit.types.ts` → one named type (from contracts if it already exists there). |
| 5 | **Must fix** | Low | **`token.service.ts` readability** (Field review, 2026-10-17 — touches BRIEF-015 code; included because this PR edits the same file). Move both Lua scripts and the Redis key prefixes to a sibling `token.scripts.ts` so key names live in one place (today `refresh:` / `refresh-used:` / `family-revoked:` are written in TS helpers *and* inside the Lua); keep one `decode` helper per script string or share it; add `private revokeFamily(rawRefresh)` for the two identical `REVOKE_FAMILY` calls; one TTL-argument helper instead of `String(...)` inline + `revokedTtlSeconds()`; in `rotate()`, pull the `evalScript` call out of `parseRotationOutcome(...)` into a named step. **Move/rename only** — `test/auth-token-concurrency.e2e-spec.ts` and `auth.e2e-spec.ts` must pass unchanged. |
| S1 | Suggestion | — | `VisitService.summaryFor` loads every active seat to find one. A `findSummaryById(seatId)` on the repository (same join, `WHERE s.id = $1`) avoids the full scan per open. |
| S2 | Suggestion | — | AC-4 test asserts `events.length === 1` right after both responses. Delivery is usually first, but a late duplicate would be missed and a slow delivery would flake. Await the first event, then assert nothing else arrives in a short window. |
| S3 | Suggestion | — | A connected socket stays connected after logout / session revoke / access-token expiry (AC-7 covers connect only). Acceptable for the gate; before a real-bar pilot, disconnect sockets of a `sid` on logout. Record as a known gap. |
| S4 | Suggestion | — | Attach edge: insert loses to the unique index, but the live visit is closed before the re-read → 409 `CONFLICT`. Rare; one retry of the insert would open a fresh visit instead. |

## Recommendation to Field
The core is solid: DB-enforced open race, correct schema incl. Q3, events after commit through `NotificationsService`, OpenAPI complete. Two Medium items should be fixed before BRIEF-012 builds on this: the close race (lost updates once orders change state) and the socket origin (auth surface looser than HTTP). Finding 3 makes the socket truly reuse the HTTP auth rule. Findings 4–5 are mechanical. All five fit one fix round in this PR, then a Compact re-audit.

## Evidence Coverage
- Reviewed work SHA: `75831e7`; head `8a204b8` changes only handoff, state and the brief PR field.
- Sources inspected independently: migration `1761187200000-VenueTables.ts` vs `docs/schema.sql`; `visit.service.ts`, `visit.typeorm-repository.ts`, `table-seat.typeorm-repository.ts`, `table-seat.service.ts`, `table-summary.ts`, both controllers, `http-input.ts`, venue types/ports; `notifications.gateway.ts`, `handshake-token.ts`, `notifications.service.ts`, `redis-io.adapter.ts`; diffs of `token.service.ts`, `token.types.ts`, `auth.module.ts`, `redis.service.ts`, `configure-app.ts`, `app.module.ts`, IAM staff lookup, `package.json`, OpenAPI script; `cli/seed-venue.ts`; `test/venue.e2e-spec.ts` (open race, close); rule grep for types outside types/port/dto files.
- Tests run: **not re-run by Cowork** (audit shell has no Postgres/Redis and can't load oxlint's native binary). Relied on the handoff gate table on `75831e7`. GitHub `ci` on `8a204b8`: in progress at audit time — must be green on the audited head before merge.
- Audit is committed after S; pre-merge summary must verify S..head contains evidence-only changes (§7).
- Repeated blocker: none.

## Sonar (local scan)
- Handoff Sonar section present: yes — not run (optional).
- Learning mode: n/a (Field brief).

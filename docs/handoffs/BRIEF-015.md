# Handoff — BRIEF-015 Backend auth repair

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-10-17 |
| **Brief revision** | 1 |
| **Branch / PR** | `feat/BRIEF-015-backend-auth-repair` · PR #41 |
| **Commit** | `8d426b806cba410457dba728126b1fd3e8572077` (audit-fix evidence). Original implementation evidence remains `4d9422a`. |
| **Status** | Changes requested — Findings 1–2 and the access-request part of Finding 3 fixed; awaiting compact re-audit |

> Created at `Implemented`. Update it if review requests changes. Frozen at merge.

## Summary
Refresh rotation and revocation each run as one Redis `EVAL`, so a logout cannot land between consuming a token and publishing the next one. The auth module now reads as named steps with the C3–C7 names and types. oxlint enforces the measurable Clean Code rules across the backend, and every violation that those rules raised is fixed without `oxlint-disable`.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `app/backend/test/auth-token-concurrency.e2e-spec.ts` — logout during rotate, 50 iterations, real Redis |
| AC-2 | ✅ | same file — revoked family publishes nothing, including a late rotate while the old token is still present |
| AC-3 | ✅ | same file — concurrent double rotate, then logout |
| AC-4 | ✅ | review: `token.service.ts` calls `eval` only; no Redis capability branch |
| AC-5 | ✅ | `app/backend/test/auth.e2e-spec.ts` (unchanged assertions, file passed inside `test:e2e`) |
| AC-6 | ✅ | review: `handleLineCallback` is a step list, guard clauses, one `consumeNonce` |
| AC-7 | ✅ | review: names, `public`/`private`, `Promise<AuthMe>` on `AuthController.me`, `LineLoginCallbackInput`, reused `LineProfile` |
| AC-8 | ✅ | `app/backend/oxlint.json` + `pnpm --filter @bar/backend lint` exit 0 |
| AC-9 | ✅ local / CI pending | gates below, re-run on `8d426b8`; `openapi:export` produced no diff. `ci` on the pushed head follows this handoff |

## Gate Evidence (G1)
Run on the work tree that became `4d9422a`. Node v24.14.0. Redis `redis://127.0.0.1:6379`. Postgres `localhost:5432` database `bar`.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/backend lint` | 0 | pass · no diagnostics (zero warnings) |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 31 passed · 0 failed · 16 files |
| `pnpm --filter @bar/backend test:e2e` | 0 | 22 passed · 0 failed · 5 files |
| `pnpm --filter @bar/backend build` | 0 | pass |
| `pnpm --filter @bar/backend openapi:export && git diff --exit-code docs/api/openapi.json` | 0 | no diff |

The Nest error lines in the test log are the health and envelope specs throwing on purpose.

## Sonar (local scan)
- Scanned commit: not run · Quality Gate: not run (optional in this brief)
- Issues by severity: n/a
- Remaining issues + reason: n/a
- Who fixed: n/a

## Decisions Raised
- none

## Deviations from Brief
- None.

## Known Gaps / Follow-ups
- `SnakeNamingStrategy.joinTableColumnName` still has four parameters because it implements TypeORM's `NamingStrategyInterface`. `max-params` stays off, as the brief decided. Cowork agreed this is exempt.
- `AuthController.lineCallback` still has four Nest-decorated parameters. Cowork asked Field to exempt constructor injection and Nest handler parameters in `backend.md`. That rule file was not edited here.
- `family-revoked:<familyId>` is a new key used only inside `token.service.ts`. Existing key names (`refresh:`, `refresh-used:`, `session:`, `family:`, `oauth:`) are unchanged. No other module reads them.
- Return-type rule chosen: `typescript/explicit-module-boundary-types`. It requires a return type on exported functions and public methods, and does not require one on private helpers. `typescript/explicit-function-return-type` would also flag those helpers. `oxlint --rules` printed nothing in this environment; `oxlint --print-config` lists all four brief rules as deny, and lint ran with them on.
- Suggestions S1–S4 from the 2026-10-17 audit were not implemented.

## Audit fixes — 2026-10-17 · `8d426b8`
Cowork audit `d3be26e` was CHANGES REQUIRED. This commit addresses the mechanical findings. Same commands as the table above, re-run on this tree before the commit: lint 0, typecheck 0, test 31 passed, test:e2e 22 passed, build 0, OpenAPI diff empty. Node v24.14.0, Redis `127.0.0.1:6379`, Postgres `localhost:5432` database `bar`.
- Finding 1: named `LineAuthorizeInput`, `LineTokenExchange`, `LineAuthorizeUrlInput`, `AccessTokenPayload`, `RedirectTarget`, `AuthOkResponse`, `HttpResponseState`, `HealthStatus`.
- Finding 2: role names `redisService`, `jwtService`, `accessRequestService`, `appConfigService`, `authService`, `lineConfigService`, `accessRequestRepository`; `refreshTtlSeconds`, `revokedTtlSeconds`, `parseRotationOutcome`, `parseNonce`.
- Finding 3: `recordRequest` and `insertRequest` take `AccessRequestInput`. `lineCallback` is the Field decision above.

## AI Usage
**High** — Cursor implemented the repair, the lint fixes, the concurrency tests, and the audit renames.

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-015` (compact re-audit of Findings 1–3)
- PR: https://github.com/khaijeaw65/bar-management-system/pull/41 · Work SHA: `8d426b806cba410457dba728126b1fd3e8572077` · prior audited SHA: `4d9422a` · self-check: renames and named types only; e2e assertions unchanged; OpenAPI no diff

## Notes for Reviewer
- Start with `token.service.ts`: `ROTATE_REFRESH` and `REVOKE_FAMILY`. A revoked family returns `invalid` before any write. Reuse calls the same revoke script with the presented hash.
- `handleLineCallback` consumes OAuth state once, including on failure, then uses guard clauses.
- HTTP paths, cookies, env vars, and `@bar/contracts` are unchanged.
- Re-audit the names and types in the audit-fix section. Lua behaviour is unchanged from `4d9422a`.

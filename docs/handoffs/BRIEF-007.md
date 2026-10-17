# Handoff — BRIEF-007 Backend auth

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-10-17 |
| **Brief revision** | 3 |
| **Branch / PR** | `feat/BRIEF-007-backend-auth` · https://github.com/khaijeaw65/bar-management-system/pull/35 |
| **Commit** | `d300674b0033be5c9feab3f0119e11a912d27584` |
| **Status** | Implemented — awaiting audit |

> Evidence below was run on that commit's tree before this handoff file was added.

## Summary
A pre-registered staff LINE identity can sign in on the web. The callback sets HttpOnly `access_token` and `refresh_token` cookies, refresh rotates the family, and reuse of an old refresh token revokes that family's new token and session. Every route without `@Public()` requires the access token (cookie, then `Authorization: Bearer`).

An unknown LINE account upserts one `staff_access_request`. A second login updates the name and avatar only. A `rejected` row stays rejected. An inactive identity creates no row. Both not-registered cases log the LINE `sub` at info and redirect to `FRONTEND_URL/login?error=not_registered`.

`POST /api/auth/refresh` is `@Public()` because its credential is the refresh cookie. The access-token guard would reject the call that happens when the access cookie has expired.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `providers/config/jwt/configuration.spec.ts` (missing and 31-character `JWT_ACCESS_SECRET`), `line/configuration.spec.ts` (each `LINE_*`), `redis/configuration.spec.ts` (`REDIS_URL`), `app/configuration.spec.ts` (`FRONTEND_URL`). Zod's message names the variable. |
| AC-2 | ✅ | Migration `StaffIdentity1760659200000` creates `identity_provider` (`line`, `phone_otp`) plus `staff_user`, `staff_user_identity`, and `staff_access_request`. Revert drops all three tables and the enum (both queries returned 0 rows). Column nullability, lengths, defaults, and unique/FK constraints match `docs/schema.sql`, including nullable `pos_pin_hash VARCHAR(100)`. Output below. |
| AC-3 | ✅ | `test/auth.e2e-spec.ts` — 302 to `access.line.me/oauth2/v2.1/authorize` with the required query params. Redis `oauth:<state>` holds `{ nonce }` once, TTL 591–600s. A second login stores a second key and leaves the first. |
| AC-4 | ✅ | Registered callback sets both cookies (`HttpOnly`, `SameSite=Lax`, no `Secure` when `NODE_ENV=test`, `Path=/` and `Path=/api/auth`, `Max-Age` 900 and 604800) and 302 to `http://localhost:3000/`. `GET /api/auth/me` with the access cookie returns the user. Production `secure: true` is covered by `auth-cookies.spec.ts`. |
| AC-5 | ✅ | Unknown state and a replayed state → Location `/login?error=login_failed`, no access cookie. Logs do not contain the auth code or the fake ID token. Inactive identity → `not_registered`, no cookie, `sub` logged. |
| AC-5b | ✅ | One pending row with the LINE name and avatar. Second login updates name and avatar, still one row. After `status='rejected'`, a third login updates name and avatar and leaves `rejected`. Inactive identity: zero rows. |
| AC-6 | ✅ | E2e rotates both cookies; the old refresh token returns 401 and clears cookies; the new refresh token then also returns 401. Unit: `token.service.spec.ts` (reuse deletes the new hash and the session). |
| AC-7 | ✅ | Logout makes that session's still-valid access token and its refresh token 401. A second session of the same user still gets 200 from `/api/auth/me`. |
| AC-8 | ✅ | `/api/auth/me` with no token → `{ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized', data: null }`. Bearer without a cookie → 200. A bad `access_token` cookie plus a valid Bearer → 401 (cookie extractor wins). `/api/health` stays 200. |
| AC-9 | ✅ | `token.service.spec.ts`: Redis key is `refresh:<sha256>`, stored JSON has no raw refresh token, access token, or secret. Logger spy saw none of those. Refresh tokens are `crypto.randomBytes(32)`. |
| AC-10 | ✅ | Command output below. |
| AC-11 | ✅ | `rg PassportStrategy app/backend/src` matches only `jwt.strategy.ts` (`PassportStrategy(Strategy, 'jwt')`). `line.strategy.ts` and `jwt-refresh.strategy.ts` are deleted. `pnpm --filter @bar/backend exec oxlint src/modules/auth` printed nothing and exited 0. |
| AC-12 | local ✅ / CI pending | Gates below exit 0. `openapi:export` then `git diff --exit-code docs/api/openapi.json` exit 0. CI result is on PR #35 (Redis service + the same OpenAPI check). |

## AC-2 migration output
Local Postgres `bar`/`bar`/`bar` on localhost:5432. `pnpm --filter @bar/backend migration:revert` then `migration:run`:

```
Migration StaffIdentity1760659200000 has been reverted successfully.
```

After revert, `identity_provider` and the three tables were gone (0 rows).

```
Migration StaffIdentity1760659200000 has been executed successfully.
```

After re-run: enum labels `line, phone_otp`. `staff_user.pos_pin_hash` is nullable `varchar(100)`. `staff_user_identity.external_id` is nullable `varchar(300)` with `UNIQUE (provider, external_id)`. `staff_access_request.external_id` is `varchar(300) NOT NULL`, `status` defaults to `'pending'`, `decided_by` references `staff_user(id)`, same unique pair. The schema.sql `ALTER TABLE` statements that point `venue`, `table_seat`, and `visit` at `staff_user` are not in this migration; those tables are not created yet.

## AC-10 seed output
```
pnpm --filter @bar/backend seed:staff -- --line-user-id U-seed-evidence --name "First Owner"
registered 2dab7c8e-ba98-4803-b1d1-c5a40c766876

pnpm --filter @bar/backend seed:staff -- --line-user-id U-seed-evidence --name "First Owner"
already registered
```

## Gate Evidence (G1)
Run on the work tree of `d300674`, before this handoff commit. Node v24.14.0, pnpm 10.0.0. E2e used `infra` Postgres and Redis (`redis:7-alpine` on localhost:6379) and `NODE_ENV=test`.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/backend lint` | 0 | pass, no warnings |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 30 passed · 0 failed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 19 passed · 0 failed |
| `pnpm --filter @bar/backend build` | 0 | pass |
| `pnpm --filter @bar/backend openapi:export && git diff --exit-code docs/api/openapi.json` | 0 | second run produced no diff |
| `grep -R "@nestjs/testing" app/backend/dist` | 1 | no matches. The export script still imports `@nestjs/testing` and is not on the `dist/main.js` graph. |

Installed versions match the brief: `ioredis@5.11.1` (npm `latest` is 6.0.0; the brief pins 5), `passport-jwt@4.0.1`, `cookie-parser@1.4.7`, `@types/passport-jwt@4.0.1`, `@types/cookie-parser@1.4.10`. `pnpm view passport-jwt version` was `4.0.1`.

## Sonar (local scan)
- Scanned commit: not run · Quality Gate: not run (optional for this brief)
- Issues by severity: not run
- Remaining issues + reason: not run
- Who fixed: n/a

## Decisions Raised
- none

## Deviations from Brief
- none

## Clarifications, Field 2026-10-17
- **F2** — `login_failed` redirects to `${FRONTEND_URL}/login?error=login_failed`, the same host as success and `not_registered`. The brief table wrote the path without `FRONTEND_URL`. Field approved that as a clarification, not a deviation. E2e asserts the full URL.

## Audit fixes (Findings 1–2)
Cowork audit on `d300674` / head `3ef5f85`: CHANGES REQUIRED (`docs/audits/BRIEF-007.md`).

- **F1** — `TokenService.rotate()` takes the refresh record with `GETDEL`, so two concurrent refreshes of the same token cannot both mint a live token. The winner then publishes the new token, the family pointer, the session, and the used marker in one Redis script, and `revokeFamily` deletes the pointed-to token in one script, so a concurrent loser cannot leave a live token behind. `token.service.spec.ts` "lets one caller win, and logout with either token keeps the family dead" uses real Redis: `Promise.all([rotate(t), rotate(t)])` → exactly one `ok`. Logout with the winning token, and again with the original token, then neither token of that family rotates and `sessionExists` stays false.
- **F2** — see Clarifications above. `auth.e2e-spec.ts` expects `http://localhost:3000/login?error=login_failed`.

## Known Gaps / Follow-ups
- `POST /api/auth/refresh` does not require an access token. The brief's Auth column for that route is the refresh cookie.
- E2e runs with `fileParallelism: false` so the health and auth files do not race `CREATE TYPE`.
- The PIN column exists. There is no PIN endpoint.
- Audit suggestions 3–6 (login state cookie, access-request upsert, absolute session lifetime, single-flight refresh) are out of this fix.

## AI Usage
**High** — Cursor wrote the auth and IAM code, the migration, the tests, and this handoff.

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-007`
- PR: https://github.com/khaijeaw65/bar-management-system/pull/35 · Work SHA: `d300674b0033be5c9feab3f0119e11a912d27584` · self-check: LINE callback branches ↔ AC-5/AC-5b; cookie flags ↔ AC-4; refresh reuse revokes the family ↔ AC-6/AC-7; 401 envelope ↔ AC-8; Redis key is a hash ↔ AC-9; OpenAPI paths `/api/auth/line/login`, `/api/auth/line/callback` are 302 and `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/me` use the envelope helper.

# BRIEF-007 — Backend auth (web): LINE login, JWT cookies, refresh rotation, staff provisioning

| | |
|---|---|
| **Status** | Draft — **ON HOLD** (Field, 2026-09-27: design work first so Methee can start) |
| **Implementer** | kj |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | Default, no fallback |
| **PR** | <executor fills> |
| **Affected apps** | backend · infra/CI (Redis service) |
| **Revision** | 1 |
| **Depends on** | BRIEF-004 (Done), BRIEF-006 (Done) |
| **References** | handoff 2026-09-20 "Auth & Session Architecture" · DR-005 (mobile auth — **not** in this brief) · DR-007 (frontend axios — BRIEF-008) · `docs/rules/backend.md` · `docs/schema.sql` (`identity_provider`, `staff_user`, `staff_user_identity`) · LINE Login v2.1 |
| **Audit depth** | Full — auth |

---

## 1. Goal
A pre-registered staff member signs in with LINE on the web, receives HttpOnly JWT cookies, stays signed in through refresh-token rotation, and every non-public endpoint requires a valid access token. First sprint-2 building block; frontend login (BRIEF-008) and IAM permissions (BRIEF-009) build on it.

## 2. Scope
### In
- **Config domains** (`providers/config/<domain>/`, 3 files each):
  - `redis` — `REDIS_URL`
  - `jwt` — `JWT_ACCESS_SECRET` (≥ 32 chars), `JWT_ACCESS_TTL` (default `15m`), `REFRESH_TTL_DAYS` (default `7`)
  - `line` — `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`, `LINE_CALLBACK_URL`
  - `app` — add `FRONTEND_URL` (CORS origin + post-login redirect)
- **Redis provider:** `providers/redis/redis.module.ts` (global) + `redis.service.ts` exposing one `ioredis` client; closed on shutdown.
- **Migration** `…-StaffIdentity.ts`: `identity_provider` enum, `staff_user`, `staff_user_identity` — **exactly as `docs/schema.sql`**.
- **IAM module (minimal):** `modules/iam/` — `StaffUser`, `StaffUserIdentity` entities; repository port + TypeORM adapter; `StaffUserService` with `findByIdentity(provider, externalId)` and `findActiveById(id)`. No groups/policies yet (BRIEF-009). These two tables have no audit columns in `schema.sql` → the entities do **not** extend `BaseEntity`.
- **Auth module** (replace the passport stubs):
  - `LineClient` behind a port: build authorize URL, exchange code (`https://api.line.me/oauth2/v2.1/token`), verify ID token (`POST https://api.line.me/oauth2/v2.1/verify` with `nonce`). Plain `fetch`.
  - `TokenService`: access JWT (HS256, payload `{ sub }`, TTL from config) via `@nestjs/jwt`; **opaque refresh tokens** (32 random bytes) stored in Redis **hashed** (`refresh:<sha256>` → `{ userId, familyId }`, TTL = refresh TTL); rotation on every use; **reuse of an already-rotated token revokes the whole family**.
  - OAuth `state` + `nonce` in Redis (`oauth:<state>`, 10 min, single use).
  - `JwtAuthGuard` registered as `APP_GUARD`; reads cookie `access_token`, then `Authorization: Bearer` (DR-005 extractor order); `@Public()` decorator in `common/decorators/public.decorator.ts`; `HealthController` marked `@Public()`. `CurrentUser` decorator returns `{ sub }`.
  - `cookie-parser` in `bootstrap/configure-app.ts`; `enableCors({ origin: FRONTEND_URL, credentials: true })`.
- **Endpoints** (`/api/auth`, envelope applies except redirects):
  | Method | Path | Auth | Behaviour |
  |---|---|---|---|
  | GET | `/auth/line/login` | public | 302 → LINE authorize (`scope=profile openid`, `state`, `nonce`) |
  | GET | `/auth/line/callback` | public | verify `state` (single use) → exchange code → verify ID token → find active identity. **Found:** set `access_token` + `refresh_token` cookies, 302 → `FRONTEND_URL/`. **Not found / inactive:** 302 → `FRONTEND_URL/login?error=not_registered`, log LINE `sub` at `info` (for provisioning). **Any other failure:** 302 → `/login?error=login_failed`. |
  | POST | `/auth/refresh` | refresh cookie | rotate → new cookies → `{ ok: true }`; invalid/reused → 401 + clear cookies |
  | POST | `/auth/logout` | public (cookie optional) | revoke refresh family if present, clear cookies → `{ ok: true }` |
  | GET | `/auth/me` | access token | `{ id, displayName, avatarUrl }` |
- **Cookies** (handoff 2026-09-20): `access_token` HttpOnly, `SameSite=Lax`, `Secure` when `NODE_ENV=production`, `path=/`, max-age = access TTL; `refresh_token` same flags, `path=/api/auth`, max-age = refresh TTL.
- **Staff provisioning CLI:** `pnpm --filter @bar/backend seed:staff -- --line-user-id <sub> --name "<display name>"` — standalone script using the CLI `DataSource`; idempotent (existing identity → prints "already registered").
- **CI:** add a `redis:7-alpine` service + test env values (`REDIS_URL`, dummy `JWT_ACCESS_SECRET`, dummy `LINE_*`, `FRONTEND_URL`) to `.github/workflows/ci.yml`.
- `.env.example` (backend) updated; `README` auth section (how to provision the first owner).
- Remove `@nestjs/passport`, `passport` and the three strategy stubs (no longer used) — closes the 4 unused-import Sonar issues too.

### Out (do NOT build here)
- Mobile endpoints (`/auth/mobile/token`, `/auth/mobile/refresh`, PKCE) — with the Expo auth brief (DR-005).
- Frontend login page, axios, 401 interceptor — BRIEF-008.
- Groups, policies, `PermissionsGuard`, permission cache — BRIEF-009.
- `notification` / `staff_push_token` tables — with the notifications brief.
- Rate limiting, account linking, phone OTP, customer login.

## 3. Contract
- Env vars listed in §2 (exact names). Test/dev values only in `.env.example` and CI — never real secrets.
- `GET /api/auth/me` → `{ status: 200, message: 'success', data: { id: uuid, displayName: string, avatarUrl: string | null } }`
- Unauthenticated protected route → `401 { status: 401, message: 'Unauthorized', data: null }`.

## 4. Acceptance Criteria
- **AC-1** — Missing/short `JWT_ACCESS_SECRET` or missing `LINE_*`/`REDIS_URL`/`FRONTEND_URL` → app refuses to boot, message names the variable.
- **AC-2** — Migration creates the enum + two tables matching `schema.sql` (column names/types/nullability/unique); revert drops them.
- **AC-3** — `GET /auth/line/login` → 302 to `access.line.me/oauth2/v2.1/authorize` with `response_type=code`, `client_id`, `redirect_uri`, `state`, `nonce`, `scope=profile openid`; state stored once.
- **AC-4** — Callback with a registered identity (fake LINE client in e2e) → both cookies with the flags in §2, 302 to `FRONTEND_URL/`; `GET /auth/me` with the cookie returns the user.
- **AC-5** — Callback with unknown/replayed `state` → `login_failed`; unregistered or inactive identity → `not_registered`, no cookies, LINE `sub` logged.
- **AC-6** — `POST /auth/refresh` rotates both cookies; using the **old** refresh token again → 401, cookies cleared, and the **new** token of that family is also revoked.
- **AC-7** — `POST /auth/logout` revokes the family and clears cookies; the old refresh token then fails.
- **AC-8** — Any non-`@Public` route without a token → 401 envelope; with `Authorization: Bearer <access>` it passes (extractor order); `/api/health` stays public.
- **AC-9** — Refresh tokens are never stored in plain text (Redis key is a hash); tokens/secrets never logged.
- **AC-10** — `seed:staff` creates the user + identity; second run reports "already registered".
- **AC-11** — `@nestjs/passport`, `passport` and strategy stubs removed; lint 0 warnings in `modules/auth`.
- **AC-12** — lint / typecheck / test / test:e2e / build exit 0; `ci` green with the Redis service.

## 5. Test Gate
| AC | Test type | Location |
|---|---|---|
| AC-1 | unit | `providers/config/{jwt,line,redis}/configuration.spec.ts` |
| AC-2 | e2e / manual | migration run + revert output in handoff |
| AC-3–AC-8 | e2e | `test/auth.e2e-spec.ts` (real Postgres + Redis, fake `LineClient` provider) |
| AC-6, AC-9 | unit | `modules/auth/application/token.service.spec.ts` |
| AC-10 | manual | command output in handoff |
| AC-11, AC-12 | command output + `ci` link | handoff |

```bash
pnpm --filter @bar/backend lint
pnpm --filter @bar/backend typecheck
pnpm --filter @bar/backend test
pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend build
```

### Local Sonar scan
- Optional (Field brief). If run, paste `pnpm sonar:report` in the handoff.

## 6. Constraints
- Layout per `backend.md` (config per domain, `providers/`, hexagonal `modules/iam`); `.js` imports; migrations only; envelope for JSON responses.
- LINE HTTP calls only through the `LineClient` port — e2e replaces it; **no real LINE calls in tests**.
- Never put tokens, codes, secrets or LINE ID tokens in logs or error messages. The LINE `sub` is logged only on `not_registered`.
- Constant-time comparison is not needed (hash lookup), but refresh tokens must be ≥ 32 bytes of `crypto.randomBytes`.

## 7. Decision Points (Field Guard)
- **Proposed for Field review before Ready** (become Pre-decided when approved):
  - **D1 Staff provisioning:** only pre-registered LINE identities can sign in; the first owner is created with `seed:staff`; the LINE `sub` of a rejected login is logged so the owner can register staff. (Invite links come later with IAM.)
  - **D2 Refresh tokens:** opaque, hashed in Redis with family rotation + reuse detection (no DB table, no JWT refresh). Flushing Redis signs everyone out — acceptable.
  - **D3 JWT payload** `{ sub }` only — no `venueId` (DB-per-venue). `backend.md` Auth line updated with this brief.
  - **D4 No passport:** custom `JwtAuthGuard` with `@nestjs/jwt`; remove `@nestjs/passport` + `passport`.
- **Pre-decided packages (exact):** `ioredis` `^5.11.1` (BullMQ uses ioredis 5 — not 6.0), `cookie-parser` `^1.4.7`, dev `@types/cookie-parser` `^1.4.10`. Removed: `@nestjs/passport`, `passport`.
- **Likely DRs:** LINE verify endpoint behaviour differs from docs · need for a `staff_refresh_token` DB table after all · CORS/cookie issues across ports in dev.

## 8. Unlocked Protected Files
- `.github/workflows/ci.yml` (Redis service + test env only)

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions
- [ ] No unresolved decision blocking the main outcome (D1–D4 need Field)
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-09-25 | Initial draft (Cowork). Mobile auth split out (DR-005 later), frontend = BRIEF-008, IAM = BRIEF-009 |
| 1 | 2026-09-27 | On hold — Field switched priority to UX/UI design; D1–D4 still open |

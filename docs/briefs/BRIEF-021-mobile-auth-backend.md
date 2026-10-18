# BRIEF-021 — Backend: mobile LINE login (DR-005) + dev tunnel for phone and webhooks

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj — Field codes ~20–30 % (Field's choice for this brief, 2026-10-18; overrides the 0 % default for this brief only), executor agent (Cursor) the rest |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 1 |
| **Depends on** | **BRIEF-007 + BRIEF-015 merged** (LINE login, token rotation, `session:<sid>`, Bearer extractor — on `main`) · BRIEF-020 merged (#54, current module layout) |
| **References** | **DR-005** (flow, rules, Amendment 1 session check, Amendment 2 mobile 30-day sliding TTL) · DR-008 / DR-009 (mobile = same API, auth is the one exception) · `docs/design/CD-08-handoff.md` (login states, `NOT_REGISTERED`, R13) · `docs/rules/backend.md` (Auth) · RFC 7636 (PKCE S256) |
| **Audit depth** | Full (auth) |
| **Size** | ~1.5 days |
| **Unblocks** | BRIEF-022 (Metee — mobile LINE login) |

---

## 1. Goal
The Expo staff app can sign in with LINE and get a Bearer token pair in the response body (DR-005 option A), and a phone on any network — plus LINE's redirect, and later the payment webhook (BRIEF-013) — can reach the local backend through one stable HTTPS tunnel URL. The web cookie flow does not change.

**Why now:** BRIEF-022 (Metee's real login) is blocked without these endpoints, and the gate demo is "phone order → POS live" (8 Nov). The tunnel is needed anyway: LINE needs a callback URL the phone's browser can reach, and BRIEF-013 needs a public webhook URL.

## 2. Scope
### In
- **Login start** — `GET /api/auth/line/login` accepts optional `client=mobile` + `code_challenge` (base64url, 43 chars) + `code_challenge_method=S256`. With `client=mobile`, `{ nonce, client: 'mobile', codeChallenge }` is stored in the existing OAuth state record (Redis `oauth:<state>`, 600 s). Missing/invalid challenge with `client=mobile` → 400. No `client` → today's web behaviour, byte for byte.
- **Callback** — `GET /api/auth/line/callback`: same LINE verification as today. When the state record says `mobile`:
  - success → **no cookies, no session yet**; create a one-time code (32 random bytes, base64url) → Redis `mauth:<code>` = `{ userId, codeChallenge }`, TTL 60 s → `302 barapp://auth?code=<code>`.
  - failure → `302 barapp://auth?error=login_failed` · not registered / inactive → `302 barapp://auth?error=not_registered` (the access request is still recorded, as on web).
  - The redirect target is the constant `barapp://auth` — never read from a query parameter (DR-005, no open redirect).
- **`POST /api/auth/mobile/token`** — `@Public()`. Body `{ code, codeVerifier }`. `GETDEL mauth:<code>` (single use even on failure) → check `base64url(sha256(codeVerifier)) === codeChallenge` → `createSession` for a **mobile family** → `{ accessToken, refreshToken, expiresIn }`. Any failure → 401, nothing issued.
- **`POST /api/auth/mobile/refresh`** — `@Public()`. Body `{ refreshToken }` → rotated pair, same shape. Same rotation script + reuse detection as web (reuse → family revoked → 401).
- **Mobile session TTL (DR-005 Am. 2)** — mobile families use `MOBILE_REFRESH_TTL_DAYS` (default 30), sliding: every rotation resets refresh, family and `session:<sid>` TTL to the mobile value. The TTL travels with the family record so rotation picks the right one; web families stay on `REFRESH_TTL_DAYS` (7).
- **Logout** — `POST /api/auth/logout` also accepts body `{ refreshToken }` when no refresh cookie is present (DR-005 "existing logout path, token from body"). Revokes the family → `session:<sid>` gone → next Bearer call 401 (Am. 1).
- **Contracts** — `app/packages/contracts/src/schemas/auth.ts`: `MobileTokenRequestSchema`, `MobileRefreshRequestSchema`, `MobileTokenResponseSchema` (+ types), exported from the package index. BRIEF-022 imports these.
- **Dev tunnel (docs + env only, no package)** — a "Phone & webhooks via tunnel" section in `app/backend/README.md`:
  1. ngrok free account → one **static domain** (stable across restarts, so LINE and the phone don't need re-config).
  2. `ngrok http --url=<static-domain> 3001`.
  3. `LINE_CALLBACK_URL=https://<static-domain>/api/auth/line/callback` in `.env`; add the same URL in LINE Developers console → LINE Login channel → Callback URL (keep the localhost one for web).
  4. Mobile: `EXPO_PUBLIC_API_URL=https://<static-domain>/api` (BRIEF-022).
  5. Payment webhook (BRIEF-013) will use `https://<static-domain>/api/...` — same tunnel, nothing to set up here.
  - `app/backend/.env.example`: add `MOBILE_REFRESH_TTL_DAYS=30` and a comment on `LINE_CALLBACK_URL` pointing to the README section.
- OpenAPI regenerated (`openapi:export`), committed.

### Out (do NOT build here)
- The payment webhook handler, GB Prime Pay signature check, PromptPay — **BRIEF-013**.
- Push token register/delete on logout (DR-003) — the push brief.
- Any Expo / `app/mobile` code — BRIEF-022 (Metee).
- Device list / owner revokes a device UI (IAM brief). `sid` revoke already works server-side.
- ngrok in `infra/docker-compose.yml`, a tunnel npm package, or a deployed staging backend.
- Any change to the web cookie flow, cookie flags, CORS or `/api/auth/refresh`.
- Rate limiting on the token endpoints (follow-up before a real-bar pilot).

## 3. Contract
- **Endpoints:**
  - `GET /api/auth/line/login?client=mobile&code_challenge=<b64url>&code_challenge_method=S256` → `302` LINE authorize URL · `400` bad/missing challenge with `client=mobile`.
  - `GET /api/auth/line/callback` (mobile state) → `302 barapp://auth?code=<code>` · `302 barapp://auth?error=login_failed|not_registered`.
  - `POST /api/auth/mobile/token` — `{ code: string, codeVerifier: string (43–128 chars, RFC 7636) }` → envelope `data: { accessToken: string, refreshToken: string, expiresIn: number /* access TTL, seconds */ }` · `401`.
  - `POST /api/auth/mobile/refresh` — `{ refreshToken: string }` → same `data` shape · `401`.
  - `POST /api/auth/logout` — unchanged response; body `{ refreshToken?: string }` used only when no refresh cookie.
- **WS events:** none.
- **Contracts changes:** 3 schemas above in `schemas/auth.ts`; no enum changes.
- **Permissions:** none — all auth endpoints are `@Public()`; `GET /auth/me` already accepts Bearer.
- **Error codes:** none new — 400 / 401 with existing codes, Thai `message`.
- **OpenAPI:** every endpoint above appears in `docs/api/openapi.json` (regenerated, committed).
- **Conventions:** `docs/api/README.md`.

## 4. Acceptance Criteria
- **AC-1** — Given `client=mobile` and a valid S256 challenge, when `/auth/line/login` is called, then it redirects to LINE and the stored state record holds `client: 'mobile'` and the challenge; given `client=mobile` without a valid challenge, then 400 and no state is stored.
- **AC-2** — Given a mobile state and a registered active staff identity, when the callback runs, then it redirects to `barapp://auth?code=…`, sets **no** cookies, creates **no** session, and `mauth:<code>` exists with TTL ≤ 60 s.
- **AC-3** — Given a mobile state, when LINE returns an error / the state is unknown or replayed, then `barapp://auth?error=login_failed`; given an unregistered or inactive identity, then `barapp://auth?error=not_registered` and the access request is recorded exactly as on web.
- **AC-4** — Given a valid code and the matching verifier, when `POST /auth/mobile/token`, then it returns `{ accessToken, refreshToken, expiresIn }`, and `GET /auth/me` with `Authorization: Bearer <accessToken>` returns that staff user.
- **AC-5** — Given a wrong verifier, an expired code, or a code already used (including after one failed attempt), when `POST /auth/mobile/token`, then 401 and no session is created.
- **AC-6** — Given a mobile refresh token, when `POST /auth/mobile/refresh`, then a new pair is returned and refresh, family and `session:<sid>` TTLs are reset to `MOBILE_REFRESH_TTL_DAYS`; when the **old** token is reused, then 401 and the whole family is revoked (Bearer on the newest access token → 401).
- **AC-7** — Given a web login, when refreshed, then TTL is still `REFRESH_TTL_DAYS` and every existing `test/auth.e2e-spec.ts` case passes unchanged (web regression).
- **AC-8** — Given a mobile session, when `POST /auth/logout` with body `{ refreshToken }` and no cookie, then 200, and the next Bearer request with that session's access token → 401.
- **AC-9** — The redirect target cannot be changed by any request input (test: extra `redirect_uri` / `redirect` query params are ignored).
- **AC-10** — No token, code or verifier appears in logs (test asserts on captured logger output, same pattern as the existing "logs nothing sensitive" case).
- **AC-11** — `docs/api/openapi.json` contains the new/changed endpoints; `openapi:check` passes.
- **AC-12** — `app/backend/README.md` tunnel section lets Metee reach his own backend from his phone: **Field's manual evidence** — one LINE login on an Android phone over the tunnel ending at `barapp://auth?code=…` (screenshot or screen recording in the handoff).

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1–AC-3, AC-9 | e2e | `test/auth-mobile.e2e-spec.ts` (fake LINE client, real Redis) |
| AC-4–AC-6, AC-8 | e2e | `test/auth-mobile.e2e-spec.ts` |
| AC-5 (PKCE check) | unit | `src/modules/auth/application/*.spec.ts` (S256 verify: RFC 7636 Appendix B vector) |
| AC-6 (TTL), AC-7 | unit + e2e | `token.service.spec.ts` · `test/auth.e2e-spec.ts` unchanged + passing |
| AC-10 | e2e | `test/auth-mobile.e2e-spec.ts` |
| AC-11 | command | `openapi:check` |
| AC-12 | manual | handoff screenshot / recording (Field) |

Gate commands (all must pass):
```bash
pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint
pnpm --filter @bar/backend typecheck
pnpm --filter @bar/backend test
pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend build
pnpm --filter @bar/backend openapi:check
```
A required script that doesn't exist yet = **BLOCKED** — report it, never skip silently.

### Local Sonar scan
- Optional — Field's brief; run if time allows (auth code: recommended).

## 6. Constraints
- Web flow untouched: same cookies, flags, redirects, `/auth/refresh`. AC-7 is the guard.
- One-time code and OAuth state are single-use **even on failure** (`GETDEL`), same as the existing nonce.
- Session is created at token exchange, not at callback — an abandoned login leaves no session.
- PKCE compare with `timingSafeEqual` on equal-length buffers; `node:crypto` only (no new package).
- Tokens only in response bodies for mobile; never in a URL, never logged.
- Hexagonal layout from BRIEF-020; Zod DTOs from contracts; config through `providers/config/jwt` (`MOBILE_REFRESH_TTL_DAYS` validated like `REFRESH_TTL_DAYS`).
- **Field's 20–30 %** — suggested split: Field writes the PKCE verify + the token-exchange service method + AC-5/AC-6 tests (the security-critical core); the agent does controller/DTO/contracts/OpenAPI/README/e2e scaffolding. Record the actual split in the handoff.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact only):**
  - Flow, endpoints, redirect `barapp://auth`, 60 s code, PKCE S256, Bearer extractor, 30-day sliding mobile TTL — **DR-005 + Amendments 1–2 (Approved)**.
  - Endpoint paths exactly as §3 · body field names `code`, `codeVerifier`, `refreshToken` · response `{ accessToken, refreshToken, expiresIn }`.
  - Redis keys `mauth:<code>` (60 s) · OAuth state record gains `client`, `codeChallenge`.
  - Env `MOBILE_REFRESH_TTL_DAYS` (default 30) in `app/backend/.env.example`.
  - Contracts: `MobileTokenRequestSchema`, `MobileRefreshRequestSchema`, `MobileTokenResponseSchema` in `app/packages/contracts/src/schemas/auth.ts`.
  - Tunnel = ngrok free static domain, **documented only** in `app/backend/README.md` — no package, no compose service.
  - No new packages.
- **Likely DRs:**
  - LINE Login rejects the ngrok callback URL or needs a second channel → DR (do not create a second channel alone).
  - `expo-web-browser` on Android does not close on a `302` to `barapp://` → raise with Metee in BRIEF-022 before changing the redirect shape.
  - Rotation Lua script can't carry a per-family TTL without changing the web record shape → DR before changing the web record.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions
- [x] No unresolved decision blocking the main outcome (DR-005 Approved)
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-18 | Initial Draft (Cowork) — Field chose DR-005 real mobile login over a dev token endpoint; Field codes 20–30 % on this brief |

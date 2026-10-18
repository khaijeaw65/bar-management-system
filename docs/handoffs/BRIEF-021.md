# Handoff — BRIEF-021 Backend: mobile LINE login + dev tunnel

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-10-18 |
| **Brief revision** | 2 |
| **Branch / PR** | `feat/BRIEF-021-mobile-auth-backend` · PR opens after this PASS commit |
| **Commit** | `7bcad32a7b30abfcaadc4b39776dcba567afcf0a` (audited work). Prior implementation `08e2a8e`. |
| **Status** | Audit PASS — merged PR determines Done |

> Gate evidence below was re-run on `7bcad32` (the D1 fix). Node v24.14.0, pnpm 10.0.0. Postgres `localhost:5432`, Redis `127.0.0.1:6379`. The first run on `08e2a8e` is superseded by this one. This handoff is the later PASS docs commit.

## Summary
`GET /api/auth/line/login?client=mobile` stores the S256 challenge and the callback redirects to `barapp://auth` with a 60-second code. `POST /api/auth/mobile/token` checks PKCE and returns a bearer pair; refresh rotates that family for `MOBILE_REFRESH_TTL_DAYS` (default 30). The web cookie flow is unchanged. The tunnel is documented only.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `test/auth-mobile.e2e-spec.ts` — `stores a mobile challenge and rejects a mobile login without one` |
| AC-2 | ✅ | same file — `redirects a registered staff user to barapp without a session or cookies` |
| AC-3 | ✅ | same file — `sends login_failed for a LINE error or a replay, and not_registered for an unknown or inactive identity` · `sends login_failed when an m. state has expired` |
| AC-4 | ✅ | same file — `exchanges a matching verifier for a bearer session` |
| AC-5 | ✅ | same file — `rejects a wrong, expired, or already used code and creates no session` · `pkce.spec.ts` — `accepts the RFC 7636 Appendix B vector` |
| AC-6 | ✅ | same file — `rotates a mobile refresh token on the mobile TTL and revokes the family on reuse` · `token.service.spec.ts` — `resets a mobile family to the mobile TTL and revokes it on reuse` |
| AC-7 | ✅ | `token.service.spec.ts` — `keeps a web family on the web TTL without a mobile field` · `test/auth.e2e-spec.ts` unchanged, 8 cases passed |
| AC-8 | ✅ | `test/auth-mobile.e2e-spec.ts` — `revokes a mobile session from the refresh token in the body` |
| AC-9 | ✅ | login and callback in the AC-1 and AC-2 cases send `redirect` and `redirect_uri` and still land on LINE or `barapp://auth` |
| AC-10 | ✅ | same file — `logs neither the mobile code, the verifier, nor the tokens` |
| AC-11 | ✅ | `pnpm --filter @bar/backend openapi:check` exit 0 on `7bcad32` |
| AC-12 | ✅ | Field, 2026-10-18, desktop, localhost, real LINE channel — see below. Phone part is BRIEF-022 AC-9. Tunnel not tested |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts test` | 0 | 20 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/backend lint` | 0 | pass (oxlint + class-file check) |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 66 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/backend test:e2e` | 0 | 62 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/backend build` | 0 | pass |
| `pnpm --filter @bar/backend openapi:check` | 0 | pass on `7bcad32`, no further diff |

## Sonar (local scan)
- Not available yet. BRIEF-006 is still Ready, so the local SonarQube scan is not live (`docs/quality/README.md`).

## Decisions Raised
- none

## Deviations from Brief
- None. Rev 2 records the desktop AC-12 evidence and the `m.` state prefix.

## AC-12 evidence (Field, 2026-10-18, desktop, localhost, real LINE channel)
`login?client=mobile` → LINE → callback (`not_registered` first, then `seed:staff`, then registered).
`POST /auth/mobile/token` → 200 `{ accessToken, refreshToken, expiresIn: 900 }`.
`GET /auth/me` (Bearer) → 200, displayName `KJ`.
`POST /auth/mobile/refresh` → 200, new pair.
`POST /auth/logout` `{ refreshToken }` → 200 → `GET /auth/me` (Bearer) → 401.
Phone part → BRIEF-022 AC-9 (Metee). Tunnel not tested yet.

## Known Gaps / Follow-ups
- Tunnel not tested (Field, 2026-10-18). Phone login ending at `barapp://auth?code=…` is BRIEF-022 AC-9.
- Rate limiting on the token endpoints stays a follow-up before a real-bar pilot, as the brief says.
- Audit S1: a web refresh token posted to `/auth/mobile/refresh` still rotates that family. Park it with rate limiting.

## AI Usage
**High** — Cursor implemented the mobile handoff, including the PKCE check, token exchange, and AC-5/AC-6 tests. Field issued `execute`, so the suggested 20–30% split was not taken in this session.

## Review Routing
- Assigned auditor: Cowork
- Audit: PASS on `7bcad32a7b30abfcaadc4b39776dcba567afcf0a` (re-audit appended). Must fix: 0.
- Next: open the PR from this PASS commit. Merge when `ci` is green on that head. Field's own PR is pre-approved.
- Work SHA: `7bcad32a7b30abfcaadc4b39776dcba567afcf0a` · self-check: contracts schemas match §3; web `oauth` JSON stays `{ nonce }`; mobile refresh JSON adds `refreshTtlSeconds` and the rotation script copies it. Web records omit the field and keep `REFRESH_TTL_DAYS`.

## Notes for Reviewer
- A mobile `state` is `m.` plus 32 random bytes. When that Redis record is gone, the prefix alone selects `barapp://auth?error=login_failed`. It does not mint a code or a session. A state without the prefix still uses the web login URL, which is what `test/auth.e2e-spec.ts` locks. There is no `oauth-mobile:` key.
- 400 validation messages are Thai. 401 stays `Unauthorized`, the same message as every existing auth 401.
- Logout uses the refresh cookie when one is present, and the body token only when it is not.
- No new package. Tunnel steps are in `app/backend/README.md` under "Phone & webhooks via tunnel".

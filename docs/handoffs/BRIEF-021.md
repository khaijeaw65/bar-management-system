# Handoff — BRIEF-021 Backend: mobile LINE login + dev tunnel

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-10-18 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-021-mobile-auth-backend` (PR opens after audit PASS) |
| **Commit** | `08e2a8edbb6e207a27d686f6c01f7bb874da4273` |
| **Status** | Implemented — awaiting AC-12, then audit |

> Gate evidence below was run on the work tree that became `08e2a8e`. Node v24.14.0, pnpm 10.0.0. Postgres `localhost:5432`, Redis `127.0.0.1:6379`. `openapi:check` was re-run on that commit and exited 0.

## Summary
`GET /api/auth/line/login?client=mobile` stores the S256 challenge and the callback redirects to `barapp://auth` with a 60-second code. `POST /api/auth/mobile/token` checks PKCE and returns a bearer pair; refresh rotates that family for `MOBILE_REFRESH_TTL_DAYS` (default 30). The web cookie flow is unchanged. The tunnel is documented only.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `test/auth-mobile.e2e-spec.ts` — `stores a mobile challenge and rejects a mobile login without one` |
| AC-2 | ✅ | same file — `redirects a registered staff user to barapp without a session or cookies` |
| AC-3 | ✅ | same file — `sends login_failed for a LINE error or a replay, and not_registered for an unknown or inactive identity` |
| AC-4 | ✅ | same file — `exchanges a matching verifier for a bearer session` |
| AC-5 | ✅ | same file — `rejects a wrong, expired, or already used code and creates no session` · `pkce.spec.ts` — `accepts the RFC 7636 Appendix B vector` |
| AC-6 | ✅ | same file — `rotates a mobile refresh token on the mobile TTL and revokes the family on reuse` · `token.service.spec.ts` — `resets a mobile family to the mobile TTL and revokes it on reuse` |
| AC-7 | ✅ | `token.service.spec.ts` — `keeps a web family on the web TTL without a mobile field` · `test/auth.e2e-spec.ts` unchanged, 8 cases passed |
| AC-8 | ✅ | `test/auth-mobile.e2e-spec.ts` — `revokes a mobile session from the refresh token in the body` |
| AC-9 | ✅ | login and callback in the AC-1 and AC-2 cases send `redirect` and `redirect_uri` and still land on LINE or `barapp://auth` |
| AC-10 | ✅ | same file — `logs neither the mobile code, the verifier, nor the tokens` |
| AC-11 | ✅ | `pnpm --filter @bar/backend openapi:check` exit 0 on `08e2a8e` |
| AC-12 | not run | Field's phone evidence. README section is written. No screenshot yet |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts test` | 0 | 20 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/backend lint` | 0 | pass (oxlint + class-file check) |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 66 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/backend test:e2e` | 0 | 61 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/backend build` | 0 | pass |
| `pnpm --filter @bar/backend openapi:check` | 0 | pass on `08e2a8e`, no further diff |

## Sonar (local scan)
- Not available yet. BRIEF-006 is still Ready, so the local SonarQube scan is not live (`docs/quality/README.md`).

## Decisions Raised
- none

## Deviations from Brief
- None.

## Known Gaps / Follow-ups
- AC-12: one LINE login from an Android phone over the ngrok static domain, ending at `barapp://auth?code=…`. Screenshot or recording belongs in this handoff before audit PASS.
- Rate limiting on the token endpoints stays a follow-up before a real-bar pilot, as the brief says.

## AI Usage
**High** — Cursor implemented the mobile handoff, including the PKCE check, token exchange, and AC-5/AC-6 tests. Field issued `execute`, so the suggested 20–30% split was not taken in this session.

## Review Routing
- Assigned auditor: Cowork
- Next command: Field adds the AC-12 screenshot, then `audit BRIEF-021`
- Work SHA: `08e2a8edbb6e207a27d686f6c01f7bb874da4273` · self-check: contracts schemas match §3; web `oauth` JSON stays `{ nonce }`; mobile refresh JSON adds `refreshTtlSeconds` and the rotation script copies it. Web records omit the field and keep `REFRESH_TTL_DAYS`.

## Notes for Reviewer
- A replayed mobile `state` has already been deleted. `oauth-mobile:<state>` remembers the client only so the error redirect stays `barapp://auth`. It does not mint a code or a session. An unknown state with no marker still uses the web login URL, which is what `test/auth.e2e-spec.ts` locks.
- 400 validation messages are Thai. 401 stays `Unauthorized`, the same message as every existing auth 401.
- Logout uses the refresh cookie when one is present, and the body token only when it is not.
- No new package. Tunnel steps are in `app/backend/README.md` under "Phone & webhooks via tunnel".

# Audit — BRIEF-007 Backend auth (web): LINE login, JWT cookies, refresh rotation

| | |
|---|---|
| **Auditor** | Cowork (planning/audit session, 2026-10-17) |
| **Assignment** | Brief: Cowork (default); requested by Field 2026-10-17 |
| **Date** | 2026-10-17 |
| **PR / commit** | #35 · `d300674` (work) · head reviewed `3ef5f85` (handoff + PR link only after S) |
| **Depth** | Full (auth) |
| **Brief revision** | 3 (commit `2726986` byte-identical to the Cowork-written Rev 3; later diff = PR link only ✅) |
| **Recommendation** | **CHANGES REQUIRED** ← Field makes the final call |

> Findings describe code and documents, not people. "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `providers/config/{jwt,line,redis,app}/configuration.spec.ts` | |
| AC-2 | ✅ | migration `1760659200000-StaffIdentity.ts` ↔ `schema.sql` (all 4 objects, columns/nullability/unique identical; `pos_pin_hash` present) | FKs from venue/seat/visit added later — noted in the migration |
| AC-3 | ✅ | e2e "redirects to LINE and stores the state once" | |
| AC-4 | ✅ | e2e registered identity → cookies + `/auth/me` | |
| AC-5 | ⚠️ | e2e unknown/replayed state | `login_failed` redirects to the **API host** (Finding 2) |
| AC-5b | ✅ | e2e "records one pending access request and keeps a rejected row rejected" + inactive → no row | |
| AC-6 | ✅ (sequential) / ❌ (concurrent) | `token.service.spec.ts`, e2e rotate/reuse | Reuse detection fails under concurrency (Finding 1) |
| AC-7 | ❌ | e2e passes sequentially; reproduction below shows a logged-out session revived | Finding 1 |
| AC-8 | ✅ | e2e cookie / bearer / health public | |
| AC-9 | ✅ | Redis keys are SHA-256 hashes; no tokens/codes/secrets in logs (only LINE `sub` on not-registered/inactive, as the brief allows) | |
| AC-10 | ✅ | handoff command output | |
| AC-11 | ✅ | `line.strategy.ts`, `jwt-refresh.strategy.ts` deleted; one `jwt` strategy | |
| AC-12 | ✅ | `ci` success on `3ef5f85` | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope | ✅ | |
| Deviations / deps | ✅ | `cookie-parser`, `ioredis`, `passport-jwt` + types = exactly the pre-decided list |
| `PermissionsGuard` | n/a | IAM brief |
| `save()` on audited entities | ✅ | the auth tables have no audit columns (brief) |
| ESM `.js` · contracts | ✅ | `AuthMeSchema` in contracts; OpenAPI regenerated, CI spec check green |
| Agent boundaries | ✅ | `ci.yml` unlocked by the brief |

## Test Quality
Good e2e coverage against real Postgres + Redis with a fake `LineClient`; the access-request cases (new / repeat / rejected / inactive) are exactly AC-5b. Gap: every token test is sequential, so the rotation race below is invisible to the suite.

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | **Must fix** | **High** | **Refresh rotation is not atomic → a logged-out session can be revived.** `TokenService.rotate()` does `GET refresh:<h>` then `DEL` as two commands. Two concurrent rotations of the same token both see the record, both succeed and mint two live refresh tokens; `family:<id>` points to only one. Logout revokes the pointed token + session, but the **other token stays valid and its next rotation re-creates `session:<sid>`**. Reproduced on Redis 7 with the compiled `TokenService` (script below): `concurrent rotate: ok ok` → logout → `orphan token after logout: ok | session revived: true`. The same race lets an attacker replaying a stolen token at the same moment as the owner fork the family instead of triggering reuse detection. Current → `get` + `del`. Updated → take the record atomically with **`GETDEL`** (as `consumeNonce` already does) so exactly one caller wins; the loser falls into the used/invalid path. Add a unit/e2e test: `Promise.all([rotate(t), rotate(t)])` → exactly one `ok`; after logout, no token of that family rotates and `sessionExists` stays false. |
| 2 | **Must fix** | Med | **`login_failed` redirects to the API host.** Current → `302 /login?error=login_failed` (relative → `api-host/login`, a 404 page). The brief's table wrote the path without `FRONTEND_URL` while `not_registered` had it — wording slip in the brief, the handoff flagged it correctly. Updated → `${FRONTEND_URL}/login?error=login_failed`, e2e asserts the full URL. Recorded as a brief clarification (Field 2026-10-17), not a deviation. |
| 3 | Suggestion | Med | **Login CSRF:** `state` is single-use in Redis but not bound to the browser that started the login, so a crafted callback URL can sign a victim into another registered account. Bind `state` to a short-lived HttpOnly cookie set on `/auth/line/login` and compare on callback. Not in the brief → do it with the mobile auth brief (DR-005) or as a small follow-up. |
| 4 | Suggestion | Low | `AccessRequestService.recordRequest` is find-then-save; two near-simultaneous first logins hit the UNIQUE constraint → 500 JSON on a browser navigation. Use `INSERT … ON CONFLICT (provider, external_id) DO UPDATE SET display_name, avatar_url` and map any callback DB error to the `login_failed` redirect. |
| 5 | Suggestion | Low | Sessions slide forever (each rotation resets the TTL — as the brief specifies). Consider an absolute lifetime (e.g. 30 days) when the IAM / mobile auth briefs land. |
| 6 | Note | — | After Finding 1, two browser tabs refreshing at the same instant: one wins, the other gets 401 (and may revoke the family if it sees the used marker). The frontend 401 interceptor (DR-007) must use a **single-flight refresh** — record for the frontend auth brief. |

### Reproduction (Finding 1)
`redis-server --port 6390`; built `dist/modules/auth/application/token.service.js`; `createSession` → `Promise.all([rotate(t), rotate(t)])` → `revokeByRefreshToken(<token the family key points to>)` → `rotate(<other token>)`. Output: `concurrent rotate: ok ok` / `session after logout: false` / `orphan token after logout: ok | session revived: true`.

## Recommendation to Field
CHANGES REQUIRED. The auth design is sound and matches D1–D4 (hashed opaque refresh tokens, family revocation, per-request session check, pre-decided deps only), and Rev 3's access-request behaviour is exactly right. One real security bug blocks the merge: non-atomic rotation lets a logged-out session come back. The fix is a one-command change (`GETDEL`) plus a concurrency test. Finding 2 is a one-line redirect fix. Re-audit = Compact (Findings 1–2, CI).

## Evidence Coverage
- Reviewed work SHA: `d300674` (head `3ef5f85`; `d300674..3ef5f85` = handoff + brief PR link — evidence-only ✅)
- Sources inspected independently: token service, JWT strategy + guard, auth service/controller, cookies, LINE HTTP client, access-request service, IAM entities/repository, migration vs `schema.sql`, config domains, auth module, e2e + unit test list, `package.json` deps vs pre-decided list, handoff, state.
- Tests run: built backend on Node 22; real Redis 7 reproduction of Finding 1 (both logout orders — revival happens when logout uses the family-pointed token). Suite/e2e: relied on handoff G1 + `ci` success on `3ef5f85`.
- Audit committed after S; pre-merge summary must verify S..head = evidence + the re-audited fix commits (§7).
- Repeated blocker: none.

## Sonar (local scan)
- See handoff (optional for this brief). No exclusions added.


## Re-audit — 2026-10-17 · `2dfe9421a6b2e8855af5536e5c98e7d18fef3e91`

| | |
|---|---|
| **Auditor** | Codex |
| **Assignment** | Field requested Codex review because Cowork usage is exhausted; also explicitly rejected oversized functions, unclear names, mixed responsibilities and omitted `public`. Brief still records Cowork; assignment source is this session, not an edited brief. |
| **PR / brief** | PR #35 · BRIEF-007 revision 3 |
| **Depth** | Compact: prior findings 1–2 plus Field's four maintainability concerns |
| **Recommendation** | **CHANGES REQUIRED** |

Paths and line numbers below refer to `/Users/khaijeaw/Documents/bar-BRIEF-007/`.

### Findings

| ID | Classification | Evidence · Current → Updated |
|---|---|---|
| C1 | **Must fix · High** | `app/backend/src/modules/auth/application/token.service.ts:44–56,61–76,118–123`. Rotation consumes the current record with `GETDEL` before publishing its used marker. Logout in this gap finds neither record and returns without revoking anything. Even if another caller directly revokes the family, `publishRotation` unconditionally recreates the refresh token, family pointer and session. Current → two atomic pieces separated by a revocation gap. Updated → rotation must preserve a revocation-safe transition and cannot publish into a revoked family; logout must still identify/revoke the family while rotation is pending. Keep token consumption, reuse detection and publication coherent under concurrency. This is an incomplete fix of prior Finding 1, violating AC-6/AC-7. |
| C2 | **Must fix · Medium** | `app/backend/src/modules/auth/application/auth.service.ts:51–100`. `handleLineCallback` is roughly 50 lines combining callback validation, nonce consumption, LINE exchange/verification, staff lookup, session issuance, access-request recording, logging and redirect construction. Current → implementation detail obscures orchestration. Updated → keep the public callback as a short sequence and extract meaningful private helpers, e.g. `verifyLineProfile`, `createStaffLoginSession`, `handleUnregisteredIdentity`. Preserve the distinction between inactive staff (no access request) and unknown staff. Function length alone is not the criterion; the mixed responsibilities are. Field's concerns 1 and 3. |
| C3 | **Must fix · Low** | `app/backend/src/modules/auth/application/token.service.ts:172`, `auth.service.ts:31–35,117,127,154`, `app/backend/src/modules/auth/infrastructure/http/auth-cookies.ts:3`. Names such as `ttl`, `me`, `line`, `tokens`, `staff`, `frontendBase`, `loginFailed`, `BASE` leave units, returned value or dependency role implicit. Updated examples: `refreshTtlSeconds` (or use the existing config getter directly), `getCurrentStaffUser`, `lineClient`, `tokenService`, `staffUserService`, `frontendBaseUrl`, `createLoginFailedRedirect`, `BASE_COOKIE_OPTIONS`. Keep the HTTP route `/auth/me` unchanged. `sha256`, OAuth `state`/`nonce`, and provider `sub` are already meaningful technical names; do not rename them merely for length. Field's concern 2. |
| C4 | **Must fix · Low** | Public class methods omit explicit `public`: `auth.service.ts:39,51,102,113,117`; `token.service.ts:31,40,61,79,103`; `app/backend/src/modules/auth/infrastructure/http/auth.controller.ts:40,57,80,98,113`; also `JwtStrategy.validate`, `LineClientHttp` methods and IAM service/repository methods. Updated → declare intended class API methods `public`, keep internal helpers `private`, and add the explicit `Promise<AuthMe>` return type to `AuthController.me`. TypeScript permits omitted `public`; this finding enforces Field's explicit review requirement, not a claimed existing compiler rule. Free functions do not take access modifiers. Field's concern 4. |
| C5 | **Must fix · Medium** | `token.service.ts:79–100,108–144`. Production code branches on whether `redis.client.eval` exists, maintaining a weaker multi-command path solely to accommodate the unit fake. Production uses an ioredis client with `eval`. Updated → one production implementation with the same atomic semantics in tests; use a faithful Redis adapter/test double or real Redis rather than selecting different security behavior at runtime. The new concurrency test waits for both rotations before logout, so it cannot catch C1's logout-during-rotation schedule. Add controlled tests that pause after consumption and revoke before publication. |

### Previous findings and acceptance coverage

- Prior Finding 1: **still unresolved** under logout-during-rotation (C1). `GETDEL` prevents two callers consuming the same record, but does not make the whole rotation/revocation protocol atomic.
- Prior Finding 2: source fix verified. `AuthService.loginFailed()` now constructs `${FRONTEND_URL}/login?error=login_failed`; e2e expectations use the full frontend URL.
- Prior suggestions 3–6 remain follow-ups; this compact review does not reclassify them or approve a new auth design.
- AC-6/AC-7 cannot pass with C1. Other ACs retain Cowork's historical assessment only; this report does not independently certify them or current CI.

### Evidence coverage

- Worktree branch ref read from filesystem: `feat/BRIEF-007-backend-auth`, SHA `2dfe9421a6b2e8855af5536e5c98e7d18fef3e91`. Source files reviewed directly; no Git mutations, PR writes or implementation edits.
- Read: revision-3 brief, original audit/handoff/state, token/auth services, auth controller/cookies, LINE client, JWT strategy, IAM services/repository, token tests and backend rules.
- Independently run: backend `lint` **exit 0**, backend `typecheck` **exit 0**.
- Controlled C1 reproduction: transpiled the current `token.service.ts` in memory, replaced DI imports only, stubbed JWT signing, and used a Map-backed Redis double whose `eval` applies the existing four-key SET / family deletion scripts synchronously. Paused `getdel` after removing the token, before returning to `rotate`; called logout with the original token; directly revoked the family; resumed rotation. Output: `session still active: true` after logout; `session active: false` after direct revocation; `pending rotation: ok; session revived: true`; `next rotation after logout: ok`. This establishes the problematic application interleaving; it is **not a real-Redis integration result**. No existing database/Redis data was modified.
- Live Redis unavailable on localhost:6379; connection attempt failed. Full token/e2e suites were not rerun.
- Cookie test attempt did not start: sandbox denied Vitest's temporary config write under the external worktree (`node_modules/.vite-temp`). No test pass claimed. No automatic approval-review rejection occurred.
- Current remote PR head, CI and S..H diff not independently verified. The source snapshot is local; the git hand must verify the shipped code matches it and current CI before the next audit/merge.
- Sonar: not rerun; handoff records it as optional/not run.

### Recommendation and delivery

Return PR #35 to Cursor for C1–C5, then re-audit the implementation and controlled concurrency tests. Preserve existing behavior and contracts during the readability refactor. No application code, state, rules or brief assignment was edited in this audit session.

This report was prepared in the writable primary checkout because the implementation worktree is outside this session's writable roots. The git hand should copy this complete report into `bar-BRIEF-007/docs/audits/BRIEF-007.md`, preserving the original audit above, verify only this report is included in the evidence commit, then ship it on the feature branch. No PASS or merge authority is granted.

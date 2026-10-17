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

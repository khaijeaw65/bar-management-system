# Audit — BRIEF-015 Backend auth repair: revocation-safe refresh rotation + Clean Code lint

| | |
|---|---|
| **Auditor** | Cowork (Claude, Cowork session 2026-10-17) |
| **Assignment** | Brief: Cowork (default) — Field, 2026-10-17 |
| **Date** | 2026-10-17 |
| **PR / commit** | #41 · `4d9422aa6ef66260e9b9251acca66d6b061fa628` (work) · head `a57a481` (docs only: handoff, state, brief PR link) |
| **Depth** | Full — auth |
| **Brief revision** | 1 |
| **Recommendation** | **CHANGES REQUIRED** — the security fix (C1/C5) is correct; three Low Clean Code findings remain ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `test/auth-token-concurrency.e2e-spec.ts` "logout during rotate…" (50 iterations, real Redis) | Safe by construction: both paths are single Lua scripts. See S1 on what the loop actually exercises. |
| AC-2 | ✅ | same file, "a revoked family publishes nothing…" | `ROTATE_REFRESH` checks `family-revoked:` and `session:` before any write. |
| AC-3 | ✅ | same file, "exactly one of two concurrent rotations…" | |
| AC-4 | ✅ | `token.service.ts` — `evalScript` is the only rotation/revocation path; no capability branch | |
| AC-5 | ✅ | `test/auth.e2e-spec.ts` diff | Diff is formatting + `public` on the fake only; no assertion changed or removed. |
| AC-6 | ✅ | `auth.service.ts` `handleLineCallback` | Step list, guard clauses, one `consumeNonce` with a WHY comment. Inactive vs unknown preserved. |
| AC-7 | ✅ | `auth.service.ts`, `auth.controller.ts`, `token.service.ts` | The items the brief lists are done. Remaining rule gaps → Findings 1–3. |
| AC-8 | ✅ | `oxlint.json` (4 rules + overrides) · no `oxlint-disable` in `app/backend` | `max-params` off as decided (option A). |
| AC-9 | ✅ | handoff gate table · GitHub check `ci` = success on head `a57a481` | `openapi:export` no diff per handoff. |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | Backend-wide edits are lint fixes the brief asked for; behaviour unchanged in the files inspected (filter, interceptor, access-request, auth). |
| No unapproved deviations / deps | ✅ | No new deps. New key `family-revoked:<id>` is internal to `token.service.ts` (handoff discloses it). |
| `PermissionsGuard` only, no inline checks | ✅ | n/a |
| `save()` not `update()` on audited entities | ✅ | `AccessRequestService` still uses `save()`. |
| ESM `.js` imports · contracts as source of truth | ✅ | No contracts change. |
| Agent boundaries respected | ✅ | |
| `backend.md` → Clean Code (review part) | ❌ | Findings 1–3. |

## Test Quality
- Concurrency tests run on real Redis and assert the end state (no session, no family pointer, no live `refresh:` key for the family) — the right things.
- AC-5 safety net held: existing e2e assertions untouched.
- `token.service.spec.ts` now uses real Redis inside the unit suite (S4).

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | **Must fix** | Low | **Inline object types still in signatures** (Clean Code → Types & class API). `auth/domain/line-client.ts:8,9,15` · `auth/infrastructure/line/line-client.http.ts:25,34,80` · `auth/infrastructure/http/jwt.strategy.ts:25` · `auth/infrastructure/http/auth.controller.ts:45,66,86,104` · `common/interceptors/transform-response.interceptor.ts:31` (same shape written twice) · `health/health.controller.ts:33`. Current → `input: { state; nonce }`, `Promise<{ idToken }>`, `payload: { sub?; sid? }`, `Promise<{ url; statusCode }>`, `Promise<{ ok: true }>`. Updated → module-local named types, e.g. `LineAuthorizeInput`, `LineTokenExchange`, `AccessTokenPayload`, `RedirectTarget`, `AuthOkResponse = z.infer<typeof AuthOkSchema>`, `HttpResponseState`, `HealthStatus`. No contract or OpenAPI change. |
| 2 | **Must fix** | Low | **Names not by role / missing units** (Clean Code → Naming). `token.service.ts`: `redis`, `jwt` → `redisService`, `jwtService`; local `ttl` in `storeRefresh` → `refreshTtlSeconds`; `revokedTtl()` → `revokedTtlSeconds()`; `rotationOutcome()` → `parseRotationOutcome()`. `auth.service.ts`: `redis`, `accessRequests`, `appConfig` → `redisService`, `accessRequestService`, `appConfigService`; `nonceFrom()` → `parseNonce()`. `auth.controller.ts`: `auth` → `authService`. `line-client.http.ts`: `config` → `lineConfigService`. `access-request.service.ts`: `requests` → `accessRequestRepository`. |
| 3 | **Must fix** | Low | **Methods with 4 parameters** (Clean Code → ≤ 3, review). `AccessRequestService.recordRequest` and the new private `insertRequest` take `(provider, externalId, displayName, avatarUrl)`. Updated → one named input `AccessRequestInput` passed through both; update the caller in `auth.service.ts`. `SnakeNamingStrategy.joinTableColumnName` is imposed by TypeORM's interface → exempt (handoff noted it). **Field decision needed:** `AuthController.lineCallback` has 4 Nest-decorated parameters (`@Query` ×3, `@Res`); see Recommendation. |
| S1 | Suggestion | — | AC-1 loop runs on one ioredis connection, which sends commands in call order, so all 50 iterations test rotate-then-revoke. Revoke-then-rotate is covered by the `afterLogout` step in test 2. The guarantee comes from Lua atomicity, not the loop. Updated (optional) → two explicitly named cases (rotate→revoke, revoke→rotate) so the test says what it proves. |
| S2 | Suggestion | — | Reuse detection is two EVALs (`ROTATE_REFRESH` returns `reused`, then `REVOKE_FAMILY`). A rotation of the live token in between can succeed, but revoke then deletes it via `family:` and the session check rejects its access token → safe. Folding revoke into the rotate script would remove the gap entirely; not required. |
| S3 | Suggestion | — | Lua scripts build key names inside the script with `numkeys = 0`. Works on standalone Redis / ElastiCache non-cluster (current plan); breaks under cluster mode. Updated → add a `ponytail:` comment naming the ceiling (cluster → pass keys via `KEYS` with a `{familyId}` hash tag). |
| S4 | Suggestion | — | `token.service.spec.ts` now needs a running Redis for `pnpm test`. Consistent with C5; consider moving it under `test/` (e2e) so the unit suite stays infra-free. |

## Recommendation to Field
The important part is right: rotation and revocation are each one atomic Redis script, a revoked family can't be republished, the weaker fallback path is gone, existing auth behaviour is untouched (e2e assertions unchanged, OpenAPI no diff, CI green). What remains is mechanical Clean Code clean-up (Findings 1–3) — renames, named types, one input object — no behaviour change, small diff, then a Compact re-audit.
**Decision for Finding 3:** Nest-decorated handler parameters (`@Query`, `@Body`, `@Req`, `@Res`) are supplied by the framework, like constructor injection. Recommended: exempt them too, by amending the parameter bullet in `backend.md` → "Constructor injection and Nest-decorated handler parameters are exempt". Alternative: wrap the three query values in one `@Query() query: LineCallbackQuery` (works, but adds a Zod schema/type for three optional strings).

## Evidence Coverage
- Reviewed work SHA: `4d9422a`; head `a57a481` changes only `docs/handoffs/BRIEF-015.md`, `docs/state/kj/SESSION_STATE.md`, brief PR field.
- Sources/diff inspected independently: full `token.service.ts` (both Lua scripts traced for rotate→revoke and revoke→rotate orderings), `auth.service.ts`, `auth.controller.ts`, `jwt.strategy.ts`, `line-client.http.ts`, `domain/line-client.ts`, `oxlint.json`, `test/auth-token-concurrency.e2e-spec.ts`, diffs of `test/auth.e2e-spec.ts`, `test/envelope.e2e-spec.ts`, `token.service.spec.ts`, `http-exception.filter.ts`, `transform-response.interceptor.ts`, `access-request.service.ts`; repo-wide grep for `oxlint-disable` / `eslint-disable` (none) and inline object types in signatures.
- Tests run or independently inspected: **not re-run by Cowork** (the audit shell can't load oxlint's native binary and has no Redis). Relied on the handoff gate table (run on the work tree of `4d9422a`) and GitHub check run `ci` = success on `a57a481`.
- Audit is committed after S; pre-merge summary must verify S..head contains evidence-only changes (§7).
- Repeated blocker: none.

## Sonar (local scan)
- Handoff Sonar section present: yes — not run (optional in this brief).
- Remaining issues have reasons; no unapproved exclusions: n/a.
- Learning mode: n/a (Field brief).

## Re-audit — 2026-10-17 · `8d426b806cba410457dba728126b1fd3e8572077`

- **Depth:** Compact (Findings 1–3 only). Head `516527b` changes only `docs/handoffs/BRIEF-015.md` and `docs/state/kj/SESSION_STATE.md` (evidence-only).
- **Result: PASS, conditional on one Field decision** — see Finding 3.

| # | Status | Evidence |
|---|---|---|
| 1 | ✅ Resolved | Named types: `LineAuthorizeInput`, `LineTokenExchange`, `LineAuthorizeUrlInput` (`domain/line-client.ts`), `AccessTokenPayload` (`jwt.strategy.ts`), `RedirectTarget`, `AuthOkResponse = z.infer<typeof AuthOkSchema>` (`auth.controller.ts`), `HttpResponseState` (interceptor, duplicate removed), `HealthStatus`. Fake LINE client in e2e uses the same types. |
| 2 | ✅ Resolved | `redisService`, `jwtService`, `accessRequestService`, `appConfigService`, `authService`, `lineConfigService`, `accessRequestRepository`; `refreshTtlSeconds`, `revokedTtlSeconds()`, `parseRotationOutcome()`, `parseNonce()`. |
| 3 | ✅ Resolved (access request) · ⏳ Field decision (`lineCallback`) | `recordRequest` / `insertRequest` take `AccessRequestInput`; caller in `auth.service.ts` passes one object with the same four values. `AuthController.lineCallback` keeps four Nest-decorated parameters pending Field's decision on the exemption. |

- **Behaviour check:** the diff is renames, type aliases and one input object only. No Lua script, key name, redirect, cookie or HTTP path changed. `auth.e2e-spec.ts` changes are type imports on the fake client; no assertion changed.
- **Evidence:** handoff re-ran lint / typecheck / test (31) / test:e2e (22) / build / OpenAPI diff on `8d426b8`, all 0. GitHub check run `ci` = success on head `516527b`. Not re-run by Cowork (same limitation as above).
- **Suggestions S1–S4:** not implemented; optional, carry as follow-ups if Field wants them.

**Recommendation to Field:** if you approve exempting Nest-decorated handler parameters (one phrase in `backend.md`), this is a clean PASS and PR #41 meets the §7 merge condition (audit PASS + `ci` green on the audited head; S..head evidence-only). If you don't, the one remaining change is a `LineCallbackQuery` object for `lineCallback`, then a one-line re-check.

### Field decisions after the re-audit — 2026-10-17
- **Handler parameters:** Field approved exempting Nest-decorated handler parameters (and constructor injection) from the ≤ 3 rule. `backend.md` updated (Approved-by: Field). → `AuthController.lineCallback` **resolved**, no code change.
- **Where types live:** Field approved a new `backend.md` rule — classes contain behaviour only; types go in a types file in the layer that owns them. The current code predates the rule, so it becomes one new finding for this PR (auth is the reference module the next briefs copy).

### Finding 4 — Must fix · Low: move types out of classes (new rule)
Moves only — no rename, no shape change, no behaviour change. Update imports (`.js` extensions).

| From | Types | To |
|---|---|---|
| `modules/auth/application/auth.service.ts` | `LoginResult`, `RefreshResult`, `LineLoginCallbackInput` | `modules/auth/application/auth.types.ts` |
| `modules/auth/application/token.service.ts` | `RefreshRecord`, `IssuedSession`, `RotateResult`, `RotationOutcome` | `modules/auth/application/token.types.ts` |
| `modules/auth/domain/line-client.ts` | `LineProfile`, `LineAuthorizeInput`, `LineTokenExchange`, `LineAuthorizeUrlInput` | `modules/auth/domain/line-client.types.ts` (the `LineClient` port interface, `LINE_CLIENT` token and `buildLineAuthorizeUrl` stay) |
| `modules/auth/infrastructure/http/auth.controller.ts` | `AuthOkSchema`, `AuthOkResponse`, `RedirectTarget` | `modules/auth/infrastructure/http/dto/auth.dto.ts` |
| `modules/auth/infrastructure/http/jwt.strategy.ts` | `AccessTokenPayload` | `modules/auth/infrastructure/http/dto/auth.dto.ts` |
| `modules/iam/application/access-request.service.ts` | `AccessRequestInput` | `modules/iam/application/access-request.types.ts` |
| `modules/iam/domain/staff-user.repository.ts` | `StaffUserView` | `modules/iam/domain/staff-user.types.ts` (the `StaffUserRepository` port interface stays) |
| `modules/health/health.controller.ts` | `HealthStatus` | `modules/health/health.types.ts` |
| `common/interceptors/transform-response.interceptor.ts` | `HttpResponseState` | `common/interceptors/transform-response.types.ts` |
| `common/filters/http-exception.filter.ts` | `ErrorEnvelope` | `common/filters/http-exception.types.ts` |
| `common/decorators/current-user.decorator.ts` | `CurrentUserPayload` | `common/decorators/current-user.types.ts` |
| `modules/auth/infrastructure/http/auth-cookies.ts` | `SessionCookies` | `modules/auth/infrastructure/http/dto/auth.dto.ts` |
| `providers/database/database-options.ts` | `DatabaseConnectionInput`, `DatabaseConnectionOptions` | `providers/database/database-options.types.ts` |

Gates: lint / typecheck / test / test:e2e / build / OpenAPI diff (must stay empty). Then a one-line re-check.

Check (auditor and executor): `git grep -n -E "^(export )?(type|interface) [A-Z]" -- 'app/backend/src/**/*.ts' ':!*.types.ts' ':!**/dto/**' ':!*.spec.ts'` → only port interfaces (`LineClient`, `StaffUserRepository`) remain.

- Field widened the rule the same day (Approved-by: Field) from "classes" to all source files, so the last four rows (filter, decorator, cookie helpers, database options) are in scope.

**Status after Field decisions: CHANGES REQUIRED — Finding 4 only.** Findings 1–3 resolved.

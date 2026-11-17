# Audit — BRIEF-022 Staff app: real LINE login, secure session, API client

| | |
|---|---|
| **Auditor** | Cowork (Metee's machine) — audit session 2026-11-09; did not implement, seed, fix or pair on BRIEF-022 |
| **Assignment** | Field, 2026-11-09 (brief: Cowork default) |
| **Date** | 2026-11-09 |
| **Branch / commit** | `feat/BRIEF-022-mobile-line-login` · `6de85a6` (S — pushed; `origin` head = `6de85a6`) |
| **Depth** | Full (auth) |
| **Brief revision** | 2 |
| **Recommendation** | CHANGES REQUIRED  ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `lib/auth/pkce.ts`, `pkce.test.ts` | 43-char base64url verifier; RFC 7636 App. B vector asserted (`expo-crypto` mocked with real `node:crypto` SHA-256) |
| AC-2 | ⚠️ | `session.ts:143-212`, `login.test.tsx` "AC-2" | Tokens saved + lands on orders asserted. **Not asserted:** `exchangeCode` called with `code` + the verifier (#3) |
| AC-3 | ⚠️ | `login.test.tsx` "AC-3" | `cancel` tested; `dismiss` not (#3) |
| AC-4 | ⚠️ | `LoginView.tsx`, `login.test.tsx` "AC-4" ×2 | login·4 + `login_failed` → login·3 asserted with exact copy. "token call fails" → login·3 claimed in the test title but not exercised (#3) |
| AC-5 | ✅ | `client.ts:51-112`, `client.test.ts` "shares single refresh…" | 3 parallel 401 → `refreshCallCount === 1`, new tokens saved, all 3 retried and succeed |
| AC-6 | ⚠️ | `client.test.ts` "clears tokens…", `layout-auth-gate.test.tsx` "AC-6" | Refresh 401 → tokens cleared + login·5 ✅. But **any** refresh failure (offline, 5xx) also clears tokens (#2) |
| AC-7 | ⚠️ | `AuthGate.tsx`, `session.ts:96-141`, `layout-auth-gate.test.tsx` | Saved tokens → loading → orders, none → login ✅. A network error during `getMe()` at start wipes tokens (#2) |
| AC-8 | ✅ | `more.tsx`, `session.ts:214-227`, `tabs-more.test.tsx` | Confirm → `logout(refreshToken)` → cleared → `/login`; also when logout rejects |
| AC-9 | ❌ | handoff Run Proof | Emulator run used **mocks** (staff name "บีม" = mock fixture). No `EXPO_PUBLIC_USE_MOCKS=0`, no real LINE login, no kill/reopen, no deactivate → login·5, no screen recording (#1) |
| AC-10 | ✅ | auditor `git grep` on S | `AsyncStorage` / `console.*` in `app/mobile/src` → 0; tokens written only in `token-storage.ts` |
| AC-11 | ✅ | handoff gates; mock path kept in `session.ts` | lint 0 · typecheck 0 (auditor re-ran `tsc` → 0) · test 0 (12 suites / 42) · export:check 0 |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | `c4bb0d5..S` (excluding the `main` merge `1131c80`): `app/mobile/**`, `pnpm-lock.yaml`, methee state. Brief file identical to seed `c4bb0d5` |
| Seeded `.e2e-spec.ts` untouched | ✅ n/a | Brief seeds none |
| Living docs synced | n/a | No contract change |
| No unapproved deviations / dependencies | ❌ | `axios` declared `^1.7.9`; Pre-decided `^1.20.0` (#4). Expo packages match (`~57.0.3` / `~57.0.4` / `~57.0.4`) |
| Locked architecture rules | ✅ | Bearer + SecureStore only (DR-005); `client.ts` is the only axios import |
| Scoped rule file & `core.md` anti-patterns | ⚠️ | No `any` / `as unknown as` / `@ts-ignore` / hex. Silent fallbacks: base URL `localhost:3000` (#5), error status/code (S1), staff name (S3) |
| Agent boundaries | ✅ | No protected file touched |
| Run proof from S (UI exercised on screen) | ⚠️ | Emulator build + flow on mocks ✅; AC-9 real-backend proof missing (#1) |

## Test Quality
Tests assert observable outcomes (tokens in the SecureStore mock, rendered copy, router target, refresh count) rather than internal calls — good. AC-5 test is strong (one refresh for three parallel 401s, all three retried). Gaps: AC-2 does not check the code/verifier reaching `/auth/mobile/token`; AC-3 `dismiss` and AC-4 "token call fails" are untested; no test for refresh failing with a network error or 5xx, nor for a retried request that fails for a non-auth reason (both hide behaviour in #2).

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Must fix | High | handoff Run Proof + AC table "AC-9 ✅" · Current: emulator run on mocks; AC-9 marked met. → Updated: run AC-9 exactly as brief §4 — Android dev build, `EXPO_PUBLIC_USE_MOCKS=0`, own backend over the tunnel, real LINE login → อื่นๆ shows the real LINE display name → kill + reopen (still signed in) → owner deactivates this staff at `/pos/settings/staff` → next action shows login·5 → owner re-activates. Attach the **screen recording** to the handoff. If `openAuthSessionAsync` does not return to the app on Android → stop and tell Field (brief §7 Likely DR), no workaround |
| 2 | Must fix | High | `lib/api/client.ts:92-111`, `lib/auth/session.ts:129-135` · Current: (a) the refresh `catch` clears tokens and signs out on **any** error (offline, timeout, 5xx), not only a 401 from refresh; (b) the `try/catch` around the retried request turns every retry failure (e.g. 409, 500) into `ApiError(401, 'UNAUTHORIZED', 'Session expired…')`; (c) `initSession()` clears tokens on any `getMe()` failure, so opening the app offline logs the user out. Brief: "refresh fails → clearTokens" is AC-6's 401 case; a 30-day session must survive a dead network. → Updated: clear tokens + `notifyAuthExpired()` only when refresh returns 401 (or the server's auth error code); other refresh failures reject with the real `ApiError` and keep tokens. Retry once and pass the retry's own error through. In `initSession()`, clear tokens only on an auth failure; on network error keep tokens and surface an error/retry (or route to tabs and let the next call retry) — no silent logout. Add tests for refresh offline/5xx and a retried request returning 409 |
| 3 | Must fix | Med | `__tests__/app/login.test.tsx` · Current: AC-2 test mocks `exchangeCode` but never asserts its arguments; AC-3 tests `cancel` only; AC-4 title claims "token exchange failure" but only `error=login_failed` is exercised. → Updated: assert `exchangeCode` received `'mock-auth-code'` and a verifier whose S256 matches the `code_challenge` in the URL passed to `openAuthSessionAsync`; add a `dismiss` case; add a case where `exchangeCode` rejects → login·3 copy + "ลองอีกครั้ง" |
| 4 | Must fix | Low | `app/mobile/package.json:9` `"axios": "^1.7.9"` · Pre-decided item is `axios ^1.20.0` (lockfile already resolves `1.20.0`). → Updated: `"axios": "^1.20.0"`, refresh lockfile |
| 5 | Must fix | Med | `lib/api/client.ts:32`, `lib/auth/session.ts:167` `EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'` · Current: silent default (core.md #2); also the wrong port (backend runs on 3011, and a phone cannot reach the dev machine's localhost). A missing env var would send real LINE logins to a dead URL. → Updated: read `EXPO_PUBLIC_API_URL` once in `client.ts`; when mocks are off and it is missing, throw a clear configuration error at start. `session.ts` builds the login URL from that single value |
| 6 | Must fix | Low | `docs/handoffs/BRIEF-022.md` (uncommitted) · Current: AC table marks AC-9 ✅ and AC-2/3/4/6/7 ✅ beyond what the tests assert; "Learning Mode AI Disclosures" describes a split retired by DR-030. → Updated: AC table matches evidence after #1–#3; AI-usage section states what the agent did under DR-030; commit the handoff as the Implemented commit (`docs(BRIEF-022): handoff`) per workflow §3 |
| S1 | Suggestion | Low | `client.ts:114-118` · error interceptor reads `error.response?.data` untyped and invents `status ?? 500` / `code ?? 'API_ERROR'` → narrow with `axios.isAxiosError`, parse the error envelope with a schema, and map "no response" to a distinct network error code instead of 500 |
| S2 | Suggestion | Low | `client.ts:51-57`, `lib/api/auth.ts` · the response interceptor returns `payload.data` while axios still types the result as `AxiosResponse`; wrappers parse it anyway → a small typed `request<T>(schema, config)` helper in `client.ts` keeps types honest and validates the envelope in one place (mobile.md API Client) |
| S3 | Suggestion | Low | `(tabs)/more.tsx:40` `session?.staffName ?? 'พนักงาน'` · silent fallback; the tabs only render with a session → read the session as required or render nothing until it exists |
| S4 | Suggestion | Low | `LoginView.tsx:87-92` · branches on `err.name` string as well as `instanceof` → with `Object.setPrototypeOf` already in the error classes, `instanceof` alone is enough |
| S5 | Suggestion | Low | `more.tsx:22-31` · native `Alert.alert` confirm → HeroUI Native `Dialog` (mobile.md "HeroUI first"), if CD-08 allows |
| S6 | Suggestion | Low | `LoginView.tsx:85` + `AuthGate.tsx:26` · both call `router.replace('/(tabs)/orders')` after sign-in (carried from BRIEF-010 S5) → keep the AuthGate redirect only |

## Recommendation to Field
The core of the brief is in place and well built: PKCE matches RFC 7636, tokens live only in SecureStore, one axios client with a shared refresh promise (AC-5 proven by test), exact CD-08 copy for login 1–5, logout that clears locally even when the network fails, and the mock path still runs the whole app. It is not PASS because AC-9 — the real-device, real-backend check the brief exists for — was run on mocks, and the client logs a staff member out on any network hiccup (refresh offline, app start offline), which a 30-day session must not do. Plus three AC tests that claim more than they assert, an `axios` range different from the Pre-decided item, and a silent `localhost:3000` fallback. All fixes are in scope; #1 may surface the brief's known Android `openAuthSessionAsync` risk, which goes to Field rather than a workaround.

**Next → in Antigravity (Metee):** `fix BRIEF-022 (#1, #2, #3, #4, #5, #6)`

## Evidence Coverage
- Reviewed work SHA: `6de85a6` (seed SHA: `c4bb0d5`; `main` merged at `1131c80` before work)
- Independent CI (Grade A): n/a — no PR yet
- Local Gates (Grade B): handoff receipt (lint / typecheck / test / export:check exit 0; Sonar QG OK, 0 issues in `app/mobile`); auditor re-ran `tsc --noEmit` on S → 0 and the AC-10 / anti-pattern greps → 0
- Run Proof (Grade B): emulator dev build on mocks, 6 screenshots in `docs/handoffs/assets/BRIEF-022/` (uncommitted); AC-9 real-backend proof missing (#1)
- Auditor Environment: read-only git on Metee's machine (checkout on the branch at S, clean apart from handoff/state/assets); jest not re-run (VM cannot resolve the macOS pnpm install)
- Written uncommitted; the executor commits it unchanged at PASS (`H`). Pre-merge check verifies `S..H` contains evidence-only changes (workflow Section 7).

## Re-audit — 2026-11-10 · `0583e37`

| | |
|---|---|
| **Auditor** | Cowork (Metee's machine) — same audit session; did not implement, fix or pair |
| **Assignment** | Field, 2026-11-09 |
| **Brief revision** | 2 |
| **Reviewed** | `6de85a6..0583e37` (6 fix commits + handoff commit); `origin` head = `0583e37` |
| **Recommendation** | BLOCKED — all code findings closed; AC-9 (#1) needs Field's decision  ← Field makes the final call |

### Findings status
| # | Status | Evidence |
|---|---|---|
| 1 | ⏸ Open — Field decision | Handoff marks AC-9 "deferred — รอ Field". Real-device LINE login + deactivation + recording not run. Field either requires it now or defers it in writing (e.g. into BRIEF-059, which runs against the real API) |
| 2 | ✅ Fixed | `client.ts`: refresh clears tokens + `notifyAuthExpired()` only on 401 (`isAxiosError` → `status === 401`); 5xx / network → `ApiError(status, code)` with tokens kept; retried request's own error passes through (no blanket 401). `session.ts` `initSession()`: clears only on `ApiError` 401. Tests: `client.test.ts` "keeps tokens … 5xx or offline" (503), "passes retried request error (409)"; `layout-auth-gate.test.tsx` "does not wipe tokens on network error" |
| 3 | ✅ Fixed | `login.test.tsx`: AC-2 asserts code `mock-auth-code`, 43-char verifier, and `code_challenge` in the browser URL = S256(verifier); AC-3 `dismiss` case; AC-4 `exchangeCode` reject → login·3 + "ลองอีกครั้ง" |
| 4 | ✅ Fixed | `package.json:9` `"axios": "^1.20.0"`; lockfile updated |
| 5 | ✅ Fixed | `client.ts` `getApiBaseUrl()` throws when mocks are off and `EXPO_PUBLIC_API_URL` is missing; `session.ts` uses it; no `localhost:3000` left (`git grep` → 0). Test asserts the throw |
| 6 | ✅ Fixed | Handoff committed (`0583e37`), AC table matches evidence (AC-9 ⚠️ deferred), learning-mode section removed. Work Commit field says `a576248` (last code commit) — fine, `S` = `0583e37` |
| S1 | ✅ Done | `isAxiosError` narrowing; network error → `status 0` / `NETWORK_ERROR` instead of 500 |
| S2–S6 | Open (Suggestion) | Unchanged, non-blocking |

### New suggestions
| # | Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| S7 | Suggestion | Low | `session.ts` `initSession()` offline branch builds `{ staffName: 'พนักงาน' }` · a placeholder name shown in อื่นๆ while offline → keep tokens but mark the session "name unknown" and refetch `getMe()` on the next successful call (or show a retry state) |
| S8 | Suggestion | Low | `client.test.ts` #2 test uses 503 only → add a no-response case (network down) asserting tokens kept and `NETWORK_ERROR` |

### Gates & checks
- Handoff (Grade B): lint 0 · typecheck 0 · test 0 (12 suites / 48 tests) · export:check 0 · Sonar QG OK, 0 issues in `app/mobile`
- Auditor `git grep` on S: no `any` / `as unknown as` / `@ts-ignore` / `console.*` / `localhost:3000` in `app/mobile/src`
- Scope: delta = `app/mobile/**`, lockfile, handoff + assets, methee state

### Result
**BLOCKED** — no code Must fix remains. Only #1 (AC-9 real-device proof) is open and needs Field: require it now, or defer it in writing.

**Next → Field:** decide AC-9. If deferred → `Next → in Antigravity: ship BRIEF-022`. If required → `Next → in Antigravity: fix BRIEF-022 (#1)`.

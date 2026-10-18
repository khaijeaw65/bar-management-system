# Audit — BRIEF-021 Backend: mobile LINE login (DR-005) + dev tunnel

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session_016NP8qXEsP9at6CRQYiHypa |
| **Assignment** | Brief default (Cowork); `audit BRIEF-021` from Field 2026-10-18 |
| **Date** | 2026-10-18 |
| **Branch / commit** | `feat/BRIEF-021-mobile-auth-backend` · `08e2a8edbb6e207a27d686f6c01f7bb874da4273` (work) · handoff `e414547` |
| **Depth** | Full (auth) |
| **Brief revision** | 1 |
| **Recommendation** | **BLOCKED** — AC-12 evidence missing + one Field decision (D1). Code: 0 Must fix. ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `auth-mobile.e2e` L185 — LINE origin, state record, TTL 590–600 s; 400 without challenge. `mobile-login.ts` regex `^[A-Za-z0-9_-]{43}$` + `S256` literal | `client` ≠ `mobile` → web path unchanged |
| AC-2 | ✅ | L231 — `barapp:` / `auth`, no `access_token` / `refresh_token` cookie, `session:*` and `refresh:*` empty, `mauth:` TTL 50–60 s, record `{ userId, codeChallenge }` | Session created only at exchange (§6) ✓ |
| AC-3 | ⚠️ | L254 — LINE error → `barapp…login_failed`; replay → `barapp…login_failed`; unregistered / inactive → `barapp…not_registered` + one pending access request | **Unknown/expired mobile state → web `/login?error=login_failed`** (L268). The client can't be known once the state is gone — brief wording gap → D1 |
| AC-4 | ✅ | L294 — 200 pair, `GET /auth/me` Bearer → user, `mauth:` deleted | `expiresIn` = `accessTtlSeconds` (controller) |
| AC-5 | ✅ | L329 — wrong verifier → 401 + code consumed; correct verifier afterwards → 401; expired (PX 30) → 401; no `session:*` each time. `pkce.spec.ts` RFC 7636 App. B vector | `timingSafeEqual` after length check ✓ |
| AC-6 | ✅ | L366 — refresh + family + session TTL ≈ 30 d after issue **and** after rotation; old token reuse → 401, newest access → 401, newest refresh → 401 | TTL carried on the record (`refreshTtlSeconds`), Lua copies it to the used marker too |
| AC-7 | ✅ | `token.service.spec.ts` web case; `test/auth.e2e-spec.ts` unchanged in diff (handoff: 8 passed) | Web record stays `{ userId, familyId }` |
| AC-8 | ✅ | L401 — body logout, no cookie → 200, Bearer → 401 | Cookie wins when both present ✓ |
| AC-9 | ✅ | L185 / L231 send `redirect` + `redirect_uri` (`evil.example`); location never contains it. Target is the constant `MOBILE_APP_REDIRECT` | |
| AC-10 | ✅ | L426 — captured logs contain no code, verifier, challenge or tokens | Existing `sub=` log lines unchanged |
| AC-11 | ✅ | `docs/api/openapi.json` diff has `mobile/token`, `mobile/refresh`, login query params, logout body; handoff `openapi:check` exit 0 | |
| AC-12 | ❌ not run | Handoff: "Field's phone evidence … No screenshot yet" | **Blocks PASS** (required manual evidence) |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | 20 app/doc files, all §2. No mobile, frontend, infra, compose or package change |
| No unapproved deviations / deps | ⚠️ | No new package ✓. Extra Redis key `oauth-mobile:<state>` (600 s) is not in §7 Pre-decided → D1. Handoff says "Deviations: None" — should list it |
| `PermissionsGuard` only | ✅ | n/a — all new routes `@Public()` per §3 |
| `save()` not `update()` | ✅ | n/a — Redis only |
| ESM `.js` imports · contracts as source of truth | ✅ | Auditor `tsc --noEmit` exit 0 on `e414547` (node 22, device). Request/response schemas imported from `@bar/contracts` |
| Class-file rule (BRIEF-019) | ✅ | Auditor `node scripts/check-class-files.mjs` exit 0. `pkce.ts`, `mobile-login.ts` are function-only files |
| Web flow untouched | ✅ | Web branch = old logic moved to `finishWebLogin`; cookie helpers, `/auth/refresh` unchanged |
| Agent boundaries | ✅ | No `docs/rules/**`, root config, `.github`, `infra/` changes |
| Implementer split (brief: Field 20–30 %) | ⚠️ | Handoff AI usage **High**, split not taken (Field issued `execute`). Disclosed honestly → S2 |

## Test Quality
Strong. The e2e tests assert Redis state (keys, TTLs, record shape) and the absence of cookies and sessions, not only HTTP codes. The single-use-on-failure case (wrong verifier, then the right one → 401) is exactly the attack it guards against. The expired-code case uses a real TTL instead of mocking the clock. Gaps: no test sends a **web** refresh token to `/auth/mobile/refresh` (see S1). No test covers an expired (never-used) mobile state (see D1).

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| D1 | **Field decision** | Med | `auth.service.ts` `rememberMobileClient` / `replayedMobileState`. **Current:** after the first callback, a `oauth-mobile:<state>` marker remembers "mobile", so a *replayed* state goes to `barapp://auth?error=login_failed`. An *expired* never-used state (user leaves the LINE page open > 10 min) has no record and no marker → web `/login?error=login_failed` inside the app's auth browser, so the app never gets an answer. The key is beyond §7. **Options:** **A** keep the marker as is → Rev 2 records the key and rewrites AC-3 "unknown" → web URL. **B (recommended)** encode the client in the state itself (e.g. `m.` + 32 random bytes) → replayed **and** expired mobile states both return to the app; no extra Redis write. Safe because the prefix only selects which constant error target to use — success still needs the Redis record. Small fix commit + compact re-audit; Rev 2 records it either way |
| S1 | Suggestion | Low | `refreshMobile` rotates any family. **Current:** a web refresh token posted to `/auth/mobile/refresh` rotates the web family and returns the pair in a body. That needs the HttpOnly token already, so it's low risk, but it mixes the two channels. **Updated:** accept only records with `refreshTtlSeconds` (mobile families), otherwise 401 + test. Can wait for the pilot hardening list together with rate limiting |
| S2 | Suggestion | Low | Brief Implementer line: Field codes 20–30 % (security core). **Current:** agent wrote all of it. **Updated:** either Field reads `pkce.ts` + `exchangeMobileCode` + the AC-5 test before merge (the 20–30 % becomes review depth), or Rev 2 drops the split. Field's call, no code change |
| S3 | Suggestion | Low | Handoff "Deviations: None" → list the `oauth-mobile:` key (or its D1 replacement) |

## Recommendation to Field
The implementation is correct and well tested. The web flow is preserved, PKCE is done right, codes are single use even on failure, the mobile TTL slides through rotation, and nothing sensitive is logged. Two things block PASS. (1) **AC-12:** one real Android LINE login over the tunnel ending at `barapp://auth?code=…`, recorded in the handoff. (2) **D1:** pick A or B. I recommend B: it fixes the expired-state case the app will actually hit, and it costs one small commit. After D1 and AC-12, expect a compact re-audit to PASS. S1–S3 are optional.

## Evidence Coverage
- Reviewed work SHA: `08e2a8e` (head `e414547` = handoff + state only; `git diff 08e2a8e e414547 --stat` → docs only)
- Sources/diff inspected independently: `auth.service.ts`, `auth.types.ts`, `mobile-login.ts`, `pkce.ts`, `token.service.ts`, `token.scripts.ts` (both Lua scripts), `token.types.ts`, `auth.controller.ts`, `dto/auth.dto.ts`, jwt config (+ spec), contracts `schemas/auth.ts`, `.env.example`, `README.md`, `test/auth-mobile.e2e-spec.ts` (all cases); AC-1–AC-12
- Tests run or independently inspected: auditor ran `tsc --noEmit` (exit 0) and `check-class-files.mjs` (exit 0) on `e414547`. **Not run by the auditor:** vitest unit / e2e, oxlint, `openapi:check` (device shell has no pnpm, native binaries are macOS builds, and Postgres/Redis aren't reachable) → relied on handoff G1 (unit 66, e2e 61, all exit 0) + test source inspection. CI on H will confirm
- Written uncommitted; the executor commits it unchanged at PASS (H). Pre-merge summary must verify S..H contains evidence-only changes (§7)
- Repeated blocker: none

## Sonar (local scan)
- Handoff Sonar section present: yes — "not available yet" (BRIEF-006 not merged)
- Remaining issues have reasons; no unapproved exclusions: n/a
- Learning mode: n/a (Field's brief)

---

## Re-audit — 2026-10-18 · `7bcad32a7b30abfcaadc4b39776dcba567afcf0a`

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session_016NP8qXEsP9at6CRQYiHypa |
| **Brief revision** | 2 (`d95c146`, committed exactly as Cowork wrote it — no working-tree diff against the brief) |
| **Scope** | `08e2a8e..7bcad32`: Rev 2 brief commit + D1 fix commit. 2 app files (`auth.service.ts`, `test/auth-mobile.e2e-spec.ts`) + the brief |
| **Recommendation** | **PASS** — 0 Must fix ← Field makes the final call |

### Findings from the first audit
| # | Status | Evidence |
|---|---|---|
| D1 | ✅ Resolved (Field: B) | `lineState(mobile)` → `m.` + 32 random bytes for mobile, unchanged for web. `takeOauthState` → `parseOauthState(raw) ?? missingMobileState(state)`; a missing record + `m.` → `{ client: 'mobile', nonce: '', codeChallenge: '' }` → `mobileCallbackRejected` → `barapp://auth?error=login_failed`. `rememberMobileClient`, `replayedMobileState`, `mobileOauthKey` removed; auditor grep `oauth-mobile\|mobileOauthKey\|rememberMobileClient` in `src/` → none. A web state can't collide with the prefix: base64url has no `.` |
| AC-12 | ✅ Resolved (Rev 2) | Handoff "AC-12 evidence": Field's desktop run with a real LINE channel — token 200, `/me` 200 "KJ", refresh 200, body logout 200 → `/me` 401. The auditor watched this run in the session (live output pasted by Field; tokens later revoked by the logout). Phone part → BRIEF-022 AC-9 |
| S1 | Open (Suggestion, unchanged) | `/auth/mobile/refresh` still rotates web families. Park it with rate limiting on the pre-pilot hardening list |
| S2 | ✅ Closed (Rev 2 drops the split) | Implementer line updated; handoff AI usage High stands |
| S3 | ✅ Resolved | Handoff Deviations: "None. Rev 2 records the desktop AC-12 evidence and the `m.` state prefix" — accurate now that the brief covers both |

### AC changes in Rev 2
| AC | Met? | Evidence |
|---|---|---|
| AC-1 | ✅ | New assertion: mobile state `^m\.[A-Za-z0-9_-]{43}$`; web state `^[A-Za-z0-9_-]{43}$`, record `{ nonce }` only |
| AC-3 | ✅ | Replay → `barapp…login_failed` + no `oauth-mobile:*`; new case `sends login_failed when an m. state has expired` (real `pexpire` 30 ms) → `barapp…login_failed`, no `session:*`, no `mauth:*`; `missing-state` (no prefix) → web `/login?error=login_failed` (web regression kept) |
| AC-12 | ✅ | As above |
| Others | ✅ unchanged | Fix diff touches only state creation and the missing-record path; the success path (`finishMobileLogin`, exchange, rotation) is byte-identical |

### Evidence Coverage (re-audit)
- Reviewed work SHA: `7bcad32` (= `origin/feat/BRIEF-021-mobile-auth-backend`). Uncommitted in the checkout: handoff + KJ state (executor, evidence only) and this report
- Auditor ran on `7bcad32`: `tsc --noEmit` exit 0 · `check-class-files.mjs` exit 0 · grep above. Not run by the auditor (same limitation as before): vitest / e2e / oxlint / `openapi:check` → handoff G1 on `7bcad32`: e2e 62 passed (61 + the new expired case), `openapi:check` exit 0. CI on H confirms
- PASS commit (H) must contain only: this report unchanged + final handoff + KJ state. Pre-merge: verify `7bcad32..H` is evidence-only (§7), `ci` green on H. Field's own PR → merge pre-approved under §7

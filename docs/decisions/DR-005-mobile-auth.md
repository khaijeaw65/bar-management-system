# DR-005 — Mobile auth: LINE login handoff + Bearer tokens for the Expo app

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Field via Cowork · 2026-09-23 |
| **Brief** | none yet (future BE auth brief + MB auth brief). MB-000 only prepares the `barapp` URL scheme |
| **Category** | Sensitive (auth) · Flow/Architecture |

## Context
Web auth is an HttpOnly cookie (`access_token` 15 min, `refresh_token` 7 days, path `/api/auth/refresh`) — see handoff 2026-09-20 "Auth & Session Architecture". The Expo staff app (DR-002 #1: the only background-push channel) cannot use that flow as is:
- LINE login has to run in the system browser (`expo-web-browser` auth session). The backend callback sets its cookies **in that browser**, not in the app's own `fetch` cookie store.
- Native cookie stores differ between iOS and Android and are not an encrypted secret store.

The 2026-09-23 mobile decision ("same backend API, zero new endpoints") does not hold for login. This DR records the smallest change that keeps the web flow untouched.

## Options
**A) One-time code handoff + Bearer tokens** — LINE callback redirects to the app with a short-lived single-use code; the app exchanges it for tokens in the response body and stores them in `expo-secure-store` / 2 new endpoints + one extra JWT extractor. Web unchanged.
**B) Keep cookies, rely on the native cookie store** — no new endpoints / the cookie lands in the browser session, not the app; fragile across platforms; hard to test. Does not work reliably.
**C) Native LINE SDK in the app** — native LINE UI / extra native module + a server-side LINE token verification path anyway; more moving parts for the same result.

## Recommendation
**A.** It is the standard OAuth pattern for native apps (RFC 8252: system browser + app redirect + PKCE), adds two endpoints, and changes nothing for the web.

### Flow
```
App                                   Backend                         LINE
 │ generate code_verifier (PKCE)         │                              │
 │ openAuthSessionAsync(                 │                              │
 │   /api/auth/line/login?client=mobile  │                              │
 │   &code_challenge=…)  ───────────────►│ state = {client, challenge}  │
 │                                       │ ───── LINE OAuth ──────────► │
 │                                       │ ◄──── callback ───────────── │
 │                                       │ create one-time code         │
 │ ◄──── 302 barapp://auth?code=… ────── │ (Redis, 60 s, single use)    │
 │ POST /api/auth/mobile/token           │                              │
 │   { code, code_verifier } ──────────► │ verify PKCE, delete code     │
 │ ◄── { accessToken, refreshToken,      │ issue same JWT pair as web   │
 │       expiresIn }                     │                              │
 │ SecureStore.set(…)                    │                              │
 │ API calls: Authorization: Bearer …    │                              │
```

### Rules
- **Endpoints (new):**
  - `POST /api/auth/mobile/token` — body `{ code, codeVerifier }` → `{ accessToken, refreshToken, expiresIn }`. `@Public()`.
  - `POST /api/auth/mobile/refresh` — body `{ refreshToken }` → rotated pair. Same rotation + reuse detection as the web refresh.
- **Login start:** existing LINE login route gains `client=mobile` + `code_challenge` (S256). Stored in the OAuth `state`, not trusted from the callback query.
- **Redirect target:** fixed to `barapp://auth`. Never taken from a query parameter (no open redirect).
- **One-time code:** 32 random bytes, Redis key TTL 60 s, deleted on first use, bound to the staff user + code challenge.
- **JWT strategy:** extractors in order — cookie `access_token`, then `Authorization: Bearer`. Same secret, same payload, same `PermissionsGuard`.
- **CSRF:** Bearer tokens are never sent automatically by a browser, so the web CSRF posture is unchanged.
- **App storage:** tokens only in `expo-secure-store` (iOS Keychain / Android Keystore). Never AsyncStorage, never logs.
- **Logout (mobile):** revoke the refresh token server-side (existing logout path, token from body), delete the push token (DR-003 amendment), clear SecureStore.
- **Web:** no change. Cookie config, `SameSite=Lax`, CORS, `/api/auth/refresh` all stay as they are.

### New dependencies (mobile, in the MB auth brief — not MB-000)
`expo-web-browser`, `expo-secure-store`, `expo-crypto` (PKCE) — via `npx expo install`, exact versions pinned in that brief.

**Follow-ups (Field, manual — protected):** `docs/rules/backend.md` Auth section (second extractor + mobile endpoints), CLAUDE.md "Auth" row (add "Bearer for mobile"), handoff note superseded by this DR.

---

## Decision — Field only
**Decision:** Approved: A
**Why:** The standard native-app OAuth pattern (system browser + app redirect + PKCE). Two new endpoints, no change to the web cookie flow.
**Date:** 2026-09-23 · recorded by Cowork on Field's explicit instruction (planning session); Field signs off by merging the PR

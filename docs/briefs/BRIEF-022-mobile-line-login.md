# BRIEF-022 — Staff app: real LINE login, secure session, API client

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-18 |
| **Implementer** | metee (learning mode — writes ≥ 70 % himself; agent ≤ 20 %, workflow §8) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | mobile |
| **Revision** | 1 |
| **Depends on** | **BRIEF-010 merged** (shell, mock session, auth gate, tabs) · **BRIEF-021 merged** before AC-9 (real-device login) — every other AC runs on mocks, so work starts as soon as BRIEF-010 is merged |
| **References** | **DR-005** (+ Am. 1–2) · DR-007 (axios) · DR-008 · `docs/rules/mobile.md` (API Client, Auth, Mocks, Testing) · `docs/design/CD-08-handoff.md` (login states 1–5, copy, R13) · BRIEF-021 §3 (endpoints + contracts schemas) |
| **Audit depth** | Full (auth) |
| **Size** | ~10 h (week of 26 Oct, evenings) |

---

## 1. Goal
A staff member taps "เข้าสู่ระบบด้วย LINE", signs in with LINE in the system browser, and stays signed in for 30 days. The app stores the token pair in SecureStore and calls the backend with `Authorization: Bearer`. The อื่นๆ tab shows the real staff name from `GET /api/auth/me` — proof the whole chain works. Every later mobile brief (real queue, new order) builds on this client.

**Why this order:** the real order queue and new-order briefs can't call the API until there is a token and one shared HTTP client. This brief adds both and does nothing else.

## 2. Scope
### In
- **PKCE** `src/lib/auth/pkce.ts` — `createPkcePair(): Promise<{ verifier, challenge }>`: verifier = 32 random bytes (`expo-crypto` `getRandomBytes`) as base64url (43 chars); challenge = base64url(SHA-256(verifier)) (`digestStringAsync`, then base64 → base64url: `+`→`-`, `/`→`_`, strip `=`).
- **Token storage** `src/lib/auth/token-storage.ts` — `saveTokens()`, `readTokens()`, `clearTokens()` on `expo-secure-store`, keys `auth.accessToken`, `auth.refreshToken`. Nothing else stores tokens; never AsyncStorage, never `console.log` a token.
- **Login** — replace the mock `signIn()` in `src/lib/auth/session.ts` (keep the mock path behind `EXPO_PUBLIC_USE_MOCKS=1`):
  1. `createPkcePair()`
  2. `WebBrowser.openAuthSessionAsync(`${API}/auth/line/login?client=mobile&code_challenge=${challenge}&code_challenge_method=S256`, 'barapp://auth')`
  3. result `success` → parse the URL with `expo-linking` → `code` → `POST /auth/mobile/token { code, codeVerifier }` → `saveTokens()` → `GET /auth/me` → signed in.
  4. result `cancel` / `dismiss` → back to default, **no** error shown.
  5. `error=not_registered` → login·4 · `error=login_failed` or any failure → login·3.
- **API client** `src/lib/api/client.ts` (mobile.md → API Client) — one axios instance: base URL `EXPO_PUBLIC_API_URL`; request interceptor adds `Bearer <access>`; envelope `{ status, code, message, data }` unwrapped and `data` validated with the contracts schema; non-2xx → `ApiError(status, code, message)`. **401 → one shared refresh promise** (`POST /auth/mobile/refresh`) → retry the original request once; refresh fails → `clearTokens()` → signed out → login·5.
- **Auth API wrappers** `src/lib/api/auth.ts` — `exchangeCode()`, `refreshTokens()`, `logout()`, `getMe()`, typed with `@bar/contracts` (`MobileTokenResponseSchema`, `AuthMeSchema`).
- **App start** — `_layout.tsx` auth gate: tokens in SecureStore → `getMe()` (the client refreshes if the access token expired) → `(tabs)`; no tokens or refresh fails → `/login`. Splash/loading while checking — no login-screen flash for a signed-in user.
- **Logout (อื่นๆ)** — confirm, then `POST /auth/logout { refreshToken }` → `clearTokens()` → `/login`. Network failure → still clear local tokens and go to login (CD-08 handoff: Log out row).
- **อื่นๆ** shows `displayName` from `getMe()` (replaces the mock "บีม").
- **Login screen states** (CD-08 login 1–5, copy exactly as §6).
- `app/mobile/.env.example`: `EXPO_PUBLIC_API_URL=https://<your-ngrok-static-domain>/api` (BRIEF-021 README).

### Out (do NOT build here)
- Wiring the order queue to the real API, status actions, order detail → next mobile brief.
- New order (CD-14), tables, socket.io, push + push token (DR-003), notifications onboarding screen.
- Permission-based read-only UI (needs the IAM permissions endpoint).
- iOS-specific work — Android dev build is the demo target (mobile.md).
- Any change to `app/backend`, `app/frontend`, `app/packages/contracts` — missing something there → tell Field (BRIEF-021 or a DR).

## 3. Contract
Built by **BRIEF-021** — consume it, don't change it.
- `GET {API}/auth/line/login?client=mobile&code_challenge=…&code_challenge_method=S256` (opened in the system browser, not axios)
- redirect back: `barapp://auth?code=<code>` · `barapp://auth?error=login_failed|not_registered`
- `POST /auth/mobile/token` `{ code, codeVerifier }` → `{ accessToken, refreshToken, expiresIn }`
- `POST /auth/mobile/refresh` `{ refreshToken }` → same shape
- `POST /auth/logout` `{ refreshToken }` → `{ ok: true }`
- `GET /auth/me` (Bearer) → `AuthMe { id, displayName, avatarUrl }`
- **Contracts changes:** none here · **Permissions:** none · **WS:** none

## 4. Acceptance Criteria
- **AC-1** — Given `createPkcePair()`, then the verifier is 43 base64url chars and the challenge equals the RFC 7636 Appendix B value for the Appendix B verifier (test with that fixed vector).
- **AC-2** — Given the browser returns `barapp://auth?code=abc`, when sign-in completes, then `/auth/mobile/token` is called with `abc` + the verifier, both tokens are saved to SecureStore, and the app lands on ออเดอร์.
- **AC-3** — Given the user closes the browser (`cancel` / `dismiss`), then the login screen is back to default with no error.
- **AC-4** — Given `error=not_registered`, then login·4 copy shows; given `error=login_failed` or the token call fails, then login·3 copy shows with "ลองอีกครั้ง".
- **AC-5** — Given an expired access token, when any API call returns 401, then exactly **one** refresh call happens even for 3 parallel requests, new tokens are saved, and each request is retried once and succeeds.
- **AC-6** — Given the refresh call fails (401), then tokens are cleared and the app shows login·5 ("ออกจากระบบแล้ว"); the back gesture cannot reach the tabs.
- **AC-7** — Given saved tokens, when the app starts, then it goes straight to ออเดอร์ (no login flash); given none, then login.
- **AC-8** — Given อื่นๆ → ออกจากระบบ → confirm, then logout is called with the refresh token, tokens are cleared and login shows — also when the logout call fails (network).
- **AC-9** — **Real device (after BRIEF-021 merges):** Android dev build, `EXPO_PUBLIC_USE_MOCKS=0`, own backend over the tunnel → LINE login → อื่นๆ shows the real LINE display name; kill and reopen the app → still signed in. Screen recording in the handoff.
- **AC-10** — No token in logs or AsyncStorage: `grep -rn "AsyncStorage\|console.log" app/mobile/src/lib` → none for tokens; tokens are written only in `token-storage.ts`.
- **AC-11** — Gates pass; `EXPO_PUBLIC_USE_MOCKS=1` still runs the whole app with no backend.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1 | unit | `src/__tests__/lib/auth/pkce.test.ts` |
| AC-2–AC-4 | component (mock `expo-web-browser`, `expo-secure-store`, API) | `src/__tests__/app/login.test.tsx` |
| AC-5, AC-6 | unit (axios mock adapter or mocked transport) | `src/__tests__/lib/api/client.test.ts` |
| AC-7 | component | `src/__tests__/app/layout-auth-gate.test.tsx` |
| AC-8 | component | `src/__tests__/app/tabs-more.test.tsx` |
| AC-9 | manual | screen recording in the handoff |
| AC-10 | command | grep above |
| AC-11 | command | gates |

Gate commands (all must pass):
```bash
pnpm --filter @bar/mobile lint
pnpm --filter @bar/mobile typecheck
pnpm --filter @bar/mobile test
pnpm --filter @bar/mobile export:check
```
A required script that doesn't exist yet = **BLOCKED** — report it, never skip silently.

### Local Sonar scan
- Required: yes (always for Metee). Approved exclusions: none.

## 6. Constraints
- `docs/rules/mobile.md` throughout (file structure, limits, named exports, tests in `src/__tests__/`).
- `client.ts` is the only file that imports axios; screens never call `fetch` / axios.
- Copy exactly (CD-08 handoff):
  - default: "เข้าสู่ระบบด้วย LINE" · footer "เฉพาะพนักงาน The Loft Bar"
  - signing in (login·2): "กำลังเปิด LINE เพื่อยืนยันตัวตน"
  - failed (login·3): "เข้าสู่ระบบไม่สำเร็จ" / "ลองอีกครั้ง หากยังไม่ได้ ให้ตรวจว่าเปิดแอป LINE ในเครื่องนี้แล้ว"
  - not registered (login·4): "บัญชี LINE นี้ยังไม่ได้ลงทะเบียน" / "ส่งคำขอเข้าใช้งานถึงเจ้าของร้านแล้ว เข้าสู่ระบบอีกครั้งเมื่อได้รับอนุมัติ" · "กลับไปหน้าเข้าสู่ระบบ" · "ติดต่อเจ้าของร้านหากรอนาน"
  - signed out (login·5): "ออกจากระบบแล้ว" / "เข้าสู่ระบบอีกครั้งเพื่อทำงานต่อ — เกิดเมื่อออกจากระบบเอง เจ้าของร้านถอนสิทธิ์เครื่องนี้ หรือไม่ได้เปิดแอปเกิน 30 วัน"
- **Learning mode:** Metee writes the PKCE helper, token storage, the 401-refresh logic and **all tests** himself — this is the core of the brief. An agent may explain PKCE / interceptors, review, and help set up the dev build + tunnel. Handoff: AI usage Low / Medium / High + what for.
- **G3 walkthrough topic (suggested):** why three parallel 401s must share one refresh promise, and what goes wrong if they don't (refresh-token reuse → family revoked → everyone logged out).

## 7. Decision Points (Field Guard)
- **Pre-decided (exact only):**
  | Package | Version | How |
  |---|---|---|
  | `expo-web-browser` | `~57.0.3` | `npx expo install expo-web-browser` in `app/mobile` |
  | `expo-secure-store` | `~57.0.4` | `npx expo install expo-secure-store` |
  | `expo-crypto` | `~57.0.4` | `npx expo install expo-crypto` |
  | `axios` | `^1.20.0` | `pnpm add axios` in `app/mobile` (DR-007) |
  - `expo-linking` is already installed (BRIEF-002) — use it for URL parsing; scheme `barapp` already in `app.config.ts`.
  - SecureStore keys `auth.accessToken`, `auth.refreshToken` · env `EXPO_PUBLIC_API_URL` in `app/mobile/.env.example`.
  - If `npx expo install` resolves a different 57.x patch, that patch is fine — record it in the handoff. A different major → stop, DR.
- **Likely DRs:**
  - `openAuthSessionAsync` on Android doesn't return to the app after the `302 barapp://auth` → tell Field (may need a BRIEF-021 change); don't switch to a deep-link listener workaround alone.
  - Any extra package (e.g. an axios mock adapter for tests) → DR, or mock the transport by hand.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions (BRIEF-010 merged; BRIEF-021 merged before AC-9)
- [x] No unresolved decision blocking the main outcome (DR-005 Approved)
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision (2026-10-18, in session)

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-18 | Initial Draft (Cowork) — Metee's week-2 brief after BRIEF-010 |
| 1 | 2026-10-18 | Ready — Rev 1 approved by Field in session ("approve both") |

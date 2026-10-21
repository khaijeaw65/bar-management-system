# BRIEF-028 — Web POS: LINE login, session, real API

| | |
|---|---|
| **Status** | Ready |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | frontend |
| **Revision** | 1 |
| **Depends on** | BRIEF-007 ✅ (LINE login, cookies, `/auth/me`, refresh) · BRIEF-016 ✅ (menu read API) · BRIEF-008 ✅ (POS shell) |
| **References** | CD-01 handoff (login · not-registered · shell · menu-list · session-expired) · `docs/rules/frontend.md` (API Client, Auth) · DR-007 (axios) · DR-004 (contracts schemas) · `docs/api/README.md` §1 (envelope, Auth) · BRIEF-021 handoff AC-12 (LINE on localhost works) |
| **Audit depth** | Full (auth) |
| **Size** | ~1 day · est. ~450–550 net-new lines |

---

## 1. Goal
Staff sign in to the web POS with LINE; every POS screen reads the real backend (mocks only in tests); an expired session sends them back to login cleanly. First of the 10 Nov UI slice (028 → 029 → 030 → 031 → 033 → 032).

## 2. Scope
### In
- **HTTP client → axios (DR-007):** `lib/api/client.ts` = one axios instance, `baseURL` from `NEXT_PUBLIC_API_URL`, `withCredentials: true`; response interceptor unwraps the envelope and Zod-validates `data`; non-2xx → `ApiError(status, code, message, data)` — `data` keeps the envelope's error data (e.g. `{ details }` on `409 ITEM_UNAVAILABLE` / `PAYMENT_IN_FLIGHT`); `code` typed from `ErrorCodeSchema` but an unknown code is kept as a string, never a parse failure; network error → status 0, code `NETWORK_ERROR` (client-side only). Exports `apiGet(path, schema)` and `apiPost(path, body, schema, opts?: { idempotencyKey?: string })`; `menu.ts` moves to them.
- **401 → refresh once:** interceptor calls `POST /auth/refresh` through **one shared promise** (N parallel 401s → 1 refresh), retries each original request once. Refresh fails → emits a `session-expired` signal; never loops. `/auth/refresh`, `/auth/logout` and `/auth/line/*` are never retried; the error tells the caller whether this was the first load (no successful `/auth/me` yet) or mid-use.
- **`/login` page (CD-01 login·1–4):** default · redirecting (button pending "กำลังเปลี่ยนเส้นทาง...", then `window.location.assign(<API>/auth/line/login)`) · `?error=login_failed` → dismissible Alert · `?error=not_registered` → not-registered card (CD-01 R2 copy) with "กลับไปหน้าเข้าสู่ระบบ". No shell, no data requests on this page. Official LINE button styling per CD-01 deviation 1 (asset in `public/`, no new package).
- **Session gate (Q1 A):** `useMe()` = `useQuery(['auth','me'])` → `GET /auth/me` (`AuthMeSchema`), called by the `/pos` layout. First load 401 (after one refresh attempt) → `router.replace('/login')`; mid-use refresh failure → **session-expired modal** (CD-01: blocking, not dismissible, 5 s countdown + "เข้าสู่ระบบอีกครั้ง" → `/login`).
- **Top bar:** real `displayName` + avatar (`avatarUrl` or initial) from `/auth/me`; avatar menu "ออกจากระบบ" → `POST /auth/logout` → clear query cache → `/login` (network failure still goes to `/login`). Shift chip shows the name only (no shift API yet).
- **Menu list on the real API:** `lib/api/menu.ts` uses contracts `MenuItemListSchema` / `MenuCategoryListSchema` (DR-004); `/pos/menu` columns ชื่อ · หมวด (category name via categories) · ราคา (`basePrice`, "เริ่ม ฿x" when variant prices differ — api README D4) · สถานะ ("หมด" when `unavailableReason = sold_out`; "นอกเวลาโปร" for `out_of_window`). Local provisional menu schema deleted.
- **MSW mocks** updated to contracts shapes (`/auth/me`, `/auth/refresh`, `/auth/logout`, `/menu/items`, `/menu/categories`) so `test:e2e` stays offline.
- `app/frontend/.env.local` created by the executor from `.env.example` with `NEXT_PUBLIC_API_MOCKING` unset (closes the state Setup gap; file is git-ignored).

### Out (do NOT build here)
- Permission-based hiding — `AuthMe` has no permissions until the IAM brief; every signed-in staff sees every rail item.
- Notifications bell data (DR-003 notifications brief) · real shift chip · PIN staff switch (DR-014 #8) · access-request UI (CD-13).
- Floor / panel / order / payment screens (029–033). `/` keeps redirecting to `/pos/menu` until 029.
- Production cross-domain cookies (Vercel ↔ AWS) — carry-over for the AWS week, see §7.

## 3. Contract
- **Endpoints used (all exist):** `GET /auth/line/login` (302) · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me` → `AuthMe` · `GET /menu/items` → `MenuItemList` · `GET /menu/categories` → `MenuCategoryList`.
- **WS events:** none.
- **Contracts changes:** none (frontend consumes existing schemas).
- **Permissions:** `menu:read` (server-side only).
- **Business rules:**
  - LINE is the only login; callback errors arrive as `?error=login_failed|not_registered` → BRIEF-007 §2, CD-01 §9.
  - Session-expired modal only when refresh fails, never on each access expiry (`JWT_ACCESS_TTL=15m`) → CD-01 R4.
  - Frontend never reads tokens; cookies are HttpOnly → `frontend.md` Auth.
  - UI branches on `code`, shows `message` → api README §1.

### 3b. Under the hood
- **When:** any `/pos/*` load; any API call.
- **Where:** `lib/api/client.ts` (axios + interceptors) · `lib/api/auth.ts` · `hooks/useMe.ts` · `app/login/page.tsx` · `app/pos/layout.tsx` gate · `app/pos/_components/SessionExpiredModal.tsx`.
- **How:** 1. `/pos` layout mounts → `useMe()` → `GET /auth/me`. 2. 401 → interceptor → shared `refreshPromise ??= POST /auth/refresh` → success: retry original once; fail: first load → `/login`, mid-use → modal. 3. Every wrapper → `apiGet/apiPost` → envelope unwrap → Zod parse → typed data or `ApiError`.
- **Data:** cookies `access_token` (path `/`), `refresh_token` (path `/api/auth`) — set by the backend; client stores nothing.
- **Failure:** Zod mismatch → `ApiError` with code `INVALID_RESPONSE` (client-side) + console error, screen shows its error state.
- **Why:** one shared refresh avoids the token-reuse detection in BRIEF-007 (two parallel refreshes would revoke the family and log the user out).

## 4. Acceptance Criteria
- **AC-1** — Given `/login`, when the LINE button is tapped, then it shows the pending label, is disabled, and navigates to `<API>/auth/line/login`.
- **AC-2** — `/login?error=login_failed` shows the dismissible error Alert; `/login?error=not_registered` shows the not-registered card; neither calls any `/api` endpoint.
- **AC-3** — Given valid cookies, `/pos/menu` shows the staff `displayName` in the top bar; given `/auth/me` 401 and refresh 401 on first load, the app lands on `/login` without showing the modal.
- **AC-4** — Given three requests that return 401 at once and refresh succeeds, then exactly **one** `POST /auth/refresh` is sent and all three retries succeed; a retried request that 401s again is not retried a second time.
- **AC-5** — Given a signed-in screen, when refresh fails mid-use, then the session-expired modal blocks the screen and goes to `/login` after 5 s or on the button.
- **AC-6** — "ออกจากระบบ" sends `POST /auth/logout` and lands on `/login`; with the network down it still lands on `/login`.
- **AC-7** — `/pos/menu` renders the contracts menu shape: category names resolved, "หมด" for a sold-out item, "เริ่ม ฿x" when variant prices differ; loading / empty / error+retry states per CD-01 menu-list (error = Alert + retry only, deviation 10).
- **AC-8** — A 409 envelope becomes `ApiError{ status: 409, code, message, data }` (with `data.details` intact); a response whose `data` fails the schema becomes `INVALID_RESPONSE`, not a crash.
- **AC-9** — Gates below pass; run proof done.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-4, AC-8 | unit | `src/lib/api/client.test.ts` (MSW node) |
| AC-1, AC-2 | component | `src/app/login/page.test.tsx` |
| AC-3, AC-5, AC-6 | component | `src/app/pos/_components/SessionGate.test.tsx` (or the layout's gate component) |
| AC-7 | component + e2e | `src/app/pos/menu/_components/MenuList.test.tsx` · `e2e/menu.spec.ts` (updated) |
| AC-1, AC-2 | e2e | `e2e/login.spec.ts` |

Gate commands (all must pass):
```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend test:e2e
pnpm --filter @bar/frontend build
```
Run proof:
```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
pnpm --filter @bar/backend migration:run
pnpm --filter @bar/backend start:dev    # shell 1, on the work SHA
curl -fsS localhost:3001/api/health
pnpm --filter @bar/frontend dev         # shell 2, NEXT_PUBLIC_API_MOCKING unset
```
UI change: Field signs in once with LINE at `localhost:3000/login` (personal credential — workflow §4 Field-only); executor then opens `/pos/menu` → real seeded menu + Field's name in the top bar; screenshot in the handoff. Unregistered state: `/login?error=not_registered`.

### Local Sonar scan
- Optional — Field's brief; run if time allows.

## 6. Constraints
- `lib/api/client.ts` is the only HTTP entry point; components never call axios (`frontend.md` DO NOT).
- No tokens in JS, logs or `localStorage`.
- Page ≤ 100 lines, component ≤ 150, JSX ≤ 40 per component, ≤ 3 `useState` (`frontend.md` Hard Limits).
- Tokens / utilities only (no hex, no `dark:` colors, no arbitrary values); Thai hardcoded strings from CD-01 §6.
- Read `node_modules/next/dist/docs/` before Next APIs (`app/frontend/AGENTS.md`).

## 7. Decision Points (Field Guard)
- **Q1 — Route guard. ✅ Decided (Field, 2026-10-21): A.** `frontend.md` says "`proxy.ts`: cookie present? else `/login`".
  - **A (chosen):** client gate via `useMe()` in the `/pos` layout; no `proxy.ts` yet. *Why:* the access cookie disappears every 15 min while the refresh cookie (path `/api/auth`) is invisible to `/pos` — a proxy check would bounce a valid session to `/login`; and in production the web (Vercel) and API (AWS) are different hosts, so the proxy never sees API cookies at all. *Trade-off:* a brief blank shell before the redirect on a logged-out first load. Needs a one-line `frontend.md` Auth update (protected rule file → Field-approved edit at seed).
  - **B:** keep `proxy.ts` and check `access_token`. *Why not:* false logouts every 15 min in dev, no effect in prod.
- **Pre-decided:** `axios@^1.20.0` (same version already in the lockfile) · paths `src/lib/api/{client,auth,menu}.ts`, `src/app/login/page.tsx`, `src/hooks/useMe.ts` · no other new packages.
- **Likely DRs:** prod cookie domain (web + API need one registrable domain, e.g. `pos.<domain>` + `api.<domain>`, and `sameSite`/`domain` cookie options) — **carry-over for the AWS week, not this brief.**

## 8. Unlocked Protected Files
- `none` (Q1 A's `docs/rules/frontend.md` edits — L128 Auth line, L63 tree line — were applied by Cowork in the seed commit with Field's approval; executors don't touch rule files)

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2
- [x] No unresolved decision blocking the main outcome (Q1 decided)
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-21 | Initial Draft (Cowork) — 10 Nov UI slice #1 |
| 1 | 2026-10-21 | Field in session: Q1 A (client session gate, no `proxy.ts` cookie check; `frontend.md` L128 Auth line approved as shown + L63 `proxy.ts` tree line removed; L153 naming rule kept) — recorded by Cowork on Field's explicit instruction |
| 1 | 2026-10-21 | Field approved Rev 1 → Ready ("approve BRIEF-028 Rev 1 Ready") — recorded by Cowork on Field's explicit instruction |

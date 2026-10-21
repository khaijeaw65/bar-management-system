# Handoff — BRIEF-028 Web POS LINE login

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-10-21 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-028-web-login-real-api` (PR opens after audit PASS) |
| **Commit** | `3d6b2b954b20b550a055ba3c77a80a10d52cd827` |
| **Status** | Implemented — awaiting audit |

> Gate evidence below was run on the work tree that became `3d6b2b9`, before this docs commit. Node v24.14.0, pnpm 10.0.0.

## Summary
Staff sign in to the web POS with LINE. One axios client unwraps the envelope, validates `data` with the caller's Zod schema, and shares a single `POST /auth/refresh` across parallel 401s. The `/pos` layout sends a logged-out first load to `/login` and opens the session-expired modal only when refresh fails mid-use. `/pos/menu` reads `MenuItemList` and `MenuCategoryList` from contracts.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `src/app/login/page.test.tsx` — pending label, disabled, `location.assign` to `http://localhost:3001/api/auth/line/login` · `e2e/login.spec.ts` — same navigation |
| AC-2 | ✅ | `page.test.tsx` — dismissible `login_failed` alert, not-registered card, no `/api` request · `e2e/login.spec.ts` |
| AC-3 | ✅ | `SessionGate.test.tsx` — name `Beam` when `/auth/me` succeeds; first-load 401 + refresh 401 calls `router.replace('/login')` and does not open the dialog |
| AC-4 | ✅ | `src/lib/api/client.test.ts` — three parallel 401s, one refresh, six reads; a retried 401 is not refreshed again |
| AC-5 | ✅ | `SessionGate.test.tsx` — mid-use refresh failure opens the alertdialog; the button goes to `/login` · modal test advances 5 s and calls `onLogin` once |
| AC-6 | ✅ | `SessionGate.test.tsx` — logout posts then `replace('/login')`; `HttpResponse.error()` still lands on `/login` |
| AC-7 | ✅ | `MenuList.test.tsx` — category `เบียร์`, `เริ่ม ฿180.00`, `นอกเวลาโปร`, `หมด`, empty, error + retry · `e2e/menu.spec.ts` — four rows |
| AC-8 | ✅ | `client.test.ts` — 409 `ITEM_UNAVAILABLE` keeps `data.details`; bad `data` is `INVALID_RESPONSE`; unknown code `FUTURE_CODE` is kept |
| AC-9 | ✅ | Gate table below |

## Gate Evidence (G1)
Run on the work tree that became `3d6b2b9`. Node v24.14.0.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/frontend lint` | 0 | pass |
| `pnpm --filter @bar/frontend typecheck` | 0 | pass |
| `pnpm --filter @bar/frontend test` | 0 | 30 passed · 0 failed |
| `pnpm --filter @bar/frontend test:e2e` | 0 | 3 passed · 0 failed |
| `pnpm --filter @bar/frontend build` | 0 | pass (`/login`, `/pos/menu`) |
| run proof | 0 with a port limit | Postgres + Redis already up. `migration:run` exit 0, no migrations pending. `localhost:3001` is another project's container (`tlirv-eup-web`, health 404). Backend started with `PORT=3011`. `curl localhost:3011/api/health` → **200** `{"status":"ok","db":"up"}`. Frontend `next dev` on **3010** with `NEXT_PUBLIC_API_URL=http://localhost:3011/api` because 3000 is `tlirv-portal-web`. |

UI exercised: `/login` shows the LINE button (green, pending label covered by e2e). `/login?error=login_failed` alert dismisses. `/login?error=not_registered` shows the card and the back link, no POS shell. Signed-in `/pos/menu` with Field's name was **not** exercised: LINE login is Field's credential, and CORS allows only `FRONTEND_URL` (`localhost:3000`), so the 3010 dev server cannot call 3011. First-load redirect is covered by `SessionGate.test.tsx` and the menu e2e (MSW, same origin).

## Sonar (local scan)
- Not run. Optional on Field's brief.

## Decisions Raised
- none

## Deviations from Brief
- None. `axios@^1.20.0` is the pre-decided package; the lockfile already had `1.20.0`.
- LINE mark is a local SVG in `public/line-logo.svg` (no new package). The button green is `--line-brand` (`#06C755`, CD-01 §8) so the class is a token, not an arbitrary value.
- Diff is about 860 net lines versus the ~450–550 estimate. Lockfile is 3 lines. No split: the brief's screens and the client are one outcome.

## Known Gaps / Follow-ups
- Field, when 3000/3001 are free: sign in once at `localhost:3000/login`, then open `/pos/menu` and confirm the seeded menu plus the name in the top bar.
- Prod cookie domain stays the AWS-week carry-over (brief §7).
- "เพิ่มเมนูแรก" is not on the empty menu state — menu editing is CD-12.

## AI Usage
**High** — Cursor wrote the client, session gate, login page, menu wiring, and tests.

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-028`
- Work SHA: `3d6b2b954b20b550a055ba3c77a80a10d52cd827` · client matches DR-007 (one axios instance, shared refresh) and the brief's `ApiError(status, code, message, data)`. Menu schemas are `MenuItemListSchema` / `MenuCategoryListSchema`. No contracts or schema change.

## Notes for Reviewer
- Refresh failure emits `session-expired` once inside the shared promise. `authPhase` is `first-load` until a successful `GET /auth/me`, then `mid-use`.
- `/auth/refresh`, `/auth/logout`, and `/auth/line/*` are not retried. A request that 401s after its one retry is not refreshed again.
- `authenticated` is module state. Tests reset it in `src/test/setup.ts`.

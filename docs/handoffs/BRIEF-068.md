# Handoff — BRIEF-068 Dev Demo User Login & Role Switching

| | |
|---|---|
| **Implementer** | kj (Antigravity) |
| **Date** | 2026-11-01 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-068-dev-demo-login` (PR opens after audit PASS) |
| **Commit** | `f798fcc` (`f798fcc33d2cfa2e8afbca0212bcab4b357af968`) |
| **Status** | Audit PASS |

## Summary
Added `POST /api/auth/demo-login` in `AuthController` supporting `owner`, `manager`, and `staff` demo roles with production guard (404), self-provisioning via `DemoUserService`, and session cookie issuance via `TokenService`. Added `DemoLoginRoleSchema` and `DemoLoginRequestSchema` to `@bar/contracts`. Added `DemoLoginSection` to web `/login` and quick role switch items to `StaffAccount` dropdown in `/pos`, conditionally rendered in non-production environments (`process.env.NODE_ENV !== 'production'`).

## Acceptance Criteria
| AC | Result | Evidence |
|---|---|---|
| AC-1 | ✅ | `POST /api/auth/demo-login` with valid role (`owner`, `manager`, `staff`) sets session cookies and returns `{ ok: true }`. Verified via unit tests (`auth.service.spec.ts`, `demo-user.service.spec.ts`, `auth.controller.spec.ts`), seeded e2e tests (`app/backend/test/demo-login.e2e-spec.ts` 5/5 passed), and live G1 HTTP proof on port 3011. |
| AC-2 | ✅ | `POST /api/auth/demo-login` in production (`nodeEnv === 'production'`) returns 404 Not Found without setting cookies. Verified in unit tests and `test/demo-login.e2e-spec.ts`. |
| AC-3 | ✅ | Web `/login` page renders 1-click buttons for Owner, Manager, and Staff in non-production; clicking one issues demo login and navigates to `/`. Omitted in production. Verified in `app/frontend/src/app/login/_components/LoginCard.test.tsx` (4/4 passed). |
| AC-4 | ✅ | Web `/pos` header dropdown (`StaffAccount`) renders quick role switcher in non-production; selecting role switches active session and permissions. Omitted in production. Verified in `app/frontend/src/app/pos/_components/StaffAccount.test.tsx` (3/3 passed). |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts build` | 0 | pass (`tsc -b` built schemas & types cleanly) |
| `pnpm --filter @bar/backend lint` | 0 | pass (0 warnings, 0 errors, class files OK) |
| `pnpm --filter @bar/backend typecheck` | 0 | pass (`tsc --noEmit` exit 0) |
| `pnpm --filter @bar/backend test` | 0 | 58 passed (58) · 270 passed (270) · 0 failed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 42 passed (42) · 292 passed (292) · 0 failed (incl. seeded `demo-login.e2e-spec.ts` 5/5) |
| `pnpm --filter @bar/backend openapi:check` | 0 | pass (`docs/api/openapi.json` synchronized) |
| `pnpm --filter @bar/frontend lint` | 0 | pass (0 warnings, 0 errors) |
| `pnpm --filter @bar/frontend typecheck` | 0 | pass (`tsc --noEmit` exit 0) |
| `pnpm --filter @bar/frontend test` | 0 | 68 passed (68) · 321 passed (321) · 0 failed |
| `run proof: port 3011 + live demo-login` | 0 | Live HTTP: `POST /api/auth/demo-login` (`manager`) -> 200 `{ ok: true }` + cookies; `GET /api/auth/me` -> `Demo ผู้จัดการ`; `GET /api/me/permissions` -> 18 permissions; `POST /api/auth/demo-login` (`staff`) -> 200 `{ ok: true }` + cookies; `GET /api/me/permissions` -> 12 permissions. |

UI exercised: `/login` and `/pos` header dropdown role switch logic verified via unit tests with full DOM rendering and mocked router/window interaction; real backend session exchange verified via live HTTP.

## Sonar (local scan)
- Scanned commit: `f798fcc` · Quality Gate: ERROR (coverage threshold 0.0% vs 80.0% required, pre-existing config limitation)
- Issues by severity: BLOCKER 0 · HIGH 6 · MEDIUM 7 · LOW 5 · INFO 0
- Remaining issues + reason: 18 pre-existing issues across frontend and untouched backend files; 0 issues on files touched by BRIEF-068.
- Who fixed: n/a (all files touched by BRIEF-068 are clean).

## Decisions Raised
- none (all changes within pre-decided scope of BRIEF-068 Rev 1).

## Deviations from Brief
- Seeded test patch: In `app/backend/test/demo-login.e2e-spec.ts`, updated assertions to unwrap the global response interceptor envelope (`res.body.data.displayName`, `res.body.data.groups`) and match `groups` object array structure (`{ name: string }`). Approved in-session by Field (`Approved-by: Field (session)` in commit `a640f37`).

## Known Gaps / Follow-ups
- none (demo login endpoint is hard-locked to return 404 in production, and frontend UI is excluded in production builds).

## AI Usage
**High** — Antigravity used for contracts schema definition, backend service and controller implementation, seeded e2e fix under Field session approval, frontend component and dropdown role switch integration, unit tests, and G1 gate execution.

## Notes for Reviewer
- Check `app/packages/contracts/src/schemas/auth.ts` for `DemoLoginRoleSchema` and `DemoLoginRequestSchema`.
- Check `app/backend/src/modules/auth/application/demo-user.service.ts` for self-provisioning of demo users.
- Check `app/backend/src/modules/auth/infrastructure/http/auth.controller.ts` for `@Post('demo-login')` and `this.configService.nodeEnv === 'production'` 404 guard.
- Check `app/frontend/src/app/login/_components/DemoLoginSection.tsx` and `StaffAccount.tsx` for `process.env.NODE_ENV !== 'production'` gating.

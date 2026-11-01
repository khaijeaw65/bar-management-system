# BRIEF-068 — Dev Demo User Login & Role Switching

| | |
|---|---|
| **Owner** | Field |
| **Implementer** | Antigravity |
| **Assigned auditor** | Antigravity (different session) — Field instruction 2026-11-01 |
| **Affected apps** | backend / frontend / contracts |
| **Feature** | `standalone — single-slice brief` |
| **References** | `docs/rules/workflow.md` · schema tables: `staff_user`, `staff_user_identity`, `user_group_membership` · `app/backend/src/cli/seed-iam.ts` |
| **Status** | Ready — Field approved 2026-11-01 |
| **Revision** | 1 |
| **Depends on** | none · **Unblocks** none |
| **Size** | ACs 4 (≤8) · flows 1 (≤1) · files 8 (≤10) · migrations 0 (≤1) · new patterns 0 (≤1) → OK |
| **Audit depth** | Full (backend / auth) |

## 1. Goal

Enable 1-click demo user login and fast role switching (Owner, Manager, Staff) in `local` and `dev` environments so testing and demo sessions require zero manual SQL updates, while strictly disabling the endpoint and hiding UI controls in `production`.

## 2. Scope

**In:**
- Contracts: `DemoLoginRoleSchema` (`'owner' | 'manager' | 'staff'`) and `DemoLoginRequestSchema` in `@bar/contracts`.
- Backend: `POST /api/auth/demo-login` in `AuthController`. Hard-locked against production via `AppConfigService.nodeEnv === 'production'` (throws `404 Not Found`). Finds or provisions demo user, creates session via `TokenService.createSession`, and sets `access_token` and `refresh_token` cookies.
- Frontend login page: `DemoLoginSection` in `LoginCard.tsx` shown only when `process.env.NODE_ENV !== 'production'`.
- Frontend POS header: quick role switcher in `StaffAccount.tsx` dropdown shown only when `process.env.NODE_ENV !== 'production'`.
- Acceptance e2e test: `app/backend/test/demo-login.e2e-spec.ts`.

**Out:**
- Changes to production LINE login flow.
- Database schema changes (uses existing IAM tables and demo user seeds).
- Mobile Expo demo login (separate brief if needed).

## 3. Standalone Design & Contract

- **Decisions (`Decision | Why | Instead of`):**
  - Gated by `AppConfigService.nodeEnv === 'production'` returning 404 | Prevents any demo backdoor in production even if an attacker guesses the URL | Custom env flags that might accidentally be enabled in prod.
  - Re-use `TokenService.createSession` & standard cookies | Exact same session mechanics, TTLs, and rotation as real LINE login | Separate mock auth header or bypassing guards.
  - Self-provisioning demo users on demand if missing | Guarantees test/e2e/dev environments work immediately even after DB clean/reset | Requiring manual `pnpm seed:staff` runs.

- **Flow & Transaction boundary:**
  ```mermaid
  sequenceDiagram
  autonumber
  actor User as Developer / Field
  participant FE as Next.js Web
  participant AuthCtrl as AuthController
  participant AuthSvc as AuthService
  participant TokenSvc as TokenService
  participant DB as Postgres
  participant Redis as Redis

  User->>FE: Click "Demo ผู้จัดการ" (Login page or StaffAccount dropdown)
  FE->>AuthCtrl: POST /api/auth/demo-login { "role": "manager" }
  alt nodeEnv === 'production'
    AuthCtrl-->>FE: 404 Not Found
  else local / test / dev
    AuthCtrl->>AuthSvc: demoLogin("manager")
    AuthSvc->>DB: Find or create staff_user for "U-demo-manager" + membership "ผู้จัดการ"
    AuthSvc->>TokenSvc: createSession(userId)
    TokenSvc->>Redis: Store session & refresh token family
    TokenSvc-->>AuthSvc: { accessToken, refreshToken }
    AuthSvc-->>AuthCtrl: { ok: true, accessToken, refreshToken }
    AuthCtrl-->>FE: Set-Cookie: access_token, refresh_token + { ok: true }
    FE->>FE: Invalidate QueryClient cache & redirect to /pos
  end
  ```

- **Contracts (`app/packages/contracts`):**
  ```typescript
  export const DemoLoginRoleSchema = z.enum(['owner', 'manager', 'staff']);
  export type DemoLoginRole = z.infer<typeof DemoLoginRoleSchema>;

  export const DemoLoginRequestSchema = z.object({
    role: DemoLoginRoleSchema,
  });
  export type DemoLoginRequest = z.infer<typeof DemoLoginRequestSchema>;
  ```

- **Code map (`File | Owns`):**
  - `app/packages/contracts/src/schemas/auth.ts`: Schema and types for demo login request.
  - `app/packages/contracts/src/index.ts`: Export demo login schemas and types.
  - `app/backend/src/modules/auth/infrastructure/http/dto/auth.dto.ts`: OpenAPI schema definitions for demo login.
  - `app/backend/src/modules/auth/application/auth.service.ts`: `demoLogin(role)` user lookup / self-provisioning and session issuance.
  - `app/backend/src/modules/auth/infrastructure/http/auth.controller.ts`: `POST /api/auth/demo-login` route, 404 production guard, cookie setting.
  - `app/frontend/src/lib/api/auth.ts`: `demoLogin(role)` client function.
  - `app/frontend/src/app/login/_components/DemoLoginSection.tsx`: 1-click buttons for Owner, Manager, Staff.
  - `app/frontend/src/app/login/_components/LoginCard.tsx`: Render `DemoLoginSection` when `process.env.NODE_ENV !== 'production'`.
  - `app/frontend/src/app/pos/_components/StaffAccount.tsx`: In-app quick role switch items when `process.env.NODE_ENV !== 'production'`.

## 4. Acceptance Criteria

| AC | When | Then |
|---|---|---|
| 1 | `POST /api/auth/demo-login` with valid role (`owner`, `manager`, `staff`) in non-production | Returns 200 `{ ok: true }` and sets valid `access_token` and `refresh_token` cookies. `GET /api/auth/me` and `GET /api/me/permissions` reflect that demo user's identity and group permissions. |
| 2 | `POST /api/auth/demo-login` in `production` (`nodeEnv === 'production'`) | Throws `404 Not Found` without modifying any state or setting cookies. |
| 3 | User opens `/login` in non-production (`NODE_ENV !== 'production'`) | Renders 1-click demo login buttons for Owner, Manager, and Staff. Clicking one immediately logs in as that role and routes to `/`. In production builds, buttons are omitted. |
| 4 | User opens user dropdown in POS (`StaffAccount`) in non-production | Displays role switch options. Selecting a role switches active session and updates permissions immediately without logging out. In production builds, switch options are omitted. |

## 5. Tests (Planner = e2e · Executor = unit)

| ACs | Kind | Who writes | File |
|---|---|---|---|
| 1, 2 | e2e / acceptance | **Antigravity (as Planner)** (in seed commit, protected) | `app/backend/test/demo-login.e2e-spec.ts` |
| 1, 2 | unit (`*.spec.ts`) | **Executor** | `app/backend/src/modules/auth/infrastructure/http/auth.controller.spec.ts` |
| 3, 4 | unit (`*.spec.ts`) | **Executor** | `app/frontend/src/app/login/_components/LoginCard.test.tsx` · `app/frontend/src/app/pos/_components/StaffAccount.test.tsx` |

- Seeded `.e2e-spec.ts` files hit only public contracts. Executor may **not** edit them without Field's OK or a DR.
- Gate commands (all must pass):
  ```bash
  pnpm --filter @bar/contracts build
  pnpm --filter @bar/backend lint
  pnpm --filter @bar/backend typecheck
  pnpm --filter @bar/backend test
  pnpm --filter @bar/backend test:e2e
  pnpm --filter @bar/backend openapi:check
  pnpm --filter @bar/frontend lint
  pnpm --filter @bar/frontend typecheck
  pnpm --filter @bar/frontend test
  ```
- Run proof:
  ```bash
  docker compose -f infra/docker-compose.yml up -d postgres redis
  pnpm --filter @bar/contracts build
  pnpm --filter @bar/backend start:dev
  pnpm --filter @bar/frontend dev
  # In browser: open http://localhost:3010/login, verify demo buttons, click "ผู้จัดการ", verify POS loads with manager permissions, switch to "พนักงาน" via StaffAccount dropdown.
  ```
- Constraints:
  - Zero modifications to production LINE OAuth flow.
  - Strict production 404 guard in controller.
  - Frontend code tree-shakeable via `process.env.NODE_ENV !== 'production'`.

## 6. Planner Dry Run (completed before Ready)

| Check | Verified against repo (`path:line`) | Result |
|---|---|---|
| Existing schema / entities | `docs/schema.sql:137-182` · `app/backend/src/cli/seed-iam.ts:19-22` | `staff_user`, `staff_user_identity`, `user_group_membership`, and `staff_group` verified. Default group IDs in `app/backend/src/modules/iam/domain/default-groups.ts:2-6`. |
| Wiring & protected files | `docs/rules/agent-boundaries.md:10-56` | All code map files are non-protected app/contracts files. Zero protected files touched. |
| Packages & peer versions | `app/backend/package.json:44` · `app/frontend/package.json:19` | Existing `@nestjs/common`, `zod`, `@heroui/react` verified. Zero new packages. |
| Gate scripts exist | `app/backend/package.json:17-34` · `app/frontend/package.json:11-13` | `lint`, `typecheck`, `test`, `test:e2e`, `openapi:check` all verified. |
| E2e harness, imports & isolation | `app/backend/test/auth.e2e-spec.ts:1-73` | `app/backend/test/demo-login.e2e-spec.ts` written and verified against `bar_test` and test Redis. |
| Dependencies merged · parallel overlap | `git log -1 --oneline` -> `8b9b167` | Depends on none. Branch `main` clean. No parallel worktree. |
| UI tokens & components | `app/frontend/src/app/login/_components/LoginCard.tsx:3` · `app/frontend/src/app/pos/_components/StaffAccount.tsx:3` | `Button`, `Dropdown`, `Chip`, `Avatar` from `@heroui/react` verified in existing screens. |

## 7. Unlocked Protected Files & Pre-Decided Items

- **Unlocked protected files:**
  - `none`
- **Likely DRs:**
  - `none`
- **Pre-decided packages / endpoints:**
  - `POST /api/auth/demo-login` (`Source: Field, session instruction, 2026-11-01`)

## 8. Build Steps (inside → out · 1 step = 1 commit)

| # | Step | Done when | AC |
|---|---|---|---|
| 0 | Seed commit + verify seeded `app/backend/test/demo-login.e2e-spec.ts` fails red on assertion (404/not implemented) | Red assertion confirmed | — |
| 1 | Contracts: add `DemoLoginRoleSchema` and `DemoLoginRequestSchema` to `@bar/contracts` and export | `pnpm --filter @bar/contracts build` green | — |
| 2 | Backend service: implement `demoLogin(role)` in `AuthService` (find/provision demo user + createSession) | Unit test in `auth.service.spec.ts` green | AC-1 |
| 3 | Backend controller: add `@Post('demo-login')` in `AuthController` with production 404 guard and cookie writing | `demo-login.e2e-spec.ts` passes green + `openapi:check` green | AC-1, AC-2 |
| 4 | Frontend API & Login page: add `demoLogin` in `auth.ts`, create `DemoLoginSection.tsx`, wire into `LoginCard.tsx` under dev check | Frontend unit test green | AC-3 |
| 5 | Frontend POS header: add quick role switch in `StaffAccount.tsx` under dev check | Frontend unit test green | AC-4 |
| 6 | Run proof & gates: run all gate commands, manual browser check of login and role switch, record proof in handoff | All gates green | AC-1..4 |

## 9. Tasks

- [ ] (executor) Seed commit with draft brief + seeded `demo-login.e2e-spec.ts` on branch `feat/BRIEF-068-dev-demo-login`
- [ ] (executor) Step 0: Confirm red failure on seeded e2e
- [ ] (executor) Steps 1–5: Inside-out implementation
- [ ] (executor) Step 6: Full gates + run proof
- [ ] (auditor) Independent audit in separate session

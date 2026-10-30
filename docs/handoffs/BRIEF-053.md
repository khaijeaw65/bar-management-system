# Handoff — BRIEF-053 Backend: IAM core — catalog, default groups, permission resolver, enforced guard (I1)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-30 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-053-iam-core` (pushed, no PR until audit PASS) |
| **Commit** | Work SHA: see chat |
| **Status** | Implemented — waiting for `audit BRIEF-053` |

## Summary
- **Migration** `1763200000000-IamCore`: the 7 Staff IAM tables from `schema.sql` §3 (+ `updated_at` triggers on `staff_group`, `policy`), the 20-code catalog, 3 policies / 3 groups with fixed ids (`DEFAULT_GROUP_IDS`). No people.
- **Contracts:** `PERMISSION_CODES` / `PermissionCodeSchema`, `MyPermissionsSchema`, `MissingPermissionsSchema`; `ApiErrorData` gains `{ missing }`. `@RequirePermissions` is typed against the catalog — all existing routes already compiled.
- **IamModule:** `PermissionSource` port (+ TypeORM adapter — the only reader of IAM tables), `PermissionResolver` (cache `perms:{userId}:v{iamVersion}`, TTL = min(15 min, seconds to the next membership start/end), fails open to the DB), `IamVersion.bump()`, `IamEnforcement` (boot safety net), `GET /me/permissions`.
- **Guard:** real `PermissionsGuard` is an `APP_GUARD` in `AppModule` right after `JwtAuthGuard` (both registered there so the order is explicit; the old `JwtAuthGuard` registration moved out of `AuthModule`). 403 = `DomainException('FORBIDDEN', 'ไม่มีสิทธิ์ใช้งานส่วนนี้', 403, { missing })`. `@AnyStaff()` added; `/auth/me` carries it.
- **Seeds:** `src/cli/seed-iam.ts` (`seedStaffMember`, `seedRoster`, `parseOwners`; called directly by tests), `seed:staff --group`, new `seed:roster`, `DEV_OWNER_LINE_SUBS=` in `app/backend/.env.example`. CLIs bump `iam:version` over their own Redis connection (warn only if Redis is down).
- **Tests/helpers:** `insertStaff(dataSource, name, group = 'เจ้าของ')`, `clearStaffAndVenue` clears IAM rows; `updated-at-trigger` e2e now covers 17 tables and reverts `IamCore` first.
- **Size:** ≈ 1.64k net-new lines incl. tests (est. 0.9–1.1k; lockfile and `openapi.json` excluded) — race/auth-heavy backend ≈ 1.7× as in earlier sizing notes.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `test/iam-seed.e2e-spec.ts` |
| AC-2 | ✅ (see deviation 1) | `test/iam-guard.e2e-spec.ts` |
| AC-3 | ✅ | `iam-guard` |
| AC-4 | ✅ | `iam-guard` (ended / future) · `effective-access.spec.ts` · `permission-resolver.spec.ts` (TTL ≤ next change, fake clock) |
| AC-5 | ✅ | `permission-resolver.spec.ts` (hit, bump, Redis down) · `iam-guard` (spy on `codesFor`, Redis IAM keys failing) |
| AC-6 | ✅ | `iam-guard` (cookie vs Bearer, same body) |
| AC-7 | ✅ | `iam-guard` — inactive user with a live session: **200 with empty permissions/groups**, every permissioned route 403 (documented in `docs/api/README.md`) |
| AC-8 | ✅ | `test/route-permissions.e2e-spec.ts` (test-only controller flagged; real app clean) |
| AC-9 | ✅ | `iam-guard` "IAM safety net" describe (own app booted with no owner) · `iam-enforcement.spec.ts` |
| AC-10 | ✅ | `test/seed-roster.e2e-spec.ts` |
| AC-11 | ✅ | full backend e2e below |

## Gate Evidence (G1) — on work commit (see chat)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts build` / `test` | 0 | 98 passed (+3 new) |
| `pnpm --filter @bar/backend lint` / `typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 45 files · 199 passed (+20 new) |
| `pnpm --filter @bar/backend test:e2e` (run with `REDIS_URL=…/1`, see limitations) | 1 | 35 files · **234 passed, 1 failed** — `payment.e2e` "locks a 1240 promptpay bill… queues expiry" (BullMQ job already consumed, see limitations). Earlier full run also had one `menu-photos` `includeHidden` failure (create → 404); it passed alone twice and in the next full run — flaky, not reproduced |
| `pnpm --filter @bar/backend openapi:check` | 0 | no diff after commit |
| `pnpm --filter @bar/frontend typecheck` / `test` | 0 | pass · 50 files · 241 passed |

**Run proof** (dev `bar`, fresh backend `node dist/main.js` on :3021 from the work tree):
- `migration:run` applied `IamCore1763200000000`; boot log `WARN [IamEnforcement] IAM: no owner — permissions NOT enforced`; `/api/health` 200.
- `DEV_OWNER_LINE_SUBS="U-demo-owner:Field (demo)" pnpm seed:roster` → Field (demo) → เจ้าของ, Demo ผู้จัดการ → ผู้จัดการ, Demo พนักงาน → พนักงาน.
- `GET /api/me/permissions`: เจ้าของ 20 codes · ผู้จัดการ 18 · พนักงาน 12 (no `payments:mark_paid`, no `staff:manage`).
- Demo พนักงาน opened C1 and took an order (201); owner created a PromptPay payment; staff `mark-paid` → **403** `{"code":"FORBIDDEN","message":"ไม่มีสิทธิ์ใช้งานส่วนนี้","data":{"missing":["payments:mark_paid"]}}`; staff `PATCH /menu/items/:id` → 403 `menu:write`; staff `GET /reports/summary` → 403 `reports:read`; Demo ผู้จัดการ `PATCH /venue/payment-settings` → 403 `venue:update_payment`, `mark-paid` → 200, visit close → 200. (Tokens minted with `TokenService`; visit on C1 closed again.)
- **Audit Must fix 2 (done by Field, 2026-10-30):** `DEV_OWNER_LINE_SUBS` = Field's real LINE sub in `.env` → `pnpm seed:roster` (Field → เจ้าของ, Demo ผู้จัดการ, Demo พนักงาน) → Field signed in with LINE on `localhost:3010` (dev API :3011 on commit `5269a86`) → open table → order → checkout → close: no 403 anywhere. Staff-app Bearer path = AC-6 e2e.

## Sonar (local scan)
- Scanned commit: `1460fe9` + this brief's working tree (re-scanned after the S2871 fix) · Quality Gate: ERROR — `new_coverage` 0 % (no coverage report path, known follow-up) + `new_violations` 22.
- Issues by severity: BLOCKER 0 (rest: `pnpm sonar:report`). **Zero issues in files this brief authored** after fixing S2871 in `permission-resolver.service.ts`. The 22 remaining are in files it did not touch (setup.ts, MenuSwitch/MenuItemRow, order-query, request-hash, promptpay-payload, seed-menu-catalog, `customer.gateway.ts:53`, `table-seat.service.ts`, …) — same set as BRIEF-052.
- Who fixed: agent (Field's own brief).

## Decisions Raised
- none

## Audit round 1 fixes
- **Must fix 3** (`5269a86`): safety net = `everHadOwner()` only (any เจ้าของ membership row, whatever dates / `is_active`); e2e "expired or deactivated owner never switches enforcement off". Supersedes deviation 4's "live owner" wording.
- **Must fix 2:** done, see run proof. **Must fix 1 (done):** dev backends stopped (Field's OK), `pnpm --filter @bar/backend test:e2e` on default Redis, work commit `5269a86` → exit 0, **35 files · 236 passed, 0 failed** (the earlier `payment.e2e` / `menu-photos` failures were the dev workers).

## Deviations from Brief
1. **AC-2 manager/owner "mark-paid 200"** is tested against a real pending payment (`pendingPayment()` helper) — no deviation; noted because the cash flow in the brief text is `via: 'cash'`.
2. `APP_GUARD` for `JwtAuthGuard` moved from `AuthModule` to `AppModule` (next to `PermissionsGuard`) so the order is explicit; brief said "after JwtAuthGuard (order guaranteed)".
3. The old stub path `common/guards/permissions.guard.ts` is kept (existing tests import `PERMISSIONS_KEY` from it); it now imports the resolver from `modules/iam`.
4. Safety net re-checks lazily: a "no owner" answer is re-checked on every denied request (so seeding an owner enforces on the very next request); an "enforcing" answer is trusted for 60 s. A 60 s `setInterval` (unref'd) also refreshes and drives the once-a-minute warning.
5. IAM time uses real `new Date()`, not the business `CLOCK` — e2e overrides `CLOCK` with fixed past times and the JWT lifetime is real time anyway.

## Known Gaps / Follow-ups
- Not cached: inactive users (the cache can never serve a permission to a deactivated user before I2 bumps the version).
- WS `/staff` handshake still "any active staff" (out of scope).
- `?includeHidden` → `menu:write` still open (I3 / menu follow-up).
- The 22 old Sonar issues (see above) belong to a cleanup brief.

## AI Usage
**High** — Claude Code wrote the code and tests (Field's brief, full agent mode).

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-053`
- Contract comparison: brief §3 ↔ `permissions.ts` ↔ `MeController` ↔ OpenAPI ↔ migration seed ↔ `iam-seed` e2e (catalog + mapping equality) — consistent.

## Notes for Reviewer
- Start at `permission-resolver.service.ts`, `effective-access.ts`, `permissions.guard.ts`, `iam-enforcement.service.ts`, `1763200000000-IamCore.ts`.
- **Environment limitation:** two `nest start --watch` dev backends were running and I was not permitted to stop them, so I ran e2e with `REDIS_URL=redis://127.0.0.1:6379/1` (own Redis DB; BullMQ drops the DB index, BRIEF-013 S2, so it still shares the payment queue with those dev workers). That explains the one `payment.e2e` failure; please re-run `test:e2e` with the dev backends stopped.
- The bar_test database was dropped and re-created once after a half-reverted `updated-at-trigger` run (test DB only).
- A stale uncommitted edit to `docs/audits/BRIEF-051.md` (BRIEF-051 already merged) was saved as a patch in the session scratchpad and the file restored, with Field's OK.

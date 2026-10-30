# BRIEF-053 — Backend: IAM core — catalog, default groups, permission resolver, enforced guard (I1)

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts · tooling (seed CLI) · frontend (one line: none expected) |
| **Revision** | 1 |
| **Depends on** | BRIEF-007 / 015 ✅ (auth, JWT, `JwtAuthGuard` APP_GUARD) · BRIEF-021 ✅ (mobile Bearer) · all routes already carry `@RequirePermissions` — seed is based on an older local `main`: **merge `origin/main` first** |
| **References** | CLAUDE.md IAM model (LOCKED) · FRD §2 · CD-13 handoff R2, R3, R6, R7, R9 · DR-014 #8, #11 · BRIEF-027 AC-6 (`venue:update_payment` owner-only, `PermissionsGuard` as APP_GUARD) · `docs/schema.sql` §3 Staff IAM (tables exist in the ERD, not yet migrated) |
| **Audit depth** | Full (auth — every staff request) |
| **Size** | ~1.5 days · est. ~900–1,100 net-new lines incl. tests |

---

## Interview — Selected (by KJ), 2026-10-30
| Q | Selected (by KJ) |
|---|---|
| IAM split | **I1 core (this)** → I2 staff API (access requests, staff, time-bound memberships, lockout) → I3 groups / policies API (custom groups + policy matrix — Field: **include before 8 Nov**) → UI |
| Cache invalidation | Global version key: `perms:{userId}:v{iamVersion}`; any IAM write `INCR iam:version`; TTL capped at the user's nearest `valid_until` |
| Who becomes owner | Field (KJ) as เจ้าของ via seed; Metee → เจ้าของ when he joins; test staff seeded straight into a group — no UI needed for testing |
| Route without `@RequirePermissions` | Allowed for any logged-in staff, **but** a test fails if a staff route has neither `@RequirePermissions` nor an explicit `@AnyStaff()` |
| Client hiding | `GET /me/permissions` |
| Dev roster | `seed:roster` reads owner LINE subs from env (`DEV_OWNER_LINE_SUBS`), idempotent; real subs stay out of Git |
| *(proposed)* Default policies | table in §3 (Owner = all; Manager = all except `staff:manage`, `venue:update_payment`; Staff = floor work, no manual payment confirm) |
| *(proposed)* Boot safety net | no active staff in เจ้าของ → loud `warn` at boot and the guard **does not enforce** (logs every would-be 403) until one exists — a fresh DB can never lock everyone out |

## 1. Goal
Every staff request is authorised by the AWS-style IAM model: users get permissions from their groups' policies and their own policies (most-permissive wins, time-bound group membership), resolved per request through a Redis cache, enforced by `PermissionsGuard` on every route.

## 2. Scope
### In
- **Migration `IamCore`:** create `staff_group`, `user_group_membership` (`valid_from`, `valid_until` NULL = permanent, UNIQUE(user, group)), `policy`, `permission` (UNIQUE(resource, action)), `policy_permission`, `group_policy`, `user_policy` exactly as `docs/schema.sql` §3 (+ `updated_at` triggers, DR-023, on tables that have it). Seed rows: the permission catalog, 3 policies, 3 groups, group↔policy links (§3). **No people.** Stable seed ids/names so re-runs and later briefs can find them.
- **Permission catalog (contracts):** `PermissionCodeSchema` = the codes in §3 (`resource:action`); `@RequirePermissions` typed against it (a typo fails `typecheck`). Adds `staff:manage` now (used by I2/I3).
- **`IamModule`:** `PermissionResolver.effectiveFor(userId, now)` = union of (policies of groups where `valid_from <= now < valid_until OR valid_until IS NULL`) ∪ (user policies) → `Set<PermissionCode>`; inactive `staff_user` → empty set. **Cache:** Redis `perms:{userId}:v{iamVersion}` (JSON list), TTL = min(15 min, seconds to the nearest active membership's `valid_until`); `iam:version` read per request (one GET) — **fail open to the DB** if Redis is down (compute uncached, log). `IamVersion.bump()` for later briefs (I2/I3 call it on every IAM write).
- **`PermissionsGuard` (real) as `APP_GUARD`** after `JwtAuthGuard` (order guaranteed): `@Public()` → skip; no decorator → allow; else require **all** listed codes in the caller's set → else `403 FORBIDDEN` "ไม่มีสิทธิ์ใช้งานส่วนนี้" with `data: { missing: [...] }`. Works for cookie (web) and Bearer (mobile) callers alike. Remove the old stub.
- **`@AnyStaff()` decorator** (marker only) for logged-in routes that need no permission (e.g. `/auth/me`, `/me/permissions`, logout).
- **Route coverage test:** walks every controller route (Nest discovery / metadata) and fails if a non-`@Public()` route has neither `@RequirePermissions` nor `@AnyStaff()`; prints the offenders.
- **`GET /me/permissions`** (`@AnyStaff()`) → `{ permissions: PermissionCode[], groups: [{ id, name, validUntil }] }` from the same resolver/cache.
- **Boot safety net *(proposed)*:** on bootstrap and every 60 s (cheap count), if no active staff has a live เจ้าของ membership → `enforcing = false`, `warn` once per minute "IAM: no owner — permissions NOT enforced"; the guard logs would-be denials instead of throwing. Flips to enforcing as soon as an owner exists.
- **Seed CLI:** `seed:staff -- --line-user-id <sub> --name "<name>" --group <เจ้าของ|ผู้จัดการ|พนักงาน>` (default เจ้าของ; idempotent: creates or reuses the staff user, upserts a permanent membership, bumps `iam:version`) · new `seed:roster` — reads `DEV_OWNER_LINE_SUBS` (comma list `sub:Name`) from backend `.env` → เจ้าของ each; plus `Demo ผู้จัดการ` (`U-demo-manager`) and `Demo พนักงาน` (`U-demo-staff`) in their groups; idempotent. `.env.example` gets `DEV_OWNER_LINE_SUBS=` (empty).
- **Tests:** e2e helper `insertStaff(dataSource, name, group = 'เจ้าของ')` (membership inserted); `clearStaffAndVenue` deletes IAM rows in FK order; existing e2e stay green with the default.
- Contracts + OpenAPI (`/me/permissions`, 403 `data.missing`) + `docs/api/README.md` (permissions section: catalog, default policies, 403 shape).

### Out (do NOT build here)
- Access-request approve/reject, staff list/deactivate, membership editing, lockout errors `IAM_LOCKOUT` / `SELF_DEACTIVATE`, `GET /staff/:id/effective-permissions` (I2) · group / policy CRUD and the matrix (I3) · any UI (after I2/I3) · WS `/staff` handshake permission checks (stays "any active staff") · POS PIN (DR-014 #8, later) · `orders:comp` / `orders:void` (BRIEF-018 adds them) · `?includeHidden` → `menu:write` (I3 or menu follow-up).

## 3. Contract
**Permission catalog** (`PermissionCodeSchema`): `menu:read`, `menu:write`, `menu:toggle_availability`, `orders:read`, `orders:create`, `orders:update_status`, `payments:read`, `payments:create`, `payments:mark_paid`, `reports:read`, `tables:read`, `tables:manage`, `visits:read`, `visits:open`, `visits:close`, `venue:read`, `venue:update`, `venue:read_payment`, `venue:update_payment`, `staff:manage`.

**Default policies → groups *(proposed)*:**
| Policy (group) | Permissions |
|---|---|
| **ทั้งหมด** (เจ้าของ) | every code |
| **จัดการร้าน** (ผู้จัดการ) | every code **except** `staff:manage`, `venue:update_payment` |
| **งานพนักงาน** (พนักงาน) | `menu:read`, `menu:toggle_availability`, `orders:read`, `orders:create`, `orders:update_status`, `tables:read`, `visits:read`, `visits:open`, `visits:close`, `payments:read`, `payments:create`, `venue:read` |
- Rationale: `payments:create` covers QR + slip verify (DR-027) for staff; manual confirm (`payments:mark_paid`) stays manager+ (DR-014: manual = flagged exception); `venue:update_payment` owner-only (BRIEF-027 AC-6); reports, menu edit, table setup = manager+.

| Method | Path | Auth | → |
|---|---|---|---|
| GET | `/me/permissions` | staff (`@AnyStaff()`) | `{ permissions: PermissionCode[], groups: { id, name, validUntil: IsoDateTime \| null }[] }` |
- **403 shape:** `{ status: 403, code: 'FORBIDDEN', message: 'ไม่มีสิทธิ์ใช้งานส่วนนี้', data: { missing: PermissionCode[] } }` (DR-021 envelope).
- **Business rules:** most-permissive wins, no explicit deny (CLAUDE.md) · membership counts only inside `[valid_from, valid_until)` (CD-13 D1, "ถึงสิ้นกะคืนนี้" = next 06:00 is I2's job to write) · inactive staff → no permissions · cache can never outlive a membership end.

## 4. Acceptance Criteria
- **AC-1** — Fresh DB after migrations: catalog has exactly the §3 codes; 3 policies and 3 groups with the §3 mapping; zero memberships.
- **AC-2** — A พนักงาน user: `POST /visits/:id/orders` 201; `POST /payments/:id/mark-paid` **403** with `data.missing = ['payments:mark_paid']`; `PATCH /menu/items/:id` 403; `GET /reports/…` 403. A ผู้จัดการ: mark-paid 200, `PATCH /venue/payment…` (update_payment) 403. A เจ้าของ: both 200.
- **AC-3** — Most-permissive wins: a พนักงาน with a direct user policy `จัดการร้าน` → mark-paid 200.
- **AC-4** — Time-bound: membership with `valid_until` in the past → no permissions from it; `valid_from` in the future → none yet; the cached set expires no later than `valid_until` (fake clock / short TTL).
- **AC-5** — Cache: second request hits Redis (no resolver DB query — spy/count); `iam:version` bump → next request recomputes; Redis down → requests still authorised correctly from the DB.
- **AC-6** — Mobile Bearer caller gets the same allow/deny as the web cookie caller for the same user.
- **AC-7** — `GET /me/permissions` returns the caller's codes and groups (with `validUntil`); for an inactive user → 401 (existing auth) or empty — whichever the current auth does, documented.
- **AC-8** — Route coverage test fails on a route with no decorator (proved with a test-only controller) and passes on the real app.
- **AC-9** — Safety net: DB with no owner → guard does not throw (would-be 403 logged) and a `warn` is logged; after `seed:staff --group เจ้าของ`, the next request is enforced (AC-2 behaviour).
- **AC-10** — `seed:staff` and `seed:roster` are idempotent (run twice → same rows, one membership each); `seed:roster` with `DEV_OWNER_LINE_SUBS="U1:Field,U2:Metee"` → both in เจ้าของ + the two demo staff in their groups.
- **AC-11** — All existing backend e2e pass with the new `insertStaff` default (เจ้าของ); gates + run proof pass.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1 | integration | `app/backend/test/iam-seed.e2e-spec.ts` |
| AC-2 – AC-7, AC-9 | integration (real Postgres + Redis, web cookie + Bearer) | `app/backend/test/iam-guard.e2e-spec.ts` |
| AC-4, AC-5 | unit (resolver + cache with fake clock / fake Redis) | `modules/iam/application/*.spec.ts` |
| AC-8 | unit / integration (Nest discovery) | `app/backend/test/route-permissions.e2e-spec.ts` |
| AC-10 | integration (CLI functions called directly) | `app/backend/test/seed-roster.e2e-spec.ts` |

Gate commands (all must pass):
```bash
pnpm --filter @bar/contracts build && pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck && pnpm --filter @bar/backend test && pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:check
pnpm --filter @bar/frontend typecheck && pnpm --filter @bar/frontend test   # contracts changed; no UI change expected
```
Run proof (real stack, ports BRIEF-046; stop dev servers before e2e): `migration:run` → boot shows the "no owner" warning → `seed:roster` (with your sub in `DEV_OWNER_LINE_SUBS`) → warning gone → log in with LINE as Field → POS works end to end (tables, order, checkout) → `GET /api/me/permissions` lists every code → log in as `Demo พนักงาน` (minted token) → mark-paid on a pending payment → 403 with `missing`; take an order → 201. Trimmed output in the handoff.

### Local Sonar scan
- **Required: yes.**

## 6. Constraints
- Never inline permission checks in controllers — only `@RequirePermissions` + the guard (CLAUDE.md).
- The resolver is the only place that reads IAM tables for authorisation; other modules use `/me/permissions` or the guard.
- `save()` on audited entities; `updated_at` from triggers; IAM writes in seeds bump `iam:version`.
- No new dependency (Nest `DiscoveryService` is in `@nestjs/core`).
- Redis is a cache only: correctness never depends on it (DR-028 spirit).

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):** migration tables/columns = `docs/schema.sql` §3 (no schema change beyond what the ERD already shows, + `updated_at` triggers) · catalog and default mapping in §3 (once Field approves the *(proposed)* rows) · cache key/TTL rule · `PermissionsGuard` as `APP_GUARD` · `@AnyStaff()` · `GET /me/permissions` · `seed:staff --group`, `seed:roster`, env key `DEV_OWNER_LINE_SUBS` · boot safety net.
- **Stop and raise a DR if:** a column outside `docs/schema.sql` §3 seems needed · a route can't be expressed with the catalog · WS or customer auth needs to change.

## 8. Unlocked Protected Files
- `.env.example` (add `DEV_OWNER_LINE_SUBS=`)

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2 (≤ 3 working days)
- [x] No unresolved decision blocking the main outcome
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-30 | Initial Draft (Cowork) — IAM I1 core |

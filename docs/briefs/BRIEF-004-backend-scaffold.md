# BRIEF-004 — Backend scaffold: config, database, CLS, migrations, health

| | |
|---|---|
| **Status** | Ready |
| **Implementer** | Field (Cursor primary) |
| **Affected apps** | backend · infra (`infra/docker-compose.yml`) |
| **Revision** | 1 |
| **Depends on** | BRIEF-003 (Done). **Runs in parallel with BRIEF-005** (workflow §4 exception: own worktree, own agent) — no shared files except `pnpm-lock.yaml` (see §6) |
| **References** | `docs/rules/backend.md` (Config, TypeORM, AuditSubscriber, Transaction) · DR-001 (`infra/`) · DR-004 (one Zod version) · `docs/infra.md` (PG 16) |
| **Audit depth** | Full — every later backend brief builds on this |

---

## 1. Goal
The backend boots against a real PostgreSQL 16, with typed config, CLS request context, the `AuditSubscriber` registered, a working migration pipeline, and a `GET /api/health` endpoint proven by an e2e test in CI. After this, a domain brief (auth, IAM, menu) only adds its module, entities and migration.

## 2. Scope
### In
- **Local infra:** `infra/docker-compose.yml` — `postgres:16-alpine` (user/password/db `bar`, port 5432, named volume) and `redis:7-alpine` (port 6379; not wired into the app yet). `app/backend/.env.example` with every variable §3 reads. `.env` stays gitignored.
- **Config:** `@nestjs/config` global. `src/config/` with `registerAs('app' | 'database', …)`. Env validated **once at boot** with a Zod schema; a missing/invalid variable fails startup with a readable message.
- **Database:** `TypeOrmModule.forRootAsync` from config. `synchronize: false`, `migrationsRun: false`, `autoLoadEntities: true`, snake-case naming strategy (§6), SSL per `backend.md` (off when `NODE_ENV` is `local` or `test`).
- **Migrations:** `src/database/data-source.ts` (standalone `DataSource` for the TypeORM CLI, same config). Scripts `migration:create`, `migration:generate`, `migration:run`, `migration:revert` in `app/backend/package.json`. **One** migration `…-InitExtensions.ts`: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"` (schema.sql uses `uuid_generate_v4()`), `down` drops it.
- **CLS:** `ClsModule.forRoot` global, `middleware: { mount: true }`, plus the transactional plugin (`@nestjs-cls/transactional` + TypeORM adapter) so `@Transactional()` works in later briefs. `ClsUserInterceptor` registered as `APP_INTERCEPTOR`.
- **Audit:** `AuditSubscriber` provided once in `AppModule` (see §6 about double registration).
- **Bootstrap:** `src/bootstrap/configure-app.ts` — `setGlobalPrefix('api')`, `enableShutdownHooks()`, global `HttpExceptionFilter` (existing in `common/filters`). Used by **both** `main.ts` and the e2e test, so tests run the same app setup as production. Default port **3001** (`core.md`).
- **Health:** `GET /api/health` → `200 { status: 'ok', db: 'up' }` after `SELECT 1`; `503 { status: 'error', db: 'down' }` when the query fails. Lives in `src/health/` (controller + tiny service, no module port — it's infra).
- **Remove** the Nest starter `AppController` / `AppService` and its spec (replaced by health).
- **e2e:** `test/health.e2e-spec.ts` boots `AppModule` through `configureApp`, runs pending migrations, asserts `GET /api/health` = 200 + body. Replaces `app.e2e-spec.ts`.
- **Unit:** health service returns `down` when the DB query throws (mocked `DataSource`).
- `app/backend/README.md` (≤ 25 lines): start compose, copy `.env.example`, run migrations, start dev, run tests.

### Out (do NOT build here)
- Any domain module, entity or table from `schema.sql` (auth, IAM, menu… come with their briefs, each with its own migration).
- Redis client, BullMQ, WebSocket gateway, `PermissionsGuard` wiring, JWT/Passport strategies, cookie parsing, CORS (auth brief sets CORS with the frontend origin).
- `@nestjs/terminus` or any health library.
- CI workflow changes — `ci.yml` already provides Postgres with `PG*` env vars; config must read those names (§3).
- Empty module folders / stubs for the other 9 modules. Existing empty folders under `src/modules/` may be deleted.

## 3. Contract
- **Endpoint:** `GET /api/health` — `@Public()`-ready (no guard exists yet) → `{ status: 'ok' | 'error', db: 'up' | 'down' }`.
- **Env vars (exact names):** `NODE_ENV` (`local` | `test` | `production`), `PORT` (default `3001`), `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`. Same names CI already sets — no CI change.
- **Contracts package:** no change.

## 4. Acceptance Criteria
- **AC-1** — Given `docker compose -f infra/docker-compose.yml up -d` and a `.env` copied from `.env.example`, when `pnpm --filter @bar/backend migration:run` runs, then the InitExtensions migration applies and a second run reports nothing pending.
- **AC-2** — `migration:revert` rolls it back cleanly.
- **AC-3** — Given the DB is up, `GET /api/health` → 200 `{ status: 'ok', db: 'up' }`.
- **AC-4** — Given the DB query fails, the health service reports `down` and the endpoint returns 503 (unit test).
- **AC-5** — Given `PGHOST` is missing, the app refuses to start and the error names the variable.
- **AC-6** — `AuditSubscriber` is registered exactly once (unit/e2e assertion on `dataSource.subscribers`).
- **AC-7** — `synchronize` is `false` in both the Nest config and `data-source.ts` (assert in a unit test on the config factory).
- **AC-8** — `pnpm --filter @bar/backend lint | typecheck | test | test:e2e | build` all exit 0; `ci` green (CI runs the health e2e against its Postgres service).
- **AC-9** — `pnpm install --frozen-lockfile` passes with pnpm 10.x; no packages beyond §7.

## 5. Test Gate
| AC | Test type | Location |
|---|---|---|
| AC-1, AC-2 | manual command output | handoff |
| AC-3 | e2e | `test/health.e2e-spec.ts` |
| AC-4, AC-7 | unit | `src/health/*.spec.ts`, `src/config/*.spec.ts` |
| AC-5 | unit (schema parse) | `src/config/env.schema.spec.ts` |
| AC-6 | e2e | `test/health.e2e-spec.ts` |
| AC-8, AC-9 | command output + `ci` link | handoff |

```bash
pnpm --filter @bar/backend lint
pnpm --filter @bar/backend typecheck
pnpm --filter @bar/backend test
pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend build
```

## 6. Constraints
- **Naming strategy:** `typeorm-naming-strategies` only supports TypeORM 0.3 (peer dep), so **do not install it**. Write `src/common/database/snake-naming.strategy.ts` (extends `DefaultNamingStrategy`, uses TypeORM's `snakeCase`) — ≤ 40 lines with a unit test for column + join column names. Pre-decided, not a hand-roll workaround.
- **AuditSubscriber double registration:** the current class both has `@EventSubscriber()` and pushes itself into `dataSource.subscribers` in its constructor. Keep **one** path: Nest provider + constructor push; do **not** also list it in `subscribers: [...]` of the TypeORM options. Remove the `@EventSubscriber()` decorator if it causes a second registration.
- **Migrations only** — `synchronize: true` anywhere is an automatic FAIL.
- ESM + `.js` relative imports; TypeORM CLI must run the ESM data source (document the exact command in the README).
- **Lockfile & parallel work:** BRIEF-005 also changes `pnpm-lock.yaml`. Whichever PR merges second: `git fetch && git merge origin/main`, then `git checkout origin/main -- pnpm-lock.yaml && pnpm install` and commit the regenerated lockfile. Routine under Rev 11 — no DR.
- Do not touch `app/frontend/**`, `app/packages/**`, `.github/**`, `turbo.json`.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact only):**
  | Package | Range | Note |
  |---|---|---|
  | `pg` | `^8.23.0` | PostgreSQL driver |
  | `@nestjs/config` | `^12.0.1` | matches Nest 12 |
  | `zod` | `4.6.5` (exact) | DR-004: one Zod version workspace-wide; contracts + frontend pin the same when they add it |
  | `@nestjs-cls/transactional` | `^3.3.1` | 4.x needs `nestjs-cls` 7 — we stay on 6.x (BRIEF-003) |
  | `@nestjs-cls/transactional-adapter-typeorm` | `^1.4.1` | supports TypeORM 1.x + `nestjs-cls` 6 |
  | dev: `@types/pg` | `^8.23.1` | |
- **Pre-decided (paths):** `infra/docker-compose.yml` (new), `app/backend/**` as in §2.
- **Likely DRs:** TypeORM CLI can't load the ESM data source without an extra loader package · the transactional adapter fails with TypeORM 1.x · anything needing a change to `ci.yml`.

## 8. Unlocked Protected Files
- `infra/docker-compose.yml`

---

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-09-24 | Initial draft (Cowork) |
| 1 | 2026-09-24 | Ready — approved by Field in session 2026-09-24 (parallel via workflow Rev 13) |

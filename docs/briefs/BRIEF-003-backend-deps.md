# BRIEF-003 — Backend scaffold dependencies: make `typecheck` cover all of `src/`

| | |
|---|---|
| **Status** | Done |
| **Implementer** | Field (Cursor primary) |
| **Affected apps** | backend |
| **Revision** | 1 |
| **Depends on** | BRIEF-001 (merged — creates the `typecheck` script, the CI gate and the temporary `exclude`) |
| **References** | DR-006 (this brief removes its temporary `exclude`) · DR-005 (auth — JWT/Passport are used later, not wired here) · `docs/rules/backend.md` |
| **Audit depth** | Compact — dependency install + compile fixes, no behavior |

---

## 1. Goal
The packages the existing backend scaffold already imports are installed, the DR-006 `exclude` is gone, and `pnpm --filter @bar/backend typecheck` checks every file in `src/` and `test/`.

## 2. Scope
### In
- Add the packages in §7 to `app/backend/package.json` (from the repo root: `pnpm --filter @bar/backend add …`), using pnpm 10 (root `packageManager`) so the lockfile matches CI.
- Remove the DR-006 `exclude` entries (and its comment) from `app/backend/tsconfig.json`.
- Fix **compile errors only** in the scaffold files that were excluded (`src/common/**`, `src/modules/auth/**`) — e.g. TypeORM 1.x type/API renames. Keep each file's intent; no new logic.

### Out (do NOT build here)
- Wiring any of these into `AppModule` (no `TypeOrmModule.forRoot`, no `ClsModule`, no `AuthModule` import) — the backend scaffold brief does that.
- Database driver `pg`, DB connection, migrations, `infra/docker-compose.yml`.
- Implementing auth strategies, guards or the permission cache (stubs stay stubs).
- `passport-jwt`, `passport-line` or any strategy package — chosen with the auth brief (DR-005).
- Any change to `turbo.json`, root `package.json`, CI workflow, frontend, contracts.

## 3. Contract
- **Endpoints / WS events / contracts:** none.
- **Runtime behavior:** unchanged — `GET /` e2e still passes; `AppModule` imports are unchanged.

## 4. Acceptance Criteria
- **AC-1** — `app/backend/package.json` contains exactly the §7 packages as new entries; nothing else in `dependencies`/`devDependencies` changes.
- **AC-2** — `app/backend/tsconfig.json` has no `exclude` for `src/common` or `src/modules`; the DR-006 comment is gone.
- **AC-3** — `pnpm --filter @bar/backend typecheck` exits 0.
- **AC-4** — `pnpm --filter @bar/backend lint`, `test`, `test:e2e` still pass.
- **AC-5** — `pnpm install --frozen-lockfile` passes from a clean clone with pnpm 10.x; the lockfile diff only adds the §7 packages and their transitive deps.
- **AC-6** — `git diff origin/main -- app/backend/src/app.module.ts` is empty.
- **AC-7** — The `ci` check on the PR is green.
- **AC-8** — `pnpm --filter @bar/backend build` exits 0 (`tsconfig.build.json` has its own `exclude`, so `nest build` compiles the scaffold files — BRIEF-001 audit F3).

## 5. Test Gate
| AC | Evidence |
|---|---|
| AC-1, AC-2, AC-6 | diff in the PR |
| AC-3, AC-4, AC-8 | command output in the handoff |
| AC-5 | `pnpm --version` + `pnpm install --frozen-lockfile` output |
| AC-7 | green `ci` run link |

```bash
pnpm --filter @bar/backend lint
pnpm --filter @bar/backend typecheck
pnpm --filter @bar/backend test
pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend build
```

## 6. Constraints
- Compile fixes must not change what a file does. If a scaffold file can't compile without a design choice (e.g. how audit columns are filled under TypeORM 1.x) → stop that file, raise a DR.
- ESM + `.js` extensions on relative imports (`core.md`).
- `save()` not `update()` rule untouched — no service code is written here.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact only):**
  | Package | Range | Why |
  |---|---|---|
  | `typeorm` | `^1.1.1` | v1 stable since May 2026; `@nestjs/typeorm` 12 supports it — avoids a 0.3 → 1.x migration later |
  | `@nestjs/typeorm` | `^12.0.1` | matches NestJS 12 |
  | `nestjs-cls` | `^6.3.1` | supports NestJS 12; 7.0.0 is a 4-day-old major — upgrade later on purpose |
  | `@nestjs/jwt` | `^12.0.2` | matches NestJS 12 |
  | `@nestjs/passport` | `^12.0.0` | matches NestJS 12 |
  | `passport` | `^0.7.0` | required peer of `@nestjs/passport` |
- **Likely DRs:** a peer-dependency error that needs another package · a scaffold file that needs a design decision to compile.

## 8. Unlocked Protected Files
- `none` (`app/backend/package.json` changes are covered by §7 Pre-decided)

---

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-09-24 | Initial draft (Cowork) from DR-006 |
| 1 | 2026-09-24 | AC-8 added (backend build, BRIEF-001 audit F3). Ready — approved by Field in session 2026-09-24 |
| 1 | 2026-09-24 | Done — merged in PR #13, handoff + audit (PASS) in PR #14. Set by Cowork on Field's explicit instruction |

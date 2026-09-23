# Handoff — BRIEF-003 Backend scaffold dependencies

| | |
|---|---|
| **Implementer** | Field (Cursor) |
| **Date** | 2026-09-24 |
| **Brief revision** | 1 |
| **Branch / PR** | `feat/BRIEF-003-backend-deps` · PR #13 (merged). This file is on `docs/BRIEF-003-handoff`. |
| **Commit** | `7652f12` (green `ci`; local gates on the same backend tree, `765afc6`) |
| **Status** | Implemented — awaiting audit |

> Created at `Implemented`. Update it if review requests changes. Frozen at merge.

## Summary
The six pre-decided packages are installed on `@bar/backend`, and the DR-006 temporary `exclude` is gone. `pnpm --filter @bar/backend typecheck` now includes `src/common/**` and `src/modules/auth/**`. Those files compiled as written, so no scaffold source changed. `AppModule` is unchanged.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `app/backend/package.json` adds only `typeorm@^1.1.1`, `@nestjs/typeorm@^12.0.1`, `nestjs-cls@^6.3.1`, `@nestjs/jwt@^12.0.2`, `@nestjs/passport@^12.0.0`, `passport@^0.7.0` |
| AC-2 | ✅ | `app/backend/tsconfig.json` — no `src/common` / `src/modules` exclude; DR-006 comment removed |
| AC-3 | ✅ | `pnpm --filter @bar/backend typecheck` exit 0; `tsc --listFiles` includes the former exclude set |
| AC-4 | ✅ | lint exit 0 · test 1 passed · test:e2e 1 passed |
| AC-5 | ✅ | `pnpm --version` 10.0.0 · `pnpm install --frozen-lockfile` exit 0 in a tree with no `node_modules`. Lockfile diff is additions only: the six packages and their transitive deps |
| AC-6 | ✅ | `git diff origin/main -- app/backend/src/app.module.ts` empty at `765afc6` |
| AC-7 | ✅ | `ci` success on `7652f12`: https://github.com/khaijeaw65/bar-management-system/actions/runs/35903904858 |
| AC-8 | ✅ | `pnpm --filter @bar/backend build` exit 0 |

## Gate Evidence (G1)
Local commands on the `765afc6` tree (`pnpm --version` 10.0.0). `7652f12` changes only `docs/rules/workflow.md`. CI on `7652f12` re-ran the backend gates and succeeded.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/backend lint` | 0 | pass (4 oxlint warnings, 0 errors — unused imports already in `auth.controller.ts`) |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 1 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/backend test:e2e` | 0 | 1 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/backend build` | 0 | pass |
| `pnpm install --frozen-lockfile` | 0 | pass from a clean tree, pnpm 10.0.0 |

## Decisions Raised
- None. Packages are the Rev 1 Pre-decided list. DR-006 stays Approved.

## Deviations from Brief
- None.

## Known Gaps / Follow-ups
- Auth strategies, `AuthModule` wiring, `TypeOrmModule.forRoot`, and `ClsModule` stay out of scope for the backend scaffold brief.
- `auth.controller.ts` still imports `Post`, `Req`, `Res`, and `Body` unused. Left as-is: they are not compile errors, and the brief allows compile fixes only.
- CI annotations on the green run are those four lint warnings, plus the existing Node 20 / `ubuntu-latest` runner notices. They did not fail `ci`.

## AI Usage
**High** — Cursor: installed the pre-decided packages, removed the exclude, ran G1, wrote this handoff.

## Notes for Reviewer
- Look at `app/backend/package.json`, `app/backend/tsconfig.json`, and `pnpm-lock.yaml`. No file under `app/backend/src/` changed.
- `7652f12` is Cowork's workflow Rev 12 commit on the same branch. It is not part of the dependency change.
- PR #13 is already merged (`a162621`). This handoff was written after that merge.

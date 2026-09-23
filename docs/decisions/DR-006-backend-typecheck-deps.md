# DR-006 — Backend typecheck fails on scaffold imports

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Cursor (KJ session) · 2026-09-24 |
| **Brief** | BRIEF-001 |
| **Category** | Dependency |

## Context
BRIEF-001 Pre-decided adds `"typecheck": "tsc --noEmit"` to `@bar/backend` and AC-7 requires that script to pass. No new dependency is pre-decided. `tsc --noEmit` currently exits 2.

Missing modules (not in `app/backend/package.json`):

| Module | Files |
|---|---|
| `typeorm` | `src/common/base/base.entity.ts`, `src/common/subscribers/audit.subscriber.ts` |
| `@nestjs/typeorm` | `src/common/subscribers/audit.subscriber.ts` |
| `nestjs-cls` | `src/common/subscribers/audit.subscriber.ts`, `src/common/interceptors/cls-user.interceptor.ts` |
| `@nestjs/jwt` | `src/modules/auth/auth.module.ts`, `src/modules/auth/application/auth.service.ts` |
| `@nestjs/passport` | `src/modules/auth/**` (module, controller, three strategies) |

Separate resolution failure, package already installed: `test/app.e2e-spec.ts` imports `App` from `supertest/types`. `@types/supertest@7.2.1` has `types.d.ts`, but `moduleResolution: nodenext` does not resolve that subpath. Runtime e2e already passes without it.

Frontend `tsc --noEmit` passes. Backend lint, unit test, and e2e pass. CI on this branch will run backend typecheck (package.json changes) and stay red until this is decided. Adding the five packages here was not done — versions are unspecified, and jwt/passport are auth dependencies.

## Options
**A) Narrow the compiler input. No new packages.** Exclude the scaffold files above from `app/backend/tsconfig.json`. In the e2e spec, drop the `supertest/types` import and type the app as `INestApplication`. The backend scaffold brief adds the real packages and removes the exclude.
**B) Add the five packages in BRIEF-001** so `tsc` resolves the imports. Versions and whether the auth stubs then typecheck are still open. Pulls auth and TypeORM into the CI brief.

## Recommendation
**A.** AC-7 needs a green `tsc --noEmit` without choosing TypeORM, CLS, JWT, or Passport versions. Those belong to the backend scaffold brief. The e2e change uses types already installed.

---

## Decision — Field only
**Decision:** Approved with change: A, plus (1) the `exclude` in `app/backend/tsconfig.json` carries a comment `temporary — removed by BRIEF-003 (DR-006)`; (2) BRIEF-003 installs the packages and must remove the `exclude` as an acceptance criterion
**Why:** TypeORM / CLS / JWT / Passport versions are a backend decision, not part of the CI brief. A temporary exclude only stays temporary if a named brief is forced to remove it.
**Date:** 2026-09-24 · recorded by Cowork on Field's explicit instruction (planning session); Field signs off by merging the PR

# BRIEF-067 — Backend: enforce AST class-file check, oxlint config & full abstract-class port migration

| | |
|---|---|
| **Owner** | Field |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) — Field instruction/date; fallback reason: none |
| **Affected apps** | backend |
| **Feature** | `standalone — single-slice brief` |
| **References** | `docs/rules/backend.md` (field-kit `backend-nestjs` pack) · `docs/rules/core.md` · BRIEF-019 · BRIEF-020 |
| **Status** | Ready — Rev 1 approved by Field 2026-11-01 (in session: Q1 ok, Q2 = B all ports, Q3 = 40 lines from kit) |
| **Revision** | 1 |
| **Depends on** | `BRIEF-064` — merged (`9e59dfa`) · **Unblocks** `BRIEF-066` |
| **Size** | ACs 6 (≤8) · flows 0 (≤1) · files ~55 (>10) · migrations 0 (≤1) · new patterns 0 (≤1) → `owner-accepted oversize` (Field Q2 = B, mechanical cross-module rule alignment) |
| **Audit depth** | Full (cross-module backend refactor & lint gate wiring) |

## 1. Goal

Wire the real `field-kit` TypeScript-AST class-file checker and `oxlint.json` into `@bar/backend lint`, eliminate all 26 class-file violations and 21 `oxlint` violations, move `NotificationsService` behind an abstract repository port, and migrate all 20 `Symbol()` ports to `export abstract class` ports across the backend without changing any HTTP/WS behavior.

## 2. Scope

**In:**
- Replace regex `app/backend/scripts/check-class-files.mjs` with the TypeScript-AST checker (`ts.createSourceFile`) that enforces 1 class per file, zero module-level functions/arrow consts, and zero `type`/`interface` declarations in class files.
- Wire `-c oxlint.json` into `app/backend/package.json` `lint` script and align `app/backend/oxlint.json` with `docs/rules/backend.md` Hard Limits (`max-lines: 300`, `max-lines-per-function: 40`, `max-depth: 2`, `@typescript-eslint/no-explicit-any: "error"`, `typescript/explicit-member-accessibility: "error"`, `typescript/explicit-module-boundary-types: "error"`); remove stale `app/backend/pnpm-lock.yaml`.
- Fix all **26 AST class-file violations** across `common/`, `providers/`, and `modules/` (extract 13 inline `type`/`interface` blocks to `*.types.ts` and split 4 multi-class files into one class per file).
- Fix all **21 `oxlint -c oxlint.json` violations** (9 `max-depth` > 2 blocks, 3 files > 300 lines, 1 method > 40 lines, 6 missing return types, 2 missing accessibility modifiers).
- Extract a repository port (`export abstract class INotificationRepository` in `domain/ports/notification.repository.port.ts` + `NotificationTypeOrmRepository` in `infrastructure/persistence/notification.typeorm-repository.ts`) for `NotificationsService` so zero services outside `persistence/` inject `@InjectRepository`.
- Migrate all **20 existing `Symbol()` port tokens** across `common/clock.ts`, `auth`, `customer`, `iam`, `menu`, `notifications`, `order`, `payment`, `reports`, and `venue` to `export abstract class` ports (`public abstract` methods, bound via `{ provide: PortClass, useClass: AdapterClass }`, injected by class type without `@Inject(SYMBOL)`).

**Out:**
- No API route, payload, database schema, or migration changes.
- No frontend (`app/frontend`) or mobile (`app/mobile`) changes.

## 3. Standalone Design & Contract *(omit when linked to `docs/features/<feature>/`)*

### As-is (`path:line` evidence from repo)
1. **Why lint passed while rules were broken (2 root causes):**
   - `app/backend/package.json:17` runs `oxlint src/ test/ && node scripts/check-class-files.mjs` **without `-c oxlint.json`**. Because `oxlint` only auto-loads `.oxlintrc.json`, every rule in `app/backend/oxlint.json:1-30` was silently ignored in local runs and CI.
   - `app/backend/scripts/check-class-files.mjs:124-130` used a regex scanner that only checked `function` and arrow consts — it did not check for a second `class` in a file or `interface`/`type` declarations in a class file.
2. **26 AST `check-class-files` violations (`src/`):**
   - **Multi-class files (4 files, 6 extra classes):**
     - `src/modules/customer/infrastructure/http/customer-session.controller.ts:73` (`CustomerQrController` + `CustomerSessionController`)
     - `src/modules/iam/infrastructure/http/iam-admin.controller.ts:51,140` (`AccessRequestsController` + `StaffGroupsController` + `PoliciesController`)
     - `src/modules/iam/infrastructure/http/staff.controller.ts:91` (`MeController` + `StaffController`)
     - `src/modules/iam/infrastructure/persistence/iam-write-guard.ts:9,16` (`LastOwnerError` + `Refused` + `IamWriteGuard`)
   - **Types/interfaces inside class files (13 files, 20 types):**
     - `src/common/storage/storage.service.ts:29,35` (`PresignedUpload`, `StoredObject`)
     - `src/providers/config/storage/config.service.ts:4` (`StorageCredentials`)
     - `src/modules/customer/infrastructure/persistence/guest-session.typeorm-repository.ts:31` (`SessionJoinRow`)
     - `src/modules/iam/infrastructure/persistence/permission-source.typeorm.ts:8` (`MembershipSql`)
     - `src/modules/iam/infrastructure/persistence/staff-admin.typeorm-repository.ts:18,29,36` (`RequestSql`, `StaffSql`, `MembershipSql`)
     - `src/modules/menu/application/menu-catalog.service.ts:25,32,44` (`MenuListQuery`, `OrderableVariant`, `OrderableLookup`)
     - `src/modules/menu/application/menu-photo.service.ts:7` (`AttachedPhoto`)
     - `src/modules/menu/infrastructure/persistence/menu-catalog.typeorm-repository.ts:20` (`ModifierRow`)
     - `src/modules/notifications/notifications.service.ts:19,21` (`TabChangedSink`, `SeatVisitOpenedSink`)
     - `src/modules/order/application/order.service.ts:149` (`PlacedOrder`)
     - `src/modules/order/application/ticket.service.ts:30,32` (`TicketEvent`, `ResolvedTicket`)
     - `src/modules/reports/infrastructure/persistence/reports.typeorm-queries.ts:28` (`Row`)
     - `src/modules/venue/application/venue-settings.service.ts:190` (`StoredSettings`)
3. **21 `oxlint -c oxlint.json` violations (with kit limits: `max-lines: 300`, `max-lines-per-function: 40`, `max-depth: 2`):**
   - `max-depth` (9): `src/cli/seed-menu-catalog.ts:249`, `src/modules/order/application/sold-out.service.ts:103,105,111`, `src/modules/order/application/order-query.service.ts:92-95`, `src/modules/menu/infrastructure/persistence/menu-write.typeorm-repository.ts:235`
   - `max-lines` > 300 non-blank/comment lines (3): `src/modules/auth/application/auth.service.ts` (326), `src/modules/menu/infrastructure/persistence/menu-catalog.typeorm-repository.ts` (322), `src/modules/payment/application/payment.service.ts` (314)
   - `max-lines-per-function` > 40 (1): `src/modules/menu/infrastructure/persistence/menu-catalog.typeorm-repository.ts:301` (`groupsByVariant`, 44 lines)
   - `explicit-module-boundary-types` (6): `src/common/decorators/{any-staff,public,require-permissions}.decorator.ts`, `test/customer-fixtures.ts:40,44`, `test/fake-storage.ts:14`
   - `explicit-member-accessibility` (2): `src/common/interceptors/transform-response/transform-response.interceptor.spec.ts:42,72`
4. **Direct `@InjectRepository` outside `persistence/`:**
   - `src/modules/notifications/notifications.service.ts:2,31` injects `@InjectRepository(NotificationEntity)` directly instead of an abstract `INotificationRepository` port.
5. **20 `Symbol()` port tokens across the backend (to become `export abstract class`):**
   - `src/common/clock.ts:5` (`Clock`)
   - `src/modules/auth/domain/line-client.ts:14` (`LineClient` — move `buildLineAuthorizeUrl` function out if `LineClient` becomes an abstract class in a non-`.port.ts` file, or rename to `domain/ports/line-client.port.ts`)
   - `src/modules/customer/domain/guest-session.repository.ts:15` (`GuestSessionRepository`)
   - `src/modules/iam/domain/{access-request,iam-admin,staff-admin,staff-user}.repository.ts` + `permission-source.ts` (5 ports)
   - `src/modules/menu/domain/{menu-catalog,menu-write,modifier-group}.repository.ts` (3 ports)
   - `src/modules/notifications/application/ports/{push-sender,staff-push-token.repository}.port.ts` (2 ports)
   - `src/modules/order/domain/order.repository.ts:32` (`OrderRepository`)
   - `src/modules/payment/domain/ports/{payment.repository,slip-verifier}.port.ts` (2 ports)
   - `src/modules/reports/domain/ports/report-queries.port.ts:24` (`ReportQueries`)
   - `src/modules/venue/domain/{table-seat,venue,visit}.repository.ts` (3 ports)

- **Decisions (`Decision | Why | Instead of`):**
  - Use the TypeScript compiler AST (`ts.createSourceFile`) in `app/backend/scripts/check-class-files.mjs` (and keep `*.port.ts` exempt so `export abstract class` + port `I*` interfaces can co-exist in `*.port.ts` files per `backend.md`) | Zero regex false negatives; catches extra classes and inline `type`/`interface` declarations in class files | Regex parser
  - Pass `-c oxlint.json` in `app/backend/package.json` `lint` with `max-lines: 300`, `max-lines-per-function: 40`, `max-depth: 2` | Enforces `docs/rules/backend.md` Hard Limits in `pnpm lint` and CI (Field Q3) | Implicit config lookup
  - Convert all 20 `Symbol()` ports to `export abstract class` ports (`*.port.ts`) | Eliminates runtime `Symbol()` and `@Inject()` boilerplate across the entire backend (Field Q2 = B) | Leaving mixed `Symbol()` + `abstract class` styles
- **Flow & Transaction boundary:** Pure structural refactor and lint gate enforcement; zero transaction boundary or runtime flow changes.
- **Contracts (`@bar/contracts`):** Unchanged; `docs/api/openapi.json` must remain byte-identical (`openapi:check` exit 0).
- **Code map (`File | Owns`):**
  - `app/backend/scripts/check-class-files.mjs` | AST class-file linter (`*.port.ts` exempt for abstract port + domain interfaces)
  - `app/backend/package.json` · `app/backend/oxlint.json` | Enforced `oxlint -c oxlint.json` gate with kit Hard Limits
  - `app/backend/src/modules/customer/infrastructure/http/customer-qr.controller.ts` | Split from `customer-session.controller.ts`
  - `app/backend/src/modules/iam/infrastructure/http/{staff-groups,policies,me}.controller.ts` | Split from `iam-admin.controller.ts` and `staff.controller.ts`
  - `app/backend/src/modules/iam/infrastructure/persistence/iam-write-guard.errors.ts` | Error classes split from `iam-write-guard.ts`
  - `app/backend/src/modules/notifications/domain/ports/notification.repository.port.ts` + `infrastructure/persistence/notification.typeorm-repository.ts` | Hexagonal repository port & adapter for `NotificationsService`
  - `app/backend/src/**/ports/*.port.ts` (and existing port files renamed/updated to `*.port.ts` where they declare `export abstract class` + `interface`) | Abstract class ports replacing `Symbol()` tokens

## 4. Acceptance Criteria *(standalone briefs only — feature briefs reference `requirements.md` AC IDs)*

| AC | When | Then |
|---|---|---|
| 1 | `pnpm --filter @bar/backend lint` runs | `oxlint -c oxlint.json src/ test/` (with `max-lines: 300`, `max-lines-per-function: 40`, `max-depth: 2`, `no-explicit-any: error`) and AST `check-class-files.mjs` both run and exit `0` with `0` warnings and `0` errors |
| 2 | Any non-exempt `.ts` file under `app/backend/src` declares a class | It declares **only** that single class — zero second classes, zero module-level functions/arrow consts, zero `type`/`interface` declarations (`0` AST violations) |
| 3 | `app/backend/src/modules/notifications/` is inspected | `NotificationsService` injects `NotificationRepository` (`export abstract class`) without `@InjectRepository` or TypeORM imports; zero services outside `persistence/` inject `@InjectRepository` |
| 4 | `app/backend/src/` is searched for `Symbol(` | Zero `Symbol(` port tokens remain in `app/backend/src/`; all ports use `export abstract class` with `public abstract` methods and class-token DI |
| 5 | All existing unit and e2e tests + `openapi:check` run | 100 % of unit (`pnpm --filter @bar/backend test`) and e2e (`pnpm --filter @bar/backend test:e2e`) suites pass without weakening any assertion, and `pnpm --filter @bar/backend openapi:check` exits `0` |
| 6 | Stale artifacts & runtime are checked | Nested `app/backend/pnpm-lock.yaml` is removed; `migration:run → revert → run` and `/api/health` 200 run proof succeed |

## 5. Tests (Planner = e2e · Executor = unit)

| ACs | Kind | Who writes | File |
|---|---|---|---|
| 1–5 | existing e2e suite (39 files, locked against regression) | **Pre-existing** | `app/backend/test/*.e2e-spec.ts` |
| 1–4 | unit (`*.spec.ts`) | **Executor** (updated where `Symbol` tokens were referenced in `Test.createTestingModule`) | `app/backend/src/**/*.spec.ts` |

- Gate commands (all must pass):
  ```bash
  pnpm --filter @bar/contracts test
  pnpm --filter @bar/backend lint
  pnpm --filter @bar/backend typecheck
  pnpm --filter @bar/backend test
  pnpm --filter @bar/backend test:e2e
  pnpm --filter @bar/backend openapi:check
  ```
- Run proof (backend changes):
  ```bash
  docker compose -f infra/docker-compose.yml up -d postgres redis
  pnpm --filter @bar/backend migration:run
  pnpm --filter @bar/backend start:dev   # separate shell, started fresh on the work SHA
  curl -fsS localhost:3011/api/health
  ```
  UI change: `n/a` (backend internal refactor only)
- **Local Sonar scan:** required for this brief: yes · approved exclusions / "won't fix": none
- **Constraints:** `save()` not `update()` on audited entities, `.js` relative imports, zero behavior or OpenAPI contract drift. Note: AST `check-class-files.mjs` exempts `*.port.ts` (so an `export abstract class` port and its `interface` types can live in `*.port.ts`, while non-`.port.ts` class files cannot declare interfaces or functions).

## 6. Planner Dry Run (completed before Ready)

| Check | Verified against repo (`path:line`) | Result |
|---|---|---|
| Existing schema / entities | `docs/schema.sql` · `app/backend/src/providers/database/migrations.ts:1-25` | Zero schema or entity column changes needed |
| Wiring & protected files | `app/backend/package.json:17` (`lint` script) · `docs/rules/agent-boundaries.md:12-18` | `app/backend/package.json` changes `lint` script only (no dependency change); `docs/rules/backend.md` + `docs/rules/.field-kit.json` ride in the Field-approved seed commit |
| Packages & peer versions | `app/backend/package.json:45-85` (`typescript@^6.0.3`, `oxlint`) | `typescript` is already installed in `app/backend`; AST `check-class-files.mjs` loads `typescript` via `createRequire` with zero new packages |
| Gate scripts exist | `app/backend/package.json:17-29` | `lint`, `typecheck`, `test`, `test:e2e`, `migration:run`, `openapi:check` all exist |
| E2e harness, imports & isolation | `app/backend/vitest.config.e2e.ts:1-20` · `app/backend/test/push-delivery.e2e-spec.ts` | 39 existing e2e specs run against `bar_test`; e2e tests overriding `PUSH_SENDER` / `SLIP_VERIFIER` / `LINE_CLIENT` update their `.overrideProvider(...)` token to the abstract port class |
| Dependencies merged · parallel overlap | `git log main -n 3` (`9e59dfa` BRIEF-064 merged) | All dependencies merged on `main`; no other backend brief in progress |
| UI tokens & components *(UI briefs; else `n/a`)* | `n/a` | Backend-only brief |

## 7. Unlocked Protected Files & Pre-Decided Items

- **Unlocked protected files:**
  - `none` (`docs/rules/backend.md` and `docs/rules/.field-kit.json` are Field-approved in session and committed in the seed commit with `Approved-by: Field (session)`)
- **Likely DRs:** `none`
- **Pre-decided packages / endpoints:**
  - `none`

## 8. Build Steps (inside → out · 1 step = 1 commit)

Order: config → ports/adapters → domain/application → controller/UI → run proof. Stop rule: if a step stays red after **2 fix attempts**, stop and report.

| # | Step | Done when | AC |
|---|---|---|---|
| 0 | Run AST `check-class-files.mjs` and `oxlint -c oxlint.json` (with kit limits) to confirm baseline red counts (26 class-file + 21 oxlint findings + 20 `Symbol()` ports) | baseline counts reproduced | — |
| 1 | Extract inline `type`/`interface` declarations from all 13 class files into companion `*.types.ts` files and split the 4 multi-class files (`customer-session.controller.ts`, `iam-admin.controller.ts`, `staff.controller.ts`, `iam-write-guard.ts`) into 1 class per file | 0 violations in AST `check-class-files.mjs`; `openapi:check` green | 2, 5 |
| 2 | Extract `NotificationRepository` (`export abstract class`) + `NotificationTypeOrmRepository` for `NotificationsService` and migrate `notifications`, `common/clock.ts`, `auth`, `customer`, `reports`, and `payment` ports from `Symbol()` to `export abstract class` (`*.port.ts`) | zero `@InjectRepository` in `NotificationsService`; migrated modules' unit + e2e green | 3, 4 |
| 3 | Migrate remaining `Symbol()` ports in `iam`, `menu`, `order`, and `venue` to `export abstract class` (`*.port.ts`), removing all `Symbol(` port tokens from `app/backend/src/` and updating unit/e2e provider overrides | `git grep "Symbol(" app/backend/src` returns nothing; `typecheck` + unit tests green | 4, 5 |
| 4 | Fix all 21 `oxlint -c oxlint.json` violations (`max-depth` ≤ 2, `max-lines` ≤ 300, `max-lines-per-function` ≤ 40, explicit return types & accessibility), wire `oxlint -c oxlint.json` + AST `check-class-files.mjs` in `app/backend/package.json`, delete stale `app/backend/pnpm-lock.yaml` | `pnpm --filter @bar/backend lint`, `typecheck`, `test` all exit 0 | 1, 6 |
| 5 | Run proof + full e2e suite + `openapi:check` + local Sonar scan | all gates + `/api/health` 200 + Sonar recorded | 5, 6 |

## 9. Tasks (this brief only)

| # | Task | Who |
|---|---|---|
| B1 | Stop any running `nest start --watch` dev backend before running `pnpm --filter @bar/backend test:e2e` (shared Redis) | executor |

---

## Ready Checklist
- [x] Zero unresolved *Open questions* blocking this brief (Q1–Q3 answered by Field 2026-11-01)
- [x] Every *Depends on* brief is **merged to `main`** (`9e59dfa`)
- [x] Size within limits (`owner-accepted oversize` confirmed by Field Q2 = B)
- [x] Section 6 *Planner Dry Run* (7 rows) completed with real `path:line` evidence
- [x] Existing `.e2e-spec.ts` regression suite verified
- [x] Plain-language headlines
- [x] Field explicitly approved this revision (2026-11-01, in session)

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-11-01 | Initial draft + Ready approval by Field (Q1: `backend.md` ok; Q2 = B: migrate all 20 `Symbol()` ports to `export abstract class`; Q3: `max-lines-per-function: 40` from kit) |

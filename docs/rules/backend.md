# Backend — NestJS + Hexagonal Architecture

> Scoped to `app/backend/**`. Workspace-wide rules in `docs/rules/core.md` also apply.
> Pack: field-kit `backend-nestjs` (proven, with Field's house coding style) + project-specific architecture (DR-001..DR-025).

---

## Stack
- Node.js 22 LTS, TypeScript 6 strict + `noUncheckedIndexedAccess`, **ESM** (`"type": "module"`, NodeNext resolution)
- NestJS 12 — modular monolith (REST + WebSocket + webhooks in one process)
- PostgreSQL via TypeORM — `synchronize: false` always
- Redis (ElastiCache) — ACL cache + BullMQ + socket.io adapter
- `@nestjs/bullmq` — async job processing (`payments`, `notification-push`)
- `@nestjs/cls` + `@nestjs-cls/transactional` — CLS request context + `@Transactional()` decorator
- Zod 4 (`@bar/contracts` + domain config schemas) — no `class-validator` / `class-transformer`
- LINE SSO + JWT access token (15m, HttpOnly cookie on web, `Bearer` on mobile — DR-005) + refresh token rotation
- PromptPay QR + EasySlip / webhook
- Vitest for unit (`*.spec.ts`) + e2e (`*.e2e-spec.ts`)

### ESM import rule
Relative imports **must** include `.js`: ✅ `import { Foo } from './foo.service.js'` · ❌ `'./foo.service'`. Node built-ins as `node:crypto`. No barrel `index.ts` that re-exports everything.

---

## src/ Directory Structure

Files marked *(planned)* do not exist yet — the brief that needs them creates them. **Never create empty stubs from this tree.**

```
src/
├── bootstrap/
│   └── configure-app.ts              ← global prefix `api`, filter, interceptor, shutdown hooks — used by main.ts AND tests
│
├── common/                           ← cross-cutting kernel (no business logic)
│   │                                   unit with ≥ 3 files (impl + types + spec) → own folder; otherwise flat
│   ├── base/base.entity.ts
│   ├── constants/sql-column.constant.ts
│   ├── decorators/                   ← current-user (+ .types), public, require-permissions, any-staff
│   ├── filters/http-exception/       ← error envelope: .filter + .types + .spec (see API Response)
│   ├── guards/                       ← jwt-auth, permissions
│   ├── interceptors/
│   │   ├── cls-user.interceptor.ts
│   │   └── transform-response/       ← success envelope: .interceptor + .types + .spec
│   ├── http/http-input.ts            ← requireUuid, staffAccess, blankToNull
│   ├── idempotency/                  ← IdempotencyService
│   ├── openapi/                      ← Zod → OpenAPI helper, envelope decorators
│   ├── persistence/row-values.ts     ← raw-row readers
│   ├── clock.ts + system-clock.ts    ← Clock port + SystemClock; each module registers useClass
│   ├── money.ts · time-label.ts      ← NUMERIC(10,2) format · TIME labels / clockSeconds
│   ├── storage/                      ← StorageService — the only S3 caller (DR-020): presigned POST / GET, head, copy, delete
│   └── domain-exception.ts
│
├── providers/                        ← infra wiring only — no domain logic, no controllers
│   ├── config/                       ← one folder per config domain, same 3 files each
│   │   ├── app/                      ← NODE_ENV, PORT — AppConfigService
│   │   ├── database/                 ← PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE — DatabaseConfigService
│   │   ├── jwt/                      ← JWT secrets & TTLs
│   │   ├── line/                     ← LINE OAuth channel config
│   │   ├── openapi/                  ← OPENAPI_ENABLED
│   │   ├── redis/                    ← Redis connection config
│   │   ├── storage/                  ← AWS_REGION, S3_BUCKET (+ local-only access keys) — StorageConfigService
│   │   ├── expo/                     ← EXPO_ACCESS_TOKEN (optional) — ExpoConfigService
│   │   └── gen-ai/                   (planned — AI brief, OpenAI)
│   ├── database/
│   │   ├── database.module.ts        ← TypeOrmModule.forRootAsync (via DatabaseConfigService) + CLS transactional plugin
│   │   ├── data-source.ts            ← standalone DataSource for the TypeORM CLI
│   │   ├── migrations.ts             ← THE single migrations array (database.module + data-source)
│   │   ├── migrations/               ← <timestamp>-<Name>.ts
│   │   ├── snake-naming.strategy.ts
│   │   └── subscribers/
│   │       └── audit.subscriber.ts
│   ├── queue/                        ← BullMQ connection module
│   ├── redis/                        ← RedisService
│   └── infrastructures/              ← vendor adapters that implement a module's port
│       └── gen-ai/                   (planned — openai-llm-client.service.ts)
│
├── modules/                          ← domain modules (hexagonal per module)
│   ├── health/                       ← infra-only (controller + service, no domain/ports)
│   ├── auth/  iam/  venue/  customer/  menu/  order/  payment/  reports/  notifications/
│   └── inventory/  bottle-keep/      (planned)
│
├── app.module.ts
└── main.ts
```

## Layer Responsibilities

| Folder | Owns | Never contains |
|---|---|---|
| `bootstrap/` | App-level setup shared by `main.ts` and tests | Business logic |
| `common/` | Decorators, guards, filters, interceptors, base entity, constants, clock, storage, technical helpers (HTTP input, money format, time, row readers) | Business logic, domain imports |
| `providers/` | Config (per domain), database (TypeORM, migrations), Redis/BullMQ connections, vendor adapters | Domain logic, controllers, services with business rules |
| `modules/` | All domain features (hexagonal) + `health` (infra-only) | Direct infra imports across modules |

---

## Hexagonal Architecture & Ports (per module)

Three layers per module — strict, never import upward or across:

1. `domain/ports/` → **`export abstract class I<Name>`** with `public abstract` methods + **`I`-prefixed domain interfaces** (`IStaffUser`, `IPaymentRecord`). No NestJS, no TypeORM, no ORM entities, **no `Symbol()` boilerplate**.
2. `application/` → `@Injectable()` services. Import `abstract class` ports and domain interfaces, never `infrastructure/`.
3. `infrastructure/` → adapters (`http/` controllers + `.openapi.ts` + DTOs, `persistence/` TypeORM entities + repositories, `queue/` processors, vendor adapters).
4. `common/` → shared kernel. No business logic. No domain module imports.

**Cardinal rule:** `application/` NEVER imports from `infrastructure/`. The `*.module.ts` is the ONLY place that binds a concrete adapter to an abstract port (`{ provide: IStaffUserRepository, useClass: StaffUserTypeOrmRepository }`).

### Module Structure
```
{module}/
├── domain/
│   ├── ports/{entity}.repository.port.ts   ← abstract class I<Name> + I-interfaces
│   └── {subject}.types.ts                  ← domain types (optional, framework-free)
├── application/
│   ├── {service}/
│   │   ├── {service}.service.ts            ← business logic, @Transactional where needed
│   │   └── {service}.types.ts              ← only if the service needs types
│   └── shared/                             ← types/helpers used by 2+ services
├── infrastructure/
│   ├── http/{subject}/
│   │   ├── {subject}.controller.ts         ← REST endpoints
│   │   ├── {subject}.openapi.ts            ← Swagger decorator factories
│   │   └── dto/                            ← Zod schemas + inferred types + mappers
│   ├── persistence/
│   │   ├── {entity}.entity.ts              ← TypeORM entity
│   │   └── {entity}.typeorm-repository.ts  ← implements I<Entity>Repository
│   └── queue/                              ← BullMQ processor (where needed)
└── {module}.module.ts
```

**Folder per service (or flat when 1–2 files):** a service and its `.types.ts` live together; no types → no `.types.ts`. Same for a controller and its `.openapi.ts`.

### Port Pattern (`abstract class` — no `Symbol()`)

```typescript
// domain/ports/staff-user.repository.port.ts
export interface IStaffUser {
  id: string;
  displayName: string;
  isActive: boolean;
}

export abstract class IStaffUserRepository {
  public abstract findById(id: string): Promise<IStaffUser | null>;
  public abstract save(user: IStaffUser): Promise<IStaffUser>;
}

// iam.module.ts
providers: [
  { provide: IStaffUserRepository, useClass: StaffUserTypeOrmRepository },
  StaffUserService,
]

// application/staff-user.service.ts — no @Inject() token needed
export class StaffUserService {
  public constructor(private readonly staffUserRepository: IStaffUserRepository) {}
}
```

> **Legacy `Symbol()` ports:** Pre-Rev 22 modules still use `export const X = Symbol('X')` + `@Inject(X)`. **Never add new `Symbol()` tokens** — new ports use `export abstract class I<Port>`, and cleanup briefs migrate existing `Symbol()` ports to `abstract class`.

---

## Coding Style & Service Design (Mandatory)

Goal: a reviewer reads a file once, top to bottom, and understands it without scrolling back.
Each rule is checked by **`[lint]`** (CI fails — `oxlint -c oxlint.json` + `scripts/field-kit/check-class-files.mjs`) or **`[audit]`** (judged at audit, violation = Must fix). The audit never re-checks `[lint]` rules.

1. **Explicit `public` and `private` on every method `[lint: explicit-member-accessibility]`:** Always write `public`, `private` or `protected` (and `public abstract` on abstract port classes) — never rely on TypeScript's implicit public default. Public methods declare their return type `[lint: explicit-module-boundary-types]`.
2. **`public` service methods are pure pipelines (zero inline `if`s, zero inline object construction) `[audit]`:**
   - The `try` block (or body) of a `public` method is a 3–6 line sequence of named method calls.
   - Extract every `if` check, validation, loop, and payload builder into a `private` helper method (`validate*`, `verify*`, `build*`, `generate*`) below it, in the order they are called (stepdown rule).
3. **Calling service owns flow/business logic; entity service stays atomic CRUD `[audit]`:**
   - Entity services expose thin, reusable atomic methods that delegate to `I<Entity>Repository`.
   - Flow-specific business rules (e.g. "on login: if missing create, if inactive throw, else update") live in a `private validate*` helper on the orchestrating service.
4. **Strict HTTP vs. Service boundary `[audit]`:**
   - **Controllers** (`infrastructure/http/`) own HTTP transport concerns: cookies, query/CSRF `state` checks (`private verifyState`), status codes, and redirects.
   - **Services** (`application/`) take only pure domain inputs and return pure data — never pass `Request`, `Response`, or cookies into a service.
5. **Error translation `[audit]`:**
   - **Vendor / external adapter (`ILineClient`, `IPushSender`, `ISlipVerifier`):** throws custom `Error` subclasses (in `{adapter}.errors.ts`) with a default constructor message (`export class InvalidGrantError extends Error { public constructor(message = 'Invalid grant') { super(message); } }`).
   - **Service:** `private validate*` helpers throw `DomainException(code, thaiMessage, status)` (with `code` from `ErrorCodeSchema` in `@bar/contracts`); the `public` method's `catch (error)` translates expected adapter `instanceof` errors into `DomainException` and rethrows `throw error` for everything else.
   - **Controller / `HttpExceptionFilter`:** maps exceptions to the standard error envelope (or redirect on OAuth callback).
6. **Negative early-exit guards (`if (!x)`), zero `else`, explicit field mapping `[audit]`:**
   - Inside `private` helpers, check `if (!x)` and `return` or `throw` immediately — never write `else` after a `return`/`throw`. Nesting depth ≤ 2 `[lint: max-depth]`.
   - Map object properties explicitly (`{ id: row.id, name: row.name, ... }`) — never use object spread `{ ...row }` across domain/persistence boundaries.
   - Always use `return await` on async tail calls to preserve stack traces inside `try/catch`.
7. **One class per file, and the file holds only that class `[lint: check-class-files]`:**
   - Imports, plain constants and the class — no second class, no module-level functions or arrow-function consts, no `type` / `interface`.
   - Helpers are `private` methods called with `this.` — never `static`, even when they don't read `this`.
   - Types go in `{service}.types.ts` beside the service (domain types in `domain/<subject>.types.ts`, HTTP shapes in `dto/`, port interfaces in `*.port.ts`). No inline object types in signatures → name them in `.types.ts`.
   - Swagger decorator factories (`ApiCreatedOrder()`) go in `infrastructure/http/{subject}.openapi.ts` beside the controller.
   - Custom error classes live in `{subject}.errors.ts` beside the adapter or service that throws them (several small error classes per file is fine there).
   - Function-only files (no class) are allowed for pure logic: domain calculations, mappers, value parsers, config factories, CLI scripts. Never mix a class and module-level functions in one file.
8. **≤ 3 parameters `[lint / audit: max-params]`:** 4 or more → one named input type in `.types.ts` passed as an object. Exempt: constructor injection and Nest-decorated handler parameters (`@Param`, `@Query`, `@Body`, `@Req`, `@Res`, `@CurrentUser`). No boolean flag parameters that switch behaviour — write two methods `[audit]`.
9. **Names say what and in which unit `[audit]`:**
   - No abbreviations except standard terms (`id`, `url`, `dto`, `jwt`, `qr`, OAuth `state` / `nonce` / `sub`).
   - Units in the name (`refreshTtlSeconds`, `lockTimeoutMs`, not `ttl`).
   - Injected dependencies named by role (`lineClient`, `tokenService` — not `line`, `tokens`).
   - Functions: verb + object (`createStaffLoginSession`, `findStaffByIdentity`). Booleans: `is` / `has` / `can`. Classes and types: nouns.
   - Comments explain WHY, never WHAT.

### Canonical Service Pattern

```typescript
@Injectable()
export class StaffAuthService {
  public constructor(
    private readonly lineClient: ILineClient,
    private readonly staffUserService: StaffUserService,
    private readonly tokenService: TokenService,
  ) {}

  public async loginWithLineCode(code: string, nonce: string): Promise<LoginSession> {
    try {
      const tokenSet = await this.lineClient.exchangeCode(code);
      const profile = await this.lineClient.verifyIdToken(tokenSet.idToken, nonce);
      const staff = await this.validateActiveStaff(profile);
      return await this.tokenService.issueSession(staff.id);
    } catch (error) {
      if (error instanceof LineOAuthError) {
        throw new DomainException('UNAUTHORIZED', 'เข้าสู่ระบบด้วย LINE ไม่สำเร็จ', 401);
      }
      throw error;
    }
  }

  private async validateActiveStaff(profile: ILineProfile): Promise<IStaffUser> {
    const staff = await this.staffUserService.findByLineSub(profile.sub);
    if (!staff) {
      throw new DomainException('FORBIDDEN', 'ยังไม่ได้รับสิทธิ์ใช้งานระบบ', 403);
    }
    if (!staff.isActive) {
      throw new DomainException('FORBIDDEN', 'บัญชีถูกระงับการใช้งาน', 403);
    }
    return staff;
  }
}
```

### Hard Limits
| Thing | Max | Checked by |
|---|---|---|
| File | 300 lines | `[lint: max-lines]` |
| Method / function | 40 lines | `[lint: max-lines-per-function]` |
| Nesting depth | 2 | `[lint: max-depth]` |
| Parameters | 3 (else one named input type) | `[audit: max-params]` |
| `public` service method `try` body | 6 statements (extract `private` helpers) | `[audit]` |
| Controller method | 15 lines (verify HTTP input → call service → return/redirect) | `[audit]` |
| Constructor injections | 5 (more = class does too much → split) | `[audit]` |

Size limits do not apply to `test/**`, `*.spec.ts` and `src/providers/database/migrations/**`.

---

## providers/ Rules

### config/<domain>/
- **Three files per domain, always the same names:** `configuration.ts` (`export default registerAs('<domain>', () => …)`), `config.service.ts` (`<Domain>ConfigService`), `config.module.ts` (`<Domain>ConfigModule`).
- `configuration.ts` reads `process.env`, parses with a **Zod schema local to that domain**, and throws `Validate <domain> config error: …` (`z.prettifyError`) — the app fails at boot and the message names the variable.
- `config.service.ts` exposes **typed getters only** (`public get host(): string`) reading `this.configService.getOrThrow('<domain>.<key>')` — optional values use `get`. String keys live only here.
- `config.module.ts` = `imports: [ConfigModule.forFeature(configuration)]`, `providers/exports: [<Domain>ConfigService]`. A feature module imports **only the config modules it needs**.
- `AppModule` calls `ConfigModule.forRoot({ isGlobal: true })` once (loads `.env` locally); no global schema — each domain validates itself.
- **`process.env` is read only in `config/*/configuration.ts`.** The TypeORM CLI (`database/data-source.ts`) gets its values by calling the factory directly: `databaseConfiguration()` — no second copy of env parsing.
- Adding a domain = adding its folder with all three files in the brief that first needs it. Env var names are part of the brief contract.

### database/
- `database.module.ts` owns `TypeOrmModule.forRootAsync` (injects `DatabaseConfigService`), `ClsModule` + transactional plugin, and provides `AuditSubscriber` — imported once in `AppModule`.
- `synchronize: false`, `autoLoadEntities: true` — **no hand-written `entities: [...]` list**. SSL decided from `AppConfigService.nodeEnv`, never `process.env` here.
- One `migrations.ts` list, imported by `database.module.ts` and `data-source.ts`.
- `AuditSubscriber`: Nest provider that pushes itself onto the `DataSource` — **no `@EventSubscriber()`** (double registration) and not in TypeORM `subscribers`.

### infrastructures/<domain>/
- One file per vendor adapter: `<vendor>-<purpose>.service.ts` (e.g. `openai-llm-client.service.ts`), `@Injectable()`, **implements the `abstract class I<Port>`** from the owning module (`modules/<m>/domain/ports/…`), injects its `<Domain>ConfigService`.
- Cloud credentials: pass access keys only when both are set (local dev); otherwise use the default chain (ECS task role).
- Exception (DR-020): object storage is `common/storage/StorageService` — one shared technical service, no module port, no `infrastructures/storage/` adapter.
- No business logic — translate between the port and the SDK only, throwing custom `Error` classes (`{adapter}.errors.ts`) on vendor failures.

---

## API Response & OpenAPI (DR-004 Amendment 1)

Every HTTP response uses one envelope. Decided by Field 2026-09-24.

```typescript
// success — TransformResponseInterceptor wraps whatever the controller returns
{ status: number; code: ''; message: 'success'; data: T }   // status = response.statusCode, code always ''

// error — HttpExceptionFilter
{ status: number; code: string; message: string | string[]; data: null }   // code: UPPER_SNAKE, never '' (D1)
```
- **Standard envelope — the same four keys on every response:** `status`, `code`, `message`, `data`. `code` is `''` on success and a non-empty UPPER_SNAKE code on error. Clients read `response.code` / `response.data` directly — never optional chaining or non-null assertions on envelope fields (`response.data?.code`, `response.data!.code` are review findings).
- Controllers return the plain response DTO; they never build the envelope themselves. Browser redirect endpoints (`/auth/callback`) use `res.redirect(302, ...)`.
- Non-2xx responses always go through `HttpExceptionFilter` (throw `DomainException` or `HttpException`, don't set `res.status()` and return a body).
- Every error carries a `code`: the filter derives a generic one from the status (`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`); domain errors throw `DomainException(code, message, status)` with a code from `ErrorCodeSchema` in `@bar/contracts`.
- Webhook endpoints (payment gateway) may answer in the format the gateway requires — document the exception in that brief.

### OpenAPI
- **Tooling:** `@nestjs/swagger` builds the document; request/response schemas come from `@bar/contracts` Zod schemas via `z.toJSONSchema(schema, { target: 'openapi-3.0' })` in `common/openapi/`. Never hand-written.
- **Coverage (audit Must fix if missing):** every endpoint has a tag (module name), summary, request body / params / query, success response **wrapped in the envelope** `{ status, code, message, data }`, error responses (envelope with `data: null`) for the status codes it can return, and its auth requirement (access cookie or `Bearer`) + required permission in the description.
- **Serving:** Swagger UI `GET /api/docs`, JSON `GET /api/docs-json`. Controlled by `OPENAPI_ENABLED` in `providers/config/openapi/` — `true` locally and on staging, **`false` in production**.
- **Spec gate `[lint]`:** `pnpm --filter @bar/backend openapi:export` writes `docs/api/openapi.json` (stable key order). `openapi:check` runs in CI and G1 whenever an endpoint or contract changes.
- Conventions (naming, errors, paging, money/date, WS events): `docs/api/README.md`.

### Payload conventions `[audit]`
| Thing | Rule | Example |
|---|---|---|
| Money | string, 2 decimals (JSON numbers lose precision) | `"price": "120.00"` |
| Dates | UTC, ISO-8601 | `"2026-10-31T16:45:00Z"` |
| Lists | **cursor paging by default**: stable sort + `id` tie-break, opaque/UUID cursor, fetch `limit + 1`, `nextCursor: null` = end | `?cursor=…` → `data.nextCursor` |
| Creating something that must not happen twice (payment, order, close bill) | `Idempotency-Key` header: client makes a new UUID per intended action, reuses it on retry; server stores key → result ~24 h; same key + different body → `422`. Not for `GET` or plain set-value edits | `POST /payments` + `Idempotency-Key: <uuid>` |
| State changes | own sub-route, one permission + rule check each | `POST /tickets/:id/accept`, not `PATCH {status}` |

---

## Entities, TypeORM & Transactions

### BaseEntity (`common/base/base.entity.ts`)
All mutable domain entities extend `BaseEntity`:
- `id` — UUID PK
- `createdBy` / `updatedBy` — UUID nullable, auto-set by `AuditSubscriber` (never set manually)
- `createdAt` / `updatedAt` — timestamptz (`updated_at` owned by DB trigger `trg_<table>_updated_at` → `set_updated_at()`, DR-023)
- `audit_log` and append/ephemeral tables (`notification`, `staff_push_token`, `guest_session`) do NOT extend `BaseEntity`
- Soft-delete entities add their OWN `deletedAt` + `deletedBy` (not in `BaseEntity`)

### Column Type Constants
```typescript
import { COL } from '../../../common/constants/sql-column.constant.js';

@Column(COL.VARCHAR)   // COL.UUID | COL.DECIMAL | COL.JSONB | etc.
name!: string;
```
No magic strings for column types.

### TypeORM & Persistence Rules
- `synchronize: false` — no exceptions, ever.
- Repositories return domain interfaces/records (`I<Entity>`), never leaking TypeORM entity instances to `application/`.
- No `eager: true` on any relation. Load relations explicitly.
- `@JoinColumn({ name: 'snake_case_fk' })` on the owning (`@ManyToOne`) side; both sides declared where bidirectional.
- **Use `save()` not `update()` on audited entities** — `AuditSubscriber` needs `databaseEntity`.
- `updated_at` belongs to the database (DR-023): never set it in app code or raw SQL; a migration that creates a table with `updated_at` attaches `trg_<table>_updated_at`; return the stored value (re-read in the same transaction), not the in-memory copy.
- Soft delete: filter `IS NULL` on `deletedAt` in every active-record query.
- **No N+1 queries or unbounded reads:** Never call a repository/DB query inside a loop (`for`, `.map`) — batch with `In(...)` or a join. Every list query must have pagination or an explicit limit.
- **Migrations:** additive by default with a working `down`, tested `migration:run → migration:revert → migration:run` before handoff. Never edit a migration already on `main`.

### Transactions
- `@Transactional()` from `@nestjs-cls/transactional` on service methods that span repositories.
- NEVER pass `EntityManager` manually to repository methods.
- **Never call external HTTP/SDK APIs or emit WebSocket/BullMQ notifications inside `@Transactional()`** — run external I/O outside the transaction (or post-commit).
- Payment FAILED status update runs OUTSIDE transaction — must persist on rollback.

---

## DTO Pattern (Zod — not class-validator)

- Shared request/response schemas live in `@bar/contracts`; controller-local parsing helpers live in `infrastructure/http/dto/` or `common/http/`.
- DTOs are plain types (`z.infer<typeof Schema>`) — not classes, no decorators.
- Controller (or a pure presentation mapper) shapes the response — never return raw TypeORM entities.

---

## IAM, Auth, BullMQ & WebSocket

### IAM & Permissions
- Format: `'resource:action'` — e.g. `'orders:create'`, `'menu:write'`
- `@RequirePermissions('orders:create')` or `@AnyStaff()` on controller methods (`common/decorators/`)
- `PermissionsGuard` resolves effective permissions (active group memberships within `[valid_from, valid_until)` + direct user policies, cached in Redis, invalidated on any IAM mutation)
- NEVER inline permission checks in controllers or services — always via guard

### Auth (LINE SSO + JWT, DR-005)
- Web: LINE callback → exchange code → upsert `staff_user_identity` → HttpOnly `access_token` (15m) + `refresh_token` cookies (rotated on every use).
- Mobile (DR-005): PKCE + one-time code exchange → `Authorization: Bearer <access>` + mobile refresh rotation.
- `@CurrentUser()` decorator extracts JWT payload; `JwtAuthGuard` applied globally — whitelist with `@Public()` (or guest token route) where needed.

### BullMQ
- Queues: `'payments'` (payment expiry / webhook processing) and `'notification-push'` (`send` + delayed `receipts` jobs, DR-003 Am. 2).
- Always set `removeOnComplete: { age: 86_400 }` and keep failed jobs for inspection; exponential backoff on retries.

### WebSocket (`NotificationsModule`)
- `NotificationsGateway`: socket.io adapter, rooms `'pos'` | `'bar'` | `'kitchen'` | `'user:{staffId}'`.
- Domain modules inject `NotificationsService` — NEVER `NotificationsGateway` directly.
- `NotificationsModule` is registered globally in `AppModule`.

### Module Export Rules
- Feature modules export their **Service only** — never a Repository or Adapter.
- **No circular module/provider dependencies.** Extract shared logic into its own provider/module or decouple via sink/event. `forwardRef()` only with an Approved DR.

---

## Tests: e2e never shares state with the dev server

`.e2e-spec.ts` runs while `start:dev` may be up:

| Thing | Dev | e2e |
|---|---|---|
| Database | `bar` | `bar_test` |
| Redis | DB 0 | DB 1 or key prefix `test:` (tracked in BRIEF-013 S2) |
| HTTP port | `3011` | `app.listen(0)` (OS picks a free port) |

---

## Critical Domain Invariants

- `order_item.unit_price_snapshot` + name snapshots (`item_name_snapshot`, `variant_name_snapshot`, `order_item_modifier.option_name_snapshot`, DR-022): frozen at order time, never mutated.
- `gateway_tx_id`: always check uniqueness before processing any payment webhook.
- Visit state machine: `open → closed | abandoned` — never reopen a closed visit; `VisitService` owns all transitions.
- Bottle-keep ≠ inventory: already sold to customer, no inventory deduction on pour.
- `menu_variant_ingredient` lives in `MenuModule` — `InventoryModule` never reads menu tables.
- PDPA: `customer_id` on visit is nullable — link only with explicit consent; guest notes are never included in staff push/feed notification bodies (DR-003).
- `kitchen_display_enabled`: stored in `venue` table, not env var — admin toggles at runtime.

---

## DO NOT

- Write inline `if` validation chains or inline payload objects inside a `public` service method (extract `private validate*` / `build*` helpers)
- Omit `public` or `private` on class methods
- Use `Symbol()` + `@Inject()` in new code — use `export abstract class I<Port>` (existing Symbol ports are migrated by cleanup briefs)
- Declare a second class, module-level functions, function consts, `type` or `interface` in a file that declares a class (errors → `{subject}.errors.ts`, types → `{subject}.types.ts`, OpenAPI decorators → `{subject}.openapi.ts`)
- Share an e2e database, Redis DB or port with the dev server
- Pass HTTP cookies, `req`, `res`, or query `state` into an `application/` service
- Put object spreads (`{ ...profile }`) across domain/persistence boundaries
- Call external HTTP/SDK APIs or emit WS/queue notifications inside `@Transactional()`, or run DB queries inside a loop (N+1)
- Use `synchronize: true` · `eager: true` · `update()` on audited entities · hard deletes
- Edit a migration already on `main`, or ship one without a working `down`
- Return raw TypeORM entities from repositories or controllers
- Import `infrastructure/` from `application/`, or another module's `infrastructure/`
- Export repositories from modules or break a circular dependency with `forwardRef()`
- Inline permission checks in controllers or services
- Mutate `order_item` price or name snapshots after creation
- Process a payment webhook without `gateway_tx_id` idempotency check
- Read `process.env` outside `providers/config/*/configuration.ts`
- Omit `.js` extensions on relative imports

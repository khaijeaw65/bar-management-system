# Backend — NestJS + Hexagonal Architecture

> Scoped to `app/backend/**`. Workspace-wide rules in `docs/rules/core.md` also apply.

---

## src/ Directory Structure

Files marked *(planned)* do not exist yet — the brief that needs them creates them. **Never create empty stubs from this tree.**

```
src/
├── bootstrap/
│   └── configure-app.ts              ← global prefix `api`, filter, interceptor, shutdown hooks — used by main.ts AND tests
│
├── common/                           ← cross-cutting kernel (no business logic)
│   ├── base/
│   │   └── base.entity.ts
│   ├── constants/
│   │   └── sql-column.constant.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── public.decorator.ts               (planned — auth brief)
│   │   └── require-permissions.decorator.ts  ← `@RequirePermissions(...)`
│   ├── filters/
│   │   └── http-exception.filter.ts  ← error envelope (see API Response)
│   ├── guards/
│   │   └── permissions.guard.ts
│   └── interceptors/
│       ├── cls-user.interceptor.ts
│       └── transform-response.interceptor.ts ← success envelope (see API Response)
│
├── providers/                        ← infra wiring only — no domain logic, no controllers
│   ├── config/
│   │   ├── config.module.ts          ← global; wraps ConfigModule.forRoot({ validate })
│   │   ├── config.schema.ts          ← Zod schema for ALL env vars, parsed once at boot
│   │   └── config.service.ts         ← AppConfigService: typed getters per domain (db, app, auth, …)
│   ├── orm/
│   │   ├── typeorm.module.ts         ← TypeOrmModule.forRootAsync + CLS transactional plugin
│   │   ├── data-source.ts            ← standalone DataSource for the TypeORM CLI (same options)
│   │   ├── migrations.ts             ← THE single migrations array (used by typeorm.module + data-source)
│   │   ├── migrations/               ← <timestamp>-<Name>.ts
│   │   ├── snake-naming.strategy.ts
│   │   └── subscribers/
│   │       └── audit.subscriber.ts
│   ├── redis/                        (planned — IAM cache brief)
│   │   ├── redis.module.ts
│   │   └── redis.service.ts
│   └── infrastructures/              (planned — first AWS brief)
│       ├── aws/
│       │   └── s3.adapter.ts
│       └── infrastructure.module.ts
│
├── modules/                          ← domain modules (hexagonal per module)
│   ├── health/                       ← infra-only (controller + service, no domain/ports)
│   ├── auth/                         ← infra-only (no domain/ports)
│   ├── iam/  venue/  guest/  menu/  inventory/  order/  payment/  bottle-keep/
│   └── notifications/                ← infra-only (no domain/ports)
│
├── app.module.ts
└── main.ts
```

## Layer Responsibilities

| Folder | Owns | Never contains |
|---|---|---|
| `bootstrap/` | App-level setup shared by `main.ts` and tests | Business logic |
| `common/` | Decorators, guards, filters, interceptors, base entity, constants | Business logic, domain imports |
| `providers/` | Config, ORM, Redis, AWS adapters | Domain logic, controllers, services with business rules |
| `modules/` | All domain features (hexagonal) + infra-only modules (`health`, `auth`, `notifications`) | Direct infra imports across modules |

## providers/ Rules
- `config/config.schema.ts` validates **all** env vars at startup with Zod — the app crashes immediately if any are missing, and the error names the variable.
- `config/config.service.ts` is the only way code reads config: inject `AppConfigService` and use its typed getters (`config.database`, `config.app.port`, …). **No `process.env` outside `config.schema.ts` / `data-source.ts`**, no module-level cached state.
- `orm/` owns `AuditSubscriber` — registered once globally, never per module. It owns the migration pipeline too: **one** `migrations.ts` list, imported by both `typeorm.module.ts` and `data-source.ts`.
- `infrastructures/infrastructure.module.ts` is an **aggregator module** (a Nest module that imports/exports the adapters) — imported once in `AppModule`. Not an `index.ts` re-export (`core.md` bans those).
- `redis/redis.service.ts` is global — shared by IAM cache, BullMQ and the socket.io adapter.

## API Response

Every HTTP response uses one envelope. Decided by Field 2026-09-24.

```typescript
// success — TransformResponseInterceptor wraps whatever the controller returns
{ status: number; message: 'success'; data: T }        // status = response.statusCode

// error — HttpExceptionFilter
{ status: number; message: string | string[]; data: null }
```
- Controllers return the plain response DTO; they never build the envelope themselves.
- Non-2xx responses always go through `HttpExceptionFilter` (throw an `HttpException`, don't set `res.status()` and return a body).
- The envelope type/schema lives in `@bar/contracts` (`ApiResponse<T>` / `apiResponseSchema(dataSchema)`, DR-004) once a frontend brief consumes it; the frontend `apiFetch` unwraps `data`.
- Webhook endpoints (payment gateway) may answer in the format the gateway requires — document the exception in that brief.

---

## Stack
- Node.js 22, ESM, TypeScript 6
- NestJS 12 — modular monolith (REST + WebSocket + webhook in one process)
- PostgreSQL via TypeORM — `synchronize: false` always
- Redis (ElastiCache) — ACL cache + BullMQ + socket.io adapter
- `@nestjs/bullmq` — async payment webhook processing
- `@nestjs/cls` + `@nestjs-cls/transactional` — CLS context + transaction decorator
- LINE SSO + JWT access token (15m) + refresh token rotation (HttpOnly cookie)
- PromptPay QR + GB Prime Pay webhook

---

## Hexagonal Architecture (Ports & Adapters)

Three layers per module — strict, never import upward or across:

1. `domain/ports/`   → interfaces ONLY. No NestJS. No TypeORM. No framework.
2. `application/`    → `@Injectable()` services. Imports ports, never adapters.
3. `infrastructure/` → adapters. Implements ports. Imports TypeORM/Redis/etc.
4. `common/`         → shared kernel. No business logic. No domain module imports.

**Cardinal rule:** `application/` NEVER imports from `infrastructure/`.
Services receive dependencies via DI (constructor injection of port tokens).
The `*.module.ts` is the ONLY place that wires a concrete adapter to a port token.

### Module Structure
```
{module}/
├── domain/
│   └── ports/
│       └── {entity}.repository.port.ts    ← interface + Symbol token
├── application/
│   └── {entity}.service.ts                ← business logic, @Transactional where needed
├── infrastructure/
│   ├── http/
│   │   ├── {entity}.controller.ts         ← REST endpoints
│   │   └── dto/                           ← Zod schemas + inferred types + mappers
│   ├── persistence/
│   │   ├── {entity}.entity.ts             ← TypeORM entity
│   │   └── {entity}.typeorm.repository.ts ← implements IRepository
│   └── queue/                             ← payment module only
│       └── payment.processor.ts
└── {module}.module.ts
```

Infra-only modules (no `domain/ports/`): `auth/`, `notifications/`

---

## Port / Token Pattern

```typescript
// staff-user.repository.port.ts
export const STAFF_USER_REPOSITORY = Symbol('STAFF_USER_REPOSITORY');
export interface IStaffUserRepository {
  findById(id: string): Promise<StaffUser | null>;
  save(user: StaffUser): Promise<StaffUser>;
}

// iam.module.ts
providers: [
  { provide: STAFF_USER_REPOSITORY, useClass: StaffUserTypeOrmRepository },
  StaffUserService,
]

// staff-user.service.ts
constructor(
  @Inject(STAFF_USER_REPOSITORY) private readonly repo: IStaffUserRepository,
) {}
```

---

## BaseEntity (`common/base/base.entity.ts`)

All mutable domain entities extend `BaseEntity`:
- `id` — UUID PK
- `createdBy` / `updatedBy` — UUID nullable, auto-set by AuditSubscriber (never set manually)
- `createdAt` / `updatedAt` — timestamptz

Rules:
- NEVER manually set `createdBy` / `updatedBy` in service code
- `audit_log` does NOT extend BaseEntity — it has its own schema
- Soft-delete entities add their OWN `deletedAt` + `deletedBy` (not in BaseEntity)

---

## Column Type Constants

```typescript
import { COL } from '../../../common/constants/sql-column.constant.js';

@Column(COL.VARCHAR)   // COL.UUID | COL.DECIMAL | COL.JSONB | etc.
name!: string;
```
No magic strings for column types.

---

## TypeORM Rules

- `synchronize: false` — no exceptions, ever
- No `eager: true` on any relation
- `@JoinColumn({ name: 'snake_case_fk' })` on the owning (`@ManyToOne`) side
- `namingStrategy: SnakeNamingStrategy` (typeorm-naming-strategies)
- Load relations explicitly: `{ relations: { items: true } }` — never auto-loaded
- Both sides declared: `@ManyToOne` on child + `@OneToMany` on parent
- Use `save()` not `update()` on audited entities — AuditSubscriber needs `databaseEntity`
- Soft delete: filter `IS NULL` on `deletedAt` in every active-record query
- SSL in production: `{ ssl: { rejectUnauthorized: false } }` when `NODE_ENV !== 'local'`

---

## DTO Pattern (Zod — not class-validator)

```typescript
// create-order.dto.ts
import { z } from 'zod';

export const CreateOrderSchema = z.object({
  visitId: z.string().uuid(),
  items: z.array(z.object({ variantId: z.string().uuid(), qty: z.number().int().min(1) })),
});
export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
```

- DTOs are plain types — not classes, no decorators
- Controller owns response shaping — calls mapper after service returns entity
- No `class-validator` / `class-transformer`

---

## IAM & Permissions

- Format: `'resource:action'` — e.g. `'orders:create'`, `'menu:manage'`
- `@RequirePermissions('orders:create')` on controller methods (`common/decorators/require-permissions.decorator.ts`)
- `PermissionsGuard` resolves effective permissions:
  1. Load group memberships where `NOW() BETWEEN valid_from AND valid_until` (or null)
  2. Union all group policies + direct user policies
  3. Cache in Redis: `acl:{userId}` with short TTL
  4. Invalidate on ANY IAM mutation
- NEVER inline permission checks in service methods — always via guard

---

## Auth (LINE SSO + JWT)

- LINE callback → exchange code → upsert `staff_user_identity` → issue tokens
- Access token: JWT, 15m, payload `{ sub: staffUserId, venueId }`
- Refresh token: long-lived, HttpOnly cookie, rotated on every use
- `@CurrentUser()` decorator extracts JWT payload from request
- `JwtAuthGuard` applied globally — whitelist with `@Public()` where needed
- Reads token from cookie: `ExtractJwt.fromExtractors([(req) => req?.cookies?.['access_token']])`

---

## Transaction Management

- `@Transactional()` from `@nestjs-cls/transactional` on service methods that span repos
- NEVER pass `EntityManager` manually to repository methods
- Payment FAILED status update runs OUTSIDE transaction — must persist on rollback

---

## BullMQ (PaymentModule only)

- Queue name: `'payments'`
- Webhook receiver: validate → idempotency check (`gateway_tx_id`) → enqueue → return 200
- Processor: dequeue → update status → emit WebSocket event
- Race condition guard: pessimistic lock on visit row when creating payment
- Never delete failed jobs — BullMQ handles retry with exponential backoff

---

## WebSocket (NotificationsModule)

- `NotificationsGateway`: socket.io adapter, room subscriptions
- `NotificationsService`: injectable by Order/Payment modules
- Rooms: `'pos'` | `'bar-display'` | `'kitchen-display'`
- Multi-instance: Redis adapter bridges ECS tasks
- Domain modules inject `NotificationsService` — NEVER `NotificationsGateway` directly
- `NotificationsModule` registered globally in `AppModule`

---

## Config

See **providers/ Rules** above: `providers/config/` (`config.module.ts` + `config.schema.ts` + `AppConfigService`).
Getter domains: `app`, `database`, `redis`, `auth`, `jwt`, `payment`, `openai` — each added by the brief that needs it (schema + getter together).
No hardcoded values; no `registerAs` / `ConfigService.get('x.y')` string lookups in feature code.

---

## Module Export Rules

- Feature modules export their Service only — never the Repository
- Never share a Repository across modules — share the Service
- `IamModule` exports `PermissionResolverService`
- `NotificationsModule` registered global — no re-import needed

---

## AuditSubscriber (`providers/orm/subscribers/`)

- Registered once globally: a Nest provider that pushes itself onto the `DataSource` (no `@EventSubscriber()`, not listed in TypeORM `subscribers`)
- Listens to `beforeInsert` + `beforeUpdate` on all `BaseEntity` subclasses
- Reads `userId` from `@nestjs/cls` context (populated by `ClsUserInterceptor`)
- `audit_log` is append-only — NEVER UPDATE or DELETE it

---

## Critical Domain Invariants

- `order_item.unit_price_snapshot`: frozen at order time, never mutated
- `gateway_tx_id`: always check uniqueness before processing any payment webhook
- Visit state machine: `open → closed | abandoned` — never reopen a closed visit; `VisitService` owns all transitions
- Bottle-keep ≠ inventory: already sold to customer, no inventory deduction on pour
- `menu_variant_ingredient` lives in `MenuModule` — `InventoryModule` never reads menu tables
- PDPA: `customer_id` on visit is nullable — link only with explicit consent; AI summarizes preferences only, no behavioral judgment
- `kitchen_display_enabled`: stored in `venue` table, not env var — admin toggles at runtime

---

## DO NOT

- Use `synchronize: true`
- Use `eager: true` on relations
- Return raw TypeORM entities from controllers — map to response DTO
- Import `infrastructure/` from `application/` layer
- Import another module's `infrastructure/` directly — use its exported service
- Inline permission checks in services
- Use `update()` on audited entities — use `save()`
- Hard delete records
- Use magic strings for column types — use `COL` constants
- Put business logic in repositories
- Share repositories across modules or export them from modules
- Mutate `order_item.unit_price_snapshot` after creation
- Process a payment webhook without `gateway_tx_id` idempotency check
- Build kitchen display UI in Semester 1
- Add offline mode, member QR, staff performance analytics (cut from scope)
- Omit `.js` extensions on relative imports

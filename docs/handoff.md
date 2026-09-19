# Handoff — AI-Powered Bar Management System

**Last updated:** 2026-09-13
**Purpose:** Bring any new session (Cowork, Claude Code, Cursor) up to speed on where the project stands and what comes next.

---

## Current Status

**Phase:** ERD COMPLETE. Next: NestJS module breakdown (new session).

**Deadline:** Apr 2027 (exact date TBD, per advisor). ~7 months runway. Extra time = depth, polish, testing, and a solid thesis — NOT scope expansion.

### Done
- ✅ Proposal submitted and **approved by advisor** (อ.สนายุ จินตนาวรรณกุล).
- ✅ Full feature set mapped and filtered (see `FRD.md`).
- ✅ **FRD baselined at v1.2** — field-research-validated (2 live bars) + dual independent review passed (GPT ~98%, Grok 9.2/10). All operational edge cases + concurrency collisions closed.
- ✅ Requirements phase COMPLETE.
- ✅ **System-level architecture COMPLETE** (see Architecture Decisions below — all locked).
- ✅ **ERD COMPLETE** — 9 domains, 32 tables. Published artifact (see ERD section below). All schema decisions locked.

### Not started
- ❌ NestJS module breakdown ← **NEXT** (do in new session)
- ❌ Infra setup (CloudFormation, ECS, VPC, RDS, etc.) ← deferred to last 2 weeks of November
- ❌ API design
- ❌ Any code

---

## ERD — Final State

**Artifact:** https://claude.ai/code/artifact/19479bef-8882-4591-a0ea-5c501ee64036 (Version 4)
**File (scratchpad):** `/tmp/claude-0/-home-claude/228ab727-c65d-5ad6-92b4-4fadb545bf76/scratchpad/erd.html`
— scratchpad is ephemeral; use the artifact URL or republish from the file if the session is still alive.

### 9 domains, 32 tables

| Domain | Tables | Count |
|---|---|---|
| Venue & Tables | `venue`, `table_seat` | 2 |
| Guest & Identity | `customer`, `customer_identity`, `visit` | 3 |
| Staff IAM | `staff_user`, `staff_user_identity`, `staff_group`, `user_group_membership`, `policy`, `permission`, `policy_permission`, `group_policy`, `user_policy` | 9 |
| Menu | `menu_category`, `menu_item`, `menu_item_variant`, `modifier_group`, `modifier_option`, `menu_variant_modifier_group`, `menu_variant_ingredient` | 7 |
| Inventory | `inventory_item`, `inventory_transaction` | 2 |
| Order | `order_record`, `order_item`, `order_item_modifier` | 3 |
| Payment | `payment`, `payment_order` | 2 |
| Bottle Keep | `bottle_keep`, `bottle_keep_pour` | 2 |
| Audit Log | `audit_log` | 1 |

### Locked schema decisions (do not re-litigate)

**Naming conventions**
- Audit columns on all mutable tables: `created_by` / `updated_by` (FK → `staff_user`, **not** `_user_id` suffix) + `created_at` / `updated_at`.
- Populated automatically by TypeORM `AuditSubscriber` via `@nestjs/cls`.

**IAM model**
- AWS-style: most-permissive-wins — union of all active group policies + direct user policies.
- Time-bound group membership via `valid_from` / `valid_until` on `user_group_membership` (`valid_until` nullable = permanent).
- Permission resolution: `staff_user` → `user_group_membership` → `staff_group` → `group_policy` → `policy` → `policy_permission` → `permission`. Plus direct path: `staff_user` → `user_policy` → `policy`.
- Redis ACL cache invalidated on any IAM change.

**Identity model**
- Provider-agnostic from day 1. `staff_user_identity` and `customer_identity` hold LINE (and future OTP) credentials. Unique on `(provider, external_id)`.
- Visit ≠ Customer. Visit created on QR scan; `customer_id` linked post-hoc if they consent (PDPA).

**Menu → Inventory**
- `menu_item_variant` → `inventory_item` via `menu_variant_ingredient` (many-to-one recipe link).
- e.g. Hazy IPA (M) and Hazy IPA (L) → same keg `inventory_item`, different `quantity_used`.

**Price snapshots**
- `order_item.unit_price_snapshot` and `order_item_modifier.price_delta_snapshot` frozen at order time.
- Menu price changes never affect existing orders.

**Payment**
- `visit ||--o{ payment` — one-to-many. A visit can have multiple payments (separate bills if new orders arrive after QR generated).
- `payment_order` junction (composite PK `payment_id, order_id`) — declares which orders a payment covers.
- Unbilled orders: `order_record WHERE NOT EXISTS completed payment_order link`.
- `gateway_tx_id` UNIQUE constraint = idempotency key. GB Prime Pay webhook retries → check before settling.
- Race condition guard: pessimistic lock (`SELECT ... FOR UPDATE`) on `visit` row inside transaction when creating payment. `ConflictException` if `PENDING` payment already exists.

**Bottle Keep**
- Separate from bar inventory — already sold to customer.
- `quantity_registered` (int) + `remaining_quantity` (int) + `remaining_note` (text). No precise ml tracking — bars use "2 bottles, half left" style.

**Audit Log**
- Append-only. **Never** UPDATE or DELETE.
- Schema matches existing `AuditSubscriber` pattern (diff-only, not full snapshots):
  - `entity` varchar(100) — TypeORM entity class name
  - `entity_id` uuid
  - `action` varchar(20) — `CREATE` | `UPDATE`
  - `changed_fields` jsonb nullable — `{ fieldName: { from: oldVal, to: newVal } }` for scalar fields only; `null` on CREATE
  - `changed_by` uuid — staff user id from CLS
  - `changed_at` timestamptz
- Subscriber skips audit meta fields (`createdBy`, `updatedBy`, `createdOn`, `updatedOn`, `deletedBy`, `deletedOn`) and relation objects — scalars only.
- **Critical:** Services must use `save()` not `update()` on audited entities, or `event.databaseEntity` will be undefined and the diff will be empty.

**Kitchen Display**
- `venue.kitchen_display_enabled` in DB (not env var) — admin toggles at runtime, no redeploy.

---

## Architecture Decisions (ALL LOCKED — do not re-litigate)

### Deployment
- **Frontend:** Vercel (free). Next.js native, free SSL/CDN, preview deploys per PR.
- **Backend:** AWS ECS + ECR. One NestJS container, 1 task to start (scale to 2+ later).
- **DNS:** Cloudflare (free) + cheap domain (~$10/yr). Skip Route 53 entirely.
- **IaC:** CloudFormation. AWS-native, no extra tooling.
- **Cloud timeline:** Last 2 weeks of November. Everything local via Docker Compose until then.
- **CORS:** Configure once in NestJS — `app.enableCors({ origin: ['https://yourapp.vercel.app'], credentials: true })`.

### Repo
- **Strategy:** Monorepo — Turborepo + pnpm workspaces.
- **Structure:**
  ```
  apps/
    web/          → Next.js PWA (Vercel)
    api/          → NestJS modular monolith (ECS)
  packages/
    contracts/    → shared types, enums, DTOs (OrderStatus, SessionState, etc.)
  ```
- **Why contracts package:** Frontend + backend import same TypeScript types. Rename a field → compiler catches all breaks end-to-end.
- **Why pnpm over npm:** Strict dependency isolation — no phantom dependencies.
- **Why Turborepo over Nx:** Lighter, less ceremony. Nx is overkill for 2-person 2-semester build.

### System Shape
- **Frontend:** One Next.js PWA, 3 role-based surfaces (customer QR ordering, staff mobile, POS desktop/tablet). One app, route-based separation.
- **Backend:** One NestJS **modular monolith**. Three ingress types in one process:
  1. REST API
  2. WebSocket Gateway (socket.io)
  3. Webhook receiver (same process — not a separate container)
- No premature service split. Extract later if load demands it.

### Data Plane
- **PostgreSQL (RDS):** Source of truth. TypeORM (not Prisma — Prisma requires build-time network for binary download).
- **Redis (ElastiCache `cache.t4g.micro` ~$13/mo):** 4 jobs in one instance:
  1. ACL/permission cache (invalidated on any IAM change)
  2. Session state cache
  3. BullMQ job queue
  4. WebSocket pub/sub — socket.io Redis adapter bridges multiple ECS tasks
- **Why ElastiCache, not Redis in a container:** Redis does 4 critical jobs. Container restart = lost session state + lost BullMQ jobs + dropped WebSocket connections. Managed ElastiCache handles failover.
- **S3:** Guest photos + receipts.
- **Local dev:** Docker Compose (Postgres + Redis). Apps run natively.

### Queue — BullMQ
- **Library:** BullMQ on Redis (`@nestjs/bullmq`). SQS ruled out — adds AWS complexity for no benefit at this scale.
- **Queues (Sem 1):** `payments` + `notifications`. `ai-summary` added Semester 2.
- **Two problems it solves:**
  1. Decouple webhook response — GB Prime Pay needs 200 fast or they retry. Enqueue job → return 200 → worker processes async.
  2. Retry fragile external calls — OpenAI slow/timeout → BullMQ retries with backoff.
- **Idempotency:** Check `gateway_tx_id` before processing payment webhook. GB may retry — prevent double-settlement.
- **Outbox pattern:** NOT Semester 1. Notifications are delivery aids, not source of truth. Optional Semester 2 showcase on payment module only.

### WebSocket & Pub/Sub
- **Transport:** NestJS Gateway (socket.io adapter).
- **Multi-instance problem:** Webhook lands on Task B. POS browser connected to Task A. Redis pub/sub (socket.io Redis adapter) bridges them — all tasks publish to Redis, all tasks receive and emit to their connected sockets.
- **Rooms:** `pos` · `bar-display` · `kitchen-display`
- **Pattern:** Pub/Sub with client-driven subscription.
  - Server (DB config) decides: what publishes to which room.
  - Client (URL route) decides: which room to subscribe to.

### Kitchen Display
- **Toggle:** `venue.kitchen_display_enabled` stored in DB (not env var). Admin changes at runtime without redeployment.
- **Client registration:** URL route → room subscription. No device DB, no pairing flow.
  - `/pos` → joins `pos` + `bar-display` + `kitchen-display`
  - `/display/bar` → joins `bar-display` only
  - `/display/kitchen` → joins `kitchen-display` only
  - Staff bookmark the right URL on each device.
- **Semester 1:** Build routing logic + room structure. (Retrofitting later breaks existing clients.)
- **Semester 2:** Build kitchen display UI screen.

### Local Dev & Connectivity
- **Services:** Docker Compose — PostgreSQL + Redis.
- **Team connectivity:** ngrok — expose local NestJS to เมธี. Also solves payment webhook testing locally (GB Prime Pay needs a public URL).

---

## Tech Stack (locked)

- Frontend: Next.js PWA + Tailwind
- Backend: NestJS + PostgreSQL + TypeORM
- Cache: Redis (ElastiCache) — ACL + session + BullMQ + WebSocket pub/sub
- Queue: BullMQ (Redis-backed)
- WebSocket: NestJS Gateway (socket.io + Redis adapter)
- AI: OpenAI API
- Auth: LINE SSO + JWT + refresh rotation
- Payment: PromptPay + webhook (Omise / GB Prime Pay)
- Infra: AWS (ECS/ECR, RDS, S3, ElastiCache) + CloudFormation
- CI/CD: GitHub Actions
- Repo: Turborepo + pnpm workspaces
- Local dev: Docker Compose + ngrok
- Stretch: EKS (only after ECS solid — resume/learning goal)

---

## Roadmap (by semester)

### Semester 1
**Design & setup (do first, in this order):**
- ~~System-level architecture~~ ✅
- ~~ERD~~ ✅
- NestJS module breakdown ← **immediate next**
- Infra (CloudFormation) ← last 2 weeks of November
- API design

**Foundation:**
- Auth (LINE SSO, JWT + refresh rotation)
- IAM (groups, policies, time-bound membership, Redis ACL cache)
- Menu & Inventory core

**Customer & ordering:**
- Table & Session (static QR, session state machine)
- Identity (guest-first, consent)
- Order flow + BullMQ queue
- Payment (PromptPay QR + webhook + idempotency)
- Notification (WebSocket real-time + Web Push)

→ **Target end of Semester 1:** working vertical slice — order → pay → close.

### Semester 2
**Control & integrity:** Comps/voids, variance tracking, audit log, end-of-shift cashout

**Differentiators:** Guest Intelligence (AI summary), Bottle Keep, Promotion + Happy Hour, Analytics dashboards

**Cross-cutting:** LINE OA, kitchen display UI, optional outbox pattern (payment module)

---

## NestJS Module Breakdown — Tricky Boundaries (known before starting)

These are the cross-cutting concerns to resolve when mapping domains to modules:

- **IAM module** must be imported by almost everything — wrap in a `PermissionsGuard` + Redis cache layer, not inline permission checks per controller.
- **AuditSubscriber** is global — one `@EventSubscriber()` on `DataSource`, not per-module. Register once in `AppModule`.
- **WebSocket gateway** touches Order + Payment events. Plan for a `NotificationsModule` that other modules can inject to emit events, rather than importing the gateway directly.
- **BullMQ** — `PaymentModule` enqueues; a `PaymentWorkerModule` (or same module, separate processor) consumes. Don't couple the HTTP controller to the processor.
- **BaseEntity** — define once in `packages/contracts` or a shared `common/` module. All entities extend it; `AuditSubscriber` listens to it.

---

## Open Questions (remaining)

1. Project deadline: **Apr 2027** (exact date TBD). Semester split is self-imposed pacing.
2. Thesis template / required chapter structure — get from program.

---

## Working Style Reminders

- Break work into small steps; don't dump full solutions.
- Simple/maintainable before complex.
- Don't expand scope mid-build — finish core vertical slice (order → pay → close) first.
- AI does ~40% (boilerplate/CRUD); human owns architecture + integration + edge cases.
- Don't let perfectionist infra (EKS ambition) starve the product — get working ECS deploy first.
- Reference `FRD.md` for scope; don't reintroduce cut features.

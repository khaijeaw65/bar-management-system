# CLAUDE.md — AI-Powered Bar Management System

> Read this file at the start of every session. It is the single source of truth for project context, architecture decisions, and working rules.
> For full feature scope → `docs/FRD.md`. For schema details → `docs/schema.sql`. For session state → `docs/handoff.md`.

---

## Project Overview

Senior capstone project (2 semesters, DPU Computer Engineering).
A production-grade bar management system for small-to-medium counter bars in Thailand.
Key differentiators: AI-powered guest intelligence, bottle-keep, PromptPay QR payment, real-time kitchen/bar display.

**Team**
- ณัฐวัฒน์ จิรกุลประดิษฐ์ (66210096) — Project Lead / Backend
- เมธี สิริปาณสาร (630107030019) — Frontend Developer

**Advisor:** อ.สนายุ จินตนาวรรณกุล
**Deadline:** April 2027

---

## Repo Structure

```
/
├── docs/           → FRD, ERD, schema, infra, handoff
├── frontend/       → Next.js 15 PWA (Tailwind, ESM, Vitest)
├── backend/        → NestJS modular monolith (ESM, Vitest, TypeORM)
├── .claude/        → Claude-specific configs
├── .cursor/        → Cursor IDE configs
├── CLAUDE.md       ← this file
├── AGENTS.md       → agent-agnostic context
└── .cursorrules    → Cursor rules
```

---

## Tech Stack (LOCKED — do not change without a deliberate decision)

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 PWA + Tailwind CSS |
| Backend | NestJS modular monolith + TypeORM |
| Database | PostgreSQL (RDS) |
| Cache | Redis (ElastiCache) — ACL + session + BullMQ + WebSocket pub/sub |
| Queue | BullMQ (`@nestjs/bullmq`) |
| WebSocket | NestJS Gateway (socket.io + Redis adapter) |
| AI | OpenAI API |
| Auth | LINE SSO + JWT + refresh token rotation |
| Payment | PromptPay QR + webhook (GB Prime Pay) |
| Infra | AWS ECS/ECR, RDS, S3, ElastiCache + CloudFormation |
| CI/CD | GitHub Actions |
| Local dev | Docker Compose (Postgres + Redis) + ngrok |

---

## Architecture (ALL LOCKED)

### Shape
- **One NestJS process** — REST API + WebSocket Gateway + webhook receiver. No microservices.
- **One Next.js PWA** — 3 role-based surfaces (customer QR, staff mobile, POS desktop) via route separation.
- **Modular monolith** — extract services only if load demands it post-launch.

### IAM Model
- AWS-style most-permissive-wins: union of group policies + direct user policies.
- Time-bound group membership (`valid_from` / `valid_until`).
- Permission resolution cached in Redis, invalidated on any IAM change.
- **Always use `PermissionsGuard` — never inline permission checks in controllers.**

### Identity Model
- Provider-agnostic from day 1. `staff_user_identity` + `customer_identity` hold LINE credentials.
- Visit ≠ Customer. Visit created on QR scan; `customer_id` linked post-hoc (PDPA consent).

### Deployment
- Frontend → Vercel (free). Backend → AWS ECS + ECR.
- DNS → Cloudflare (not Route 53). IaC → CloudFormation.
- Cloud setup deferred to **last 2 weeks of November**. Local dev via Docker Compose until then.

---

## Database (ERD — 9 domains, 32 tables)

Domains: Venue & Tables · Guest & Identity · Staff IAM · Menu · Inventory · Order · Payment · Bottle Keep · Audit Log

Full schema: `docs/schema.sql` | Visual ERD: `docs/erd.html`

**Critical schema rules:**
- All mutable tables have `created_by` / `updated_by` (FK → `staff_user`) + `created_at` / `updated_at` — populated by `AuditSubscriber` via `@nestjs/cls`.
- `AuditSubscriber` is global — registered once in `AppModule`, not per module.
- Services must use `save()` not `update()` on audited entities.
- `audit_log` is append-only — never UPDATE or DELETE.
- `order_item.unit_price_snapshot` frozen at order time — menu price changes never affect existing orders.
- `gateway_tx_id` UNIQUE constraint = payment idempotency key.

---

## Module Boundaries (to be defined — next task)

Cross-cutting concerns to resolve:
- `IamModule` — imported by almost everything; wraps `PermissionsGuard` + Redis cache.
- `NotificationsModule` — injectable by Order + Payment modules to emit WebSocket events; do NOT import the gateway directly.
- `BullMQ` — `PaymentModule` enqueues; separate processor consumes. HTTP controller must not be coupled to the processor.
- `BaseEntity` — defined in `backend/src/common/`; all entities extend it.

---

## Working Rules

- **Finish core vertical slice first:** order → pay → close. No scope expansion mid-build.
- **Simple before complex.** No premature abstractions.
- AI tools (~40% of work) handle boilerplate/CRUD/scaffolding. Human owns architecture, integration, edge cases.
- EKS is a stretch goal — only after ECS is solid. Do not touch Kubernetes in Semester 1.
- Infra features cut from scope (see `docs/FRD.md`): offline mode, member QR, staff performance analytics. Do not reintroduce.
- Break tasks into small steps. Do not dump full solutions.
- Always explain WHY a solution is chosen, not just what.

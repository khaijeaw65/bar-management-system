# CLAUDE.md — AI-Powered Bar Management System

> Read this file at the start of every session. It is the single source of truth for project context, architecture decisions, and working rules.
> For full feature scope → `docs/FRD.md`. For schema details → `docs/schema.sql`. For workflow & roles → `docs/rules/workflow.md`. For current state → `docs/state/<person>/SESSION_STATE.md`.

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
├── app/
│   ├── backend/            → NestJS modular monolith (ESM, Vitest, TypeORM)
│   ├── frontend/           → Next.js 16 web app (HeroUI v3, Tailwind v4)
│   ├── mobile/             → Expo React Native — staff surface (planned, not created yet)
│   └── packages/contracts/ → @bar/contracts — shared enums & types
├── docs/
│   ├── rules/              → all agent rules (source of truth) incl. workflow.md
│   ├── briefs/             → executable briefs (<ID>-<slug>.md) + ui/ design references
│   ├── state/              → kj/SESSION_STATE.md, methee/SESSION_STATE.md — current progress per person
│   ├── handoffs/ decisions/ audits/
│   └── FRD.md, schema.sql, erd.html, infra.md, handoff.md (frozen legacy log)
├── .cursor/rules/ .agents/rules/ → thin wrappers → docs/rules/
├── CLAUDE.md               ← this file
└── AGENTS.md               → agent-agnostic context (Codex reads this)
```

---

## Tech Stack (LOCKED — do not change without a deliberate decision)

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 web app + HeroUI v3 + Tailwind v4 (DR-002) · axios + TanStack Query (DR-007) |
| Mobile | Expo (React Native) — staff surface duplicate |
| Backend | NestJS modular monolith + TypeORM |
| Database | PostgreSQL (RDS) |
| Cache | Redis (ElastiCache) — ACL + session + BullMQ + WebSocket pub/sub |
| Queue | BullMQ (`@nestjs/bullmq`) |
| WebSocket | NestJS Gateway (socket.io + Redis adapter) |
| AI | OpenAI API |
| Auth | LINE SSO + JWT + refresh token rotation |
| Payment | PromptPay QR + webhook (GB Prime Pay) |
| Infra | AWS ECS/ECR, RDS, S3, ElastiCache + Terraform (`infra/terraform/`) |
| CI/CD | GitHub Actions · local SonarQube Community scan before commit (BRIEF-006; shared hosting decided in Nov) |
| Local dev | Docker Compose (Postgres + Redis) + ngrok |

---

## Architecture (ALL LOCKED)

### Shape
- **One NestJS process** — REST API + WebSocket Gateway + webhook receiver. No microservices.
- **One Next.js web app** — role-based surfaces (POS `/pos`, staff `/staff`, customer QR) via route segments. No PWA — native + push is the Expo app (DR-002).
- **One Expo React Native app** — duplicates staff mobile surface only. Same backend API, no new endpoints. Scope: login, table/session list, order taking, order management, push notifications, guest notes entry, bottle keep check.
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
- DNS → Cloudflare (not Route 53). IaC → Terraform (DR-001) — AWS + Cloudflare from one config.
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
- `BaseEntity` — defined in `app/backend/src/common/`; all entities extend it.

---

## Workflow & Decision Authority

Approval policy: routine scoped work and Git (including task-branch commit/push/PR creation) proceed without repeated questions; critical decisions, destructive actions, main merges and releases require explicit authority. See `docs/rules/workflow.md` §4. Tool/sandbox permission prompts remain separate.

Chat commands: `onboard kj|methee`, `execute BRIEF-###` (`ทำ`), `resume`, `audit BRIEF-###` (`ตรวจ`), `สถานะ BRIEF-###`, `handoff`, `อนุมัติ merge BRIEF-###` — definitions and limits in `docs/rules/workflow.md` §4. Briefs use project-wide `BRIEF-###` (old BE/FE/MB/SH prefixes retired — rename map in `docs/rules/workflow.md` §10).

@docs/rules/workflow.md

- **Field** (KJ) is the only decision authority. Any new dependency, brief deviation, flow/architecture change, schema change, or auth/payment/PDPA change → needs approval: an exact Pre-decided item in the Ready brief, or an Approved DR. Neither → raise a DR and stop that path. Never decide alone.
- **Roles:** Cowork = auditor + decision partner (no app code). Claude Code / Cursor / Antigravity / Codex = executors (only inside a `Ready` brief).
- **Lifecycle:** executor marks `Implemented` → assigned auditor reviews → merge: Field's own PRs pre-approved once audit PASS + checks green on the audited head; Methee's PRs need Field's `อนุมัติ merge` for the exact head → merged PR means `Done`.
- **Every implementation session:** read `docs/state/<person>/SESSION_STATE.md` + run the checkout check at start, overwrite state at end.

---

## Working Rules

> **Agent boundaries:** See `docs/rules/agent-boundaries.md`. Never modify listed files.

- **Finish core vertical slice first:** order → pay → close. No scope expansion mid-build.
- **Simple before complex.** No premature abstractions.
- AI split: Field 20–30% / agents 70–80% (reviewer mode). เมธี 70–80% / agents ≤ 20% (learning mode). Humans own architecture, integration, edge cases.
- EKS is a stretch goal — only after ECS is solid. Do not touch Kubernetes in Semester 1.
- Infra features cut from scope (see `docs/FRD.md`): offline mode, member QR, staff performance analytics. Do not reintroduce.
- Break tasks into small steps. Do not dump full solutions.
- Always explain WHY a solution is chosen, not just what.

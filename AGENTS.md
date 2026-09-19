# AGENTS.md — AI-Powered Bar Management System

> Agent-agnostic project context. Read alongside `CLAUDE.md` for full detail.
> For feature scope → `docs/FRD.md`. For schema → `docs/schema.sql`. For current session state → `docs/handoff.md`.

---

## What This Project Is

A production-grade bar management system for small-to-medium counter bars in Thailand. Senior capstone project, DPU Computer Engineering, targeting April 2027 delivery.

Core flows: QR-based guest ordering → kitchen/bar display → PromptPay payment → session close.
Differentiators: AI guest intelligence (OpenAI), bottle-keep, real-time WebSocket display, LINE SSO auth.

---

## Repo Layout

```
frontend/   → Next.js 15 PWA (customer QR ordering, staff mobile, POS desktop)
backend/    → NestJS modular monolith (REST + WebSocket + webhook in one process)
docs/       → FRD.md, erd.html, schema.sql, infra.md, handoff.md
```

---

## Stack (locked)

- **Frontend:** Next.js 15 + Tailwind CSS + Vitest
- **Backend:** NestJS + TypeORM + PostgreSQL + Redis + BullMQ + Vitest
- **Auth:** LINE SSO + JWT + refresh rotation
- **Payment:** PromptPay QR + GB Prime Pay webhook
- **AI:** OpenAI API (guest preference summary — never behavioral profiling)
- **Infra:** AWS ECS/ECR + RDS + S3 + ElastiCache + CloudFormation + Vercel (frontend)

---

## Hard Rules for Agents

1. **Do not split into microservices.** One NestJS process, one Next.js app.
2. **Do not use `update()` on audited entities** — use `save()` or `AuditSubscriber` produces empty diffs.
3. **Do not inline permission checks** in controllers — always go through `PermissionsGuard`.
4. **Do not touch `audit_log`** with UPDATE or DELETE — append-only.
5. **Do not reintroduce cut features:** offline mode, member QR, staff performance analytics.
6. **Do not add Kubernetes/EKS** until ECS is stable and shipping.
7. **Price snapshots are immutable** — `order_item.unit_price_snapshot` is frozen at order time.
8. **Payment idempotency** — always check `gateway_tx_id` before processing a webhook.

---

## Current Phase

ERD complete. Next: NestJS module breakdown → repo scaffold → auth module.
See `docs/handoff.md` for exact current state before starting any task.

# AGENTS.md — AI-Powered Bar Management System

> Agent-agnostic project context. Read alongside `CLAUDE.md` for full detail.
> For feature scope → `docs/FRD.md`. For schema → `docs/schema.sql`. For workflow & roles → `docs/rules/workflow.md`. For current state → `docs/state/<person>.md`.

---

## What This Project Is

A production-grade bar management system for small-to-medium counter bars in Thailand. Senior capstone project, DPU Computer Engineering, targeting April 2027 delivery.

Core flows: QR-based guest ordering → kitchen/bar display → PromptPay payment → session close.
Differentiators: AI guest intelligence (OpenAI), bottle-keep, real-time WebSocket display, LINE SSO auth.

---

## Repo Layout

```
app/backend/            → NestJS modular monolith (REST + WebSocket + webhook in one process)
app/frontend/           → Next.js 16 web app (customer QR ordering, staff web, POS desktop)
app/mobile/             → Expo React Native, staff surface (planned, not created yet)
app/packages/contracts/ → @bar/contracts — shared enums & types
docs/                   → rules/, briefs/, state/, handoffs/, decisions/, audits/, FRD.md, schema.sql
```

---

## Stack (locked)

- **Frontend:** Next.js 16 + Tailwind CSS + Vitest
- **Backend:** NestJS + TypeORM + PostgreSQL + Redis + BullMQ + Vitest
- **Auth:** LINE SSO + JWT + refresh rotation
- **Payment:** PromptPay QR + GB Prime Pay webhook
- **AI:** OpenAI API (guest preference summary — never behavioral profiling)
- **Infra:** AWS ECS/ECR + RDS + S3 + ElastiCache + Terraform (`infra/terraform/`) + Vercel (frontend)

---

## Before Any Task (mandatory)

Approval policy: routine scoped work and Git (including task-branch commit/push/PR creation) proceed without repeated questions; critical decisions, destructive actions, main merges and releases require explicit authority. See `docs/rules/workflow.md` §4. Tool/sandbox permission prompts remain separate.

Chat commands: `onboard kj|methee`, `resume kj|methee`, `ทำ BRIEF-###`, `ตรวจ BRIEF-###`, `สถานะ BRIEF-###`, `handoff` — definitions and limits in `docs/rules/workflow.md` §4. Briefs use project-wide `BRIEF-###` (old BE/FE/MB/SH prefixes retired — rename map in `docs/rules/workflow.md` §10).

1. Read `docs/rules/workflow.md` — roles, session types, brief lifecycle, gates, Field Guard.
2. Decide your **session type** (workflow.md §1): Implementation · Audit · Planning · Onboarding. Audit, Planning and Onboarding sessions follow their own write limits and do not need a Ready brief.
3. **Implementation sessions:** identify who runs this session (Field or เมธี) — ask if unclear. Read `docs/state/<person>.md`, then the `Ready` brief and its linked DRs. Run the read-only checkout check (`git status`, branch, last commit) — mismatch → stop and report.
4. Implementation sessions end by overwriting `docs/state/<person>.md`. When all ACs pass G1 → handoff + status `Implemented`. Only Field sets `Done`.

**Field (KJ) is the only decision authority.** New dependency, brief deviation, flow/architecture change, schema/contracts change, or auth/payment/PDPA change — unless already **approved** (exact Pre-decided item in the Ready brief, or an Approved DR) → create a DR in `docs/decisions/`, stop that path, and start your reply with `FIELD REVIEW NEEDED: DR-### — <one line>`.

---

## Hard Rules for Agents

> **Agent boundaries:** See `docs/rules/agent-boundaries.md`. Never modify listed files.

1. **Do not split into microservices.** One NestJS process, one Next.js app.
2. **Do not use `update()` on audited entities** — use `save()` or `AuditSubscriber` produces empty diffs.
3. **Do not inline permission checks** in controllers — always go through `PermissionsGuard`.
4. **Do not touch `audit_log`** with UPDATE or DELETE — append-only.
5. **Do not reintroduce cut features:** offline mode, member QR, staff performance analytics.
6. **Do not add Kubernetes/EKS** until ECS is stable and shipping.
7. **Price snapshots are immutable** — `order_item.unit_price_snapshot` is frozen at order time.
8. **Payment idempotency** — always check `gateway_tx_id` before processing a webhook.
9. **Never decide alone** — anything on the Field Guard trigger list goes through a DR (workflow.md §5).
10. **Never edit briefs, rules, or the other person's state file.** Protected files only if the active brief lists the exact path under *Unlocked protected files*.

---

## Current Phase

Phase 1 — core vertical (order → pay → close). Scaffold stage, no business logic yet.
Current progress lives in `docs/state/kj.md` and `docs/state/methee.md` — not here.

# AGENTS.md — AI-Powered Bar Management System

> Agent-agnostic project context. Read alongside `CLAUDE.md` for full detail.
> For feature scope → `docs/FRD.md`. For schema → `docs/schema.sql`. For workflow & roles → `docs/rules/workflow.md`. For feature specs → `docs/features/`. For current state → `docs/state/<person>/SESSION_STATE.md`.

---

## What This Project Is

A production-grade bar management system for small-to-medium counter bars in Thailand. Senior capstone project, DPU Computer Engineering, targeting April 2027 delivery.

Core flows: QR-based guest ordering → kitchen/bar display → PromptPay payment → session close.
Differentiators: AI owner insight (OpenAI — sales / anomaly-fraud / menu, DR-014), bottle-keep, real-time WebSocket display, LINE SSO auth.

---

## Repo Layout

```
app/backend/            → NestJS modular monolith (REST + WebSocket + webhook in one process)
app/frontend/           → Next.js 16 web app (customer QR ordering, staff web, POS desktop)
app/mobile/             → Expo React Native, staff surface (planned, not created yet)
app/packages/contracts/ → @bar/contracts — shared enums & types
docs/                   → rules/, features/, briefs/, state/, handoffs/, decisions/, audits/, FRD.md, schema.sql
```

---

## Stack (locked)

- **Frontend:** Next.js 16 + Tailwind CSS + Vitest
- **Backend:** NestJS + TypeORM + PostgreSQL + Redis + BullMQ + Vitest
- **Auth:** LINE SSO + JWT + refresh rotation
- **Payment:** PromptPay QR + GB Prime Pay webhook
- **AI:** OpenAI API (owner insight: sales / anomaly-fraud / menu — DR-014; guest summary dropped)
- **Infra:** AWS ECS/ECR + RDS + S3 + ElastiCache + Terraform (`infra/terraform/`) + Vercel (frontend)

---

## Scoped Rules

Before editing files in a path below, read its rule file.

| Path | Rule file |
|---|---|
| `app/backend/**` | `docs/rules/backend.md` |
| `app/frontend/**` | `docs/rules/frontend.md` |
| `app/mobile/**` | `docs/rules/mobile.md` |

---

## Before Any Task (mandatory)

Approval policy: routine scoped work and Git (including task-branch commit/push/PR creation) proceed without repeated questions; critical decisions, destructive actions, main merges and releases require explicit authority. See `docs/rules/workflow.md` §4. Tool/sandbox permission prompts remain separate.

Chat commands & skills: `onboard kj|methee`, `/new-feature`, `/new-brief`, `/new-dr`, `execute BRIEF-###` (`ทำ`), `start BRIEF-###`, `fix BRIEF-### (#…)`, `ship BRIEF-###`, `audit BRIEF-###` (`ตรวจ`), `/review`, `อนุมัติ merge BRIEF-###` (`approve merge`), `/checkpoint` (`/save-session`), `resume` (`/resume`), `/autopilot`, `สถานะ BRIEF-###` (`status`), `handoff` — definitions in `docs/rules/workflow.md` §4. Briefs use project-wide `BRIEF-###` (old BE/FE/MB/SH prefixes retired — rename map in `docs/rules/workflow.md` §10).

0. **Every session, any type — no "resume" prompt needed:** read your own state (`docs/state/<id>/SESSION_STATE.md`; the planner reads kj's) and the active files it lists, then open with 2–3 lines: where work stands and the next action.
1. Read `docs/rules/workflow.md`, `docs/rules/core.md`, `docs/rules/agent-boundaries.md`, `docs/rules/ponytail.md` and `docs/features/INVARIANTS.md`.
2. Decide your **session type** (workflow.md §1): Implementation · Audit · Planning · Autopilot · Onboarding · explicit Field-authorized workflow maintenance. Non-implementation sessions follow their own write limits and do not need a Ready brief.
3. **Implementation sessions:** identify who runs this session (Field or เมธี) — ask if unclear. Read own state, then the `Ready` brief, linked `docs/features/<f>/{requirements,design,ui}.md` (ui if present), `docs/features/INVARIANTS.md`, and linked DRs. Run the read-only checkout check (`git status`, branch, last commit) — mismatch → stop and report.
4. Keep own state current at **checkpoints** — commit, merge, brief status change, decision, blocker — and use `/checkpoint` before rotating out of a long session (keep *Carry over* unchanged). When all Build Steps and ACs pass G1 → handoff + status `Implemented`. Commit and push per workflow.md §3 — one brief = one branch = one PR, opened only after audit PASS. Done is derived from the merged PR after Field approval; no status-only brief edit is required.

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
7. **Price and name snapshots are immutable** — `order_item.unit_price_snapshot` and the name snapshots (`item_name_snapshot`, `variant_name_snapshot`, `order_item_modifier.option_name_snapshot`) are frozen at order time (DR-022).
8. **Payment idempotency** — always check `gateway_tx_id` before processing a webhook.
9. **Never decide alone** — anything on the Field Guard trigger list goes through a DR (workflow.md §5).
10. **Never change brief scope/approval, rules, or the other person's state on your own initiative. Packaging commits (Field-approved brief revision, audit report at PASS) and explicit Field-authorized maintenance are defined in workflow.md.** Protected files only if the active brief lists the exact path under *Unlocked protected files* **or** Field approves the exact diff in this session (commit trailer `Approved-by: Field (session)`). Never hand a protected edit to Field to type — propose the diff and ask.
11. **Never edit seeded e2e files** during implementation — Cowork writes them at brief time; executors write `*.spec.ts` unit tests and app code only. A seeded e2e bug → stop and ask Field or raise a DR.
12. **Never audit work you implemented, seeded, fixed, or paired on** — refuse `audit BRIEF-###` in the implementer's session and name Cowork instead.
13. **Not run is never pass** — report exact commands, exits, and limitations.
14. **One executor per checkout.** At start, if the checkout is on another brief's branch or has dirty files outside your brief, another agent is working here → stop and report. A parallel brief runs only in its own worktree (`.worktrees/BRIEF-###`, workflow §3) and never writes owner/member state.
15. **Never push to `main`; merge only via `อนุมัติ merge` / `/review`** (gates checked on the exact head, merge commit only).

---

## Current Phase

Phase 1 — core vertical (order → pay → close). Scaffold stage, no business logic yet.
Current progress lives in `docs/state/kj/SESSION_STATE.md` and `docs/state/methee/SESSION_STATE.md` — not here.

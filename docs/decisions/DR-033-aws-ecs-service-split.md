# DR-033 — Host everything on AWS ECS: web + api + worker + ML task (drop Vercel)

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Field via Cowork · 2026-11-08 (re-scope session — Field agreed the direction) |
| **Brief / Feature** | AWS setup briefs, 9–20 Nov · `docs/infra.md` |
| **Category** | Flow/Architecture · Infra |

## Context
Current plan (`docs/infra.md`, DR-001, DR-002): Next.js on **Vercel** (free), one NestJS process on **ECS Fargate** behind an ALB, Cloudflare DNS, ~$54 / month while running, spin-up → demo → `terraform destroy`.

Three things changed:
1. **DR-032** adds a Python ML batch job that must run daily next to the database.
2. **DR-031** doubles the backend: more BullMQ jobs (payment expiry, push, ticket hold expiry, auto-86, recurring expenses) now share the process that serves the API and WebSocket.
3. **Cookies:** web and API must sit under one site (`pos.` / `api.` via Cloudflare) for `lax` host-only cookies (BRIEF-028 Q1). Easier when both are behind the same ALB and domain.

Showing the whole system on AWS is also stronger for the "system design" grade than a split Vercel + AWS story.

## Options

### Option A — One ECS cluster, four workloads, one ALB *(recommended)*
| Workload | What | ECS type | Size |
|---|---|---|---|
| `web` | Next.js `output: "standalone"` image | service | 0.25 vCPU / 0.5 GB |
| `api` | NestJS — REST + WebSocket Gateway + webhooks | service | 0.25 vCPU / 0.5 GB |
| `worker` | **same NestJS image**, BullMQ processors only (`WORKER=1` entrypoint, no HTTP) | service | 0.25 vCPU / 0.5 GB |
| `ml` | Python image (`app/ml/`), DR-032 | scheduled task — EventBridge, daily after the 06:00 business-day cut-off | 0.5 vCPU / 1 GB, minutes per day |

- **Routing:** one ALB, host-based rules → `pos.<domain>` → `web` target group, `api.<domain>` → `api` target group (one ALB saves ~$16 vs two). Cloudflare proxies both hosts (DNS + free WAF / DDoS); TLS Full (strict) to an ACM cert on the ALB.
- **Pros / Cons:** one platform, one Terraform config, same-site cookies solved, slow jobs never block API requests, ML runs where the data is / ~$18 / month more while running, Vercel preview deploys per PR are lost, three images to build in CI.
- **Under the hood (a payment expires while the POS is open):**
  1. `api` creates the payment and enqueues a BullMQ expiry job in Redis.
  2. `worker` picks the job up, runs `PaymentService` expiry (DB transaction).
  3. `worker` emits the WebSocket event through the existing `@socket.io/redis-adapter` (Redis pub/sub) → `api` delivers it to the POS socket.
  - **Transaction boundary:** expiry status change in one DB transaction inside `worker`; WebSocket emit after commit.
  - **Failure & cleanup:** `worker` down → jobs wait in Redis and run when it restarts (BullMQ retries); event emit lost → POS re-reads on its next query / reconnect. `ml` task fails → run marked `failed`, dashboard keeps the previous run (DR-032).
- **Risk to check first:** NestJS only wires the WebSocket Gateway when an HTTP server starts. The worker-split brief must prove `worker` can emit through the Redis adapter without a new library; if it cannot → raise a small DR (`@socket.io/redis-emitter`) before splitting.

### Option B — Keep Vercel + one NestJS process; add only the ML task [familiar baseline]
- **Pros / Cons:** smallest change, Vercel free + preview deploys / cross-site cookies stay a problem (needs custom domain on Vercel + Cloudflare anyway), jobs and API share one 0.5 GB task, frontend story stays outside AWS.

### Option C — EKS (Kubernetes) [new to Field]
- **Pros / Cons:** resume / learning value / control plane ~$73 / month + nodes ≈ $130–200 / month idle vs Fargate ≈ $30–50; AWS window is 9–20 Nov with exams after; scope just doubled. **Rejected now** — stays the stretch goal: late Semester 2 "same images on EKS" showcase.

## Recommendation
Option A. It keeps one NestJS codebase (worker is the same image with another entrypoint — still a modular monolith, not microservices) while taking jobs off the request path, and puts the whole system on AWS for the 14 Dec demo. Cost stays small because of the spin-up → demo → destroy strategy.

**Rollout (9–20 Nov, smallest first):** `api` alone on ECS → `web` on ECS + host routing + Cloudflare → `worker` split (after the Redis-adapter check) → `ml` scheduled task as a stub (writes one `ml_model_run` row) until DR-032 models exist. If time runs out before exams, `worker` stays inside `api` (one env flag) — nothing else depends on the split.

| Component | Cost / month (running) |
|---|---|
| Fargate `web` + `api` + `worker` (3 × ~$9) | ~$27 |
| `ml` scheduled task | < $1 |
| RDS db.t3.micro · ElastiCache t4g.micro · ALB · S3 | ~$45 |
| Cloudflare, GitHub Actions | free |
| **Total** | **~$73 / month** (vs ~$54 today) · demo session (~2 h) ≈ $0.20 |

## If Approved — Locks
- `CLAUDE.md` / `AGENTS.md` (protected — Field edits): Deployment **"Frontend → Vercel"** → **"Web → AWS ECS (Next.js standalone)"**; Architecture Shape **"One NestJS process"** → **"One NestJS codebase, two ECS services: `api` (REST + WebSocket + webhooks) and `worker` (BullMQ processors)"** + **"one Python ML scheduled task"** (DR-032).
- DR-002 hosting part superseded (Next.js 16 + HeroUI stack unchanged). DR-001: Terraform manages AWS + Cloudflare only (no Vercel provider).
- `docs/infra.md` rewritten: diagram, component / cost table, ALB host rules, EventBridge schedule, ML DB role (read app tables, write `ml_*`), Terraform rollout adds ECR repos `web` / `api` / `ml`, 2nd target group, EventBridge rule. Public-subnet Fargate (no NAT) decision unchanged.
- DNS stays Cloudflare (Route 53 rejected). EKS = stretch goal only.
- HTTP controllers never import a processor; processors live only in modules the `worker` entrypoint loads (CLAUDE.md BullMQ rule, unchanged).

---

## Decision — Field only
**Decision:** Approved: A (web + api + worker + ml on one ECS cluster, one ALB; worker split may stay inside `api` behind a flag if the Redis-adapter check fails or time runs out)
**Why:** Whole system on AWS for the 14 Dec demo, same-site cookies, jobs off the request path, ML next to the data; cost stays small with spin-up → demo → destroy. EKS stays the stretch goal.
**Date:** 2026-11-08 (Field, in session — recorded by Cowork)

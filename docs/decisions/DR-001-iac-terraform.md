# DR-001 — IaC: Terraform instead of CloudFormation; all infra files under `infra/`

| | |
|---|---|
| **Status** | Pending |
| **Raised by** | Field via Cowork · 2026-09-23 |
| **Brief** | none (affects the future cloud-setup brief) |
| **Category** | Flow/Architecture |

## Context
IaC was locked as CloudFormation. The planned infra spans three providers: AWS (ECS, RDS, ElastiCache, S3, ECR, ALB), **Cloudflare** (DNS) and **Vercel** (frontend). CloudFormation can only manage the AWS part, so DNS and Vercel would stay manual clicks. Infra files also have no home: `docker-compose.yml` and `cloudformation/**` were planned at repo root.

## Options
**A) Keep CloudFormation** — AWS-native, no state to manage / cannot manage Cloudflare or Vercel; YAML gets verbose; AWS-only skill.
**B) Terraform** — one tool for AWS + Cloudflare + Vercel; `plan` shows diffs before apply; `destroy` fits the spin-up → demo → tear-down strategy; widely used in industry / must manage remote state (S3 bucket, bootstrapped once) and pin versions.

Plus: move all infra files under a root `infra/` folder (`infra/terraform/`, `infra/docker-compose.yml`).

## Recommendation
B. Cloud setup has not started, so switching costs nothing now. The Cloudflare DNS decision makes a multi-provider tool the better fit. Keep it minimal: one root module, one `demo` environment, S3 backend with native locking (no DynamoDB). Cost impact ≈ $0 (state bucket pennies/month).

**Follow-ups (Field, manual — protected files):** `CLAUDE.md` (stack table + Deployment), `AGENTS.md` (Infra line), `docs/rules/agent-boundaries.md` (`docker-compose.yml` + `cloudformation/**` → `infra/**`), `docs/rules/workflow.md` §5 unlockable list, `docs/rules/core.md` (compose path).

---

## Decision — Field only
**Decision:** <Approved: B · Rejected · Approved with change: …>
**Why:**
**Date:**

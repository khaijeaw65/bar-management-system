# AGENTS.md — AI-Powered Bar Management System

> Always loaded by every agent and tool. Single source for project context, the Field Guard and hard rules.
> Process detail: `docs/rules/workflow.md` (read the section a command names). Docs map: `docs/README.md`.

## Project
Production-grade bar management system for small-to-medium counter bars in Thailand — senior capstone (2 semesters, DPU Computer Engineering).
Core flow: **QR guest ordering → kitchen/bar display → PromptPay payment → session close** — finish it end-to-end before adding breadth.
Differentiators: bar-specific shop management (stock + loss, purchasing, shift close, P&L, compliance lock, events — DR-031), own ML models (forecast, anomaly, guest recommendations — DR-032, no LLM), bottle-keep, PromptPay QR + slip verify, real-time kitchen/bar display.
Deadline: April 2027 · Advisor: อ.สนายุ จินตนาวรรณกุล · Full scope: `docs/FRD.md` · Schema: `docs/schema.sql` (38 tables, 10 domains), ERD `docs/erd.html`
**Team:**
- KJ — ณัฐวัฒน์ จิรกุลประดิษฐ์ (66210096) — project lead / backend · decision owner (Field)
- Metee — เมธี สิริปาณสาร (630107030019) — frontend/web and mobile developer

AI split (Field, 2026-10-09 · DR-030): agents write 100% of app code for both developers; Field reviews, owns architecture, decisions, brief approval, audit review and merge. Humans own architecture, integration and edge cases.

## Stack (locked — change only through an Approved DR)
| Layer | Choice |
|---|---|
| Backend | NestJS modular monolith + TypeORM · PostgreSQL (RDS) |
| Frontend | Next.js 16 web app + HeroUI v3 + Tailwind v4 (DR-002) · axios + TanStack Query (DR-007) — no PWA |
| Mobile | Expo (React Native) — staff surface only, same backend API (DR-009) |
| Cache / queue / realtime | Redis (ElastiCache): ACL cache, session, BullMQ (`@nestjs/bullmq`), socket.io Redis adapter · NestJS WebSocket Gateway |
| Auth | LINE SSO + JWT + refresh rotation |
| Payment | PromptPay QR + GB Prime Pay webhook |
| AI | Own ML: Python (pandas, scikit-learn, LightGBM) daily batch job → `ml_*` tables — **no LLM API** (DR-032) |
| Infra | AWS ECS: `web` + `api` + `worker` services + `ml` scheduled task, one ALB (DR-033) · RDS · ElastiCache · S3 · ECR · Terraform for AWS + Cloudflare (`infra/terraform/`, DR-001) · DNS on Cloudflare — `docs/infra.md` |
| CI / local | GitHub Actions · Docker Compose (Postgres + Redis) + ngrok · SonarQube Community (opt-in per brief) |

Repo: `app/backend` (NestJS) · `app/frontend` (Next.js) · `app/mobile` (Expo, `@bar/mobile`) · `app/packages/contracts` (`@bar/contracts`) · `app/ml/` (Python, DR-032 — created by its first brief) · `docs/` · `infra/`.

## Scoped rules — read before editing
| Path | Rule file |
|---|---|
| `app/backend/**` | `docs/rules/backend.md` (proven pack) |
| `app/frontend/**` | `docs/rules/frontend.md` (proven pack) |
| `app/mobile/**` | `docs/rules/mobile.md` (proven pack) |
Editing `<app>/**` → read its rule file first, even if your tool did not load it. Workspace bans: `docs/rules/core.md`.

## Architecture (locked)
- **One NestJS codebase, two ECS services** — `api` (REST + WebSocket Gateway + webhooks) and `worker` (same image, BullMQ processors only) — still a modular monolith (DR-033). **One Python ML batch job** — scheduled, writes `ml_*` tables, no API (DR-032). **One Next.js web app** — role surfaces by route (`/pos`, `/staff`, customer QR). **One Expo app** — staff mobile surface (login, tables/sessions, order taking + management, push, guest notes, bottle-keep check), no new endpoints. Modular monolith; extract services only if load demands it post-launch.
- **IAM:** AWS-style most-permissive-wins (union of group + direct user policies), time-bound group membership (`valid_from` / `valid_until`), resolution cached in Redis and invalidated on any IAM change. Always `PermissionsGuard` — never inline permission checks in controllers.
- **Identity:** provider-agnostic (`staff_user_identity`, `customer_identity` hold LINE credentials). Visit ≠ Customer: a visit is created on QR scan; `customer_id` is linked later only with PDPA consent.
- **Modules:** `IamModule` wraps `PermissionsGuard` + Redis cache · `NotificationsModule` is injected by Order / Payment to emit WebSocket events (never import the gateway) · `PaymentModule` enqueues BullMQ jobs; a separate processor consumes — the HTTP controller never couples to it · all entities extend `BaseEntity` (`app/backend/src/common/`).
- **Deployment:** web, api, worker and ml all on one AWS ECS cluster behind one ALB (`pos.` / `api.` host rules, DR-033); IaC Terraform for AWS + Cloudflare. EKS is a stretch goal only after ECS is solid.

## Database rules
- Mutable tables carry `created_by` / `updated_by` (FK → `staff_user`, set by the global `AuditSubscriber` via `@nestjs/cls`, registered once in `AppModule`) and `created_at` / `updated_at`. `updated_at` is set by the DB trigger `trg_<table>_updated_at` (DR-023) — app code never writes it; a migration that creates a table with `updated_at` attaches the trigger.
- Services use `save()`, never `update()`, on audited entities. `audit_log` is append-only — never UPDATE or DELETE.
- `order_item.unit_price_snapshot` and name snapshots (`item_name_snapshot`, `variant_name_snapshot`, `order_item_modifier.option_name_snapshot`) are frozen at order time (DR-022).
- `gateway_tx_id` UNIQUE = payment idempotency key — check it before processing a webhook.

## Session start
1. Identity: `.agent-local.json` in the main checkout. Read your local state `.field-kit/state/<id>-<kind>.md` (`<kind>` = `planning` or `BRIEF-###`; from a worktree: `../../.field-kit/state/`) and only the files it lists.
2. Open with: where work stands · branch / worktree · next action. Then do the next action.
3. Before rotating out of a long session: `/checkpoint`.

## Field Guard — decisions go through Field
Field is the only decision authority. Agents recommend or execute an explicit decision.

| Trigger (must flag — never decide alone) | Examples |
|---|---|
| Dependencies | any new / removed / upgraded package in package.json |
| Brief / e2e deviation | contract or DTO differs, an AC can't be met as written, a **locked e2e needs a change**, any work outside the brief's scope |
| Flow / architecture | new module, cross-module import, endpoint or event not in the brief / `design.md`, bypassing a locked rule, changing the core flow |
| Data | schema change, migration not implied by the brief, shared contract / enum change |
| Sensitive | auth, payment, personal-data behaviour |

**Not triggers (just do it):** private helpers, naming, refactors inside the brief's own files, unit-test structure, WHY comments.

**Approved** = exactly one of: (a) an exact item in the current Ready brief — its *Pre-decided* list, or the Contracts / Code map of its linked `design.md`, or its `ui.md` — traced to Field by a *Source* row; or (b) an `Approved` DR. Anything beyond the exact wording is a deviation → new DR. A DR never unlocks a protected file.

**Procedure:** stop that path only (continue unblocked work) → `/new-dr` → note it under Blockers in the brief / handoff → start your reply with `FIELD REVIEW NEEDED: DR-### — <one line>`. Only Field writes a Decision; Cowork may record one only when Field states it explicitly in the session. Silence or "looks good" is never approval.

## Protected paths (full rules: `docs/rules/agent-boundaries.md`)
Never edit without an exact brief unlock (brief §9 *Guard — unlocks*) or Field's OK on the exact diff in this session (`Approved-by: Field (session)` trailer):
`CLAUDE.md` · `AGENTS.md` (root and nested `app/*/`) · `docs/rules/**` · `app/*/.cursor/rules/**` · `.cursor/rules/**` · `.agents/rules/**` · `.github/**` · `infra/**` · kit enforcement `.githooks/**`, `ops/gates/**`, `scripts/field-kit/**` (never brief-unlockable) · root config (package.json and friends) · `docs/schema.sql` · `docs/erd.html` · design source snapshots (`docs/design/source/**`, `docs/features/*/design-source/**`) · `docs/handoff.md` (frozen) · `docs/features/**`, `docs/briefs/**`, `docs/decisions/**` (ownership rules) · **e2e files and e2e runner config after their lock commit** (change only with `Approved-by: Field (e2e-change)`).

## Hard rules
1. **Never decide alone** — Guard triggers go through a DR.
2. **Never audit work you implemented, fixed or paired on** — audits run from the main checkout on `main` in a clean context: Cowork, or a subagent / fresh session when only the builder tool is available (`/audit` §1). CI blocks the merge when a builder tool audits without saying so.
3. **Not run is never pass** — a required gate or run proof not run → status `BLOCKED`, never `Implemented`. Report exact commands, exits, limits.
4. **2-attempt stop** — a step still red after 2 fix attempts → stop and report.
5. **Bans (`docs/rules/core.md`):** no type cheats (`as any`, `as unknown as`, `@ts-ignore`), no silent catch or invented `?? ''` fallbacks, no fake tests, no dead code / shims.
6. **Do not reintroduce cut features:** offline mode, member QR, staff performance analytics.
7. **Every brief runs in its own worktree** `.worktrees/BRIEF-###`; the main checkout stays on `main`. Never `git worktree prune` / `remove` from a VM session.
8. **Never push to `main`**; merge only on the owner's explicit `approve merge BRIEF-###` (the `pr-review` merge phase), merge commit only. `.env*` files are never committed.
9. **No services beyond DR-033's `web` / `api` / `worker` / `ml`, no Kubernetes/EKS** before ECS is stable and shipping. **No LLM / OpenAI dependency anywhere** (DR-032).
10. **Architecture and database rules above are locked** — `PermissionsGuard` only, `save()` not `update()` on audited entities, `audit_log` append-only, snapshots immutable, `gateway_tx_id` checked first.
11. **Simple before complex** — no premature abstractions; inside → out steps, 1 step = 1 commit; explain WHY a solution is chosen.

**Approval policy:** routine brief-scoped work and task-branch Git (commit / push / PR) proceed without repeated questions; critical decisions, destructive actions, main merges and releases need Field's explicit authority (`docs/rules/workflow.md` Section 4).

## Commands (detail: `docs/rules/workflow.md` Section 4 — work that moves to another tool or session ends with a copyable hand-off block naming tool, model and effort; a next step in the same session is just done; only a decision the owner must make is asked, as one plain question; git steps are never asked)
`onboard kj|methee` (first session) · `/new-brief` (default entry) · `/new-feature` · `/new-defect` · `/new-dr` · `scan BRIEF-###` · `execute BRIEF-###` (`ทำ`) · `fix BRIEF-### — audit round <n>` · `ship BRIEF-###` · `audit BRIEF-###` (`ตรวจ`) · `/review` · `pr-review` (`approve merge BRIEF-###` · `อนุมัติ merge`) · `/checkpoint` · `resume` · `/autopilot` · `status BRIEF-###` (`สถานะ`) · `handoff`.
Tools without these skills: find the command in `docs/rules/workflow.md` Section 4 and read the section its row names before acting.

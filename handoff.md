# Handoff — AI-Powered Bar Management System

**Last updated:** 2026-09-07
**Purpose:** Bring any new session (Cowork, Claude Code, Cursor) up to speed on where the project stands and what comes next.

---

## Current Status

**Phase:** Design / planning complete. Not yet building.

**Deadline:** Apr 2027 (exact date TBD, per advisor). ~8 months runway. Extra time = depth, polish, testing, and a solid thesis — NOT scope expansion.

### Done
- ✅ Proposal submitted and **approved by advisor** (อ.สนายุ จินตนาวรรณกุล).
- ✅ Full feature set mapped and filtered (see `FRD.md`).
- ✅ **FRD baselined at v1.2** — field-research-validated (2 live bars) + dual independent review passed (GPT ~98%, Grok 9.2/10). All operational edge cases + concurrency collisions closed. Do not reopen without a new business requirement.
- ✅ Requirements phase COMPLETE. Next work is downstream: architecture → ERD → infra → API.
- ✅ All major design decisions made (IAM, identity, sessions, payment, guest intelligence, analytics).
- ✅ Scope deliberately trimmed — cut offline mode, member QR, staff performance analytics.
- ✅ Roadmap reorganized by **semester** (not "phases" — that caused confusion).
- ✅ ORM selected: **TypeORM** (over Prisma — Prisma requires network at build time for binary download, incompatible with client network constraints; TypeORM is pure JS/TS, no build-time network calls, native NestJS integration).

### Not started
- ❌ Application architecture ← **NEXT**
- ❌ Data model / ERD
- ❌ Infra setup (ECS, VPC, RDS, etc.)
- ❌ API design
- ❌ Any code

---

## Roadmap (by semester)

> Replaces the old "Phase 1 / Phase 2" language. "WebSocket is Phase 2" was a
> misread — it is Semester 1, core. See notifications decision below.

### Semester 1 (self-imposed milestone — internal pacing, not a hard gate)
**Design & setup (do first, in this order):**
- Application architecture → ERD → Infra → API
- (architecture ↔ ERD will need one round of mutual refinement — normal)

**Foundation:**
- Auth (LINE SSO, JWT + refresh rotation)
- IAM (groups, policies, time-bound membership, Redis ACL cache)
- Menu & Inventory core

**Customer & ordering:**
- Table & Session (static QR, session state machine)
- Identity (guest-first, consent)
- Order flow + queue
- Payment (PromptPay QR + webhook)
- Notification (WebSocket real-time + Web Push)

→ **Target end of Semester 1:** working core vertical slice — order → pay → close.

### Semester 2
**Control & integrity:**
- Comps/voids, variance tracking, audit log, end-of-shift cashout

**Differentiators:**
- Guest Intelligence (profile + AI summary)
- Bottle Keep
- Promotion + Happy Hour
- Analytics dashboards

**Cross-cutting + LINE OA:**
- Notification polish (Web Push)
- LINE OA (customer-facing: promo broadcast, reservation, "My Bottle" button, bottle expiry reminders)

> Note: LINE OA is roughly 1 sprint, not a whole semester's worth. Semester 2's
> real weight is Control & Integrity + Differentiators + Analytics.

---

## Key Decisions Locked (don't re-litigate)

- **ORM: TypeORM.** Pure JS/TS, no build-time network dependency, NestJS-native. Prisma ruled out due to query engine binary download requirement at bootstrap.
- **IAM:** AWS-style. Users → Groups + individual Policies. Time-bound membership. **Most-permissive-wins** (no explicit deny). Permissions computed per-request, cached in Redis, invalidated on change.
- **Identity:** Guest-first, LINE optional. Post-order invite. Consent before save (PDPA, separate marketing consent). Provider-agnostic model (LINE now, phone later). **Order ≠ Customer; Visit always created, Customer linked later.**
- **Recognition ladder:** LINE OA button (Sem 2) → LINE login → staff lookup. Member QR **cut**.
- **Delete = anonymize** (null identity fields, keep financial records, set `anonymized_at`).
- **Sessions:** static QR, `OPEN→ACTIVE→IDLE→CLOSED`. Opens on first order OR staff. Idle → notify → auto-close.
- **Payment:** PromptPay QR (locked amount) + webhook auto-confirm. Merge or split-equal only. Cash fallback with reason code.
- **Comps/voids:** reason code + manager PIN. Solo staff self-approve but flagged.
- **Cashout:** blind cash count + dual sign-off.
- **AI:** summarize preferences only, **never behavioral judgments** (PDPA).
- **Notifications:** WebSocket (real-time: new order, payment confirmed, order status, idle table) + Web Push (backgrounded) are **Semester 1, core — not deferred.** LINE OA (customer-facing) is Semester 2.
- **Offline mode CUT** — strong venue Wi-Fi assumed; keep only network-drop retry UX.

---

## Tech Stack

- Frontend: Next.js PWA + Tailwind
- Backend: NestJS + PostgreSQL + **TypeORM**
- Cache: Redis (ACL + session state)
- Queue: TBD (BullMQ on Redis vs lightweight in-process — deciding)
- WebSocket: TBD (NestJS Gateway vs dedicated adapter — deciding)
- AI: OpenAI API
- Auth: LINE SSO + JWT + refresh rotation
- Payment: PromptPay + webhook (Omise / GB Prime Pay)
- Infra: AWS (ECS/ECR, RDS, S3, ElastiCache)
- CI/CD: GitHub Actions
- Stretch: EKS (after ECS solid — resume/learning goal)

---

## Recommended Next Step

**Application architecture first**, then ERD → Infra → API. Each step constrains the next; architecture and ERD will bounce once (expected).

Decide altitude at kickoff (system-level vs module-level). Likely module/app structure: module breakdown, layering (controller → service → repository), inter-module communication, where cross-cutting concerns (audit, notifications) live, monorepo layout.

ERD tricky entities already surfaced:
- `Visit` / `Order` / `Customer` / `CustomerIdentity` separation (identity is optional, linked post-hoc).
- IAM: `User` / `Group` / `Policy` / `Permission` + time-bound membership join table.
- Bottle-keep ledger (separate from inventory).
- Inventory with category (A/B/C) + unit-vs-volume tracking.
- Audit log (immutable, append-only).

### Draft foundation sprints (from planning session)
1. **Setup + Auth core** — monorepo, DB schema init, LINE SSO, JWT + refresh rotation, user CRUD.
2. **IAM** — groups + policies, time-bound membership, ACL computation (union), Redis cache + invalidation, per-request guard.
3. **Menu & Inventory core** — menu items, recipes, inventory (A/B/C, unit/volume), cost-per-drink, stock CRUD.
4. **Table & Session** — table model + static QR, session state machine, QR resolution, guest attach, idle detection.

Rough total estimate: **~10–13 two-week sprints** for full build (fits 2 semesters). Treat AI-tool velocity as buffer, not scope-expansion room.

---

## Documentation Plan

Docs serve **two audiences — don't conflate them:**
- **Dev files** (Cursor/Claude Code): terse, split-by-topic FRD.
- **Thesis** (Thai; written Semester 2; template TBD): needs prose rationale, methodology, references.

Files optimized for AI tools ≠ thesis chapters. The valuable-for-thesis part is the **"why"** (design rationale + trade-offs), currently trapped in planning-chat history and will fade — capture it soon.

**Doc session tasks (template-independent, safe to do now):**
1. Split `FRD.md` into topic files (`frd/00-overview.md` … `frd/12-notifications.md`).
2. Capture a **design rationale / decision log** — the "why we chose X over Y" behind each locked decision (guest-first identity, most-permissive IAM, cut offline, anonymize-not-delete, TypeORM, etc.).
3. Organize research files (Grok / GPT / Gemini outputs) as thesis references / appendix material.

**Defer until thesis template + dates confirmed:**
- Mapping docs into required chapters (Intro, Lit Review, Methodology, System Design, Implementation, Testing, Conclusion — typical Thai CE structure, but confirm).

> A dedicated Cowork session will handle documentation. This planning chat is
> the design-thinking source; extract from it, don't redo the thinking.

---

## Open Questions

1. ~~ORM — **Prisma or TypeORM**?~~ → **TypeORM locked.**
2. Monorepo — **Turborepo/Nx** or separate repos?
3. Kitchen POS — single-POS vs separate kitchen display: build config toggle from the start.
4. Queue — **BullMQ** (Redis-backed) vs in-process vs none for Semester 1?
5. WebSocket — NestJS built-in Gateway (socket.io adapter) vs raw ws?
6. Project deadline: **Apr 2027** (exact date TBD). Semester split below is self-imposed pacing, not a hard external gate.
7. Thesis template / required chapter structure — **get from program.**

---

## Working Style Reminders

- Break work into small steps; don't dump full solutions.
- Simple/maintainable before complex.
- Don't expand scope mid-build — finish core vertical slice (order → pay → close) first.
- AI does ~40% (boilerplate/CRUD); human owns architecture + integration + edge cases.
- Don't let perfectionist infra (EKS-level ambition) starve the product — get a working ECS deploy early, harden later.
- Reference `FRD.md` for scope; don't reintroduce cut features.

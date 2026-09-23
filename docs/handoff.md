# Handoff — Bar Management System (FROZEN LEGACY LOG)
**Last updated:** 2026-09-23  
**Status:** ❄️ Frozen after the 2026-09-23 entry at the bottom. Do not add new entries.

> **Where things live now** (see `docs/rules/workflow.md`):
> - Current progress → `docs/state/kj.md`, `docs/state/methee.md`
> - New decisions → `docs/decisions/DR-###.md` (locked decisions below will be backfilled)
> - Work to do → `docs/briefs/<ID>-<slug>.md`
>
> The "Next Task for Cursor" sections below are **superseded** — they will become briefs `BE-000` / `FE-000` / `MB-000`.
> Everything below is kept as the decision history for the project report.

---

## How to Use This File
- Read **Current State** first — always
- Jump to the section for your domain (Backend / Frontend / Contracts)
- After completing work, update the relevant section before closing your session
- Open Decisions must be resolved before implementation begins

---

## Current State

### Phase
**Phase 1 — Core vertical: guest-in → order → pay → close**  
Still in **project setup / scaffold phase**. No business logic implemented yet.

### What's Done
- [x] Monorepo structure: pnpm workspace + Turborepo wired
- [x] `app/backend/` — empty NestJS 12 project (ESM, NodeNext, TypeScript 6)
- [x] `app/frontend/` — empty Next.js 16 project (App Router, Tailwind v4)
- [x] `app/packages/contracts/` — shared enums (OrderStatus, PaymentStatus, SessionState, StaffRole)
- [x] Root `.cursorrules` — monorepo-wide rules (68 lines, lean)
- [x] `app/backend/.cursorrules` — full hexagonal NestJS rules (219 lines)
- [x] `app/frontend/.cursorrules` — Next.js 16 PWA + Tailwind rules (160 lines)
- [x] `CLAUDE.md` — permanent project context
- [x] `AGENTS.md` — hard rules for autonomous agents
- [x] `docs/schema.sql` — full PostgreSQL schema (32 tables, 9 domains)
- [x] `docs/FRD.md` — feature scope with explicit cuts documented
- [x] Agent boundary rules designed — `docs/rules/agent-boundaries.md` + thin wrappers (pending Cowork execution)
- [x] Single-source rule architecture decided: `docs/rules/` is source of truth, all agents reference via `@` include

### What Was Partially Created (Needs Review)
A Cowork session started scaffolding `app/backend/src/common/` before the decision was made
that Cursor handles file creation. The following files exist but should be reviewed before use:
- `app/backend/src/common/base/base.entity.ts`
- `app/backend/src/common/constants/sql-column.constant.ts`
- `app/backend/src/common/subscribers/audit.subscriber.ts`
- `app/backend/src/common/decorators/current-user.decorator.ts`
- `app/backend/src/common/decorators/require-permission.decorator.ts`
- `app/backend/src/common/guards/permissions.guard.ts`
- `app/backend/src/common/filters/http-exception.filter.ts`
- `app/backend/src/common/interceptors/cls-user.interceptor.ts`
- Module directory trees created but EMPTY (no files): all 10 modules under `app/backend/src/modules/`

These files may be usable as-is or need adjustment. Do NOT assume they are production-ready.

---

## Backend

### Architecture Decision (Locked)
**Hexagonal (ports & adapters)** — see `app/backend/.cursorrules` for full spec.  
3 layers per module: `domain/ports/` → `application/` → `infrastructure/{http,persistence,...}`

### Module List (10 modules)
| Module | Type | Status |
|---|---|---|
| auth | infra-only (no domain/ports) | 🔲 not started |
| iam | full hexagonal | 🔲 not started |
| venue | full hexagonal | 🔲 not started |
| guest | full hexagonal | 🔲 not started |
| menu | full hexagonal | 🔲 not started |
| inventory | full hexagonal | 🔲 not started |
| order | full hexagonal | 🔲 not started |
| payment | hexagonal + queue/ | 🔲 not started |
| bottle-keep | full hexagonal | 🔲 not started |
| notifications | infra-only (no domain/ports) | 🔲 not started |

### Next Task for Cursor
**Scaffold the full hexagonal directory + stub files for all 10 modules.**

For each module, create:
1. `{module}.module.ts` — NestJS module, imports/providers/exports skeleton
2. `domain/ports/{entity}.repository.port.ts` — Symbol token + interface (domain modules only)
3. `application/{entity}.service.ts` — @Injectable(), constructor injects port token
4. `infrastructure/http/{entity}.controller.ts` — @Controller(), stubs for main CRUD endpoints
5. `infrastructure/persistence/{entity}.entity.ts` — extends BaseEntity, columns TBD
6. `infrastructure/persistence/{entity}.typeorm.repository.ts` — implements IRepository

Also wire `app.module.ts` to import all domain modules.

**Reference:** `app/backend/.cursorrules` for naming conventions, BaseEntity, COL constants, port token pattern, DTO pattern, module export rules.

### Key Technical Constraints
- TypeORM `synchronize: false` — migrations only, never sync
- `save()` not `update()` on all BaseEntity subclasses (AuditSubscriber needs `databaseEntity`)
- ESM: all relative imports must use `.js` extension
- Port token: `Symbol('ENTITY_REPOSITORY')` in same file as interface
- Module only exports Service — never Repository

---

## Frontend

### Architecture Decision (Locked)
Next.js 16 App Router + Tailwind v4. No component library. PWA via next-pwa.
See `app/frontend/.cursorrules` for full spec.

### Route Groups
| Group | Target device | Purpose |
|---|---|---|
| (staff) | Mobile | Order taking, table management, notifications |
| (pos) | Desktop/Tablet | Payment flow, session management |

### Next Task for Cursor
**Scaffold the App Router directory structure and base components.**

1. Create route groups: `app/(staff)/` and `app/(pos)/` with their `layout.tsx`
2. Root `app/layout.tsx` — providers: React Query, Zustand, socket context
3. Scaffold `components/ui/` primitives: Button, Badge, Input, Modal (unstyled first)
4. `lib/api/client.ts` — base fetch wrapper with error handling
5. `lib/utils/cn.ts` — Tailwind class merge utility
6. `middleware.ts` — auth redirect skeleton (unauthenticated → /login)

### Key Technical Constraints
- `'use client'` only when using browser APIs / hooks / event handlers — default to Server Components
- Named exports for all components (pages/layouts are the exception — default export required)
- No `<img>` — always `next/image`
- React Query for all server state; Zustand for UI state only
- UI strings hardcoded in Thai — NO i18n library, NO locale files, NO language switcher (see App Language section)

---

## Shared / Contracts (@bar/contracts)

### Current State
`packages/contracts/src/enums.ts` — four enums defined:
- `OrderStatus`: PENDING | CONFIRMED | PREPARING | READY | SERVED | CANCELLED
- `PaymentStatus`: PENDING | COMPLETED | FAILED | REFUNDED
- `SessionState`: ACTIVE | PENDING_PAYMENT | CLOSED
- `StaffRole`: OWNER | MANAGER | BARTENDER | WAITER

### Next Task
No immediate work needed. Add to contracts when a new shared type is needed by both apps.  
Build contracts first before using in either app (`pnpm build` from root).

---

## Open Decisions

| # | Decision | Status | Owner |
|---|---|---|---|
| 1 | GB Prime Pay vs Omise for PromptPay webhook | ✅ GB Prime Pay — Thai SMB standard, PromptPay is core product, business name on bank statement | KJ |
| 2 | S3 bucket strategy | ✅ One bucket (`bar-app-{env}`), `venue-{venueId}/` prefix — `menu/` (public), `receipts/` (signed URL), `guest-photos/` (signed URL, keyed by `customer_id` for PDPA forget-me) | KJ |
| 3 | Auth & session strategy | ✅ See Auth section below | KJ |
| 4 | OpenAI model for guest summary (gpt-4o-mini vs gpt-4o) — Semester 2 | 🔲 deferred | — |
| 5 | `docs/rules/backend.md` + `docs/rules/frontend.md` content (NestJS layering, Next.js component rules) | ✅ Done — all rule content in `docs/rules/`, all agent wrappers updated | KJ |

---

## Known Issues / Watch Points
- `app/backend/src/common/` partial scaffold: verify files before wiring into AppModule
- pnpm workspace: `pnpm install` must be run from repo root after any package.json change
- Nested .git repos were removed from app/backend and app/frontend — the root .git is the only one
- Frontend: React Compiler was selected during Next.js init — may surface issues with non-pure components; flag if encountered

---

## Scope Cuts (Do Not Re-introduce)
- Offline mode
- Member QR code
- Staff performance analytics
- Kitchen display UI (Semester 1 — routing shell only, no UI)
- EKS / Kubernetes (after ECS is solid)

---

## App Language (Decided 2026-09-20)

- **Thai-primary.** UI written in Thai as actually used — including common English loanwords (Filter, QR, Order, Menu, Happy Hour, etc.). This is normal Thai UI, NOT bilingual.
- **No i18n library. No locale files. No language switcher. Hardcoded strings.**
- Consistency rule: pick one term per concept, use it everywhere.
- Content (menu names, guest notes) = free-text as entered by staff.
- Code / DB / enums = English (convention).
- Full English translation / multi-language = **CUT** — future work only if real tourist need emerges.

---

## Auth & Session Architecture (Decided 2026-09-20)

### Token Storage
- **HttpOnly cookie** — no localStorage, no token in JS memory
- Follows OWASP session management guidelines
- Justified by payment data (PromptPay) in the system

### Cookie Config
```typescript
res.cookie('access_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',          // Lax: works with LINE notification deep links
  maxAge: 15 * 60 * 1000,   // 15 min
  path: '/',
});

res.cookie('refresh_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth/refresh',        // only sent to this endpoint
});
```

### Why Lax over Strict
Staff receive LINE notifications with deep links to orders. `Strict` forces re-login on every external link tap. `Lax` still blocks CSRF on all POST/PUT/DELETE — only top-level GET navigations from external sites pass the cookie, which is acceptable since GET endpoints are read-only.

### Auth Library
**None.** Roll your own:
- LINE OAuth callback handlers (~50 lines across 2 Next.js route handlers)
- `AuthProvider` in root layout — fetches `/api/auth/me` once on mount, holds user state
- `useSession()` hook — reads from Zustand, zero re-fetch
- Zustand auth store — accessible outside React (for axios interceptors)
- Axios: `withCredentials: true`, no token reading in request interceptor

### Token Rotation
- **401-intercept pattern** (not timer-based) — handles server-side invalidation, works in background tabs
- `refreshPromise` singleton — prevents thundering herd on concurrent 401s
- On refresh failure: clear Zustand store + redirect to login

### NestJS JWT Strategy
- Reads token from cookie, not Authorization header
- `ExtractJwt.fromExtractors([(req) => req?.cookies?.['access_token']])`

### CORS
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL, // never '*'
  credentials: true,
});
```

### Security Story (for advisor)
> "HttpOnly cookie — JS cannot read it, XSS cannot exfiltrate the token. SameSite=Lax blocks CSRF on all mutation requests. Secure flag ensures HTTPS-only in production. Follows OWASP session management guidelines, appropriate for a payment-handling application."

---

## Architecture Decisions — Data Plane (Decided 2026-09-20)

### Multi-Tenancy Model: DB-per-venue (Silo)
- **Model:** database-per-venue (silo), NOT shared-schema-with-venue_id (pool).
- **No `venue_id` on tables.** Each deployment = one venue = one DB instance.
- `venue` = single config row per instance (name, PromptPay ID, kitchen_display_enabled, tax/otoshi config, etc.).
- **New venue = provision a new DB** (schema migration + seed). That's the onboarding story.
- **Cross-venue reporting = explicitly out of scope.**
- **Why:** matches actual single-venue deployment; zero venue_id plumbing; stronger isolation story than pool → good "production-grade" evidence for the grade.
- **Committee answers ready:**
  1. Provisioning = migration + seed per venue
  2. Cross-venue analytics = out of scope / separate aggregation layer if ever needed

### S3 Bucket Strategy
- **One bucket** (`bar-app-{env}`), organized by `venue-{venueId}/` prefix.
- Under each venue prefix:
  - `menu/` — menu images (public-read OK, CDN-friendly)
  - `receipts/` — private, signed URLs
  - `guest-photos/` — private, signed URLs, **keyed by `customer_id`** for fast PDPA "forget me" deletion

---

## Code Quality Tooling (Decided 2026-09-20)

### Ponytail — Minimalism Enforcer
**Repo:** https://github.com/dietrichgebert/ponytail  
**What it does:** Teaches AI agents a lazy senior dev decision ladder: before writing code, check if it needs to exist, if it is already in the codebase, if stdlib covers it, etc. Reduces code output ~54%, prevents over-engineering.

**Install for Cursor (run from project root):**
```bash
mkdir -p .cursor/rules
curl -o .cursor/rules/ponytail.mdc https://raw.githubusercontent.com/dietrichgebert/ponytail/main/.cursor/rules/ponytail.mdc
```

**Install for Claude Code CLI:**
```
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

### Gaps Ponytail Does NOT Cover (TODO)
Ponytail handles minimalism/YAGNI. A custom rule file is still needed for:
- **NestJS layering:** no business logic in controllers, no direct DB calls in services, module only exports Service
- **Next.js component decomposition:** max ~200 lines per component, max ~150 lines per page, extract custom hooks when state logic > 20 lines
- **Server vs Client components:** default to Server Component, use client only when needed
- **SOLID:** Single Responsibility enforced at component and service level

**Done (2026-09-21):** `docs/rules/backend.md` and `docs/rules/frontend.md` created. All rule content consolidated into `docs/rules/`. All `.cursor/rules/` and `.agents/rules/` files are now thin wrappers.

### Cursor Rule Migration (Completed 2026-09-20)
- Replaced legacy `.cursorrules` files with Cursor Project Rules (`.mdc`).
- `/.cursor/rules/core.mdc` is workspace-wide; `ponytail.mdc` remains always-on.
- `app/backend/.cursor/rules/backend.mdc` and `app/frontend/.cursor/rules/frontend.mdc` are auto-attached only for their respective application paths.
- Do not recreate `.cursorrules`; maintain Cursor instructions as focused `.mdc` files.

---

## Agent Boundaries & Root File Protection (Decided 2026-09-20)

### Two-layer protection model
- **Layer 1 (hard enforcement):** GitHub branch protection on `main` — PR required, only KJ can approve/merge, no direct push including repo owner. **KJ sets this manually in GitHub — not an agent task.**
- **Layer 2 (soft prevention):** Agent rule file (`docs/rules/agent-boundaries.md`) tells all agents which files are off-limits before they attempt edits. Always-on across all agents.

### Files agents MUST NOT modify
```
Root config:     CLAUDE.md, AGENTS.md, turbo.json, pnpm-workspace.yaml,
                 package.json (root), .gitignore
Agent rules:     .cursor/rules/*.mdc, .agents/rules/*.md, docs/rules/*.md
Infrastructure:  docker-compose.yml, cloudformation/**, .github/workflows/**
Schema:          docs/schema.sql  ← ERD locked (32 tables, 9 domains), do not alter
```
If an agent thinks a change is needed → add a comment/TODO, stop. KJ reviews and applies manually.

### Single-source rule architecture
All agent rule content lives in `docs/rules/` (source of truth). Agent-specific files are thin wrappers using `@` includes — no content duplication.

```
docs/rules/                   ← write rules ONCE here
  agent-boundaries.md         ← always-on, all agents
  backend.md                  ← ✅ done
  frontend.md                 ← ✅ done

.cursor/rules/                ← thin wrappers (frontmatter + @include only)
  boundaries.mdc              ← alwaysApply: true
  backend.mdc                 ← glob: app/backend/**/*.ts  (TODO)
  frontend.mdc                ← glob: app/frontend/**/*.{ts,tsx}  (TODO)

.agents/rules/                ← thin wrappers (Antigravity reads here)
  boundaries.md               ← activation: always
  backend.md                  ← activation: glob  (TODO)
  frontend.md                 ← activation: glob  (TODO)

CLAUDE.md + AGENTS.md        ← one-line reference to docs/rules/agent-boundaries.md
```

### Files to create (Cowork — next task, do FIRST)
1. `docs/rules/agent-boundaries.md` — boundary rules content (always-on, all agents)
2. `.cursor/rules/boundaries.mdc` — thin Cursor wrapper (`alwaysApply: true`, `@/docs/rules/agent-boundaries.md`)
3. `.agents/rules/boundaries.md` — thin Antigravity wrapper (`activation: always`, `@/docs/rules/agent-boundaries.md`)
4. Add one line to `CLAUDE.md`: `See docs/rules/agent-boundaries.md. Never modify listed files.`
5. Add one line to `AGENTS.md`: same as above.
6. **KJ manually:** set GitHub branch protection on `main` (PR required, KJ only reviewer, no direct push).

---

## Session Handoff (2026-09-20) — Next Tasks (in order)

### 1. Agent boundaries (do FIRST — protects everything else)
- Create `docs/rules/agent-boundaries.md`
- Create `.cursor/rules/boundaries.mdc`
- Create `.agents/rules/boundaries.md`
- Add boundary reference line to `CLAUDE.md` and `AGENTS.md`
- KJ sets GitHub branch protection manually after above is committed

### 2. Validate Claude Design output against UI briefs
- Share Claude Design artifact/screenshot in Cowork
- Cowork reviews against `docs/briefs/ui/customer-qr.md` and `docs/briefs/ui/staff-mobile.md`
- Check: Thai strings correct, color tokens match, screen states present, navigation flow logical
- Mark issues → feed corrections back to Claude Design

### 3. After validation
- Build remaining screens per surface (POS Desktop, payment flow)
- Translate design tokens → `tailwind.config.ts` + `globals.css` CSS variables (~30 lines)
- [x] ~~Create `docs/rules/backend.md` + `docs/rules/frontend.md` (Open Decision #5)~~ DONE
- Create thin `.cursor/rules/` and `.agents/rules/` wrappers for backend + frontend rules
- Frontend scaffold: route groups `(staff)/(pos)`, root layout, `components/ui/`, `lib/api/client.ts`, `middleware.ts`
- Backend scaffold: hexagonal directory + stub files for all 10 modules
---

## Session Handoff (2026-09-21) — What Was Done

### Completed This Session
- [x] Agent boundaries: `docs/rules/agent-boundaries.md`, `.cursor/rules/boundaries.mdc`, `.agents/rules/boundaries.md`, CLAUDE.md + AGENTS.md updated
- [x] Single source of truth for rules: all content moved to `docs/rules/` (core, backend, frontend, ponytail, agent-boundaries)
- [x] All `.cursor/rules/*.mdc` and `.agents/rules/*.md` converted to thin `@include` wrappers
- [x] Fixed Next.js 15 → 16 across all files (11 references)
- [x] Frontend rules updated: hardcoded Thai (no i18n), component decomposition limits added
- [x] Backend structure decision: adopt friend's `providers/` pattern for infra wiring
- [x] Coding style decisions locked: component structure, naming conventions, TypeScript patterns, Tailwind
- [x] Component decomposition rules added to `docs/rules/frontend.md` (150/100/40 line limits, `_components/` convention)
- [x] Brief workflow established: Cowork creates briefs → coding agents execute
- [x] Cowork role recorded in handoff: architecture + decisions + briefs ONLY, no application code

### Still Pending (KJ manually)
- GitHub branch protection on `main` — PR required, KJ only reviewer, no direct push

---

## Session Handoff (2026-09-21) — Next Tasks (in order)

### 1. Write coding briefs (Cowork)
- `docs/briefs/backend/01-scaffold.md` — full backend `src/` structure brief for Cursor
- `docs/briefs/frontend/01-scaffold.md` — full frontend `src/` structure brief for Cursor
- These can be executed in parallel (no dependency between them)

### 2. Execute scaffold briefs (Cursor)
- Backend: `src/common/`, `src/providers/`, `src/modules/` (10 modules, hexagonal stubs)
- Frontend: route groups `(staff)/(pos)`, root layout, `components/ui/`, `lib/`, `middleware.ts`

### 3. Validate Claude Design output against UI briefs (deferred)
- Share Claude Design artifact/screenshot in Cowork
- Review against `docs/briefs/ui/customer-qr.md`, `staff-mobile.md`, `pos-desktop.md`

### Brief Format (reference)
Every brief contains: Context, Scope (file-by-file), Acceptance Criteria, Do NOT.
Stored in `docs/briefs/backend/` or `docs/briefs/frontend/`, numbered for execution order.

---

## Session Handoff (2026-09-22) — Presentation Review & Schema Update

### Context
GPT reviewed FRD + ERD and produced a presentation handoff with 8 design questions (A1–A8), 8 ERD grouping specs (B), and 9 presentation content gaps (C). All items reconciled against actual SQL and FRD. Schema updated in this session.

---

### Schema Changes Applied (docs/schema.sql — 2026-09-22)

| Change | Detail |
|---|---|
| `visit_state` enum | Added `active`, `idle` states — now: open / active / idle / closed / abandoned |
| `customer_identity.external_id` | Removed NOT NULL — nullable for PDPA anonymization |
| `venue_id` removed | Removed from: table_seat, staff_group, policy, menu_category, modifier_group, inventory_item (DB-per-venue decision, 2026-09-20) |
| `order_item.ordered_by_name` | Added VARCHAR(100) — "สั่งโดย: Filippo" label on order card |
| `bottle_keep.expires_at` | Added TIMESTAMPTZ — per-bottle policy expiry date |
| `bottle_keep_pour` | **Removed** — FRD §11 intent is "track existence, not precise volume" |
| `restock_request` | **Added** — persisted for logging (inventory_item_id, notes, status: pending/acknowledged/fulfilled) |
| Table count | Still 31 (removed pour, added restock = net 0) |

---

### Architecture & Presentation Decisions Locked (2026-09-22)

| Topic | Decision |
|---|---|
| Table count | **31**, not 32. Update CLAUDE.md. |
| DB-per-venue | Confirmed. venue_id references in SQL were pre-decision artifacts — now removed. |
| Canonical session lifecycle | FRD §3 is authoritative: OPEN → ACTIVE → IDLE → CLOSED. SQL enum updated. |
| Canonical order lifecycle | SQL `order_status` matches FRD: pending/accepted/ready/sent/issue. Contracts enum is stale — needs reconciliation. |
| GB Prime Pay card claim | **Remove from slides.** GB Prime Pay supports cards; project scope is PromptPay only. |
| LINE OA in S1 | Slide error. Revert to FRD: LINE OA = Semester 2. |
| AI input source | FRD §10: bartender notes, NOT order history. Correct slides 12–13. |
| AI model (gpt-4o-mini) | Still deferred (Open Decision #4). Do not present as chosen. |
| Slide 14 worker | "BullMQ processor (same NestJS process)" — not a separate worker process. |
| IAM description | "Allow-only, most-permissive-wins union model" — NOT full AWS IAM semantics. |
| Audit log | Application-enforced append-only. No DB constraint. Present accurately. |
| Anonymization | `customer_identity` row is deleted on forget-me (external_id can't carry a sentinel without breaking UNIQUE). Identity row deletion is the flow. |

---

### Open Decisions — Needs KJ Discussion

| # | Topic | Context |
|---|---|---|
| K4 | **PDPA consent storage** | Does consent go on `customer` (two boolean columns: `data_consent`, `marketing_consent`) or a separate time-stamped `customer_consent` table? A table gives audit trail of when consent was given/revoked. |
| K9 | **AI fallback when no bartender notes** | What shows on the staff screen if the customer has no notes yet? Options: hide the AI panel, show "ยังไม่มีข้อมูล", or show raw visit history only. |

---

### Contracts Enums — Needs Update (not done in this session)
File: `app/packages/contracts/src/enums.ts`

| Enum | Current (stale) | Should match SQL |
|---|---|---|
| `OrderStatus` | PENDING/CONFIRMED/PREPARING/READY/SERVED/CANCELLED | PENDING/ACCEPTED/READY/SENT/ISSUE |
| `SessionState` | ACTIVE/PENDING_PAYMENT/CLOSED | OPEN/ACTIVE/IDLE/CLOSED/ABANDONED (or subset) |

Do not update contracts until KJ resolves K4 (session state depends on payment flow design).

---

### Pending Slide Edits (do NOT edit until KJ says "confirm")

Proposed slides grouped ERD = 8 parts, total ~24 slides. Eight diagram-ready specs written in session. Parts 7–8 (Bottle Keep + Audit Trail) can be appendix if time is short.

**Corrections needed before any slide edit:**
1. Table count: 31 everywhere
2. Grouped ERD replacing slide 9 (8 specs ready)
3. GB Prime Pay: remove card claim
4. LINE OA: move back to S2
5. AI input: bartender notes, not order history
6. AI model: "gpt-4o-mini is a candidate, deferred to S2" not "chosen"
7. Slide 14: "BullMQ processor (same process)" not "separate worker"
8. Security claims: soften absolute language (see C8 in review notes)

---

### Field Research (C1) — KJ to provide
- Approximate visit dates
- Anonymized venue descriptions (type, size, location roughly)
- Which observations at both bars vs one
- Real photos available (bar atmosphere) — confirmed

---

### Next Tasks

1. **KJ decides K4 and K9** — then update contracts enums
2. **KJ says "confirm"** → slide editing begins against the 8-part ERD specs
3. **CLAUDE.md** — update table count from 32 to 31 (one-line fix)
4. Verify `docs/schema.sql` in Git before next Cursor session


---

## Session Handoff (2026-09-22) — K4 and K9 Resolved

### K4 — PDPA consent: separate `customer_consent` table ✅
One row per customer (UNIQUE on customer_id). Fields: `data_consent BOOLEAN`, `marketing_consent BOOLEAN`, `consented_at`, `updated_at`.
- `data_consent = TRUE` → customer opted in to save preferences & bottle-keep
- `marketing_consent = TRUE` → customer opted in to LINE promos (optional, Semester 2)
- On revoke: UPDATE the existing row + update `updated_at` (current state always readable)
- Table added to schema.sql — total now **32 tables** (corrected everywhere).

### K9 — AI fallback when no bartender notes ✅
Show placeholder: **"ยังไม่มีข้อมูล — ลองถามดูนะ"**
- AI panel visible on identified-guest screen, but summary area shows placeholder text
- This prompts the bartender to engage and write the first note
- AI summary generates only once `customer.notes` has content
- Correct per FRD §10: AI condenses bartender notes → it summarizes, not generates from nothing

### ERD Part 1 update (Section B)
`customer_consent` belongs in Part 1 (Venue, Guests, Sessions). Add it as: `customer_consent` — one-to-one with `customer`, stores explicit PDPA opt-in state.


---

## Session Handoff (2026-09-23) — Mobile App Added

### Context
Advisor required addition of a mobile app. Scope was ambiguous ("just add it / duplicate from web"). Decision made to keep it minimal and protect backend from any new work.

### Decision Locked

**Add `app/mobile/` — Expo (React Native), staff surface only.**

- Duplicates the PWA `(staff)` route group features. No new surfaces, no new concepts.
- **Same backend API** — zero new endpoints, zero schema changes.
- เมธี owns mobile (React knowledge transfers directly to React Native).
- Native push notifications is the one genuine advantage over PWA (iOS web push is unreliable).

### Mobile App Scope (LOCKED — do not expand without explicit KJ decision)

| Feature | Notes |
|---|---|
| Login | LINE SSO — same auth flow as PWA |
| Table / session list & status | Read from existing session API |
| Order taking | View menu, add items, submit order |
| Order management | View active orders, confirm, mark ready |
| Push notifications | Native push — key advantage over PWA on iOS |
| Guest notes entry | Bartender writes notes → feeds AI summary |
| Bottle keep check | View if customer has a bottle on record |

**Explicitly excluded from mobile scope:**
- Payment processing (POS desktop only)
- Reports / analytics (Owner/Manager desktop)
- Staff management (Owner desktop)
- POS session close flow (POS desktop)
- Any feature not already in the PWA staff surface

### Monorepo Addition
- `app/mobile/` — Expo app, added as workspace package
- Shares `@bar/contracts` (enums, types)
- No new packages needed

### Next Tasks
1. Add `app/mobile/` to `pnpm-workspace.yaml`
2. Init Expo app: `npx create-expo-app@latest mobile --template blank-typescript`
3. Wire into Turborepo (`turbo.json`)
4. Scaffold brief: `docs/briefs/mobile/01-scaffold.md` (Cowork writes, เมธี executes)
5. Execute backend + frontend scaffold briefs (these are still the priority — mobile comes after core vertical)

### What Was Done This Session
- [x] Mobile app decision made: Expo React Native, staff surface only, duplicate PWA features
- [x] CLAUDE.md updated: repo structure, tech stack table, architecture shape
- [x] Mobile scope locked in handoff (7 features in, 4 categories explicitly excluded)
- [x] Next tasks documented for Cursor execution

### Priority Order (unchanged)
Core vertical (order → pay → close) first. Mobile scaffold runs in parallel with frontend scaffold. Mobile features implemented AFTER core vertical is working.


---

## Session Handoff (2026-09-23) — Agent Workflow System ❄️ FINAL ENTRY

### Context
Moving from one shared handoff file to a structured agent workflow before any business-logic code is written. This week is high-level only — no application code.

### Decisions Locked (Field)
| Topic | Decision | Why |
|---|---|---|
| Decision authority | **Field** (KJ) is the only decision authority. Trigger list → DR → Field decides | Agents and people must not make silent architecture/dependency calls |
| Roles | Cowork = auditor + decision partner (no app code). Claude Code / Cursor / Antigravity / Codex = executors. Codex also = independent cross-check auditor on request | Whoever checks must not also decide |
| Coding split | Field 20–30% / agents 70–80%. เมธี 70–80% / agents ≤ 20% | Field works in reviewer mode; เมธี builds skill |
| Briefs | Field owns briefs. เมธี (and agents) never edit briefs | Brief = contract; one owner |
| State | One state file per person (`docs/state/`), overwritten each session. No `SESSION_STATE.md` | Agents resume from it; more state sources drift |
| Handoffs | One per brief, written once by the implementer | Permanent record separate from volatile state |
| Gates | G1 local (lint+type+unit) · G2 CI (+e2e) · G3 Field review with AC checklist + audit | CI can't be talked around; review checks intent |
| Traceability | One brief = one branch = one PR; `feat(BE-001): …` | Every line traces to a brief; every deviation to a DR |

### Files Created / Changed (uncommitted — Field to review)
**New:** `docs/rules/workflow.md` · `docs/{briefs,state,handoffs,decisions,audits}/_TEMPLATE.md` · `docs/state/kj.md` · `docs/state/methee.md` · `.cursor/rules/workflow.mdc` · `.agents/rules/workflow.md` · `.github/CODEOWNERS` · `.github/pull_request_template.md`
**Updated:** `CLAUDE.md` (repo paths → `app/`, workflow section with `@docs/rules/workflow.md`) · `AGENTS.md` (repo paths, "Before Any Task", rules 9–10) · `docs/rules/agent-boundaries.md` (app/* package.json now DR-gated, workflow-doc ownership, 31→32 tables) · `docs/rules/core.md` (reference docs, brief-ID git convention, scope rule → DRs, 31→32 tables) · this file (frozen)

### Known Drift / Gaps Found
- Nothing committed since 2026-09-19 — `docs/rules/`, `.cursor/`, `.agents/`, `app/backend/src/common/`, and the `packages/ → app/packages/` move are all still uncommitted
- `app/frontend` has no test script / Vitest → FE gate can't run until `FE-000` adds it
- `app/mobile/` doesn't exist yet (listed as planned)
- `app/frontend/AGENTS.md` + `CLAUDE.md` are auto-generated by Next.js — leave them, root files still apply
- Contracts enums stale vs schema (see 2026-09-22 entry) → brief `SH-002`

### Cross-Check Request — Codex (independent auditor)
Paste into Codex from the repo root:

```
You are acting as an independent cross-check AUDITOR (not executor) for this repo.
Do NOT modify any file except creating docs/audits/WORKFLOW-codex.md.

Read: AGENTS.md, CLAUDE.md, docs/rules/workflow.md, docs/rules/agent-boundaries.md,
docs/rules/core.md, all docs/*/_TEMPLATE.md, docs/state/*.md, .github/*.

Check and report (use docs/audits/_TEMPLATE.md structure, findings as "Current → Updated"):
1. Contradictions between workflow.md, agent-boundaries.md, core.md, CLAUDE.md, AGENTS.md.
2. Ownership gaps: any doc with no owner, or two owners for the same fact.
3. Loopholes: ways an executor agent could make a Field-level decision without a DR.
4. Session protocol: could a fresh agent resume work from docs/state/ alone? What's missing?
5. Gate realism: can G1/G2 run with the current package.json scripts? What's missing?
6. Over-engineering: anything a 2-person team won't realistically maintain. Suggest cuts.
7. Stale paths or references (frontend/ vs app/frontend/, handoff.md as state, table counts).

End with a PASS / PASS WITH NOTES / FAIL recommendation. Field makes the final call.
```

### Next Tasks (tracked in `docs/state/kj.md` from now on)
1. Run the Codex cross-check → Field reviews `docs/audits/WORKFLOW-codex.md`
2. Commit: pending prior work first, then the workflow system (separate commits)
3. GitHub manual: branch protection on `main` + "Require review from Code Owners"
4. Backfill locked decisions → `DR-001…`; then write `SH-001`, `SH-002`, `BE-000`, `FE-000`, `MB-000`


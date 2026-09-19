# Handoff — Bar Management System
**Last updated:** 2026-09-19  
**Session model:** Claude Sonnet 4.6 (Cowork)  
**Next executor:** Cursor (primary) / Claude Code (sub)

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
- [x] `app/frontend/` — empty Next.js 15 project (App Router, Tailwind v4)
- [x] `packages/contracts/` — shared enums (OrderStatus, PaymentStatus, SessionState, StaffRole)
- [x] Root `.cursorrules` — monorepo-wide rules (68 lines, lean)
- [x] `app/backend/.cursorrules` — full hexagonal NestJS rules (219 lines)
- [x] `app/frontend/.cursorrules` — Next.js 15 PWA + Tailwind rules (160 lines)
- [x] `CLAUDE.md` — permanent project context
- [x] `AGENTS.md` — hard rules for autonomous agents
- [x] `docs/schema.sql` — full PostgreSQL schema (32 tables, 9 domains)
- [x] `docs/FRD.md` — feature scope with explicit cuts documented

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
Next.js 15 App Router + Tailwind v4. No component library. PWA via next-pwa.
See `app/frontend/.cursorrules` for full spec.

### Route Groups
| Group | Target device | Purpose |
|---|---|---|
| (staff) | Mobile | Order taking, table management, notifications |
| (pos) | Desktop/Tablet | Payment flow, session management |

### Next Task for Cursor
**Scaffold the App Router directory structure and base components.**

1. Create route groups: `app/(staff)/` and `app/(pos)/` with their `layout.tsx`
2. Root `app/layout.tsx` — providers: React Query, Zustand, socket context, next-intl
3. Scaffold `components/ui/` primitives: Button, Badge, Input, Modal (unstyled first)
4. `lib/api/client.ts` — base fetch wrapper with error handling
5. `lib/utils/cn.ts` — Tailwind class merge utility
6. `middleware.ts` — auth redirect skeleton (unauthenticated → /login)
7. `messages/th.json` + `messages/en.json` — empty translation files with placeholder keys

### Key Technical Constraints
- `'use client'` only when using browser APIs / hooks / event handlers — default to Server Components
- Named exports for all components (pages/layouts are the exception — default export required)
- No `<img>` — always `next/image`
- React Query for all server state; Zustand for UI state only
- Thai as default locale; all text via next-intl `t('key')` — no hardcoded strings

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
| 1 | GB Prime Pay vs Omise for PromptPay webhook | ⏳ pending | KJ |
| 2 | S3 bucket strategy: per-venue prefix vs per-venue bucket | ⏳ pending | KJ |
| 3 | JWT access token storage: HttpOnly cookie vs memory (XSS vs CSRF trade-off) | ⏳ pending | KJ |
| 4 | OpenAI model for guest summary (gpt-4o-mini vs gpt-4o) — Semester 2 | 🔲 deferred | — |

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

# DR-004 — Request/response Zod schemas live in `@bar/contracts`

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Field via Cowork · 2026-09-23 |
| **Brief** | none (lands with SH-002/SH-003 or BE-000) |
| **Category** | Flow/Architecture |

## Context
The backend already uses Zod DTOs (`docs/rules/backend.md` — no class-validator/transformer). The frontend must also validate API responses with Zod (`docs/rules/frontend.md`). As things stand, every endpoint's shape would be written twice, once per app, and the two copies can drift silently. `@bar/contracts` today holds enums only and has no runtime dependencies.

## Options
**A) Shared schemas in `@bar/contracts`** — one source of truth; the frontend imports the exact schema the backend validates with; changing a field breaks the other side at compile time / contracts gains a runtime dependency (`zod`); the package boundary needs discipline.
**B) Separate schemas per app** — no coupling / double work, silent drift.
**C) OpenAPI + codegen** — standard, language-agnostic / extra tooling and build step; overkill for one TS frontend.

## Recommendation
**A.** Both apps are TypeScript in one pnpm workspace, so sharing Zod schemas costs almost nothing and removes a whole class of FE/BE mismatch bugs.

### Rules
- `app/packages/contracts/src/schemas/<domain>.ts` — **request + response schemas only** (`CreateOrderRequestSchema`, `OrderResponseSchema`), plus `z.infer` types.
- Contracts **must not** import NestJS, TypeORM, Next.js, or anything app-specific. Entities, mappers and the Nest pipe stay in `app/backend`.
- **One Zod version for the whole workspace.** Use Zod 4, pinned once (pnpm catalog or the same exact version in contracts, backend and frontend).
- **Money on the wire:** decimal string validated by regex (`/^\d+\.\d{2}$/`) — matches `NUMERIC(…,2)` without float loss (see DR-002 #11).
- **Dates on the wire:** ISO 8601 strings.
- Contracts has to be buildable/consumable by both apps (NodeNext ESM backend, Next.js frontend). Confirm this in SH-003 ("contracts build").

**Follow-ups:** `docs/rules/backend.md` DTO section (schemas move to contracts; mappers stay) and `docs/rules/frontend.md` API client section — Field, manual. `app/packages/contracts/package.json` gets `zod` (dependency — through a brief).

---

## Decision — Field only
**Decision:** Approved: A
**Why:** Backend, web and mobile are all TypeScript in one pnpm workspace, so one shared Zod schema per endpoint removes FE/BE shape drift at almost no cost.
**Date:** 2026-09-24 · recorded by Cowork on Field's explicit instruction (planning session); Field signs off by merging the PR

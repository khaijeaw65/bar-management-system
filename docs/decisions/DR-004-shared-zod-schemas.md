# DR-004 — Request/response Zod schemas live in `@bar/contracts` (+ generated OpenAPI spec)

| | |
|---|---|
| **Status** | Approved · Amendment 1 (OpenAPI via Swagger) approved 2026-09-28 |
| **Raised by** | Field via Cowork · 2026-09-23 |
| **Brief** | none (lands with the contracts-enum / config-truth brief or the backend scaffold brief) |
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
- Contracts has to be buildable/consumable by both apps (NodeNext ESM backend, Next.js frontend). Confirm this in the config-truth brief ("contracts build").

**Follow-ups:** `docs/rules/backend.md` DTO section (schemas move to contracts; mappers stay) and `docs/rules/frontend.md` API client section — Field, manual. `app/packages/contracts/package.json` gets `zod` (dependency — through a brief).

---

## Decision — Field only
**Decision:** Approved: A
**Why:** Backend, web and mobile are all TypeScript in one pnpm workspace, so one shared Zod schema per endpoint removes FE/BE shape drift at almost no cost.
**Date:** 2026-09-24 · recorded by Cowork on Field's explicit instruction (planning session); Field signs off by merging the PR

---

## Amendment 1 — Backend publishes an OpenAPI spec (Swagger) · 2026-09-28

**Field decision (in session):** "backend has to provide OpenAPI spec using swagger."

**Reading (Cowork, confirm by merging):** this **adds** OpenAPI on top of option A — it does not switch to option C. Zod schemas in `@bar/contracts` stay the single source of truth; the OpenAPI document is **generated from them**, never hand-written, so the two cannot drift.

### Rules
- **Generation:** backend builds an OpenAPI 3.x document with `@nestjs/swagger`, fed from the contracts Zod schemas through a Zod → OpenAPI bridge (Zod 4 JSON Schema output, or a library such as `nestjs-zod`). Exact package + version is pre-decided in the brief that adds it — if the bridge can't express a schema, raise a DR, don't hand-write the spec.
- **Coverage:** every endpoint a brief adds appears in the spec with request body, query/params, success response **inside the envelope** `{ status, message, data }`, error envelope, and auth requirement (access cookie / `Bearer`). A missing or wrong spec entry is a Must fix in audit.
- **Serving:** Swagger UI at `/api/docs`, JSON at `/api/docs-json`. On in local + staging; **off in production** (env flag in `providers/config`), so the API surface isn't advertised publicly.
- **Committed copy:** `pnpm --filter @bar/backend openapi:export` writes `docs/api/openapi.json`. CI fails if the committed file is out of date — reviewers and Methee can read the contract in the PR diff without running the backend.
- **Frontend / mobile:** keep importing Zod schemas from `@bar/contracts`; **no client codegen** from OpenAPI. MSW mocks must match the spec shapes.
- **Tags** per domain (`auth`, `menu`, `visit`, `order`, `payment`, …) matching backend modules.

### Why
The advisor grades system design; a live, browsable API spec is standard evidence and makes FE/BE handoff concrete (Methee builds against mocks while the backend lags). Generating it from the shared Zod schemas gets the documentation without a second source of truth.

### Consequences / follow-ups
- New backend dependency `@nestjs/swagger` (+ bridge) — through a brief (proposed: contracts-foundation / API-conventions brief before BRIEF-009, or the next backend brief, whichever lands first).
- `docs/api/README.md` — conventions (envelope, errors, money/date, naming, paging, auth, WS event names) + Phase-1 endpoint catalog.
- `docs/rules/backend.md` → add "OpenAPI" section (coverage rule, export command, prod flag) — **Field, manual** (protected file).
- Brief template §3 Contract: "endpoint appears in `docs/api/openapi.json`" becomes a standard AC for backend briefs.

**Decision:** Approved — OpenAPI via Swagger, generated from `@bar/contracts` Zod schemas.
**Date:** 2026-09-28 · recorded by Cowork on Field's explicit instruction; Field signs off by merging the PR

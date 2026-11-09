# Bar Management System — Workspace Rules

> Workspace-wide conventions for the monorepo.
> Scoped rules: `docs/rules/backend.md` (NestJS), `docs/rules/frontend.md` (Next.js) and `docs/rules/mobile.md` (Expo).
>
> Reference docs (read before working):
>   CLAUDE.md         → permanent project context
>   docs/FRD.md       → feature scope (what is in/out)
>   docs/schema.sql   → PostgreSQL schema (34 tables, 9 domains)
>   docs/rules/workflow.md → roles, briefs, gates, Field Guard (always read first)
>   docs/features/INVARIANTS.md → invariant index (always loaded; feature specs in docs/features/<f>/)
>   docs/state/<person>/SESSION_STATE.md → current progress (read at start, overwrite at end)

---

## Project at a Glance
AI-powered bar management POS for small-to-medium counter bars in Thailand.
Senior capstone project — DPU Computer Engineering. Deadline: April 2027.
2 developers. Production-grade. Phase 1 = order → pay → close core vertical.

## Monorepo Structure (pnpm workspaces + Turborepo)
```
/
├── app/
│   ├── backend/        @bar/backend  — NestJS API (port 3011)
│   ├── frontend/       @bar/frontend — Next.js 16 web app (port 3010)
│   └── packages/
│       └── contracts/  @bar/contracts — shared enums & types (source of truth)
├── docs/               project documentation (FRD, schema, handoff, rules)
├── .cursor/rules/      → thin wrappers only — rule content lives in docs/rules/
├── CLAUDE.md           → permanent context for all AI sessions
├── AGENTS.md           → hard rules for autonomous agents
├── turbo.json
└── pnpm-workspace.yaml
```

## Shared Types (@bar/contracts)
- `app/packages/contracts/src/enums.ts` is the SINGLE source of truth for shared enums
- Never redefine OrderStatus, PaymentStatus, SessionState, StaffRole in app code
- Import as: `import { OrderStatus } from '@bar/contracts'`
- When adding a new shared enum/type: add to contracts first, then use it
- Run `pnpm build` from root after modifying contracts — both apps depend on it

## TypeScript / ESM Rules (all packages)
- TypeScript 6, `strict: true`, `noUncheckedIndexedAccess: true`
- ESM (`type: "module"`) everywhere — no CommonJS
- **Backend + contracts:** NodeNext module resolution — relative imports MUST include `.js` extension. **Web app (`app/frontend`) and Expo app (`app/mobile`) use bundler resolution — no `.js` extensions** (see `frontend.md`):
  - ✅ `import { Foo } from './foo.service.js'`
  - ❌ `import { Foo } from './foo.service'`
- Node built-ins: `import { randomUUID } from 'node:crypto'`
- No barrel `index.ts` files that re-export everything (causes circular dep issues)

## Git Conventions
- Routine task-scoped Git is pre-authorized under workflow.md §4; do not ask again for each commit/push/PR. Main merges, destructive/history-rewriting actions and releases remain explicitly gated.
- Conventional commits: `feat/fix/chore/docs/refactor/test`
- Brief work: scope = brief ID — `feat(BRIEF-001): ...`, branch `feat/BRIEF-001-<slug>`, PR title `BRIEF-001: <title>`
- Non-brief chores: scope = module — `chore(repo): ...`
- Never commit directly to `main` — use feature branches. One brief = one branch = one PR
- PR description follows `.github/pull_request_template.md` (brief, DRs, handoff, gates)

## Scope Discipline — HARD RULES
- Phase 1 ONLY: guest-in → order → pay → close. No Phase 2 features.
- CUT features (do NOT implement): offline mode, member QR, staff performance analytics
- Stretch goals (do NOT start): EKS/Kubernetes, kitchen display UI
- Do not expand scope without an Approved DR in `docs/decisions/` (Field Guard — workflow.md §5)
- Finish the core vertical before adding breadth

## Cross-app Contracts
- Shared types/enums/schemas have one source of truth: `app/packages/contracts` (`@bar/contracts`, section above) and, for Feature Tier work, the feature's `docs/features/<feature>/design.md`. Never redefine them in app code.
- Contract changes are a Data trigger (workflow.md Section 5) and must update `design.md` in the same PR.

## Coding Anti-Patterns — BANNED Across All Stacks
1. **No type-safety cheats:** Zero `any`, `as any`, `as unknown as T`, `@ts-ignore`, `@ts-expect-error`, or non-null `!` on external/untrusted data. Parse untrusted data at the boundary (Zod/schema) or fix the type definition.
2. **No silent error swallowing or fake fallbacks:** Never write a `catch` block that logs and returns `null`/`false`/`[]` to hide a failure — rethrow a typed domain/HTTP error or handle an explicit recovery path documented in the brief. Never invent silent fallback defaults (`?? ''`, `?? 0`) that are not in the contract.
3. **No fake or tautological tests:** Tests must assert observable output or state changes, not mock call counts (`toHaveBeenCalled`). Never mock the class under test or its private helpers — mock only external boundaries/ports. Never weaken an assertion or edit a seeded `.e2e-spec.ts` file to make a failing test pass.
4. **No dead code, stubs, or shims:** Delete unused functions, parameters, and callers in the same commit. No commented-out code blocks, no `// TODO` stubs on shipped AC paths, and no internal backwards-compatibility shims.

## Development Workflow
- Local: Docker Compose for Postgres + Redis (see `infra/docker-compose.yml`)
- `pnpm dev` → Turborepo runs backend + frontend in parallel
- Migrations: `migration:generate` → review → `migration:run` (never `synchronize: true`)
- Migrations are additive by default (add column/table over drop/rename) and each has a working `down`: `migration:run` → `migration:revert` → `migration:run` before handoff. Never edit a migration already on `main` — write a new one.
- Feature flags: not used — scope control is in FRD, not flags

## Improvement notes
While pairing, reviewing or auditing, write down anything that would improve the code or the kit — one line each, as you notice it. Don't fix it in the same session unless it's in the current brief.
- **Code / style** → `docs/style-notes.md`: `decision or idea · example file · why`. Feeds the scoped rule files later.
- **field-kit** → your reply, prefixed `kit:` (Field collects these for the kit's backlog). Kit fixes happen in batches, never during a coding session.

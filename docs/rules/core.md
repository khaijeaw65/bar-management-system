# Bar Management System — Workspace Rules

> Workspace-wide conventions for the monorepo.
> Scoped rules: `docs/rules/backend.md` (NestJS) and `docs/rules/frontend.md` (Next.js).
>
> Reference docs (read before working):
>   CLAUDE.md         → permanent project context
>   docs/FRD.md       → feature scope (what is in/out)
>   docs/schema.sql   → PostgreSQL schema (32 tables, 9 domains)
>   docs/rules/workflow.md → roles, briefs, gates, Field Guard (always read first)
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
│   ├── backend/        @bar/backend  — NestJS API (port 3001)
│   ├── frontend/       @bar/frontend — Next.js 16 web app (port 3000)
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

## Development Workflow
- Local: Docker Compose for Postgres + Redis (see `infra/docker-compose.yml`)
- `pnpm dev` → Turborepo runs backend + frontend in parallel
- Migrations: `migration:generate` → review → `migration:run` (never `synchronize: true`)
- Feature flags: not used — scope control is in FRD, not flags

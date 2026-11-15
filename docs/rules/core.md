# AI-Powered Bar Management System — Workspace Rules

> Workspace-wide conventions and bans for every stack. Stack rules: `docs/rules/<kind>.md` (listed in `AGENTS.md`).
> Rule format: `ID · rule · [lint: <rule>], [ci: <check>] or [review] · Must / Suggest` + ❌ / ✅. `/review` and `/audit` cite IDs. `Suggest` never blocks a PASS.

## Project at a Glance
Production-grade bar management system for small-to-medium counter bars in Thailand (DPU CPE senior capstone).
Core flow: **QR guest ordering → kitchen/bar display → PromptPay payment → session close**. Finish it end-to-end before adding breadth.

## Repo Structure (pnpm workspaces + Turborepo)
```
app/backend/                → @bar/backend  — NestJS API (port 3011)
app/frontend/               → @bar/frontend — Next.js 16 web app (port 3010)
app/mobile/                 → @bar/mobile   — Expo staff app
app/packages/contracts/     → @bar/contracts — shared enums & types (source of truth)
```
Create a folder when its first file is needed — no empty placeholders.

## Shared Types (`@bar/contracts`)
- `app/packages/contracts/src/enums.ts` is the single source of truth for shared enums — never redefine `OrderStatus`, `PaymentStatus`, `SessionState`, `StaffRole` in app code; import as `import { OrderStatus } from '@bar/contracts'`.
- New shared enum / type → add it to contracts first, then use it. Run `pnpm build` from root after changing contracts — every app depends on it.

## TypeScript / ESM (all packages)
- TypeScript 6, `strict: true`, `noUncheckedIndexedAccess: true`; ESM (`type: "module"`) everywhere — no CommonJS.
- **Backend + contracts:** NodeNext resolution — relative imports end in `.js` (`./foo.service.js`). **Web (`app/frontend`) and Expo (`app/mobile`):** bundler resolution — no `.js` extensions.
- Node built-ins as `node:` (`import { randomUUID } from 'node:crypto'`). No barrel `index.ts` re-exporting everything (circular deps).

## Git Conventions
- Routine brief-scoped Git (commit / push / PR on the task branch) is pre-authorized — don't ask per commit. Main merges, destructive or history-rewriting actions and releases stay explicitly gated.
- Conventional commits `<type>(<scope>): <subject>` — types `feat fix docs refactor test chore perf ci build style revert`; scope optional.
- Brief work: branch `feat/BRIEF-###-<slug>` in `.worktrees/BRIEF-###`, commits `feat(BRIEF-###): <step>`, PR title `BRIEF-###: <title>`.
- Autopilot: branch `auto/YYYY-MM-DD-<slug>` in its own worktree, one green commit per `docs/PLAN.md` step.
- Never commit to `main` directly. One brief = one branch = one PR, following `.github/pull_request_template.md`.

## Scope Discipline
- Build the core flow first: QR guest ordering → kitchen/bar display → PromptPay payment → session close.
- Cut (do NOT implement): offline mode, member QR, staff performance analytics
- Stretch (do NOT start): EKS / Kubernetes (only after ECS is solid), kitchen display UI
- Phase 1 only: guest-in → order → pay → close. No Phase 2 features.
- No scope expansion without an Approved DR (Guard in `AGENTS.md`).

## Cross-app Contracts
- Shared types / enums / schemas have one source: `app/packages/contracts` and the feature's `design.md`. Never redefine them in app code.
- A contract change is a Data trigger and updates `design.md` in the same PR.

## Banned Across All Stacks

**CORE-01 · No type-safety cheats** · `[lint: no-explicit-any]` + `[review]` for `as unknown as`, `@ts-ignore`, `@ts-expect-error`, non-null `!` on untrusted data · **Must**
```ts
// ❌
const user = (await res.json()) as unknown as User;
// ✅ parse at the boundary
const user = UserSchema.parse(await res.json());
```

**CORE-02 · No silent catch, no invented fallbacks** · `[review]` · **Must**
```ts
// ❌
try { return await this.repo.find(id); } catch { return null; }
const name = row.display_name ?? '';
// ✅ rethrow a typed error; keep nullable as nullable (contract says string | null)
const row = await this.repo.find(id);
if (!row) throw new SeatNotFoundError(id);
const name: string | null = row.display_name;
```

**CORE-03 · Tests assert outcomes, not calls** · `[review]` · **Must**
```ts
// ❌
expect(repo.save).toHaveBeenCalled();
// ✅
expect(await repo.findOne(id)).toMatchObject({ status: 'closed' });
```
Mock only external boundaries / ports — never the class under test. Never weaken an assertion or touch a locked e2e to make a test pass.

**CORE-04 · No dead code, stubs or shims** · `[review]` · **Must**
```ts
// ❌
export { PermissionService } from './permission.service'; // keep old import path working
// function oldTotal() { ... }
// ✅ update the callers in the same commit and delete the old path
```

**CORE-05 · Type files hold types only** · `[lint: check-class-files]` where installed, else `[review]` · **Must**
```ts
// ❌ seat.types.ts
export class DuplicateSeatLabelError extends Error {}
// ✅ seat.errors.ts holds error classes; seat.types.ts holds types / interfaces
```

**CORE-06 · No compression to dodge limits** · `[review]` · **Must**
```ts
// ❌ packed to stay under 300 lines
if (!a) throw new A(); if (!b) throw new B(); const x = { id, label, kind };
// ✅ split the file by responsibility instead
```
Never reformat untouched code or strip comments in a fix round.

**CORE-07 · No skipped or focused tests** · `[lint: no-disabled-tests, no-focused-tests]` on unit and e2e paths + `[review]` · **Must**
```ts
// ❌ a locked case switched off, or every other case silenced
it.skip('rejects a retired seat', …);
it.only('opens a table', …);
// ✅ every case runs; a case that must change goes through the (e2e-change) path
it('rejects a retired seat', …);
```

## Development Workflow
- Local: Docker Compose for Postgres + Redis (`infra/docker-compose.yml`); `pnpm dev` → Turborepo runs backend + frontend.
- Migrations: `migration:generate` → review → `migration:run` (never `synchronize: true`); additive by default, each with a working `down` (`run` → `revert` → `run` before handoff); never edit a migration already on `main`.
- Feature flags: not used — scope control is in the FRD.
- Never invent commands that do not exist in a `package.json`; write "not available yet" in the handoff.
- Secrets live in `.env*` (gitignored) and the cloud secret store; never in code, logs or docs.

## Improving the rules
New rules come from evidence: a defect's *Should have been caught at* field or a repeated audit finding. Propose the rule (ID, ❌/✅, tag, severity) to Field; it enters only with Field's OK. Kit-level ideas go in your reply prefixed `kit:`.

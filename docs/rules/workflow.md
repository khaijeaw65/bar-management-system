# Workflow — Roles, Spec-Driven Lifecycle, Gates, Field Guard

> Rev 22 — 2026-11-01: adopted field-kit 0.4.0 workflow (two-tier SDD, Planner Dry Run, Cowork-seeded locked `.e2e-spec.ts`, executor seed commit, inside→out build steps, `start`/`fix`/`ship`/`/checkpoint`/`/autopilot`), keeping project-specific sections (Sonar, rulesets, deploy, legacy) — Field-approved. Rev 21 and earlier remain in Git history.
> Owned by Field — protected file (see `agent-boundaries.md`). Generated from field-kit 0.4.0, merged with the project's Rev 21.
> This file governs execution. Feature specs define long-lived requirements and design; thin briefs define execution slices; scoped rules define code conventions. History lives in Git.

## 1. People, Roles, Session Types

- **Field — KJ (`kj`):** decision authority, backend lead, final merge approver. Cursor is the primary executor; Claude Code is a fallback. Field may authorize an agent to perform the approved merge.
- **Metee (เมธี) (`methee`):** frontend/web and mobile developer; learning mode (Section 8) applies.
- **Executors (Cursor, Claude Code, Antigravity, Codex):** write scoped app code and unit tests (`*.spec.ts`), own state, handoffs, Pending DRs, brief-unlocked paths, and `design.md` status/code-map syncs listed in the brief. Never approve their own work, never edit seeded `.e2e-spec.ts` files, and never change brief scope/status, DR decisions, or rules on their own initiative.
- **Cowork:** planning partner, QA test author, and default auditor. Interviews Field to create feature specs (`docs/features/<f>/{requirements,design,ui}.md`), Draft briefs, and acceptance `.e2e-spec.ts` files; runs the Planner Dry Run against the repo; records explicit Field decisions; and sets Ready after Field reviews and explicitly approves. No app implementation code.
- **Codex auditor:** fallback only when Cowork usage is exhausted and Field explicitly assigns it; never switch automatically. Field may also request an additional cross-check. If Codex implemented the work, use a separate audit session.

| Session | Ready brief? | Allowed writes |
|---|---|---|
| Implementation | Yes | Scoped app code + unit `*.spec.ts`, own state, handoff, Pending DRs, `design.md` sync listed in brief (never seeded `.e2e-spec.ts`) |
| Audit | No | Audit report (`docs/audits/BRIEF-###.md`) only, left uncommitted in the checkout (Section 3); no implementation, state edits, or commits |
| Onboarding | No | Local identity and missing own state; preserve existing progress |
| Planning | No | Cowork's feature specs (`docs/features/<f>/*`), Drafts and Ready revisions, acceptance `.e2e-spec.ts` files, explicit approved records, kj state — all written uncommitted into the main checkout. No Git writes: the executor commits them in the seed commit, or a docs branch via ship line (Section 3, Section 4) |
| Autopilot | `docs/PLAN.md` | Scoped steps + `docs/PLAN.md` run log + own state on branch `auto/YYYY-MM-DD-<slug>` (Section 4) |
| Field-authorized workflow maintenance | No | Only the concrete documents/changes Field explicitly requests; no general permission to rewrite rules |

Field decides; agents recommend or execute an explicit decision. Naming a developer does not grant that person's approval authority.

## 2. Document Hierarchy and Two-Tier SDD

```text
docs/
  features/<feature>/               # Spec-Anchored (long-lived, updated in same PR)
    requirements.md                 # Why/who · R1..Rn + Source · ACs · Not handled · Open Qs
    design.md                       # As-is (path:line) · Decisions + Source · Assumed · Flow (Mermaid) · Contracts · Code map · Invariant enforcement
    ui.md                           # Screens · 17-state matrix · Action table · messages (only with screens)
  features/INVARIANTS.md            # always-loaded index: ID · name · owner spec · touches
  briefs/BRIEF-###-<slug>.md        # Spec-First thin slice (~60–80 lines, frozen at merge)
  decisions/DR-###-<slug>.md        # Permanent record of 1 architectural/scope decision
  handoffs/BRIEF-###.md             # Executor → Auditor → Field delivery evidence
  audits/BRIEF-###.md               # Independent verification of work SHA S
  state/README.md
  state/_TEMPLATE.md
  state/kj/SESSION_STATE.md
  state/methee/SESSION_STATE.md
.agent-local.json                   # gitignored checkout identity, not progress
```

### Two Tiers of Ceremony
1. **Feature Tier (`docs/features/<feature>/{requirements,design,ui}.md` + Thin Briefs):**
   - **When required:** Work spans **≥ 2 briefs**, exposes/changes a **shared contract** (API, auth, DB table used across modules, events), or touches a **sensitive domain** (auth, payment, PDPA / guest data).
   - **No spec drift:** Any brief or DR that changes a contract, flow, or code map updates `design.md` and/or `requirements.md` in the **same PR**.
2. **Standalone Tier (Single Self-Contained Brief):**
   - **When allowed:** Fits in **1 brief**, no new cross-module contract, low blast radius (isolated UI screen, bugfix, chore, CI setup). Uses Section 3–4 inline in `docs/briefs/BRIEF-###-<slug>.md`.

Existing features built before Rev 22 have no feature folder; the first brief that touches one as Feature Tier starts it with an `As-is` section (`/new-feature`). UI briefs (`docs/briefs/ui/`) are design inputs, not executable briefs.

**Seeded acceptance tests in this repo:** "seeded `.e2e-spec.ts`" means the e2e files the brief lists under *Tests* — backend `app/backend/test/**/*.e2e-spec.ts` (Vitest) and frontend Playwright `app/frontend/e2e/**/*.spec.ts`. Pre-existing e2e files not listed in the brief are not seeded; executors may extend them.

### Ownership & Lifespan
- **Feature Specs (`requirements.md`, `design.md`):** Field-owned, Spec-Anchored. Every requirement (`R1..Rn`) must cite a **Source** (`who, how, date`); agents never invent requirements. For existing code, `design.md` starts with an **As-is** section citing `path:line` evidence, confirmed by Field before any `To-be`.
- **Brief:** Field-owned, Spec-First. Cowork writes Drafts uncommitted in the main checkout and, at Field's Ready approval, sets the Ready revision in place (still uncommitted) alongside the acceptance `.e2e-spec.ts` files; the executor seeds the brief's task branch with them (Section 3). Executors never edit briefs or seeded `.e2e-spec.ts` files; the PR title `BRIEF-###: …` links brief and PR.
- **State vs handoff — two different jobs:** *State* (`SESSION_STATE.md`) = where **you** are for the next session (session rotation via `/checkpoint` + `/resume`, or stopping for the night). *Handoff* (`docs/handoffs/BRIEF-###.md`) = one agent passing a completed brief to another (executor → auditor → Field). Never mix them.
- **State:** tracked in Git, one writer per developer, and **the only planning/progress file** — ≤ 40 lines: where work stands, an optional *Session checkpoint* (`Locked / Rejected in chat`, `Paused at`) written by `/checkpoint`, plus a short *Carry over* section (milestones, parked decisions, Field to-do, follow-up pointers) that executors keep unchanged. Anything that doesn't fit is not state → brief, DR, handoff, audit or design doc. Committed only inside a commit that already happens (Section 3); never its own PR.
- Cowork writes `docs/state/kj/SESSION_STATE.md` into the main checkout, uncommitted; it reaches Git in the next seed commit or a docs branch (Section 3) — never on a task branch after the executor's first commit, never on `main`. Cowork never edits `docs/state/methee/`.
- **Handoff:** executor writes at Implemented, updates it once in the PASS commit, frozen at merge. No status-only commit or PR after merge.
- **DR:** anyone proposes; only Field decides; Cowork may transcribe Field's explicit decision (Section 5).
- **Audit:** assigned auditor records actual auditor, assignment source, brief revision, reviewed SHA `S`, and findings; append re-audits, never rewrite. The executor commits it unchanged at PASS (packaging only, Section 3).
- **PR:** completion authority. **Merged PR = Done**, even if the brief approval field still says Ready. Closed without merge is not Done.
- **Docs branches** only for docs no brief carries (rules, standalone feature designs, standalone DRs): one branch per decision batch, PR the same day, never older than 3 days — executors read `main`, so decisions left on a side branch are invisible to them. A DR that a brief needs rides in that brief's seed commit instead.

**Authority Precedence:**
Approved DR > a revision Field approved in the brief + linked `requirements.md`/`design.md` > rules > state. This never overrides document ownership, roles, or protected files. A newer timestamp alone grants no authority; report unresolved contradictions.

### Brief Size Limits (Judged at Planning Time)
Brief IDs use one project-wide `BRIEF-###` sequence allocated by Field (retired IDs: Section 10). One brief = one testable outcome, one implementer (one outcome may span apps only with one implementer responsible for all parts), bounded by 5 concrete measures read directly from the brief:
$$\text{ACs} \le 8 \quad\cdot\quad \text{User flows} \le 1 \quad\cdot\quad \text{Files in code map} \le 10 \quad\cdot\quad \text{Migrations} \le 1 \quad\cdot\quad \text{New patterns} \le 1$$
If **2 or more** are exceeded → split into `BRIEF-A`, `BRIEF-B`, etc. (unless Field explicitly records `owner-accepted oversize` in the Size row). Sanity check: a diff the auditor can review in one sitting (~500 net-new lines incl. tests; lockfile and `docs/api/openapi.json` excluded).

## 3. Lifecycle, Planner Dry Run, and Ready Checklist

```text
Feature Spec (if multi-slice) → Draft Brief + Acceptance .e2e-spec.ts + Planner Dry Run (all uncommitted, main checkout)
→ Ready (Field-approved, still uncommitted) → Seed commit on task branch (executor, first step of execute/start)
→ Step 0 (verify external Assumed + confirm .e2e-spec.ts fails red on assertion) → Inside→Out Build Steps (1 step = 1 commit)
→ Implemented (branch pushed, SHA S, no PR) → Audit PASS → PR opened (SHA H) → CI green → Merge (Section 7) → Done
                                                ↑                               |
                                                └── CHANGES REQUIRED (fix commits on branch, re-audit)
Audit BLOCKED → Field decision / missing evidence → resume the affected step
```

Before asking Field for `Ready`, Cowork checks the brief names the implementer and the **Assigned auditor (Cowork, or Codex only on Field's explicit instruction)**, exact gate commands incl. run proof (Section 6), dependencies with completion conditions, and no unresolved decision blocking the main outcome — and completes the **7-row Planner Dry Run** against the real repo (Section 6 of the brief template) with `path:line` evidence:
1. **Existing schema / entities checked now:** Never push a repo-readable check into `Assumed` for Executor Step 0. Read the actual entities/migrations now. Only external/runtime facts stay in `Assumed`.
2. **Step-by-step wiring trace & protected-file unlocks:** Trace every existing file the executor will touch (e.g. `main.ts`, `app.module.ts`, `package.json`) and list any protected files in Section 7 *Unlocked protected files* so the executor never stops mid-build on a missing unlock.
3. **Packages & peer versions verified** against the repo's `package.json` files.
4. **Gate scripts verified** in the manifest (or marked `BLOCKED until BRIEF-###`).
5. **Acceptance `.e2e-spec.ts` written by Cowork** (black-box against `design.md → Contracts` and port tokens only; imports verified against the repo's test harness) — and e2e isolated from the dev server (own DB, Redis DB/prefix, random port).
6. **Every *Depends on* brief verified merged to `main`** (`git log main`) — "done" on a branch is not enough. Unmerged dependency → brief stays Draft.
7. **UI tokens & components** (UI briefs): everything `ui.md` names exists in the repo, or the gap is a build step / DR.

Executors never turn a Draft into Ready. Record approval date in the brief changelog; bump the revision on content changes. Briefs already Ready or In Progress before Rev 22 finish under the Rev 21 flow (no seeded e2e, no Planner Dry Run).

### Step-by-Step Git & Execution Flow
One brief = one task branch = one PR, **from Ready**. Drafts stay uncommitted in the main checkout so Field reviews them without switching branches. **Audit before PR:** no PR until the assigned audit is PASS.

1. **Ready + Seed (`execute` / `start`).** Cowork leaves the Field-approved Ready brief, feature specs (`requirements.md`, `design.md`, `ui.md`, new `INVARIANTS.md` rows), seeded `.e2e-spec.ts` files, kj state refresh, and any needed DR uncommitted in the main checkout. The executor's `execute`/`start` creates `feat/BRIEF-###-<slug>` from `main` and commits those exact files unchanged as `docs(BRIEF-###): Ready — Rev n` (the seed commit) before any work. Changed or missing files → stop and report.
   - **A seed never gets its own PR** — not even docs-only, not even after it is pushed (GitHub's "Compare & pull request" banner is not an instruction). The brief's one PR is opened at PASS (step 6). A seed PR opened by mistake is closed unmerged.
2. **Step 0 & Inside→Out Build (executor).**
   - **Step 0:** Verify external `Assumed` rows owned by `executor`, and run the seeded `.e2e-spec.ts` files to confirm they **compile and fail red on an assertion** (not a syntax/import typo). If a seeded `.e2e-spec.ts` has a typo, stop and ask Field / raise a DR — never edit seeded `.e2e-spec.ts` silently.
   - **Build Steps 1..N:** Follow the brief's `Build steps` table in order (`config → ports/adapters → domain/application → controller/UI → run proof`), writing unit tests (`*.spec.ts`) per step. **1 step = 1 commit** (`feat(BRIEF-###): <step>`). If a step stays red after **2 fix attempts**, stop and report.
3. **Implemented (executor).** Sync `design.md` if required by the brief, run the real-runtime Run Proof (`G1`), and make one `docs(BRIEF-###): handoff` commit (handoff + own state). Push. Report work SHA `S` and hand off with:
   `Next → in Cowork: audit BRIEF-###` (never a bare command that invites self-audit).
4. **Audit (assigned auditor).** Reads the branch locally (`git diff main...<branch>`, `git show <S>`), verifies `git diff <seed>..<S> -- <e2e-files>` is empty, and writes `docs/audits/BRIEF-###.md` into the checkout, **uncommitted**.
5. **CHANGES REQUIRED (executor).** `fix BRIEF-### (#…)` makes fix commit(s) only — no handoff, state, SHA-record, or PR-link commits; report the new `S` in chat. The re-audit appends to the same uncommitted report.
6. **PASS (executor).** `ship BRIEF-###` makes one `docs(BRIEF-###): audit PASS, handoff, state` commit (`H`): the audit report unchanged + final handoff + own state. Push, open the PR — ready for review, not Draft. Merge per Section 7.

- **Branch on another machine (Metee):** the git hand fetches it and switches the main checkout to it for the audit. At PASS the git hand commits the report unchanged (`docs(BRIEF-###): audit PASS`) and pushes; the executor pulls, commits final handoff + state, pushes, and opens the PR.
- Because the PR exists only after PASS, it cannot be merged early. WIP pushes may contain failing or unrun tests if disclosed honestly; they do not establish Implemented or authorize merge.
- Executors stage explicit paths — never `git add -A` / `git commit -a` — so an uncommitted audit report or Draft brief is never swept into a work or fix commit.
- **No bookkeeping-only commits or PRs:** no SHA records, PR links, or "brief done" state. SHAs go in chat; Done is the merged PR; closure reaches kj state in the next seed commit.
- A revision Field approved during implementation: Cowork writes it into the checkout; the executor commits it exactly as written (`docs(BRIEF-###): Rev n — Field-approved`).
- Optional, before PASS: the git hand may run CI on the branch with `gh workflow run ci --ref <branch>` (no PR needed).

**When to commit / push:**

| Who | Commit | Push |
|---|---|---|
| Cowork | Never — writes files only; the executor seeds, the git hand commits docs branches from a ship line | Never |
| Executor | The seed commit (first step of execute/start) · 1 commit per green Build Step · one handoff commit at Implemented (`S`) · each `fix` round · one PASS commit (`H`) | At Implemented · end of a session with unpushed commits · at PASS, then open the PR |
| Nobody | A commit only to record a SHA, a PR link, or "brief done" · a state-only or planning-only PR | Directly to `main` |

**Who runs Git:** the **git hand** is any executor running on Field's machine with an authenticated `gh` CLI — today Claude Code; Cursor once `gh` / `api.github.com` is allowed in its sandbox and `gh pr create` is verified. Cowork and Codex may read Git freely (`show` / `diff` / `log` / `grep` / `merge-base` / `ls-remote`, read-only GitHub API), but never change Git state — no switch / commit / fetch / pull / push / PR / merge. If a needed commit isn't available locally, ask the git hand to fetch it.

| Role | Writes | Commit | Push | Open/update PR | Merge |
|---|---|---|---|---|---|
| Cowork (planner, QA e2e author, default auditor) | feature specs, Drafts, Ready revisions, seeded `.e2e-spec.ts`, approved records, kj state, audit report (all uncommitted) | ✗ | ✗ | ✗ | ✗ |
| Codex (fallback auditor) | audit report only (uncommitted) | ✗ | ✗ | ✗ | ✗ |
| Executor without `gh` | brief scope (`*.spec.ts` + app code), handoff, own state; commits the seed and the audit at PASS | ✓ | ✓ | git hand, or hand over compare link | ✗ |
| Executor = git hand | same | ✓ | ✓ | ✓ | Field's own PRs under Section 7 |
| Field | anything | ✓ | ✓ | ✓ | ✓ (only approver of Metee's PRs) |

**One checkout:** with one active brief, Cowork and the executor share the main checkout — one tool at a time, Field drives. The executor switches to the task branch and stays on it until the PR is open. One git hand per branch at a time.

Changes after an audit/approval require the head/evidence checks in Section 7.

### Parallel briefs (max 2)
One active brief per developer by default. Field's exception: at most two non-overlapping briefs in separate worktrees, separate agents.
- The second brief runs in a worktree inside the project folder (`.worktrees/BRIEF-###`, excluded via `.git/info/exclude`) with its own executor session.
- **No overlap, checked at Ready:** compare the two briefs' code maps. Any file in both → no parallel run; the second waits.
- **Only the main checkout writes owner/member state.** A worktree executor writes its code and handoff only — so the state file never conflicts.
- **Second brief, before committing `S`:** `git fetch origin && git merge origin/main`, reconcile any shared `docs/features/<f>/design.md` (two slices of one feature) and the lockfile by hand (never `--ours`/`--theirs` wholesale), then run gates + G1 — so `S` already contains `main` and `S..H` stays evidence-only. If `main` changes a shared file **during** the audit: merge it as a fix commit (new `S`) + compact re-audit before `ship`.
- Read a teammate's state without switching checkout: `git show origin/<branch>:docs/state/<id>/SESSION_STATE.md`. No CLAIMS file or project-wide session log. See `docs/state/README.md`.

## 4. Identity, Commands, and Session Loop

### Identity and checkout
`onboard kj` / `onboard methee` stores `{ "developer": "<id>" }` in the gitignored root `.agent-local.json` (no tokens or progress). Explicit session input wins over this file. If missing/invalid/conflicting, ask once; never infer identity from Git author configuration, tool account or the most recently edited state. Explicit onboarding may replace the identity setting; it does not transfer a brief.

At start of **every** session (or via `/resume`): read own `SESSION_STATE.md` first, plus **only** the active files listed in `SESSION_STATE.md` (preserving the context window), check `git status -s`, current branch, worktree and latest commit, and list keys in each `.env.example` (root, `app/backend`, `app/frontend`) missing from the matching local file (`.env`; `.env.local` for the frontend) — names only, never values. Open with 2–3 lines — where work stands and the next action. Reconcile stale state from actual Git/PR evidence. Stop affected mutations on unexplained branch/ownership mismatch or unrelated dirty work; never stash/reset/commit another person's changes. Keep own state current at checkpoints (commit, merge, brief status change, decision, blocker) and run `/checkpoint` before rotating out of a long planning/interview session.

### Commands & Skills

| Command / Skill | Behavior |
|---|---|
| `onboard <kj\|methee>` | Read rules/state, inspect checkout (including untracked source files), save identity, initialise missing own state, summarise setup gaps and one eligible Ready brief. No automatic install, branch switch or feature implementation. |
| `/new-feature` | Structured interview (Round 0 `As-is` with `path:line` → Modules → Deps → Where code lives → Constraints → Edge cases + invariants → ACs) → writes `docs/features/<f>/{requirements,design}.md` (+ `ui.md` with screens, `INVARIANTS.md` rows) uncommitted. |
| `/new-brief` | Drafts thin `BRIEF-###` (from feature folder or standalone), writes locked `.e2e-spec.ts` files, completes the 7-row Planner Dry Run with `path:line` evidence, and handles `Ready` approval. |
| `/new-dr` | Raises `DR-###` with mini *Under the hood* flow/tx/failure per option and flags patterns new to Field. Auto-triggered when work hits a Section 5 guard boundary. |
| `execute BRIEF-###` / `ทำ BRIEF-###` (`/execute`) | Includes resume. Verify identity, Ready revision, implementer, merged dependencies, DRs, unlocks, and checkout. Create branch + seed commit if new; run Step 0 + inside→out build steps (`1 step = 1 commit`); run `G1` proof; commit handoff (`S`), push, and output `Next → in Cowork: audit BRIEF-###`. Idempotent: continues WIP, reports waiting review, or reports Done for a merged PR; never duplicate branches/PRs. |
| `start BRIEF-###` (`/execute`) | Hand-coded brief (learning-mode implementer): runs `execute` pre-checks and seed/branch switch, then acts as copilot only (Section 8) — explain, review, debug; no app code. |
| `fix BRIEF-### (#…)` (`/execute`) | After CHANGES REQUIRED: fix only the listed `Must fix` findings, commit, push, report the new `S` (Section 3 step 5). |
| `ship BRIEF-###` (`/execute`) | After PASS: commit the uncommitted audit unchanged + final handoff + state (`H`), push, and open the PR (Section 3 step 6). For hand-coded briefs before audit: runs gates, drafts handoff, and commits/pushes the person's work (`S`). |
| `audit BRIEF-###` / `ตรวจ BRIEF-###` (`/audit`) | Assigned auditor only (hard-refuses if run in a session that implemented, seeded, fixed, or paired on the brief; wrong tool for the assignment → explain the handoff, never pretend a review happened). Verifies seeded `.e2e-spec.ts` untouched, checks ACs, `design.md` sync, stack rules/style, and `G1` proof → writes `docs/audits/BRIEF-###.md` uncommitted. |
| `/review` / `approve merge BRIEF-###` (`อนุมัติ merge`) | Lightweight review (no audit file): **(a)** mid-coding diff check against stack rules & contracts, or **(b)** post-PR merge check verifying `S..H` contains only audit/handoff/state files + CI green on `H` (`G2`), then merges under Section 7. For Metee's PRs, `อนุมัติ merge BRIEF-###` is Field's authorization of the presented PR/head. |
| `/checkpoint` (`/save-session`) | Flushes in-chat answers into uncommitted draft files and writes `Locked / Rejected in chat` + `Paused at` into `SESSION_STATE.md` for zero-loss session rotation. |
| `resume` (`/resume`) | Reads `SESSION_STATE.md` + listed active files only, prints a 3-line summary, and immediately executes/asks the next step in the same turn. Missing/ambiguous state → evidence-based reconstruction, not a guessed task. |
| `/autopilot` | Unattended/overnight run: short interview → `docs/PLAN.md` (with Dry Run unlocks) → branch `auto/YYYY-MM-DD-<slug>` → 1 green commit + push per step; 2 failures → revert + log `⛔` + continue independent steps; guard trigger → log `⏸ needs owner` + skip; opens 1 PR at end of run. |
| `status BRIEF-###` / `สถานะ BRIEF-###` | Read-only summary from brief, branch, PR, and evidence; label stale info. |
| `handoff` | Backup when stopping mid-brief: update own state, commit scoped WIP + state to the task branch, and push (disclose failed/unrun checks; no PR before audit PASS). Audit sessions update only their uncommitted audit. Never auto-merge, deploy or switch branches. |

**Cross-tool handoff rule (prevents one-click self-audit):**
At Implemented, the executor always phrases the next step as `Next → in Cowork: audit BRIEF-###`. At audit completion, the auditor always phrases the next step for the implementer's executor (Field for his own briefs, Metee for his) as `Next → in <Executor>: fix BRIEF-### (#…)`, `Next → in <Executor>: ship BRIEF-###`, or — BLOCKED — the DR or decision needed. Any session asked to `audit` work it implemented, seeded, fixed, or paired on must refuse and name the assigned auditor tool. Do not claim an external auditor has started when it has not.

### Ship line (for standalone docs branches)
Seed commits need no ship line — `execute`/`start` makes them. A Cowork or Codex session that leaves **docs-branch files** (rules, standalone design docs, standalone DRs, kj state with no brief to carry it) ends with one line for the git hand: `ship <branch>: "<commit message>" — files: <exact paths> — <Approved-by trailer if protected files>`. The git hand commits exactly those files without editing them, pushes and opens the PR; any other change or a missing file → stop and report. Audit reports never use a ship line: the executor commits them at PASS (Section 3).

### Approval policy
Routine scoped reads, edits, tests, approved dependency installation, Git inspection/fetch, safe branch/worktree creation, scoped commits, normal feature-branch push and PR creation/update need no repeated conversational approval. Inspect checkout and destination first. Rebase only your own unpublished commits; stop when conflict resolution requires a product decision. Never push directly to main.

Critical actions require explicit authority: new Field Guard decisions; main merges/admin bypass (except Field's own PRs meeting the Section 7 pre-approval); releases/deploys; force-push or published-history rewrite; discarding work; deleting unmerged/shared refs or dirty worktrees; production/shared-data mutation; destructive migrations/volume deletion; paid infrastructure; access/permission changes. An exact existing approval remains valid until its scope/target changes.

Prepare reviewable evidence before requesting approval. Stop only the blocked path. Git operations do not need a DR; new product/architecture decisions do. Sandbox/OS/network prompts are separate from project authorization: obey tool permission mechanisms, request narrow reusable rules where supported, and never disable all approvals or bypass a rejection.

### No manual tasks for Field
When work is needed (run a migration, restart the stack, fix a file), hand it to an executor as a chat command or a ship line — never as shell steps for Field to run. **Protected files are not Field's typing work:** the agent shows the exact diff, Field OKs it, the agent writes it (`agent-boundaries.md` → *Field-approved edits*). Field-only work: decisions and approvals, personal credentials/2FA, account signups and paid services, GitHub settings and rulesets, release tags, and real-world tasks.

## 5. Field Guard — Decisions Go Through Field

### Triggers (must flag — never decide alone)
| Category | Examples |
|---|---|
| **Dependencies** | Any new / removed / upgraded package in **any** `package.json` |
| **Brief / E2E deviation** | Contract/DTO shape differs, an AC can't be met as written, a seeded `.e2e-spec.ts` test fails due to a test bug, any work outside the brief's scope |
| **Flow / architecture** | New module, cross-module import, endpoint or WS event not in the brief/`design.md`, bypassing `PermissionsGuard` or another locked architecture rule in `CLAUDE.md`, changing the core flow (QR guest ordering → kitchen/bar display → PromptPay payment → session close) |
| **Data** | Schema change, migration not implied by the brief, `@bar/contracts` enum/shared contract change |
| **Sensitive** | Auth, payment, PDPA / guest-data behaviour |

### Not triggers (just do it)
Private helpers, naming, refactors inside the brief's own files, unit-test structure, WHY comments.

### What counts as "Approved"
Exactly one of:
- **(a)** an exact item in the current Ready brief revision — its *Pre-decided* section (exact: package name + version range, endpoint path, file path), or the *Contracts* / *Code map* of its linked `docs/features/<f>/design.md`, or the screens / states / actions of its linked `ui.md` (when *Approved by* names Field), as of the seed commit — **and traced to Field**: its row carries a *Source* naming Field (design *Decisions*, *Requirements*, or the brief's *Pre-decided* list). An item Cowork added that Field never confirmed is **not** approved.
- **(b)** an `Approved` DR — it covers faithful implementation of itself; no second DR needed.

Anything beyond the exact wording (another package, an extra endpoint, a changed DTO field) is a deviation → new DR. **A DR approval never unlocks a protected file** — only the brief's exact unlock list or a Field-approved edit in session (`Approved-by` trailer). Unlockable categories: `agent-boundaries.md` → *Brief Unlocks*. Field's PR review (+ assigned auditor's audit) is the backstop.

### Procedure
1. **Stop that path only.** Continue unblocked ACs.
2. Create `docs/decisions/DR-###-<slug>.md` from the template (`new-dr` skill) — plain-language headline, context, options with mini *Under the hood* (flow · tx boundary · failure/cleanup), familiar baseline if a pattern is new to Field, and a recommendation.
3. Add it under **Blockers / Coordination** in your state.
4. Start your reply with: `FIELD REVIEW NEEDED: DR-### — <one line>`.
5. Field writes the Decision (or tells Cowork to record it) → `Approved` / `Rejected`. The implementer resumes.

### Recording rule
Only the planner/auditor role (Cowork) records a DR Decision, and only when Field states it explicitly in the session ("approve DR-00X", "approve with change …", "reject") — `Decided: YYYY-MM-DD — recorded by Cowork on Field's explicit instruction`. Silence, "looks good", or approval of a related item never counts. Field's PR merge is the sign-off. Executors never write a Decision.

### Never
- Implement first, ask later.
- Pick a workaround silently — e.g. hand-roll a retry queue, parser or crypto helper to avoid a dependency DR.
- Put proposals as comments or TODOs inside protected files — proposals go in a DR.
- Mark your own DR approved, or treat "no answer yet" as approval.

## 6. Quality Gates, Grounding, and Audit

- **G1:** exact commands in the Ready brief (lint / typecheck / unit + seeded e2e tests for affected packages) **plus the run proof** for backend/frontend/mobile changes: the app starts in its real runtime from the work SHA `S` (backend: stack up → `migration:run` succeeds → `/api/health` returns 200; native mobile: build + install on an emulator/device → launch the app), and a UI/flow change is exercised on the real screen/browser — a 200 from the server or a green build alone is not proof. Start fresh on the work SHA; a server left running from earlier is not evidence. Code changed → rebuild (image or app); a restart reuses the old build. Docs/tooling-only briefs: `n/a`.
- **G2:** required CI checks (`ci`) green on the current PR head `H`, including the brief's integration/e2e coverage. Verify current workflows and scripts; historical setup notes are not evidence that CI exists or passes.
- **G3:** assigned audit PASS, all ACs supported, seeded `.e2e-spec.ts` untouched in `git diff <seed>..<S>`, `design.md` synced (no spec drift), no unresolved Must fix or unapproved deviation, handoff/state present, Field review. Metee also gives the Section 8 walkthrough.

### Local SonarQube scan (pre-commit habit, not a CI gate)
Field decided 2026-09-25: **local SonarQube Community Build** in Docker. Every developer — **required for Metee's work** — scans before committing and fixes what it flags; Field reads the result in the PR. Not enforced by CI. Hosting a shared SonarQube (EC2 or a cloud plan) is reconsidered with cloud provisioning in November.
- **Before each commit that changes code:** start SonarQube, run `pnpm sonar`, fix findings, re-scan until the Quality Gate passes **or** every remaining issue has a written reason.
- **Handoff → Sonar section:** gate result, issue counts by severity, remaining issues + reason (output of `pnpm sonar:report`). Field reviews it in the PR.
- **Who fixes:** an agent may **run** the scan and **explain** each issue. In Metee's sessions **Metee fixes the issues himself**; the agent helps with code only when he is blocked, and that help counts toward his ≤ 20% (Section 8).
- Never mark issues "won't fix"/"false positive", add exclusions or change the gate to get a pass without Field's approval.
- Setup and procedure: `docs/quality/README.md`.

### Six source-grounding rules
1. Read the approved brief, linked `requirements.md`, `design.md` and `ui.md`, `docs/features/INVARIANTS.md`, relevant DRs, and contracts/schema before writing behaviour.
2. Preserve approved DTO fields, enum values, REST responses and WS payloads. Never invent business fields, error codes, or silent `?? ''` fallbacks.
3. Missing business/security/payment/guest-data behaviour is a blocker/DR, not a TODO that lets an AC pass. Continue independent work.
4. Respect module services/ports and coding style rules (`docs/rules/core.md` and `docs/rules/<kind>.md`); no cross-module repository shortcuts.
5. Before review, compare brief ↔ `design.md` / `ui.md` ↔ contract ↔ implementation ↔ tests (and `docs/schema.sql` ↔ migrations/entities). The auditor reads sources and diff independently, not just the executor's summary.
6. Report exact commands, environment, work SHA `S`, exit codes, counts/skips, and limitations. Not run is never pass. Never hardcode/log secrets, tokens or sensitive guest data.

Cite decisions in the brief/handoff. Add code comments for non-obvious reasons, not mechanical citations on every helper.

### Audit loop
Cowork is default; Codex only on Field's explicit assignment (recorded in the brief by Field/Cowork). The audit records the actual reviewer/session, reason and reviewed SHA. An executor's self-check is not an independent audit.

Results: **PASS** (no Must fix), **CHANGES REQUIRED** (in-scope fixes), **BLOCKED** (decision, evidence or environment missing). Label each finding **Must fix** or **Suggestion**, with evidence and expected correction. Suggestions do not automatically expand scope. Re-audit after fixes; append results with the new work SHA. If the same failure repeats without progress, stop that loop and report attempts/evidence and the decision needed. Historical PASS WITH NOTES/FAIL reports stay unchanged.

## 7. Branching, Approval, and Completion

Main is the only long-lived branch. Branch `feat/BRIEF-###-<slug>`; commits `<type>(BRIEF-###): <message>`; PR title `BRIEF-###: <title>`. Docs branches `docs/<slug>` for approved workflow maintenance.

### Review evidence without a SHA loop (`S..H` Integrity)
The audit reviews implementation commit `S`; the audit file lands later at head `H`. Before merge (`/review` / `approve merge`), verify `git diff S..H` contains **only** `docs/audits/BRIEF-###.md`, `docs/handoffs/BRIEF-###.md`, and `docs/state/<id>/SESSION_STATE.md`. Any code, test, dependency, CI, schema, scope, or rule change in `S..H` requires a re-audit. Do not require an audit file to contain its own commit SHA. If CI fails on `H`, the executor fixes on the branch; any code or test change needs a compact re-check of the new commit by the auditor before merge — the auditor appends it uncommitted and the executor commits it as the new `H`.

### Merge authority
- **Field's own PRs** (brief Implementer = kj): pre-approved. The agent may merge once the assigned audit is PASS with zero Must fix, `S..H` is evidence-only, and required checks are green on `H`. Report PR, `H`, and merge SHA afterwards.
- **Metee's PRs:** always need Field's explicit `อนุมัติ merge BRIEF-###` for the exact head `H`, plus the Section 8 walkthrough. Before approval present exact PR, brief revision, head `H`, assigned audit/result, G1/G2 evidence, zero unresolved Must fix findings, and remaining limitations.

Immediately before merging, verify head `H` is unchanged, applicable gates pass, no unresolved conflicts/reviews and no new blocker. If head changes after approval (including state/docs), show the delta and request approval for the new head; code-affecting changes also need re-audit. Never silently merge a different head or bypass failing checks.

After merge: report merge SHA and **Done**; the git hand switches the checkout back to `main` and pulls. Optionally remove the merged task branch only when no work is lost. Closure reaches state in the next seed commit (kj) or the first commit of Metee's next task branch — never a direct-to-main or state-only commit.

### Merge method and protection
- **Merge commits only** — never squash or rebase. The `S..H` check and the audit's recorded SHAs need the PR's commits intact on `main`.
- **Remote protection (team profile, `ops/github/`):** `main-review` = PR + 1 approval, CODEOWNERS review, stale reviews dismissed, last push needs approval, merge commits only, no force-push / delete — bypass: repo admin (Field), pull requests only. `main-ci` = required check `ci`, **no bypass**. Field's own PRs merge via review bypass; CI still blocks until green. Before relying on bypass, verify the live rules (`gh api repos/khaijeaw65/bar-management-system/rules/branches/main`).
- Admin bypass is used only for Field's own PRs under the merge-authority conditions above; Metee's PRs never use bypass. Field may always merge directly.

### Deploy — merging never deploys
| Event | What happens |
|---|---|
| PR opened / updated | CI on affected packages · Vercel **preview** URL for frontend changes |
| Merge to `main` | CI only. **Nothing deploys.** |
| Field pushes a tag `vX.Y.Z` | Deploy workflow (frontend → Vercel prod, backend → ECS) |
| Manual `workflow_dispatch` | Same deploy workflow — for redeploys / rollback to an older tag |

- **Only Field creates release tags.** Tags mark milestones (e.g. `v0.1.0` = core vertical works end-to-end).
- Vercel auto-deploy of `main` is disabled (`git.deploymentEnabled.main: false`); PR previews stay on.
- The deploy workflow is its own brief, scheduled with cloud setup (late November).

## 8. Learning / Hand-Coding Mode — เมธี

Applies to: **Metee (เมธี)**. Goal: build real skill. Agents support, they don't author.

- **Agents ≤ 20%** — for explaining, debugging, reviewing. Not for generating whole components, pages or features.
- **The learner writes the tests.** Tests are where the learning is.
- **AI usage** in every handoff: `Low / Medium / High` + one line on what for. No fake-precise percentages.
- **G3 walkthrough:** the learner explains one non-trivial part of the PR. Can't explain it → PR goes back.
- **Sonar issues:** agents may run the scan and explain findings; Metee fixes them himself — agents write code only to unblock him (counts toward the 20%).
- **Agents in a learner's session:** if asked to generate a whole file, feature or test file, remind them of this rule once, then offer an explanation, a skeleton or a review instead.
- **Commands:** the learner's brief starts with `start BRIEF-###` (pre-checks + branch, then copilot only) and goes out with `ship BRIEF-###` (gates, handoff, commit/push of the learner's work). No AI co-author trailer on hand-typed code.
- **Pairing vs audit:** a session that paired on the code never audits it — use a separate audit session.

## 9. Why This Process Exists

No formal grading rubric is assumed. Feature specs, thin briefs, seeded acceptance tests, DRs, audits, handoffs, and PRs are durable evidence of planning, reasoning, review, and delivery.

## 10. Legacy

`docs/handoff.md` is **frozen** as the project log (decisions up to 2026-09-23). Do not add to it.
Locked decisions there are backfilled into DRs **only when a brief needs them** — not all at once.

### Brief ID rename map (Field, 2026-09-24)
| Old | New | Note |
|---|---|---|
| SH-001 | BRIEF-001 | Renamed 2026-09-24 |
| MB-000 | BRIEF-002 | Renamed 2026-09-24 |
| SH-002, SH-003, BE-000, FE-000, BE-001 | — | Never drafted under the old prefix; get the next BRIEF ID when drafted |

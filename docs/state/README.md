# Personal State

Each member has `docs/state/<id>/SESSION_STATE.md` (`kj`, `methee`) — **the only planning/progress files** (workflow Section 2). Each developer (or their current agent) writes only their own state; Cowork writes kj's under the rule below.

State = where work stands, ≤ 40 lines and ≤ 120 characters per line. Parallel briefs: only the main checkout writes state; a worktree executor writes its handoff only (workflow Section 3, *Parallel briefs*). Audit suggestions and tech debt go to the backlog (ClickUp / `BACKLOG.md`); *Carry over* keeps ≤ 5 bullets and one backlog link. The *Carry over* section (milestones, parked decisions, Field to-do, follow-up pointers) is copied unchanged by executors; only Cowork/Field edit it. A protected-file follow-up reads "propose diff for Field's OK", never "Field edits". Anything that doesn't fit is not state: a brief input goes in the brief, a decision in a DR, an audit follow-up stays in the audit (state keeps a one-line pointer), reference material in a docs file.

State is tracked on the brief branch and committed only inside commits that already happen (workflow Section 3): the seed commit (first step of `execute`/`start`), the Implemented handoff commit, the PASS commit, or a `handoff` WIP commit when a session ends mid-brief. Never a state-only PR or a push to main. Failed/unrun tests are allowed on WIP pushes when disclosed.

`onboard <id>` sets the gitignored root `.agent-local.json` to `{"developer":"<id>"}`. This is a checkout preference, not authentication or progress. Explicit session identity wins; never infer identity from Git author or tool account.

## Field's state writer (Cowork)
Cowork writes `docs/state/kj/SESSION_STATE.md` into the main checkout, uncommitted (no Git writes). It reaches Git in the next seed commit, made by the executor, or on a docs branch via ship line — never on a task branch after the executor's first commit, never on `main`. It never edits other members' state.

## Resume and publish
1. Read own state, brief/revision, linked DRs and PR; inspect the actual branch/worktree and dirty files.
2. Reconcile stale snapshots from evidence. Never overwrite uncommitted work to match state.
3. Record Resume, AC progress, Work commit, actual checks, unfinished files and blockers. Keep *Carry over* unchanged.
4. Inspect staged content for secrets, personal data and unrelated work; stage explicit paths (never `git add -A`); commit/push to the task branch. No PR before audit PASS.
5. After merge, the PR establishes Done. Closure reaches state in the next seed commit (kj) or the first commit of the member's next task branch.

**Expect `main` to be one step behind.** The snapshot on `main` is the last pre-merge state. Treat merged PRs as the truth.

No CLAIMS file, shared root session log or account-based auto-assignment. Brief Implementer and the task branch identify ownership; state holds resume details.

# Workflow — Roles, Briefs, Gates, Field Guard

> Rev 14 — 2026-09-24 (+ Cowork audit follow-ups: merge authority, PR tooling, state notes). Field explicitly confirmed the agent-loop draft: execute/resume, assigned auditor, tracked personal state, source-grounded checks and approved merge completion.
> This file governs execution. Briefs define outcomes; scoped rules define code conventions. Historical revisions remain in Git.

## 1. People, Roles, Session Types

- **Field (KJ):** decision authority, backend lead and final merge approver. Cursor is the primary executor; Claude Code is a fallback. Field may authorize an agent to perform the approved merge.
- **Methee (เมธี):** frontend/web and mobile developer; learning mode (§8) applies.
- **Executors (Cursor, Claude Code, Antigravity, Codex):** scoped code/tests, own state, handoffs, Pending DRs and brief-unlocked paths. Never approve their own work or change brief scope/status, DR decisions or rules on their own initiative.
- **Cowork:** planning partner and default auditor. May create Draft briefs, record explicit Field decisions, and revise/set Ready after Field reviews and explicitly approves. No app code.
- **Codex auditor:** fallback when Cowork usage is exhausted and Field explicitly assigns Codex; never switch automatically. Field may also request an additional cross-check. If Codex implemented the work, use a separate audit session.

| Session | Ready brief? | Allowed writes |
|---|---|---|
| Implementation | Yes | Scoped implementation, own state, handoff, Pending DRs |
| Audit | No | Audit report only; no implementation or state edits |
| Onboarding | No | Local identity and missing own state; preserve existing progress |
| Planning | No | Cowork's Drafts, explicit approved records, KJ state only under the coordinated branch rule in §2 |
| Field-authorized workflow maintenance | No | Only the concrete documents/changes Field explicitly requests; no general permission to rewrite rules |

Field decides; agents recommend or execute an explicit decision. Naming a developer does not grant that person's approval authority.

## 2. Documents and Ownership

```text
docs/
  briefs/BRIEF-###-<slug>.md
  state/README.md
  state/_TEMPLATE.md
  state/kj/SESSION_STATE.md
  state/methee/SESSION_STATE.md
  handoffs/BRIEF-###.md
  decisions/DR-###-<slug>.md
  audits/BRIEF-###.md
.agent-local.json                 # gitignored checkout identity, not progress
```

- Brief: Field-owned; Cowork creates Drafts and records Field-approved revisions/Ready status. Executors may fill only its PR link as bookkeeping, never scope, approval, status or auditor assignment.
- State: tracked in Git, one writer per developer; updated at session end, tool change or important blocker. Keep about 40 lines; optional planning Queue has at most six items.
- Cowork updates `docs/state/kj/SESSION_STATE.md` only on the currently open task/docs branch (never `main`), at a coordinated clean point with no executor mid-change or writing that state. With no open branch or no safe handoff point, Cowork reports the proposed state change in chat for the next owning session to record. Cowork never edits `docs/state/methee/`.
- Handoff: executor writes at Implemented, updates during review, frozen at merge. No post-merge status-only PR required.
- DR: anyone proposes; only Field decides; Cowork may transcribe Field's explicit decision (§5).
- Audit: assigned auditor records actual auditor, assignment source, brief revision, reviewed SHA and findings; append re-audits rather than rewriting history.
- PR: shared progress and completion authority. **Merged PR = Done**, even if the brief approval field still says Ready. Closed without merge is not Done.

For product/technical decisions: Approved DR > approved brief > rules > state. This never overrides document ownership, agent roles or protected-file permissions. A newer timestamp alone grants no authority; report unresolved contradictions.

Brief IDs use one project-wide `BRIEF-###` sequence allocated by Field. One testable outcome may span apps only with one implementer responsible for all parts; otherwise split and link dependencies. Target size: at most three working days. See §10 for retired IDs. UI briefs are design inputs, not executable briefs.

State is a branch snapshot, not a live lock. KJ reads Methee's latest state from the task branch/Draft PR without switching checkout. No CLAIMS file or additional project-wide session log. See `docs/state/README.md` for migration and concurrent-work rules.

## 3. Lifecycle and Ready Checklist

```text
Draft → Ready → In Progress → Implemented → Audit PASS → merge authority (§7) → PR merged (Done)
                              ↑                |
                              └─ CHANGES REQUIRED
Audit BLOCKED → Field decision / missing evidence → resume the affected step
```

Before Ready, Field/Cowork checks:
- Named implementer and **Assigned auditor: Cowork or Codex**; Codex assignment needs Field's explicit instruction.
- Goal, in/out scope, affected apps, references and approved contracts.
- Testable ACs, exact gate commands and required evidence.
- Dependencies with completion conditions; no unresolved decision blocking the main outcome.
- Exact Pre-decided items and protected-path unlocks where required.

Cowork presents the brief/change and asks for explicit Ready approval. Record approval date in the changelog; bump revision on content changes. Executors never turn a Draft into Ready. Existing active briefs missing assignment metadata require Field/Cowork to record it before audit; do not silently assign Codex. Completed historical briefs/reports retain their original statuses.

One brief = one task branch = one PR. Open a Draft PR after the first suitable commit; convert it to ready for review only after all ACs and G1 pass, handoff exists and state is current. WIP/state pushes may contain failing or unrun tests if disclosed honestly; they do not establish Implemented or authorize merge.

**Who can open / merge PRs (tool reality, 2026-09-24):** Claude Code runs in Field's own terminal with an authenticated `gh`, so it can push, open and merge PRs. Cursor's sandbox usually cannot reach `api.github.com` — it pushes and gives Field the compare link, unless Field allows a narrow network rule for `gh`. Cowork has no GitHub credentials — it commits locally and gives Field the push/PR commands. Any tool that cannot create the PR hands over the exact compare link; it never claims the PR exists.

Approved bookkeeping can ride with an open task PR as a separate docs commit at a coordinated clean point. Changes after an audit/approval require the head/evidence checks in §7. Do not create a separate PR only to mark an already merged brief Done.

## 4. Identity, Commands and Execution

### Identity and checkout

`onboard kj` / `onboard methee` stores `{ "developer": "kj" }` or `{ "developer": "methee" }` in the gitignored root `.agent-local.json`. This contains no tokens or progress. Select the owner from explicit session input first, then this local setting. If missing/invalid/conflicting, ask once; never infer identity from Git author configuration, tool account or the most recently edited state. Explicit onboarding may replace the identity setting; it does not transfer a brief.

Read AGENTS/CLAUDE, workflow, own state, exact brief revision and linked DRs. Check Git status, current branch, worktree and latest commit. Reconcile stale state from actual Git/PR evidence. Stop affected mutations on unexplained branch/ownership mismatch or unrelated dirty work; never stash/reset/commit another person's changes. Inspect blockers and dependency PRs, not just state text.

### Commands (chat commands, not installed shell commands)

| Command | Behavior |
|---|---|
| `onboard kj` / `onboard methee` | Read rules/state/briefs, inspect tools and checkout, save identity, initialize missing own state, summarize setup gaps and one eligible Ready brief. No automatic install, branch switch or feature implementation. |
| `execute BRIEF-###` / `ทำ BRIEF-###` | Includes resume automatically: verify identity, Ready revision, implementer, dependencies, DRs, scope, unlocks and checkout. Reuse existing branch/PR; implement, test, self-check, push and prepare review. |
| `resume` (optionally `kj` / `methee`) | Resume the current checkout's active brief through the same checks. Missing/ambiguous state requires evidence-based reconstruction, not a guessed task. |
| `audit BRIEF-###` / `ตรวจ BRIEF-###` | Use the assigned auditor and Audit write limits. Wrong tool for the assignment → explain the handoff; do not pretend a review happened or change assignment. |
| `สถานะ BRIEF-###` | Read-only summary from brief, branch, PR and evidence; label unavailable/stale information. |
| `handoff` | Update own tracked state and commit/push scoped progress to the task branch when permitted. Disclose failed/unrun checks; keep WIP PR Draft. Audit sessions update only their audit. Never auto-merge, deploy or switch branches. |
| `อนุมัติ merge BRIEF-###` | Field authorizes the presented PR/head and its completion actions under §7. |

Execute is idempotent: continue WIP, fix in-scope Must fix findings, report waiting review, or report Done for an already merged PR. Never create duplicate branches/PRs. A missing/duplicate ID or implementer mismatch must be clarified; legacy IDs resolve only through §10.

At Implemented, provide the PR, handoff, assigned auditor and `audit BRIEF-###` as the next action. Dispatch across tools only if an available integration actually supports it and the task authorizes it; otherwise provide the handoff command. Do not claim an external auditor has started when it has not.

### Concurrent work and state

One active brief per developer by default. Preserve Field's existing exception: at most two non-overlapping briefs in separate worktrees, separate agents, sharing only the lockfile and KJ's tracked state. Each checkout records its own active brief and the other brief under Coordination. Do not concurrently write the same physical state file. When integrating, reconcile the shared KJ state explicitly: retain the still-active brief as Resume, keep other progress/blockers in Coordination, never choose ours/theirs wholesale. The second PR reconciles the lockfile against main and re-runs affected gates. No claim service is introduced.

Developers use separate clones/worktrees. State commits travel on the task branch; main only shows merged snapshots. Before publishing, inspect the staged files for unrelated edits and sensitive data. A Work commit references the implementation evidence, never the state commit itself. At a cut-short session, record what is known without fabricating checks.

### Approval policy

Routine scoped reads, edits, tests, approved dependency installation, Git inspection/fetch, safe branch/worktree creation, scoped commits, normal feature-branch push and PR creation/update need no repeated conversational approval. Inspect checkout and destination first. Rebase only your own unpublished commits; stop when conflict resolution requires a product decision. Never push directly to main.

Critical actions require explicit authority: new Field Guard decisions; main merges/admin bypass (except Field's own PRs meeting the §7 pre-approval); releases/deploys; force-push or published-history rewrite; discarding work; deleting unmerged/shared refs or dirty worktrees; production/shared-data mutation; destructive migrations/volume deletion; paid infrastructure; access/permission changes. An exact existing approval remains valid until its scope/target changes.

Prepare reviewable evidence before requesting approval. Stop only the blocked path. Git operations do not need a DR; new product/architecture decisions do. Sandbox/OS/network prompts are separate from project authorization: obey tool permission mechanisms, request narrow reusable rules where supported, and never disable all approvals or bypass a rejection.

## 5. Field Guard — Decisions Go Through Field

### Triggers (must flag — never decide alone)
| Category | Examples |
|---|---|
| **Dependencies** | Any new / removed / upgraded package in **any** `package.json` |
| **Brief deviation** | Contract/DTO shape differs, an AC can't be met as written, any work outside the brief's scope |
| **Flow / architecture** | New module, cross-module import, new endpoint or WS event not in the brief, bypassing `PermissionsGuard`, changing the order → pay → close flow |
| **Data** | Schema change, a migration not implied by the brief, contracts enum change |
| **Sensitive** | Auth, payment, PDPA / guest-data behaviour |

### Not triggers (just do it)
Naming, private helpers, refactors inside the brief's own files, test structure, comments.

### Precedence — when is a trigger already approved?
**"Approved"** everywhere in this repo means exactly one of: **(a)** an exact *Pre-decided* item in the current `Ready` brief revision, or **(b)** an `Approved` DR. Nothing else.
- **Field wrote the brief, so the brief is a Field decision.** An item in the brief's *Pre-decided* section is approved **only if it is exact** (package name + version range, endpoint path, file path). Implementing it faithfully needs no DR.
- An Approved DR covers faithful implementation of that DR. Implementing it needs no second DR.
- **Anything beyond the exact wording** — a different package, an extra endpoint, a changed shape — is a deviation → new DR.

### Protected-file unlocks
- Protected files (`agent-boundaries.md`) stay protected by default. **A DR approval does not unlock them.**
- A brief may list **exact paths** under *Unlocked protected files*. The executor may edit **only those paths, only for that brief**. No globs.
- **Only these categories are unlockable:** root config (`turbo.json`, `pnpm-workspace.yaml`, root `package.json`, `.gitignore`), infrastructure (`infra/**`, `.github/workflows/**`) — still exact paths only, e.g. `infra/docker-compose.yml`, and `docs/schema.sql`.
- **Never unlockable:** rules & instructions (`docs/rules/**`, `CLAUDE.md`, `AGENTS.md`, agent wrappers), `.github/CODEOWNERS`, `.github/pull_request_template.md`, and all ownership-restricted docs (briefs, DR decisions, other person's state, audits, `docs/handoff.md`).
- Field's PR review (+ assigned auditor's audit) is the backstop.

### Procedure
1. **Stop that path only.** Continue ACs that are not blocked.
2. Create `docs/decisions/DR-###-<slug>.md` from the template — **context, options, and a recommendation are required.**
3. Add it under **Blockers / Coordination** in your state file.
4. Say it at the top of your reply: `FIELD REVIEW NEEDED: DR-### — <one line>`.
5. Field writes the Decision section, or tells Cowork to record it → `Approved` / `Rejected`. The implementer resumes.

**Recording rule (Cowork only):** Cowork writes a Decision only when Field states it explicitly in the session ("approve DR-00X", "approve with change …", "reject"). Silence, "looks good", or approval of a related item never counts. The Date line says `recorded by Cowork on Field's explicit instruction`. Field's PR merge is the sign-off. Executors never write a Decision.

### Never
- Implement first, ask later.
- Pick a workaround silently (e.g. hand-rolling what a library would do to avoid a dependency DR).
- Put proposals as comments inside protected files — proposals go in a DR.
- Mark your own DR approved, or treat "no answer yet" as approval.


## 6. Quality Gates, Grounding and Audit

- **G1:** exact commands in the Ready brief, normally lint/typecheck/tests for affected packages. Explicitly justified package-specific/manual evidence is allowed.
- **G2:** applicable required CI checks on the current PR head, including the brief's integration/e2e coverage. Verify current workflows and scripts; historical setup notes are not evidence that CI exists or passes.
- **G3:** assigned audit PASS, all ACs supported, no unresolved Must fix/unapproved deviation, handoff/state present, and Field review. Methee's walkthrough remains required.

### Local SonarQube scan (pre-commit habit, not a CI gate)

Field decided 2026-09-25: **local SonarQube Community Build** in Docker. Purpose: every developer — **required for Methee's work** — scans before committing and fixes what it flags; Field reads the result in the PR. Not enforced by CI. Hosting a shared SonarQube (EC2 or a cloud plan) is reconsidered with cloud provisioning in November.
- **Not live until BRIEF-006 merges** (Compose service, `pnpm sonar`, report script). Until then the handoff says "not available yet".
- **Before each commit that changes code:** start SonarQube, run `pnpm sonar`, fix findings, re-scan until the Quality Gate passes **or** every remaining issue has a written reason.
- **Handoff → Sonar section:** gate result, issue counts by severity, remaining issues + reason (output of `pnpm sonar:report`). Field reviews it in the PR.
- **Who fixes:** an agent may **run** the scan and **explain** each issue. In Methee's sessions **Methee fixes the issues himself**; the agent helps with code only when he is blocked, and that help counts toward his ≤ 20% (§8).
- Never mark issues "won't fix"/"false positive", add exclusions or change the gate to get a pass without Field's approval.
- Setup and procedure: `docs/quality/README.md`.

### Six source-grounding rules
1. Read the approved brief, relevant DRs, contracts/schema before writing behavior.
2. Preserve approved DTO fields/types, enum values, REST responses and WS payloads. Never invent business fields or errors.
3. Missing business/security/payment/guest-data behavior is a blocker/DR, not a TODO that permits claiming an AC is complete. Continue independent work.
4. Respect module services/ports; do not invent cross-module repository shortcuts.
5. Before review, compare brief ↔ contract ↔ implementation ↔ tests, and touched schema ↔ migration/entity definitions. The auditor independently reads sources and diff, not just the executor's summary.
6. Report exact commands, environment, work SHA, exits, counts/skips and limitations. Not run is never pass. Do not hardcode/log secrets, tokens or sensitive guest data.

Cite decisions in the brief/handoff. Add code comments for non-obvious reasons, not mechanical citations on every helper. Private helpers/naming/test organization inside scope are routine decisions. Resolve conflicting sources by authority, never timestamp alone; unknown significant behavior goes to Field.

### Audit loop

Cowork is default. Codex may replace it only when Field explicitly assigns the fallback due to Cowork usage exhaustion. Record assignment/reassignment in the brief through Field/Cowork, and actual reviewer/session, reason and reviewed SHA in the audit. A separate Codex cross-check remains optional. An executor's self-check is not an independent audit.

Results: **PASS** (no Must fix), **CHANGES REQUIRED** (in-scope fixes), **BLOCKED** (decision, evidence or environment missing). Label each finding **Must fix** or **Suggestion**, with evidence and expected correction. Suggestions do not automatically expand scope. Re-audit after fixes; append results with the new work SHA. If the same failure repeats without progress, stop that loop and report attempts/evidence and the decision needed instead of repeating indefinitely.

Historical PASS WITH NOTES/FAIL reports stay unchanged; new reports use the new results.

## 7. Branching, Approval and Completion

Main is the only long-lived branch. Use short-lived task branches and merge commits through PRs. Default format: `feat/BRIEF-###-<slug>`; commits `<type>(BRIEF-###): <message>`; PR title `BRIEF-###: <title>`. Field may request a docs branch for approved workflow maintenance.

### Review evidence without a SHA loop

The audit reviews implementation commit S. The audit file itself is committed later at head H. Before approval, verify and record that S..H contains only audit/handoff/state/PR-link evidence; any code, tests, dependency, CI, schema, brief-scope or rule change requires re-audit of the changed work. Do not require an audit file to contain its own commit SHA. The pre-merge summary names both audited S and actual H, checks on H and the intervening diff. Reuse test evidence only with an explicit explanation of unchanged tested files/environment; required CI still targets H.

**Merge authority (Field, 2026-09-24):**
- **Field's own PRs** (brief Implementer = kj): pre-approved. The agent may merge once the assigned audit is **PASS** with zero Must fix, S..H is evidence-only, and required checks are green on H. No separate `อนุมัติ merge` needed; the agent reports PR, H and merge SHA afterwards.
- **Methee's PRs:** always need Field's explicit `อนุมัติ merge BRIEF-###` for the exact head H, plus the G3 walkthrough.
- **Remote protection (confirmed 2026-09-23/24):** `main` requires a PR + 1 approval, CODEOWNERS = Field, admin bypass allowed for Field, required status check `ci`. Before relying on bypass, verify the live settings still match.

For Methee's PRs, before Field approval present exact PR, brief revision, head H, assigned audit/result, G1/G2 evidence, zero unresolved Must fix findings, and remaining limitations. Field's `อนุมัติ merge BRIEF-###` approves the presented PR/head, not an unspecified future head.

Immediately before merging, verify head H is unchanged, applicable gates pass, no unresolved conflicts/reviews and no new blocker. If head changes after approval (including state/docs), show the delta and request approval for the new head; code-affecting changes also need re-audit. Use an expected-head merge check where supported. Never silently merge a different head or bypass failing checks.

Field may always merge directly. Admin bypass is used only for Field's own PRs under the merge-authority conditions above; normal Git permission never grants bypass. Methee's PRs never use bypass.

After verified merge: report merge SHA/PR and **Done**. The PR is authoritative; no status-only brief PR. Optionally remove the merged task branch only when no work is lost and sync the local checkout safely. Update own state locally with the result; include it in the next suitable task commit, never commit directly to main just to publish closure. Closed/unmerged PRs remain incomplete. No release tag or deployment is included in merge approval.

### Deploy — merging never deploys
| Event | What happens |
|---|---|
| PR opened / updated | CI on affected packages · Vercel **preview** URL for frontend changes |
| Merge to `main` | CI only. **Nothing deploys.** |
| Field pushes a tag `vX.Y.Z` | Deploy workflow (frontend → Vercel prod, backend → ECS) |
| Manual `workflow_dispatch` | Same deploy workflow — for redeploys / rollback to an older tag |

- **Only Field creates release tags.** Tags mark milestones (e.g. `v0.1.0` = core vertical works end-to-end).
- Vercel auto-deploy of `main` is disabled (`git.deploymentEnabled.main: false`); PR previews stay on.
- The deploy workflow is its own brief, scheduled with cloud setup (late November). Until then there is nothing to deploy to.


## 8. Learning Mode — เมธี

Goal: เมธี builds real skill. Agents support, they don't author.

- **Agents ≤ 20%** — for explaining, debugging, reviewing. Not for generating whole components, pages, or features.
- **เมธี writes the tests himself.** Tests are where the learning is.
- **AI usage** in every handoff: `Low / Medium / High` + one line on what for. No fake-precise percentages.
- **G3 walkthrough:** เมธี explains one non-trivial part of the PR. Can't explain it → PR goes back. This is the real evidence of learning.

**Sonar issues:** agents may run the scan and explain findings; เมธี fixes them himself — agents write code only to unblock him (counts toward the 20%).

**Agents running in เมธี's session:** if asked to generate a whole file, feature, or test file, remind him of this rule once, then offer an explanation, a skeleton, or a review instead.


## 9. Why This Process Exists

No formal grading rubric is assumed. Briefs, DRs, tests, audits, handoffs and PRs provide evidence of planning, reasoning, review and delivery. Pilot the loop on one small brief before adding more automation or coordination systems.

## 10. Legacy

`docs/handoff.md` is **frozen** as the project log (decisions up to 2026-09-23). Do not add to it.
Locked decisions there are backfilled into DRs **only when a brief needs them** — not all at once.

### Brief ID rename map (Field, 2026-09-24)
| Old | New | Note |
|---|---|---|
| SH-001 | BRIEF-001 | Renamed 2026-09-24 |
| MB-000 | BRIEF-002 | Renamed 2026-09-24 |
| SH-002, SH-003, BE-000, FE-000, BE-001 | — | Never drafted under the old prefix; get the next BRIEF ID when drafted |

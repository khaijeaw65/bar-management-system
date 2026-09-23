# Audit — WORKFLOW Agent Workflow Cross-check

| | |
|---|---|
| **Auditor** | Codex (cross-check) |
| **Date** | 2026-09-23 |
| **Session owner** | Field (KJ), confirmed in conversation |
| **PR** | None — local, uncommitted workflow review |
| **Brief revision** | N/A — review requested by Field and the final handoff entry |
| **Recommendation** | FAIL — operational readiness; retain the overall design |

## Acceptance Criteria

These are the seven review questions in `docs/handoff.md`, not feature ACs.

| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| Contradictions checked | Yes | workflow, boundaries, core, CLAUDE, AGENTS, templates | Findings 2–5 |
| Ownership checked | Yes | workflow §1–4; boundaries; PR template | Findings 4–7 |
| Decision loopholes checked | Yes | workflow §5; brief §7; boundaries | Findings 2–3 |
| Resume protocol checked | Yes | both state files and state template | Finding 6 |
| Gate realism checked | Yes | root/app manifests, turbo config, backend e2e files, `.github/` | Findings 1, 7 |
| Maintenance burden checked | Yes | workflow §6, §8; document lifecycle | Finding 9 |
| Drift checked | Yes | legacy handoff vs active rules and package configuration | Finding 8 |

## Rule Check

| Rule | OK? | Note |
|---|---|---|
| Scope — review only | Yes | Only this audit file created |
| No unapproved deviations / deps | Yes | No implementation or dependency changes |
| PermissionsGuard / audited save / ESM application compliance | N/A | This is not an application-code audit |
| Agent boundaries respected | Yes | Rules, briefs, app files, and legacy handoff untouched |
| Session state update | Exception | Handoff's specific cross-check instruction permits only this audit file; it conflicts with the universal end-of-session state update. Both state files were read and left unchanged. |

## Test Quality

Static inspection only; no application tests run. No claim that current tests pass. Backend has lint, unit, and e2e scripts, but no typecheck script. Frontend has lint but no typecheck, test, or test:e2e script. Contracts has typecheck only. Root `turbo run typecheck` therefore does not establish type safety for both applications. The existing backend e2e test checks `GET /` returning `Hello World!`; it does not establish the required real-Postgres integration gate. No GitHub Actions workflow exists in the inspected `.github/` directory. Remote branch protection was not inspected.

The brief command block and handoff evidence block both omit typecheck, despite G1 requiring it. Record exact commands, package scope, tested commit, exit status, test counts, and skips. Missing required tasks must be reported as blocked, not green or silently N/A. Use manual evidence for documentation/design ACs instead of artificial unit tests.

## Findings

| # | Severity | Current → Updated |
|---|---|---|
| 1 | High | **Gates are specified but incomplete.** `workflow.md` §6 requires lint/typecheck/unit and CI/e2e, while manifests and templates cannot deliver that coverage. → Add explicit bootstrap acceptance criteria for each required script and CI check. Include typecheck in both templates; identify the temporary manual gate honestly until CI is verified. |
| 2 | High | **Protected-file instructions contradict themselves.** `agent-boundaries.md:9` prohibits modification, but lines 4, 58–59 instruct agents to comment in protected files, including their own rules. Its root-only rule globs omit existing nested `app/*/.cursor/rules/`; CODEOWNERS itself is not explicitly protected. → Put proposals in a DR or audit, never in protected files. Explicitly cover nested instruction files and enforcement configuration. |
| 3 | High | **Approval has two incompatible definitions.** Brief §7 says pre-decided items need no DR; workflow §5 says every dependency change triggers one, and boundaries require an Approved DR for app manifests. Sensitive work also has no explicit distinction between approved implementation and a new decision. → Define one precedence rule: for example, sensitive/dependency decisions reference an existing Approved DR; faithful implementation needs no second DR, but deviations do. Specify that DR approval does not itself lift protected-file ownership. |
| 4 | High | **Bootstrap work has no executable ownership route.** SH-001 is intended to establish CI, but agents may never modify `.github/workflows/**`; Expo setup similarly touches protected root configuration. → Mark protected edits as Field-owned steps with concrete deliverables and dependencies. If Field wants agents to implement these edits, Field must explicitly revise the policy first. A Ready brief should not silently override it. |
| 5 | Medium | **Session and role rules reject valid review work.** AGENTS requires a Ready brief before any task; workflow allows cross-check auditing; this handoff allows only one audit file while the session protocol mandates a state update. Cowork draft permissions also conflict with the unqualified ban on agents editing briefs. → Define audit/planning sessions separately from implementation, with explicit writable outputs and state-update rules. Keep executor restrictions clear. |
| 6 | Medium | **Resume state lacks a required checkout check.** State records a branch and next step, but does not require checking the actual branch, dirty tree, brief path, pending changes, and approval records before continuing. Current repository changes span old setup, schema, docs, and moves. → Require a read-only checkout/status check at session start, link the active brief, and note uncommitted work ownership. Serialize sessions sharing one person's state file, or assign a single state writer. State should be an index; the current brief and DR remain authoritative. |
| 7 | Medium | **Review evidence can become stale.** Handoffs are written once before review, yet rejected PRs return to implementation; audits have no tested commit/re-review field. G3 mandates Cowork despite Codex being allowed to audit, and the PR template lacks the audit link claimed in workflow §7. Main protection is stated as fact while Field's state lists setup as pending. → Keep one handoff per brief, update it through review, freeze at merge, and bind audits to a commit. Clarify auditor substitution, add the audit link, and label protection pending until verified. |
| 8 | Medium | **Active rules conflict with actual setup.** Core says TypeScript 6 and NodeNext everywhere, while frontend uses TypeScript 5 and bundler resolution. Core says build contracts first, but contracts has no build script; it says root dev runs both apps, but backend has start:dev rather than dev. Legacy handoff paths and lifecycle enums are historical; shared enum reconciliation remains queued. → Field should distinguish target configuration from verified current configuration and resolve these discrepancies in scoped briefs. Do not follow superseded legacy tasks or “fix” compiler settings blindly. Current 32-table wording is consistent with the later consent-table decision; the older 31-table entry is historical. |
| 9 | Medium | **Two-person maintenance cost may crowd out implementation.** Every PR needs an audit, all ACs need tests, usage percentages imply precision, and every old decision is queued for backfill. → Keep brief/DR/handoff/review traceability, but allow compact reviews for low-risk work, manual evidence where appropriate, and coarse AI disclosure plus the walkthrough. Backfill decisions needed for the next brief first. These are proposals for Field, not policy changes made by this audit. |
| 10 | High for assessment objective | **Workflow quality is not mapped to grading evidence.** Reviewed rules, FRD, and brief template contain no assessment traceability requirement. A well-controlled implementation can still miss what the advisor expects. → Add one lightweight assessment matrix with criterion, source/date, confirmed vs assumed status, linked brief/AC, and demo/report evidence. Ask the advisor to confirm it; do not invent rubric weights or treat provisional criteria as official. |

## Recommendation to Field

**FAIL for operational readiness, not for the overall approach.** Keep scoped briefs, explicit decision authority, short handoffs, and independent review. Resolve contradictory permissions and gate coverage before calling the workflow enforceable. No new agent roles or document hierarchy are needed.

Suggested order:

1. Resolve findings 2–5 so an agent can unambiguously determine what it may do.
2. Establish and verify the bootstrap gates; distinguish configured checks from planned checks.
3. Add the assessment evidence matrix and obtain advisor feedback before expanding scope.
4. Execute one small Ready brief end-to-end, then remove workflow steps that produced no useful evidence.

For the assessment matrix, provisional rows could cover core-flow correctness, recovery from duplicate/failed requests, architecture justification, user validation, and each student's ability to explain the implementation. These are suggested discussion topics, not known DPU scoring criteria. The existing five-minute walkthrough is useful evidence of understanding; an estimated AI percentage alone is weak evidence.

No DR was created because this audit proposes changes without implementing or adopting them. Field makes the final decision. Next session: read this audit, decide the policy changes, then resume the queue in `docs/state/kj.md`.

---

## Disposition — Cowork · 2026-09-23 (applied to working tree, pending Field review)

Field decisions taken in session: **#4** brief unlock list · **#6** one executor session per person (Cursor primary, Claude Code fallback) · **#9** executor marks `Implemented`, Cowork audits every brief, Field sets `Done`.

| # | Disposition | Where |
|---|---|---|
| 1 | Applied — typecheck in G1 + templates; missing script = BLOCKED; gate status table (G2 Planned); evidence incl. commit SHA | workflow §6, brief + handoff templates |
| 2 | Applied — no comments in protected files; proposals → DR; nested `app/*/.cursor/rules/**` + all `.github/**` protected | agent-boundaries |
| 3 | Applied — precedence: exact brief Pre-decided or Approved DR covers faithful implementation; DR never unlocks protected files | workflow §5 |
| 4 | Applied — brief *Unlocked protected files* (exact paths; rules never unlockable) | workflow §5, agent-boundaries, brief §8 |
| 5 | Applied — session types Implementation / Audit / Planning with own write + state rules | workflow §1, AGENTS.md |
| 6 | Applied — read-only checkout check at start; state = index; authority order; one executor session per person | workflow §2, §4, state template |
| 7 | Applied — handoff updated through review, frozen at merge; audit bound to commit + re-audit section; auditor substitution; audit link in PR template; protection marked pending | workflow §2, §6, §7, templates |
| 8 | Deferred — config drift (TS version, module resolution, contracts build, `dev` script) → brief `SH-003`; not fixed blindly | `docs/state/kj.md` queue |
| 9 | Applied — risk-based audit depth (Full / Compact); AI usage Low/Med/High; DR backfill on demand | workflow §3, §8, §10 |
| 10 | **Rejected by Field** — no formal grading rubric exists; the process is shown to the advisor as-is and is for Field's own learning. Assessment matrix removed; workflow §9 states the existing artifacts are the evidence | workflow §9 |

Note on #9: Field asked for the agent to mark the brief done. Applied as `Implemented` (not `Done`) so the executor never approves its own work — Field to confirm.

---

## Re-audit — 2026-09-23 · Rev 2 working tree (base 9a869b75ef61aa4dd93ab87d09fef68c631cadb2)

| | |
|---|---|
| **Auditor** | Codex (cross-check), requested by Field |
| **Depth** | Full workflow review |
| **Reviewed version** | Uncommitted Rev 2 files on `main`; base SHA above is NOT a commit containing the reviewed changes |
| **Recommendation** | FAIL — two high-priority policy/enforcement gaps remain |

### Acceptance Criteria / Previous Findings

| Original finding | Re-audit result | Evidence |
|---|---|---|
| 1 — Gate realism | Partially resolved | Typecheck and BLOCKED reporting added; missing scripts and CI honestly labeled. Actual gates still unavailable. |
| 2 — Protected-file contradictions | Mostly resolved | TODO/comment loophole removed; nested Cursor rules and `.github/**` now covered. New unlock scope gap below. |
| 3 — Approval definition | Partially resolved | Exact Pre-decided items now recognized in workflow §5, but boundary instructions and PR checklist still require a DR unconditionally. |
| 4 — Bootstrap ownership | Resolved at policy level | Exact-path unlocks allow CI/root configuration work; no executable SH brief exists yet. |
| 5 — Session types | Resolved for this audit | Explicit Audit sessions need no Ready brief and write only the audit, without updating state. |
| 6 — Resume protocol | Resolved at design level | Checkout check, richer state template, and one executor session per person. Pilot still needed. |
| 7 — Review evidence | Mostly resolved | Commit fields, append-only re-audits, mutable-until-merge handoffs, audit link, protection marked pending. Auditor substitution remains contradictory. |
| 8 — Configuration drift | Deferred, not resolved | SH-003 appears in queue; active core rules and manifests remain inconsistent. |
| 9 — Maintenance burden | Improved | Compact reviews, coarse AI disclosure, on-demand DR backfill. Cowork review on every brief is a recorded Field choice, not a defect by itself. |
| 10 — Assessment evidence | Resolved structurally | `docs/assessment.md` and brief links exist; advisor confirmation and concrete brief/evidence links remain future work. |

### Rule Check

Audit-only scope respected. Only this re-audit section was appended; no rules, state, briefs, code, dependencies, or GitHub settings changed. Existing audit and Cowork disposition preserved. No implementation decision or DR approval was made.

### Findings — Current → Updated

| ID | Severity | Current → Updated |
|---|---|---|
| R2-1 | High | **Precedence/unlocks can defeat ownership restrictions.** `workflow.md:57` puts DRs and briefs above rules without reserving immutable constraints. Its §5 and `agent-boundaries.md:54–59` exclude only Rules & Instructions from unlocks, leaving ownership-restricted briefs, DR decisions, other-person state, and the frozen log apparently unlockable. This conflicts with the executor role's explicit bans. → Limit unlocks to named categories such as root configuration, infrastructure, and schema; explicitly exclude ownership-restricted documents. State that document precedence resolves approved product decisions, not role permissions, rule-edit bans, or approval authority. |
| R2-2 | High | **Required sole-owner review cannot handle Field-authored PRs.** `.github/CODEOWNERS` names only `@khaijeaw65`; workflow §7 plans required Code Owner approval while Field is also backend implementer. If a PR is opened under Field's account, Field cannot approve it on GitHub, including when a local agent opens it using that account. → Before enabling protection, Field must select a workable independent reviewer arrangement or explicitly document a narrowly controlled exception and its tradeoff. Keep product decision authority distinct from GitHub review eligibility. Do not manufacture another identity just to self-approve. Remote settings and current CLI identity were not inspected; this is a conditional design deadlock, not a claim that a live PR is blocked. |
| R2-3 | Medium | **The dependency exception is not propagated.** Workflow §5 allows exact brief Pre-decided items without a DR, while `agent-boundaries.md:67` says any dependency change requires one and `.github/pull_request_template.md:19` offers only an Approved DR. AGENTS/CLAUDE repeat unconditional trigger summaries. → Make every summary/checklist reference the same exception: exact Ready-brief revision/item OR Approved DR; protected-path unlock still required independently. Otherwise a compliant agent stops unnecessarily or cannot truthfully complete the checklist. |
| R2-4 | Medium | **Auditor substitution has two meanings.** Workflow §3 requires Cowork for every brief and names only Cowork for Audited, but §6 accepts Cowork or Codex when Field requests cross-check. The disposition claims substitution was applied. → Preserve Field's recorded choice by saying Codex cross-check supplements mandatory Cowork review, or have Field explicitly allow substitution and update all three locations. Audit sessions also write only the audit file, while the PR template says Cowork adds its link; assign that PR edit to the implementer/Field. |
| R2-5 | Medium | **G1's package coverage needs an explicit policy before the first shared brief.** §6 requires lint/typecheck/test for every touched package. Contracts currently has only typecheck; the documented gap list omits its missing lint/test scripts. SH-002 would therefore block even after app typecheck is added. Docs/manual evidence is permitted, but the PR checklist still demands a test for every AC. → Include contracts in bootstrap coverage, or explicitly define justified package-specific gates in Ready briefs. Keep missing required scripts BLOCKED; do not silently exempt contracts or write meaningless tests. Update the PR checklist to accept approved manual evidence. |
| R2-6 | Low | **Evidence templates still lag policy.** Workflow §6 requires exact commands, exits, counts, and skips, but the handoff shows labels rather than exact commands and does not show exits/skips consistently. PR AI usage still asks for rough percentages. → Align these small template fields with the policy before the pilot. |

GitHub reference for R2-2: [Approving a pull request with required reviews](https://docs.github.com/en/enterprise-cloud%40latest/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews) states that PR authors cannot approve their own PRs. This limitation should have been included in the first audit; it is newly identified here, not introduced by Rev 2.

### Test Quality / Verification Limits

Re-read current AGENTS, CLAUDE, workflow/boundaries/core, all five templates, both state files, assessment matrix, GitHub templates/CODEOWNERS, package manifests, and backend e2e test. Verified current branch and base commit. No application tests run: this review checks policy and script availability, not implementation correctness. No Actions workflows or executable feature/bootstrap briefs were present. Script and configuration gaps remain real, but their explicit planned status is now accurate and is not by itself a reason to reject a planning-stage workflow.

### Recommendation to Field

Rev 2 is materially stronger. Fix R2-1 and choose a feasible review arrangement for R2-2 before treating the policy as enforceable. Reconcile R2-3 through R2-5 before the first implementation pilot; R2-6 is a small template cleanup. Keep the existing document structure—no additional agent roles or process layers are recommended. The assessment matrix addresses the original grading concern appropriately as a provisional map; only advisor confirmation can establish the actual rubric.

Audit sessions now correctly leave state untouched. The next action is Field review of this section, followed by a small Ready bootstrap brief with exact gate commands and allowed paths.

---

## Disposition (Re-audit) — Cowork · 2026-09-23 · workflow.md Rev 4 (uncommitted)

Note: between the re-audit and this disposition, Field **rejected original #10** (no formal grading rubric — process is shown to the advisor as-is and serves Field's learning). `docs/assessment.md` was deleted; workflow §9 now states the existing artifacts are the evidence.

| ID | Disposition | Where |
|---|---|---|
| R2-1 | Applied — precedence now resolves product/technical decisions only, never permissions/ownership/approval; unlockable categories whitelisted (root config, infra, schema); CODEOWNERS, PR template and all ownership-restricted docs never unlockable | workflow §2, §5 · agent-boundaries "Brief Unlocks" |
| R2-2 | Applied — **confirmed by Field 2026-09-23**: 1 required approval + admin bypass. เมธี's PRs need Field's approval; Field's PRs merge via recorded admin bypass only after Cowork audit + gates; เมธี may review Field's PRs non-blocking; no second account | workflow §7 |
| R2-3 | Applied — one definition of "approved" (exact Pre-decided item in Ready brief OR Approved DR) propagated to AGENTS, CLAUDE, agent-boundaries, PR template | workflow §5 + all summaries |
| R2-4 | Applied — Codex supplements, never replaces, the Cowork audit; implementer/Field adds the audit link to the PR | workflow §3, §6 · PR template |
| R2-5 | Applied — G1 = exact gate commands in the Ready brief (default lint/typecheck/test, brief may justify package-specific); contracts gaps listed and included in SH-001; PR checklist accepts brief-allowed manual evidence | workflow §6 · PR template |
| R2-6 | Applied — handoff evidence is a per-command table (exact command, exit, counts, skips); PR AI usage is Low/Medium/High | handoff + PR templates |

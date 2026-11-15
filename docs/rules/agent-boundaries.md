# Agent Boundaries — AI-Powered Bar Management System

> **Source of the protected list (a compact copy is in `AGENTS.md`). All agents. No exceptions.**
> Protected files are never edited by agents on their own initiative — not even with a comment or TODO. If one needs changing → raise a DR (`docs/decisions/_TEMPLATE.md`) or ask Field, and stop that path. An agent may edit a protected file **only with Field's explicit approval of the exact change** (see *Field-approved edits*).
> Guard: `AGENTS.md`. Workflow: `docs/rules/workflow.md`.

---

## Files Agents MUST NOT Modify

### Root Config
```
turbo.json
pnpm-workspace.yaml
package.json (root)
.gitignore
```
App-level dependency manifests: only after an Approved DR or an exact brief Pre-decided item.

### Agent Rules & Instructions (never brief-unlockable)
```
CLAUDE.md, AGENTS.md          ← root and nested (`app/*/CLAUDE.md`, `app/*/AGENTS.md`)
docs/rules/**
.cursor/rules/**
.agents/rules/**
app/*/.cursor/rules/**
```
Exception: the `<!-- BEGIN:nextjs-agent-rules -->` block in `app/frontend/AGENTS.md` is re-written by `next dev` — leave it as generated (the field-kit pointer lines below it stay protected).

### Infrastructure & Enforcement
```
infra/**                     ← Terraform, docker-compose.yml, all infra files (DR-001)
.github/**                   ← workflows, CODEOWNERS, PR template
.githooks/**                 ← kit enforcement (never brief-unlockable)
ops/gates/**                 ← kit enforcement (never brief-unlockable)
scripts/field-kit/**         ← kit enforcement, incl. check-lock.sh (never brief-unlockable)
```
### Schema (ERD locked — 38 tables, 10 domains)
```
docs/schema.sql              ← brief-unlockable (exact path); Field-approved edits by Cowork / Codex allowed
docs/erd.html                ← Field-approved edits by Cowork / Codex allowed; not brief-unlockable
```
### Workflow & Spec Documents (ownership-restricted)
```
docs/features/**          ← Spec-Anchored feature requirements & design. Cowork creates/revises with Field approval; executors update only `design.md` status/code map rows explicitly listed in the brief's Tasks/Build steps within the brief PR
docs/features/*/design-source/** ← approved Claude Design snapshot: nobody edits it (agents included). A new design version = a new snapshot + new hashes in `ui.md`, Field-approved
docs/briefs/**            ← Field only. Cowork writes Drafts and sets Ready after Field approves (uncommitted); the executor moves the brief into its worktree and commits it unchanged in the seed commit. Executors never edit briefs
acceptance e2e files      ← written by the executor at Step 0 from the brief's test plan; LOCKED from the `test(BRIEF-###): acceptance (red)` commit on, together with the e2e runner config present at that commit (`jest-e2e.json`, `vitest*.config.*`, `playwright.config.*`). A later change needs Field's OK and a commit with `Approved-by: Field (e2e-change)`; the audit reviews the net diff since the lock
docs/decisions/**         ← anyone may CREATE a Pending DR. Only Field writes Decision/Status (Cowork may record an explicit decision)
docs/audits/**            ← assigned auditor only. The executor commits the report unchanged in the ship commit (packaging only)
docs/handoffs/**          ← the brief's executor
docs/defects/**           ← anyone may CREATE a defect file (DEF-xx kept; new ones DEFECT-###-<slug>.md)
docs/handoff.md           ← frozen legacy log (decisions up to 2026-09-23) — nobody edits it
docs/quality/README.md    ← Field-owned quality procedure (local SonarQube); change only with Field's approval
docs/design/source/**     ← design source snapshots (byte copies, SHA-256 in the CD handoff §11): written once at CD approval, never edited; a new canvas version = a new snapshot
docs/design/poc-source-handoff/source/**   ← same rule (POC worked example, BRIEF-900)
```
Briefs seeded before workflow Rev 24 (BRIEF-022, 059, 060, 062, 065, 900) keep the Rev 23 rule: their Cowork-seeded e2e files (`app/backend/test/**/*.e2e-spec.ts`, `app/frontend/e2e/**/*.spec.ts`, mobile e2e listed in the brief) are locked from the seed commit; executors never edit them.

---

## Field-approved edits

Any protected file may be edited when Field approves the specific change in the session (explicit OK on the exact diff/text before it is written). Commit trailer: `Approved-by: Field (session)` — or `Approved-by: Field (e2e-change)` for a locked e2e file. Record each one as a row in the handoff's *Owner approvals* table when the OK is given; the audit checks every trailer against the brief's §9 unlock list or that table.
- Approval covers that change only.
- The agent proposes the diff and writes it after the OK — never hands the edit to Field as manual work.
- Where it lands: the current executor's next commit (implementation), the next seed commit, or a docs branch (planning).
- No approval in the session → no edit: raise a DR or ask, and stop that path.
- Inside a brief, executors edit protected files only via the brief's exact unlock list (brief §9 *Guard — unlocks*, populated during the Dry Run).
- Still never edited by anyone: `docs/features/*/design-source/**`, `docs/design/source/**`, `docs/design/poc-source-handoff/source/**` (byte copies) and `docs/handoff.md` (frozen log).

---

## Brief Unlocks

A Ready brief may list **exact paths** under *Unlocked protected files* (verified during the Dry Run before Ready).
- Edit **only those paths, only within that brief**. No globs.
- **Only unlockable:** Root Config, app wiring entrypoints (`main.ts`, `app.module.ts`), Infrastructure (except `.github/CODEOWNERS` and `.github/pull_request_template.md`), and `docs/schema.sql`.
- **Never unlockable:** Agent Rules & Instructions, `docs/erd.html`, CODEOWNERS, PR template, kit enforcement (`.githooks/**`, `ops/gates/**`, `scripts/field-kit/**`), Workflow Documents. Locked e2e files change only through the `(e2e-change)` path above.
- **Packaging is not editing:** the seed commit (brief, defect, feature files moved unchanged) and the ship commit (audit report unchanged + handoff) need no trailer.
- A DR approval alone does not unlock a protected file.

---

## What To Do Instead

| Situation | Action |
|---|---|
| Any dependency change | Allowed only if approved (exact Pre-decided item or Approved DR). Otherwise raise a DR and stop that path |
| Brief or a locked e2e looks wrong / incomplete | Raise a DR (Category: Brief deviation) or ask Field; a locked e2e changes only via `(e2e-change)` |
| Schema needs a change | Raise a DR (Category: Data); optional SQL sketch inside the DR |
| Workflow / infra / CI change needed | Propose the exact diff for Field's OK (*Field-approved edits*), or raise a DR when it's a real decision; infra/CI can also go through a brief unlock list |
| A rule looks wrong | Raise a DR or ask Field — never leave comments inside rule files |

---

## Why This Exists

- Root configs affect every package — a wrong edit breaks the whole build.
- Agent rule files and locked acceptance tests stay out of the coding agent's reach after the lock, so no executor can weaken its own grading criteria once it has seen them fail.
- Infra/CI files need deliberate review; an accidental change can remove the review requirement itself.
- `docs/schema.sql` is the ERD for 38 tables across 10 domains — a silent change breaks entities, migrations and the visual ERD.
- Design source snapshots are the design contract; an edit makes the SHA-256 inventory wrong.

## Layer 1 Enforcement (Hard)

Server-side rulesets on `main` per `ops/github/README.md` — this repo uses the **team** profile: `main-review` (PR + 1 approval, CODEOWNERS review, merge commits only; Field bypass for review only) + `main-ci` (required check `ci`, nobody bypasses). Direct push blocked.
**Applying a ruleset changes GitHub settings: the git hand runs it only after Field's explicit OK.**

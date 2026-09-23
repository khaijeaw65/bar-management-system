# Workflow — Roles, Briefs, Gates, Field Guard

> **Always-on. All agents, all people.** Human-controlled file (see `agent-boundaries.md`).
> This file defines HOW work moves. WHAT to build lives in briefs. HOW to write code lives in `core.md` / `backend.md` / `frontend.md`.
> Rev 4 — 2026-09-23 — applied Codex cross-check + re-audit (`docs/audits/WORKFLOW-codex.md`).

---

## 1. People, Roles, Session Types

### People
| Who | Role | Coding split | Primary tools |
|---|---|---|---|
| **Field** (KJ — ณัฐวัฒน์) | Decision owner · backend lead · sole reviewer & merger | Field 20–30% · agents 70–80% (reviewer mode) | Cursor (primary), Claude Code (fallback when Cursor hits limit) |
| **เมธี** (Methee) | Frontend (PWA) + mobile developer | เมธี 70–80% · agents ≤ 20% (learning mode, §8) | His choice |

### Agents
| Agent | Role | May write | Must NOT write |
|---|---|---|---|
| **Cowork** (Claude) | Auditor + decision partner for Field | New briefs with `Status: Draft`, DR recommendations, audit reports, `docs/state/kj.md` (planning sessions) | App code, tests, DR decisions, brief status beyond Draft |
| **Cursor, Claude Code, Antigravity, Codex** | Executor | App code + tests **inside the active brief's scope**, protected files **listed in the brief's unlock list** (§5), the brief's handoff, the state file of the person running the session, new DRs (`Pending`) | Briefs, DR decision sections, rules, the other person's state, audits |
| **Codex — cross-check mode** (only when Field asks) | Independent second auditor | Audit reports marked `Auditor: Codex` | Same limits as Cowork |

### Session types — decide which one you are in before doing anything
| Type | Who | Needs a Ready brief? | Writes | State update at end? |
|---|---|---|---|---|
| **Implementation** | Executors | Yes | Code, tests, handoff, DRs, own-person state | Yes — mandatory |
| **Audit** | Cowork, Codex (cross-check) | No | The audit file only | No |
| **Planning** | Cowork with Field | No | Draft briefs, DR recommendations, `docs/state/kj.md` | Yes — `kj.md` |

### Decision authority
**Field is the only decision authority.** People and agents propose; Field decides. Silence is not approval.
Why no one approves their own work: whoever checks must not also decide. Executors mark `Implemented`, the auditor recommends, Field sets `Done`.

---

## 2. Document System

```
docs/
├── briefs/<ID>-<slug>.md      ← the contract: what to build + how we know it's done
├── state/kj.md, methee.md     ← INDEX of where each person is right now
├── handoffs/<ID>.md           ← what was built — updated through review, frozen at merge
├── decisions/DR-###-<slug>.md ← every Field-level decision (also our ADR log)
└── audits/<ID>.md             ← auditor's check of a brief's work, bound to a commit
```

| Doc | Written by | Lifespan | Template |
|---|---|---|---|
| Brief | Field (Cowork may create Drafts) | Stable; revised only by Field | `docs/briefs/_TEMPLATE.md` |
| State | Owner (via their session) | Overwritten every session, ≤ 40 lines | `docs/state/_TEMPLATE.md` |
| Handoff | Implementer | Created at `Implemented`, updated if review sends it back, frozen at merge | `docs/handoffs/_TEMPLATE.md` |
| Decision (DR) | Anyone raises · only Field decides | Permanent | `docs/decisions/_TEMPLATE.md` |
| Audit | Cowork / Codex | Permanent; a re-audit appends a section | `docs/audits/_TEMPLATE.md` |

**Authority order when documents disagree about a product/technical decision:** Approved DR > brief > rules > state file. The state file is an index only — never treat it as a decision.
This order resolves *what to build*. It **never** changes role permissions, document ownership, protected-file bans, or who approves — those come only from §1 and `agent-boundaries.md`.

**Brief IDs:** `BE` backend · `FE` frontend PWA · `MB` mobile · `SH` shared (contracts, tooling, CI). Numbers are never reused.
`docs/briefs/ui/` holds UI **design** references — inputs to FE/MB briefs, not executable briefs.

**No other state files.** No `SESSION_STATE.md`, no per-agent notes.

---

## 3. Brief Lifecycle

```
Draft → Ready → In Progress → Implemented → Audited → Done
                     ↑                          │
                     └──────── Changes requested┘
```

| Stage | Set by | Where recorded |
|---|---|---|
| Draft · Ready | Field | Brief `Status:` |
| In Progress | Implementer | Own state file |
| **Implemented** (เสร็จแล้ว) | Implementer (agent or person) — all ACs met + G1 passes | State file + handoff `Status:` — write `Implemented` (เสร็จแล้ว is the same status) |
| **Audited** | Cowork — audit written with a PASS / PASS WITH NOTES / FAIL recommendation | Audit file (implementer links it in the PR) |
| Changes requested | Field (after reading the audit / PR review) | PR review + state file |
| **Done** | **Field only** — after merge | Brief `Status:` |

Rules:
- **Nobody starts a Draft.** Only `Ready` briefs are executed.
- **One implementer per brief. One brief = one branch = one PR.**
- **Size ≤ 3 working days.** Bigger → Field splits it.
- **Every brief is audited by Cowork before Done.** Codex cross-check, when Field requests it, **supplements** the Cowork audit — it never replaces it. Audit depth scales with risk: full for BE, core flow (order → pay → close), auth / payment / PDPA; compact (AC table + findings only) for low-risk UI and chores.
- A brief changed after `Ready` gets `Revision +1` and a changelog line. The implementer re-reads it before continuing.

---

## 4. Session Protocol

### Start (Implementation sessions)
1. Read `CLAUDE.md` (or `AGENTS.md`) → this file.
2. Identify **who** is running the session (Field or เมธี). If unclear — ask. Do not guess.
3. Read `docs/state/<person>.md`, then the active brief and every DR it links (brief + DRs are authoritative, not the state file).
4. **Checkout check (read-only):** `git status` + current branch + last commit.
   - Branch ≠ state file's branch, or uncommitted changes that don't belong to the active brief → **stop and report**. Do not stash, reset, or commit someone else's work.
5. If the state file lists **Awaiting Field** for the path you are about to work on — do not work on that path.

### End (Implementation sessions — mandatory, even if cut short)
1. **Overwrite** `docs/state/<person>.md` from the template: branch, last commit, uncommitted files, next step.
2. All ACs met + G1 passes → write the handoff, set `Implemented`, open the PR.

### One executor session per person at a time
Field switches tools mid-brief (Cursor → Claude Code when Cursor hits its limit). That is the main resume case: the state file + checkout check must be enough for the next tool to continue. Never run two executor sessions on the same person's state file at once.

---

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
- **Only these categories are unlockable:** root config (`turbo.json`, `pnpm-workspace.yaml`, root `package.json`, `.gitignore`), infrastructure (`docker-compose.yml`, `cloudformation/**`, `.github/workflows/**`), and `docs/schema.sql`.
- **Never unlockable:** rules & instructions (`docs/rules/**`, `CLAUDE.md`, `AGENTS.md`, agent wrappers), `.github/CODEOWNERS`, `.github/pull_request_template.md`, and all ownership-restricted docs (briefs, DR decisions, other person's state, audits, `docs/handoff.md`).
- Field's PR review (+ Cowork audit) is the backstop.

### Procedure
1. **Stop that path only.** Continue ACs that are not blocked.
2. Create `docs/decisions/DR-###-<slug>.md` from the template — **context, options, and a recommendation are required.**
3. Add it under **Awaiting Field** in your state file.
4. Say it at the top of your reply: `FIELD REVIEW NEEDED: DR-### — <one line>`.
5. Field writes the Decision section → `Approved` / `Rejected`. The implementer resumes.

### Never
- Implement first, ask later.
- Pick a workaround silently (e.g. hand-rolling what a library would do to avoid a dependency DR).
- Put proposals as comments inside protected files — proposals go in a DR.
- Mark your own DR approved, or treat "no answer yet" as approval.

---

## 6. Quality Gates

| Gate | What must pass | Enforced by | Status |
|---|---|---|---|
| **G1 — Local** | The exact gate commands listed in the Ready brief — default `lint` + `typecheck` + `test` per touched package; the brief may justify package-specific gates | Implementer, before `Implemented` | Partial — scripts missing (see below) |
| **G2 — CI** | G1 + `test:e2e` (backend: supertest vs real Postgres · frontend: Playwright on order → pay → close only) | GitHub Actions, required check on `main` | **Planned** — `SH-001` |
| **G3 — Review** | Checklist below | Field (Cowork audit supports) | Active |

**Evidence rules**
- Record exact commands, package, **commit SHA**, exit status, test counts, and skips.
- **A missing script is `BLOCKED`, never green and never silent N/A.** Report it in the handoff.
- Documentation / design ACs may use manual evidence (screenshot, file link) — no artificial unit tests.

**Current script gaps (verified 2026-09-23):** backend has no `typecheck`; frontend has only `lint` (no `typecheck`, `test`, `test:e2e`); contracts has only `typecheck` (no `lint`, `test`); backend e2e only checks `GET /`. `SH-001` / `FE-000` close these — `SH-001` includes contracts. Until G2 exists, G1 output in the handoff is the evidence.

**G3 checklist**
- [ ] Every AC met and mapped to a test or manual evidence
- [ ] Handoff written · state file updated
- [ ] No unapproved deviations — every DR in the PR is `Approved`
- [ ] Cowork audit written for the reviewed commit (+ Codex cross-check if Field requested one)
- [ ] เมธี's PRs: 5-minute walkthrough passed (§8)

Why CI and not "the agent says tests pass": agents report green when a test is skipped or mocked away. A required check can't be talked around.

---

## 7. Git Traceability

| Item | Format | Example |
|---|---|---|
| Branch | `<type>/<ID>-<slug>` | `feat/BE-001-permissions-guard` |
| Commit | `<type>(<ID>): <msg>` | `feat(BE-001): cache resolved permissions in Redis` |
| PR title | `<ID>: <title>` | `BE-001: PermissionsGuard + Redis cache` |
| Non-brief chore | `<type>(<module>): <msg>` | `chore(repo): …` (still needs a DR if it touches deps) |

- **Branch protection on `main`:** **pending — Field sets manually and records it in `kj.md` when verified.** Settings:
  - Require a pull request · require status checks (once G2 exists) · no direct push · no force push.
  - Require **1 approval** · CODEOWNERS = Field · **allow administrators (Field) to bypass**. *(Confirmed by Field 2026-09-23.)*
- **Why the bypass:** GitHub never lets a PR author approve their own PR. Most of Field's PRs are opened from Field's account (agents run as Field), so a hard "Field must approve" rule would deadlock them.
  - **เมธี's PRs:** blocked until Field approves on GitHub.
  - **Field's PRs:** Field merges via admin bypass **only after** a Cowork audit exists for the merged commit and G1/G2 pass. The Cowork audit is the independent review; the GitHub bypass is the recorded exception.
  - **เมธี may review Field's PRs** (comment, non-blocking) — good learning, not a gate.
  - **Never** create a second GitHub account to self-approve.
- The PR template links brief → DRs → handoff → audit.

---

## 8. Learning Mode — เมธี

Goal: เมธี builds real skill. Agents support, they don't author.

- **Agents ≤ 20%** — for explaining, debugging, reviewing. Not for generating whole components, pages, or features.
- **เมธี writes the tests himself.** Tests are where the learning is.
- **AI usage** in every handoff: `Low / Medium / High` + one line on what for. No fake-precise percentages.
- **G3 walkthrough:** เมธี explains one non-trivial part of the PR. Can't explain it → PR goes back. This is the real evidence of learning.

**Agents running in เมธี's session:** if asked to generate a whole file, feature, or test file, remind him of this rule once, then offer an explanation, a skeleton, or a review instead.

---

## 9. Why This Process Exists

No formal grading rubric — the process is shown to the advisor as-is and serves Field's own learning. The artifacts ARE the evidence: briefs (planning), DRs (design reasoning / ADR log), audits (review), handoffs + CI (delivery). No separate evidence matrix — don't create extra docs to "prove" the process.

---

## 10. Legacy

`docs/handoff.md` is **frozen** as the project log (decisions up to 2026-09-23). Do not add to it.
Locked decisions there are backfilled into DRs **only when a brief needs them** — not all at once.

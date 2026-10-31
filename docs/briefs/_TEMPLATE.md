# BRIEF-### — <Title>

| | |
|---|---|
| **Owner** | Field |
| **Implementer** | kj / methee |
| **Assigned auditor** | Cowork (default) / Codex (Field-assigned fallback) — Field instruction/date; fallback reason or none |
| **Affected apps** | backend / frontend / mobile / contracts / tooling (select all in scope) |
| **Feature** | [`<feature>` requirements](../features/<feature>/requirements.md) · [design](../features/<feature>/design.md) · [ui](../features/<feature>/ui.md) *(if it has screens)* *(or `standalone — single-slice brief`)* |
| **References** | FRD §<n> · schema tables: <…> · UI brief: <…> · DRs: <…> |
| **Status** | Draft · Ready — approval status; merged PR is authoritative for Done |
| **Revision** | 1 |
| **Depends on** | <`BRIEF-###` (<endpoints/contract>) — merged / not merged · or `none`> · **Unblocks** <`BRIEF-###` or `none`> |
| **Size** | ACs <n> (≤8) · flows <n> (≤1) · files <n> (≤10) · migrations <n> (≤1) · new patterns <n> (≤1) → OK / SPLIT / owner-accepted oversize |
| **Audit depth** | Full (backend / core flow / auth-payment-PDPA) · Compact (low-risk UI, chores) |

## 1. Goal

<1–2 lines in plain language: who gets what outcome, and which requirements (`R1..Rn`) this slice delivers.>

## 2. Scope

**In:** <AC IDs from `requirements.md`, and exact sections/files from `design.md` (or concrete files/modules for a standalone brief).>

**Out:** <Explicitly excluded items and which brief/owner handles them.>

## 3. Standalone Design & Contract *(omit when linked to `docs/features/<feature>/`)*

> Only fill this section for a standalone 1-slice brief that has no feature folder. Otherwise write `See linked feature design.md.`

- **Decisions (`Decision | Why | Instead of`):** <…>
- **Flow & Transaction boundary:** <Mermaid `sequenceDiagram` (autonumber + box); what runs inside vs. outside DB tx>
- **Contracts (``app/packages/contracts``):** <endpoints, DTOs, error codes>
- **Code map (`File | Owns`):** <paths + responsibilities>

## 4. Acceptance Criteria *(standalone briefs only — feature briefs reference `requirements.md` AC IDs)*

| AC | When | Then |
|---|---|---|
| 1 | <trigger> | <observable result> |

## 5. Tests (Planner = e2e · Executor = unit)

| ACs | Kind | Who writes | File |
|---|---|---|---|
| <1..n> | e2e / acceptance | **Cowork** (in seed commit, protected) | `app/backend/test/<m>.e2e-spec.ts` · `app/frontend/e2e/<screen>.spec.ts` |
| <steps> | unit (`*.spec.ts`) | **Executor** (per build step) | `<src-path>/**/*.spec.ts` |

- Seeded `.e2e-spec.ts` files hit only public contracts and port tokens (`design.md → Contracts & Code map`). Executor may **not** edit them without Field's OK or a DR.
- Gate commands (all must pass):
  ```bash
  pnpm --filter <pkg> lint
  pnpm --filter <pkg> typecheck
  pnpm --filter <pkg> test
  pnpm --filter <pkg> test:e2e   # seeded e2e
  pnpm --filter @bar/backend openapi:check   # backend API changes
  ```
- Run proof (backend/frontend/mobile changes; docs/tooling-only → `n/a`):
  ```bash
  docker compose -f infra/docker-compose.yml up -d postgres redis
  pnpm --filter @bar/backend migration:run
  pnpm --filter @bar/backend start:dev   # separate shell, started fresh on the work SHA
  curl -fsS localhost:3011/api/health
  ```
  UI change: <screen + action to exercise in the browser / Expo app, or `n/a`>
- A required script that doesn't exist yet = **BLOCKED** — report it, never skip silently.
- **Local Sonar scan:** required for this brief: yes (always for Metee) / optional — <reason> · approved exclusions / "won't fix": <none, or Field-approved reference>
- **Constraints:** <rules that matter most — e.g. `save()` not `update()`, `.js` import extensions, `PermissionsGuard` only, Thai hardcoded strings>

## 6. Planner Dry Run (completed before Ready)

Every row must cite a real `path:line` or manifest check from the repo before Field is asked to approve `Ready`. Repo-verifiable facts never go into `Assumed` for Step 0.

| Check | Verified against repo (`path:line`) | Result |
|---|---|---|
| Existing schema / entities | `<path:line>` | <columns/tables verified or migration added to Build steps> |
| Wiring & protected files | `<path:line>` | <every touched protected file listed in Section 7> |
| Packages & peer versions | `<manifest>` | <exact `pkg@version` compatible with installed framework> |
| Gate scripts exist | `<manifest:line>` | <all Section 5 scripts exist, or `BLOCKED until BRIEF-###`> |
| E2e harness, imports & isolation | `<test config / sample test:line>` | <seeded `.e2e-spec.ts` imports match project test helper · own test DB, Redis DB/prefix, random port — or isolation added as Build step 1> |
| Dependencies merged · parallel overlap | `git log main` · other active brief's code map | <all `Depends on` briefs merged to `main`, or stays Draft · if another brief runs in parallel: zero shared files, else wait> |
| UI tokens & components *(UI briefs; else `n/a`)* | `<globals.css / theme:line · components dir>` | <every token and component in `ui.md` exists in the repo, or the gap is a build step / DR> |

## 7. Unlocked Protected Files & Pre-Decided Items

- **Unlocked protected files** (exact paths from Dry Run, never rules files; or `none`):
  - `none`
- **Likely DRs:** <known unknowns — raise a DR if hit>
- **Pre-decided packages / endpoints** (exact `package@version`, path, endpoint, each with `Source: Field, <interview/DR>, <date>` — an item without a Source naming Field is not approved; anything else needs a DR):
  - `none`

## 8. Build Steps (inside → out · 1 step = 1 commit)

Order: config → ports/adapters → domain/application → controller/UI → run proof. Stop rule: if a step stays red after **2 fix attempts**, stop and report.

| # | Step | Done when | AC |
|---|---|---|---|
| 0 | Verify external *Assumed* rows + confirm seeded `.e2e-spec.ts` compiles & fails red on assertion (not import error) | ticked + red assertion output, or stop + DR | — |
| 1 | <inside-out step 1> | <unit / build check green> | — |
| 2 | <step 2> | <unit / e2e check green> | <AC IDs> |
| N | Run proof + sync `design.md` (if code map/status changed) | real runtime exercised + all gates green | all |

## 9. Tasks (this brief only)

Standard lifecycle (seed, push, audit, ship, merge) is in `docs/rules/workflow.md` Section 3. List only brief-specific (`★`) operational tasks here.

| # | Task | Who |
|---|---|---|
| B1 | <portal config / `.env` secret / `.env.example` keys / exact `pkg@version` install / migration run> | **Field** / executor / Cowork |

---

## Ready Checklist
- [ ] Zero unresolved *Open questions* blocking this brief
- [ ] Every *Depends on* brief is **merged to `main`** (not merely done on a branch)
- [ ] Size within limits (2+ exceeded → split, or `owner-accepted oversize` recorded by Field)
- [ ] Section 6 *Planner Dry Run* (7 rows) completed with real `path:line` evidence; all touched protected files unlocked in Section 7
- [ ] Acceptance `.e2e-spec.ts` written by Cowork against the contract (ready for the seed commit)
- [ ] Plain-language headlines (any error code/acronym explained inline on first use)
- [ ] Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | YYYY-MM-DD | Initial draft |

# BRIEF-### — <Title>

| | |
|---|---|
| **Owner** | Field |
| **Implementer** | kj / methee (<Tool>) · **Auditor** Cowork (<Tool>) (fallback: Codex) |
| **Feature** | [`<feature>` requirements](../features/<feature>/requirements.md) · [design](../features/<feature>/design.md) · [ui](../features/<feature>/ui.md) *(if it has screens)* *(or `standalone — single-slice brief`)* |
| **Backlog / Defect** | <ClickUp link, `DEFECT-###`, or none> |
| **Status** | Draft · Ready — approval status; merged PR is authoritative for Done |
| **Revision** | 1 |
| **Depends on** | <`BRIEF-###` (<endpoints/contract>) — merged / not merged · or `none`> · **Unblocks** <`BRIEF-###` or `none`> |
| **Docs to update** | <`docs/api/README.md` (living doc sync for standalone briefs) or `n/a`> |
| **Size** | ACs <n> (≤8) · flows <n> (≤1) · files <n> (≤10) · migrations <n> (≤1) · new patterns <n> (≤1) → OK / SPLIT / owner-accepted oversize |
| **Audit depth** | Full (backend / core flow / auth-payment-personal data) · Compact (low-risk UI, chores) |

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
| <1..n> | e2e / acceptance | **Cowork** (in seed commit, protected) | `<test-path>.e2e-spec.ts` |
| <steps> | unit (`*.spec.ts`) | **Executor** (per build step) | `<src-path>/**/*.spec.ts` |

- Seeded `.e2e-spec.ts` files hit only public contracts and port tokens (`design.md → Contracts & Code map`). Executor may **not** edit them without Field's OK or a DR.
- Gate commands (all must pass):
  ```bash
  <lint command>
  <typecheck / build command>
  <unit + e2e test commands>
  ```
- Run proof (part of G1 once the project has a runtime; before that, `not available yet`):
  ```bash
  <start/rebuild command, e.g. docker compose up -d --build · native Android: ./gradlew installDebug>
  <health / screen check, e.g. curl -fsS localhost:<port>/health · native Android: adb shell am start -n <pkg>/<activity>>
  ```
  UI change: <screen + action to exercise in a browser / emulator / device, or `n/a`>

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
| Contract Nullability vs DB Schema (#58) | `schema.sql:line` vs contract/DTO | <nullable column maps to `.nullable()` in contract; zero `?? ''` fallbacks> |

## 7. Unlocked Protected Files & Pre-Decided Items

- **Unlocked protected files** (exact paths from Dry Run, never rules files; or `none`):
  - `none`
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

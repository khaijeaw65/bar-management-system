# BRIEF-006 — Local SonarQube scan: Compose service, `pnpm sonar`, handoff report

| | |
|---|---|
| **Status** | Ready |
| **Implementer** | kj |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | Default, no fallback |
| **PR** | <executor fills> |
| **Affected apps** | tooling · infra |
| **Revision** | 1 |
| **Depends on** | none (BRIEF-004 Compose file exists) |
| **References** | `docs/rules/workflow.md` §6 "Local SonarQube scan" · `docs/quality/README.md` |
| **Audit depth** | Compact — local tooling, no app behavior |

---

## 1. Goal
Any developer can start SonarQube locally, scan the whole monorepo with one command, see the Quality Gate result in the terminal, and paste a short report into the handoff. Required habit for Methee's briefs; optional for Field.

## 2. Scope
### In
- `infra/docker-compose.yml` — add, under Compose **profile `sonar`** (not started by a plain `up`):
  - `sonarqube` — official image, **Community Build, exact version tag pinned** (record it in the handoff), port `9000`, named volumes for `data`, `extensions`, `logs`, JDBC pointing at `sonarqube-db`.
  - `sonarqube-db` — `postgres:16-alpine`, own named volume, user/db `sonar` (separate from the app DB).
- `sonar-project.properties` (repo root):
  - `sonar.projectKey=bar-management`, `sonar.projectName=Bar Management`
  - sources: `app/backend/src`, `app/frontend/src`, `app/packages/contracts/src`
  - tests: `**/*.spec.ts`, `**/*.test.ts`, `**/*.test.tsx`, `app/backend/test`, `app/frontend/e2e` (marked as tests, not sources)
  - exclusions: `**/node_modules/**`, `**/dist/**`, `**/.next/**`, `app/frontend/public/mockServiceWorker.js`, `app/backend/src/providers/database/migrations/**`
- Root `package.json` scripts:
  - `sonar` → run the scanner with `-Dsonar.qualitygate.wait=true`, host `SONAR_HOST_URL` (default `http://localhost:9000`), token `SONAR_TOKEN` read from the repo-root `.env`; exits non-zero if the gate fails.
  - `sonar:report` → `node scripts/sonar-report.mjs`.
- `scripts/sonar-report.mjs` (plain Node, `fetch`, no dependencies): calls the local server for project `bar-management` → prints Markdown for the handoff: scanned commit (`git rev-parse --short HEAD`), Quality Gate status + failed conditions, open issue counts by severity, top 10 open issues (rule, file:line, message). Never prints the token.
- `.gitignore` — add `.scannerwork/`.
- `docs/quality/README.md` — only fix commands if the real ones differ from the text (tell Field; it's a Field-owned file — propose the diff in the handoff instead of editing if more than command strings change).

### Out
- Any CI job, GitHub Action, SonarQube Cloud, EC2 — not now.
- Coverage import / thresholds (later brief).
- Custom quality profile or gate — default "Sonar way".
- Fixing issues the first scan finds in existing code — list them in the handoff; fixes are separate work.

## 3. Contract
- Commands: `docker compose -f infra/docker-compose.yml --profile sonar up -d` · `pnpm sonar` · `pnpm sonar:report` · `--profile sonar stop`.
- Env: `SONAR_TOKEN` (required for `sonar` / `sonar:report`), `SONAR_HOST_URL` (optional). Root `.env.example` documents both (no real value).

## 4. Acceptance Criteria
- **AC-1** — `docker compose -f infra/docker-compose.yml up -d` (no profile) still starts only `postgres` + `redis`.
- **AC-2** — With `--profile sonar`, SonarQube becomes operational at `http://localhost:9000` and keeps its data across `stop`/`start`.
- **AC-3** — `pnpm sonar` scans the monorepo and ends with the Quality Gate result; a failing gate gives a non-zero exit; a missing `SONAR_TOKEN` fails fast with a clear message.
- **AC-4** — `pnpm sonar:report` prints the Markdown report described in §2 for the last analysis; the token never appears in output.
- **AC-5** — Sources/tests/exclusions match §2 (evidence: SonarQube project "Code" view or scanner log listing).
- **AC-6** — No token, `.scannerwork/` or volume data is committed; `ci` stays green (no app code changed).
- **AC-7** — Handoff contains the first real scan: gate result + `sonar:report` output for the current `main` code (issues listed, not fixed).

## 5. Test Gate
| AC | Evidence |
|---|---|
| AC-1, AC-2 | command output + screenshot of "SonarQube is operational" |
| AC-3 | `pnpm sonar` output (pass case) + missing-token output |
| AC-4, AC-7 | `pnpm sonar:report` output pasted in the handoff |
| AC-5 | screenshot or log excerpt |
| AC-6 | `git status` / `git diff --stat` + green `ci` link |

Gate commands:
```bash
pnpm lint && pnpm typecheck && pnpm test    # unchanged app code must stay green
pnpm sonar
pnpm sonar:report
```

## 6. Constraints
- Local only; nothing runs in CI.
- Pin the SonarQube image to an exact Community Build tag; `postgres:16-alpine` for its DB.
- On Linux hosts SonarQube needs `vm.max_map_count ≥ 524288` — document it in the README diff if you hit it (macOS Docker Desktop doesn't need it).

## 7. Decision Points (Field Guard)
- **Pre-decided (exact only):**
  - devDependency at repo root: `@sonar/scan` `^5.0.1`
  - Docker images: `sonarqube:<exact Community Build tag>` (latest stable at implementation), `postgres:16-alpine`
  - New files: `sonar-project.properties`, `scripts/sonar-report.mjs`
- **Likely DRs:** scanner needs Java or another package · the default gate cannot run without coverage data.

## 8. Unlocked Protected Files
- `infra/docker-compose.yml`
- `package.json` (root)
- `.gitignore`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-09-25 | Initial draft (Cowork) — local SonarQube per Field's decision |
| 1 | 2026-09-25 | Ready — approved by Field in session 2026-09-25 |

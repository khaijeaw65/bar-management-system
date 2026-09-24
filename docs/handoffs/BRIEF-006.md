# Handoff — BRIEF-006 Local SonarQube scan

| | |
|---|---|
| **Implementer** | kj (Cursor) |
| **Date** | 2026-09-25 |
| **Brief revision** | 1 |
| **Branch / PR** | `feat/BRIEF-006-local-sonar` · PR #20 |
| **Commit** | `b95df84` (scan and local gates). Handoff commit follows. |
| **Status** | Implemented — awaiting audit |

> Created at `Implemented`. Update it if review requests changes. Frozen at merge.

## Summary
SonarQube Community Build `26.9.0.129388` runs under Compose profile `sonar`, with its own Postgres 16 database. `pnpm sonar` scans the monorepo and waits for the Quality Gate. `pnpm sonar:report` prints a Markdown summary for this handoff. The first scan's issues are listed and left unfixed.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `docker compose -f infra/docker-compose.yml up -d` then `ps` showed only `postgres` (`postgres:16-alpine`) and `redis` (`redis:7-alpine`). `config --services` without the profile lists `postgres` and `redis`; with `--profile sonar` it also lists `sonarqube-db` and `sonarqube`. |
| AC-2 | ✅ | Profile `sonar` reached `{"status":"UP"}` on `http://localhost:9000`. After `--profile sonar stop` and `up -d` again, the same analysis was still there: `2026-09-24T17:40:35+0000`, revision `22f64ad99e2800f19947c0ac15f70726304318d1`. Startup screen: `docs/handoffs/assets/BRIEF-006/operational.png`. Server log: `SonarQube is operational`. |
| AC-3 | ✅ | `pnpm sonar` on `b95df84` exited 0 with `QUALITY GATE STATUS: PASSED`. Missing `SONAR_TOKEN` (no repo-root `.env`) exits 1: `SONAR_TOKEN is missing. Add SONAR_TOKEN to the repo-root .env (see docs/quality/README.md).` Same message from `pnpm sonar:report`. |
| AC-4 | ✅ | `pnpm sonar:report` output is below. A check compared that output to the token in `.env` and the token was absent. |
| AC-5 | ✅ | Scanner log on `b95df84` lists the exclusions and test inclusions below. API `components/tree` on that project: 55 source files (`FIL`) and 12 test files (`UTS`), including `app/backend/test/data-source.spec.ts` and `app/frontend/e2e/menu.spec.ts`. `mockServiceWorker.js` and `migrations/` are not indexed. |
| AC-6 | ✅ | `.env` and `.scannerwork/` are gitignored. Work commit `b95df84` does not contain a token or volume data. PR #20 runs `ci`. |
| AC-7 | ✅ | Report below is the scan of `b95df84`. App sources match `main` (`338c3ad`) plus this brief's tooling. Issues are listed, not fixed. |

## Gate Evidence (G1)
Commands on `b95df84`. Node v24.14.0, pnpm 10.0.0. The second `pnpm lint && pnpm typecheck && pnpm test` was turbo-cached from the same tree (exit 0).

| Command | Exit | Result |
|---|---|---|
| `pnpm lint && pnpm typecheck && pnpm test` | 0 | lint pass (backend: 4 warnings, 0 errors) · typecheck pass · tests 17 passed (backend 10, frontend 7) · 0 failed · 0 skipped |
| `pnpm sonar` | 0 | `QUALITY GATE STATUS: PASSED` · SCM revision `b95df84a839ff4654bc3d56c63b547e4a569fa21` |
| `pnpm sonar:report` | 0 | Markdown below |

## Sonar (local scan)
Image: `sonarqube:26.9.0.129388-community`. Scanner: `@sonar/scan` 5.0.1, JRE 21 provisioned from the server (no system Java, no extra package).

```text
- Scanned commit: `b95df84`
- Quality Gate: OK
- Failed conditions: none
- Issues by severity: BLOCKER 0 · HIGH 0 · MEDIUM 2 · LOW 7 · INFO 6

### Top 10 open issues
1. `typescript:S6819` `app/frontend/src/components/ThemeToggle.tsx:26` — Use <details>, <fieldset>, <optgroup>, or <address> instead of the "group" role to ensure accessibility across all devices.
2. `typescript:S4624` `app/frontend/src/lib/api/client.ts:19` — Refactor this code to not use nested template literals.
3. `typescript:S6759` `app/frontend/src/app/pos/menu/_components/MenuItemRow.tsx:5` — Mark the props of the component as read-only.
4. `typescript:S6759` `app/frontend/src/app/pos/menu/_components/MenuListError.tsx:1` — Mark the props of the component as read-only.
5. `typescript:S6759` `app/frontend/src/app/providers.tsx:26` — Mark the props of the component as read-only.
6. `typescript:S1128` `app/backend/src/modules/auth/infrastructure/http/auth.controller.ts:1` — Remove this unused import of 'Res'.
7. `typescript:S1128` `app/backend/src/modules/auth/infrastructure/http/auth.controller.ts:1` — Remove this unused import of 'Req'.
8. `typescript:S1128` `app/backend/src/modules/auth/infrastructure/http/auth.controller.ts:1` — Remove this unused import of 'Post'.
9. `typescript:S1128` `app/backend/src/modules/auth/infrastructure/http/auth.controller.ts:1` — Remove this unused import of 'Body'.
10. `typescript:S1135` `app/backend/src/common/guards/permissions.guard.ts:31` — Complete the task associated to this "TODO" comment.
```

- Remaining issues + reason: 15 open issues (the counts above). They are existing app findings. This brief says not to fix them.
- Who fixed: nobody. Cursor ran the scan and the report.

Scanner log excerpt (AC-5):

```text
Excluded sources: **/node_modules/**, **/dist/**, **/.next/**, app/frontend/public/mockServiceWorker.js, app/backend/src/providers/database/migrations/**, **/*.spec.ts, **/*.test.ts, **/*.test.tsx
Included tests: **/*.spec.ts, **/*.test.ts, **/*.test.tsx
68 files indexed
```

## Decisions Raised
- None. `@sonar/scan` 5.0.1 provisioned its own JRE. The default "Sonar way" gate passed on the first scan without coverage import.

## Deviations from Brief
- None.

## Known Gaps / Follow-ups
- `docs/quality/README.md` was not edited (Field-owned). Two notes for Field:
  1. Community Build 26.9 shows **SonarQube is up** and **All systems operational.** The process log still prints `SonarQube is operational`. README step 1 still quotes the log phrase as the page text.
  2. `docker compose -f infra/docker-compose.yml --profile sonar stop` stops every service in that file, including `postgres` and `redis`. Stopping only SonarQube is `docker compose -f infra/docker-compose.yml stop sonarqube sonarqube-db`.
- macOS Docker Desktop did not need `vm.max_map_count`.
- Proposed README sentence for step 1: wait until http://localhost:9000 shows "SonarQube is up" and "All systems operational."
- Proposed stop command: `docker compose -f infra/docker-compose.yml stop sonarqube sonarqube-db`

## AI Usage
**High** — Cursor: Compose service, scanner scripts, scan, and this handoff.

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-006`
- PR: https://github.com/khaijeaw65/bar-management-system/pull/20 · Work SHA: `b95df84` · sources/tests/exclusions checked against the scanner log and the component tree

## Notes for Reviewer
- Startup screen: `docs/handoffs/assets/BRIEF-006/operational.png`
- Token lives only in the gitignored repo-root `.env`.
- App code was not changed. The 15 issues are intentionally still open.

# Quality — Local SonarQube scan

> Decided by Field 2026-09-25; since workflow Rev 24 (2026-11-15) the scan is **opt-in per brief** — it runs only when a brief lists it in its gates. Rule summary: `docs/rules/workflow.md` §6 "Quality scan". Field-owned — change only with Field's approval.

## Status
Live (BRIEF-006 merged). SonarQube Community Build runs locally in Docker; a brief that lists the scan gets it run before handoff, the result goes into the handoff and Field reviews it in the PR. No CI gate. Briefs Ready before Rev 24 that say "Sonar required" keep it.

## One-time setup
1. `docker compose -f infra/docker-compose.yml --profile sonar up -d` — wait until http://localhost:9000 shows **"SonarQube is up"** / **"All systems operational"** (first start takes a few minutes, needs ~3 GB RAM).
2. Log in (`admin` / `admin`), set a new password.
3. My Account → Security → generate a token → put `SONAR_TOKEN=<token>` in the repo-root `.env` (gitignored — never commit it).

## When a brief lists the scan (before handoff)
1. Start SonarQube (step 1 above) if it isn't running.
2. `pnpm sonar` — scans the repo and waits for the Quality Gate.
3. Open http://localhost:9000 → project **bar-management** → fix findings in your own code. Re-run `pnpm sonar`.
4. Stop when the gate passes, or when every remaining issue has a written reason.
5. `pnpm sonar:report` → paste the output into the handoff's **Sonar** section.
6. Stop only SonarQube when done: `docker compose -f infra/docker-compose.yml stop sonarqube sonarqube-db` — **not** `--profile sonar stop`, which also stops the app's Postgres and Redis.

## Who fixes
- Agents may run the scan and explain issues.
- The brief's executor fixes the issues (agents write all app code — DR-030).
- "Won't fix" / "false positive" / exclusions / gate changes → Field's approval first.

## Never
- Commit `SONAR_TOKEN`, `.scannerwork/` or SonarQube volumes.
- Claim a scan passed without running it — "not run" is written as "not run".

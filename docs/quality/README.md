# Quality — Local SonarQube scan

> Decided by Field 2026-09-25. Rule summary: `docs/rules/workflow.md` §6 "Local SonarQube scan". Field-owned — change only with Field's approval.

## Status
**Not live until BRIEF-006 merges.** Then: SonarQube Community Build runs locally in Docker; developers scan before committing; the result goes into the handoff; Field reviews it in the PR. No CI gate. Shared hosting (EC2 / cloud plan) is revisited in November.

## One-time setup (after BRIEF-006)
1. `docker compose -f infra/docker-compose.yml --profile sonar up -d` — wait until http://localhost:9000 shows **"SonarQube is up"** / **"All systems operational"** (first start takes a few minutes, needs ~3 GB RAM).
2. Log in (`admin` / `admin`), set a new password.
3. My Account → Security → generate a token → put `SONAR_TOKEN=<token>` in the repo-root `.env` (gitignored — never commit it).

## Before each commit that changes code
1. Start SonarQube (step 1 above) if it isn't running.
2. `pnpm sonar` — scans the repo and waits for the Quality Gate.
3. Open http://localhost:9000 → project **bar-management** → fix findings in your own code. Re-run `pnpm sonar`.
4. Stop when the gate passes, or when every remaining issue has a written reason.
5. `pnpm sonar:report` → paste the output into the handoff's **Sonar** section.
6. Stop only SonarQube when done: `docker compose -f infra/docker-compose.yml stop sonarqube sonarqube-db` — **not** `--profile sonar stop`, which also stops the app's Postgres and Redis.

## Who fixes
- Agents may run the scan and explain issues.
- **Methee fixes his own issues.** Agents write code only when he is blocked (counts toward his ≤ 20%, workflow §8).
- "Won't fix" / "false positive" / exclusions / gate changes → Field's approval first.

## Never
- Commit `SONAR_TOKEN`, `.scannerwork/` or SonarQube volumes.
- Claim a scan passed without running it — "not run" is written as "not run".

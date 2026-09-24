# Quality — Coverage and SonarQube Cloud

> Decided by Field 2026-09-25: **SonarQube Cloud, free plan, public repo**, analysed in GitHub Actions. Rules summary lives in `docs/rules/workflow.md` §6; this file holds the setup and day-to-day procedure. Field-owned (rules-level) — change only with Field's approval.

## Status
**Not live.** Set up by the tooling brief (coverage + Sonar job). Until then every brief marks the Sonar gate *deferred*.

## Target setup (the tooling brief implements and verifies each line)
- **Plan:** SonarQube Cloud Free — public and private repos, PR analysis and Quality Gate included; private code capped at 50k LOC (not relevant while the repo is public). Re-check the plan page before setup; plans change.
- **Project:** one SonarQube Cloud project for the monorepo (sources `app/backend/src`, `app/frontend/src`, `app/packages/contracts/src`; tests excluded from sources, included as tests). Split per app only if analysis needs it.
- **Automatic Analysis: OFF** — CI-based analysis and Automatic Analysis cannot run together.
- **Workflow:** a `sonar` job in GitHub Actions using `SonarSource/sonarqube-scan-action` (v7+, pinned), `fetch-depth: 0`, secret `SONAR_TOKEN` (free plan = personal access token), `sonar.qualitygate.wait=true` so a failed gate fails the job.
- **Coverage:** Vitest `--coverage` with `lcov` reporter in backend, frontend and contracts (needs `@vitest/coverage-v8` in the packages that lack it — pre-decided in the brief); report paths passed via `sonar.javascript.lcov.reportPaths`.
- **Gate:** start from "Sonar way" (new-code conditions). Thresholds that differ (e.g. coverage on new code) are set in the tooling brief and approved by Field — never guessed.
- **Branch protection:** after the first green run, add the Sonar check as a required status check on `main` next to `ci`.

## Per-brief procedure (once live)
1. Brief says **required** or **deferred**.
2. Push the PR → CI runs tests with coverage → Sonar job analyses the PR head and waits for the Quality Gate.
3. Fix in-scope issues on the branch; the analysis re-runs on the new head.
4. Handoff links the SonarQube Cloud PR analysis and states the gate result. Nothing is exported or committed.
5. Exclusions, "won't fix", "false positive" or threshold changes need Field's approval, recorded in the brief/DR.

## Never
- Commit `SONAR_TOKEN` or any token; the secret lives in GitHub Actions only.
- Treat a missing/unavailable analysis as passed.

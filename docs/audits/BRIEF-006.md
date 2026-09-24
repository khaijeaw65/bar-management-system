# Audit — BRIEF-006 Local SonarQube scan

| | |
|---|---|
| **Auditor** | Cowork (planning session, 2026-09-25) |
| **Assignment** | Brief default — Cowork, no fallback |
| **Date** | 2026-09-25 |
| **PR / commit** | #20 · audited work S = `b95df84` · handoff/PR-link/state commits up to `19f17da` |
| **Depth** | Compact |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** ← Field makes the final call |

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `docker compose up -d` without profile → only `postgres`, `redis` | `profiles: ['sonar']` on both new services |
| AC-2 | ✅ | `{"status":"UP"}`, analysis survived stop/start, `operational.png` | Named volumes for data/extensions/logs/db |
| AC-3 | ✅ | `pnpm sonar` → `QUALITY GATE STATUS: PASSED`, exit 0; missing token → exit 1 with a clear message | `sonar.qualitygate.wait=true` |
| AC-4 | ✅ | Report in handoff; token-absence check done | Errors are redacted by splitting on the token |
| AC-5 | ✅ | Scanner log + component tree: 55 source / 12 test files; MSW worker and migrations not indexed | Matches §2 |
| AC-6 | ✅ | `.env` and `.scannerwork/` ignored; no token/volume data in the diff; `ci` green (run 36037116559) | |
| AC-7 | ✅ | First real scan of `b95df84`: gate OK, MEDIUM 2 · LOW 7 · INFO 6, top 10 listed, none fixed | As briefed |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Pre-decided deps | ✅ | Only `@sonar/scan ^5.0.1` at root; image pinned `sonarqube:26.9.0.129388-community`; `postgres:16-alpine` |
| Unlocked protected files | ✅ | `infra/docker-compose.yml`, root `package.json`, `.gitignore` only |
| No app code changed | ✅ | Diff touches tooling/docs only |
| Field-owned README untouched | ✅ | Corrections proposed in the handoff instead |
| S..H evidence-only | ✅ | `b95df84..19f17da` = handoff, brief PR field, state, screenshot |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| S1 | Suggestion | Med | **Current:** `docs/quality/README.md` step 6 `docker compose … --profile sonar stop` stops **every** service in the file, including the app's `postgres` and `redis`; step 1 quotes a log line instead of the page text. → **Updated:** stop with `docker compose -f infra/docker-compose.yml stop sonarqube sonarqube-db`; step 1 "wait until http://localhost:9000 shows *SonarQube is up / All systems operational*". Field-owned file — needs Field's OK. |
| S2 | Suggestion | Low | **Current:** `scripts/sonar.mjs` (env loading + token check + redaction) is a new file not listed in §7 Pre-decided (only `sonar-project.properties` and `scripts/sonar-report.mjs` were). No new dependency, needed for AC-3, but the handoff says "Deviations: none". → **Updated:** accept; list it as a minor deviation next time. |
| S3 | Suggestion | Low | **Current:** both scripts' `.env` loader overwrites variables already set in the shell. → **Updated:** only set a key when `process.env[key]` is undefined (shell wins), so `SONAR_HOST_URL=… pnpm sonar` works as expected. Next time the scripts are touched. |
| S4 | Suggestion | Low | **Current:** the 15 existing issues (e.g. 4 unused imports in `auth.controller.ts`, `S6759` read-only props, `S6819` role="group") are open by design. → **Updated:** the auth brief fixes the `auth.controller.ts` ones; the frontend ones go to Methee's first scan as a warm-up. |

## Recommendation to Field
**PASS.** All 7 ACs met with real evidence; deps and unlocks exact; the tool works end-to-end on the first try with the default gate. S1 is worth doing now (a wrong stop command would take down the dev DB) — say "approve S1" and Cowork updates the README on this branch. Field's own PR: mergeable under §7 once `ci` is green on the final head.

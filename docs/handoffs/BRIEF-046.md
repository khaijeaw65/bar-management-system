# Handoff — BRIEF-046 Dev ports: web 3010 · API 3011

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-29 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-046-dev-ports` (PR opens after audit PASS) |
| **Commit** | Work SHA `5d1ee70` (seed `3c85699`) |
| **Status** | Implemented — awaiting audit |

> Created at `Implemented`. Updated once in the PASS commit. Frozen at merge.

## Summary
Repo defaults moved to web **3010** / API **3011**: backend `PORT` fallback, both `.env.example` files, frontend `dev` / `start` (`-p 3010`), API and socket URL fallbacks, the two tests that pinned the old fallback, and the three READMEs (root README gains a "Ports" line: 3010 · 3011 · Playwright MSW 3100 · reserved 3110 / 3111). 12 files, +27 / −18. No dependency, contract, schema or protected file changed.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `configuration.spec.ts::defaults PORT to 3011 when it is not set` (new — the spec had no default assertion before) |
| AC-2 | ✅ | `login/page.test.tsx` expects `http://localhost:3011/api/auth/line/login` |
| AC-3 | ◐ | Health 200 on :3011, web 200 on :3010, `/api/auth/line/login` → 302 to LINE with `redirect_uri=http://localhost:3011/api/auth/line/callback`, CORS echoes `Origin: http://localhost:3010`. **Full LINE round-trip and POS floor not exercised** — needs Field to add the 3011 callback in the LINE console and log in. |
| AC-4 | ✅ | Playwright MSW e2e on 3100: 22 passed (incl. `menu-editor.spec.ts` with the 3011 base) |
| AC-5 | ✅ | Gates + run proof below |

## Gate Evidence (G1)
Run on work SHA `5d1ee70`.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/backend lint` / `typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 149 passed (39 files) |
| `pnpm --filter @bar/frontend lint` / `typecheck` | 0 | pass |
| `pnpm --filter @bar/frontend test` | 0 | 182 passed (37 files) — first run had one `MenuEditor` 5 s timeout under load (known flake, 038 audit F4); re-run clean |
| `pnpm --filter @bar/frontend test:e2e` | 0 | 22 passed — first attempt blocked by a leftover `next dev` on :3010 (pid 10080, from the BRIEF-025 proof); Field approved stopping it and the :3011 API, then it passed |
| `pnpm --filter @bar/frontend build` | 0 | pass |
| run proof: `migration:run` → `start:dev` → `curl localhost:3011/api/health` | 0 | no migrations pending · health **200** · `next dev` (new `-p 3010`) → `/login` **200** · :3001 → 404 |

UI exercised: web served on :3010 only by HTTP check; LINE login and POS floor not clicked through (see AC-3).

## Sonar (local scan)
- Not run — optional for this brief (config / docs only).

## Decisions Raised
- none

## Deviations from Brief
- None. Brief says "`configuration.spec.ts` if it asserts the default" — it did not, so a default-port test was added to meet AC-1.

## Known Gaps / Follow-ups
- `.claude/launch.json` still launches the frontend on `--port 3000` (not in the brief's file list; protected-adjacent tooling) — Cowork/Field to decide.
- Backend e2e / `set-auth-env.ts` / `ci.yml` keep 3000 / 3001 literals by design (self-contained).
- Field: add `http://localhost:3011/api/auth/line/callback` in the LINE console. Env gap (names only): `app/backend/.env` lacks `EASYSLIP_BASE_URL`, `app/frontend/.env.local` lacks `NEXT_PUBLIC_API_MOCKING` (both optional defaults).
- Dev servers for the run proof are left running on :3010 / :3011.

## AI Usage
**High** — Claude Code implemented the whole brief (Field's own brief; learning-mode cap applies to Metee only).

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-046`
- Work SHA: `5d1ee70` · self-check: brief §2 file list ↔ `git diff main...` (12 files, all listed); `grep` shows no remaining 3000/3001 in the changed files.

## Notes for Reviewer
- Start with `configuration.ts` + its new spec, then `package.json` scripts. The rest is literal swaps.

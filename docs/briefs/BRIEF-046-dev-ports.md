# BRIEF-046 — Dev ports: web 3010 · API 3011 (repo defaults)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-29 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · frontend · tooling (docs) |
| **Revision** | 1 |
| **Depends on** | BRIEF-025 ✅ (#94) — queue order only |
| **References** | Field 2026-10-29: another project's containers on Field's Mac bind 3000 / 3001 (`docker ps` checked in session; nothing on 31xx) · `README.md` · `app/backend/README.md` (tunnel) · `playwright.config.ts` |
| **Audit depth** | Compact (config + docs; no behaviour change) |
| **Size** | ~0.5 day · est. ~40–60 net-new lines |

---

## Selected (by KJ) — interview 2026-10-29

| # | Question | Selected |
|---|---|---|
| 1 | New dev ports | **web 3010 · API 3011** (3000 / 3001 are taken by Field's other docker project; 31xx is free) |
| 2 | How far | **Defaults + docs + the 2 tests that pin the old fallback** — self-contained test literals and `ci.yml` stay |
| 3 | Playwright | **Reserve ports only:** MSW e2e stays on **3100**; **3110 / 3111** reserved (README) for a future real-API e2e brief |
| 4 | Order | **After BRIEF-025 merges** (local env override used for 025's run proof) |

## 1. Goal
A fresh clone runs the web app on **3010** and the API on **3011** with the documented commands, so bar dev never collides with other local projects on 3000 / 3001.

## 2. Scope
### In
- `app/backend/src/providers/config/app/configuration.ts`: default `PORT` 3001 → **3011** (+ `configuration.spec.ts` if it asserts the default).
- `app/backend/.env.example`: `PORT=3011` · `LINE_CALLBACK_URL=http://localhost:3011/api/auth/line/callback` · `FRONTEND_URL=http://localhost:3010`.
- `app/frontend/.env.example`: `NEXT_PUBLIC_API_URL=http://localhost:3011/api`.
- `app/frontend/package.json`: `"dev": "next dev -p 3010"`, `"start": "next start -p 3010"` (the existing `predev` / `prebuild` wasm copy stays).
- `app/frontend/src/lib/api/client.ts` and `src/lib/socket/socket.ts`: fallback `http://localhost:3011/api`.
- Tests that pin the fallback: `src/app/login/page.test.tsx` (expects the login URL) · `e2e/menu-editor.spec.ts` (`base` URL) → 3011.
- Docs: root `README.md` (dev commands, health, OpenAPI UI URLs + a "Ports" line: web 3010 · API 3011 · Playwright MSW 3100 · reserved real-API e2e 3110 / 3111), `app/backend/README.md` (health URL; tunnel `ngrok http … 3011`), `app/frontend/README.md` (3010).
- The executor's own gitignored `.env` / `.env.local` already use 3010 / 3011 (BRIEF-025 run proof) — check, don't commit.

### Out (do NOT build here)
- Backend e2e / spec files that use `http://localhost:3000` as a fake browser origin with their own env (`set-auth-env.ts`, `*.e2e-spec.ts`) — self-contained, pass on any port · `.github/workflows/ci.yml` (protected; its env is test-only) · Playwright port (stays 3100) · real-API Playwright setup (own brief) · `docs/rules/core.md` port line (rules file → Cowork docs branch after this merges, Field-approved) · LINE Developers console callback (Field).

## 3. Contract
- **Endpoints / WS events / contracts:** none changed.
- **Business rules:** none.
- **Permissions:** none.

## 3b. Under the hood (proposed — skill section)
- **When:** `pnpm --filter @bar/backend start:dev` / `pnpm --filter @bar/frontend dev` on a fresh clone.
- **Where:** backend config default + `.env.example`; frontend `dev` / `start` scripts, API / socket fallbacks, `.env.example`.
- **How:** backend reads `PORT` (env, else 3011) → listens · Next dev binds `-p 3010` (Next doesn't read `PORT` from `.env`) · the browser calls `NEXT_PUBLIC_API_URL` (env, else `localhost:3011/api`) · CORS / socket origin = `FRONTEND_URL` (`localhost:3010`) · LINE callback = `LINE_CALLBACK_URL` (`localhost:3011`).
- **Data:** none. **Failure:** a developer with an old `.env` keeps 3001 / 3000 until they copy the new example — README says so. **Why:** env-driven already; only defaults and docs move.

## 4. Acceptance Criteria
- **AC-1** — Given no `PORT` in the environment, when the backend config loads, then it listens on 3011 (unit).
- **AC-2** — Given no `NEXT_PUBLIC_API_URL`, when the web client / socket build their base URL, then it is `http://localhost:3011/api` (login page test).
- **AC-3** — Given a fresh `.env` / `.env.local` copied from the examples, when both apps start with the README commands, then `curl localhost:3011/api/health` = 200, the web app loads on 3010, and LINE login round-trips (Field adds the 3011 callback in the LINE console first).
- **AC-4** — Playwright MSW e2e still runs on 3100 and passes; README lists 3010 / 3011 / 3100 / reserved 3110–3111.
- **AC-5** — Gates + run proof.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1 | unit | `app/backend/src/providers/config/app/configuration.spec.ts` |
| AC-2 | component | `app/frontend/src/app/login/page.test.tsx` |
| AC-4 | e2e (MSW) | existing suite incl. `e2e/menu-editor.spec.ts` |
| AC-3 | run proof | handoff |

Gate commands (all must pass):
```bash
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck && pnpm --filter @bar/backend test
pnpm --filter @bar/frontend lint && pnpm --filter @bar/frontend typecheck && pnpm --filter @bar/frontend test && pnpm --filter @bar/frontend test:e2e && pnpm --filter @bar/frontend build
```
Run proof (fresh, with 3000 / 3001 still taken by the other project):
```bash
pnpm --filter @bar/backend start:dev    # separate shell → :3011
pnpm --filter @bar/frontend dev         # separate shell → :3010
curl -fsS localhost:3011/api/health
```
UI: open `http://localhost:3010` → LINE login → POS floor loads with live data.

### Local Sonar scan
- Required for this brief: optional — config / docs only.

## 6. Constraints
- No dependency, contract or schema change; no protected file.
- Don't touch the other project's containers or ports.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):** web 3010 · API 3011 · Playwright MSW 3100 unchanged · reserved 3110 / 3111 (README only) · the file list in §2 In.
- **Likely DRs:** none.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies merged
- [x] Size within workflow §2
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-29 | Initial Draft (Cowork) — interview Selected 1–4 |
| 1 | 2026-10-29 | Ready — Field in session: "approve BRIEF-046 Rev 1 Ready" |

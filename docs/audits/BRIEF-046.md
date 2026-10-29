# Audit — BRIEF-046 Dev ports: web 3010 · API 3011

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-29 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-29 |
| **Branch / commit** | `feat/BRIEF-046-dev-ports` · **S = `5d1ee70`** · handoff `2c27b8f` · seed `3c85699` |
| **Depth** | Compact (config + docs) |
| **Brief revision** | 1 |
| **Recommendation** | **CHANGES REQUIRED** — evidence only: the LINE login → POS floor step of the run proof (Must fix 1). No code change expected. |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `configuration.ts` fallback 3011; new spec "defaults PORT to 3011 when it is not set" (the old spec had no default case) | |
| AC-2 | ✅ | `client.ts` + `socket.ts` fallback `http://localhost:3011/api`; `login/page.test.tsx` expects `…:3011/api/auth/line/login` | |
| AC-3 | ⚠️ | health 200 on :3011, `/login` 200 on :3010, LINE login 302 with `redirect_uri=…:3011/api/auth/line/callback`, CORS echoes `Origin: http://localhost:3010` | full LINE round-trip + POS floor not done (Must fix 1) |
| AC-4 | ✅ | Playwright MSW e2e 22 passed on 3100, incl. `menu-editor.spec.ts` with the 3011 base; README "Ports" line lists 3010 · 3011 · 3100 · reserved 3110 / 3111 | |
| AC-5 | ⚠️ | gates green per handoff (backend unit 149, frontend unit 182, e2e 22, build) · Cowork re-ran `tsc --noEmit` backend + frontend on `2c27b8f` (exit 0) | run proof incomplete (AC-3) |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope = §2 file list | ✅ | 12 files, all listed; nothing else |
| No dependency / contract / schema / protected file | ✅ | |
| Out-of-scope literals | ✅ | backend e2e origins, `set-auth-env.ts`, `ci.yml`, `line/configuration.spec.ts` (a stubbed env value, self-contained) keep 3000 / 3001 by design |
| S..H | ✅ | `2c27b8f` = handoff + KJ state only |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Must fix (evidence) | Low | **Current:** AC-3 and brief §5 ("UI: open `http://localhost:3010` → LINE login → POS floor loads with live data") stop at HTTP checks; the LINE round-trip needs the new callback in the LINE console. **Updated:** Field adds `http://localhost:3011/api/auth/line/callback` in the LINE Developers console (the 046 dev servers are still running on 3010 / 3011) → logs in at `localhost:3010` → POS floor shows live tables; the executor records it in the handoff (no code change, S stays `5d1ee70`). |
| 2 | Info | — | `.claude/launch.json` (frontend `--port 3000`) is **untracked** (`git ls-files .claude` is empty) — a local file, outside the repo; the executor may update it on this machine, no commit. |
| 3 | Info (Cowork, after merge) | — | `docs/rules/core.md` port lines (3001 / 3000) → Cowork docs branch, Field-approved, together with the CD-03 handoff §9 note (BRIEF-025) — KJ state *Next steps* 1. |

## Recommendation to Field
The change is exactly the agreed list, tested, and nothing else moved. One minute of yours closes it: add the 3011 callback in the LINE console, then log in on `localhost:3010`.

**Next command:** `execute BRIEF-046` (Must fix 1: record the LINE login → POS floor run proof on :3010 / :3011 in the handoff after Field adds the callback; optionally update the untracked `.claude/launch.json` locally; then, with this audit re-checked to PASS, the PASS commit + PR).

## Evidence Coverage
- Reviewed work SHA: `5d1ee70` (handoff `2c27b8f`; `git diff 3c85699..2c27b8f`)
- Sources inspected independently: every changed file in the diff; `git grep` for leftover `localhost:3000/3001` in the changed scope (only the self-contained LINE config spec stub remains); `git ls-files .claude`
- Tests: Cowork re-ran `tsc --noEmit` backend + frontend (exit 0); lint / unit / e2e from the handoff → `ci` on H.
- Written uncommitted; the executor commits it unchanged at PASS.

## Re-audit — 2026-10-29 (Cowork) · S = `5d1ee70`
Reviewed `git diff 2c27b8f..45bb39f` (handoff only; `app/` identical to `5d1ee70`).

| Check | Result |
|---|---|
| Must fix 1 · run proof | LINE login round-trip on fresh servers (`5d1ee70`): `localhost:3010/login` → LINE (`redirect_uri=…localhost:3011/api/auth/line/callback`) → `http://localhost:3010/pos/tables` with live data (header "Field", T1 / T2 bills) ✅ — the 3011 callback is accepted by the LINE console |
| S..H | `45bb39f` = handoff only ✅ |

**Result: PASS** — zero Must fix. Audited S = `5d1ee70`. Info 2 (untracked `.claude/launch.json`) and 3 (Cowork docs branch for `docs/rules/core.md` + CD-03 §9 after merge) stay open as noted.

**Next command:** `execute BRIEF-046` (PASS commit: this audit unchanged + handoff + state, then open the PR; Field's own PR — merge once `ci` is green on H and S..H is evidence-only).

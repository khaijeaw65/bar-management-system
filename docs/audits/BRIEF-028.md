# Audit — BRIEF-028 Web POS: LINE login, session, real API

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-21 evening |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-21 |
| **Branch / commit** | `feat/BRIEF-028-web-login-real-api` · `3d6b2b9` (audited work commit; handoff `40c735c`) |
| **Depth** | Full (auth) |
| **Brief revision** | 1 |
| **Recommendation** | **BLOCKED** — signed-in run proof missing (environment); code review found no Must fix → **PASS on re-audit (below)** ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `login/_components/LoginCard.tsx` (pending + disabled, `location.assign(lineLoginUrl())`) · `login/page.test.tsx` · `e2e/login.spec.ts` | 250 ms delay so the pending label paints — fine |
| AC-2 | ✅ | `LoginScreen.tsx` branches on `?error`; `page.test.tsx` asserts no `/api` call | |
| AC-3 | ✅ (tests) | `SessionGate.tsx` · `SessionGate.test.tsx` "shows the staff name…", "first-load 401 goes to login without the modal" | Not exercised against the real backend — see Finding 1 |
| AC-4 | ✅ | `client.ts` `refreshPromise ??= beginRefresh()`; `client.test.ts` 3 × 401 → `refreshes = 1`, `reads = 6`; retried 401 not refreshed again | Matches BRIEF-007 reuse-detection constraint |
| AC-5 | ✅ | `onSessionExpired('mid-use')` → `SessionExpiredModal` (not dismissable, 5 s); tests incl. fake-timer countdown | |
| AC-6 | ✅ | `StaffAccount.tsx` `signOut` swallows logout failure, clears cache, `/login`; two tests | |
| AC-7 | ✅ | `menu.ts` on `MenuItemListSchema` / `MenuCategoryListSchema`; `MenuItemRow.tsx` category name, "เริ่ม ฿x", หมด / นอกเวลาโปร; `MenuList.test.tsx` | Empty state without "เพิ่มเมนูแรก" — correct (CD-12) |
| AC-8 | ✅ | `client.ts` `recover()` keeps `data`, unknown code kept as string, `INVALID_RESPONSE` from `unwrapSuccess`; `client.test.ts` | |
| AC-9 | ❌ partial | Handoff G1 table: lint / typecheck / test (30) / e2e (3) / build exit 0. Run proof: backend 200 on `:3011`, login screens exercised; **signed-in `/pos/menu` on the real API not exercised** | Finding 1 |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | `/` still → `/pos/menu` (029 changes it) |
| No unapproved deviations / deps | ✅ | `axios@^1.20.0` = Pre-decided; lockfile +3 lines |
| `PermissionsGuard` only, no inline checks | n/a | frontend |
| `save()` not `update()` on audited entities | n/a | |
| Contracts as source of truth | ✅ | `AuthMeSchema`, menu schemas, `ErrorCodeSchema`; backend `/auth/refresh` + `/auth/logout` return `AuthOkSchema` `{ ok: true }` = client schema (checked in `auth.controller.ts`) |
| One HTTP entry point, no tokens in JS | ✅ | only `lib/api/client.ts`; cookies HttpOnly, nothing stored client-side |
| Agent boundaries respected | ✅ | no rule files touched (frontend.md edits came with the seed) |
| Run proof on the audited SHA — UI exercised | ❌ | Finding 1 |

## Test Quality
The client tests hit the real interceptor through MSW and assert the two things that matter for auth: exactly one refresh under concurrency and no second refresh on a retried 401. The gate tests cover both phases (first-load redirect vs mid-use modal). What MSW cannot prove: real cookies crossing `:3000 → :3001` with `withCredentials`, the LINE callback landing on `/` and then `/pos/menu`, and real seeded menu data parsing against the contracts schema. That is exactly what the run proof is for.

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | **Blocker (evidence)** | High | Handoff "run proof": `:3000` / `:3001` were taken by another project's containers, so the backend ran on `:3011` and the frontend on `:3010`; CORS (`FRONTEND_URL=localhost:3000`) and the LINE callback registered for `localhost:3001` both block a real sign-in there. **Current:** signed-in path verified only with MSW. **Updated:** free `:3000` / `:3001` for the proof, start backend + frontend on the work SHA with mocks off, Field signs in once with LINE (Field-only credential), executor opens `/pos/menu` → real seeded menu + Field's name in the top bar; also wait > 15 min (or delete the `access_token` cookie in DevTools) and reload → still signed in after a silent refresh. Append to the handoff. No code change expected → audited SHA stays `3d6b2b9`. |
| 2 | Suggestion | Low | `globals.css` adds `--line-brand` / `--line-brand-fg`. **Current:** tokens exist only in CSS. **Updated:** add them to `docs/design-system.md` colour table when it is next touched (README "update design-system.md in the same PR" for token changes). |
| 3 | Suggestion | Low | `SessionGate.tsx` non-auth error fallback is a plain `<p>` + `<button>`. **Current:** not the CD-01 Alert + retry pattern. **Updated:** use HeroUI `Alert` + `Button` when 029 adds the shared error state. |
| 4 | Suggestion | Low | `MenuItemRow.tsx` `priceLabel` compares prices with `Number()`. **Current:** fine for a comparison, but it's the only money-as-number spot. **Updated:** switch to the satang helper (`lib/utils/money.ts`) when BRIEF-031 adds it. |

Note (not a finding): ~860 net lines vs the ~450–550 estimate (tests ~355, mocks ~130). Reviewable; executor disclosed it. Size future UI briefs from this (tests ≈ 40 % of the diff).

## Recommendation to Field
Code is clean and matches Rev 1 and Q1 A: one axios instance, one shared refresh, phase-aware session gate, contracts everywhere, no unapproved deps. The only gap is the real signed-in run proof, which this brief explicitly needs your LINE login for and which the port clash prevented. Free the two ports, do the 2-minute sign-in, and I expect PASS on the same SHA.

**Next command:** free `:3000` / `:3001` (stop the other project's containers for the proof) → `execute BRIEF-028` — complete the run proof (Finding 1), Field signs in with LINE; append evidence to the handoff → Cowork re-checks → PASS.

## Evidence Coverage
- Reviewed work SHA: `3d6b2b9`
- Sources/diff inspected independently: full `e4fc1c0..3d6b2b9` diff of `app/frontend` (client, errors, auth, useMe, SessionGate, SessionExpiredModal, StaffAccount, login components, menu wrappers + row, mocks, globals.css, package.json); backend `auth.controller.ts` + `auth-cookies.ts` + `configure-app.ts` for response shapes, cookie flags and CORS
- Tests run or independently inspected: **inspected, not re-run** — the Cowork shell on this Mac has no pnpm and `node_modules` are macOS builds. Independent gate evidence = GitHub `ci` on the PR head (required for merge)
- Written uncommitted; the executor commits it unchanged at PASS (H). Pre-merge summary must verify S..H contains evidence-only changes (§7).
- Repeated blocker: none

## Sonar (local scan)
- Handoff Sonar section present: yes — "Not run. Optional on Field's brief."
- Remaining issues have reasons; no unapproved "won't fix"/exclusions: n/a
- Learning mode respected: n/a (Field's brief)

## Re-audit — 2026-10-21 · `3d6b2b9` (work SHA unchanged)
| | |
|---|---|
| **Scope** | Finding 1 only — signed-in run proof. No code, test or dependency change since the first audit (`git diff 3d6b2b9 HEAD -- app/` empty; only `docs/handoffs/BRIEF-028.md` + state changed, uncommitted). |
| **Evidence** | Handoff run proof (updated): ports 3000 / 3001 free; backend `start:dev` on 3001 → `/api/health` 200; frontend `next dev` on 3000, mocks off. Logged-out `/pos/menu` → `/login`, no modal (AC-3 first-load on the real API). Field's first LINE login → `not_registered` + access request (BRIEF-007 path, real); after `seed:staff` / `seed:venue` / `seed:menu`, Field signed in → `/pos/menu` shows **Field** in the top bar and the real catalog with category names, "เริ่ม ฿260.00", "นอกเวลาโปร", "หมด" (AC-3, AC-7 on real data). `access_token` deleted + reload → still signed in, no modal; Redis shows the refresh family rotated and a new live key, no reuse revocation (AC-4 / AC-5 real cookie path: `:3000 → :3001`, `withCredentials`, refresh cookie path `/api/auth`). |
| **Finding 1** | ✅ Resolved. |
| **Note** | Two `refresh-used` markers ~13 s apart in one family = two sequential rotations (e.g. the reload and a later refetch), not a parallel double refresh — the family stayed live, which is the reuse-detection outcome that matters. |
| **Result** | **PASS** — zero Must fix; Suggestions 2–4 stay as follow-ups (design-system token doc · Alert pattern in 029 · satang helper in 031). |

**Next command:** `execute BRIEF-028` (PASS commit + PR) — **after BRIEF-027's PR merges**: merge `main` into the branch first and reconcile `docs/state/kj/SESSION_STATE.md` by hand (Resume = BRIEF-028 PASS/PR; Done list gains 027's PR; keep both Carry-over sets; never take ours/theirs wholesale — workflow §4), then commit this audit, the handoff and the state, push, open the PR.

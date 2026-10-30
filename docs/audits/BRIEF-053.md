# Audit — BRIEF-053 Backend: IAM core — catalog, default groups, permission resolver, enforced guard (I1)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-30 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-30 |
| **Branch / commit** | `feat/BRIEF-053-iam-core` · **S = `73b2f58`** · handoff `7b0748b` · merge `origin/main` `1460fe9` (052 = #102) · seed `038dfa9` |
| **Depth** | Full (auth — every staff request) |
| **Brief revision** | 1 |
| **Recommendation** | **CHANGES REQUIRED** — evidence only (green e2e run; LINE + POS click-through as Field). Plus one Field decision on the safety net (Finding 3). |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | migration `IamCore` = schema §3 tables + triggers; catalog / 3 policies / 3 groups with fixed ids; no people; `iam-seed` e2e checks catalog + mapping equality | |
| AC-2 | ✅ | run proof: staff mark-paid 403 `missing:["payments:mark_paid"]`, menu edit 403, reports 403; manager update_payment 403, mark-paid 200; e2e | |
| AC-3 | ✅ | `codesFor` = policies of live groups ∪ `user_policy` | |
| AC-4 | ✅ | `activeGroups`: `[valid_from, valid_until)`; `nextChange` = next start **or** end → `cacheTtlSeconds` ≤ that, cap 15 min, min 1 s; unit with fake clock | |
| AC-5 | ✅ | key `perms:{user}:v{version}`; every Redis step try/catch → DB; inactive user never cached | |
| AC-6 | ✅ | guard reads `request.user` after `JwtAuthGuard` (cookie or Bearer); e2e same body both ways | |
| AC-7 | ✅ | inactive user with a live session → 200 empty; documented in README | |
| AC-8 | ✅ | `route-permissions` e2e (test-only controller flagged; app clean) | |
| AC-9 | ✅ | `IamEnforcement`: boot + 60 s refresh, "not enforcing" re-checked on each denial; e2e with an owner-less app | Finding 3 |
| AC-10 | ✅ | `seedStaffMember` / `seedRoster` idempotent; `DEV_OWNER_LINE_SUBS` parsing; e2e | |
| AC-11 | ⚠️ | lint / typecheck / unit 199 / contracts 98 / openapi:check / frontend green; **backend e2e exit 1 (234 passed, 1 failed)**; **Cowork re-ran backend `tsc --noEmit` on `7b0748b` (exit 0)** | Must fix 1, 2 |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| No inline permission checks | ✅ | only `@RequirePermissions` + guard |
| Resolver = only IAM-table reader for authz | ✅ | `PermissionSource` port, TypeORM adapter |
| Guard order | ✅ | both `APP_GUARD`s in `AppModule`, Jwt first (moved from `AuthModule` — accepted, makes the order explicit) |
| Typed catalog | ✅ | `@RequirePermissions` typed against `PermissionCodeSchema` |
| No new dependency · schema = ERD §3 | ✅ | |
| Unlocked file | ✅ | `.env.example` only (`DEV_OWNER_LINE_SUBS=`) |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | **Must fix (evidence)** | Medium | **Current:** backend `test:e2e` exited 1 (`payment.e2e` "…queues expiry": the BullMQ job was consumed by the running dev backends — run used `REDIS_URL=/1`, but BullMQ drops the DB index, BRIEF-013 S2). G1 needs exit 0. **Updated:** stop the dev backends (`start:dev` / `nest start --watch`), re-run the full backend `test:e2e` on the same SHA → 0 failed; record counts. If Field has to stop them, ask him in chat (one action). |
| 2 | **Must fix (evidence)** | Medium | **Current:** brief §5 run proof "log in with LINE as Field → POS works end to end" not done (tokens minted only). This is the one check that the real web POS still works once every route is enforced. **Updated:** with `DEV_OWNER_LINE_SUBS` = Field's real LINE sub, run `seed:roster`, then Field logs in with LINE on `localhost:3010` → tables → open → order → checkout → close (one round) → no 403 anywhere; plus the staff app's Bearer path is already covered by AC-6. One line per step in the handoff. |
| 3 | **Decision — Field** | Medium (before a real-bar pilot) | **Current:** the safety net turns enforcement **off** whenever no *live* owner exists. In production that also happens if the only owner's membership expires (time-bound) or the owner is deactivated — every staff member then silently gets everything (fail-open). **Options:** **A — keep as is for S1** and rely on I2's lockout rules (`IAM_LOCKOUT`: can't remove/expire/deactivate the last owner). **B (recommended)** — safety net only while **no owner membership has ever existed** (bootstrap of a fresh DB); once one exists, always enforce — an expired owner is then fixed with `seed:staff --group เจ้าของ`, not by opening everything. ~5 lines in `hasLiveOwner` → `everHadOwner`, 1 test. |
| 4 | Suggestion | Low | IAM time uses wall-clock `new Date()` (deviation 5) — right for tokens; I2's "ถึงสิ้นกะคืนนี้" must compute 06:00 from the venue cut-off rule, not the test `CLOCK`. Note for I2. |
| 5 | Info | — | `payment.e2e` / `menu-photos` flakiness = shared Redis/BullMQ with dev workers (Carry over "dev env isolation"); the proper fix is BRIEF-013 S2 (BullMQ keeps the DB index) — still before AWS. |

## Recommendation to Field
The core is right: one reader, a cache that can't outlive a membership, a typed catalog, and the guard covers web and mobile the same way. Two evidence items before PASS (a clean e2e run with the dev servers stopped, and your LINE login through one POS round). And one decision: I recommend **B** for the safety net — fail-open should only ever happen on a brand-new database.

**Field decision (2026-10-30, in session): Finding 3 → B.** It becomes **Must fix 3**: the safety net applies only while **no เจ้าของ membership has ever existed** (any row in `user_group_membership` for the owner group, whatever its dates or the user's `is_active`). Once one exists the guard always enforces — no fail-open on an expired or deactivated owner; recovery = `seed:staff --group เจ้าของ`. Rename `hasLiveOwner` → `everHadOwner` (or equivalent); the boot warning text stays for the fresh-DB case. Tests: unit (`IamEnforcement` with an expired-only owner row → enforcing) + e2e (owner membership expired → staff still 403). This supersedes the brief's *(proposed)* safety-net wording ("no active staff in เจ้าของ").

**Next command:** `execute BRIEF-053` (Must fix #1 green e2e with dev servers stopped, #2 LINE + POS round as Field, #3 safety net = never-had-owner only), then `audit BRIEF-053`.

---

## Re-audit 1 — 2026-10-30 (Cowork)
| | |
|---|---|
| **Reviewed** | **S = `5269a86`** (Must fix 3) · handoff updates `27ca977`, `971fae3` (evidence for Must fix 1–2) |
| **Result** | **PASS** — no Must fix open |

- ✅ **Must fix 3.** `IamEnforcement.refresh` → `source.everHadOwner()` = `SELECT 1 FROM user_group_membership WHERE group_id = <owner> LIMIT 1` (no date / `is_active` filter); port, adapter, unit specs and README renamed; new e2e "expired or deactivated owner never switches enforcement off". Fail-open is now limited to a database that never had an owner.
- ✅ **Must fix 1.** Dev backends stopped (Field's OK), backend `test:e2e` on default Redis at `5269a86` → exit 0, **35 files · 236 passed · 0 failed**.
- ✅ **Must fix 2.** Field signed in with LINE on `localhost:3010` after `seed:roster` with his real sub → open table → order → checkout → close: no 403 anywhere (handoff run proof).
- Process note: `27ca977` / `971fae3` are handoff commits inside a fix round (workflow §3 step 4 says fix commits only; handoff at the PASS commit). Harmless here (docs only, evidence the audit needed) — keep evidence in chat next time and fold it into the PASS commit.

**Next command:** `execute BRIEF-053` (PASS commit + PR: this report + final handoff + state).

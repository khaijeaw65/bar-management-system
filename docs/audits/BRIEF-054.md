# Audit — BRIEF-054 Backend: IAM staff API — access requests, staff, time-bound memberships, lockout (I2)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-31 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-31 |
| **Branch / commit** | `feat/BRIEF-054-iam-staff-api` · **S = `8c0b250`** (work `beca748` "wip", OpenAPI fix `8c0b250`) · handoff `62f5778` · merge `main` (053 = #103) `66e5591` · seed `9a882be` |
| **Depth** | Full (auth / sessions / lockout) |
| **Brief revision** | 1 |
| **Recommendation** | **CHANGES REQUIRED** — Must fix 1 (deactivated staff keep old sessions), 2 (Sonar), 3 (real-stack run proof); two Field confirmations (Findings 4, 5). |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1, AC-2 | ✅ | e2e with LINE stubbed: approve → identity + memberships in one tx, next login OK; 409 `ACCESS_REQUEST_DECIDED`; rejected stays rejected on re-login; reopen | real LINE → Must fix 3 |
| AC-3 | ✅ | `nextCutoff(now, venue cut-off)` on wall-clock; unit + e2e (06:00, 05:00, past ISO 400) | |
| AC-4 | ✅ | e2e: membership ends → `[]`, `expired`, PUT removes | |
| AC-5 | ✅ | lockout in one tx under `pg_advisory_xact_lock`, DB re-read after the write, rollback → 409 | scope → Finding 5 |
| AC-6 | ⚠️ | e2e: self 409; web + mobile 401 on **sessions created after this change** (indexed in `user-families:{id}`) | Must fix 1 |
| AC-7 – AC-9 | ✅ | e2e | |
| AC-10 | ⚠️ | contracts 111, backend unit 208, **e2e 251 / 0 failed (dev backends stopped)**, openapi:check, frontend typecheck; **Cowork re-ran backend `tsc --noEmit` on `62f5778` (exit 0)**; Sonar not run; run proof partial | Must fix 2, 3 |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | **Must fix** | **High** (security) | **Current:** deactivation ends sessions only through the new `user-families:{userId}` index (handoff deviation 4); sessions created before this change — including **30-day mobile tokens** issued since BRIEF-021 — are not indexed. `TokenService.authenticateClaims` checks only that the session key exists, not `staff_user.is_active`, and refresh rotation doesn't check it either. So after the deploy, a deactivated person keeps a live web/mobile session: `@AnyStaff()` routes, refresh rotation and the WS `/staff` socket (same `authenticateAccessToken`) keep working; only permissioned routes 403 (resolver returns empty for inactive). **Updated:** make "inactive = logged out" independent of the index — (a) `authenticateClaims` rejects an inactive staff user (DB check; cache it alongside the I1 permission cache key so it costs nothing extra, or a small `staff-active:{id}:v{iamVersion}` key), (b) refresh rotation refuses an inactive user and revokes that family, (c) keep the index for immediate cleanup. Tests: a session created **without** the index (simulate a pre-change session) + deactivate → access 401, refresh refused, WS handshake rejected. |
| 2 | **Must fix** | Medium | **Current:** brief §5 "Local Sonar scan — Required: yes"; handoff: not run. **Updated:** `pnpm sonar` on the fix SHA; zero issues in files this brief authored (pre-existing list may stay), record gate + counts. |
| 3 | **Must fix (evidence)** | Low | **Current:** run proof stops at health + 401. Real LINE with a second account isn't available tonight. **Updated (narrowed):** real stack with minted tokens, no LINE — insert a `pending` access request row → approve as พนักงาน until `end_of_night` (check `valid_until` = next 06:00 +07) → mint a token for the new staff → mark-paid 403 → deactivate → that token 401 → Field's token: self-deactivate 409, remove own เจ้าของ 409 `IAM_LOCKOUT`. **Real LINE login of an approved account → carried to the IAM UI brief's run proof** (Metee's account). |
| 4 | **Decision — Field (confirm)** | — | **Current:** new Nest module `modules/iam/staff-admin.module.ts` (imports `IamModule`, `AuthModule`, `VenueModule`) — a Field-Guard trigger ("new module") not pre-decided. Reason: `AuthModule` and `VenueModule` already import `IamModule`, so `IamModule` can't import them back. **Recommend: accept** — it lives inside `modules/iam`, keeps auth/venue untouched, and I3 can put its controllers there too. |
| 5 | **Decision — Field (confirm)** | — | **Current:** the lockout check runs on `PUT memberships` and `isActive: false` only; approve / reject / reopen / rename / reactivate skip it (so a fresh DB can approve its first person). The brief said "every write". Those skipped writes can't remove anyone's `staff:manage`, so the rule's intent holds. **Recommend: accept**; I3 must run it on every group / policy write (its brief already says so). |
| 6 | Info | — | Work commit is titled `wip(…) — gates not fully run`; gates were then run on `8c0b250` (all green). Fine, but the PASS-time history reads oddly — next time commit the work once gates pass. |
| 7 | Info | — | `AccessRequestsController` registered before `StaffController` so `/staff/access-requests` isn't matched as `/staff/:id` — good catch, keep the comment. |

## Recommendation to Field
Most of I2 is solid (one-transaction approve, lockout under an advisory lock, cut-off on the venue setting, 251 e2e green). One real security gap: deactivating someone doesn't end sessions that existed before this change — fix it by checking "active" on every token, not only through the new index. Plus Sonar and a minted-token run proof. Please confirm Findings 4 and 5 (I recommend accepting both).

**Field decisions (2026-10-31, in session):** Finding 4 **accepted** (`modules/iam/staff-admin.module.ts` is the home for owner-side IAM controllers; I3 registers there too) · Finding 5 **accepted** (lockout on `PUT memberships` and deactivation; I3 runs it on every group / policy / user-policy write).

**Next command:** `execute BRIEF-054` (Must fix #1 inactive = logged out on every token, #2 Sonar, #3 minted-token run proof), then `audit BRIEF-054`.

---

## Re-audit 1 — 2026-10-31 (Cowork)
| | |
|---|---|
| **Reviewed** | **S = `1ae5fd2`** (Must fix 1) · Sonar scan file `.scannerwork/report-task.txt` written 00:56 local |
| **Result** | **Pending evidence** — Must fix 1 closed; #2 / #3 results not in the repo yet (fix rounds report in chat, workflow §3) |

- ✅ **Must fix 1.** New `StaffActivity.isActive(userId)` (cache `staff-active:{id}:v{iamVersion}`, 300 s, Redis failures fall to the DB; deactivate/reactivate bump the version). `TokenService.authenticateClaims` returns null for inactive staff — covers web cookie, mobile Bearer and the WS `/staff` handshake (same `authenticateAccessToken`); `rotate` refuses an inactive user and revokes that family. e2e builds a pre-index session (deletes `user-families:{id}`), deactivates → `/auth/me` 401 for web and mobile, `authenticateAccessToken` null, both refresh tokens `invalid`. Cowork re-ran backend `tsc --noEmit` on `1ae5fd2` (exit 0).
- ✅ **Must fix 2 (Sonar).** Scan on `1ae5fd2`: gate ERROR only from the known 22 pre-existing issues + the 0 % coverage path; **0 issues in files this brief authored** (executor report, relayed by Field).
- ✅ **Must fix 3 (run proof, narrowed).** Real dev stack, fresh backend `/api/health` 200 · inserted pending request listed · approved as พนักงาน `until: 'end_of_night'` at ~00:55 +07 → `valid_until = 2026-10-30T23:00Z` = **06:00 Bangkok the same morning** (correct next cut-off) · minted token → mark-paid 403 → after deactivation 401 · Field's token self-deactivate → 409 `SELF_DEACTIVATE` · scratch rows removed. `IAM_LOCKOUT` not exercised on dev (two owners there) — covered by e2e (AC-5). Accepted.
- Gates on `1ae5fd2`: contracts 111 · backend lint / typecheck / unit 208 · **e2e 36 files · 252 passed** (dev backends stopped); `openapi:check` + frontend typecheck from `8c0b250` (neither touched by `1ae5fd2`).
- Info: a pre-change session of a user who is deactivated and later **re**activated works again (never revoked, now active). Acceptable — the person is legitimately back; only sessions older than this deploy.
- **Doc follow-up (allowed in the PASS commit, docs only):** `docs/api/README.md` still says an inactive user with a live session gets `200` with empty permissions (BRIEF-053 AC-7 wording); it is now **401**. Fix that one line in the PASS commit.

**Result: PASS** — no Must fix open.

**Next command:** `execute BRIEF-054` (PASS commit + PR: this report + final handoff with the evidence above + state + the one-line README correction).

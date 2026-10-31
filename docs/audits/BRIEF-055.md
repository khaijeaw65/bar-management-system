# Audit — BRIEF-055 Backend: IAM groups & policies API — custom groups, policy matrix, personal policies (I3)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-31 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-31 |
| **Branch / commit** | `feat/BRIEF-055-iam-groups-policies-api` · **S = `d04bf42`** (work `4cd10cb` + Sonar fix) · handoff `5efd449` · merge `main` (054 = #104) `77d5351` · seed `1cdbd30` |
| **Depth** | Full (auth) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** — no Must fix. |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1, AC-2 | ✅ | e2e + run proof: Job 1 (policy รับเงิน + group [งานพนักงาน, รับเงิน]) and Job 2 (personal policy) flip mark-paid from 403 to past-the-guard; `usage {groups 1, users 0, people 1}` | 404 on an unknown payment id = guard passed — fine as proof |
| AC-3 | ✅ | system rows by fixed ids (`DEFAULT_GROUP_IDS`, `DEFAULT_POLICY_IDS`), 9 refused edits, nothing changed | |
| AC-4 | ✅ | pure `deleteImpact()` (codes via the deleted group minus codes from any other live membership / personal policy) + unit; run proof `losing: ['payments:mark_paid']` | |
| AC-5 | ✅ | `POLICY_IN_USE` names group + person; after detach → 200 | |
| AC-6 | ✅ | `IamWriteGuard.run(…, checkLockout = true)` on group-policies replace, group delete, policy matrix replace, personal policies replace (+ 054 paths); create / rename / policy delete (blocked while attached) skip it — none can remove `staff:manage` from anyone | |
| AC-7 | ✅ | `GET /permissions/catalog` from `PERMISSION_CATALOG` (Thai labels in contracts); bootstrap hook restores ทั้งหมด links and missing `permission` rows, bumps the version | deviation 3 |
| AC-8, AC-9 | ✅ | e2e (case/space-insensitive Thai names, unknown code 400, refused create leaves nothing; 13 routes 403 `staff:manage`) | |
| AC-10 | ✅ | contracts 116 · backend unit 211 · **e2e 37 files · 264 passed** (dev backends stopped) · openapi:check · frontend typecheck · Sonar 0 issues in this brief's files · **Cowork re-ran backend `tsc --noEmit` on `5efd449` (exit 0)** · minted-token run proof on dev `bar`, scratch rows removed | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Lockout shared, never re-implemented | ✅ | BRIEF-054 helpers extracted to `IamWriteGuard` (advisory lock + DB re-read in the write's transaction); refused outcomes now roll back whole |
| No schema change | ✅ | system markers by fixed seed ids, as the brief preferred |
| Controllers in `staff-admin.module.ts` | ✅ | per Field's 054 decision |
| Resolver still the only authz reader | ✅ | admin repositories write; reads for authorisation unchanged |
| No new dependency | ✅ | |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Suggestion | Low | **Current:** IAM admin writes use raw `query()` and set `created_by` / `updated_by` by hand (deviation 5; same as BRIEF-054), while CLAUDE.md asks for `save()` on audited entities so `AuditSubscriber` stamps them. Correct today, but two patterns for the same columns. **Updated (later):** either move IAM writes to entities + `save()` in a cleanup brief, or add a CLAUDE.md note that raw-SQL repositories inside a lock/transaction stamp the actor explicitly (Field's call). |
| 2 | Info | — | Deviation 3 (bootstrap inserts missing `permission` rows, not only ทั้งหมด links): accepted — new codes from contracts work after restart without a hand-written migration; briefs that add codes (e.g. BRIEF-018 `orders:void`) may still add a migration for clarity. |
| 3 | Info | — | Deviation 2 (`people` counts direct attaches + non-expired memberships incl. future; `memberCount` counts every membership row) — sensible for the "used by many" warning; UI brief should label `memberCount` as "สมาชิก (รวมหมดอายุ)" or use `people`. |
| 4 | Info | — | One `venue-payment-settings` race spec failed once with 404 and passed on re-run — same shared-dev-env flakiness family (Carry over). |

## Recommendation to Field
IAM backend is complete and consistent: every write that can remove `staff:manage` runs the same lockout check under one lock, system rows are protected by fixed ids, and the two real jobs (แคชเชียร์ group, personal policy) work on the real stack. Ready for the IAM UI briefs.

**Next command:** `execute BRIEF-055` (PASS commit + PR).

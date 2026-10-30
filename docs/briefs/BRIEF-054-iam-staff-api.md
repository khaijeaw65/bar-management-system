# BRIEF-054 — Backend: IAM staff API — access requests, staff, time-bound memberships, lockout (I2)

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 1 |
| **Depends on** | **BRIEF-053 merged** (IAM tables, resolver, `iam:version`, guard, `staff:manage`) · BRIEF-007 / 015 / 021 ✅ (LINE login, refresh families in Redis, mobile tokens) · BRIEF-035 ✅ (venue business-day cut-off) |
| **References** | CD-13 handoff R1–R9 (§4 Action table, D1 time-bound, R3 cut-off, R4 rejected re-login, R6 rules, R7 API list) · canvas https://claude.ai/artifact/PF5pdKMY4b2w1oaunrHJH3 · DR-005 A2 (30-day mobile token) · DR-014 #4 (cut-off = venue setting, default 06:00) · audit BRIEF-053 Finding 3 (B) / Finding 4 |
| **Audit depth** | Full (auth / sessions / lockout) |
| **Size** | ~1.5 days · est. ~900–1,200 net-new lines incl. tests |

---

## Interview — Selected (by KJ), 2026-10-30
| Q | Selected (by KJ) |
|---|---|
| Tables / QR admin | **Separate brief** (I2 = people only) |
| "ถึงสิ้นกะคืนนี้" | **Server keyword**: `until: 'permanent' \| 'end_of_night' \| <ISO time>`; server computes the next venue cut-off |
| Direct user policies | Attach/detach in **I3**; I2 only shows them as a source in effective permissions |
| Reactivation | **Owner can reactivate** (memberships kept as they were) |
| *(proposed)* Lockout rule | A write is refused with `409 IAM_LOCKOUT` if, afterwards, **no active staff member holds `staff:manage` through a membership with no end date or a direct user policy**. One rule covers: removing the last owner, giving the last owner an end date, deactivating them, and (in I3) editing policies/groups. |
| *(proposed)* Membership edit | `PUT /staff/:id/memberships` replaces the person's whole set (expired rows not in the body are removed — CD-13 "struck หมดอายุ until removed") |
| *(proposed)* Revoke sessions | deactivation revokes **every** refresh family of the user (web + 30-day mobile) and their access tokens stop working on the next request; a per-user family index in Redis if needed |

## 1. Goal
The owner (anyone with `staff:manage`) can let people in from LINE access requests, give them groups for good or until tonight's close, take them out, and switch accounts off — without ever locking the bar out of its own system.

## 2. Scope
### In (all routes `@RequirePermissions('staff:manage')` unless noted; every IAM write calls `IamVersion.bump()`)
- **Access requests:**
  - `GET /staff/access-requests?status=pending|rejected` (default pending) → `AccessRequest[]` (`id, displayName, avatarUrl, status, requestedAt, decidedAt`) newest first.
  - `POST /staff/access-requests/:id/approve` `{ displayName, memberships: MembershipInput[] (≥ 1) }` → `StaffMember` — one transaction: create `staff_user` + `staff_user_identity` (provider/external_id/avatar from the request) + memberships; request `approved`, `decided_at/by`. Request not `pending` → `409 ACCESS_REQUEST_DECIDED`. The person's next LINE login succeeds.
  - `POST /staff/access-requests/:id/reject` → `AccessRequest` (`rejected`, decided_at/by); not pending → 409 `ACCESS_REQUEST_DECIDED`. A later login by that LINE account keeps it `rejected` (existing `recordPending` must not flip it back — check) and still says "ไม่ได้รับอนุญาต".
  - `POST /staff/access-requests/:id/reopen` → `AccessRequest` (`rejected` → `pending`, decided fields cleared) — CD-13 R4 "คำขอที่ปฏิเสธ (n)".
- **Staff:**
  - `GET /staff` → `StaffMember[]` (`id, displayName, avatarUrl, isActive, memberships: [{ groupId, groupName, validFrom, validUntil, state: 'live' \| 'future' \| 'expired' }]`), active first, then name.
  - `GET /staff/:id` → `StaffMember`.
  - `PATCH /staff/:id` `{ displayName?, isActive? }` → `StaffMember`. `isActive: false` on yourself → `409 SELF_DEACTIVATE`; would break the lockout rule → `409 IAM_LOCKOUT`; on success revoke all the user's sessions (web + mobile). `isActive: true` reactivates (memberships unchanged).
  - `PUT /staff/:id/memberships` `{ memberships: MembershipInput[] }` → `StaffMember` — replaces the set (may be empty for a non-owner); unknown group → 400; lockout → 409 `IAM_LOCKOUT`.
  - `GET /staff/:id/effective-permissions` → `{ permissions: [{ code, sources: [{ kind: 'group' \| 'user', groupName?, policyName }] }] }` (live memberships only; CD-13 R7-6).
- **`MembershipInput`** = `{ groupId: uuid, until: 'permanent' \| 'end_of_night' \| IsoDateTime }`: `permanent` → `valid_until NULL`; `end_of_night` → the next venue business-day cut-off after now (venue setting, default 06:00 Asia/Bangkok; wall-clock time, not the test `CLOCK` — audit 053 F4); ISO → must be in the future (else 400). `valid_from` = now.
- **Lockout check** *(proposed rule above)*: computed from the DB (not the cache) inside the same transaction as the write, after applying it; `409 IAM_LOCKOUT` "ต้องมีผู้ดูแลสิทธิ์อย่างน้อย 1 คนที่ไม่มีวันหมดอายุ" with `data: { reason: 'last_manager' }`.
- **Session revoke:** `TokenService.revokeAllForUser(userId)` (new) — revokes every refresh family of the user; `authenticateAccessToken` already rejects a revoked family / inactive staff (verify; if not, make the access token fail on the next request). Add a per-user family index (`user-families:{userId}` set) if the current Redis layout can't find them.
- Contracts (`AccessRequestSchema`, `StaffMemberSchema`, `MembershipInputSchema`, `EffectivePermissionsSchema`, error codes `ACCESS_REQUEST_DECIDED`, `IAM_LOCKOUT`, `SELF_DEACTIVATE`), OpenAPI, `docs/api/README.md` Staff section.

### Out (do NOT build here)
- Tables / QR admin (own brief) · group / policy CRUD and user-policy attach (I3) · any UI · POS PIN (DR-014 #8) · audit-log rows for IAM writes (later — `created_by`/`updated_by` still filled by the subscriber) · WS `/staff` admission changes · email/LINE notifications to the approved person.

## 3. Contract
| Method | Path | Request → Response |
|---|---|---|
| GET | `/staff/access-requests?status=` | → `AccessRequest[]` |
| POST | `/staff/access-requests/:id/approve` | `{ displayName, memberships }` → `StaffMember` (201) |
| POST | `/staff/access-requests/:id/reject` | → `AccessRequest` |
| POST | `/staff/access-requests/:id/reopen` | → `AccessRequest` |
| GET | `/staff` | → `StaffMember[]` |
| GET | `/staff/:id` | → `StaffMember` |
| PATCH | `/staff/:id` | `{ displayName?, isActive? }` → `StaffMember` |
| PUT | `/staff/:id/memberships` | `{ memberships }` → `StaffMember` |
| GET | `/staff/:id/effective-permissions` | → `EffectivePermissions` |
- **Errors:** 400 `VALIDATION_ERROR` (incl. past `until`, unknown group, empty memberships on approve) · 403 `FORBIDDEN` (no `staff:manage`) · 404 · 409 `ACCESS_REQUEST_DECIDED` · 409 `IAM_LOCKOUT` · 409 `SELF_DEACTIVATE`.
- **Business rules:** most-permissive wins (I1) · membership live in `[valid_from, valid_until)` · cut-off from venue settings (DR-014 #4) · every IAM write bumps `iam:version` so the next request sees it (I1 cache) · deactivation ends every session · rejected stays rejected until reopened (CD-13 R4).

## 4. Acceptance Criteria
- **AC-1** — Unknown LINE login → pending request listed; approve with `{ displayName: 'บีม', memberships: [{ groupId: พนักงาน, until: 'permanent' }] }` → 201 `StaffMember`; that LINE account's next login succeeds and `GET /me/permissions` = the พนักงาน set. Approving again → 409 `ACCESS_REQUEST_DECIDED`.
- **AC-2** — Reject → `rejected`; the same LINE account logs in again → still refused and the request stays `rejected`; reopen → `pending` and listed again.
- **AC-3** — `until: 'end_of_night'` at 23:00 Asia/Bangkok with cut-off 06:00 → `valid_until` = next day 06:00 +07; at 03:00 → same day 06:00; with venue cut-off changed to 05:00 → 05:00. Past ISO → 400.
- **AC-4** — Membership ends → at `valid_until` the person's permissions drop on the next request (cache TTL from I1); state `expired` in `GET /staff`; `PUT` without it removes the row.
- **AC-5** — Lockout: with one owner (permanent) → removing their เจ้าของ membership, giving it an end date, or deactivating them → 409 `IAM_LOCKOUT` and nothing changes; with a second permanent owner → each succeeds.
- **AC-6** — Self-deactivate → 409 `SELF_DEACTIVATE`. Deactivate another staff member → their web session and mobile token both get 401 on the next request; their LINE login is refused; reactivate → they can log in again, old memberships intact.
- **AC-7** — Effective permissions: a ผู้จัดการ with a direct user policy (inserted by the test) → each code lists its sources (group policy and user policy).
- **AC-8** — Without `staff:manage` (ผู้จัดการ / พนักงาน) every route above → 403 `missing: ['staff:manage']`.
- **AC-9** — Every successful write bumps `iam:version` (changed permissions visible on the next request, no stale cache).
- **AC-10** — Gates + run proof pass.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2, AC-6 | integration (LINE login stubbed as in `auth.e2e-spec.ts` / `auth-mobile.e2e-spec.ts`) | `app/backend/test/iam-staff.e2e-spec.ts` |
| AC-3 | unit (cut-off math, Asia/Bangkok, cut-off change) + e2e | `modules/iam/application/membership-until.spec.ts` |
| AC-4, AC-5, AC-7 – AC-9 | integration | `app/backend/test/iam-staff.e2e-spec.ts` |

Gate commands (all must pass — **stop dev backends first**, BRIEF-053 lesson):
```bash
pnpm --filter @bar/contracts build && pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck && pnpm --filter @bar/backend test && pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:check
pnpm --filter @bar/frontend typecheck
```
Run proof (real stack, ports BRIEF-046): a second LINE account (or Metee's) logs in → refused → `GET /api/staff/access-requests` as Field shows it → approve as พนักงาน until `end_of_night` → that account logs in and gets 403 on mark-paid → Field deactivates it → its session gets 401 → Field tries to deactivate himself → 409 `SELF_DEACTIVATE` → tries to remove his own เจ้าของ (only owner) → 409 `IAM_LOCKOUT`. Trimmed output in the handoff.

### Local Sonar scan
- **Required: yes.**

## 6. Constraints
- Writes in `modules/iam` services; auth changes only in `TokenService` / `AuthService` (revoke-all, login refusal unchanged in shape).
- The lockout check reads the DB in the write's transaction (never the Redis cache); then `IamVersion.bump()` after commit.
- `save()` on audited entities; `updated_at` from triggers; no IAM table read outside the IAM module (I1 rule).
- No new dependency.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):** endpoints, schemas, error codes and `MembershipInput` in §3 · cut-off source = venue settings · reactivation allowed · the three *(proposed)* rows once Field approves.
- **Stop and raise a DR if:** revoke-all needs a different session storage model than Redis families · a schema change seems needed (none expected — tables exist since I1) · the lockout rule conflicts with I3's policy editing in a way the rule above doesn't cover.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2 (≤ 3 working days)
- [x] No unresolved decision blocking the main outcome
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-30 | Initial Draft (Cowork) — IAM I2 staff API |

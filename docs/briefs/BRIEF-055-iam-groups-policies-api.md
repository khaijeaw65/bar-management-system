# BRIEF-055 — Backend: IAM groups & policies API — custom groups, policy matrix, personal policies (I3)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-30 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 1 |
| **Depends on** | **BRIEF-053 merged** (tables, catalog, resolver, `iam:version`) · **BRIEF-054 merged** (lockout rule + its DB check, `StaffMember`, `staff:manage` routes) |
| **References** | CD-13 handoff (boards `groups` ·1–6, `policies` ·1–6; R2 matrix, R6 delete-group impact + "used by many" warning, R9 defaults under "ขั้นสูง"; §4 rows "Groups / policies CRUD") · canvas https://claude.ai/artifact/PF5pdKMY4b2w1oaunrHJH3 (artboards `Groups`, `Policies`) · CLAUDE.md IAM model (LOCKED) |
| **Audit depth** | Full (auth) |
| **Size** | ~1 day · est. ~700–900 net-new lines incl. tests |

---

## Interview — Selected (by KJ), 2026-10-30
| Q | Selected (by KJ) |
|---|---|
| Model | **Full AWS: policies + attach** — the existing CD-13 design ("ขั้นสูง · นโยบายสิทธิ์" tab edits policies; groups and people attach policies). Design unchanged (Field: "use existing design") |
| Defaults | **เจ้าของ + ทั้งหมด locked**: can't rename / edit / delete; ทั้งหมด always = every catalog code; ทั้งหมด can't be detached from เจ้าของ. Per CD-13 §9, the 3 seeded **groups** are not deletable; ผู้จัดการ / พนักงาน can change their attached policies; จัดการร้าน / งานพนักงาน policies are editable |
| Delete a group with members | **Allowed with an impact preview** (members + what each would lose, CD-13 R6); memberships removed; lockout rule applies |
| Delete a policy that is attached | **Blocked** — `409 POLICY_IN_USE` with where it's used |
| *(carried, I2)* | Personal (user) policies attach / detach live here; lockout rule from BRIEF-054 reused for every write |
| *(proposed)* Matrix write | `PUT /policies/:id/permissions { codes }` replaces the set (the UI sends the whole matrix); unknown code → 400 |
| *(proposed)* "ใช้อยู่" counts | every policy returns `usage: { groups, users, people }` (people = distinct staff reached) for the R6 warning |

## 1. Goal
The owner can shape who-can-do-what with the existing CD-13 screens: make custom groups (e.g. แคชเชียร์), edit what a policy allows with the switch matrix, attach policies to groups or to one person — and never lock the bar out.

## 2. Scope
### In (all `@RequirePermissions('staff:manage')`; every write bumps `iam:version` and runs the BRIEF-054 lockout check in its transaction)
- **Groups `/staff-groups`:**
  - `GET` → `StaffGroup[]` (`id, name, description, system: 'owner' | 'manager' | 'staff' | null, policyIds, memberCount`), system groups first.
  - `POST` `{ name, description?, policyIds: uuid[] }` → `StaffGroup` (201); name unique (case-insensitive, trimmed) → `409 GROUP_NAME_TAKEN`.
  - `PATCH /:id` `{ name?, description? }` → เจ้าของ → `409 SYSTEM_ROW`; ผู้จัดการ / พนักงาน may change description only (name fixed — seeds and docs refer to them) *(proposed)*.
  - `PUT /:id/policies` `{ policyIds }` → replaces the attached set; เจ้าของ → `409 SYSTEM_ROW`.
  - `GET /:id/delete-impact` → `{ members: [{ staffId, displayName, losing: PermissionCode[] }] }` — `losing` = codes that person would no longer have from anywhere after the delete (most-permissive wins).
  - `DELETE /:id` → removes the group, its policy links and memberships; any system group → `409 SYSTEM_ROW`; lockout → `409 IAM_LOCKOUT`.
- **Policies `/policies`:**
  - `GET` → `Policy[]` (`id, name, description, system: 'all' | null, codes: PermissionCode[], usage: { groups, users, people }`).
  - `POST` `{ name, description?, codes }` → `Policy` (201); name unique → `409 POLICY_NAME_TAKEN`.
  - `PATCH /:id` `{ name?, description? }` · `PUT /:id/permissions` `{ codes }` — ทั้งหมด → `409 SYSTEM_ROW`; lockout applies (e.g. removing `staff:manage` from the only policy that gives it).
  - `DELETE /:id` → attached anywhere → `409 POLICY_IN_USE` `data: { groups: [names], users: [names] }`; ทั้งหมด → `409 SYSTEM_ROW`.
- **Personal policies:** `PUT /staff/:id/policies` `{ policyIds }` → `StaffMember` (BRIEF-054 shape + `policyIds`); lockout applies. `GET /staff/:id/effective-permissions` (I2) already shows them as `kind: 'user'`.
- **Catalog for the matrix:** `GET /permissions/catalog` → `[{ resource, label, actions: [{ code, label }] }]` with the Thai labels the CD-13 matrix uses (labels in contracts, one place) — the UI builds rows / switch cards from it.
- **ทั้งหมด stays complete:** a startup (or migration-time) check adds any catalog code missing from ทั้งหมด (so future codes like `orders:void` join it automatically).
- Contracts (`StaffGroupSchema`, `PolicySchema`, `PermissionCatalogSchema`, inputs, `DeleteImpactSchema`, error codes `SYSTEM_ROW`, `GROUP_NAME_TAKEN`, `POLICY_NAME_TAKEN`, `POLICY_IN_USE`), OpenAPI, `docs/api/README.md` (IAM admin section).

### Out (do NOT build here)
- Any UI (next: IAM UI briefs on CD-13) · tables / QR admin (own brief) · new permission codes (they come with the brief that needs them) · audit-log rows for IAM writes · explicit deny (never — most-permissive wins).

## 3. Contract
| Method | Path | Request → Response |
|---|---|---|
| GET | `/permissions/catalog` | → `PermissionCatalog` |
| GET / POST | `/staff-groups` | → `StaffGroup[]` / `{ name, description?, policyIds }` → `StaffGroup` |
| PATCH | `/staff-groups/:id` | `{ name?, description? }` → `StaffGroup` |
| PUT | `/staff-groups/:id/policies` | `{ policyIds }` → `StaffGroup` |
| GET | `/staff-groups/:id/delete-impact` | → `DeleteImpact` |
| DELETE | `/staff-groups/:id` | → `{ ok: true }` |
| GET / POST | `/policies` | → `Policy[]` / `{ name, description?, codes }` → `Policy` |
| PATCH | `/policies/:id` | `{ name?, description? }` → `Policy` |
| PUT | `/policies/:id/permissions` | `{ codes }` → `Policy` |
| DELETE | `/policies/:id` | → `{ ok: true }` |
| PUT | `/staff/:id/policies` | `{ policyIds }` → `StaffMember` |
- **Errors:** 400 `VALIDATION_ERROR` (unknown code / id) · 403 `FORBIDDEN` · 404 · 409 `SYSTEM_ROW` · 409 `GROUP_NAME_TAKEN` · 409 `POLICY_NAME_TAKEN` · 409 `POLICY_IN_USE` · 409 `IAM_LOCKOUT`.
- **Business rules:** most-permissive wins, no deny · ทั้งหมด = whole catalog, attached to เจ้าของ forever · system groups never deleted · every write effective on the next request (version bump) · lockout rule (BRIEF-054) on every write.

## 4. Acceptance Criteria
- **AC-1** — Job 1: create policy "รับเงิน" `{ codes: ['payments:read','payments:create','payments:mark_paid'] }` → create group "แคชเชียร์" with `[งานพนักงาน, รับเงิน]` → put a พนักงาน into it → that person's mark-paid → 200 on the next request; `GET /policies` shows รับเงิน `usage.groups = 1, people = 1`.
- **AC-2** — Job 2: `PUT /staff/:id/policies { [รับเงิน] }` on a พนักงาน → mark-paid 200; `effective-permissions` lists `payments:mark_paid` with `kind: 'user'`; removing it → 403 again.
- **AC-3** — System rows: rename/edit/delete เจ้าของ, edit `PUT /policies/<ทั้งหมด>/permissions`, delete ทั้งหมด, detach ทั้งหมด from เจ้าของ, delete ผู้จัดการ / พนักงาน → each `409 SYSTEM_ROW`, nothing changed.
- **AC-4** — Delete impact + delete: custom group with 2 members, one also in ผู้จัดการ → impact lists only the codes each would truly lose; `DELETE` → memberships gone, permissions drop on the next request.
- **AC-5** — Policy in use: delete รับเงิน while attached → `409 POLICY_IN_USE` naming the group and person; after detaching everywhere → 200.
- **AC-6** — Lockout: with one owner and a custom policy that is the only other `staff:manage` source — removing `staff:manage` from a policy, detaching it, or deleting a group so that nobody holds `staff:manage` permanently → `409 IAM_LOCKOUT` (the owner still holds it via ทั้งหมด, so a normal setup never trips — test builds the edge case).
- **AC-7** — Catalog: `GET /permissions/catalog` lists every code once with Thai labels, grouped by resource; a code added to the catalog in code appears in ทั้งหมด after restart.
- **AC-8** — Names: duplicate group / policy names (case- and space-insensitive) → 409 `*_NAME_TAKEN`; unknown code in a matrix write → 400.
- **AC-9** — Without `staff:manage` every route → 403 `missing: ['staff:manage']`.
- **AC-10** — Gates + run proof pass.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1 – AC-6, AC-8, AC-9 | integration (real Postgres + Redis) | `app/backend/test/iam-admin.e2e-spec.ts` |
| AC-4 (`losing` math), AC-6 | unit | `modules/iam/application/*.spec.ts` |
| AC-7 | integration + contracts test | `app/backend/test/iam-seed.e2e-spec.ts` (extend) · `packages/contracts/src/schemas/permissions.test.ts` |

Gate commands (stop dev backends first):
```bash
pnpm --filter @bar/contracts build && pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck && pnpm --filter @bar/backend test && pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:check
pnpm --filter @bar/frontend typecheck
```
Run proof (real stack): as Field (LINE) — Job 1 and Job 2 via `curl` with your session (or a minted owner token) against the Demo พนักงาน → mark-paid 200 after each, 403 after undoing; try deleting เจ้าของ → 409; delete-impact on แคชเชียร์ → delete. Trimmed output in the handoff.

### Local Sonar scan
- **Required: yes.**

## 6. Constraints
- All IAM writes in `modules/iam` services; reads for authorisation still only through the resolver (I1).
- Lockout check (BRIEF-054) shared, never re-implemented; it runs in the same transaction as the write.
- No schema change (tables from I1); if `system` markers need a column → use the fixed seed ids (`DEFAULT_GROUP_IDS`, policy ids) instead *(preferred)*; a column needs a DR.
- `save()` on audited entities; no new dependency.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):** routes and schemas in §3 (CD-13 §4 paths `/staff-groups`, `/policies`) · defaults rules above · delete rules above · the three *(proposed)* rows once Field approves (matrix replace, usage counts, ผู้จัดการ / พนักงาน names fixed).
- **Stop and raise a DR if:** a schema change seems needed · the lockout rule can't express a case · the CD-13 design would need to change.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-30 | Initial Draft (Cowork) — IAM I3 groups & policies API |
| 1 | 2026-10-30 | Ready — Field in session: "approve BRIEF-055 Rev 1 Ready" (incl. the three *(proposed)* rows) |

# Handoff — BRIEF-058 Web: groups & policies UI (U2)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-31 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-058-groups-policies-ui` (PR opens after audit PASS) |
| **Commit** | `59aea49` (work SHA S) |
| **Status** | Audit PASS (Cowork, round 2, S `33bd61d`) — merged PR determines Done |

## Summary
New tabs "กลุ่มสิทธิ์" and "นโยบายสิทธิ์ · ขั้นสูง" (route map: `/pos/settings/(staff|groups|policies)` → `staff:manage`).
- `/pos/settings/groups`: system groups first (badge, no delete), create / edit modal, delete with the `delete-impact` list, "สมาชิก n" computed from `GET /staff` (live + future only).
- `/pos/settings/policies`: list with code count + usage; matrix editor (one card per catalog resource, "ทั้งหมด" per resource, code shown small, sticky bar "แก้ไข n รายการ · บันทึก / ยกเลิก", used-by-many confirm, `IAM_LOCKOUT` / `POLICY_IN_USE` alerts); create, rename, delete. ทั้งหมด is read-only.
- Staff detail: "นโยบายส่วนตัว" panel (`PUT /staff/:id/policies`).
- Self-impact warning (`useSelfGuard` + `lib/permissions/selfImpact.ts`): warn, never block, before a write that removes the current user's own `staff:manage`.
- All writes refresh groups, policies, staff, effective and `/me/permissions`. No backend, contract or dependency change. MSW: stateful IAM mock (`mocks/iam.ts`) replaces the static groups in `mocks/staff.ts`.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `e2e/settings-groups-policies.spec.ts::J1` · `PoliciesScreen.test::AC-1` · `GroupsScreen.test::AC-1` |
| AC-2 | ✅ | `PoliciesScreen.test::AC-2…` |
| AC-3 | ✅ | `PoliciesScreen.test::AC-3` ×2 |
| AC-4 | ✅ | `GroupsScreen.test::AC-4…` |
| AC-5 | ✅ | `GroupsScreen.test::AC-5…` + empty-group test |
| AC-6 | ✅ | `PoliciesScreen.test::AC-6…` |
| AC-7 | ✅ | `PoliciesScreen.test::AC-7…` · delete lockout in `GroupsScreen.test` |
| AC-8 | ✅ | `PersonalPoliciesPanel.test::AC-8…` |
| AC-9 | ✅ | `GroupsScreen.test::AC-9` · `PoliciesScreen.test::AC-9` · `selfImpact.test` |
| AC-10 | ✅ | `e2e …::J2 (390)` (page area no overflow, save bar in viewport) · manager tab-hidden e2e |
| AC-11 | ✅ | gates ✅; real-stack run proof below (audit finding #1) |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/frontend lint` | 0 | pass |
| `pnpm --filter @bar/frontend typecheck` | 0 | pass |
| `pnpm --filter @bar/frontend test` | 0 | 66 files · 317 passed |
| `pnpm --filter @bar/frontend test:e2e` | 0* | 52 passed; one `customer-pay` AC-10 failed once under full load, passed on rerun (8/8 with the new spec) |
| `pnpm --filter @bar/frontend build` | 0 | pass |
| `migration:run` → `start:dev` → `/api/health` | 0 | no migrations pending; health 200 on `a712a3c` (backend unchanged) |

**Real-stack run proof** (dev DB `bar`, backend 3011 + frontend 3010 on `59aea49`; hand-signed 2 h access tokens + Redis sessions for "Field (demo)" (เจ้าของ) and Demo พนักงาน; headless Playwright `page.screenshot()`; screenshots in `docs/handoffs/assets/BRIEF-058/`):
1. Demo พนักงาน (พนักงาน only): T2 checkout → สร้าง QR → no "ยืนยันด้วยตนเอง" button, hint "ให้ผู้จัดการยืนยันรับเงิน" shown.
2. Owner at 1280: created policy รับเงิน (ดู / เปิดบิล / ยืนยันรับเงิน) in the matrix (`4-policy-matrix-1280`), then group แคชเชียร์ = งานพนักงาน + รับเงิน (`2-group-create-1280`, list `1-groups-list-1280`).
3. Owner put Demo พนักงาน in แคชเชียร์ (U1 add group, ถาวร) → staff T2 checkout: manual-confirm button **present**, hint gone.
4. Owner deleted แคชเชียร์: impact dialog listed "Demo พนักงาน — จะเสีย: ยืนยันรับเงิน" (`3-delete-impact-1280`) → confirmed → staff checkout: button **gone**, hint back. (Retaken once for a clean frame; the first delete + group re-create happened in the same session.)
5. Owner added รับเงิน as a personal policy on Demo พนักงาน → chip + effective "ส่วนตัว · นโยบาย รับเงิน" (`7-staff-personal-policy-1280`) → staff checkout: button **present**.
6. While attached, deleting รับเงิน → `POLICY_IN_USE` alert "คน: Demo พนักงาน" with a link (`6-policy-in-use-1280`). Matrix at 390: cards + switches, `main` has no horizontal overflow, sticky save bar visible (`5-policy-matrix-390`).
7. Owner removed the personal policy → staff checkout: button **gone**, hint back. Policy รับเงิน then deleted (AC-6 second half).

Cleanup verified: dev DB has only the 3 seeded groups and 3 seeded policies, no personal policies, no แคชเชียร์ members. Each staff checkout check created and then cancelled a ฿10 QR payment on T2 (5 extra `cancelled` rows; T2 stays unpaid). Not captured live: the self-impact warning and the lockout alert (covered by component tests). Observations: the Next dev badge overlaps the left of the sticky save bar label in the dev screenshots (dev-only); the sticky bar spans under the left rail at ≥ md (cosmetic, not changed).

## Deviations / notes
- Matrix is one responsive card-per-resource with Switches (row-like at ≥ md) instead of Table + CheckboxGroup at 1280 — single DOM, visual approximation of CD-13 §8; no design data changed.
- HeroUI hides the native switch input under its label; Playwright flips switches via the label.
- Policy editor opens in-page (no extra route) from the list.

## Sonar (local scan)
- Scanned commit: 59aea49 · Quality Gate: ERROR (`new_coverage` 0 % — known; `new_violations` 23)
- Issues: BLOCKER 0 · HIGH 7 · MEDIUM 8 · LOW 8 · INFO 0
- Remaining in BRIEF-058 files: 1 — `typescript:S3776` `PolicyEditor.tsx:51` (component complexity just over 15 after splitting the draft state, save bar and persist; the rest is the state + handlers of one form). Others are the known pre-existing set.
- Who fixed: agent (Field's own brief)

## Decisions Raised
none

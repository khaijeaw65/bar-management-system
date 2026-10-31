# BRIEF-058 — Web: groups & policies UI — custom groups, switch matrix, personal policies (U2)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-31 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | frontend |
| **Revision** | 1 |
| **Depends on** | BRIEF-055 ✅ (groups / policies / catalog / personal-policy API) · BRIEF-056 ✅ (permission hook + guard) · **BRIEF-057 merged** (settings shell, staff detail) |
| **References** | CD-13 handoff (boards `groups` ·1–6, `policies` ·1–6, `staff-detail`; R2 matrix, R6 delete impact + used-by warning, R9 "ขั้นสูง"; D4 guards; §4 row "Groups / policies CRUD" — Toast "มีผลทันที"; §8 matrix = Table + CheckboxGroup at 1280 / Card + Switch at 390) · canvas https://claude.ai/artifact/PF5pdKMY4b2w1oaunrHJH3 (artboards `Groups`, `Policies`) · BRIEF-055 §3 · audit BRIEF-055 Finding 3 (`memberCount` includes expired) |
| **Audit depth** | Full (who can do what) |
| **Size** | ~1–1.5 days · est. ~900–1,100 net-new lines incl. tests |

---

## Interview — Selected (by KJ), 2026-10-31
| Q | Selected (by KJ) |
|---|---|
| Model | Full AWS policies + attach — **existing CD-13 design, unchanged** |
| Layout | Responsive 1280 / 1024 / 390 (as U1) |
| Routes | `/pos/settings/groups`, `/pos/settings/policies` (tab "นโยบายสิทธิ์ · ขั้นสูง") |
| *(proposed)* Matrix save | Explicit **"บันทึก"** with a sticky bar showing the change count (policies·2 → ·3); policy used by > 1 group or person → confirm with the names first (policies·4) |
| *(proposed)* Personal policies | A "นโยบายส่วนตัว" section on the U1 staff detail (attach / remove existing policies → `PUT /staff/:id/policies`) — the one place a person-level exception lives |
| *(proposed)* Member count label | Groups show **"สมาชิก n"** = live + future memberships only (computed client-side from `GET /staff`), not the expired-included `memberCount` (audit 055 F3) |
| *(proposed)* CD-13 D4 "nobody can remove their own `staff:manage`" | **Not enforced in S1** beyond the server lockout rule (someone must keep it permanently); the UI warns before a change that would remove the current user's own `staff:manage` ("คุณจะไม่สามารถจัดการสิทธิ์ได้อีก") but allows it |

## 1. Goal
The owner can make a custom group (e.g. แคชเชียร์) from existing policies, edit what a policy allows with the switch matrix under "ขั้นสูง", give one person an extra policy, and delete a group knowing exactly who loses what — while the defaults and the lockout rule keep the bar safe.

## 2. Scope
### In
- **`/pos/settings/groups`** (groups·1–6): list — system groups first (เจ้าของ / ผู้จัดการ / พนักงาน, badge "ค่าเริ่มต้น", no delete), custom groups after; each row: name, description, attached policy chips, "สมาชิก n" *(proposed count)*.
  - **Create** "+ สร้างกลุ่ม" → modal: name, description, policies (checkbox list from `GET /policies`, ≥ 0) → `POST /staff-groups`; `GROUP_NAME_TAKEN` → field error.
  - **Edit** (custom: name, description, policies; ผู้จัดการ / พนักงาน: description + policies only; เจ้าของ: read-only with "กลุ่มเจ้าของมีทุกสิทธิ์เสมอ") → `PATCH` + `PUT …/policies`.
  - **Delete** (custom only) → `GET …/delete-impact` → confirm dialog listing each member and the permissions they would lose in Thai labels (groups·4; "ไม่มีใครเสียสิทธิ์" when empty) → `DELETE`; `IAM_LOCKOUT` → Alert.
- **`/pos/settings/policies`** (policies·1–6): list with code count and "ใช้อยู่ n กลุ่ม · n คน" from `usage`; ทั้งหมด marked "ระบบ · ทุกสิทธิ์" (read-only); "+ สร้างนโยบาย".
  - **Edit matrix** (policies·2, ·6): rows/cards per resource from `GET /permissions/catalog` (Thai labels), a "ทั้งหมด" toggle per resource, a switch/checkbox per action with its code shown small; sticky bar "แก้ไข n รายการ · บันทึก / ยกเลิก" *(proposed)*; used-by-many confirm (policies·4) → `PUT /policies/:id/permissions { codes }` (full set) → Toast "มีผลทันที" (policies·3); `IAM_LOCKOUT` → policies·5 Alert, nothing saved.
  - **Rename / description** → `PATCH`; **delete** (unused only; in use → `POLICY_IN_USE` Alert naming groups and people, with links) → `DELETE`.
- **Staff detail (U1 page) — "นโยบายส่วนตัว"** *(proposed)*: chips of attached personal policies + "เพิ่มนโยบาย" (select from `GET /policies`) + remove → `PUT /staff/:id/policies`; effective-permissions panel refreshes (source "ส่วนตัว").
- **Self-impact warning** *(proposed D4)*: before any group / policy / personal-policy write, compute (client side, from the current user's effective sources) whether the user would lose `staff:manage` → confirm "คุณจะไม่สามารถจัดการสิทธิ์ได้อีก" first.
- After every write: invalidate groups, policies, staff, effective-permissions and `/me/permissions` queries.
- **MSW** handlers for groups / policies / catalog / personal policies (role-aware); **tests**: component (matrix toggles + resource "ทั้งหมด", change count, used-by confirm, system rows read-only, delete impact dialog, POLICY_IN_USE, lockout alert, self-impact warning), Playwright: Job 1 (create policy "รับเงิน" → group "แคชเชียร์") at 1280 and matrix edit at 390.

### Out (do NOT build here)
- Tables & QR admin · new permission codes · POS PIN · audit history of IAM changes · any backend change.

## 3. Contract
- **Uses (BRIEF-055 / 054):** `GET /permissions/catalog` · `GET/POST /staff-groups`, `PATCH /staff-groups/:id`, `PUT /staff-groups/:id/policies`, `GET /staff-groups/:id/delete-impact`, `DELETE /staff-groups/:id` · `GET/POST /policies`, `PATCH /policies/:id`, `PUT /policies/:id/permissions`, `DELETE /policies/:id` · `PUT /staff/:id/policies` · `GET /staff`, `GET /staff/:id/effective-permissions`, `GET /me/permissions`.
- **Contracts changes:** none.
- **Business rules:** most-permissive wins (no deny UI) · เจ้าของ + ทั้งหมด locked; 3 seeded groups not deletable · policy in use can't be deleted · lockout enforced by the server, explained by the UI · every change effective on the next request ("มีผลทันที").

## 4. Acceptance Criteria
- **AC-1 (Job 1, 1280)** — Create policy "รับเงิน" with การชำระเงิน: ดู, สร้าง, ยืนยันรับเงินเอง → create group "แคชเชียร์" with งานพนักงาน + รับเงิน → list shows it with both chips; Toast "มีผลทันที".
- **AC-2** — Matrix: resource "ทั้งหมด" toggles every action in that row; change count in the sticky bar; ยกเลิก restores; บันทึก sends the full code set once.
- **AC-3** — Editing a policy used by 2 groups → confirm naming them before saving; ทั้งหมด opens read-only.
- **AC-4** — System groups: no delete action; เจ้าของ read-only; ผู้จัดการ name field disabled, description / policies editable.
- **AC-5** — Delete "แคชเชียร์" with 2 members → dialog lists each member with the Thai labels they'd lose (one member also in ผู้จัดการ loses nothing → "ไม่เสียสิทธิ์"); confirm → gone; their effective permissions update.
- **AC-6** — Delete an attached policy → `POLICY_IN_USE` Alert naming group and person; after detaching, delete works.
- **AC-7** — A change the server refuses with `IAM_LOCKOUT` → Alert (policies·5 copy), matrix keeps the user's edits unsaved, nothing changed on reload.
- **AC-8** — Staff detail: add personal policy "รับเงิน" → chip + effective permissions show `payments:mark_paid` with source "ส่วนตัว · รับเงิน"; remove → gone.
- **AC-9** — Self-impact: an edit that would remove the current user's own `staff:manage` → warning confirm first; cancel → nothing sent.
- **AC-10** — 390 (policies·6): card per resource with switches, no horizontal scroll, sticky save bar reachable by thumb; tabs hidden without `staff:manage` (U0/U1).
- **AC-11** — Gates + run proof pass.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-10 | Playwright (1280 / 390, MSW) | `app/frontend/e2e/settings-groups-policies.spec.ts` |
| AC-2 – AC-9 | component | `src/app/pos/settings/(groups|policies|staff)/**/_components/*.test.tsx` |

Gate commands:
```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend test:e2e
pnpm --filter @bar/frontend build
```
Run proof (real stack, Field's LINE login or minted owner token): Job 1 in the UI → put Demo พนักงาน in แคชเชียร์ (U1) → Demo พนักงาน's checkout now shows manual confirm (BRIEF-056 after refetch) → delete แคชเชียร์ with impact dialog → manual confirm gone again → Job 2: personal policy on the staff detail → shows again → remove. Screenshots in `docs/handoffs/assets/BRIEF-058/` (groups list, create, delete impact, policy matrix 1280 + 390, POLICY_IN_USE, staff detail personal policy).

### Local Sonar scan
- **Required: yes.**

## 6. Constraints
- Matrix rows come only from `GET /permissions/catalog` (no hard-coded codes or labels in the UI).
- Permission decisions only via the BRIEF-056 hook; never from group names.
- Full-set writes (`PUT`) built from the server's last response.
- DS tokens, HeroUI v3 per CD-13 §8 (Table + CheckboxGroup at 1280, Card + Switch at 390, Modal, Alert, Toast); Thai copy from CD-13 §6; no new dependency.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):** routes above · design unchanged · the four *(proposed)* rows once Field approves.
- **Stop and raise a DR if:** the API lacks data a CD-13 state needs · the design would need to change.

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
| 1 | 2026-10-31 | Initial Draft (Cowork) — IAM UI U2 groups & policies |
| 1 | 2026-10-31 | Ready — Field in session: "approve BRIEF-058 Rev 1 Ready" (incl. the four *(proposed)* rows; D4 = warn, not block) |

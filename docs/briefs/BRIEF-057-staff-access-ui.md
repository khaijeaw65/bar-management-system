# BRIEF-057 — Web: settings shell + staff & access requests UI (U1)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-31 |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | frontend |
| **Revision** | 1 |
| **Depends on** | BRIEF-054 ✅ (staff API) · **BRIEF-055 merged** (`GET /staff-groups` for the group picker) · **BRIEF-056 merged** (`usePermissions`, `RequirePermission`, route map) |
| **References** | CD-13 handoff (boards `settings` ·1–4, `staff` ·1–6, `staff · 390` ·1–4, `staff-detail` ·1–5, J1, J2; R3 cut-off, R4 rejected re-login, R6 rules, R7 API; §6 copy, §7 layout, §8 components) · canvas https://claude.ai/artifact/PF5pdKMY4b2w1oaunrHJH3 · BRIEF-054 §3 · audit BRIEF-054 Finding 3 (real-LINE approval proof belongs here) |
| **Audit depth** | Full (who gets access to the bar's system) |
| **Size** | ~1.5 days · est. ~1,100–1,400 net-new lines incl. tests |

---

## Interview — Selected (by KJ), 2026-10-31
| Q | Selected (by KJ) |
|---|---|
| Split | U0 permission-aware POS (BRIEF-056) → **U1 this** → U2 groups & policies |
| Layout | Responsive **1280 / 1024 / 390** per CD-13 (J2 is a phone job at night) |
| Routes | `/pos/settings` (ร้าน, existing) · **`/pos/settings/staff`** · **`/pos/settings/staff/[staffId]`** · `/pos/settings/groups`, `/pos/settings/policies` (U2) · `/pos/settings/tables` (later) |
| New request notice | **Count + dot, poll 60 s** — "พนักงาน (2)" in the settings sub-nav and a dot on the ตั้งค่า rail item for users with `staff:manage`; `GET /staff/access-requests` every 60 s + on focus; no backend change (WS event later if ever needed) |
| POS PIN (staff-detail·6) | Out — with BRIEF-018 |
| Design | Existing CD-13, unchanged |

## 1. Goal
The owner lets a new hire in from their LINE request in three taps (J1), and from a phone at night can hand someone manager rights until tonight's close (J2), see exactly what each person can do and why, and switch an account off — with the system refusing anything that would lock the bar out.

## 2. Scope
### In
- **Settings shell** (`src/app/pos/settings/layout.tsx`): sub-nav ร้าน · พนักงาน · กลุ่ม · นโยบาย (ขั้นสูง) · โต๊ะ & QR — each tab shown only if its page is allowed (BRIEF-056 map; U1 adds `/pos/settings/staff*` → `staff:manage`; กลุ่ม / นโยบาย / โต๊ะ tabs appear when their briefs add the routes). Tabs at 1280 / 1024 (settings·1–2), nav drawer at 390 (settings·3–4). Existing venue form moves under the shell unchanged.
- **Request notice:** `useAccessRequests()` (poll 60 s + focus, only with `staff:manage`) → count on the พนักงาน tab, dot on the ตั้งค่า rail item.
- **`/pos/settings/staff`** (staff·1–6, staff·390·1–4):
  - **Requests section** (pending): LINE avatar, name, time; "อนุมัติ" → approve modal (J1): ชื่อที่แสดง (prefilled from LINE, ≤ 200), groups as checkboxes (≥ 1, from `GET /staff-groups`), per ticked group a ระยะเวลา radio **ถาวร / ถึงสิ้นกะคืนนี้ / กำหนดเอง** (date + time, future only) → `POST …/approve` with `until: 'permanent' | 'end_of_night' | ISO`; "ปฏิเสธ" → confirm dialog (staff·4) → `POST …/reject`. No requests → empty state (staff·2). Link **"คำขอที่ปฏิเสธ (n)"** → list with "เปิดคำขออีกครั้ง" (`…/reopen`, CD-13 R4).
  - **Staff list:** avatar, name, groups as chips (time-bound chip shows "ถึง 06:00"; expired struck "หมดอายุ"), active switch. Deactivate → confirm "ออกจากระบบทุกอุปกรณ์ทันที" (staff·5) → `PATCH { isActive: false }`; self → switch disabled + Toast (staff·6, `SELF_DEACTIVATE` also handled); reactivate from the same switch.
- **`/pos/settings/staff/[staffId]`** (staff-detail·1–5): header (name — inline rename `PATCH { displayName }`, active switch); **Memberships** list with state (live / future "เริ่ม …" / expired struck) and "เพิ่มกลุ่ม" → modal (group select + ถาวร / ถึงสิ้นกะคืนนี้ / กำหนดเอง) and per-row remove — every change sends the full set to `PUT /staff/:id/memberships`; **Effective permissions** panel from `GET /staff/:id/effective-permissions`: grouped by resource with Thai labels (`GET /permissions/catalog`), each code with its source chips ("กลุ่ม ผู้จัดการ · นโยบาย จัดการร้าน" / "ส่วนตัว · นโยบาย รับเงิน"). Personal policies are shown read-only here (editing them = U2).
- **Errors (CD-13 §4):** `IAM_LOCKOUT` → Alert "ต้องมีผู้ดูแลสิทธิ์อย่างน้อย 1 คนที่ไม่มีวันหมดอายุ" and the change is not applied (state refetched); `ACCESS_REQUEST_DECIDED` → Toast "คำขอนี้ถูกจัดการแล้ว" + refetch; `SELF_DEACTIVATE` → Toast; network → retry.
- **After any IAM write:** invalidate staff, requests, `/me/permissions` (BRIEF-056 hook) queries — the owner's own UI updates if they changed themselves.
- **MSW** handlers for the staff API (role-aware via BRIEF-056's `setRole`), **tests**: component (approve modal validation, until modes, lockout alert, self-toggle disabled, expired struck, effective-permission sources), Playwright J1 (1280) and J2 (390).

### Out (do NOT build here)
- Groups / policies screens and personal-policy editing (U2) · tables & QR admin · POS PIN (BRIEF-018) · WS notice for new requests · any backend change.

## 3. Contract
- **Uses (BRIEF-054 / 055):** `GET /staff/access-requests?status=`, `POST …/:id/approve | reject | reopen`, `GET /staff`, `GET /staff/:id`, `PATCH /staff/:id`, `PUT /staff/:id/memberships`, `GET /staff/:id/effective-permissions`, `GET /staff-groups`, `GET /permissions/catalog`, `GET /me/permissions`.
- **Contracts changes:** none.
- **Business rules:** approve needs ≥ 1 group · "ถึงสิ้นกะคืนนี้" computed by the server (venue cut-off) — the UI shows the returned `validUntil` ("ถึง 06:00 พรุ่งนี้") · custom date must be in the future · lockout rule enforced by the server; the UI only explains it · deactivation logs the person out everywhere (BRIEF-054).

## 4. Acceptance Criteria
- **AC-1 (J1, 1280)** — Pending request "ฝน" → อนุมัติ → name prefilled → tick พนักงาน → ถาวร → อนุมัติ → ฝน appears in the list with chip พนักงาน, highlighted, Toast; requests count drops by one.
- **AC-2 (J2, 390)** — Staff "เจ" → detail → เพิ่มกลุ่ม → ผู้จัดการ → ถึงสิ้นกะคืนนี้ → เพิ่มกลุ่ม → chip "ผู้จัดการ · ถึง 06:00" and the effective-permissions panel now lists manager codes with source "กลุ่ม ผู้จัดการ".
- **AC-3** — Reject with confirm → request leaves pending; "คำขอที่ปฏิเสธ (1)" → เปิดคำขออีกครั้ง → back in pending.
- **AC-4** — Approve with no group ticked → button disabled with hint; custom date in the past → field error; server 400 shown inline.
- **AC-5** — Removing the only owner's เจ้าของ (or deactivating them) → server `IAM_LOCKOUT` → Alert with the Thai copy; list unchanged after refetch.
- **AC-6** — Own row: active switch disabled with the reason; deactivating someone else → confirm → their chip list greys, switch off; reactivate → back.
- **AC-7** — Expired membership shows struck "หมดอายุ"; a future one "เริ่ม …"; removing an expired row sends the full set without it.
- **AC-8** — Requests count on the พนักงาน tab and the rail dot appear only for a user with `staff:manage` and update within 60 s of a new request (fake timers in test).
- **AC-9** — A user without `staff:manage` doesn't see the พนักงาน tab; opening `/pos/settings/staff` by URL → "ไม่มีสิทธิ์" (BRIEF-056).
- **AC-10** — 1280, 1024, 390: no horizontal scroll; 390 uses the drawer nav; targets ≥ 44 px.
- **AC-11** — Gates + run proof pass.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2 | Playwright (1280 / 390, MSW) | `app/frontend/e2e/settings-staff.spec.ts` |
| AC-3 – AC-9 | component (Vitest + Testing Library) | `src/app/pos/settings/staff/**/_components/*.test.tsx` |
| AC-10 | Playwright viewport checks | `app/frontend/e2e/settings-staff.spec.ts` |

Gate commands:
```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend test:e2e
pnpm --filter @bar/frontend build
```
Run proof (real stack, ports BRIEF-046) — **includes the real-LINE approval carried from BRIEF-054**: Metee (or a second LINE account) logs in on `localhost:3010` → refused → Field (LINE, 1280) sees "พนักงาน (1)" within 60 s → approves him as พนักงาน ถาวร → Metee logs in again → POS shows the พนักงาน view (BRIEF-056 hiding) → Field on 390 gives him ผู้จัดการ ถึงสิ้นกะคืนนี้ → Metee's checkout now shows manual confirm (after refetch) → Field deactivates him → Metee's session ends. Screenshots (headless or real) in `docs/handoffs/assets/BRIEF-057/`: requests + approve modal, staff list, detail with time-bound chip + permissions panel (1280), J2 on 390, lockout alert.

### Local Sonar scan
- **Required: yes.**

## 6. Constraints
- `docs/rules/frontend.md` Hard Limits; DS tokens only; HeroUI v3 per CD-13 §8 (Modal, Checkbox, RadioGroup, DatePicker / TimeInput via Input + icon per R8, Switch, Chip, Alert, Toast, Drawer for the 390 nav).
- Permission checks only via BRIEF-056's hook / guard — never from group names.
- Memberships always written as the full set (`PUT`), built from the server's last response (no client-side merge drift).
- Thai copy from CD-13 §6; no new dependency.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):** routes above · settings shell in `src/app/pos/settings/layout.tsx` · poll-based request notice · PIN out · design unchanged.
- **Stop and raise a DR if:** a screen needs data the BRIEF-054/055 API doesn't return · the CD-13 design would need to change.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2 (≤ 3 working days)
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-31 | Initial Draft (Cowork) — IAM UI U1 settings shell + staff & access requests |
| 1 | 2026-10-31 | Ready — Field in session: "approve BRIEF-057 Rev 1 Ready" |

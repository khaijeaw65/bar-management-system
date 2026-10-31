# BRIEF-056 — Web POS: permission-aware UI — hide what you can't do, "ไม่มีสิทธิ์" on direct URLs (U0)

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | frontend |
| **Revision** | 1 |
| **Depends on** | BRIEF-053 ✅ (`GET /me/permissions`, 403 `data.missing`) · BRIEF-054 ✅ · **BRIEF-055 merged** (catalog incl. `staff:manage` routes U1/U2 will hide) |
| **References** | CD-13 R7 (actions hidden without permission) · CD-14 R7 (สั่งออเดอร์ hidden without `orders:create`) · BRIEF-053 §3 (catalog, default policies) · `docs/api/README.md` permissions section |
| **Audit depth** | Full (every POS screen touched) |
| **Size** | ~1 day · est. ~600–800 net-new lines incl. tests |

---

## Interview — Selected (by KJ), 2026-10-31
| Q | Selected (by KJ) |
|---|---|
| IAM UI split | **U0 (this): permission-aware POS** → U1 staff & access requests → U2 groups & policies (all responsive 1280 / 1024 / 390 per CD-13) |
| Scope of hiding | **Everywhere now** (POS-wide), in its own brief before U1 |
| Can't do it | **Hide it**; opening the URL directly → a **"ไม่มีสิทธิ์"** screen |
| POS PIN | Out — with BRIEF-018 |
| *(proposed)* Refresh of the permission set | `usePermissions()` = TanStack query on `GET /me/permissions`, refetched on window focus, every 60 s, and immediately after any API `403` whose `data.missing` is set (the server is the truth); while loading, permission-gated actions stay hidden (no flash of a button that then disappears) |
| *(proposed)* Rail items without any page permission | hidden (not greyed) |

## 1. Goal
A ผู้จัดการ or พนักงาน only sees the POS screens and buttons they can actually use; a page opened by URL without the permission says "ไม่มีสิทธิ์" instead of breaking; any stray 403 is explained, not a raw error.

## 2. Scope
### In
- **`src/lib/permissions/`**: `usePermissions()` → `{ can(code), canAll(...codes), canAny(...codes), status }`; `<Can code=… [anyOf=…]>` wrapper; query key `['me','permissions']`; refetch rules *(proposed)*. API client hook: on a 403 with `data.missing`, invalidate the permissions query and show Toast "ไม่มีสิทธิ์ทำรายการนี้" (once per action) instead of a generic error.
- **Route guard:** `src/app/pos/_components/RequirePermission.tsx` used by each page (map below). Missing → full-page **"ไม่มีสิทธิ์"** screen (icon, "บัญชีนี้ไม่มีสิทธิ์เข้าหน้านี้", "กลับไปหน้าโต๊ะ" button → `/pos/tables`; if the user lacks `tables:read` too, the button goes to the first page they can open, else shows "ติดต่อเจ้าของร้าน"). Loading → existing skeleton.
- **Page → permission map** (one table in code, `src/lib/permissions/pos-routes.ts`, also used by the rail):

| Page | Needs |
|---|---|
| `/pos/tables` | `tables:read` |
| `/pos/tables/[visitId]/order` | `orders:create` |
| `/pos/orders` | `orders:read` |
| `/pos/menu`, `/pos/menu/modifiers` | `menu:read` |
| `/pos/menu/new`, `/pos/menu/[id]` | `menu:write` |
| `/pos/reports` | `reports:read` |
| `/pos/settings` | `venue:read` |

- **Rail (`PosRail`)**: an item is shown only if its page is allowed *(proposed: hidden, not greyed)*; ออเดอร์ badge only when `orders:read`.
- **Actions hidden** (component → code):
  - Tables: "+ เปิดโต๊ะ" / open on a free seat → `visits:open`; "ปิดโต๊ะ" → `visits:close`; "สั่งออเดอร์" / quick order → `orders:create`; "ชำระเงิน" (open checkout) → `payments:create`; bell "รับทราบ" stays (needs `tables:read` only).
  - Checkout: create QR / cash → `payments:create`; slip scan → `payments:create`; **"ยืนยันรับเงินเอง" (manual confirm) and cash "รับเงินแล้ว" → `payments:mark_paid`**; cancel QR → `payments:create`. When the user can create but not mark paid: a hint "ให้ผู้จัดการยืนยันรับเงิน" in place of the hidden button.
  - Orders board / ticket drawer: accept / ready / sent / flag / resolve → `orders:update_status` (read-only board otherwise).
  - Menu list: "+ เพิ่มเมนู", edit links, category & modifier management → `menu:write`; sold-out switch → `menu:toggle_availability`.
  - Settings: venue form editable only with `venue:update` (else read-only fields, no save); payment section visible with `venue:read_payment`, editable with `venue:update_payment` (owner only by default).
  - Top bar NotificationBell "รับทราบ" (BRIEF-051) → `tables:read` (unchanged).
- **MSW**: `GET /me/permissions` handler with a switchable role (`owner` default, `manager`, `staff`) for tests and Playwright (`window.__posMock.setRole(role)`).
- **Tests:** unit (`usePermissions`, `can*`, 403 → invalidate + Toast, route map), component (each screen above as staff vs manager vs owner: the right buttons present/absent), Playwright e2e (staff role: rail shows only โต๊ะ / ออเดอร์ / เมนู; checkout without manual confirm; `/pos/reports` by URL → "ไม่มีสิทธิ์"; manager: settings payment section read-only).

### Out (do NOT build here)
- Staff / groups / policies screens (U1 / U2) · settings sub-nav for IAM (U1 adds the tabs, hidden without `staff:manage` using this hook) · staff app (Metee) · customer web · server changes (none — the server already enforces) · POS PIN (BRIEF-018).

## 3. Contract
- **Uses:** `GET /me/permissions` → `{ permissions: PermissionCode[], groups }` (BRIEF-053); any staff route's `403 { code: 'FORBIDDEN', data: { missing } }`.
- **Contracts changes:** none (`PermissionCode`, `MyPermissions` exist).
- **Business rules:** server is the truth — hiding is convenience only · default policies (BRIEF-053 §3): พนักงาน has no `payments:mark_paid`, `menu:write`, `reports:read`, `venue:update*`; ผู้จัดการ has no `venue:update_payment`, `staff:manage`.

## 4. Acceptance Criteria
- **AC-1** — Owner: every rail item, page and action present (no regressions vs today).
- **AC-2** — พนักงาน: rail shows โต๊ะ, ออเดอร์, เมนู only; menu list has no "+ เพิ่มเมนู" / edit, sold-out switch present; checkout shows QR / slip scan but no manual confirm or cash "รับเงินแล้ว", with "ให้ผู้จัดการยืนยันรับเงิน"; orders board actions present.
- **AC-3** — ผู้จัดการ: everything except settings payment-section editing (read-only) — and later U1/U2 tabs (not in this brief).
- **AC-4** — Typing `/pos/reports`, `/pos/menu/new`, `/pos/settings` as พนักงาน → "ไม่มีสิทธิ์" screen with a working "กลับไปหน้าโต๊ะ"; no API call to the forbidden endpoint is made before the screen shows.
- **AC-5** — A 403 with `missing` from any action → Toast "ไม่มีสิทธิ์ทำรายการนี้" + permissions refetched (e.g. role changed mid-shift: the button disappears after the toast).
- **AC-6** — While `/me/permissions` loads, gated buttons are not rendered (no flash); a failed load shows the existing error/retry pattern, not a crash.
- **AC-7** — Gates + run proof pass.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1 – AC-3, AC-6 | component (role switch via MSW) | `src/app/pos/**/_components/*.test.tsx`, `src/lib/permissions/*.test.ts(x)` |
| AC-4, AC-5 | unit + Playwright | `src/lib/permissions/*.test.ts`, `app/frontend/e2e/pos-permissions.spec.ts` |
| AC-2, AC-4 | Playwright (staff role) | `app/frontend/e2e/pos-permissions.spec.ts` |

Gate commands:
```bash
pnpm --filter @bar/frontend lint
pnpm --filter @bar/frontend typecheck
pnpm --filter @bar/frontend test
pnpm --filter @bar/frontend test:e2e
pnpm --filter @bar/frontend build
```
Run proof (real stack, ports BRIEF-046): headless Playwright on the real stack with minted tokens for Field (เจ้าของ), Demo ผู้จัดการ, Demo พนักงาน — screenshots of the rail + checkout per role and the "ไม่มีสิทธิ์" screen (`docs/handoffs/assets/BRIEF-056/`); Field's LINE login spot-check that nothing disappeared for the owner.

### Local Sonar scan
- **Required: yes.**

## 6. Constraints
- One permission map (`pos-routes.ts`) feeds the rail and the route guard — no second list.
- Never decide access from group names — only from permission codes.
- DS tokens, HeroUI v3; Thai copy as above; no new dependency.
- Existing tests keep passing with the MSW default role `owner`.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):** page map and action map above · files `src/lib/permissions/*`, `src/app/pos/_components/RequirePermission.tsx` · hide (not disable) + "ไม่มีสิทธิ์" screen on direct URL · the two *(proposed)* rows once Field approves.
- **Stop and raise a DR if:** a screen needs a permission that isn't in the catalog · hiding requires a server change.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2
- [x] No unresolved decision blocking the main outcome
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-31 | Initial Draft (Cowork) — IAM UI U0 permission-aware POS |

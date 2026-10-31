# Handoff — BRIEF-056 Web POS: permission-aware UI (U0)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-31 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-056-permission-aware-pos` (no PR until audit PASS) |
| **Work SHA** | `369d8e3` |
| **Status** | Implemented — DR-029 option A approved by Field in session (Decision section for Cowork to record) · waiting for `audit BRIEF-056` (Cowork) |

## Summary
- **`src/lib/permissions/`:** `usePermissions()` (`can` / `canAll` / `canAny`, `status` loading · ready · error; TanStack query `['me','permissions']`, refetch on focus, every 60 s) · `<Can code | anyOf fallback>` · `pos-routes.ts` (the one page → permission map + `firstAllowedPage`) · `PermissionWatcher` (mounted in `Providers`): any 403 with `data.missing` → invalidate the permission query + Toast "ไม่มีสิทธิ์ทำรายการนี้" (once per 3 s burst). `client.ts` gains `onPermissionDenied`; `errors.ts` gains `isPermissionDenied` (ticket actions skip their own error toast on it).
- **Route guard:** `app/pos/_components/RequirePermission.tsx` wraps the page area **once in `pos/layout.tsx`** (path → `permissionForPath`), instead of one wrapper per page — same behaviour, no page can forget it. Loading → `aria-busy` placeholder, error → `LoadError` + retry, denied → "ไม่มีสิทธิ์" screen with "กลับไปหน้า{โต๊ะ|first allowed page}" or "ติดต่อเจ้าของร้าน". The page below is not rendered, so it fetches nothing.
- **Rail:** items shown only when their page is allowed. The two items without a page yet (ชำระเงิน, แขก) follow `reports:read` (back-office tier) — the brief did not say; owner/manager keep them, พนักงาน does not.
- **Actions** (hidden, not disabled; nothing renders while the set loads): + เปิดโต๊ะ / free-seat tap `visits:open` · สั่งแทนลูกค้า `orders:create` · ชำระเงิน + ดู QR + the checkout modal `payments:create` · ปิดโต๊ะ `visits:close` (and "ไปชำระเงิน" in its dialog `payments:create`) · manual confirm (checkout + slip scanner) `payments:mark_paid`, replaced by the hint "ให้ผู้จัดการยืนยันรับเงิน" · ticket accept / ready / sent / resolve (+ the issue panel buttons) `orders:update_status` · menu add / categories / add-ons / row→editor `menu:write`, sold-out switch `menu:toggle_availability` · settings form `venue:update` (read-only otherwise, with a note), payment section `venue:read_payment`, "เปลี่ยนบัญชี" `venue:update_payment`. Ticket board query is disabled without `orders:read`.
- **MSW:** `mocks/permissions.ts` (`GET /me/permissions`, roles owner / manager / staff = the BRIEF-053 default policies, `onlyPermissions(...)` for tests); `window.__posMock.setRole(role)`; role kept in `sessionStorage` so a Playwright test can set it and then open a URL; the mock `mark-paid` answers 403 `data.missing` when the role lacks the code (like the server).
- **No contracts / backend / dependency change.**

## Acceptance Criteria
| AC | Result | Evidence |
|---|---|---|
| AC-1 owner | ✅ | existing suites unchanged in behaviour; e2e "owner keeps everything"; run proof |
| AC-2 พนักงาน | ✅ | `PosRail.test`, e2e, run proof (rail โต๊ะ · ออเดอร์ · เมนู) — after DR-029 A |
| AC-3 ผู้จัดการ | ✅ | `VenueSettingsScreen.permissions.test`, e2e, run proof (payment section read-only) |
| AC-4 direct URL | ✅ | `/pos/reports`, `/pos/menu/new`, `/pos/settings` → "ไม่มีสิทธิ์", working back button, 0 report calls |
| AC-5 403 | ✅ | `usePermissions.test` + e2e (role flips mid-shift → toast, set refetched, rail loses รายงาน) |
| AC-6 loading / error | ✅ | `RequirePermission.test`, `usePermissions.test`, rail / grid / order-button tests |
| AC-7 | ✅ | gates + run proof below |

## Gate evidence (G1) — work SHA `7a3c318`
| Command | Exit | Result |
|---|---|---|
| frontend lint | 0 | clean |
| frontend typecheck | 0 | pass |
| frontend test | 0 | 59 files · **274 passed** (+28 new) — re-run after DR-029 A |
| frontend test:e2e | 0 | 47 passed (6 new in `e2e/pos-permissions.spec.ts`), re-run on `369d8e3` |
| frontend build | 0 | pass (on `8601921`) |

Existing tests changed: `PosRail.test`, `OrdersBoard.test` (await the async permission answer), `TicketCard.test` / `TicketDrawer.test` (new `canAct` prop + a read-only case each).

**Run proof (real API :3011 + `next dev` :3010, dev `bar`, no mock mode, minted tokens for Field (เจ้าของ), Demo ผู้จัดการ, Demo พนักงาน, T2 ฿10.00 open, 1280×800, work tree = `8601921`):**
- เจ้าของ: rail โต๊ะ · ออเดอร์ · ชำระเงิน · เมนู · แขก · รายงาน · ตั้งค่า; drawer สั่งแทนลูกค้า / ชำระเงิน / ปิดโต๊ะ; checkout has ยืนยันด้วยตนเอง.
- ผู้จัดการ: same rail and drawer, ยืนยันด้วยตนเอง present; `/pos/settings` shows บันทึก and **no** เปลี่ยนบัญชี.
- พนักงาน: rail โต๊ะ · ออเดอร์ · เมนู (after DR-029 A; `/pos/settings` → ไม่มีสิทธิ์, screenshot `staff-5-settings-denied.png`); drawer same three buttons; checkout: no ยืนยันด้วยตนเอง, hint present; `/pos/reports` → "บัญชีนี้ไม่มีสิทธิ์เข้าหน้านี้", "กลับไปหน้าโต๊ะ" → `/pos/tables`; `/pos/menu` list without add / edit.
- **0 responses with 403** for all three roles in the whole run.
- Screenshots: `docs/handoffs/assets/BRIEF-056/` — `{owner,manager,staff}-1-rail-tables.png`, `{owner,manager,staff}-2-checkout.png`, `staff-3-no-permission.png`, `staff-4-menu.png`, `manager-3-settings.png`.
- Side effects on dev `bar`: three PromptPay QRs created and cancelled on T2 (one per role). Field's LINE spot-check that nothing disappeared for the owner: not done (minted token, same permission set).

## Sonar (local scan)
- Scanned `7a3c318` · Quality Gate ERROR (known: `new_coverage` 0 %; 22 pre-existing issues; BLOCKER 0 · HIGH 6 · MEDIUM 8 · LOW 8) · **0 issues in files this brief authored** (1 found on the first scan — nested ternary in `usePermissions` — fixed in `7a3c318`; `MenuSwitch` / `MenuItemRow` presentation-role findings pre-exist). Who fixed: agent (Field's brief).

## Decisions Raised / deviations
1. **DR-029 — `/pos/settings` permission:** the map's `venue:read` conflicted with AC-2 / AC-4 (พนักงาน holds `venue:read`). Field approved option A in session (2026-10-31): the page now needs `venue:update`, one line in `pos-routes.ts`. The DR file's Decision section is still blank — Cowork records it on Field's instruction. Consequence: the read-only venue form (`venue:read` only) is reachable only through a custom role that holds `venue:update`, i.e. never read-only in practice; the branch stays for safety.
2. Guard placed once in `pos/layout.tsx`, not per page (see Summary).
3. Rail items without a page follow `reports:read` (brief silent).
4. Brief mentions a cash "รับเงินแล้ว" needing `mark_paid`; no such button exists — cash settles on create (`payments:create`), so only the manual confirm is gated on `mark_paid`.
5. Modifiers page stays `menu:read` per the map; its entry button is hidden without `menu:write`.

## Size
≈ 1.45k net-new lines incl. ~55 % tests (est. 600–800) — UI + role matrix tests ≈ 1.8× the estimate.

## AI Usage
**High** — Claude Code wrote code and tests (Field's brief, full agent mode).

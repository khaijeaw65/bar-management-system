# BRIEF-065 — Staff app: push notifications (permission, token, tap routing)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-31 (in session) |
| **Implementer** | metee (learning mode — writes ≥ 70 % himself; agent ≤ 20 %, workflow §8) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **PR** | <executor fills> |
| **Affected apps** | mobile |
| **Revision** | 1 |
| **Depends on** | **BRIEF-064 merged** (push-token endpoints, sender) · **BRIEF-060 merged** (ticket detail route) · **BRIEF-062 merged** (tables tab) |
| **References** | `docs/design/CD-08-handoff.md` (notifications·a first-run permission, ·b lock-screen copy, อื่นๆ › การแจ้งเตือน toggle, §6 strings) · DR-003 Am. 1–2 · DR-005 (logout) · DR-014 #11 · `docs/rules/mobile.md` |
| **Audit depth** | Full (device permissions, tokens) |
| **Size** | ~8–10 h incl. EAS / FCM setup |

---

## 1. Goal
With the phone locked in a pocket, a waiter still feels a new order, a table calling, or (kitchen screen on) a ready dish — and tapping the push opens exactly that order or the tables tab.

## 2. Scope
### In
- **Setup:** `eas init` (project id in `app.config.ts` → `extra.eas.projectId`), `expo-notifications` plugin, Android channel `orders` (high importance, default sound), FCM v1 credentials uploaded to EAS for the dev build (steps in the handoff; **no credential file committed**).
- **Permission screen** (notifications·a): first run after login → "เปิดการแจ้งเตือน" (asks OS permission) · "ไว้ทีหลัง" (skip; asked again only from อื่นๆ).
- **Register:** permission granted → `getExpoPushTokenAsync({ projectId })` → `PUT /notifications/push-tokens { token, platform }` after every app start while signed in (refreshes `last_seen_at`).
- **อื่นๆ › การแจ้งเตือน** toggle "เปิดอยู่ / ปิดอยู่": off → `DELETE` own token (mute); on → register again (asks permission if needed). State kept in SecureStore key `push.enabled`.
- **Logout:** `DELETE /notifications/push-tokens/:token` **before** BRIEF-022 logout (failure ignored); copy "เครื่องนี้จะไม่ได้รับการแจ้งเตือนออเดอร์จนกว่าจะเข้าสู่ระบบอีกครั้ง" in the confirm.
- **Tap routing** (`addNotificationResponseReceivedListener` + cold start `getLastNotificationResponseAsync`): `refType='order'` → ticket detail (`ticket/[ticketId]` via `GET /orders/:refId`, first non-sent ticket; M4 route) · `refType='table_seat'` → โต๊ะ tab with that seat's sheet · unknown → ออเดอร์.
- **Foreground:** don't show the OS banner (`shouldShowAlert: false`) — the app already shows Toasts from WS (M3 / M5).
### Out
- Feed / notification list screen · iOS build (Android is the demo target; DR-003) · per-type mute.

## 3. Contract
| Call | Permission | Body |
|---|---|---|
| `PUT /notifications/push-tokens` | any staff | `RegisterPushTokenSchema` |
| `DELETE /notifications/push-tokens/:token` | any staff | — |
| `GET /orders/:id` | `orders:read` | `Order` (tap routing) |
Push `data`: `{ notificationId, type, refType, refId }` (BRIEF-064).

## 4. Acceptance Criteria
- **AC-1** — First signed-in start → permission screen; "ไว้ทีหลัง" → no OS prompt, never shown again on start; "เปิดการแจ้งเตือน" + granted → exactly one `PUT` with the Expo token.
- **AC-2** — Every later start while signed in and enabled → one `PUT` (no prompt).
- **AC-3** — Toggle off → one `DELETE`, `push.enabled=false`, no `PUT` on next start; on → `PUT` again.
- **AC-4** — Logout → `DELETE` then BRIEF-022 logout; `DELETE` network failure still logs out.
- **AC-5** — Tap with `refType='order'` → ticket detail of that order; `refType='table_seat'` → tables tab with the sheet open; also from a cold start.
- **AC-6** — Foreground notifications show no OS banner.
- **AC-7 (real device)** — Android dev build, phone locked: POS order → push "ออเดอร์ใหม่ · T3" within ~5 s → tap → detail; guest calls staff → push "T3 เรียกพนักงาน" → tap → tables tab; toggle off → next order gives no push. Screen recording in the handoff.
- **AC-8** — Gates pass; mocks mode runs with push disabled (no Expo calls).

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1–AC-4, AC-6 | component (mock `expo-notifications`) | `src/__tests__/lib/push/push.test.ts` · `src/__tests__/app/notifications-onboarding.test.tsx` |
| AC-5 | unit (pure `routeForPush(data)`) + component | `src/__tests__/lib/push/route-for-push.test.ts` |
| AC-7 | manual | screen recording in the handoff |
| AC-8 | command | gates |

Gate commands (all must pass):
```bash
pnpm --filter @bar/mobile lint
pnpm --filter @bar/mobile typecheck
pnpm --filter @bar/mobile test
pnpm --filter @bar/mobile export:check
```
### Local Sonar scan
- Required: yes (always for Metee). Approved exclusions: none.

## 6. Constraints
- All push code in `src/lib/push/*`; `routeForPush(data)` is pure and the only routing decision.
- Copy exactly as CD-08 §6 (notifications).
- **Learning mode:** Metee writes the register / toggle / routing logic and tests; an agent may help with EAS + FCM setup (note it in the handoff).

## 7. Decision Points (Field Guard)
- **Pre-decided (exact only):**
  | Package | Version | How |
  |---|---|---|
  | `expo-notifications` | SDK 57 line | `npx expo install expo-notifications` (a different 57.x patch is fine — record it; different major → DR) |
  - EAS project under Field's Expo account; FCM v1 key uploaded with `eas credentials`, never committed · SecureStore key `push.enabled`.
- **Likely DRs:** EAS free tier / FCM setup blocked → tell Field; any extra package (e.g. `expo-device`) → DR.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies 064 + 060 + 062 merged
- [x] No unresolved decision blocking the main outcome
- [x] Field explicitly approved this revision (2026-10-31, in session)

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-31 | Initial Draft (Cowork) — push split: 063 feed · 064 push · 065 app |
| 1 | 2026-10-31 | Ready — Rev 1 approved by Field in session ("approve 061–065 Rev 1, DR-003 Am. 2, schema docs + .env.example edit") |

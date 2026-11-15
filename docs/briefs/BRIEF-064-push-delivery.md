# BRIEF-064 — Backend: push delivery to the staff app (Expo, port + adapter)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-31 (in session) |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **PR** | <executor fills> |
| **Affected apps** | backend, contracts |
| **Revision** | 1 |
| **Depends on** | **BRIEF-063 merged** (`NotificationsService.notify`) · schema docs for `staff_push_token` already added in BRIEF-063's seed (Cowork, Field-approved) |
| **References** | **DR-003 Amendment 1 + 2** · DR-005 (logout) · BRIEF-013 (BullMQ setup, payment expiry queue) · `providers/queue/*` |
| **Audit depth** | Full (new table, dependency, external API) |
| **Size** | ~0.5 day · ~500–700 lines incl. tests |

---

## 1. Goal
When BRIEF-063 creates notifications, each recipient's phones get a lock-screen push within seconds — through Expo's push service, behind a port so the domain never depends on Expo.

## 2. Scope
### In
- **Migration** `staff_push_token` exactly as DR-003 Amendment 1.
- **Endpoints** (any staff): `PUT /notifications/push-tokens { token, platform }` — upsert by token; a token owned by another staff is **reassigned** to the caller (shared phones); `last_seen_at = now()` · `DELETE /notifications/push-tokens/:token` — caller's own token only; unknown → 204 (idempotent).
- **Port** `PushSender` (`modules/notifications/application/ports/push-sender.port.ts`): `isValidToken(token)`, `send(messages: PushMessage[]) → PushTicket[]`, `receipts(ids: string[]) → Map<id, PushReceipt>`. Domain types only (no Expo types leak).
- **Adapter** `ExpoPushSenderAdapter` (`infrastructure/push/expo-push-sender.adapter.ts`) — the **only** file importing `expo-server-sdk`: `Expo.isExpoPushToken`, `chunkPushNotifications`, `sendPushNotificationsAsync`, `chunkPushNotificationReceiptIds`, `getPushNotificationReceiptsAsync`. Optional `EXPO_ACCESS_TOKEN` env (enhanced security off by default).
- **Queue** `notification-push` (BullMQ, existing connection):
  - job `send` enqueued by `NotificationsService.notify` after rows are inserted: for each recipient's tokens → messages `{ to, title, body, sound: 'default', priority: 'high', channelId: 'orders', data: { notificationId, type, refType, refId } }`; store ticket ids per token in the job result; tickets with `DeviceNotRegistered` → delete that token now.
  - job `receipts` delayed 15 min with the ticket ids → `DeviceNotRegistered` receipts → delete those tokens; other errors logged.
  - retries: 3 attempts, exponential backoff; a send failure never affects the notification rows.
- **Logout:** `POST /auth/logout` with a mobile refresh token also accepts optional `pushToken` → deletes it (DR-005 note) — or the app calls `DELETE` first; choose one and state it in the handoff (**preferred:** app calls `DELETE` before logout; no auth change).
- **Contracts:** `RegisterPushTokenSchema { token, platform: 'ios'|'android' }`.
### Out
- App side (permission, token, tap routing) → BRIEF-065 · feed UI · iOS credentials (Android demo target) · per-type mute (mute = app unregisters, BRIEF-065).

## 3. Contract
| Call | Permission | Body / returns |
|---|---|---|
| `PUT /notifications/push-tokens` | any staff | `RegisterPushToken` → `{ ok: true }` · invalid token format → 400 `VALIDATION_ERROR` |
| `DELETE /notifications/push-tokens/:token` | any staff, own token | 204 |
- **Schema:** +1 table (DR-003 Am. 1). **Env:** `EXPO_ACCESS_TOKEN` (optional) — already in `app/backend/.env.example` (Cowork seed, Field-approved).

## 4. Acceptance Criteria
- **AC-1** — `PUT` a valid token → one row for the caller; `PUT` the same token as another staff → row reassigned, still one row; `PUT` an invalid string → 400.
- **AC-2** — `DELETE` own token → row gone; another staff's token → 204 and the row stays.
- **AC-3** — Given BRIEF-063 creates `order_new` for 2 recipients with 3 tokens in total, then one `send` job sends exactly 3 messages through the port (fake adapter in tests) with PDPA-safe title/body and `data.refId`.
- **AC-4** — Given the fake returns `DeviceNotRegistered` in a ticket or a receipt, then that token is deleted; other tokens stay.
- **AC-5** — Given the port throws, then the job retries (3, backoff) and the order request already succeeded; notification rows untouched.
- **AC-6** — Adapter unit test (SDK mocked): chunks > 100 messages into 2 calls; maps Expo tickets / receipts to the port types; nothing outside the adapter imports `expo-server-sdk` (grep test).
- **AC-7 (run proof, after BRIEF-065)** — real Android dev build receives a lock-screen push for a POS order; recorded in BRIEF-065's handoff. For this brief: one real send to a test token via a script, or skip with reason if no device yet.
- **AC-8** — Gates pass; migration up/down clean.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2 | backend e2e | `app/backend/test/push-tokens.e2e-spec.ts` |
| AC-3–AC-5 | backend e2e / integration with `FakePushSender` | `app/backend/test/push-delivery.e2e-spec.ts` |
| AC-6 | unit | `…/infrastructure/push/expo-push-sender.adapter.spec.ts` |
| AC-8 | command | gates + migration run / revert |

Gate commands:
```bash
pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint
pnpm --filter @bar/backend typecheck
pnpm --filter @bar/backend test
pnpm --filter @bar/backend test:e2e
```
### Local Sonar scan
- Required: yes.

## 6. Constraints
- Port in `application/ports`, adapter in `infrastructure`; bound with a Nest provider token (`PUSH_SENDER`); tests bind `FakePushSender`.
- Push copy = the notification's `title` / `body` (already PDPA-safe from BRIEF-063).
- BullMQ keeps the same Redis connection / DB index as BRIEF-013 (see BRIEF-013 S2 follow-up).
- Not an audited entity (DR-003).

## 7. Decision Points (Field Guard)
- **Pre-decided (exact only):**
  | Package | Version | How |
  |---|---|---|
  | `expo-server-sdk` | `^3.15.0` | `pnpm add expo-server-sdk` in `app/backend` (DR-003 Am. 2) |
  - Queue name `notification-push`, jobs `send` / `receipts` (15 min delay), 3 attempts exponential · Android channel id `orders` · app deletes its token before logout.
- **Likely DRs:** the SDK's ESM/CJS build doesn't load under the backend's module setup → stop, DR (don't fall back to fetch silently).

## 8. Unlocked Protected Files
- `none` (schema docs added in BRIEF-063's seed; `app/backend/.env.example` `EXPO_ACCESS_TOKEN` added in this seed — Field-approved)

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependency BRIEF-063 merged
- [x] No unresolved decision blocking the main outcome (DR-003 Am. 2)
- [x] Field explicitly approved this revision (2026-10-31, in session)

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-31 | Initial Draft (Cowork) — Field: expo-server-sdk behind a port + adapter |
| 1 | 2026-10-31 | Ready — Rev 1 approved by Field in session ("approve 061–065 Rev 1, DR-003 Am. 2, schema docs + .env.example edit") |

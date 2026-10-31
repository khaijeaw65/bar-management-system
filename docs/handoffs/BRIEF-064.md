# Handoff — BRIEF-064 Push delivery to the staff app (Expo, port + adapter)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-11-01 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-064-push-delivery` (PR opens after audit PASS) |
| **Commit** | `98b5766` (the commit the evidence below was produced on) |
| **Status** | Implemented — awaiting audit |

## Summary
`notify()` now queues a BullMQ `notification-push` `send` job after the rows are saved. The job sends one Expo message per recipient token through the `PushSender` port, deletes tokens whose ticket says `DeviceNotRegistered`, and schedules a `receipts` job 15 min later that drops tokens whose receipt fails. `PUT` / `DELETE /notifications/push-tokens` register and remove tokens (shared phones reassign). `expo-server-sdk` is imported only by `ExpoPushSenderAdapter`.
**Logout:** chose the preferred option — the app calls `DELETE /notifications/push-tokens/:token` before logout; `POST /auth/logout` is unchanged.

## Acceptance Criteria
| AC | Result | Evidence |
|---|---|---|
| AC-1 | ✅ | `test/push-tokens.e2e-spec.ts` — register, reassign (still one row), bad format → 400 `VALIDATION_ERROR`, no session → 401 |
| AC-2 | ✅ | same file — own token deleted; foreign / unknown → 204, row stays |
| AC-3 | ✅ | `test/push-delivery.e2e-spec.ts` — 2 recipients / 3 tokens → one send of 3 messages, title/body/`data.refId` |
| AC-4 | ✅ | same file — error ticket deletes that token; failed receipt (via `checkReceipts`) deletes its token; others stay |
| AC-5 | ✅ | same file — sender throws → 3 attempts (1 s exponential), order `201`, notification row intact |
| AC-6 | ✅ | `expo-push-sender.adapter.spec.ts` — 150 messages → 2 chunks, ticket / receipt mapping, import-boundary grep test |
| AC-7 | BLOCKED (partly) | No device / real Expo token yet — real Android push is BRIEF-065's run proof. Not run: scripted real send |
| AC-8 | ✅ | gates below; migration run → revert → run clean on dev `bar` |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts test` | 0 | 124 passed |
| `pnpm --filter @bar/backend lint` | 0 | pass |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 234 passed · 0 failed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 281 passed · 0 failed (40 files) — see note |
| `pnpm --filter @bar/backend openapi:check` | 0 | `docs/api/openapi.json` current |
| run proof: `migration:run` → `revert` → `run`, then `node dist/main` on :3099 from this build | 0 | migrations applied · `/api/health` 200 · both push-token routes mapped · `PUT` without a session → 401 |

UI exercised: n/a (backend only).
Note: one earlier full e2e run failed `payment.e2e-spec.ts` expiry ("payment did not expire") and an earlier one hung; a `nest start --watch` dev backend was running against the same Redis (known shared-Redis issue, state Carry over). The file passes alone and the next full run was green.

## Sonar (local scan)
- Scanned commit: `98b5766` · Quality Gate: failed (`new_coverage` 0 % — no coverage report configured; `new_violations` 23)
- Issues by severity: Blocker 0 · High 7 · Medium 8 · Low 8 · Info 0
- Remaining issues + reason: 0 of the 23 are in BRIEF-064 files (checked by file via the Sonar API); all are pre-existing frontend / order / customer code listed in state Follow-ups
- Who fixed: n/a

## Decisions Raised
- none

## Deviations from Brief
- none. Additive only: `app/backend/scripts/create-openapi-document.ts` got a `PushTokenService` stub (needed by `openapi:export`); `docs/api/openapi.json` regenerated; `providers/config/expo/` added for `EXPO_ACCESS_TOKEN` (backend.md: `process.env` only in config).

## Known Gaps / Follow-ups
- A retry after a partly sent job (chunk 1 sent, chunk 2 threw) re-sends chunk 1 — duplicates are possible; fine at bar scale (≤ 100 tokens per chunk).
- Backoff is 1 s exponential (3 attempts) so the failure test stays fast; raise it if Expo outages matter.
- `last_seen_at` refreshes on each `PUT`; the app should re-`PUT` on every start (BRIEF-065).
- If `enqueue` fails (Redis down) `notify` throws; its three callers already catch and log.

## AI Usage
**High** — Claude Code wrote the code and tests under the Ready brief (kj is in full-reviewer mode).

## Notes for Reviewer
- Start at `notifications/application/push-delivery.service.ts` (the flow), then `infrastructure/push/expo-push-sender.adapter.ts` (the only SDK import) and `test/push-delivery.e2e-spec.ts`.
- Dependency: `expo-server-sdk@^3.15.0` (brief Pre-decided); lockfile also re-hashed some unrelated peer entries.

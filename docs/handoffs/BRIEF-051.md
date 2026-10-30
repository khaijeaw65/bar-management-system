# Handoff — BRIEF-051 Web POS: call-staff bell, QR-order cues and sound (C6)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-30 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-051-pos-bell-qr-cues` (PR opens after audit PASS) |
| **Commit** | Work SHA: see chat |
| **Status** | Audit PASS (Cowork, S = `9d7d09a`) — PR open |

## Summary
- `lib/sound/chime.ts`: Web Audio order chime (2 notes) + bell chime (3 notes), no files; mute flag in `localStorage` `bar.pos.sound` (try/catch, default on); unlock on first `pointerdown`; 2 s throttle per kind; locked/muted → silent, no error.
- `hooks/usePosAlerts.ts` (mounted once in `BoardEvents`): `table.staff_called` → refetch tables + bell chime + Toast "T3 เรียกพนักงาน · เช็คบิล"; `table.staff_call_cleared` → refetch; `order.created` with `createdBy === null` → order chime + Toast "ออเดอร์ใหม่จาก QR · T3 · #009" with "ดูออเดอร์". On `/pos/orders` the Toast is skipped (the board already toasts every new order); the chime still plays.
- `hooks/useStaffCalls.ts`: shared tables query, open calls, `useAcknowledgeCall` (optimistic clear; on error restores that seat's bell + Toast "ยังรับทราบไม่ได้ ลองอีกครั้ง"). `lib/api/tables.ts` `acknowledgeCall`.
- UI: table card (bell chip + reason + age, 44 px "รับทราบ", "ออเดอร์ใหม่ n" from `pendingBySeat` of the ticket board; the card is now a `div` with a sibling button so the acknowledge tap never opens the drawer), drawer bell row (`SessionCallRow`), top-bar `NotificationBell` (count, list, รับทราบ, ไปที่โต๊ะ, "ไม่มีการเรียก") and `SoundToggle` ("แตะเพื่อเปิดเสียง" while locked).
- Test hooks (mock mode only): `window.__staffSocket.fire`, `window.__posMock`.
- ~1.4k lines incl. tests (tests ≈ 45 %).

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | e2e `pos-alerts` (bell → card + count + list), `TableGrid.test` · real-stack run |
| AC-2 | ✅ | `TableGrid.test` (card, no drawer open), `NotificationBell.test` (list + drawer row), e2e · real-stack run (list, drawer) |
| AC-3 | ✅ | `TableGrid.test` (bell on a free seat C1 from `GET /tables`) |
| AC-4 | ✅ | `alerts.test` (QR detection, per-seat pending), e2e (QR Toast + badge; staff order silent) · real-stack run (accept → 8 → 7) |
| AC-5 | ✅ | `chime.test` (mute, persisted, blocked storage) · real-stack run (muted: badge shown, 0 oscillators) |
| AC-6 | ✅ | `chime.test` (locked silent, unlock) · real-stack run (hint visible before first tap) |
| AC-7 | ✅ | `chime.test` (throttle per kind) |
| AC-8 | ✅ | `TableGrid.test` (failed acknowledge restores badge + Toast) |
| AC-9 | ✅ | below |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/frontend lint` | 0 | pass |
| `pnpm --filter @bar/frontend typecheck` | 0 | pass |
| `pnpm --filter @bar/frontend test` | 0 | 234 passed · 0 failed |
| `pnpm --filter @bar/frontend test:e2e` | 0 | 36 passed (pos-alerts ×2) |
| `pnpm --filter @bar/frontend build` | 0 | pass |
| run proof | 0 | `migration:run` (none pending) → `start:dev` → `/api/health` 200; `next dev` :3010 |

UI exercised (real API :3011 + `next dev` :3010, dev `bar`, T3, POS 1280×800, phone tab 390×844; Field signed in with LINE): phone scanned T3 and ordered (#008) → POS T3 badge rose; bell เช็คบิล from the phone → card bell chip + top-bar count 1 → "รับทราบ" in the top-bar list → `GET /tables` empty, "ไม่มีการเรียก". After the pane throttled the hidden tab (renders and toasts lag), the next steps ran from the POS tab with the same guest cookie: guest order #009 → Toast "ออเดอร์ใหม่จาก QR · T3 · #009" + "ดูออเดอร์"; bell → Toast "T3 เรียกพนักงาน · เช็คบิล" + 3 oscillators created; "รับทราบ" in the drawer → cleared; accept #009 → T3 badge 8 → 7; mute → ring (note "ขอน้ำแข็ง") → badge + note shown, 0 oscillators.
**Sound not heard** (headless pane, no speakers): chimes verified by counting `createOscillator` calls (3 for the bell, 0 when muted). The "ring again after 60 s" step waited ~46 s from the mute click plus the earlier cooldown. Screenshots `docs/handoffs/assets/BRIEF-051/`: 1 card with both badges (+ "แตะเพื่อเปิดเสียง" before the first tap) · 2 top-bar list · 3 QR Toast · 4 bell Toast · 5 drawer bell row · 6 muted, badge shown.

## Sonar (local scan)
- Scanned commit: `48ee013` (the fix commit's issues re-scanned: none left in this brief's files) · Quality Gate: ERROR — `new_coverage` 0 % (no coverage report path, known follow-up) + `new_violations` 21, all pre-existing.
- Issues by severity (scan of `48ee013`): BLOCKER 0 · HIGH 6 · MEDIUM 9 · LOW 10 · INFO 1.
- Fixed in this brief's files: S3358 `SoundToggle`, S4624 `StaffCallRow`, S6582 ×2 `chime.ts`.
- Remaining: only files not touched here (setup.ts, MenuSwitch/MenuItemRow, backend order/payment/menu, globals.css) — pre-existing cleanup follow-up.
- Who fixed: agent (Field's own brief).

## Decisions Raised
- none

## Deviations from Brief
- None. Note: on `/pos/orders` the QR Toast is skipped (duplicate of the board's own Toast); chime still plays.

## Known Gaps / Follow-ups
- Audit suggestions, not taken (no code change after PASS): (1) show "ออเดอร์ใหม่" only when `seat.currentVisit !== null` — a free seat showed a stale count from closed-visit dev tickets; (2) re-arm the unlock listener when the `AudioContext` suspends again; (3) also gate `window.__staffSocket` on `NODE_ENV !== "production"`.
- Staff-entered orders on other pages are silent by design; the pending count counts every pending ticket on the seat (accepting it clears the badge).
- Sound audibility needs one real-speaker check at the bar.
- The call chip's age ("3 นาทีที่แล้ว") refreshes each minute.

## AI Usage
**High** — Claude Code wrote the code and tests (Field's brief, full agent mode).

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-051`
- Work SHA: see chat · source/contract comparison: contracts (`TableSummary.staffCall`, `TableStaffCalledPayload`, `Order.createdBy`, `AcknowledgeCallResult`) match the backend controller; no contract change.

## Notes for Reviewer
- Start at `hooks/usePosAlerts.ts`, `lib/sound/chime.ts`, `TableCard.tsx` (wrapper + sibling button), `hooks/useStaffCalls.ts`.
- One existing test changed: `TableGrid.test` "selected visit gets the ring" now checks the wrapper (`card.parentElement`).

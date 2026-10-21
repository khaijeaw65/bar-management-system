# Audit — BRIEF-029 Web POS: table grid, open table, live updates

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-21 night |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-21 |
| **Branch / commit** | `feat/BRIEF-029-pos-floor-open-table` · `0174ffe` (audited work commit; handoff `6747cbe`) |
| **Depth** | Compact (UI; no money writes) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** — zero Must fix ← Field makes the final call |

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `TableCard.tsx` (free / open / active / paying from `currentVisit`, `itemCount`, `paymentPending`) · `TableGrid.tsx` sections by `kind`, `sortOrder` only · `TableGrid.test.tsx` | |
| AC-2 | ✅ | `OpenTableModal.tsx` → `openVisit({ tableSeatId, guestLabel, via: 'pos' })`, toast "เปิด {seatLabel} แล้ว" + "แขก {guest}" · test + `e2e/tables.spec.ts` · run proof T6 / แพร | |
| AC-3 | ✅ | `attached` → `AttachDialog` (opener / "ลูกค้า (สแกน QR)", Thai time, guest, R2 copy); join → `?visit=`; pick other clears seat, no second POST (mutation only on submit) · tests + e2e | |
| AC-4 | ✅ | free seats only, "ไม่มีโต๊ะว่าง" + disabled, error keeps guest name · tests | |
| AC-5 | ✅ | `useTableLive` invalidates `['tables']` on the 4 events · `useSocketEvent.test.ts` · run proof: tab 2 opens T5 → tab 1 updates without reload | |
| AC-6 | ✅ | `useDisconnected` 3 s banner, one invalidate on reconnect, none on first connect · test | |
| AC-7 | ✅ | skeleton / empty (no settings button) / `LoadError` + retry; occupied tap → `?visit=` + ring · tests | |
| AC-8 | ✅ | G1: lint / typecheck / test 47 / e2e 6 / build exit 0 · run proof on 3000 / 3001 signed in as Field, screenshot committed | |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Suggestion | Low | `OpenTableModal.tsx` `guestIssue` builds a whole request with a placeholder UUID to read the guest-label message. **Current:** works, but indirect. **Updated:** `OpenVisitRequestSchema.shape.guestLabel.safeParse(value)` when the file is next touched. |
| 2 | Suggestion | Low | Run proof: the first `migration:run` failed on a stale `@bar/contracts` `dist`, and its `nest build` killed the running API. **Current:** every brief that changes contracts can hit this locally. **Updated:** make `migration:run` / `start:dev` build contracts first (turbo `dependsOn` or a `prebuild`) — tooling follow-up, not this brief. |

Checked and fine: socket auth recovery matches the gateway (`server.use` → `next(new Error('unauthorized'))` → client `connect_error` message `unauthorized` → one `POST /auth/refresh` through the BRIEF-028 client → manual `socket.connect()`, needed because socket.io doesn't auto-retry a middleware rejection); `authTried` resets only on a successful connect, so it can't loop; listeners removed in cleanup; one socket per tab; elapsed time starts as `--:--` until mount (no hydration mismatch); money shown via `formatTHB` only; shared `LoadError` now also used by `SessionGate` (BRIEF-028 S3 closed); `/` → `/pos/tables`, rail links it, `e2e/menu.spec.ts` opens `/pos/menu` directly.

Note (not a finding): 1,315 insertions incl. lockfile (~1,280 net) vs the ~500–600 estimate; tests + mocks ≈ 500 of it. UI briefs with one live flow land at ~2× the estimate — use that for 030–033 expectations, not as a reason to split.

## Recommendation to Field
PASS. The grid, the ask-before-join rule and the live refetch all work on the real stack (your two-tab run proof is the strongest evidence here). Both suggestions are small and can ride along later.

**Next command:** `execute BRIEF-029` (PASS commit + PR) — **commit this audit, the handoff and the state on the branch first, then open the PR and merge when `ci` is green** (the #69 lesson: no conflict resolve or merge before the PASS commit is on the branch).

## Evidence Coverage
- Reviewed work SHA: `0174ffe`
- Sources/diff inspected independently: `1d6607a..0174ffe` — `lib/socket/socket.ts`, `hooks/useSocketEvent.ts`, `lib/api/tables.ts`, `TableGrid`, `TableCard`, `OpenTableModal`, `AttachDialog`, `table-time.ts`, `SessionGate`, `PosRail`, `page.tsx`; backend `notifications.gateway.ts` + `handshake-token.ts` for the auth error contract; handoff screenshot
- Tests run or independently inspected: **inspected, not re-run** (no pnpm on the Cowork shell; macOS `node_modules`). Independent gate evidence = GitHub `ci` on the PR head
- Written uncommitted; the executor commits it unchanged at PASS (H). Pre-merge summary must verify S..H contains evidence-only changes (§7).
- Repeated blocker: none

## Sonar (local scan)
- Handoff Sonar section present: yes — not run, optional

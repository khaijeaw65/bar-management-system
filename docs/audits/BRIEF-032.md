# Audit — BRIEF-032 Web POS: orders board (status + issues)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-22 afternoon |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-22 |
| **Branch / commit** | `feat/BRIEF-032-pos-orders-board` · `d13425a` (work: `01d0c09` + Sonar fixes) · handoff `9534820` |
| **Depth** | Compact (UI; transitions are server-guarded) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `board.ts` `columnsFor` / `ticketsIn` (sort by `createdAt` asc; station filter only when kitchen on) · `TicketCard` station Chip only when kitchen on · `OrdersBoard.test.tsx` "kitchen off …", "kitchen on …" | `ready` with kitchen off shown under กำลังเตรียม (brief silent — sensible, handoff note) |
| AC-2 | ✅ | `actionOf`: `accepted` → `ready` only for kitchen on + `seat.kind === "table"`, else `send` · accepter name on the card · tests "accepting moves …", "… counters skip ready" · e2e | |
| AC-3 | ✅ | `useTicketActions.fail`: 409 → Toast "ออเดอร์ #n เปลี่ยนสถานะแล้ว" → returns the invalidate promise (button pending until refetch) · test "a 409 …" | No optimistic moves (§6) ✅ |
| AC-4 | ✅ | `IssuePanel`: reason / item / note / reporter / escalated time; ทำต่อ → `resolve { resolution: 'substitute' }`; void / replace disabled + permission text · `TicketDrawer.test.tsx` · e2e | |
| AC-5 | ✅ | `order.created` → refetch (shared hook) + 3 s highlight + Toast (`useBoardEvents`) · rail Badge from the same `['tickets','board']` query · tests · **run proof live** (C1, Badge 3 → 4 → 3, card left on เสิร์ฟแล้ว) | |
| AC-6 | ✅ | `menu.availability_changed` contracts-parsed → refetch + Toast naming `autoVoided` seats, `notVoided` in description · struck line + "ยกเลิกอัตโนมัติ · ของหมด" · tests | Component-test only (handoff) |
| AC-7 | ✅ | skeleton per column (`BoardColumn` loading), "ไม่มีออเดอร์", `LoadError` + retry · tests | |
| AC-8 | ✅ | handoff G1 table · run proof with screenshots on 3000 / 3001 as Field | see Gate note |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope | ✅ | no void / replace / comp, no kitchen screen, no POS-side flagging |
| Deps / contracts / backend | ✅ | none added; endpoints and events exist |
| One query for board + Badge (§3b) | ✅ | `hooks/useTicketBoard.ts` `BOARD_KEY` used by board and `usePendingTicketCount` |
| Pre-decided paths | ⚠️ ok | §3b names `hooks/usePendingTicketCount.ts`; it is an export of `hooks/useTicketBoard.ts` instead. Same behaviour, same query key — accepted, no DR |
| Stale event skip | ✅ | `ticket.status_changed` / `issue_escalated` carry `ticketId` + `updatedAt` (contracts) → skipped only when strictly older than the cached ticket |
| A11y (CD-15 §9) | ✅ | action names include number + seat; columns are labelled regions; filter in `<fieldset>` + legend |
| Sonar (required) | ✅ | 2 issues in brief files fixed (S3358, S6819); 16 pre-existing elsewhere; coverage config known; no exclusions |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Suggestion | Low | `TicketCard.tsx`: **Current:** the card's open `<button>` contains a `<ul>` of lines (a button may only hold phrasing content; screen readers flatten it). **Updated:** render the lines as `<span className="block">` inside the button, or move the list outside the button and keep the button on the header row. |
| 2 | Suggestion | Low | `useTicketActions.ts`: **Current:** one shared mutation, so tapping card A then card B while A is still running moves the spinner to B; A's button becomes tappable again (a second tap gives an honest 409 Toast — no wrong state). **Updated:** keep a `Set` of in-flight ticket ids (add on mutate, remove on settle) — only if double taps show up in the demo. |
| 3 | Suggestion | Info | `useTicketBoard` subscribes to socket events in every caller; on `/pos/orders` the rail and the board both subscribe, so each event invalidates twice (TanStack cancels the first refetch). Harmless; move the subscriptions to one provider if a third caller appears. |
| 4 | Brief follow-up (Field) | Info | Board asks `status=…,issue`, so issues the staff app flagged but has **not** escalated also show in มีปัญหา. That matches the brief text; CD-15 talks about *escalated* issues. **Updated (decision):** keep as is, or add `escalated=true` for the issue column once the staff app flags issues (BRIEF-010 / CD-08). No impact before the mobile app ships. |

Note (not a finding): 1,339 insertions incl. tests, MSW and screenshots vs ~450–550 estimate — same ~2× UI pattern.

## Gate note
The handoff ran the full `test` (112) and `build` before the Sonar fix commit, and lint / typecheck / orders tests (18) after it. Cowork re-ran on `9534820`: `tsc --noEmit` **exit 0**, `eslint` on all changed paths **exit 0**. Vitest cannot run on the Cowork shell (Linux VM, macOS-built native binaries) — the PR's GitHub `ci` on the head is the independent full-suite check before merge.

## Recommendation to Field
PASS. The board does what the demo needs: live new orders, one-tap accept → serve, honest 409s, the rail Badge from the same data, and your run proof shows it across two tabs. The four notes are polish or a later decision; none blocks the slice.

**Next command:** `execute BRIEF-032` (PASS commit: this audit + handoff + state on the branch, then PR; merge when `ci` is green).

## Evidence Coverage
- Reviewed work SHA: `d13425a` (handoff `9534820`)
- Sources inspected independently: `board.ts`, `useTicketBoard.ts`, `useBoardEvents.ts`, `useTicketActions.ts`, `lib/api/tickets.ts`, `OrdersBoard.tsx`, `TicketCard.tsx`, `TicketDrawer.tsx`, `IssuePanel.tsx`, `PosRail.tsx` diff, `d13425a` diff; contracts `TicketStatusChangedPayloadSchema`, `TicketIssueEscalatedPayloadSchema`; test names in all four test files + e2e
- Tests: inspected; typecheck + eslint re-run (exit 0); vitest / e2e / build not re-run (environment) → GitHub `ci`
- Written uncommitted; the executor commits it unchanged at PASS.

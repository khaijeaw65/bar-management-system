# Audit — BRIEF-017 Ticket issue flow (flag · escalate · resolve)

| | |
|---|---|
| **Auditor** | Cowork (Claude) — session https://claude.ai/code/session_01FZrjUoffUZjq6BJFPkPAYT |
| **Assignment** | Brief default auditor (Cowork); Field `audit BRIEF-017` 2026-10-20 |
| **Date** | 2026-10-20 |
| **Branch / commit** | `feat/BRIEF-017-void-comp-issues` · work `2dcc8f6` · audited head `4e4a302` (handoff only on top) |
| **Depth** | Full |
| **Brief revision** | 3 |
| **Recommendation** | **PASS** — 0 Must fix, 3 Suggestions ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `ticket-transition.ts` `issueStatus` · `ticket.service.ts` `writeFlag` · e2e "flags pending, accepted, and ready…" | one `ticket.status_changed`, `issue.reportedBy` filled |
| AC-2 | ✅ | `FlagIssueRequestSchema.superRefine` (note for `other`, blank-trimmed) · `lineOnTicket` → 400 missing / cancelled · e2e "rejects a missing note…" | 404 unknown, 409 sent / cancelled / issue |
| AC-3 | ✅ | `writeResolve` + `kept()` · `orderWhere` `issue_escalated_at IS NOT NULL` · e2e "escalates once…" | escalate emits `ticket.issue_escalated` only (asserts 0 status events); second → 409 Thai message |
| AC-4 | ✅ | `cleared()` nulls all `issue_*` · e2e same test | non-issue resolve → 409 |
| AC-5 | ✅ | `LOCK_TICKET_SQL … FOR UPDATE OF t` before line check · e2e `Promise.all` substitute×2, flag×accept, flag×send | final state asserted against the winner |
| AC-6 | ✅ | e2e "leaves order lines and bill totals unchanged" (`moneyOf` before/after) | flag path never touches `order_item` |
| AC-7 | ✅ | controller `@ApiBody` / `@ApiQuery escalated` · `docs/api/openapi.json` · README Tickets rows (+ 018 / 027 pointers) | `openapi:check` per handoff |
| AC-8 | ✅ (handoff) | Handoff G1 table on `2dcc8f6`; run proof on :3011 (`/api/health` 200, full flag→escalate→list→substitute flow) | not re-run independently — see Evidence Coverage |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | no 86, cache, void, `cancellation` read; README only re-points rows to 018 / 027 |
| No unapproved deviations / deps | ✅ | no packages, no schema change, no new error codes; event name per Q4 A |
| `PermissionsGuard` only, no inline checks | ✅ | `@RequirePermissions('orders:update_status')` on both POSTs; list keeps `orders:read` |
| `save()` not `update()` on audited entities | ✅ | `saveIssue` → `findOne` + `save()` inside the locked transaction |
| ESM `.js` imports · contracts as source of truth | ✅ | schemas + event in `@bar/contracts`; controller parses with them |
| Agent boundaries respected | ✅ | no protected files touched |
| Run proof on the audited SHA | ✅ | on `2dcc8f6` (head adds docs only); port 3011 because :3001 is taken by an unrelated listener (same as BRIEF-013) |

## Test Quality
Strong for the size. The e2e runs on real Postgres + Redis, uses real concurrent requests (`Promise.all`) rather than mocked locks, and asserts event counts both ways (escalate = 1 escalated + 0 status). AC-6 compares money before/after instead of trusting "no write". Unit spec covers the full transition table. Gap (minor): no test for `escalated=true` combined with an explicit `status` filter — behaviour is reasonable (`status` narrows), just untested.

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Suggestion | Low | `ticket.service.ts` `escalatedPayload` — **Current:** after the escalate commits, `finish()` re-reads the ticket; if a `substitute` lands between commit and re-read, `issue` is null and it throws → the client gets 500 for a write that succeeded. **Updated:** build the event from what was written (locked issue fields + `escalatedAt`) or skip the emit without throwing. Narrow race, follow-up is fine. |
| 2 | Suggestion | Low | `ResolveIssueRequestSchema.note` — **Current:** accepted and silently dropped (handoff Known Gaps). **Updated:** say "not stored yet" in the OpenAPI description, or remove `note` until issue history exists, so clients don't assume it is kept. |
| 3 | Suggestion | Low | `ticket.service.ts` imports `blankToNull` from `common/http/http-input.js` — **Current:** application layer depends on an HTTP helper. **Updated:** move `blankToNull` to a neutral `common/` util when next touched. |

Note (not a finding): ~700 net-new lines excl. `openapi.json` vs the brief's 500–600 estimate (e2e 330 lines). Within reviewable size; keep the BRIEF-013 S4 sizing note.

## Recommendation to Field
PASS. The issue flow matches Rev 3 exactly: transitions live in a pure function, `TicketService` is the only writer, the ticket row lock serializes concurrent taps, and money is untouched. Suggestions 1–3 are small and can ride in BRIEF-027 or the next order-module brief — none blocks the 8 Nov slice.

**Next command:** `execute BRIEF-017` (PASS commit + PR) → merge when `ci` is green on the PR head (Field's PR, pre-approved).

## Evidence Coverage
- Reviewed work SHA: `2dcc8f6` (head `4e4a302` = + `docs/handoffs/BRIEF-017.md`, `docs/state/kj/SESSION_STATE.md`)
- Sources/diff inspected independently: full `1354ad3..4e4a302` diff of `app/backend/src`, `app/packages/contracts/src`; e2e assertions in `test/ticket-issue.e2e-spec.ts`; README rows; all ACs
- Tests run or independently inspected: inspected, **not re-run** — the cloud workspace has no repo access and the e2e needs Field's local Postgres/Redis. Independent gate evidence = GitHub `ci` on the PR head, which merge already requires.
- Written uncommitted; the executor commits it unchanged at PASS (H). Pre-merge summary must verify S..H contains evidence-only changes (§7).
- Repeated blocker: none

## Sonar (local scan)
- Handoff Sonar section present for the scanned commit = S (or later scan): n/a — optional for this brief, not run (BRIEF-006 setup)
- Remaining issues have reasons; no unapproved "won't fix"/exclusions: n/a
- Learning mode respected (Metee fixed his own issues): n/a (KJ brief)

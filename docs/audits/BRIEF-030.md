# Audit — BRIEF-030 Web POS: session panel + close table

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-22 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-22 |
| **Branch / commit** | `feat/BRIEF-030-pos-session-panel-close` · `11569c2` (audited work commit; handoff `359603b`) |
| **Depth** | Compact (UI; close is server-guarded) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** — zero Must fix ← Field makes the final call |

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `session-groups.ts` `sessionGroups` newest first, one group per order when the kitchen screen is off (DR-013); `BillFooter` from server `bill` · `SessionDrawer.test.tsx` | |
| AC-2 | ✅ | kitchen on → one group per ticket, บาร์ / ครัว from `station`, shared `orderNumber` · test | |
| AC-3 | ✅ | `cancelledAt` → struck line; all lines cancelled or `cancelled` status → "ยกเลิกทั้งใบ"; `lineNote` adds `cancellation.reason` (BRIEF-027 field) · test | |
| AC-4 | ✅ | `confirmClose` refuses when `hasMoney(remaining)`; one `POST /visits/:id/close` → toast, `['tables']` invalidated, drawer closed · tests + e2e · run proof C2 | |
| AC-5 | ✅ | `bill.locked` → paying; `PAYMENT_IN_FLIGHT` → blocked + refetch; `INVALID_STATE_TRANSITION` → "โต๊ะนี้ถูกปิดไปแล้ว" · tests | Finding 1 |
| AC-6 | ✅ | `order.created` / `ticket.status_changed` / `payment.status_changed` / `visit.state_changed` filtered by `visitId`; own close doesn't double-toast (`self` ref) · tests · run proof: order via API appeared without reload | |
| AC-7 | ✅ | loading / `LoadError` retry / 404 toast + clear · tests | |
| AC-8 | ✅ | G1: lint / typecheck / test 60 / e2e 7 / build exit 0 · run proof on 3000 / 3001 as Field, two screenshots committed | |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Suggestion | Med | `useSession.ts` `blocked` is set on a `409 PAYMENT_IN_FLIGHT` and never cleared. **Current:** after that race, the payment finishes, the refetched bill is unlocked, but ปิดโต๊ะ stays disabled until the drawer is reopened. Rare today; on the 033 path (pay → close) it would read as a stuck button. **Updated:** derive `paying` from `bill.locked` only (drop `blocked`), or clear it when a refetch returns `locked: false`. **Fold into BRIEF-033**, which touches this hook. |
| 2 | Suggestion | Low | `session-groups.ts` `grouped()` takes the chip from `order.tickets[0]`. **Current:** fine while orders have one ticket (kitchen off, no charge items). A charge ticket (created `sent`, DR-012) could become `tickets[0]` and show "เสิร์ฟแล้ว" for the whole order. **Updated:** pick the first ticket with a non-null `station`, when charge items arrive. |
| 3 | Suggestion | Low | `hasMoney()` uses `Number()`. **Current:** a > 0 comparison, safe. **Updated:** use the satang helper once 031 adds `lib/utils/money.ts` (same as BRIEF-028 S4). |

Accepted deviation (reasonable, not a finding): the panel is a non-modal `<aside role="dialog">` instead of HeroUI Drawer — CD-02 §9 / pos-desktop "grid still visible/interactive behind it" needs the floor to stay tappable, which a modal Drawer blocks. Esc closes it; the close confirm stays a real modal.

Note (not a finding): 1,234 insertions vs ~400–500 estimate; tests + fixture ≈ 520. Same ~2× pattern as 028 / 029.

## Recommendation to Field
PASS. The drawer reads the server bill, never computes money, groups by DR-013, and close is gated twice (client: remaining = 0; server: 409s handled distinctly). Finding 1 is the one worth doing — put it in BRIEF-033 so pay → close never shows a stuck button.

**Next command:** `execute BRIEF-030` (PASS commit + PR) — audit + handoff + state on the branch first, then PR, merge when `ci` is green.

## Evidence Coverage
- Reviewed work SHA: `11569c2`
- Sources/diff inspected independently: `8ce6fd8..11569c2` — `useSession.ts`, `session-groups.ts`, `SessionDrawer.tsx`, `CloseConfirmModal.tsx`, `TableGrid.tsx` wiring, `lib/api/{visits,venue}.ts`; contracts `VisitStateChangedPayloadSchema`, `BillSchema`, `TicketSchema`; handoff screenshots
- Tests run or independently inspected: **inspected, not re-run** (no pnpm on the Cowork shell). Independent gate evidence = GitHub `ci` on the PR head
- Written uncommitted; the executor commits it unchanged at PASS (H). Pre-merge summary must verify S..H contains evidence-only changes (§7).
- Repeated blocker: none

## Sonar (local scan)
- Handoff Sonar section present: yes — not run, optional

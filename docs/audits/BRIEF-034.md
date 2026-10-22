# Audit — BRIEF-034 Web POS: orders board polish (BRIEF-032 audit notes)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-22 evening |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-22 |
| **Branch / commit** | `feat/BRIEF-034-pos-orders-board-polish` · `63442f1` (work) · handoff `746df1e` · seed `e189bbe` |
| **Depth** | Compact (UI) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `TicketCard.tsx`: `ul`/`li` → `span.block`, classes unchanged · `TicketCard.test.tsx` (no `ul/li/div/p` in the open button) · screenshot | |
| AC-2 | ✅ | `useTicketActions.ts`: `pendingIds` Set — `onMutate` add, `onSettled` remove (runs after `onSuccess`/`onError` return the refetch promise, so the spinner lasts until the board shows the answer) · held-response test · run proof: two taps in the same tick → both `data-pending`, both moved | |
| AC-3 | ✅ | `useTicketBoard()` = query only; listeners in `useTicketBoardEvents()` mounted once by `pos/_components/BoardEvents.tsx` in the POS layout (inside `SessionGate`) · request-count test (rail + board + events mounted → one refetch per event) · run proof: tab 2 accept → tab 1 moves without reload | Only `OrdersBoard` and the rail call `useTicketBoard()` (grep) |
| AC-4 | ✅ | `board.ts` `ticketsIn`: `issue` needs `issue.escalatedAt` — same query key, chips and column agree · test "มีปัญหา 1" | Component test only (no issue tickets in the local DB) — fine, the rule is a pure filter |
| AC-5 | ✅ | lint / typecheck / test 116 / e2e 12 / build exit 0 (handoff, on `63442f1`) · Cowork re-ran `tsc --noEmit` and `eslint src/app/pos src/hooks` on `746df1e`: exit 0 · Sonar: no open issue in changed files | `CartPanel.test.tsx` timed out once (untouched file) — see Finding 1 |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope | ✅ | N1–N4 only; no backend, contracts, packages |
| Q1 = A | ✅ | escalated-only; rail Badge (pending) unaffected |
| No optimistic moves / 409 path | ✅ | unchanged from BRIEF-032 |
| Pre-decided | ✅ | query key `['tickets','board']` unchanged; new `BoardEvents.tsx` sits under `pos/_components` (N3 allowed "in the POS layout") |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Suggestion | Low | `CartPanel.test.tsx` (BRIEF-031) timed out once on `findByRole`, then passed. Second flaky UI test this week (after `login.spec.ts`). **Updated:** carry over — if it fails again in `ci`, raise the `findByRole` timeout or wait on the MSW response instead of a role. Not this brief. |
| 2 | Info | — | `BoardEvents` lives in the POS layout, so live board refresh only works under `/pos` (handoff note). Correct today; if a back-office page later shows tickets, mount the same component in that layout. |

## Recommendation to Field
PASS. Small, clean diff (≈60 lines of code + tests) that closes all four BRIEF-032 notes exactly as the brief asked, with a live two-tap proof.

**Next command:** `execute BRIEF-034` (PASS commit: this audit + handoff + state, then PR; merge when `ci` is green).

## Evidence Coverage
- Reviewed work SHA: `63442f1` (handoff `746df1e`)
- Sources inspected independently: full diff `e189bbe..63442f1` (non-test), test names/claims in handoff, `useTicketBoard()` callers (grep)
- Tests: typecheck + eslint re-run on `746df1e` (exit 0); vitest / e2e / build not re-run (Cowork shell) → GitHub `ci`
- Written uncommitted; the executor commits it unchanged at PASS.

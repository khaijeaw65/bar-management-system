# Audit — BRIEF-061 Backend: record who acknowledged a staff call

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-31 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-31 |
| **Branch / commit** | `feat/BRIEF-061-call-ack-audit` · **S = `efbf89b`** · handoff `ebd1f0f` · seed `6348980` |
| **Depth** | Compact (per brief) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** — no Must fix. |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | e2e: one `audit_log` row, `entity='table_seat'`, `UPDATE`, `changed_by` = caller, `changed_fields` = `staffCalledAt` / `staffCallReason` → null; live run proof on dev DB | |
| AC-2 | ✅ | e2e: one `table.staff_call_cleared` with `acknowledgedBy { staffId, displayName }`; name read from `staff_user` (§6) | |
| AC-3 | ✅ | e2e: no bell → 200, no row, no event (second ack in AC-1 test too) | |
| AC-4 | ✅ | e2e transfer + visit close → `acknowledgedBy: null`, no audit row; `visit.service.spec` updated | |
| AC-5 | ✅ | e2e `Promise.all` of two staff → both 200, one event, one audit row; `FOR UPDATE` CTE inside `@Transactional()` (§6 choice stated in handoff) | |
| AC-6 | ✅ | contracts test (staff + null accepted, missing rejected); gates in handoff; **Cowork re-ran backend `tsc --noEmit` on `ebd1f0f` (exit 0)** | |

## Rule check
- Layering kept (controller unchanged → service → repository); audit + clear in one transaction; event emitted after `recordAcknowledgement` returns (post-commit). ✅
- Contract change exactly as §3 (additive; POS `usePosAlerts` only refetches on the event — unaffected). ✅
- No dependency, no schema change. ✅

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Info | — | Visit close still emits `table.staff_call_cleared` from `finishClose`, which runs after `closeWhenClear`'s transaction — post-commit, fine. The bell clear itself there runs outside a transaction (single statement) — acceptable. |
| 2 | Suggestion | Low | `acknowledger()` without a CLS user throws `404 ไม่พบพนักงาน` after the clear (the transaction rolls back, so no harm). The route always has a user, so unreachable in practice; a 401 would describe it better if it ever happens. No change needed now. |
| 3 | Info | — | `clearStaffCall` now stamps `updated_by` from CLS (`COALESCE`, keeps the old value for guest / system paths) — a small improvement beyond the brief, consistent with the audited-entity columns. |
| 4 | Info | — | Handoff env gap (`EASYSLIP_BASE_URL`, `NEXT_PUBLIC_API_MOCKING` missing in local env files) — local only. |

## Recommendation to Field
Small, correct, and race-safe: the row lock makes "two people tap รับทราบ" produce exactly one record and one event. M5 (BRIEF-062) can rely on `acknowledgedBy`.

**Next command:** `execute BRIEF-061` (PASS commit + PR) → merge → `execute BRIEF-063`.

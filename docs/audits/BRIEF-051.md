# Audit — BRIEF-051 Web POS: call-staff bell, QR-order cues and sound (C6)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-30 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-30 |
| **Branch / commit** | `feat/BRIEF-051-pos-bell-qr-cues` · **S = `9d7d09a`** (feat `48ee013` + Sonar fix) · handoff `19addde` · merge `origin/main` `72607fb` · seed `fd09b20` |
| **Depth** | Compact+ (UI; one staff action) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** — no Must fix. Suggestion 1 is a one-line guard worth taking before the demo. |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `usePosAlerts` (mounted once in `BoardEvents`): `table.staff_called` → refetch tables, `playChime('bell')`, Toast `callTitle`; card bell chip + top-bar count; screenshots 1, 2, 4 | |
| AC-2 | ✅ | `useAcknowledgeCall` optimistic clear; card = `div` with sibling buttons (no nested button, ack never opens the drawer); list + drawer rows share `StaffCallRow`; WS `staff_call_cleared` → refetch; screenshot 3 shows "ไม่มีการเรียก" after ack | |
| AC-3 | ✅ | calls derived from the one `TABLES_KEY` query (`GET /tables`); free-seat bell test | |
| AC-4 | ✅ | `isGuestOrder` (`createdBy === null`), order chime + Toast "ออเดอร์ใหม่จาก QR · T3 · #009" + ดูออเดอร์ (screenshot 3); `pendingBySeat` from the board query; staff order silent | Toast skipped on `/pos/orders` (board toasts already) — sensible; Suggestion 1 on free seats |
| AC-5 | ✅ | `bar.pos.sound` in try/catch, default on; muted → 0 oscillators (run proof), badge shown (screenshot 6) | |
| AC-6 | ✅ | `unlockAudio` on first `pointerdown` (capture, once); hint "แตะเพื่อเปิดเสียง" while locked (screenshot 1); `SoundToggle` tap also unlocks | Suggestion 2 |
| AC-7 | ✅ | 2 s throttle per kind (`lastPlayed`), unit with fake timers | |
| AC-8 | ✅ | `onError` restores only that seat's bell (doesn't roll back other WS updates) + Toast | |
| AC-9 | ✅ | lint / typecheck / unit 234 / e2e 36 / build per handoff; Sonar run, this brief's files clean after `9d7d09a`; **Cowork re-ran frontend `tsc --noEmit` on `19addde` (exit 0)** | sound verified by oscillator counts (headless) — real-speaker check noted as follow-up |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| No backend / contract change | ✅ | uses `TableSummary.staffCall`, `TableStaffCalledPayload`, `OrderCreatedPayload`, `acknowledge-call` |
| One listener set per page | ✅ | `usePosAlerts` in `BoardEvents` only |
| No new dependency, no audio files | ✅ | Web Audio oscillators; `lucide-react` existing |
| `localStorage` only in the sound helper | ✅ | |
| Failures never break the alert | ✅ | `playChime` try/catch; locked/muted → silent |
| Test hooks | ✅ / ⚠️ | `__staffSocket` gated by `NEXT_PUBLIC_API_MOCKING === 'enabled'` only (customer socket also checks `NODE_ENV`) → Suggestion 3 |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Suggestion (take before demo) | Low | **Current:** screenshot 1 — free seat **T6** shows "ออเดอร์ใหม่ 2": the per-seat count uses every `pending` board ticket by `seat.id`, including tickets left on a visit that was closed (dev data from the BRIEF-048 run proof). A free table with "new orders" reads wrong at the POS. **Updated:** count only when `seat.currentVisit !== null` (one guard in `TableGrid`/`pendingBySeat` use); whether closing a visit with pending tickets should be allowed at all is a separate question for the IAM / close-flow work. |
| 2 | Suggestion | Low | **Current:** the global unlock listener is `once`; if the tablet sleeps and the `AudioContext` is suspended again, only the top-bar toggle re-unlocks it (hint shows). **Updated (optional):** re-arm the `pointerdown` unlock whenever the state goes back to locked, so any tap restores sound on an always-on POS. |
| 3 | Suggestion | Info | Gate `window.__staffSocket` with `process.env.NODE_ENV !== 'production'` as well, same as `customer-socket.ts`. |
| 4 | Info | — | Real-speaker loudness check at the bar (handoff follow-up) — do it during the 8 Nov rehearsal. |

## Recommendation to Field
Complete and tidy: one cache feeds card, drawer and top-bar list; the acknowledge tap can't open the drawer; sound is safe when blocked or muted. Take Suggestion 1 (one line) so a free table never shows "ออเดอร์ใหม่" during the demo — it can ride in the PASS commit only as a fix commit before it, so do it now or in the next POS brief.

**Next command:** `execute BRIEF-051` (PASS commit + PR; optionally a fix commit for Suggestion 1 first — then ask for a head check).

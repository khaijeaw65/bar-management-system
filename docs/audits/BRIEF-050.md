# Audit — BRIEF-050 Customer QR: running tab, call staff, live updates, table closed (C4)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-30 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-30 |
| **Branch / commit** | `feat/BRIEF-050-customer-tab-bell-live` · **S = `a59334f`** · handoff `bfc69e9` · merge `origin/main` `0f65dd1` · seed `acaf445` |
| **Depth** | Full (guest auth binding + customer realtime) |
| **Brief revision** | 1 |
| **Recommendation** | **CHANGES REQUIRED** — Sonar (required) not run, two screenshots missing; plus **one Field decision** on the seat-only session window (Finding 3) before PASS. |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `tryResolve`: valid → visit-bound returns as is; seat-only → `bindToLiveVisit` (`findLiveVisitId` → existing `bindVisit`) → `justBound`; guard then `bindSession` (sockets `seat:` → `visit:`); `announceOpened(seat, visit)` → `emitSeatVisitOpened` → gateway pings `seat:{id}` (staff and guest open paths); unit + e2e | Finding 3 |
| AC-2 | ✅ | `CustomerMenuService` keeps a category only if a guest item points at it | |
| AC-3 | ✅ | tab screen, filter, chips, struck lines, total + `asOf`; after send → `/customer/tab` + Toast; screenshot 1 | ของฉัน screenshot missing → Must fix 2 |
| AC-4 | ✅ | `useCustomerLive`: `tab.changed` → invalidate tab + session; screenshot 2 (chip ร้านกำลังเตรียม live) | |
| AC-5 | ✅ | `CallStaffSheet` + `useCallLock` 60 s; 429 → locked with server message; screenshot 3 ("เรียกได้อีกครั้งใน 59 วินาที") | |
| AC-6 | ✅ | `sessionEnded` / 409 at send → `GuestClosed`; `saveCart` drops a closed cart; screenshot 4 | |
| AC-7 | ✅ | socket `disconnect` → banner, `connect` after loss → refetch tab + session + menu; refused handshake → expired signal | real-stack banner screenshot missing → Must fix 2 |
| AC-8 | ✅ | `sendFailure` `RATE_LIMITED` → `rateLimited` (server message), cart editable, key kept | |
| AC-9 | ✅ | `CustomerFrame` clears Toasts on route change; header bell + บิลโต๊ะ on all customer pages | |
| AC-10 | ⚠️ | gates per handoff (backend 176 / e2e 204, frontend 220 / e2e 34, build); **Sonar required — not run** | Must fix 1 |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| No new endpoint / WS event / contract field | ✅ | `tab.changed` reused for the seat ping; `justBound` is internal only (not serialized) |
| Guest emits only via notifications sinks | ✅ | `registerSeatSink` mirrors `registerTabSink`; Notifications never imports Customer |
| Binding through existing `bindVisit` · no schema change | ✅ | |
| One customer socket, own path, cookie on handshake | ✅ | `path: '/api/customer/socket.io'`, `withCredentials` |
| Test hooks don't ship | ✅ | `window.__customerSocket` only when `NODE_ENV !== 'production'` **and** `NEXT_PUBLIC_API_MOCKING === 'enabled'`; `__customerMock` in `mocks/browser.ts` (MSW-only entry) |
| Shared cart logic | ✅ | additive `rateLimited` state/action; staff order routes have no 429, so POS behaviour is unchanged |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Must fix | Medium | **Current:** brief §5 "Local Sonar scan — Required: yes"; handoff: "Not run — SonarQube stopped". **Updated:** start SonarQube, `pnpm sonar`, fix findings in BRIEF-050 files, record gate + counts in the handoff (pre-existing issues outside this brief may stay, listed). |
| 2 | Must fix (evidence) | Low | **Current:** 4 of the 6 screenshots in brief §5 (tab ทั้งหมด, live chip, bell sent, closed). Missing: tab **ของฉัน** and the **disconnected banner**. **Updated:** add `5-tab-mine.jpg` (B after it orders one line, filter ของฉัน) and `6-disconnected.jpg` (stop the backend for a moment with the tab open). |
| 3 | **Decision — Field** | Medium | **Current:** a seat-only session slides +2 h on every guarded request, and the menu refetches every 60 s (BRIEF-049) — so a phone left open on the menu stays seat-only indefinitely. With bind-on-read (this brief) that phone joins **any later visit on that seat** the moment it reads, and sees (and can order onto) the next group's bill — e.g. a guest who scanned T3, never ordered, left with the page open; the next group sits at T3 an hour later. The same window already existed for ordering (BRIEF-048 binds at first order); bind-on-read makes it passive. **Options:** **A — accept for S1** (same risk class as a photographed QR in DR-028: throttles + every guest line shows on the POS with its nickname). **B — hard cap for seat-only sessions** (recommended): keep 2 h sliding but never past e.g. **60 min after creation** (`created_at + 60 min`); a guest who browses longer just rescans (CD-06 welcome is one tap). ~5 lines in `isValid` + 1 unit + 1 e2e, inside this brief; DR-028 amended by Field's decision line. **C** — no bind for sessions older than the visit by > N min (more rules, less clear). |
| 4 | Info | — | Ticket status `issue` shown to guests as "ร้านกำลังเตรียม" (no customer label in the brief) — sensible; station `food` = "ครัว". |
| 5 | Info | — | Real-stack phone A was a curl cookie jar (one browser pane shares cookies per origin) — acceptable; phone B was the real UI. |

## Recommendation to Field
Functionally complete and well isolated — the live tab and closed screen work on the real stack. Two evidence/process items for the executor, and one decision for you: Finding 3. I recommend **B (60-minute hard cap on seat-only sessions)** — it closes the "old phone joins the next group's bill" window for a few lines, and costs a real guest at most one extra scan.

**Field decision (2026-10-30, in session): Finding 3 → B, 60-min hard cap.** Recorded as BRIEF-050 **Rev 2** (scope item + AC-11) and a DR-028 amendment line, seed commit `ce3cec8` on the branch. Finding 3 is now **Must fix 3** (implement Rev 2).

**Next command:** `execute BRIEF-050` (Must fix #1 Sonar, #2 two screenshots, #3 Rev 2 seat-only 60-min cap + AC-11).

---

## Re-audit 1 — 2026-10-30 (Cowork)
| | |
|---|---|
| **Reviewed** | **S = `9b6ec82`** (`dee5a96` Rev 2 cap · `9b6ec82` Sonar fixes) + untracked `5-tab-mine.jpg`, `6-disconnected.jpg` |
| **Result** | **PASS** — no Must fix open |

- ✅ **Must fix 3 (Rev 2 / AC-11).** `isValid`: seat-only rows are rejected when `now > created_at + 60 min`, checked before the sliding write and before `bindToLiveVisit`; visit-bound rows unchanged. `created_at` added to the session read (no schema change). Unit: 59 min → binds; 61 min with a fresh `expires_at` → 401 and `visit_id` stays NULL. e2e: session created 61 min earlier + POS opens the visit → `GET /customer/tab` 401 `GUEST_SESSION_INVALID`, no row bound (DB `created_at` pinned to the fake clock — explained in the test). The BRIEF-047 sliding test was moved inside the cap (50 min) — correct.
- ✅ **Must fix 1 (Sonar).** `9b6ec82` fixes S6819 / S7776 in touched files (`role="status"` → `<output>`, `Set.has`); scanner report on this machine from today's run. Gate result + counts go into the final handoff at the PASS commit.
- ✅ **Must fix 2 (evidence).** `5-tab-mine.jpg`: ของฉัน selected, only this phone's #007, header and footer keep the table total ฿240.00. `6-disconnected.jpg`: banner "การเชื่อมต่อขาดหาย · ข้อมูลอาจไม่ล่าสุด", last data kept.
- Cowork re-ran backend `tsc --noEmit` on `9b6ec82` (exit 0).

**Packaging for the PASS commit:** this report + the two untracked screenshots + final handoff (all 6 screenshots, Sonar gate/counts, AC-11 row, Rev 2) + state.

**Next command:** `execute BRIEF-050` (PASS commit + PR — include `5-tab-mine.jpg`, `6-disconnected.jpg`).

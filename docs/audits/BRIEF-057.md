# Audit — BRIEF-057 Web: settings shell + staff & access requests UI (U1)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-31 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-31 |
| **Branch / commit** | `feat/BRIEF-057-staff-access-ui` · **S = `f9d6a35`** (work `33eb048` + Sonar fix/screenshots) · handoff `b4cf071`, `4b76e1a` (real-stack proof) · merge `main` (056 = #106) `384d554` · seed `4d3b41d` (Rev 2) |
| **Depth** | Full (who gets access) |
| **Brief revision** | 2 |
| **Recommendation** | **PASS** — no Must fix. |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 (J1) | ✅ | component + e2e 1280; **real stack**: Field's own LINE refused → request → owner approves พนักงาน · ถาวร → toast, highlighted row | run-proof variant: Field's LINE as the new hire (identity parked / restored) instead of Metee — accepted, proves the same real path |
| AC-2 (J2) | ✅ | e2e 390; real stack: ผู้จัดการ · ถึงสิ้นกะคืนนี้ → chip "ถึง 06:00", `valid_until` 23:00Z; Field's reload → รายงาน + ตั้งค่า appear, manual confirm visible | |
| AC-3 – AC-9 | ✅ | component tests per AC (reject/reopen, validation, lockout alert, self switch, expired / future states, 60 s poll with fake timers, no tab without `staff:manage`) | |
| AC-10 | ⚠️ accepted | page area has no horizontal overflow at 1280 / 1024 / 390; the **document** still overflows at 390 because of the existing POS top bar (642 px) | Finding 2 |
| AC-11 | ✅ | lint · typecheck · unit **293** · e2e **50** · build · Sonar 0 issues in this brief's files · real-stack proof incl. **deactivate → 401 on a real LINE session**; restored to owner | |
| AC-12 (Rev 2) | ✅ | `pos-routes.ts`: `/pos/settings/staff(\/|$)` → `staff:manage` **before** `/pos/settings` → `venue:update`; tabs read the same map; tests for a `staff:manage`-only role | |
| — | ✅ | **Cowork re-ran frontend `tsc --noEmit` on `4b76e1a` (exit 0)** | |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Info | — | Memberships are rewritten as a full set: live rows send `validUntil ?? 'permanent'`, expired rows are dropped (as designed — "struck until removed"), so any edit also clears other expired rows. A **future** row (`valid_from` > now) would be re-sent with `valid_from = now` — but the API can't create future rows (BRIEF-054 sets `valid_from = now`), so this only affects hand-seeded data. No change needed; if future-dated memberships are ever added, `MembershipInput` needs a `from`. |
| 2 | Suggestion (before anyone uses the back office on a phone) | Medium | **Current:** at 390 the POS top bar (642 px) makes the page scroll sideways; the settings content itself fits. J2 (manager rights from the phone at night) works but looks broken around the header. **Updated:** fix in the queued "phone 390 shell" brief (rail → bottom/drawer nav, top bar wraps) — pull it ahead of other after-8-Nov work if you plan to use J2 on your phone. |
| 3 | Suggestion (DS) | Low | Unticked checkbox nearly invisible on the dark theme (seen live in the approve modal) — same family as the unselected-radio ring (BRIEF-049 S7); one DS token fix covers both. |
| 4 | Info | — | Dev DB now holds a deactivated `-parked` "Field" staff row (history FKs) next to the active one — expected after the proof. |

## Recommendation to Field
U1 is done and proven on the real stack with a real LINE session — including the hard part (deactivate ends the session). The route-map order from Rev 2 is in place for U2 to follow. Two UI follow-ups (phone header, dark checkbox) belong to the phone shell and DS work.

**Next command:** `execute BRIEF-057` (PASS commit + PR).

# Audit — BRIEF-056 Web POS: permission-aware UI — hide what you can't do, "ไม่มีสิทธิ์" on direct URLs (U0)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-31 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-31 |
| **Branch / commit** | `feat/BRIEF-056-permission-aware-pos` · **S = `369d8e3`** (work `8601921`, Sonar fix `7a3c318`, DR-029 A `369d8e3`) · handoff `199f571` · merge `main` (055) `db8bee1` · seed `3253010` |
| **Depth** | Full (every POS screen touched) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** — no Must fix. DR-029 recorded (Approved A); the DR file rides in the PASS commit. |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 owner | ✅ | run proof (rail 7 items, drawer + checkout incl. manual confirm); existing suites green | |
| AC-2 พนักงาน | ✅ | rail โต๊ะ · ออเดอร์ · เมนู; checkout no manual confirm + hint "ให้ผู้จัดการยืนยันรับเงิน"; menu list without add/edit; sold-out switch kept | after DR-029 A |
| AC-3 ผู้จัดการ | ✅ | settings: บันทึก present, เปลี่ยนบัญชี (`venue:update_payment`) absent | |
| AC-4 direct URL | ✅ | guard **once** in `pos/layout.tsx` around the page area: loading placeholder → error retry → "ไม่มีสิทธิ์" with first allowed page; page not rendered → no fetch (0 report calls) | deviation 2 accepted — better than per-page |
| AC-5 403 | ✅ | `onPermissionDenied` in the API client → `PermissionWatcher` invalidates `['me','permissions']` + one Toast per 3 s; ticket actions skip their own error toast | |
| AC-6 loading/error | ✅ | `status` loading / ready / error; gated actions not rendered while loading | |
| AC-7 | ✅ | lint · typecheck · unit **274** · e2e **47** (6 new) · build · Sonar 0 issues in this brief's files · run proof per role on the real stack, **0 × 403** in the whole run, 9 screenshots | Field's LINE spot-check not done — same permission set as the minted owner token; acceptable |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| One map feeds rail + guard | ✅ | `pos-routes.ts` (`permissionForPath`, `firstAllowedPage`) |
| Decisions from codes, never group names | ✅ | |
| Server stays the truth | ✅ | no backend / contract change; mock `mark-paid` mirrors the server's 403 |
| No new dependency · DS tokens | ✅ | |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Info (DR) | — | **DR-029** — brief map gave `/pos/settings` `venue:read`, but พนักงาน holds `venue:read` (planner error in the brief, caught by the executor). **Approved A by Field (2026-10-31, Cowork session)**: page needs `venue:update`. Decision recorded in `docs/decisions/DR-029-pos-settings-permission.md` (uncommitted) → include in the PASS commit. |
| 2 | **Note for BRIEF-057** | Low | `pos-routes.ts` is first-match and `/^\/pos\/settings(\/|$)/` → `venue:update` catches every settings sub-route. U1 must add `/pos/settings/staff…` → `staff:manage` (and U2 groups / policies → `staff:manage`) **before** the general settings rule, and the settings shell's tabs must read the same map — otherwise a user with `staff:manage` but no `venue:update` (custom role) is shut out of staff screens. |
| 3 | Info | — | Rail items without a page (ชำระเงิน, แขก) follow `reports:read` (brief silent) — sensible back-office tier; revisit when those pages exist. |
| 4 | Info | — | Brief's "cash รับเงินแล้ว needs `mark_paid`" was wrong (cash settles on create, `payments:create`); only manual confirm is gated — correct reading. |

## Recommendation to Field
Clean and safer than the brief asked for (one guard in the layout instead of one per page). The only issue was in my brief (the settings permission) — fixed by DR-029 A. Note 2 matters for U1.

**Next command:** `execute BRIEF-056` (PASS commit + PR — include `docs/decisions/DR-029-pos-settings-permission.md`).

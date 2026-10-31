# Audit — BRIEF-058 Web: groups & policies UI (U2)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-31 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-31 |
| **Branch / commit** | `feat/BRIEF-058-groups-policies-ui` · **S = `59aea49`** (work `a712a3c` + Sonar fixes `6eb6823`, `59aea49`) · handoff `71dae9b` · fix round 1 `33bd61d` (run proof) · merge `main` (057 = #107) `a82f90a` |
| **Depth** | Full (who gets access) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** (round 2) — Finding 1 fixed in `33bd61d`; no Must fix open. Field accepted #2 (switch matrix at 1280) and #6 (cosmetic, deferred to phone shell / DS) — session 2026-10-31. |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ (MSW) | e2e J1 1280 + `PoliciesScreen.test` / `GroupsScreen.test` AC-1 | |
| AC-2 | ✅ | `PoliciesScreen.test` AC-2; code: change count = added + removed codes (+ name / description), `write()` sends one ordered full set from the catalog | |
| AC-3 | ✅ | test ×2; used-by-many confirm only when codes change and `usage.groups + usage.users > 1`; ทั้งหมด `readOnly` | |
| AC-4 – AC-6 | ✅ | `GroupsScreen.test`, `PoliciesScreen.test`; `POLICY_IN_USE` parsed with the contract schema (`PolicyInUseDataSchema`) | |
| AC-7 | ✅ | test; on failure the editor's draft state is kept and only server data refetched | |
| AC-8 | ✅ | `PersonalPoliciesPanel.test` | |
| AC-9 | ✅ | `selfImpact.test` + screen tests; guard wired at all four writes (group save, group delete, policy save, own personal policies); computed from live memberships + personal policies; ทั้งหมด stores explicit codes, so the owner case is covered | Finding 3 |
| AC-10 | ✅ (MSW) | e2e J2 390: page area no overflow, save bar in viewport; tabs hidden without `staff:manage` | document-level overflow from the POS top bar = known (057 Finding 2) |
| AC-11 | ✅ (round 2) | gates ✅ (lint · typecheck · unit 317 · e2e 52 · build); real-stack proof in `33bd61d`: พนักงาน no manual confirm → in แคชเชียร์ → button present → delete with impact "Demo พนักงาน — จะเสีย: ยืนยันรับเงิน" → gone → personal รับเงิน → present → `POLICY_IN_USE` naming the person → removed → gone; DB cleaned to seed state. Cowork viewed screenshots 3, 5, 7 | Finding 1 resolved |
| AC-12-style route order | ✅ | `pos-routes.ts`: `/pos/settings/(staff|groups|policies)` → `staff:manage` before `/pos/settings` → `venue:update`; route test updated | the note I'd offered as Rev 2 was implemented anyway — no Rev needed |
| — | ✅ | **Cowork re-ran frontend `tsc --noEmit` on `71dae9b` (exit 0)** | |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | ~~Must fix~~ **Resolved `33bd61d`** | High | **Current:** §5 run proof (Job 1 in the UI → Demo พนักงาน in แคชเชียร์ → manual confirm appears on checkout → delete with impact dialog → gone → personal policy on/off) not done; `docs/handoffs/assets/BRIEF-058/` empty. All UI evidence is MSW. **Updated:** run it on the real stack with a hand-signed owner token (same method as 057) or Field's LINE login; add the 7 screenshots; record in the handoff. This is the only proof that the full-set `PUT`s and the effective-permission refresh agree with the real API. |
| 2 | **Accepted by Field (2026-10-31)** | Low | **Current:** the matrix at 1280 is one card-per-resource with Switches (row-like at ≥ md) instead of §6 "Table + CheckboxGroup at 1280". **Updated:** accept as-is — one DOM for both widths, same data and copy, matches the "switch per action under each resource" style you pointed to earlier. Otherwise it is a rework of `PolicyMatrix.tsx`. |
| 3 | Info | — | `useSelfGuard` runs the write without a warning when its own data (my member row / groups / policies) hasn't loaded yet. Consistent with D4 "warn, never block", and the server lockout rule still stops a last-owner loss. No change. |
| 4 | Suggestion | Low | `PolicyEditor.tsx:51` still S3776 (complexity just over 15). Fine to leave; split the save bar + confirm into a child if it grows. |
| 6 | **Accepted by Field as follow-up (2026-10-31)** | Low | Seen in screenshots: (a) group and personal-policy chips on staff detail stretch the full row width and read like a progress bar → **Updated:** chip `w-fit` / `self-start`; (b) at 390 each switch sits above its label instead of beside it, making rows tall → label and code beside the switch; (c) the sticky save bar runs under the left rail at ≥ md (handoff note). Bundle with the phone 390 shell / DS follow-up. |
| 7 | Info | — | Effective source reads "ส่วนตัว · นโยบาย รับเงิน" (AC-8 wording: "ส่วนตัว · รับเงิน") — same meaning, comes from the 057 panel's source format. No change. Run proof left 5 `cancelled` ฿10 QR payments on T2 (dev DB only). |
| 5 | Info | — | One flaky e2e (`customer-pay` AC-10) failed once under full load, passed on rerun — not this brief's code. Watch it in CI. |

## Recommendation to Field
U2 is done and now proven on the real stack: a group or a personal policy really turns manual payment confirm on and off for a staff member, and deleting shows exactly who loses what. With 057 + 058 the IAM track (I1–I3, U0–U2) is complete.

**Next command:** `execute BRIEF-058` (PASS commit + PR).

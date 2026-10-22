# Audit — BRIEF-035 Venue settings: API + POS settings screen

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-22 evening |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-22 |
| **Branch / commit** | `feat/BRIEF-035-venue-settings` · `3fa6743` (work) · handoff + DR-021 `86a7297` · seed `15f8acd` |
| **Depth** | Full (payment destination + audited settings) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS after Field decides DR-021** (+ Suggestions 1–2 if Field wants them in this brief) ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `VenueSettingsService.storeSettings`: venue `FOR UPDATE` → `changesOf` (only real changes) → `save()` → one `AuditLogService.record` with only changed columns; no change → no row, no event · e2e · run proof `audit_log` rows | |
| AC-1b | ✅ | `businessDateUnder` + unit test (06:00 → 05:00 at 23:00: 05:30 keeps tonight; next day new cut-off; later cut-off never reopens a finished day). Cowork traced both directions by hand — correct | In memory → Finding 3 |
| AC-2 | ⚠️ | 400 `VALIDATION_ERROR` for `25:00`, `6:00`, blank name, `{}`, non-boolean · e2e | "with field paths" not met — envelope has none → **DR-021 (Pending, Field)** |
| AC-3 | ✅ | e2e: order before → `['bar']`; kitchen on; order after → `['bar','food']`; first order unchanged | |
| AC-4 | ✅ | emitted after the transaction (rolled-back save never broadcasts), once per real change · e2e · run proof tab 2 board 3 → 4 columns | |
| AC-5 | ✅ | changed fields only, Toast, field errors from the shared schema, server 400 → form Alert, leave dialog · component + e2e | See Finding 1 |
| AC-6 | ✅ | masked ID, change → new mask, pending QR → 409 Alert, value unchanged · component + run proof (DB still `…0000`, no audit row) | |
| AC-7 | ✅ | Gateway radio disabled + "เร็วๆ นี้" · test + screenshot | |
| AC-8 | ✅ | all gates exit 0 (handoff) · `openapi:check` 0 · README row · Cowork re-ran `tsc --noEmit` frontend + backend and `eslint` on settings / hooks / api on `86a7297`: exit 0 | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope | ✅ | no gateway switch, no shift close, no 390 layout, no CD-13 rest |
| Deps | ✅ | none (`@internationalized/date` already present) |
| Audit / `save()` | ✅ | append-only `audit_log`, masked PromptPay values (BRIEF-024 path unchanged) |
| No inline permission checks | ✅ | `@RequirePermissions('venue:update')` only |
| Brief deviation handled by the rules | ✅ | field paths → DR-021 raised and stopped, not decided by the executor |
| Sonar | ✅ | no open issue in changed files; 16 pre-existing |
| Size | ⚠️ ok | ~1,119 net-new lines vs ~500 — same UI ≈ 2× pattern, noted |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Suggestion | Medium | `useSettingsForm.ts`: **Current:** `draft` is set once from the first `venue`; when `venue.settings_changed` refreshes `['venue']` (another tab or device), an **untouched** form keeps the old values, so it shows as dirty and **บันทึก would send the old values back — undoing the other change** (and the leave guard fires). **Updated:** when the draft has no user edits (draft equals the previous saved values), reset it to the new server values; keep user edits otherwise. One test: refresh with an untouched form → not dirty, nothing to save. |
| 2 | Suggestion | Low | `storeSettings`: **Current:** `previousCutoff` is set inside the transaction, before commit — a failed commit would leave the in-memory grace pointing at a cut-off change that never happened. **Updated:** return the old cut-off from `storeSettings` and set `previousCutoff` in `updateSettings` after the commit (next to the event). |
| 3 | Carry-over | Info | The cut-off grace lives in one process's memory (restart → new cut-off applies at once). Fine for one local process and accepted by the brief; **before ECS runs > 1 task**, persist it (e.g. `previous_cutoff` + `cutoff_changed_at` on `venue` — schema change → DR then). |
| 4 | Carry-over (Field) | **High for the demo** | Handoff run proof: backend `test:e2e` **shares the dev database and clears staff / venue** — Field's login broke until re-seeded. With BRIEF-036's `seed:demo-history`, every backend e2e run would also wipe the 30-day demo data before the Monday update / 10 Nov. **Updated:** e2e on its own database (e.g. `bar_test`, created by the e2e setup from `DATABASE_URL` + suffix). Cowork recommends adding it to BRIEF-036 as Rev 2 scope (small, same executor run) — Field decides. |

## DR-021 (Pending — Field)
Executor implemented option **B** (client-side validation with the shared contracts schema; server 400 → form Alert) and raised the DR instead of changing the shared error envelope inside a settings brief — correct per workflow §5. Cowork agrees with the DR's recommendation: **B now; A (`data.details[{ path, message }]`) as its own small brief later** (menu editor BRIEF-040 will want field paths for server-only rules like `MENU_ITEM_STALE` details — a good time to do A).

## Recommendation to Field
PASS once you decide DR-021. The backend is careful (lock → diff → save → audit → emit after commit), Q1's next-day cut-off is correct in both directions, and the run proof shows the live 3 → 4 column switch and the 409 guard on a real QR. Finding 1 is the one I'd fix now (it can silently undo a setting); Finding 2 is two lines.

**Next command:** decide DR-021 (and whether to fix S1–S2 here) → `execute BRIEF-035` (fixes if any, then PASS commit: this audit + handoff + DR-021 decision + state, then PR; merge when `ci` is green).

## Evidence Coverage
- Reviewed work SHA: `3fa6743` (handoff `86a7297`)
- Sources inspected independently: backend diff (`business-date.ts`, `order.service.ts`, `venue-settings.service.ts`, `venue.repository.ts`, `venue.controller.ts`, `venue.typeorm-repository.ts`, `venue.module.ts`); frontend `useSettingsForm.ts`, `useLeaveGuard.ts`, `PromptPayForm.tsx`, `useVenueEvents.ts`; DR-021; handoff + `audit_log` excerpt
- Tests: typecheck (frontend + backend) and eslint re-run (exit 0); vitest / jest / e2e / build not re-run (Cowork shell) → GitHub `ci`
- Written uncommitted; the executor commits it unchanged at PASS.

## Field, 2026-10-23 (session)
- **DR-021:** Approved B (recorded in the DR on this branch).
- **S2 → fix in this brief:** `storeSettings` returns the old cut-off; `updateSettings` sets `previousCutoff` after the commit, next to the event. Unit test: a failed commit leaves `businessDayRule().previous` unchanged.
- **S1 → fix in this brief:** `useSettingsForm` tracks the server values the draft started from; when `['venue']` refetches with different values, the draft takes the new server values except fields the user actually edited. Tests: untouched form + refetch (kitchen on) → not dirty, nothing to save, no leave dialog; edited name + refetch → name kept, kitchen follows the server, save sends only `name`.
- Gates + Sonar re-run on the fix commit; Cowork re-checks that commit only.
- **Finding 4:** moved to BRIEF-036 Rev 2 (`bar_test`), approved.

## Re-check — 2026-10-23 · `57ff2cf` (S1–S2, Field instruction)
| # | Result | Evidence |
|---|---|---|
| S2 | ✅ | `storeSettings` returns `replacedCutoff`; `updateSettings` sets `previousCutoff` after the commit, next to the event. Specs: grace recorded once the save commits · a failed commit leaves grace **and** broadcast untouched · a save of other fields keeps the existing grace. |
| S1 | ✅ | `useSettingsForm`: `base` = server values the draft started from; on a different `['venue']` value, `rebase()` takes the server value for every field the user has not edited (adjust-state-during-render pattern, no stale frame). Own save still resets cleanly (`onSuccess` sets the cache and draft to the response, `rebase` then returns the same values). Tests: untouched form + refresh → not dirty, nothing to save · edited name + refresh → name kept, rest follows the server. |

Diff `86a7297..57ff2cf`: 2 source files (+42 / −6) and their tests — no other behaviour changed. Cowork re-ran `tsc --noEmit` (frontend + backend) and `eslint src/app/pos/settings` on `57ff2cf`: exit 0. Full gates + Sonar on this commit: executor to record in the handoff at PASS (not in `57ff2cf`); GitHub `ci` on the PR head is the independent check.

**Final result: PASS** — zero Must fix, zero open suggestions in this brief (Finding 3 carry-over; Finding 4 → BRIEF-036 Rev 2).

**Next command:** `execute BRIEF-035` — PASS commit (this audit + updated handoff with gate evidence for `57ff2cf` + DR-021 decision + state; **not** `docs/decisions/DR-020-menu-photos-s3.md`), then PR; merge when `ci` is green.

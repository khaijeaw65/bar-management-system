# Audit — BRIEF-043 Backend: database-owned `updated_at` (shared monotonic trigger)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session 2026-10-23 |
| **Assignment** | Brief auditor = Cowork (default); no fallback |
| **Date** | 2026-10-23 |
| **Branch / commit** | `feat/BRIEF-043-db-updated-at` · **S = `f36b872`** (work) · handoff `c40b135` · `main` merged at `01d78b3` · seeds `52f236c` + Ready `a79771b` |
| **Depth** | Full (every module's write path) |
| **Brief revision** | 1 |
| **Recommendation** | **PASS** ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `1762500000000-UpdatedAtTrigger.ts`: `set_updated_at()` = `NEW.updated_at := GREATEST(now(), OLD.updated_at + interval '1 millisecond')`, `BEFORE UPDATE … FOR EACH ROW` `trg_<table>_updated_at` on exactly DR-023's 14 tables · e2e: `save()`, raw SQL, raw SQL setting 2000 and 2999 → stamp > previous, ≈ now; 3 updates in one transaction strictly increase · psql in the run proof | `NEW.updated_at` from the writer is always ignored — matches DR-023 |
| AC-2 | ✅ | e2e with two `pg` clients: T1 begins (its `now()` earlier), T2 updates + commits, T1 updates → T1 > T2 — exactly the case `now()` alone gets wrong | |
| AC-3 | ✅ | `touchedAt` / `clock.now()` removed from service, port and repository · a variant-only / link-only PATCH runs `TOUCH_ITEM` (`UPDATE menu_item SET updated_by = COALESCE($2, updated_by)`) so the trigger stamps the row · `$2` = `cls.get('userId')`, the same key `AuditSubscriber` reads → the editor is still recorded · `menu-write.e2e-spec.ts` green unchanged | Raw UPDATE on an audited table: it only touches; `save()` still runs for real column changes, so the subscriber rule holds |
| AC-4 | ✅ | Menu PATCH / GET read after commit → stored value · **86:** `saveAvailability` now returns `updated_at` re-read on `txHost.tx` inside the toggle's transaction (it used to return the pre-save value) · **venue:** `saveSettings` re-reads on `this.venues` = `txHost.tx` repository; `venue.settings_changed.updatedAt` now the stored stamp, not `clock.now()` · tickets: `ticketById` SQL inside the writing transaction → already stored · e2e compares each REST / WS value with the DB row; venue unit spec asserts the repository stamp | `visit.typeorm-repository.ts` no longer writes `updated_at = now()` — required by DR-023 ("app code never writes `updated_at`") |
| AC-5 | ✅ | `down` drops 14 triggers then the function; e2e down → 0 → up → 14 · dev DB revert + run both succeed · full e2e 160 / 24 files incl. `demo-history-seed` | see Finding 1 |
| AC-6 | ✅ | Handoff on `f36b872`: lint, typecheck, unit 131, e2e 160, `openapi:check` 0 · run proof (14 triggers, psql override ignored, ticket accept / send and menu PATCH values = DB) · Cowork re-ran backend `tsc --noEmit` + `check-class-files` (exit 0) | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| DR-023 locks | ✅ | function name, rule, trigger names, 14 tables, INSERT untouched; no app write of `updated_at` left (`grep` in handoff; Cowork's read of the diff agrees) |
| Unlocked protected file | ✅ | `docs/schema.sql` — header note + function + 14 trigger statements; commit trailer cites the brief unlock and DR-023 |
| Migration | ✅ | one file, registered in `migrations.ts`, reversible |
| Module boundaries | ✅ | `ClsService` into `MenuWriteTypeormRepository` (existing package, same module); no cross-module import |
| No API / contract change | ✅ | `openapi:check` clean; `updatedAt` values now DB-owned |
| `BaseEntity` | ✅ | decorators untouched — no test showed a wrong returned value from them |
| Sonar | ✅ | none in files this brief adds or changes |
| Size | ✅ | ~358 net app lines (tests ≈ 210) + 29 in `schema.sql` |

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Suggestion (next backend brief) + **correction** | Low | **Correction to BRIEF-042 audit Finding 3:** `test/global-setup.ts` only creates `bar_test` if missing and runs *pending* migrations — it does not rebuild the DB. So if the down / up tests in `order-snapshots.e2e-spec.ts` (042) or `updated-at-trigger.e2e-spec.ts` (043) fail between `down()` and `up()`, the local `bar_test` stays without those columns / triggers (the migration is still recorded as executed) and later runs fail until it is dropped. **Updated:** in both tests, restore in `finally` (`up()` when the columns / triggers are missing), or have `global-setup` drop and recreate `bar_test` each run. Not blocking: it only bites after one of those tests already failed. |
| 2 | Info (Cowork → Field, after merge) | — | DR-023 rule line ("every new table with `updated_at` attaches `trg_<table>_updated_at` in its own migration; app code never writes `updated_at`") for `backend.md` / CLAUDE.md, and an `erd.html` note — Cowork shows the exact diffs after merge. |
| 3 | Info (BRIEF-044) | — | `modifier_group` already has its trigger, so BRIEF-044's `is_active` column needs no trigger work; its migration must not write `updated_at`. |
| 4 | Info (dev machine) | — | The run proof replaced the :3001 backend with a plain `node dist/main` of `f36b872`; the migration stays applied on dev `bar`. |

## Recommendation to Field
PASS. The trigger is exactly DR-023, the overlapping-transaction case is proven with two real connections, and the three places that used to hand back a stale or app-clock `updatedAt` (86 toggle, venue event, menu PATCH) now return what the database stored. One rule for every writer, as decided.

**Next command:** `execute BRIEF-043` (PASS commit: this audit + handoff + state, then PR; Field's own PR — merge once `ci` is green on H and S..H is evidence-only).

## Evidence Coverage
- Reviewed work SHA: `f36b872` (handoff `c40b135`; `git diff main...HEAD`)
- Sources inspected independently: migration + registry, all `modules/**` diffs (menu catalog / write services + repositories + ports, venue settings service + repository, visit repository), `audit.subscriber.ts` + `cls-user.interceptor.ts` (CLS key), venue repository `manager` getter (`txHost.tx`), `test/global-setup.ts`, commit message trailer
- Tests: Cowork re-ran backend `tsc --noEmit` + `check-class-files` (exit 0); oxlint / unit / e2e not re-run (macOS-built binaries) → handoff exits + `ci` on H.
- Run proof: read from the handoff.
- Written uncommitted; the executor commits it unchanged at PASS.

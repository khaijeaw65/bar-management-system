# Handoff — BRIEF-043 Backend: database-owned `updated_at` (shared monotonic trigger)

| | |
|---|---|
| **Implementer** | kj (Claude Code) |
| **Date** | 2026-10-23 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-043-db-updated-at` (seed `a79771b`, `main` merged `01d78b3`) |
| **Commit** | Work SHA `f36b872` |
| **Assigned auditor** | Cowork |
| **Status** | Audit PASS (Cowork, 2026-10-23, S = `f36b872`) — PR opened with this commit |

## Summary
- **Migration** `1762500000000-UpdatedAtTrigger.ts` (registered in `migrations.ts`): `set_updated_at()` = `NEW.updated_at := GREATEST(now(), OLD.updated_at + interval '1 millisecond')` + `BEFORE UPDATE … FOR EACH ROW` trigger `trg_<table>_updated_at` on the 14 tables DR-023 lists. `down` drops the 14 triggers, then the function. `INSERT` unchanged.
- **Menu PATCH:** the `touchedAt` / `clock.now()` stamp is gone from `MenuWriteService`, the `MenuWriteRepository` port and `MenuWriteTypeormRepository`. A variant-only / link-only edit changes no item column, so TypeORM `save()` writes nothing — the repository now always runs a bare `UPDATE menu_item SET updated_by = COALESCE($2, updated_by) WHERE id = $1` after the save (the trigger stamps `updated_at`; `$2` = CLS user, so the editor of a price-only edit is still recorded as before).
- **Returned values** (AC-4), checked one by one:
  - menu item (PATCH / GET): read after commit from `menu_item` → already the stored value; no change.
  - **menu availability toggle (86):** `MenuCatalogService.setAvailability` built its item from the pre-save `locked` record → it returned the **old** `updatedAt`. `MenuCatalogRepository.saveAvailability` now returns the stored `updated_at` (re-read in the same transaction) and the service uses it. (A plain `getItem()` re-read does not work here — it reads outside the 86 transaction.)
  - order tickets (REST + `ticket.status_changed` / `ticket.issue_escalated` / sold-out cancel): all come from `OrderQueryService.ticketById` → SQL `t.updated_at` inside the writing transaction → already the stored value; no change.
  - **venue settings event:** `venue.settings_changed.updatedAt` was `clock.now()`. `VenueRepository.saveSettings` now returns the stored `updated_at` (re-read after `save()`); the event carries it. `StoredSettings.changed` became `updatedAt: Date | null` (null = nothing changed → no broadcast).
- **Raw app writes removed:** `visit.typeorm-repository.ts` `CLOSE_IF_LIVE` / `ACTIVATE_VISIT` no longer set `updated_at = now()` (the trigger does).
- `BaseEntity` decorators untouched (no test showed the returned value wrong because of them).
- **Docs:** `docs/schema.sql` — header note + function + 14 trigger statements above the seed data (unlocked path; commit trailer `Approved-by: Field`). `docs/erd.html` and the `backend.md` / CLAUDE.md rule line (DR-023) stay with Cowork / Field.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `updated-at-trigger.e2e-spec.ts` "AC-1": TypeORM `save()`, raw SQL, raw SQL with `updated_at = '2000-01-01'`, raw SQL with `'2999-01-01'` → stamp > previous and ≈ now; three updates in one transaction increase strictly |
| AC-2 | ✅ | "AC-2": two `pg` clients — T1 `BEGIN` + `SELECT now()`, 20 ms later T2 begins, updates, commits; T1 updates, commits → T1's stamp > T2's |
| AC-3 | ✅ | `menu-write.e2e-spec.ts` unchanged and green (stale 409, variant-only edit moves the stamp); `grep -rnE "(updatedAt\|updated_at)\s*=[^=]" src` outside migrations/specs: only the two new `const updatedAt = await …` locals |
| AC-4 | ✅ | "AC-4": menu PATCH, 86 (`mark-unavailable`), ticket `accept` (REST + `ticket.status_changed` payload via `emitToStaff` spy), venue settings PATCH (`venue.settings_changed` payload) — each `updatedAt` equals the DB row. Venue unit spec also asserts the payload carries the repository's stamp, not the clock |
| AC-5 | ✅ | "AC-5": `down()` → 0 triggers + function gone → `up()` → 14. Dev DB: `migration:revert` then `migration:run` both succeed. Full e2e (incl. `demo-history-seed`) green |
| AC-6 | ✅ | gates + run proof below |

## Gate Evidence (G1)
Run on `f36b872` (clean tree). e2e used `bar_test`; the dev backend (pid 65197, plain `node dist/main`) was stopped first.

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/backend lint` (oxlint + class-files) | 0 | pass |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 131 passed (37 files) |
| `pnpm --filter @bar/backend test:e2e` | 0 | 160 passed (24 files) |
| `pnpm --filter @bar/backend openapi:check` | 0 | `docs/api/openapi.json` unchanged |
| run proof (below) | 0 | health 200 on the work SHA; trigger + API checks ✅ |

## Run proof
`pnpm migration:run` on dev `bar` → `UpdatedAtTrigger1762500000000` executed; `pg_trigger` → **14** `trg_*_updated_at`. `migration:revert` → reverted, `migration:run` → executed again. In `psql` (inside `BEGIN … ROLLBACK`): `UPDATE menu_item SET updated_at = '2000-01-01' …` → row reads `2026-10-23 10:02:27+00` (now), not 2000. Fresh `node --env-file=.env dist/main` on :3001 → `/api/health` **200**. Session for `Field (demo)` minted with a local script (no LINE).

| Step | REST / payload | DB |
|---|---|---|
| T1: `POST /visits/:id/orders` (ช้างดราฟต์) → `POST /tickets/:id/accept` | `updatedAt` 2026-10-23T10:03:02.637Z | `order_ticket.updated_at` …02.637Z ✅ |
| `POST /tickets/:id/send` | …02.727Z | …02.727Z ✅ |
| `PATCH /menu/items/:id` (ช้างดราฟต์, nothing changed — variant-only shape) | …28.742Z (was 2026-10-22T18:59:44.489Z) | `menu_item.updated_at` …28.742Z ✅ |

No UI is changed by this brief; no screen was exercised (the orders board consumes the same REST / WS values checked above).

**Local data touched:** the proof order #4 (1 order, 1 ticket, 1 line) was deleted from dev `bar` again; the menu PATCH re-saved ช้างดราฟต์ with identical values (only `updated_at` / `updated_by` moved). The migration on `bar` stays applied. **Processes:** the plain `node dist/main` of `ef1151d` on :3001 was replaced by one of `f36b872`; SonarQube containers untouched.

## Sonar (local scan)
- Scanned commit: `f36b872` · Quality Gate: **ERROR** — `new_coverage` 0.0 % (no coverage path, known) and `new_violations` 16.
- Issues by severity: BLOCKER 0 · HIGH 5 · MEDIUM 5 · LOW 6 · INFO 1 (`pnpm sonar:report`) — the same 16 as at `ef1151d` (top 10: `setup.ts`, `order-query.service.ts`, `request-hash.ts`, `promptpay-payload.ts`, `seed-menu-catalog.ts`, `menu-availability.ts`, `document.ts`, `globals.css`); none in a file this brief adds. No exclusions, won't-fix or gate change.
- Who fixed: n/a.

## Decisions Raised
- None. Pre-decided items used exactly: function `set_updated_at()`, trigger names `trg_<table>_updated_at`, the 14 tables, the `GREATEST(now(), OLD.updated_at + interval '1 millisecond')` rule, file name `<timestamp>-UpdatedAtTrigger.ts`.

## Deviations from Brief
- None needing a DR. Interpretations (auditor please check):
  - **Registry:** the migration is also listed in `providers/database/migrations.ts` (needed for `runMigrations`).
  - **`ClsService` injected into `MenuWriteTypeormRepository`** (new constructor dependency inside an existing module, no new package) so the touch keeps `updated_by`. If you would rather drop `updated_by` on a variant-only edit, the touch is one line (`SET updated_at = updated_at`).
  - **Two UPDATEs on one `menu_item` row** when item columns change (the `save()` and the touch): the second stamp is +1 ms; harmless, and `save()` is kept so `AuditSubscriber` still runs.
  - **86 and venue settings** are fixed by returning the stored stamp from the repository (not by re-reading in the service), because the 86 runs inside the caller's transaction.
  - **`visit.typeorm-repository.ts`** loses its `updated_at = now()` assignments (brief: "app code never writes `updated_at`"; not listed under Scope → Out of file list).
  - **Postgres `now()` and the test:** AC-2 holds because the function takes `GREATEST` with the previous stamp; T1's own `now()` is earlier than T2's stamp by construction (20 ms wait).

## Known Gaps / Follow-ups
- **Size:** 383 net-new lines in `app/` + 29 in `schema.sql` (tests ≈ 210) vs ~300–400 estimated.
- `docs/erd.html` (Cowork) and the DR-023 rule line "new tables with `updated_at` attach the trigger" → `backend.md` / CLAUDE.md (Field) are still open — listed in the state's Carry over.
- The AC-5 test calls `down()` then `up()` on the shared test DB; if an assertion between them fails, `bar_test` is left without triggers and `global-setup` will not re-run the migration (it is recorded as executed) → run `migration:revert` + `migration:run` against `bar_test`, or drop the DB (same caveat as BRIEF-042 audit Finding 3).

## AI Usage
**High** — Claude Code wrote all code, tests and docs (Field 0 % coding, reviewer mode).

## Review Routing
- Assigned auditor: Cowork
- Audit: **PASS** (`docs/audits/BRIEF-043.md`), zero Must fix; S = `f36b872`, S..H = audit / handoff / state only. Finding 1 (Suggestion, next backend brief): restore the migration in `finally` in the down/up tests of 042 and 043, or have `global-setup` recreate `bar_test` (it only runs pending migrations — corrects the 042 audit's note). Findings 2–4 info (Cowork shows the DR-023 rule-line + `erd.html` diffs after merge; BRIEF-044's `is_active` migration must not write `updated_at`; dev backend now `f36b872`)
- Next command: merge on green `ci` (Field's own PR, §7)
- Work SHA: `f36b872` · self-check: brief §2–§4 ↔ DR-023 locks ↔ `1762500000000-UpdatedAtTrigger.ts` ↔ `schema.sql` ↔ menu / venue / ticket `updatedAt` read paths ↔ `updated-at-trigger.e2e-spec.ts`; no API shape, contract or permission change

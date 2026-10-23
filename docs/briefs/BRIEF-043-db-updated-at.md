# BRIEF-043 — Backend: database-owned `updated_at` (shared monotonic trigger)

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend |
| **Revision** | 1 |
| **Depends on** | DR-023 Approved · BRIEF-042 merged (queue order; both add migrations) |
| **References** | DR-023 · BRIEF-038 audit F2 (Field 2026-10-23: all audited tables) · `common/base/base.entity.ts` · `menu-write.typeorm-repository.ts` (`touchedAt`) · `docs/schema.sql` |
| **Audit depth** | Full (every module's write path) |
| **Size** | ~0.5–1 day · est. ~300–400 net-new lines (mostly tests) |

---

## 1. Goal
`updated_at` means one thing everywhere: the database's time of the last update, always moving forward — whoever writes the row.

## 2. Scope
### In
- **Migration** `app/backend/src/providers/database/migrations/<timestamp>-UpdatedAtTrigger.ts`: function `set_updated_at()` + trigger `trg_<table>_updated_at` on the 14 tables DR-023 lists, exactly as locked. `down` drops the triggers and the function.
- **Remove the app stamp:** BRIEF-038's `touchedAt` / `clock.now()` path in `MenuWriteService` / `MenuWriteTypeormRepository`; a variant-only or link-only PATCH must still move `menu_item.updated_at` — touch the item row with a plain update (the trigger stamps it).
- **Returned values:** every place that returns `updatedAt` to a client (menu item, order ticket REST + WS `order.*` payloads, venue settings event) must carry the value stored by the trigger — verify; where the in-memory entity can differ after `save()`, re-read the row.
- `docs/schema.sql`: function + trigger block and a header note (unlocked below).

### Out (do NOT build here)
- Version / row-version columns · `created_at` · tables without `updated_at` (link tables, `audit_log`, `order_item_modifier`, …) · tables not created yet (they attach the trigger in their own migration — DR-023 rule) · rule-file edits (`backend.md` / CLAUDE.md — Field-approved, outside the brief).

## 3. Contract
- **Endpoints / WS / contracts:** unchanged — `updatedAt` values now come from the database trigger.
- **Business rules:** DR-023 — DB owns `updated_at`, monotonic per row.

## 4. Acceptance Criteria
- **AC-1** — An `UPDATE` through TypeORM `save()`, raw SQL, and raw SQL that sets `updated_at` to a past value all end with `updated_at` = DB time (≥ previous + 1 ms); the supplied value is ignored.
- **AC-2** — Overlapping transactions: T1 begins, T2 begins + updates the row + commits, T1 updates the same row + commits → T1's `updated_at` > T2's (two connections in the test).
- **AC-3** — BRIEF-038 `menu-write.e2e-spec.ts` passes unchanged (stale 409, variant-only edit moves the stamp); no `clock.now()` write to `updated_at` remains (`grep`).
- **AC-4** — For a menu PATCH, a ticket status change (REST + `order.*` WS payload) and a venue settings update, the returned `updatedAt` equals the row's `updated_at` read back from the DB.
- **AC-5** — `migration:revert` then `migration:run` succeeds; the full backend e2e suite and `seed:demo-history` pass.
- **AC-6** — Gates + run proof.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2, AC-5 | e2e (real Postgres) | `app/backend/test/updated-at-trigger.e2e-spec.ts` |
| AC-3 | existing e2e | `test/menu-write.e2e-spec.ts` |
| AC-4 | e2e | `updated-at-trigger.e2e-spec.ts` (+ existing order / venue suites) |

Gate commands (all must pass):
```bash
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck && pnpm --filter @bar/backend test && pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:check
```
Run proof: dev DB → `migration:run` → `\dy` / `pg_trigger` lists 14 triggers → in `psql`: `UPDATE menu_item SET updated_at = '2000-01-01' WHERE …` → value is now, not 2000 → POS: send an order and move a ticket on the orders board; the card and the REST response show the same `updatedAt` as the DB.

### Local Sonar scan
- **Required for this brief: yes.**

## 6. Constraints
- One migration; trigger SQL exactly as DR-023 locks.
- Don't change `BaseEntity` decorators unless a test proves the returned value is wrong without it — record the reason in the handoff.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact):** function `set_updated_at()`, trigger names `trg_<table>_updated_at`, the 14 tables, the `GREATEST(now(), OLD.updated_at + interval '1 millisecond')` rule (DR-023) · migration file name `<timestamp>-UpdatedAtTrigger.ts`.
- **Likely DRs:** none.

## 8. Unlocked Protected Files
- `docs/schema.sql`

---

## Ready Checklist
- [ ] Named implementer and auditor; scope/ACs/contracts/references complete
- [ ] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [ ] Size within workflow §2 (≤ ~3 working days, ~500 net-new lines); otherwise split
- [ ] No unresolved decision blocking the main outcome (DR-023 Approved)
- [ ] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-23 | Initial Draft (Cowork) — BRIEF-038 audit F2 (Field: DB-owned `updated_at`, all audited tables) |

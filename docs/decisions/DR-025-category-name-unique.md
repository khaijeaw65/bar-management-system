# DR-025 — Category names are unique (DB index + mapped `23505`)

| | |
|---|---|
| **Status** | Pending |
| **Raised by** | Cowork · 2026-10-23 (BRIEF-045 Q1) |
| **Brief** | BRIEF-045 |
| **Category** | Data |

## Context
CD-12 §9 Categories says a new category name is "required + unique". Today neither the API nor the DB enforces it: `menu_category.name` is a plain `VARCHAR(200) NOT NULL` and `POST` / `PATCH /menu/categories` accept any name. Duplicates break no relation (items reference the category by `id`), but the POS chips, the back office and future reports show two indistinguishable categories. A UI-only check (compare with the loaded list) misses two devices saving at the same moment and any seed / script insert.

**Field interview (2026-10-23, BRIEF-045):**

| # | Question | Selected (by KJ) |
|---|---|---|
| 1 | Enforce unique names at all? | **Yes, server-side** (BRIEF-045 Q1 = B) |
| 2 | What counts as the same name | **`lower(trim(name))`** — Thai has no case; `lower()` only affects Latin names ("Beer" = "beer") |
| 3 | Do hidden categories keep their name | **Yes, all rows** — showing a hidden category again can never collide |
| 4 | Migration meets existing duplicates | **Fail loudly** — list the names, fix by hand (dev / test data only, no production yet) |
| 5 | Enforcement | **DB unique index + catch `23505`** |

Clarified in the interview: hiding a category hides its items from every ordering surface at read time (`menu-availability.ts`, `listed = categoryActive`); no item row changes, and showing the category again restores them as they were.

## Options

**A) DB unique expression index + map `23505` → 409** *(recommended; same pattern as `visit.typeorm-repository.ts` `uq_visit_live_per_seat`, BRIEF-011 — the expression index on `lower(trim(name))` is the part new to the owner)*
1. Migration: `CREATE UNIQUE INDEX uq_menu_category_name ON menu_category (lower(trim(name)))`.
2. `POST` / `PATCH { name }` → service opens the transaction → repository `save()`.
3. Postgres checks the index during the INSERT / UPDATE. Taken → raises SQLSTATE `23505` (`unique_violation`, Oracle ORA-00001) with `constraint = 'uq_menu_category_name'`.
4. Repository catches `QueryFailedError` where `driverError.code === '23505'` **and** the constraint is `uq_menu_category_name` → `DomainException('CATEGORY_NAME_TAKEN', 'มีหมวดชื่อนี้แล้ว', 409)`; any other error is rethrown unchanged.
- **Inside the DB transaction:** steps 2–4 (the check is part of the write itself). **Outside:** the `menu.changed` emit, only after commit.
- **Failure → what's left → who cleans:** duplicate → transaction rolls back, nothing written, client gets 409 and shows it on the name field — nothing to clean. Two devices at the same instant → Postgres serialises on the index: one commits, the other gets 409. Seed / raw SQL insert of a duplicate → also rejected by the index.
- Cost: one migration + ~20 lines in the repository + tests. Writes don't wait on each other.

**B) App check under a lock** *(baseline — familiar: read, compare in code, write)*
1. Service opens the transaction → `SELECT … FROM menu_category FOR UPDATE` (all rows, existing `lockCategoryOrder`).
2. Compare `lower(trim())` of every row with the new name in TypeScript (skip the row being renamed).
3. Taken → throw 409 `CATEGORY_NAME_TAKEN`; else `save()` → commit.
- **Inside the DB transaction:** steps 1–3; the row locks make concurrent category writes wait. **Outside:** the emit.
- **Failure → what's left → who cleans:** duplicate → rollback, nothing written. Two `PATCH` renames serialise on the locks. **Gap:** a `POST` adds a new row that the other transaction's lock didn't cover → two concurrent creates can still both pass unless the lock is widened (table lock / advisory lock). Seed scripts and raw SQL bypass it entirely → duplicates possible, and nothing finds them later.
- Cost: no migration; ~30 lines; every category write serialises.

**C) Both — app pre-check (B) for the message + index (A) as backstop**
- Flow = B's steps 1–3, then A's steps 3–4 as the safety net.
- Same guarantees as A; two places that must agree on "same name" (TypeScript and the index expression) — drift risk; most code.

## Recommendation
**A**, as Field selected. The database is the only place that sees every write (API, seed, script) at the moment it happens, so it is the only race-free referee; the project already maps a unique-index `23505` this way for visits. B is fine only for a single writer and still leaks through `POST` races and scripts; C adds code for a nicer message A already gives.

## If Approved — Locks
- `menu_category`: `CREATE UNIQUE INDEX uq_menu_category_name ON menu_category (lower(trim(name)))` — all rows, hidden included.
- Migration `app/backend/src/providers/database/migrations/<timestamp>-CategoryNameUnique.ts`: before creating the index, query duplicates (`GROUP BY lower(trim(name)) HAVING count(*) > 1`); any found → throw with the duplicate names listed; no auto-rename. `down` drops the index.
- `POST /menu/categories` and `PATCH /menu/categories/:id` (name change) → 409 `CATEGORY_NAME_TAKEN` ("มีหมวดชื่อนี้แล้ว"); mapped only for `23505` on `uq_menu_category_name`, everything else rethrown. New error code in contracts.
- Renaming a category to its own name with different spacing / case is allowed (same row — the index entry is replaced, no conflict) (proposed).
- `docs/schema.sql` §4 + `docs/erd.html` updated (erd by Cowork, Field-approved).

---

## Decision — Field only
**Decision:** <Approved: A · Rejected · Approved with change: …>
**Why:** <one or two lines>
**Date:** YYYY-MM-DD

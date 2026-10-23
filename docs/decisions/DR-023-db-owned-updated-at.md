# DR-023 — The database owns `updated_at` (monotonic trigger on every table that has it)

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Cowork · 2026-10-23 (BRIEF-038 audit Finding 2) |
| **Brief** | BRIEF-043 |
| **Category** | Data · Flow/Architecture |

## Context
`updated_at` is written by three different sources today: TypeORM `@UpdateDateColumn` (`BaseEntity` → `CURRENT_TIMESTAMP`), raw SQL `now()` (e.g. `visit.typeorm-repository.ts`), and — since BRIEF-038 — the app clock (`clock.now()` in the menu PATCH, so a variant-only edit still moves the stamp). Some raw `UPDATE`s set nothing (`seed-venue.ts`, `demo-history.ts`). BRIEF-038's `MENU_ITEM_STALE` check compares these stamps, so it assumes one clock that only moves forward. Two gaps: app vs DB clock skew once ECS and RDS are separate hosts, and `now()` = **transaction start**, so a transaction that started first but takes the row lock second can write an older stamp.

**Field direction (2026-10-23, BRIEF-038 audit session):** the database sets `updated_at` on every update, on **all audited tables** (option C below), before 8 Nov.

## Options
**A) Fix in app code** — stamp PATCH with `GREATEST(now(), updated_at + 1 ms)` in the menu repository only / smallest; leaves three writers.
**B) Trigger on `menu_item` only** — fixes the one table with a conflict check / two rules for `updated_at` in the codebase.
**C) One shared trigger on every table with `updated_at`** — one rule for every writer (ORM, raw SQL, CLI, psql); future conflict checks get it free / one migration touches 14 tables incl. order / payment / visit; app code must not rely on the in-memory value after `save()` without checking it matches.

## Recommendation
C, as Field directed — one rule for every writer. Cowork's earlier timing concern (order / payment tables right before 8 Nov) is handled by BRIEF-043's AC on every `updatedAt` the API returns, and by running the full backend e2e suite.

## If Approved — Locks
- One plpgsql function `set_updated_at()`: `NEW.updated_at := GREATEST(now(), OLD.updated_at + interval '1 millisecond'); RETURN NEW;`
- `BEFORE UPDATE … FOR EACH ROW` trigger `trg_<table>_updated_at` on every table that has `updated_at` today: `venue`, `table_seat`, `visit`, `staff_user`, `menu_category`, `menu_item`, `menu_item_availability`, `menu_item_variant`, `modifier_group`, `modifier_option`, `order_record`, `order_ticket`, `order_item`, `payment`.
- **Every future migration that creates a table with `updated_at` attaches the same trigger** (rule line for `backend.md` / CLAUDE.md schema rules — protected, Field-approved edit).
- App code never writes `updated_at` (BRIEF-038's `clock.now()` stamp removed); values the API returns come from the database.
- `INSERT` is unchanged (`DEFAULT NOW()`; seeds may set historical values).

---

## Decision — Field only
**Decision:** Approved: C (shared monotonic trigger on every table with `updated_at`; future tables attach it in their migration)
**Why:** One rule for every writer; the stale-edit check needs one clock that only moves forward.
**Date:** 2026-10-23 · recorded by Cowork on Field's explicit instruction (session: "approve all" on DR-022, DR-023, BRIEF-039 Q1 = A + Ready, BRIEF-042 Ready, BRIEF-043 Ready)

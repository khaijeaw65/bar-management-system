# DR-024 — Add-on groups are archived, not deleted

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Cowork · 2026-10-23 (BRIEF-044 Q1) |
| **Brief** | BRIEF-044 |
| **Category** | Data |

## Context
CD-12 asks for "delete group" in the back office (delete disabled while items use it, R6 / R7-3). `order_item_modifier.modifier_option_id` references `modifier_option(id)` with no `ON DELETE`, so once any option of a group has been ordered, Postgres refuses to delete the options — and so the group. Since DR-022 past lines no longer *need* that row to read correctly (name and price are snapshotted), but the foreign key still exists. Without a decision, a group that was ever sold could be unlinked from every item but never removed from the add-on list.

**Field direction (2026-10-23, BRIEF-044 Q1):** option B — archive.

## Options
**A) Refuse with 409 "มีในออเดอร์เก่า"** — no schema change / old groups stay in the list forever.
**B) Archive: `modifier_group.is_active`** — "delete" hides the group from the list and from linking; history untouched / one column + migration.
**C) Loosen the FK (`ON DELETE SET NULL`, nullable `modifier_option_id`)** — real deletes / changes an order table and the `optionId` contract; per-option sales history loses its link.

## Recommendation
B, as Field directed — the list stays clean and nothing that past orders point at is ever removed (same principle as variants and options: deactivate, never delete).

## If Approved — Locks
- `modifier_group.is_active BOOLEAN NOT NULL DEFAULT TRUE` (one migration; existing rows → true).
- `DELETE /menu/modifier-groups/:id`: still linked to any variant → 409 `MODIFIER_GROUP_IN_USE`; otherwise **archive** (`is_active = false`) — never a hard delete, whether or not it was ever ordered. Archiving an archived or unknown group → 404.
- Archived groups: not in `GET /menu/modifier-groups`; can't be linked by item writes (BRIEF-038 `POST` / `PATCH /menu/items` → 400, same as an unknown group).
- No race between linking and archiving: item writes hold the listed groups `FOR KEY SHARE` and require `is_active`; archive holds the group `FOR UPDATE` and then counts links.
- Restoring an archived group is not in S1 (create a new one).
- `docs/schema.sql` §4 + `docs/erd.html` updated (erd by Cowork, Field-approved).

---

## Decision — Field only
**Decision:** Approved: B (archive — `modifier_group.is_active`; DELETE archives an unlinked group, never a hard delete; linking guard; no restore in S1)
**Why:** Keeps the add-on list clean without removing anything past orders point at.
**Date:** 2026-10-23 · recorded by Cowork on Field's explicit instruction (session: "approve DR-024, approve BRIEF-044 Rev 1 Ready")

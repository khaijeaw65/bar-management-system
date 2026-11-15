# Menu & sold-out — requirements

> Spec-Anchored feature requirements (`docs/features/menu/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.
> **As-built record (2026-11-15).** Written after the feature shipped, from the FRD, DRs, approved CDs and merged briefs — it records what was built and why; no new requirement. Field confirms it once; later briefs change it like any feature spec.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Built |
| **Backlog item** | FRD §5, §9 |
| **Design** | [design.md](design.md) — as built |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Menu & sold-out |
| **UI** | [ui.md](ui.md) · owner: kj |
| **Briefs** | [BRIEF-016](../../briefs/BRIEF-016-venue-menu-read.md) · [BRIEF-038](../../briefs/BRIEF-038-menu-write-api.md) · [BRIEF-039](../../briefs/BRIEF-039-menu-photos-api.md) · [BRIEF-040](../../briefs/BRIEF-040-menu-editor-ui.md) · [BRIEF-041](../../briefs/BRIEF-041-menu-photo-ui.md) · [BRIEF-044](../../briefs/BRIEF-044-modifier-groups-api.md) · [BRIEF-045](../../briefs/BRIEF-045-menu-categories-addons-ui.md) |

## Why / who

The owner keeps the menu (categories, items, variants, modifiers, photos, promo windows) in the back office; every surface reads the same menu and shows sold-out / out-of-window items correctly.

## Flow (user steps)

Business words only.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | Owner adds a category and an item | "ค็อกเทล · โอลด์แฟชั่น ฿280 · 2 ขนาด" | Category names unique |
| 2 | Owner attaches modifier groups | "ระดับน้ำแข็ง · ต้องเลือก 1" | Groups archive, never hard-delete when used |
| 3 | Owner uploads a photo | photo on menu card | S3 through one storage service |
| 4 | Owner sets a promo window | "Leo ×4 ฿390 · ก่อน 21:00" | Server clock decides; greyed outside the window |
| 5 | Staff mark an item 86 | greyed "หมด" everywhere | see `ordering` |

## Requirements

Every line cites where it was decided.

| R | Requirement | Source |
|---|---|---|
| R1 | Categories (ordered, active / hidden), items, variants with price, modifier groups (min / max select) with options | FRD §5 · BRIEF-038, BRIEF-044 |
| R2 | Item types simple / recipe / charge; `kitchen_tag` bar / food, none for charge | FRD §5 · DR-012 |
| R3 | Menu photos in S3 via presigned upload; `image_key` on the item | DR-020 |
| R4 | Promo = its own item with availability windows (venue time, may cross midnight), checked at submit; greyed with its window outside it | DR-010 |
| R5 | Modifier groups are archived, not deleted, once used | DR-024 |
| R6 | Category names unique (case-insensitive) | DR-025 |
| R7 | Validation errors return field paths | DR-021 |

## Invariants

Indexed in `docs/features/INVARIANTS.md`; enforcement in `design.md`.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | Category names are unique | Owners confuse duplicate categories | DR-025 |

## Acceptance criteria

Delivered and verified in the merged briefs above (each brief's §3 ACs + audit). New ACs are added here by the next brief that changes this feature.

## Not handled (on purpose)

- Promo window editor in the back office (S2 — seeded windows)
- Recipes / stock link — added by `stock`
- Alcohol flag — added by `compliance-lock`

## Open questions

None — built.

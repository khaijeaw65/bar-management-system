# Design canvas boards — convention (Field, 2026-10-10)

> Proposed rule — lives here because `docs/rules/**` is protected. Field may copy it into `docs/rules/` by hand.

Adopted after the CD-14 pilot. Applies to every Design canvas. Adoption (Field, 2026-10-10): CD-14 = pilot; CD-01–04 and CD-08 are retrofitted once the CD template is approved; CD-06 onward built to it.

Canvases serve three readers at once: the advisor (presentation), Metee / AI executors (implementation), and e2e tests. Each board is one of three types, marked by a pill next to its title.

| Type | Pill | Purpose | Rules |
|---|---|---|---|
| **Journey** | `JOURNEY n · <name>` (accent) | How a person reaches a goal — presentation + e2e script | One-line user story as the board heading. One person, one goal, one seat/item followed the whole way (no switching T3 → T6). Phones left → right with a labelled arrow between each: `E# + action → result`. Solid arrow = staff action, dashed = alternate / system response. Tap ring + `E#` badge on the element tapped. Last phone = success (accent label + border). Legend box "วิธีอ่าน" top right. 1–2 journeys per canvas: main path first, then the most important alternate. |
| **States** | `STATES · ไม่ใช่ลำดับ` (neutral) | Every state of one screen — dev reference | States side by side, no arrows. |
| **Flow map** | `FLOW MAP` (neutral) | Whole-feature overview | Boxes + arrows, each box names its board. |

## Canvas layout
- Sections top → bottom: Journeys · States · Flow map, each with a `title1` note.
- Open review items (R#) = sticky notes next to their board: orange while pending, green with "Field รับแล้ว <date>" once accepted.

## Consistency
- Journey phones copy the States boards exactly (same header, chips, search, rows) — never a simplified version.
- Tap ring on list rows = overlay ring inset from the row (12 px side gap, 6 px in from top/bottom), not an outline on the full hit area.

## Handoff link
- Each `CD-##-handoff.md` has an "e2e script" section: one line per journey step `E#` → what the test asserts. Implementation briefs reference it ("e2e follows CD-## J1 E1–E7").

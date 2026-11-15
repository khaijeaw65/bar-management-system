# Notifications & push — requirements

> Spec-Anchored feature requirements (`docs/features/notifications/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.
> **As-built record (2026-11-15).** Written after the feature shipped, from the FRD, DRs, approved CDs and merged briefs — it records what was built and why; no new requirement. Field confirms it once; later briefs change it like any feature spec.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Built |
| **Backlog item** | FRD §13 · DR-003 |
| **Design** | [design.md](design.md) — as built |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Notifications |
| **UI** | [ui.md](ui.md) · owner: kj (web) · methee (staff app push — BRIEF-065 open) |
| **Briefs** | [BRIEF-061](../../briefs/BRIEF-061-call-ack-audit.md) · [BRIEF-063](../../briefs/BRIEF-063-notification-feed.md) · [BRIEF-064](../../briefs/BRIEF-064-push-delivery.md) |

## Why / who

Staff hear about new orders, guest calls and payments in real time on the POS (sound + badge) and, when the staff app is in the background, by push. A feed keeps what they missed.

## Flow (user steps)

Business words only.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | A guest order arrives | POS sound + toast "ออเดอร์ใหม่ T3 #014" | POS sound is the primary channel |
| 2 | Phone in pocket | push "ออเดอร์ใหม่ T3" | Only new order, call staff, ready |
| 3 | Staff open the feed | unread list → mark read |  |
| 4 | Staff acknowledge a call | guest sees "พนักงานรับทราบแล้ว" | Recorded |

## Requirements

Every line cites where it was decided.

| R | Requirement | Source |
|---|---|---|
| R1 | Channels: WebSocket in-app (web + staff app), Expo push for the backgrounded staff app, LINE OA later | FRD §13 · DR-003 |
| R2 | Routing per surface per DR-009 | DR-009 |
| R3 | Phone push only for new order, call staff and ready; POS sound + badge primary | DR-014 |
| R4 | Notification feed with unread count, mark read / all read | BRIEF-063 |
| R5 | Push tokens registered per staff device; receipts checked and dead tokens removed | DR-003 Am. 2 · BRIEF-064 |
| R6 | Call acknowledgement is recorded | BRIEF-061 |

## Invariants

Indexed in `docs/features/INVARIANTS.md`; enforcement in `design.md`.

None of its own.

## Acceptance criteria

Delivered and verified in the merged briefs above (each brief's §3 ACs + audit). New ACs are added here by the next brief that changes this feature.

## Not handled (on purpose)

- LINE OA (Later)
- Staff app push UI — BRIEF-065 (open)

## Open questions

None — built.

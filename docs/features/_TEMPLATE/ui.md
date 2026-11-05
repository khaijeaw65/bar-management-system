# <Feature> — UI

> Screens, states and actions for `docs/features/<feature>/`. Requirements: [requirements.md](requirements.md) · Design: [design.md](design.md). Every row here is an AC source for the frontend brief.

| | |
|---|---|
| **Design** | <link to the design + version, or `none yet`> — link only, never copy the design here |
| **Design system** | <tokens source, e.g. `globals.css` + UI library and version> |
| **Approved by** | <Field + date, or `— (Draft)`> |
| **Frontend brief(s)** | <`BRIEF-###`> |
| **UI owner** | <member id> |

## Screens

| Screen | Route | Purpose |
|---|---|---|
| <Screen> | `<route>` | <one line> |

## Screen × State matrix

Every screen gets every state: ✓ (how it looks) or `n/a (why)` — never leave one blank.

| State | <Screen A> | <Screen B> |
|---|---|---|
| 1 Default | | |
| 2 Loading — first load / refresh (old data visible) | | |
| 3 Empty — nothing yet / no match for filter | | |
| 4 Error + retry | | |
| 5 Validation | | |
| 6 Pending (action sent, controls locked) | | |
| 7 Success feedback (< 1 s) | | |
| 8 Failure per error code (`<CODE>` → UI) | | |
| 9 Stale / conflict (+ app resumed from background) | | |
| 10 Offline | | |
| 11 No permission | | |
| 12 Long text (Thai/long names) + large system font | | |
| 13 Smallest screen (360×780) | | |
| 14 Keyboard open | | |
| 15 Live update while viewing (push / WebSocket) | | |
| 16 Session expired mid-use (401) | | |
| 17 Unsaved changes on leave | | |

## Action table

| Action | API | Permission | Success → UI | Failure (code) → UI | Recovery | Data kept | Idempotency |
|---|---|---|---|---|---|---|---|
| <user action> | `<METHOD /path>` | `<perm or —>` | <result> | <`CODE` → message/UI> | <what the user does next> | <what stays filled> | <key per action, or n/a> |

## Error messages

| Code | Message (user language) |
|---|---|
| `<CODE>` | <text> |
| unknown | <fallback text> |

## Behaviour decisions

- Filters & search: <single/multi-select, trim, what Clear / Escape resets>
- Overflow: <which fields truncate (lines) vs wrap>
- Keyboard & focus: <sticky footer, focus order>

## Component mapping

| Design element | Component (installed library) or new file |
|---|---|
| <element> | <`Button` from UI library / `components/<x>.tsx`> |

## Open questions

| # | Question | Recommended | Blocks |
|---|---|---|---|
| Q1 | <question> | <option> | BRIEF-### |

# Claude Design (CD) briefs

One CD brief = one Claude Design session. Paste the brief's **"Paste into Claude Design"** block as the prompt; attach the files it lists. Each brief is self-contained so a session doesn't have to load everything.

**Purpose:** designs are used for (1) development — the executable briefs reference artboards by ID — and (2) the advisor presentation — flows, states, feedback and notifications must be shown, not only happy-path screens.

**Sources of truth:** `docs/design-system.md` (tokens, type, spacing, components) · `docs/briefs/ui/*.md` (screen content per surface) · `docs/FRD.md` (behaviour). If a CD session changes a token or component, update `design-system.md` in the same PR.

**Output per brief:** artboards named `CD-##/<artboard-id>` in the Claude Design project, a link written back into the brief's **Result** section, and any design-system changes as a diff to `design-system.md`.

## Series (order = priority)
| ID | Brief | Surface | Why first |
|---|---|---|---|
| CD-00 | Design system refresh: tokens (dark + light), type, components, **feedback kit** (toast, banner, dialog, empty/loading/error, notification bell + feed) | all | Every screen reuses it |
| CD-01 | POS: login, not-registered, app shell, **menu list** | web desktop | Methee's first brief (BRIEF-008) |
| CD-02 | POS: table grid + session detail panel + open-table dialog | web desktop | Sprint 3 core |
| CD-03 | POS: payment (PromptPay QR, cash, split, in-flight collision) | web desktop | core vertical |
| CD-04 | POS: menu management, 86'd, restock requests | web desktop | |
| CD-05 | POS: owner / manager dashboard | web desktop | presentation |
| CD-06 | Customer QR: name → menu → item → cart → order status | phone web | core vertical |
| CD-07 | Customer QR: payment intent, split, PDPA consent | phone web | |
| CD-08 | Staff app: login, order queue, order detail, new order | Expo mobile | unblocks BRIEF-002 + `mobile.md` |
| CD-09 | Staff app: guest profile + AI summary, bottle keep, payment handoff, split | Expo mobile | differentiators |
| CD-10 | Notifications end-to-end (push, in-app feed, toast, call-staff) across surfaces | all | presentation |
| CD-11 | Journey boards for the presentation: guest-in → order → pay → close (all roles) | all | presentation |

Status per brief lives in its own file (`Status:` line).

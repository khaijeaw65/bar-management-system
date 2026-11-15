# Staff access (auth + IAM) — requirements

> Spec-Anchored feature requirements (`docs/features/staff-access/requirements.md`). Updated in the same PR whenever a brief or DR changes requirements or ACs.
> **As-built record (2026-11-15).** Written after the feature shipped, from the FRD, DRs, approved CDs and merged briefs — it records what was built and why; no new requirement. Field confirms it once; later briefs change it like any feature spec.

| | |
|---|---|
| **Owner** | Field |
| **Status** | Built |
| **Backlog item** | FRD §2 |
| **Design** | [design.md](design.md) — as built |
| **FRD** | [`docs/FRD.md`](../../FRD.md) → Staff access (IAM) |
| **UI** | [ui.md](ui.md) · owner: kj |
| **Briefs** | [BRIEF-007](../../briefs/BRIEF-007-backend-auth.md) · [BRIEF-015](../../briefs/BRIEF-015-backend-auth-repair.md) · [BRIEF-021](../../briefs/BRIEF-021-mobile-auth-backend.md) · [BRIEF-028](../../briefs/BRIEF-028-web-login-real-api.md) · [BRIEF-053](../../briefs/BRIEF-053-iam-core.md) · [BRIEF-054](../../briefs/BRIEF-054-iam-staff-api.md) · [BRIEF-055](../../briefs/BRIEF-055-iam-groups-policies-api.md) · [BRIEF-056](../../briefs/BRIEF-056-permission-aware-pos.md) · [BRIEF-057](../../briefs/BRIEF-057-staff-access-ui.md) · [BRIEF-058](../../briefs/BRIEF-058-groups-policies-ui.md) · [BRIEF-068](../../briefs/BRIEF-068-dev-demo-login.md) |

## Why / who

Staff log in with LINE; the owner approves them and gives access through groups and policies (AWS-style), including time-bound access for a shift. Every action is checked against the person's effective permissions and recorded in the audit log.

## Flow (user steps)

Business words only.

| Step | User does | Sees / enters (business words + example value) | Rule |
|---|---|---|---|
| 1 | New staff log in with LINE | "รออนุมัติ" | Access request |
| 2 | Owner approves and adds to a group | "บี → Staff" | Seeded groups Owner / Manager / Staff |
| 3 | Owner gives a one-night elevation | "บี → Manager ถึง 06:00" | Time-bound membership |
| 4 | Staff switch on the shared POS with a PIN | "บี (PIN)" | Actions attributed to the person |
| 5 | Owner removes access | takes effect immediately | Cache invalidated on change |

## Requirements

Every line cites where it was decided.

| R | Requirement | Source |
|---|---|---|
| R1 | LINE SSO; web session = HttpOnly cookies (access JWT 15 min + rotating refresh); mobile = PKCE + one-time code → Bearer + refresh rotation | DR-005 · BRIEF-007, BRIEF-021, BRIEF-028 |
| R2 | Users get groups and direct policies; effective permissions = union (most-permissive-wins, no deny) | FRD §2 · CLAUDE.md |
| R3 | Group membership can be time-bound (`valid_from` / `valid_until`) | FRD §2 |
| R4 | Effective permissions cached in Redis, invalidated on any IAM change (global version) | FRD §2 · BRIEF-053 |
| R5 | Seeded groups Owner / Manager / Staff; policy editor under "ขั้นสูง" | DR-014 |
| R6 | Shared-POS switch with a 4-digit PIN linked to the staff identity; PIN lock after repeated failures | DR-014 · BRIEF-018 |
| R7 | Access requests: approve / reject / reopen | BRIEF-054 |
| R8 | POS settings permission split (`venue:update` vs `venue:update_payment`) | DR-029 |
| R9 | Every critical change is written to the append-only audit log | FRD §8 · CLAUDE.md |

## Invariants

Indexed in `docs/features/INVARIANTS.md`; enforcement in `design.md`.

| I | Invariant | Why | Source |
|---|---|---|---|
| I-1 | The audit log is append-only | Evidence must not be editable | FRD §8 · CLAUDE.md |
| I-2 | Permission checks happen only in `PermissionsGuard` | One enforcement point | CLAUDE.md |

## Acceptance criteria

Delivered and verified in the merged briefs above (each brief's §3 ACs + audit). New ACs are added here by the next brief that changes this feature.

## Not handled (on purpose)

- Explicit deny (most-permissive-wins by design)
- Phone OTP identity (later; model is provider-agnostic)
- Staff performance analytics (cut)

## Open questions

None — built.

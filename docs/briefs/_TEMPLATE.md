# BRIEF-### — <Title>

| | |
|---|---|
| **Status** | Draft · Ready · Done  ← Field only (Cowork sets Ready on Field's approval) |
| **Implementer** | Field / เมธี |
| **Affected apps** | backend / frontend / mobile / contracts / tooling (select all in scope) |
| **Revision** | 1 |
| **Depends on** | <brief IDs, or none> |
| **References** | FRD §<n> · schema tables: <…> · UI brief: <…> · DRs: <…> |
| **Audit depth** | Full (backend / core flow / auth-payment-PDPA) · Compact (low-risk UI, chores) |

---

## 1. Goal
<1–2 lines: the user-facing or system outcome.>

## 2. Scope
### In
- <file / module / screen level — concrete>

### Out (do NOT build here)
- <explicitly excluded items — prevents scope creep>

## 3. Contract
<The shape both sides build against. Put shared types in `app/packages/contracts` first.>
- **Endpoints:** `METHOD /path` → request DTO / response DTO
- **WS events:** `<event.name>` → payload
- **Contracts changes:** <enum/type additions, or none>
- **Permissions:** <policy action required by `PermissionsGuard`>

## 4. Acceptance Criteria
- **AC-1** — Given <state>, when <action>, then <result>.
- **AC-2** — …

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1 | unit | `app/backend/src/modules/<m>/…spec.ts` |
| AC-2 | e2e | `app/backend/test/<m>.e2e-spec.ts` |

Gate commands (all must pass):
```bash
pnpm --filter <pkg> lint
pnpm --filter <pkg> typecheck
pnpm --filter <pkg> test
pnpm --filter <pkg> test:e2e   # if the brief has e2e ACs
```
A required script that doesn't exist yet = **BLOCKED** — report it, never skip silently.

## 6. Constraints
<Rules that matter most for this brief — e.g. `save()` not `update()`, `.js` import extensions, `PermissionsGuard` only, Thai hardcoded strings.>

## 7. Decision Points (Field Guard)
- **Pre-decided (exact only):** <package@range, endpoint path, file path — anything not this exact needs a DR>
- **Likely DRs:** <known unknowns — raise a DR if hit>

## 8. Unlocked Protected Files
<Exact paths only, no globs. Never rules files. Or: none>
- `none`

---

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | YYYY-MM-DD | Initial |

# Handoff — BRIEF-067 Backend: enforce AST class-file check, oxlint config & full abstract-class port migration

| | |
|---|---|
| **Implementer** | kj (Antigravity) |
| **Date** | 2026-11-01 |
| **Brief revision** | 1 |
| **Branch** | `feat/BRIEF-067-backend-rules-cleanup` (PR opens after audit PASS) |
| **Commit** | `0ff905d` (`0ff905d5a56439df7634388cfc2a6b5069add524`) |
| **Status** | Audit PASS |

## Summary
Enforced AST class-file check and oxlint rules in `@bar/backend`, migrated all remaining port interfaces and `Symbol()` tokens to `export abstract class` with class-token DI across all modules, extracted inline domain/application types, added `NotificationRepository` port isolating `NotificationsService` from TypeORM repository injection, deleted the nested `app/backend/pnpm-lock.yaml`, resolved all audit findings (#1–#4, #8, #10, #11), and verified clean G1 gates and runtime health.

## Acceptance Criteria
| AC | Result | Evidence |
|---|---|---|
| AC-1 | ✅ | `pnpm --filter @bar/backend lint` runs oxlint (`max-lines: 300`, `max-lines-per-function: 40`, `max-depth: 2`, `@typescript-eslint/no-explicit-any: "error"`, `typescript/explicit-member-accessibility: "error"`, `typescript/explicit-module-boundary-types: "error"`) and AST `check-class-files.mjs`, exiting 0 with 0 warnings, 0 errors, and `class files OK`. |
| AC-2 | ✅ | Every non-exempt `.ts` file under `app/backend/src` declares a single class; 0 AST violations across all source files; zero re-export shims. |
| AC-3 | ✅ | `NotificationsService` injects `NotificationRepository` (`export abstract class`); zero services outside `persistence/` inject `@InjectRepository`. |
| AC-4 | ✅ | Zero `Symbol(` port tokens remain in `app/backend/src/`; all 20 ports use `export abstract class` with `public abstract` methods and class-token DI. |
| AC-5 | ✅ | All unit (`52 passed (52)`, `237 passed (237)`) and e2e (`40 passed (40)`, `281 passed (281)`) tests pass without weakening any assertion; `openapi:check` exits 0. |
| AC-6 | ✅ | Nested `app/backend/pnpm-lock.yaml` removed; `migration:run → revert → run` clean; `/api/health` 200 run proof verified; local Sonar scan recorded. |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts test` | 0 | 16 passed (16) · 124 passed (124) |
| `pnpm --filter @bar/backend lint` | 0 | Found 0 warnings and 0 errors (442 files, 102 rules) · class files OK |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend openapi:check` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 52 passed · 237 passed · 0 failed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 40 passed · 281 passed · 0 failed |
| `migration:run → revert → run` | 0 | Reverted StaffPushToken1763400000000 and re-applied cleanly |
| `run proof: dist/main.js + /api/health` | 0 | HTTP 200 `{"status":200,"code":"","message":"success","data":{"status":"ok","db":"up"}}` |

UI exercised: n/a (backend refactor and tooling enforcement)

## Sonar (local scan)
- Scanned commit: `ae3347b` · Quality Gate: ERROR (coverage threshold 0.0% vs 80.0% required, pre-existing config limitation)
- Issues by severity: BLOCKER 0 · HIGH 6 · MEDIUM 7 · LOW 4 · INFO 0
- Remaining issues + reason: 17 total open issues in repo; 0 issues on files touched by BRIEF-067 (all touched files clean). The remaining 17 issues are pre-existing across frontend and untouched backend files (e.g., `PolicyEditor.tsx`, `customer.gateway.ts`, `setup.ts`, `request-hash.ts`, `promptpay-payload.ts`).
- Who fixed: agent-assisted on touched files (removed duplicate imports in `table-seat.service.ts`, used optional chaining in `sold-out.service.ts` and `payment.service.ts`, and added initial value to reduce in `seed-menu-catalog.ts`).

## Decisions Raised
- none (all changes within pre-decided scope of BRIEF-067 Rev 1)

## Deviations from Brief
- none

## Known Gaps / Follow-ups
- Follow-up logged in SESSION_STATE.md: configure coverage report path in `sonar-project.properties` so Sonar coverage condition can pass.
- Field amendment to `docs/rules/backend.md` regarding port naming convention (no `I` prefix in code).

## AI Usage
**High** — Antigravity used for AST class extraction, port abstract class migration, DI updates across services and e2e test modules, lint rule enforcement, audit findings fix, and test verification.

## Notes for Reviewer
- Start with `app/backend/scripts/check-class-files.mjs` and `app/backend/oxlint.json`.
- Review port conversions under `app/backend/src/modules/*/domain/ports/*.port.ts` and `app/backend/src/common/`.
- Review `NotificationRepository` abstraction in `app/backend/src/modules/notifications/`.

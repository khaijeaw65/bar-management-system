# Handoff — BRIEF-019 Class files hold class context only

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-10-17 |
| **Brief revision** | 2 |
| **Branch** | `feat/BRIEF-019-class-helpers` (PR opens after audit PASS) |
| **Commit** | `a0f48cdc5e58772e58c164761597cf4b2bfe0d6d` |
| **Status** | Implemented — awaiting audit |

> Gate evidence below was run on the work tree that became `a0f48cd`, before this docs commit. Node v24.14.0, pnpm 10.0.0.

## Summary
Backend class files no longer mix a class with module-level functions. Helpers are plain `private` methods called with `this.` (Rev 2). Shared copies live once. `lint` runs `scripts/check-class-files.mjs`, which fails if the pattern returns. Behaviour, routes, and the OpenAPI document are unchanged.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `node scripts/check-class-files.mjs` exit 0, no output. Same check runs inside `pnpm --filter @bar/backend lint` |
| AC-2 | ✅ | Temporary `src/__check_fixture.ts` (class `Fixture` + `function leaked`). Script printed `src/__check_fixture.ts:5 leaked` and exited 1. Fixture deleted before the gates |
| AC-3 | ✅ | Unit 62 passed, e2e 52 passed. The only test edit is the `requestHash` import path in `idempotency.service.spec.ts`. No test deleted or skipped |
| AC-4 | ✅ | `grep -rE "^(export )?function (text\|optionalText\|asDate\|optionalDate\|money\|clockSeconds\|withoutVisit\|requireUuid\|staffAccess)\b" src` hits only `common/money.ts`, `common/time-label.ts` (`clockSeconds`), `common/http/http-input.ts`, and `present-order.ts` (`withoutVisit`). No `text` / `optionalText` / `asDate` / `optionalDate` |
| AC-5 | ✅ | `openapi:check` exit 0, no diff in `docs/api/openapi.json` |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/backend lint` | 0 | pass (oxlint + class-file check) |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 62 passed · 0 failed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 52 passed · 0 failed · Postgres localhost:5432 · Redis 127.0.0.1:6379 |
| `pnpm --filter @bar/backend openapi:check` | 0 | pass, no diff |

## Sonar (local scan)
- Not run. The brief marks the local scan optional.

## Decisions Raised
- DR-017 Approved: A. `requestHash` and `sortValue` live in `src/modules/order/application/request-hash.ts`. `OrdersController` and `idempotency.service.spec.ts` change import paths only. `IdempotencyService` public methods are unchanged.

## Deviations from Brief
- None beyond DR-017. §2 A listed those two names as private methods; the approved decision puts them in a function-only file.

## Known Gaps / Follow-ups
- `bangkok` in `business-date.ts` and `menu-availability.ts`, and `statusOf` in `fold-orders.ts` and the order repository, were left. They are similar and not the same function, as the brief says. No later brief proposed.
- Row-reader errors now say `row is missing a string` and `row is missing a timestamp`. The brief asked for one strict reader with a generic timestamp message. Valid rows behave as before.

## AI Usage
**High** — Cursor moved the helpers, added the check script, and wrote this handoff.

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-019`
- Work SHA: `a0f48cdc5e58772e58c164761597cf4b2bfe0d6d` · self-check: brief §2 A–D against the class files, `request-hash.ts`, the four shared homes, and `docs/api/openapi.json` (no diff)

## Notes for Reviewer
- Rev 2: every moved helper is `private` and called with `this.`, including helpers that do not read `this`. There is no `private static` in `src/`.
- Callbacks that used to pass a free function (`.map(toWindow)`, `.sort(byPriceThenName)`) now call `this.` inside an arrow so the instance method keeps its receiver.
- `toCents`, `fromCents`, and `lineCents` moved into `fold-orders.ts` when `order/application/money.ts` was deleted. They were not the shared `money` copy, and `fold-orders.ts` is their only caller.
- Work commits under `a0f48cd`: `6597a59` shared homes, `64043ea` auth and cross-cutting, `6155178` menu, `e206f97` venue, `87f1d1d` order + DR-017, `a0f48cd` the lint check.

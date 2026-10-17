# BRIEF-019 — Backend: class files hold class context only

| | |
|---|---|
| **Status** | Ready — Rev 2 approved by Field 2026-10-17 |
| **Implementer** | kj (executor agent — Cursor) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · tooling |
| **Revision** | 2 |
| **Depends on** | **`docs/rules-class-helpers` merged** (`docs/rules/backend.md` → *Where functions live*, commit `16156bf`) · BRIEF-012 merged (PR #50) |
| **References** | `docs/rules/backend.md` → Clean Code (*Where functions live*, *Reading order*, checklist item 7) · `docs/rules/ponytail.md` |
| **Audit depth** | Compact (refactor, no behaviour change) — but every moved function is checked for identical behaviour |
| **Size** | ~1 day |

---

## 1. Goal
No backend file mixes a class with module-level functions: helpers become `private` methods, real duplicates live once, and `lint` fails if the pattern comes back. Behaviour, API and tests stay exactly the same.

## 2. Scope
### In
**A. Class files → private methods.** Every module-level function in these files becomes a `private` method of the file's class, called with `this.` — **not `static`** (Rev 2), placed in stepdown order after the public method that first calls it:

| File | Functions |
|---|---|
| `src/providers/redis/redis.service.ts` | `closeRedis` |
| `src/common/filters/http-exception.filter.ts` | `codeForStatus` `zodEnvelope` `domainEnvelope` `httpEnvelope` `internalEnvelope` `messageOf` |
| `src/common/interceptors/transform-response.interceptor.ts` | `envelope` `httpResponse` `isRedirect` |
| `src/modules/auth/application/auth.service.ts` | `oauthKey` `parseNonce` `readNonce` |
| `src/modules/auth/application/token.service.ts` | `newRefreshToken` `parseAccessClaims` `sha` `parseRotationOutcome` `outcomeFrom` `reusedOrInvalid` |
| `src/modules/auth/infrastructure/line/line-client.http.ts` | `readIdToken` `readLineProfile` `nonceMismatch` |
| `src/modules/menu/application/menu-catalog.service.ts` | `availabilityInput` `toGroup` |
| `src/modules/menu/infrastructure/persistence/menu-catalog.typeorm-repository.ts` | `toRecord` `toWindow` `toVariant` `byPriceThenName` `groupsByVariant` `groupBy` |
| `src/modules/notifications/redis-io.adapter.ts` | `staffSocketOptions` |
| `src/modules/order/application/idempotency.service.ts` | `requestHash` `redisKey` `reused` `inFlight` `delay` `sortValue` |
| `src/modules/order/application/order.service.ts` | `groupTickets` |
| `src/modules/order/application/order-query.service.ts` | `staffIds` (`withoutVisit` → C) |
| `src/modules/order/application/ticket.service.ts` | `sentAt` `payload` (`withoutVisit` → C) |
| `src/modules/order/infrastructure/http/orders.controller.ts` | `created` (`ApiCreatedOrder` → B) |
| `src/modules/order/infrastructure/persistence/order.typeorm-repository.ts` | `stationColumn` `toLocked` `toBill` `required` `statusOf` |
| `src/modules/venue/application/table-seat.service.ts` | `liveVisitIds` `applyBill` |
| `src/modules/venue/application/visit.service.ts` | `isLiveVisit` |
| `src/modules/venue/infrastructure/http/visits.controller.ts` | `openInput` (`ApiOpenVisit` → B) |
| `src/modules/venue/infrastructure/persistence/table-seat.typeorm-repository.ts` | `toIdentity` `toSeat` `toCard` (`asDate` → C) |
| `src/modules/venue/infrastructure/persistence/visit.typeorm-repository.ts` | all 15 except `text` `optionalText` `asDate` `optionalDate` (→ C) |

**B. Swagger decorator factories → openapi files.**
- `ApiCreatedOrder` → `src/modules/order/infrastructure/http/orders.openapi.ts`
- `ApiOpenVisit` → `src/modules/venue/infrastructure/http/visits.openapi.ts`

**C. Duplicates → one copy** (function-only files; callers import them):
| New / existing home | Functions | Replaces copies in |
|---|---|---|
| `src/common/persistence/row-values.ts` (new) | `readText` `readOptionalText` `readDate` `readOptionalDate` | `order-row.mapper.ts`, `visit.typeorm-repository.ts`, `table-seat.typeorm-repository.ts` (`text` / `optionalText` / `asDate` / `optionalDate`) |
| `src/common/http/http-input.ts` (new) | `requireUuid` `staffAccess` | `order/`, `menu/`, `venue/` `infrastructure/http/http-input.ts` (module files keep only module-specific helpers, e.g. `idempotencyKey`; a module file left empty is deleted) |
| `src/common/money.ts` (new) | `money` | `order/application/money.ts`, `menu/application/money.ts` (both deleted) |
| `src/common/time-label.ts` (existing) | `clockSeconds` | `order/application/business-date.ts`, `menu/application/menu-availability.ts` |
| `src/modules/order/application/present-order.ts` (existing) | `withoutVisit` | `ticket.service.ts`, `order-query.service.ts` |

`readDate` keeps the strict behaviour: `Date` → itself, `string` → `new Date()`, anything else → throw (message names the missing timestamp generically). The `table-seat` copy accepted only `Date | string` — the strict version is a superset for valid rows.

**D. Check script.** `app/backend/scripts/check-class-files.mjs` (Node built-ins only): walks `src/**/*.ts` except `*.spec.ts`; a file with a top-level `class` declaration **and** a top-level `function` declaration or arrow-function `const` → prints `file:line name` and exits 1; otherwise exits 0. `app/backend/package.json` `lint` becomes `oxlint src/ test/ && node scripts/check-class-files.mjs` (CI already runs `lint` via turbo — no workflow change).

### Out (do NOT build here)
- Function-only files that don't hold a duplicate (`ticket-transition.ts`, `order-query.ts`, `order-row.mapper.ts`, `fold-orders.ts`, config factories, CLI seeds, `bootstrap/`, `common/openapi/`, `common/decorators/`) — allowed by the rule, leave them.
- Similar-but-not-identical helpers (`bangkok` in `business-date.ts` vs `menu-availability.ts`, `statusOf` in `fold-orders.ts` vs the repository) — not copies; leave, note in handoff if worth a later brief.
- Renaming public methods, changing signatures of exported services, any behaviour, response, OpenAPI or schema change.
- `test/` and frontend/mobile code.

## 3. Contract
- **Endpoints / WS events / contracts:** none changed.
- **OpenAPI:** `openapi:check` must pass with **no diff** in `docs/api/openapi.json` — proves B moved decorators without changing the document.

## 4. Acceptance Criteria
- **AC-1** — Given the refactored `src/`, when `node scripts/check-class-files.mjs` runs, then it exits 0 and prints nothing.
- **AC-2** — Given a temporary file `src/__check_fixture.ts` with a class and a module-level function, when the script runs, then it exits 1 and names that file and function (fixture deleted after; evidence in handoff).
- **AC-3** — Given A–C, then every existing unit and e2e test passes **unchanged** except import paths, and no test was deleted or skipped.
- **AC-4** — Given C, then `grep -rE "^(export )?function (text|optionalText|asDate|optionalDate|money|clockSeconds|withoutVisit|requireUuid|staffAccess)\b" src` returns no hits outside the homes listed in C.
- **AC-5** — `openapi:check` passes with no change to `docs/api/openapi.json`.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-2 | script run | evidence in `docs/handoffs/BRIEF-019.md` |
| AC-3 | unit + e2e | existing suites |
| AC-4 | grep | evidence in handoff |
| AC-5 | openapi check | existing script |

Gate commands (all must pass):
```bash
pnpm --filter @bar/backend lint        # includes the check script
pnpm --filter @bar/backend typecheck
pnpm --filter @bar/backend test
pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:check
```
A required script that doesn't exist yet = **BLOCKED** — report it, never skip silently.

### Local Sonar scan
- Required for this brief: optional — pure refactor; run it if Sonar is already up.

## 6. Constraints
- **No behaviour change.** Move code; don't rewrite it. A body changes only for `this.` / `ClassName.` calls, the renamed row readers in C, and imports.
- **No `static` helpers (Rev 2):** plain `private`, called with `this.`, even when the helper doesn't read `this`. Any `private static` already written in WIP is converted.
- Stepdown order: public methods first, private helpers after, in call order.
- ≤ 20 lines per function and depth ≤ 2 still apply to moved code (lint).
- `.js` import extensions (ESM). Stage explicit paths only.
- Commit in reviewable units: one commit per letter (A, B, C, D) or per module — not one giant commit.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact only):**
  - New files: `scripts/check-class-files.mjs`, `src/common/persistence/row-values.ts`, `src/common/http/http-input.ts`, `src/common/money.ts`, `src/modules/order/infrastructure/http/orders.openapi.ts`, `src/modules/venue/infrastructure/http/visits.openapi.ts` (all under `app/backend/`).
  - `app/backend/package.json`: `lint` script value exactly as in §2 D. No dependency changes.
  - Deleting `order/application/money.ts`, `menu/application/money.ts` and any module `http-input.ts` left empty.
- **Likely DRs:** a moved helper that can't become private without changing a public signature or a test's behaviour → stop and raise a DR. Sequencing vs BRIEF-013 / BRIEF-017 (both touch `modules/order/`): recommended to merge this first so those briefs start from compliant code.

## 8. Unlocked Protected Files
- `none` (`app/backend/package.json` is covered by the exact Pre-decided item in §7)

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-17 | Initial — after BRIEF-012 review found module-level helpers in class files · Ready approved by Field 2026-10-17 |
| 2 | 2026-10-17 | Helpers are plain `private` methods called with `this.` — no `private static` (rule `backend.md` updated in the same commit) · approved by Field 2026-10-17 |

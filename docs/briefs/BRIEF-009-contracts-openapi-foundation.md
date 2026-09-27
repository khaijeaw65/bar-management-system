# BRIEF-009 — Contracts foundation + OpenAPI (Swagger) generation

| | |
|---|---|
| **Status** | Ready |
| **Implementer** | kj (executor agent) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **PR** | <executor fills> |
| **Affected apps** | contracts / backend / tooling |
| **Revision** | 1 |
| **Depends on** | BRIEF-004 (Done — backend scaffold, envelope). Runs **in parallel with BRIEF-008** (Methee, frontend only) — no shared files except `pnpm-lock.yaml` (lockfile rule from BRIEF-005 §6) |
| **References** | DR-004 + Amendment 1 · `docs/api/README.md` (conventions, catalog, D1–D4) · `docs/rules/backend.md` → API Response, OpenAPI · `docs/schema.sql` enums · `docs/design/CD-00-handoff.md` §2 (chips key on schema enums) |
| **Audit depth** | Full (contract layer every later brief depends on) |

---

## 1. Goal
`@bar/contracts` becomes the real, schema-aligned source of truth (Zod enums, envelope, menu schemas) that both apps can import, and the backend serves a generated OpenAPI spec (`/api/docs`) with a committed, CI-checked `docs/api/openapi.json`. After this, BRIEF-010 (menu-list redesign, Methee) builds its MSW mock on the real contract.

## 2. Scope
### In
1. **Contracts package**
   - Add `zod` `4.6.5` (exact, DR-004). Align `typescript` with the workspace version.
   - Build: `tsc` → `dist/` (ESM + `.d.ts`); `package.json` `exports` → `dist`; scripts `build`, `typecheck`. Backend (NodeNext ESM, runs compiled JS) and frontend both import `@bar/contracts` at runtime. Frontend: `transpilePackages` **not** needed if it consumes `dist` — choose one path, prove it (AC-2), note it.
   - **Replace `src/enums.ts`** (stale: `CONFIRMED`, `SERVED`, `SessionState`, `StaffRole`) with `src/schemas/enums.ts`: one `z.enum` + inferred type per `schema.sql` enum — `identityProvider`, `visitState`, `itemType`, `orderStatus`, `orderItemStatus`, `paymentMethod`, `paymentStatus`, `bottleKeepStatus`, `invCategory`, `invTxType`. Values exactly as SQL (lowercase). Naming: `OrderStatusSchema` + `type OrderStatus`.
   - `src/schemas/common.ts`: `UuidSchema`, `MoneySchema` (`/^\d+\.\d{2}$/`), `IsoDateTimeSchema`, `apiResponseSchema(data)` (`{ status, code: '' , message: 'success', data }` — `code` is `z.literal('')`), `ApiErrorSchema` (`{ status, code: ErrorCode, message, data: null }`); all four keys required in both, `listSchema(item)` (`{ items, nextCursor? }`).
   - `src/schemas/errors.ts`: `ErrorCodeSchema` = the generic codes (`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`) + `IDEMPOTENCY_KEY_REUSED`. Later briefs append domain codes.
   - `src/schemas/menu.ts`: `MenuCategorySchema`, `MenuItemVariantSchema`, `MenuItemSummarySchema` (per `docs/api/README.md` D4), `MenuItemListResponseSchema`, `MenuCategoryListResponseSchema`.
   - `src/index.ts` re-exports; unit tests for money regex, enum values vs SQL, envelope helper.
2. **Backend OpenAPI**
   - Add `@nestjs/swagger` `^12.0.2`. **No** `nestjs-zod` (peer `@nestjs/common` ≤ 11), **no** class-validator / class-transformer.
   - `src/common/openapi/`: helper that turns a contracts Zod schema into an OpenAPI schema via `z.toJSONSchema(schema, { target: 'openapi-3.0' })`, plus decorators/helpers to declare an enveloped success response and the standard error responses (`400/401/403/404/409`) on a route. Registers reusable components (`ApiError`, envelope).
   - `providers/config/openapi/{configuration,config.service,config.module}.ts` — `OPENAPI_ENABLED` (Zod-validated boolean; default `true`; `.env.example` notes prod = `false`).
   - `bootstrap/configure-app.ts`: when enabled, build the document (title "The Loft Bar API", version from package.json, cookie + bearer security schemes, tags per module) and serve UI at `/api/docs`, JSON at `/api/docs-json`.
   - **Standard envelope (D1):** `TransformResponseInterceptor` adds `code: ''` to every success response; `HttpExceptionFilter` adds `code` (generic from status; `DomainException(code, message, status)` in `common/` for domain errors); Zod validation failures → `VALIDATION_ERROR`. Update filter tests.
   - Document `GET /api/health` with the helper (the only live endpoint) — proves the pipeline end to end.
   - `scripts/openapi-export.ts` + script `openapi:export` → writes `docs/api/openapi.json` (sorted keys, 2-space JSON) **without** a DB/Redis connection (build the Nest app with a test module or `NestFactory` + `abortOnError: false` and mocked providers — document the choice).
3. **CI** (`.github/workflows/ci.yml`): step runs `openapi:export` and fails on `git diff --exit-code docs/api/openapi.json` when backend or contracts changed.
4. **Docs**: `docs/api/openapi.json` (generated, committed). D1–D4 already recorded in `docs/api/README.md` §3.

### Out
- Real menu endpoints / migrations / seed (backend menu brief).
- Frontend changes (`lib/api/menu.ts`, MSW) → **BRIEF-010** (Methee) — avoids conflicts with BRIEF-008.
- Auth endpoints and their spec entries (BRIEF-007 adds them using this helper).
- WebSocket event schemas (first realtime brief).
- `Idempotency-Key` implementation (D3 = yes) — built in the first order/payment brief per `docs/api/README.md` §1; only the error code is added here.
- Client codegen from OpenAPI (DR-004 Amendment 1: none).

## 3. Contract
- **Contracts exports:** `*Schema` Zod objects + `z.infer` types from `@bar/contracts`; no Nest/Next/TypeORM imports (DR-004 rule).
- **Standard envelope (D1):** success `{ status, code: '', message: 'success', data }` · error `{ status, code, message, data: null }` — same four keys always; no optional envelope fields in types.
- **Menu (for BRIEF-010 mocks):** `GET /api/menu/items` → `{ status, message, data: { items: MenuItemSummary[] } }`; `GET /api/menu/categories` → `{ …, data: { items: MenuCategory[] } }`. Field names camelCase from `schema.sql` (`categoryId`, `basePrice`, `isAvailable`, `itemType`, `sortOrder`, `variants[]`).
- **OpenAPI:** 3.0.x; `/api/docs`, `/api/docs-json`; `OPENAPI_ENABLED`.
- **Env:** `OPENAPI_ENABLED` (new).

## 4. Acceptance Criteria
- **AC-1** — Contracts enums equal the `CREATE TYPE` values in `docs/schema.sql` (unit test parses the SQL enum lines, or a hard-coded fixture copied from it with a comment); old `enums.ts` removed; `grep -rn "CONFIRMED\|SessionState\|StaffRole" app/` → no matches.
- **AC-2** — Backend imports a contracts schema at runtime (`pnpm --filter @bar/backend build && start:prod` or an e2e test uses `MoneySchema`), and frontend `build` + a Vitest test import from `@bar/contracts` — both pass on a clean checkout.
- **AC-3** — `MoneySchema` accepts `"120.00"`, rejects `120`, `"120"`, `"120.5"`; `apiResponseSchema(X)` parses a real envelope and rejects `data` of the wrong shape.
- **AC-4** — With `OPENAPI_ENABLED=true`, `GET /api/docs` serves Swagger UI and `GET /api/docs-json` returns OpenAPI 3.0 containing `/api/health` with an enveloped 200 schema and the `ApiError` component; with `false`, both return 404 (e2e).
- **AC-5** — `openapi:export` runs with no database or Redis and writes a stable `docs/api/openapi.json` (running it twice = no diff).
- **AC-6** — CI fails when `openapi.json` is stale (show one red run on a throwaway commit, or a script test) and passes when it is regenerated.
- **AC-7** — The Zod→OpenAPI helper is unit-tested with a nested object, enum, nullable, array and money-string schema.
- **AC-8** — Every success response is `{ status, code: '', message: 'success', data }` (interceptor test + health e2e); every error response has a non-empty `code` — 400 Zod failure → `VALIDATION_ERROR` (string[] message), unknown route → `NOT_FOUND`, thrown `DomainException('CONFLICT', …, 409)` → `CONFLICT`, unexpected error → `INTERNAL_ERROR` 500 (filter unit + e2e tests).
- **AC-9** — `lint`, `typecheck`, `test`, `build` for contracts + backend exit 0; `test:e2e` backend passes; `ci` green; `pnpm install --frozen-lockfile` passes.

## 5. Test Gate
| AC | Test type | Location |
|---|---|---|
| AC-1, AC-3 | unit | `app/packages/contracts/src/schemas/*.test.ts` |
| AC-2 | e2e / build output | backend e2e + frontend Vitest import test · handoff |
| AC-4 | e2e | `app/backend/test/openapi.e2e-spec.ts` |
| AC-5, AC-6 | command output / CI link | handoff |
| AC-7 | unit | `app/backend/src/common/openapi/*.spec.ts` |
| AC-8, AC-9 | existing tests + CI | handoff |

```bash
pnpm --filter @bar/contracts build && pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint && pnpm --filter @bar/backend typecheck
pnpm --filter @bar/backend test && pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:export && git diff --exit-code docs/api/openapi.json
pnpm --filter @bar/frontend build
```
A required script that doesn't exist yet (e.g. contracts `test`) = add it in this brief.

### Local Sonar scan
- Required for this brief: optional (Field's agent) — run it if time allows, list new issues in the handoff.
- Approved exclusions: `docs/api/openapi.json` (generated).

## 6. Constraints
- DR-004 rules: contracts = request/response schemas + inferred types only; one Zod version; money/date on the wire as above.
- Backend: ESM `.js` imports; `process.env` only in `configuration.ts`; config domain layout per `backend.md`.
- Don't touch `app/frontend/src/**` (BRIEF-008 in progress) — only `app/frontend/package.json` / `next.config.ts` if AC-2 needs it; coordinate the lockfile per BRIEF-005 §6.
- Spec is generated only — never edit `openapi.json` by hand.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact only):** `zod` `4.6.5` · `@nestjs/swagger` `^12.0.2` · Zod→OpenAPI via `z.toJSONSchema(..., { target: 'openapi-3.0' })` · paths `/api/docs`, `/api/docs-json` · `OPENAPI_ENABLED` · `docs/api/openapi.json` · no `nestjs-zod`, no class-validator.
- **Decided (Field 2026-09-28):** D1 error `code` · D2 no URL version · D3 Idempotency-Key (implemented later) · D4 `basePrice` + `variants[]`.
- **Likely DRs:** `z.toJSONSchema` output not accepted by `@nestjs/swagger` for some construct (e.g. `$ref`/`$defs`) → stop, DR with the failing case · contracts can't be consumed by both NodeNext backend and Next 16 from one build → DR with options.

## 8. Unlocked Protected Files
- `.github/workflows/ci.yml`
- `turbo.json` (only if the contracts `build`/`test` tasks need an entry)

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions
- [x] No unresolved decision blocking the main outcome (D1–D4 decided)
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-09-28 | Initial draft (Cowork) after DR-004 Amendment 1 |
| 1 | 2026-09-28 | Standard envelope: `code: ''` on success too (Field) |
| 1 | 2026-09-28 | D1–D4 decided (D1 yes, D2 no, D3 yes, D4 yes); Ready — approved by Field in session ("approve b9") |

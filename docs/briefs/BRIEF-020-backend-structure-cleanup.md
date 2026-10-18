# BRIEF-020 — Backend: structure cleanup after BRIEF-019 (clock, common grouping, order types, IAM port)

| | |
|---|---|
| **Status** | Ready — Rev 1 approved by Field 2026-10-18 |
| **Implementer** | kj (executor agent — Cursor) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend |
| **Revision** | 1 |
| **Depends on** | **BRIEF-019 merged** (PR #52 — done 2026-10-18; `common/http/http-input.ts`, `common/money.ts`, `common/time-label.ts`, private-method helpers, class-file lint rule) |
| **References** | `docs/audits/BACKEND-STRUCTURE-REVIEW-2026-10-18.md` F2, F3, F4, F8 (advisory review, Codex) · `docs/rules/backend.md` · BRIEF-012 (business-date cutoff, controlled time) · BRIEF-016 (injected time for availability) |
| **Audit depth** | Full (touches auth access-request path + order request normalization) |
| **Size** | ~0.5 day |

---

## 1. Goal
Finish the leftovers from the 18 Oct structure review that BRIEF-019 did not cover. Afterwards there is one clock, `common/` follows one grouping rule, `.types.ts` files hold only types, and every IAM service goes through a repository port. **No API, envelope, time-boundary, money or permission behaviour changes.**

## 2. Scope
### In
1. **One clock (F2).** Replace `modules/menu/domain/clock.ts`, `modules/order/domain/clock.ts`, `modules/menu/application/system-clock.ts` and `modules/order/application/system-clock.ts` with:
   - `app/backend/src/common/clock.ts`: `interface Clock { now(): Date }` + `export const CLOCK = Symbol('CLOCK')`
   - `app/backend/src/common/system-clock.ts`: `@Injectable() class SystemClock implements Clock`
   - `MenuModule` and `OrderModule` each keep `{ provide: CLOCK, useClass: SystemClock }` and import both from `common/`. No global clock module.
   - Update every `@Inject(CLOCK)` import, plus the `overrideProvider(CLOCK)` in `test/menu.e2e-spec.ts` (and in any other spec that overrides it).
2. **Group the filter and interceptor units (folder rule below).** Use `git mv` to move:
   - `common/filters/http-exception.filter.ts`, `.filter.spec.ts` and `.types.ts` → `common/filters/http-exception/`
   - `common/interceptors/transform-response.interceptor.ts`, `.interceptor.spec.ts` and `.types.ts` → `common/interceptors/transform-response/`
   - Update the imports in `bootstrap/configure-app.ts` and `common/domain-exception.ts`, and the relative imports inside the moved files.
   - File contents stay exactly as on `main` after BRIEF-019 (only the import paths change). The untracked local copies in those folders are **not** the source. Remove them before the `git mv`.
3. **`order.types.ts` holds only types (F4).**
   - Move `requestedLines()` → `modules/order/infrastructure/http/http-input.ts`. It normalises the HTTP body, and its only caller is `orders.controller.ts`.
   - Delete the private `blank()`. Use `blankToNull()` instead, moved from `modules/venue/infrastructure/http/http-input.ts` → `common/http/http-input.ts`. Delete the venue `http-input.ts` if it ends up empty.
4. **Inline `iso()` (F3).** In `modules/order/application/fold-orders.ts`, replace `iso(x)` with `x.toISOString()` and delete the wrapper.
5. **IAM access requests go through a port (F8).**
   - `modules/iam/domain/access-request.repository.ts`: `interface AccessRequestRepository { recordPending(input: AccessRequestInput): Promise<void> }` + `ACCESS_REQUEST_REPOSITORY` symbol
   - `modules/iam/infrastructure/persistence/access-request.typeorm-repository.ts`: adapter that keeps today's behaviour. A new `(provider, externalId)` row is inserted as `status: 'pending'`. An existing row updates only `displayName` and `avatarUrl` (status unchanged), using `save()`.
   - Move `AccessRequestInput` from `application/access-request.types.ts` → `domain/access-request.types.ts` so the port doesn't import from `application/`. Delete the old file if it ends up empty.
   - `AccessRequestService` keeps its public `recordRequest(input)` and delegates to the port. No `typeorm` / `@nestjs/typeorm` / entity imports remain in `iam/application/`.
   - `IamModule` wires `{ provide: ACCESS_REQUEST_REPOSITORY, useExisting: AccessRequestTypeormRepository }` the same way `STAFF_USER_REPOSITORY` is wired.

### Out (do NOT build here)
- Order read-model changes (review F5/F6): `OrderRow`, `fold-orders`, `present-order` shapes. Revisit after the order → pay → close slice.
- The venue ↔ order `forwardRef` cycle and `VisitBill` ownership (F7). Bill lookup is a real dependency, so leave it as is.
- Any edit to `docs/rules/**`, including the `backend.md` src tree. That needs a separate Field-approved change (see Open items).
- Grouping any other `common/` unit. Under the rule below, nothing else qualifies today.
- New dependencies, endpoints, contract changes or migrations.

## 3. Contract
- **Endpoints / WS events / contracts:** none changed
- **Permissions:** unchanged
- **OpenAPI:** `openapi:check` passes with **no diff** to `docs/api/openapi.json`

## 4. Acceptance Criteria
- **AC-1** — Given the cleanup, when searching `app/backend/src`, then exactly one `Clock` interface, one `CLOCK` symbol and one `SystemClock` class exist (all in `common/`), and none remain under `modules/*/domain` or `modules/*/application`.
- **AC-2** — Given a test overrides `CLOCK` with a fixed time, when menu availability and the business-day cutoff are evaluated, then the existing menu unit/e2e and business-date tests pass unchanged except for import paths.
- **AC-3** — Given the moved filter/interceptor, when any request succeeds, fails validation, raises a `DomainException` or throws an unknown error, then the success/error envelopes are byte-identical to before. The existing filter/interceptor specs and e2e suites pass, and no flat `http-exception.*` / `transform-response.*` files remain directly in `filters/` or `interceptors/`.
- **AC-4** — Given `POST /visits/:id/orders` with `orderedByName` or `notes` that are `"   "`, when the order is placed, then those fields are stored and returned as `null`. Add this e2e assertion if no existing test covers it.
- **AC-5** — Given `modules/order/application/order.types.ts`, when inspected, then it contains only type/interface exports. `iso` no longer exists in `fold-orders.ts`, and order response timestamps are unchanged (existing order e2e).
- **AC-6** — Given an unknown LINE identity logs in twice with a changed display name, when the access request is recorded, then exactly one `staff_access_request` row exists, its `status` is still `pending` and it holds the new display name. Add this to the auth e2e if not covered.
- **AC-7** — Given `modules/iam/application/`, when searched, then it contains no imports of `typeorm`, `@nestjs/typeorm` or `infrastructure/persistence`.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1, AC-5 (types only), AC-7 | static check (`git grep`, output pasted in handoff) | — |
| AC-2 | unit + e2e (existing) | `src/modules/menu/application/menu-availability.spec.ts`, `menu-catalog.service.spec.ts`, `src/modules/order/application/business-date.spec.ts`, `order.service.spec.ts`, `ticket.service.spec.ts`, `test/menu.e2e-spec.ts` |
| AC-3 | unit + e2e (existing) | `src/common/filters/http-exception/*.spec.ts`, `src/common/interceptors/transform-response/*.spec.ts`, `test/envelope.e2e-spec.ts` + all other `test/*.e2e-spec.ts` |
| AC-4, AC-5 (timestamps) | e2e | `test/order.e2e-spec.ts`, `test/ticket.e2e-spec.ts` |
| AC-6 | e2e | `test/auth.e2e-spec.ts` |

Gate commands (all must pass):
```bash
pnpm --filter @bar/backend lint
pnpm --filter @bar/backend typecheck
pnpm --filter @bar/backend test
pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend openapi:check
```
A required script that doesn't exist yet = **BLOCKED**: report it, never skip it silently.

### Local Sonar scan
- Required for this brief: optional. It's a pure refactor and the gates above cover behaviour.
- Approved exclusions / "won't fix": none

## 6. Constraints
- Refactor only. If a test needs more than an import-path change to pass, behaviour changed: stop and report.
- Use `git mv` for moves so history follows the files.
- `.js` import extensions; `save()`, not `update()`, in the new IAM adapter (audited entity).
- Respect BRIEF-019's class-file rule: no module-level functions in class files, helpers are private methods.
- Don't add a `UtilsService`, a barrel `index.ts` or a shared `ClockModule`.
- Stage explicit paths only; never `git add -A`.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact only):**
  - Clock stays a class: `common/clock.ts` (interface + `CLOCK`) and `common/system-clock.ts` (`SystemClock`), registered per module with `useClass`. **Why:** smallest diff, and existing `overrideProvider(CLOCK)` tests keep working as written. A provider value would save only one tiny file.
  - **`common/` folder rule:** a `common/` unit gets its own folder only when it has ≥ 3 files (implementation + types + spec). Units with fewer files stay flat in their category folder. Applies to `common/filters/http-exception/` and `common/interceptors/transform-response/` in this brief.
  - Paths: `common/http/http-input.ts` gains `blankToNull`. `modules/order/infrastructure/http/http-input.ts` gains `requestedLines`. New files `modules/iam/domain/access-request.repository.ts`, `modules/iam/domain/access-request.types.ts` and `modules/iam/infrastructure/persistence/access-request.typeorm-repository.ts`.
  - Port method `recordPending(input: AccessRequestInput): Promise<void>`. The insert-pending / update-profile-only rule lives in the adapter.
- **Likely DRs:** none expected. If the BRIEF-019 lint rule rejects `common/clock.ts` (interface + const in one file), split it into `clock.types.ts` + `clock.token.ts` and note it in the handoff. Don't change the lint rule.

## 8. Unlocked Protected Files
- `none`

---

## Open items (Field, outside this brief)
- `docs/rules/backend.md` src tree still lists flat `filters/http-exception.filter.ts` and `interceptors/transform-response.interceptor.ts`, and doesn't show `common/http/`, `money.ts`, `time-label.ts`, `clock.ts` or the ≥ 3-file folder rule. That's a rules edit: Field-approved, on a docs branch, after this merges.

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates and evidence; dependencies have completion conditions
- [x] No unresolved decision blocking the main outcome
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-18 | Initial draft (Cowork), built from the 18 Oct backend structure review and narrowed to what BRIEF-019 doesn't cover. Field decisions 2026-10-18: ID BRIEF-020 confirmed · F8 IAM port stays in this brief (Full audit) · `backend.md` tree update = separate Field-approved docs-branch change after merge · **Ready — Rev 1 approved by Field 2026-10-18** (test paths pinned to existing files, dependency marked merged #52) |

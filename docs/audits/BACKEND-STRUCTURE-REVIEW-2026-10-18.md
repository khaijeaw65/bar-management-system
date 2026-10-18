# Backend structure and maintainability review

## Review record

| Item | Detail |
| --- | --- |
| Date | 18 October 2026, Asia/Bangkok |
| Reviewer | Codex, acting as a technical lead reviewer |
| Assignment | User explicitly requested a backend review, comparison with previous projects, and a detailed Markdown summary |
| Session | Read-only review followed by writing this report |
| Primary scope | `app/backend` |
| Reviewed branch | `main` |
| Reviewed committed HEAD | `7c88f90cd5894c2e054318d2ed264e7744a13ab2` |
| Assessment | Localized maintainability debt; focused cleanup recommended |
| Gate status | Advisory review; not a BRIEF audit PASS or merge approval |

This report combines the helper/class review and the subsequent project-structure comparison. Recommendations are proposals, not approved architecture decisions or authorization to change application code.

Two untracked directories were present during the review:

```text
app/backend/src/common/filters/http-exception/
app/backend/src/common/interceptors/transform-response/
```

They contain apparent alternative implementations of existing filter/interceptor files. They were left untouched and are not counted as evidence that the committed project maintains two active implementations. Bootstrap still imports the existing flat paths.

## 1. Executive assessment

The user's concerns are supported by concrete examples. The backend has duplicated technical utilities, inconsistent helper placement, misleading file responsibilities, and a read pipeline with several intermediate representations.

The current separation also has value. Business services generally depend on repository abstractions instead of building database queries directly. Feature-owned persistence entities are easier to associate with their owning modules. Time-sensitive rules can be tested with controlled time. These benefits should survive any cleanup.

The issue is not simply that the project contains classes and functions together, or that hexagonal architecture is unfamiliar. The larger issue is that the structure does not consistently explain ownership and dependency direction, while some extractions increase the number of concepts a reader must hold at once.

Recommended direction:

1. Retain the feature modules and current layer directories initially.
2. Consolidate exact technical duplicates.
3. Remove wrappers that add no useful meaning.
4. Make file names and contents predictable.
5. Review the order read model and venue/order dependency cycle separately.
6. Reassess broad folder changes only after those improvements.

No evidence from this review justifies a full rewrite, a richer domain-class hierarchy, or additional generic abstraction layers.

## 2. Scope, evidence, and limitations

### Inspected material

- Project workflow, backend conventions, agent boundaries, and minimalism guidance.
- Backend module wiring, repository ports, representative services, persistence adapters, mappers, and helpers.
- Menu and order clock definitions, their consumers, and menu tests.
- BRIEF-012 and BRIEF-016 requirements concerning controlled time.
- Layouts of all five previous projects and representative source files from each.

### Verification performed

`pnpm --filter @bar/backend lint` completed with exit code 0 during the review.

This is evidence that the current lint command passed. It does not establish architectural consistency, absence of duplication, runtime correctness, or compliance with review-only conventions.

No application code, dependencies, rules, briefs, state files, or existing audit reports were changed. No runtime, integration, concurrency, database, or performance tests were run for this review. No Git mutation was performed.

The previous projects were sampled for structural comparison. They were not exhaustively audited, and the examples below should not be read as a verdict on their overall production quality.

## 3. Comparison with previous projects

| Project | Observed organization | Benefit | Cost visible in sampled code |
| --- | --- | --- | --- |
| DPU Pre-project | Feature services/controllers, repository interfaces and implementations, global entities, injected vendor clients | Familiar feature navigation and existing dependency inversion | A feature's service, repository, and entity can be in separate top-level groups; repository interfaces expose persistence entity types |
| TCP-Canteen BOSV | Controller/service/DTO per feature, shared database repository | Feature entry points are easy to find | Services directly build database queries and coordinate infrastructure alongside business decisions |
| TCP-Canteen Chat | Modules, subscribers, schedulers, message builders | Folders describe execution roles and integration entry points | Sampled session service manages transactions and persistence entities directly |
| TCP-Canteen IDP | Auth and integration modules with direct shared repository access | Straightforward service-to-database path | Feature logic depends directly on persistence access patterns |
| TCP-Canteen Logs | Narrow subscriber/controller/service structure | Small structure matches a narrow responsibility | Logging service depends directly on the shared database repository |
| Bar backend | Feature modules containing application/domain/infrastructure | Explicit boundaries, feature-owned persistence, testable dependencies | More navigation, intermediate shapes, and inconsistent application of the boundaries |

### 3.1 The dependency pattern is not entirely new

The Pre-project [LanguageService](/Users/khaijeaw/Documents/DPU/Pre-project/backend/src/modules/language/language.service.ts) receives a repository abstraction. Its [module](/Users/khaijeaw/Documents/DPU/Pre-project/backend/src/modules/language/language.module.ts) selects the implementation. The GenAI service similarly receives LLM and storage abstractions.

Those are already examples of depending on a capability rather than constructing its implementation. The bar project makes that separation more visible through folder names and framework-free port types.

The Pre-project repository interface nevertheless returns a TypeORM entity class. The bar project's separate record types improve that particular separation, at the cost of more types and mapping work.

### 3.2 Flatter navigation can hide implementation complexity

The BOSV [OrderService](/Users/khaijeaw/Documents/Work/SSCI/TCP-Canteen/backend/tcp-canteen-bosv/src/module/order/order.service.ts) contains query-builder expressions and coordinates sessions, storage, and messaging. The Chat [SessionService](/Users/khaijeaw/Documents/Work/SSCI/TCP-Canteen/backend/tcp-canteen-chat/src/modules/session/session.service.ts) creates a query runner and manages transaction lifecycle directly.

These are easier to locate because much of the behavior is in one service file. They also require the reader to understand business decisions and infrastructure details together.

The goal for the bar backend should be to preserve clear feature entry points while retaining useful separation. Copying either old layout wholesale would carry its tradeoffs too.

### 3.3 File counts are not a quality score

The previous projects have different responsibilities, shared `common/` packages, tests, and integration surfaces. Raw source-file counts are therefore not an apples-to-apples comparison.

A better measure is the number of files and representations needed to understand or safely change one specific behavior.

## 4. Detailed findings

Priorities below describe maintenance sequencing. They are not claims of production incidents or formal bug-severity ratings.

### F1 — Exact technical helpers are duplicated

**Priority: near-term cleanup. Confidence: high.**

| Helper | Locations | Observation |
| --- | --- | --- |
| `requireUuid`, `staffAccess` | Menu, venue, and order `infrastructure/http/http-input.ts` | Identical implementations in three modules |
| `money` | Menu and order `application/money.ts` | Identical decimal-string formatting |
| `clockSeconds` | Menu `menu-availability.ts`, order `business-date.ts` | Identical time-string conversion |
| `withoutVisit` | `TicketService`, `OrderQueryService` | Identical ticket response projection |
| `Clock`, `CLOCK`, `SystemClock` | Menu and order | Identical capability represented independently |

Examples: [menu HTTP helpers](../../app/backend/src/modules/menu/infrastructure/http/http-input.ts), [venue HTTP helpers](../../app/backend/src/modules/venue/infrastructure/http/http-input.ts), [order HTTP helpers](../../app/backend/src/modules/order/infrastructure/http/http-input.ts).

**Impact:** fixes and behavior changes must be repeated, and copies can drift. Future callers have no obvious canonical implementation.

**Recommendation:** consolidate identical technical behavior into explicitly named files owned by the appropriate shared layer. Keep `withoutVisit` local to order. Preserve existing UUID error semantics and decimal formatting behavior during consolidation.

**Boundary:** menu availability and business-day cutoff are distinct business policies. Sharing their time parser does not imply merging their policies.

### F2 — Controlled time is justified; duplicated clock machinery is not

**Priority: near-term cleanup. Confidence: high.**

Menu and order each define a clock interface/token and a dependency-free `SystemClock` whose `now()` returns `new Date()`.

Evidence:

- [Menu clock port](../../app/backend/src/modules/menu/domain/clock.ts)
- [Order clock port](../../app/backend/src/modules/order/domain/clock.ts)
- [Menu implementation](../../app/backend/src/modules/menu/application/system-clock.ts)
- [Order implementation](../../app/backend/src/modules/order/application/system-clock.ts)
- [Menu test override](../../app/backend/test/menu.e2e-spec.ts)

BRIEF-016 explicitly requires injected time for availability. BRIEF-012 also requires controlled-time testing around the business-day cutoff. The menu unit and end-to-end tests demonstrate actual use of the seam.

**Recommendation:** retain controllable time and consolidate its definition/implementation. One shared implementation can be registered where needed. A simple provider value is also a possible implementation; the capability does not inherently require a standalone class.

**Caution:** the two existing `Symbol('CLOCK')` values are distinct tokens despite their identical descriptions. A consolidation must update registrations, imports, and overrides deliberately. Sharing a token does not automatically make provider visibility global.

### F3 — Small helpers sometimes increase indirection without adding meaning

**Priority: opportunistic cleanup. Confidence: high for examples; judgment-based for removal.**

Example from [fold-orders.ts](../../app/backend/src/modules/order/application/fold-orders.ts):

```ts
function iso(value: Date): string {
  return value.toISOString();
}
```

The standard operation is already clear. Its wrapper introduces another name without expressing a different rule, policy, or error boundary.

`TokenService.refreshTtlArgument()` similarly wraps `String(this.jwtConfig.refreshTtlSeconds)`. Its removal is a readability judgment rather than a correctness fix; repeated protocol-specific conversion can sometimes justify a name.

**Recommendation:** evaluate helpers by the meaning they contribute. Keep a helper when it names a business concept, protects an invariant, removes meaningful repetition, or isolates complexity. Consider inlining wrappers that merely rename an obvious operation.

Do not delete useful functions just because they are short. `businessDate`, `menuAvailability`, and ticket-transition functions represent meaningful policies.

### F4 — File names and layer contents do not consistently predict responsibility

**Priority: near-term clarity improvement. Confidence: high.**

[order.types.ts](../../app/backend/src/modules/order/application/order.types.ts) contains both types and executable request-normalization functions: `requestedLines()` and `blank()`.

Other service files export types alongside behavior despite the current convention assigning types to separate files. For example, [menu-catalog.service.ts](../../app/backend/src/modules/menu/application/menu-catalog.service.ts) exports its query and orderable lookup types.

Business rules such as menu availability, order-line validation, and ticket transitions live in `application/`, while `domain/` mostly holds ports and data types. This can be a workable lightweight convention, but readers need a consistent explanation of it.

**Impact:** readers cannot reliably infer where behavior or a public type is defined from its name or directory.

**Recommendation:** first enforce truthful names and consistent responsibilities. Do not move every pure rule into `domain/` solely to make the architecture look more complete. If a domain-rule relocation is desired, decide the convention explicitly and apply it consistently.

### F5 — The order read path exposes several intermediate representations

**Priority: focused design review. Confidence: high on structure; medium on how much can safely be removed.**

Current path:

```text
SQL query result
  -> toOrderRow()
  -> OrderRow[]
  -> foldOrders()
  -> FoldedOrder / FoldedTicket
  -> toOrder() / toTicket()
  -> response contracts
```

Relevant files:

- [order.sql.ts](../../app/backend/src/modules/order/infrastructure/persistence/order.sql.ts)
- [order-row.mapper.ts](../../app/backend/src/modules/order/infrastructure/persistence/order-row.mapper.ts)
- [order-row.types.ts](../../app/backend/src/modules/order/domain/order-row.types.ts)
- [fold-orders.ts](../../app/backend/src/modules/order/application/fold-orders.ts)
- [folded-order.types.ts](../../app/backend/src/modules/order/application/folded-order.types.ts)
- [present-order.ts](../../app/backend/src/modules/order/application/present-order.ts)
- [order-query.service.ts](../../app/backend/src/modules/order/application/order-query.service.ts)

The join must be reconstructed into orders, tickets, items, and modifiers. Staff display names must also be attached, and totals calculated. Those responsibilities are real. Their existence is not itself evidence of overengineering.

The review question is whether each intermediate shape creates a useful boundary or merely divides one transformation across files. The current chain is a significant source of navigation cost.

**Recommendation:** trace one order response and justify each transformation. Consider grouping related mapping behavior or changing the repository read result before introducing more model types. Preserve modifier grouping, price snapshots, cancellation treatment, totals, and staff attribution.

### F6 — The order port exposes the persistence join representation

**Priority: design decision before substantial read-path refactoring. Confidence: high.**

[OrderRepository.rows()](../../app/backend/src/modules/order/domain/order.repository.ts) returns `OrderRow[]`. Each row combines order, ticket, seat, item, and modifier fields, reflecting a flattened join.

The application does not import TypeORM, but it still understands how the adapter represents joined data. Framework independence and representation independence are different properties.

**Recommendation to evaluate:** return a nested application-facing read model, with join reconstruction inside the persistence adapter. Keep genuinely business-specific presentation decisions in their appropriate owner.

This is a proposed boundary change. It should be compared against its mapping and test costs rather than assumed to be superior merely because it looks more hexagonal.

### F7 — Feature boundaries have circular dependencies and utility leakage

**Priority: architectural follow-up before the cycle expands. Confidence: high.**

- [OrderModule](../../app/backend/src/modules/order/order.module.ts) imports VenueModule through `forwardRef()`.
- [VenueModule](../../app/backend/src/modules/venue/venue.module.ts) imports OrderModule through `forwardRef()`.
- [TableSeatService](../../app/backend/src/modules/venue/application/table-seat.service.ts) imports the order money helper and order application types, as well as OrderQueryService for bills.

The bill lookup has a business reason. Generic formatting does not need feature-specific ownership. `forwardRef()` permits the module graph to be constructed but does not remove the architectural cycle.

**Recommendation:** move generic formatting to its proper shared owner first. Separately evaluate who should compose table/visit data with order bills and what public API that composition needs.

Do not introduce an event bus, mediator, generic orchestration layer, or new module solely to hide the cycle. The smallest clear ownership change should win.

### F8 — Some application files bypass the advertised persistence boundary

**Priority: clarify the convention before expanding IAM. Confidence: high.**

[AccessRequestService](../../app/backend/src/modules/iam/application/access-request.service.ts) imports TypeORM, injects a concrete TypeORM repository, and imports an entity from `infrastructure/persistence`.

Neighboring IAM services use a repository port. The folder structure therefore advertises one dependency rule while this service follows another.

**Recommendation:** determine whether the direct access is a deliberate exception or a boundary violation to fix. If an approved exception exists, document its scope. Otherwise, use the established persistence boundary when the relevant work is authorized.

This review identifies the source-level inconsistency; it does not assert that no historical approval exists.

### F9 — Class/function placement is inconsistent, and the rules can encourage fragmentation

**Priority: separate convention review from functional cleanup. Confidence: high on inconsistency; inferred on cause.**

The current [backend rules](../rules/backend.md) prohibit module-level functions in class files. Committed examples remain in AuthService, TokenService, OrderService, TicketService, OrderQueryService, and persistence adapters.

Moving these functions to private methods can improve local discoverability and satisfy the stated rule. It does not by itself eliminate duplicated logic or unnecessary intermediate concepts.

The combination of a 20-line function limit, separate type files, and class-only files can encourage fragmentation if applied mechanically. This is an interpretation of the incentives, not proof that those rules caused the existing implementation.

**Recommendation:** review the combined effect of the conventions. Preserve cohesive responsibilities and clear dependency direction. Avoid producing additional classes, files, or types merely to satisfy a metric. Any rule revision remains a Field decision.

## 5. What should be preserved

| Existing choice | Why it earns its place |
| --- | --- |
| Feature-owned persistence | Associates entities and queries with their owner rather than a global entity collection |
| Repository ports for business services | Allows service tests to supply controlled persistence behavior |
| Injected clock | Makes time boundaries deterministic in tests |
| Pure availability and transition functions | Expresses business rules independently of I/O coordination |
| Module wiring in module files | Provides a predictable location to inspect implementation selection |
| Small, explicit public service APIs | Lets other features request capabilities without accessing repositories directly |
| Separation of database mapping from request handlers | Keeps transport handlers from taking ownership of persistence details |

A pass-through service is not automatically waste. For example, StaffUserService provides a public IAM boundary even when individual methods delegate to a repository. Removing it may save lines while exposing persistence across modules.

The current application layer intentionally uses Nest services and transaction decorators. This review does not recommend converting all application services into framework-free classes.

## 6. Suggested ownership guide

This is a review aid, not a replacement for approved project rules.

| Question | Suggested owner |
| --- | --- |
| Is this generic time access, decimal conversion, or HTTP validation used across modules? | An explicitly named shared file in the appropriate layer |
| Does this implement menu availability? | Menu |
| Does this implement order pricing or ticket transitions? | Order |
| Does this implement visit state changes? | Venue |
| Does this translate SQL rows or TypeORM entities? | Owning persistence adapter or its local mapper |
| Does this normalize HTTP input or shape transport output? | Owning HTTP boundary, subject to approved service contracts |
| Does this helper have one class as its sole owner? | Keep it beside that class, using the project's class-file convention |
| Does another feature need a capability? | Its owner's public service API, rather than repository access |

Use `common/` deliberately. It should not absorb menu, order, or venue policies merely because multiple callers need them. A large `UtilsService` would replace visible duplication with unclear ownership.

Likewise, backend-only utilities do not belong in `@bar/contracts` solely to make them shared. That package's existing contract role should remain explicit.

## 7. Recommended cleanup sequence

### Stage A — Consolidate and clarify

Candidate scope:

- Consolidate exact HTTP helper copies while preserving status/error behavior.
- Consolidate identical decimal formatting and time parsing.
- Unify the clock capability while retaining test overrides.
- Keep one order-owned ticket projection.
- Remove obvious wrappers such as `iso()` where the call site remains clearer.
- Separate executable normalization from misleading `.types.ts` files.

Success criteria:

- Each consolidated technical behavior has one clear implementation.
- Callers remain within appropriate ownership boundaries.
- No API, error, time-boundary, monetary, or authorization behavior changes.
- No new generic utility service or dependency is introduced.

### Stage B — Review the order read model

Decide which representations are necessary, where join folding belongs, and whether the repository result should be nested.

Preserve the externally observable response, totals, grouping, cancellation treatment, and attribution. Require evidence from the affected tests before accepting simplification.

### Stage C — Review cross-module ownership

Evaluate the venue/order cycle and the placement of table-summary composition. Resolve the IAM persistence exception under an explicit convention.

These are architecture decisions and should follow the project's Field Guard process when implementation is proposed.

### Stage D — Revisit conventions using the cleaned code

Evaluate whether the combined size/type/class-file rules improve comprehension. Any proposed rule change should show concrete before/after examples rather than replacing one rigid style with another.

Do not combine these stages into a whole-backend rename or rewrite. Keep each change independently reviewable.

## 8. Validation expectations for future implementation

Use the exact gates required by the approved implementation brief. Depending on scope, relevant evidence includes:

- Lint and TypeScript checks after moving helpers and updating imports.
- Existing menu tests for controlled time, availability windows, and midnight boundaries.
- Existing business-date tests around the configured cutoff.
- Order tests for price snapshots, modifiers, totals, and ticket transitions.
- Affected HTTP tests for UUID rejection, envelopes, response shapes, and statuses.
- Order/venue integration checks if bill composition or module wiring changes.
- Authentication tests if auth helpers or IAM persistence are changed.

Do not add tests that merely restate a wrapper's implementation. Prefer observable behavior that would fail if the refactor changed a real contract or invariant.

## 9. Decisions that remain open

1. Should the clock use one shared class implementation or a simple provider value?
2. Which order intermediate representations protect a useful boundary?
3. Should the order repository return nested read models instead of flat join rows?
4. Who owns composing venue/table summaries with order bills?
5. Is direct persistence access in AccessRequestService an approved exception?
6. Do the current conventions need adjustment after duplication and misleading placement are removed?

None of these decisions was approved by writing this report. A Ready brief and any required Field decisions are still needed before implementation.

## 10. Final recommendation

Retain the current feature/layer structure initially. Improve ownership, remove exact duplication, and simplify the paths that require the most navigation.

Judge the result by whether a developer can locate one business rule, identify its dependencies, and change it safely without reading unrelated implementation details. Fewer files are useful only when they reduce that cost without weakening the boundaries that protect behavior.

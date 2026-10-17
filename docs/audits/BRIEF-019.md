# Audit — BRIEF-019 Class files hold class context only

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session_018oq1d4BgYC8R4izVbJDnzA |
| **Assignment** | Brief default (Cowork); `audit BRIEF-019` from Field 2026-10-17 |
| **Date** | 2026-10-17 |
| **Branch / commit** | `feat/BRIEF-019-class-helpers` · `a0f48cdc5e58772e58c164761597cf4b2bfe0d6d` (work) · handoff `755498f` |
| **Depth** | Compact (refactor) + per-helper behaviour comparison |
| **Brief revision** | 2 (+ DR-017 Approved A) |
| **Recommendation** | PASS ← Field makes the final call |

## Acceptance Criteria
| AC | Met? | Evidence | Note |
|---|---|---|---|
| AC-1 | ✅ | `node scripts/check-class-files.mjs` → exit 0, no output (run by auditor on `755498f`) | |
| AC-2 | ✅ | Auditor fixture outside the repo: class + `function helper` + `async` arrow const + generic arrow const → all three named, exit 1; `//` comment, template-string and object-literal `const` correctly ignored; function-only file not flagged | Stronger than the handoff fixture |
| AC-3 | ✅ | Handoff G1: unit 62, e2e 52. Only test edit: `requestHash` import path in `idempotency.service.spec.ts` (diff inspected). No test deleted/skipped | Auditor could not re-run vitest/oxlint (see Evidence Coverage) |
| AC-4 | ✅ | Removed names exist only in `common/money.ts`, `common/time-label.ts`, `common/http/http-input.ts`, `present-order.ts`; row readers renamed `read*` in `common/persistence/row-values.ts` | |
| AC-5 | ✅ | Handoff: `openapi:check` exit 0. `orders.openapi.ts` / `visits.openapi.ts` bodies identical to the removed controller functions | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | 47 files, all in §2 A–D, DR-017, handoff, own state. `toCents`/`fromCents`/`lineCents` moved into their only caller `fold-orders.ts` when `order/application/money.ts` was deleted — in scope (§7 pre-decided deletion), behaviour identical |
| No unapproved deviations / deps | ✅ | DR-017 Approved A. `package.json` diff = `lint` value exactly as §2 D. No dependency change |
| `PermissionsGuard` only | ✅ | Untouched |
| `save()` not `update()` | ✅ | Untouched |
| ESM `.js` imports | ✅ | typecheck exit 0 (auditor) |
| Agent boundaries | ✅ | `docs/rules/backend.md` change = Field-approved Rev 2 text, committed with `Approved-by` trailer (`8825637`) |
| Rev 2: plain `private`, no `static` | ✅ | `grep "private static" src` → 0 |
| Callbacks keep their receiver | ✅ | No `.map(this.x)` / unbound method references; callbacks use arrows (`(w) => this.toWindow(w)`) |

## Behaviour preservation
Script-compared every module-level function on `main` against its new home (body normalised for `this.`, `private`, renamed row readers). All identical except the row readers, compared by hand:
- `text` / `optionalText` / `asDate` / `optionalDate` (order + visit) → `read*`: same logic; error text `order row …` / `visit row …` → `row …`.
- `table-seat` `asDate(Date | string)` → `readDate(unknown)`: same result for valid rows, now throws on non-date input instead of `new Date(x)`.

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| 1 | Suggestion | Med | `scripts/check-class-files.mjs` is ~230 lines of a hand-written tokenizer (strings, templates, comments, brace depth). It works (AC-2), but it is code nobody wants to maintain. **Current →** custom parser. **Updated →** `typescript` (already a backend devDependency) `ts.createSourceFile` + loop over `sourceFile.statements`: has `ClassDeclaration` and any `FunctionDeclaration` / `VariableStatement` with arrow or function initializer → fail. ~25 lines, exact. Follow-up brief; the same script can also check the "types live in `*.types.ts`" rule (see #3) |
| 2 | Suggestion | Low | Row-reader errors lost their table: `order row is missing a string` → `row is missing a string`. Only hit on corrupt rows; accepted by brief §2 C. Optional later: `readText(value, 'order')` context param |
| 3 | Suggestion (out of scope) | Med | Existing rule *Where types live* is not met in 9 source files, e.g. `idempotency.service.ts` declares `IdempotencyGate` + `Stored`; also `order.service.ts`, `menu-catalog.service.ts`, `menu-catalog.typeorm-repository.ts`, `present-order.ts`, `ticket-transition.ts`, `order-lines.ts`, `menu-availability.ts`, `cli/seed-menu-catalog.ts`. Pre-existing, not introduced here. Also `menu-catalog.typeorm-repository.ts` `toRecord` has 5 parameters (> 3 rule), pre-existing. → next rules/cleanup brief |
| 4 | Suggestion | Low | KJ state Next steps dropped "Confirm PR #47 closed unmerged (superseded by #48)" — a Field to-do. → restore in the next seed commit |

## Recommendation to Field
PASS. The refactor is mechanical and verified helper by helper; public signatures, routes and the OpenAPI document are unchanged, and the new lint check correctly catches the pattern. Findings are follow-ups, not blockers: #1 and #3 fit naturally into the rules session after your reference service (one TS-API check script enforcing both "class files" and "types files").

## Evidence Coverage
- Reviewed work SHA: `a0f48cd` (+ handoff `755498f`)
- Inspected independently: full `main...HEAD` diff; `package.json`; check script; new common files; `request-hash.ts`; openapi files; spec diff; state diff; DR-017
- Run by auditor on `755498f`: `node scripts/check-class-files.mjs` (exit 0), `tsc --noEmit` (exit 0), fixture test of the script (exit 1, 3 correct hits), behaviour-comparison script over all moved functions
- Not re-run by auditor: oxlint, vitest unit/e2e, `openapi:check` — the auditor shell is Linux and `node_modules` holds macOS native bindings (rolldown/oxlint). Relying on handoff G1; CI on the PR re-runs all of them
- Written uncommitted; the executor commits it unchanged at PASS (H).
- Repeated blocker: none

## Sonar (local scan)
- Not run (optional per brief). N/A.

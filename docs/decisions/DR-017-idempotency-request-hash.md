# DR-017 — Where `requestHash` lives

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Cursor (kj) · 2026-10-17 |
| **Brief** | BRIEF-019 |
| **Category** | Brief deviation |

## Context
BRIEF-019 §2 A lists `requestHash` and `sortValue` in `idempotency.service.ts` as private methods of `IdempotencyService`. `requestHash` is exported and called from `OrdersController` and `idempotency.service.spec.ts`. `sortValue` exists only to build that hash. A private method is not callable from either caller. Pointing them at a new public method, or folding the hash into `begin()`, changes the service's public signature. The spec calls `requestHash` directly; AC-3 allows import-path edits only. Every other helper in that file is already a plain `private` method (Rev 2). The class-file check still fails on these two names.

## Options
**A) Function-only file** — move `requestHash` and `sortValue` to `src/modules/order/application/request-hash.ts`. Controller and spec change import paths. `IdempotencyService` public methods stay as they are. The class file has no module-level function.
**B) Public method on the service** — `requestHash` becomes a public instance method, not private. Callers use `this.idempotency.requestHash` / `service.requestHash`. Deviates from "private" and adds a public method.
**C) Leave both next to the class** — no signature change. `scripts/check-class-files.mjs` stays red, so AC-1 cannot pass.

## Recommendation
A. Behaviour stays the same, the only edits outside the move are import paths, and the class file matches Rev 2. `sortValue` moves with `requestHash` because nothing else calls it.

---

## Decision — Field only
**Decision:** A — move `requestHash` and `sortValue` to `src/modules/order/application/request-hash.ts` (function-only file). `OrdersController` and `idempotency.service.spec.ts` change import paths only; `IdempotencyService` public methods unchanged. Recorded by Cowork from Field's explicit decision in session.
**Why:** `requestHash` is a pure function used by the controller, the spec and the idempotency flow — not a service helper. `backend.md` *Where functions live* allows function-only files for pure logic, so this needs no public-signature change.
**Date:** 2026-10-17

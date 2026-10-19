# Audit — BRIEF-013 Payments core (PromptPay QR, cash, lock, manual confirm, QR expiry)

| | |
|---|---|
| **Auditor** | Cowork (Claude) · session https://claude.ai/code/session_01HNwLJbgu37Q1D2n6p6gcse |
| **Assignment** | Brief default auditor (Cowork); `audit BRIEF-013` by Field, 2026-10-19 |
| **Date** | 2026-10-19 |
| **Branch / commit** | `feat/BRIEF-013-payments-core` · `f06f28a` (work) · handoff `b793ac9` |
| **Depth** | Full |
| **Brief revision** | 3 (Ready 2026-10-19) |
| **Recommendation** | **PASS** — no Must fix; S1–S5 are suggestions ← Field makes the final call |

> Findings describe code and documents, not people. Use "Current → Updated" framing.

## Acceptance Criteria
| AC | Met? | Evidence (test / file) | Note |
|---|---|---|---|
| AC-1 | ✅ | `payment.e2e-spec.ts` "locks a 1240 promptpay bill…" · `PaymentService.create` → `scheduleExpiry` (`jobId = paymentId`) | |
| AC-2 | ✅ | `describe('lock')` "blocks a second create and close…" · `VisitService.closeWhenClear` locks visit → `PaymentGuard` | |
| AC-3 | ✅ | "replays the same idempotency key…" · `common/idempotency/` + `idempotency.service.spec.ts` (`CONFLICT` while polling) | |
| AC-4 | ✅ | "completes cash immediately and can settle a QR as cash" | |
| AC-5 | ✅ | "requires a manual reason…" · `MarkPaidSchema.superRefine` | |
| AC-6 | ✅ | "cancels a pending payment…" asserts `locked = false` + `jobCount = 0` | |
| AC-7 | ✅ | `payment.service.spec.ts` (clock) · e2e `describe('expiry')` — real delayed job (TTL 2 s), one event, no-op on settled, expire vs mark-paid single winner | see S1 |
| AC-8 | ✅ | "lets one of two concurrent creates win" · "lets one of mark-paid and cancel win" | |
| AC-9 | ✅ | "does not close the visit when the bill is settled" | |
| AC-10 | ✅ | "rejects gateway mode, a missing PromptPay id, and a mode other than merge" | |
| AC-11 | ✅ | `promptpay-payload.spec.ts` — all 3 vectors independently reproduced byte-for-byte with npm `promptpay-qr@0.5.0` | |
| AC-12 | ✅ | "returns 404 and 400…" · `openapi:check` exit 0 · `docs/api/README.md` Payments table | |
| AC-13 | ✅ | Gates re-run by auditor (below) | |

## Rule Check
| Rule | OK? | Note |
|---|---|---|
| Scope — nothing outside the brief | ✅ | `ErrorCode` moved `common.ts` → `api-error.ts` (contracts) and money helpers extended — small supporting refactors, no behaviour change |
| No unapproved deviations / deps | ✅ | `bullmq@6.3.11`, `@nestjs/bullmq@12.0.0` exact, as Pre-decided; env `PAYMENT_QR_TTL_SECONDS` as Pre-decided |
| `PermissionsGuard` only, no inline checks | ✅ | `@RequirePermissions` metadata only (enforcement = IAM brief, as scoped) |
| `save()` not `update()` on audited entities | ✅ | status changes via `PaymentTypeormRepository.save` under `SELECT … FOR UPDATE` |
| ESM `.js` imports · contracts as source of truth | ✅ | |
| Agent boundaries respected | ✅ | non-app files: `docs/api/*`, lockfile only |
| Run proof on the audited SHA | ✅ | Executor: health 200 on :3011 (3001 taken locally), expiry key in Redis. Auditor: fresh clone of `b793ac9` (code = `f06f28a`), `migration:run` → no pending after e2e, `start:dev` → `/api/health` 200 `db: up`. UI n/a |

Also checked: status changes only in `PaymentService`; events + queue calls after commit; processor not imported by the controller; PromptPay ID absent from logs and `GET /venue`; lock order (visit → payment) has no deadlock path; amounts as strings, satang math.

## Test Quality
Tests hit real Postgres + Redis + a real BullMQ delayed job, and concurrency tests use `Promise.all` against the HTTP layer — they assert the ACs, not mocks. The expire-vs-mark-paid race test accepts either winner and checks exactly one event: correct for a race. Gap (low): no test for the enqueue-failure path (logged + 201); acceptable given the brief accepts that limit.

## Findings
| # | Must fix / Suggestion | Severity | Evidence · Current → Updated |
|---|---|---|---|
| S1 | Suggestion | Med | `PaymentService.expirePending` · **Current:** a job that runs before `expires_at` (clock skew between ECS tasks, or a future TTL change) is a silent no-op and the QR stays `pending` until staff cancel. Single-instance is safe (job timestamp ≥ `expires_at` on the same clock). **Updated:** when still pending but not due, re-add the job with the remaining delay (or throw so BullMQ retries). ~5 lines. Do before running >1 backend task. |
| S2 | Suggestion | Med | `providers/queue/bull-connection.ts` · **Current:** parses `REDIS_URL` into host/port/user/password — drops `rediss://` TLS and the DB index, unlike `RedisService` which passes the URL to ioredis. ElastiCache with in-transit encryption would fail to connect. **Updated:** set `tls: {}` for `rediss:` and `db` from the path (or hand BullMQ an ioredis instance built from the URL). Before AWS 9–20 Nov. |
| S3 | Suggestion | Low | `PaymentModule` ⇄ `VenueModule` ⇄ `OrderModule` via `forwardRef` (`VisitService` → `PaymentGuard`, `PaymentService` → `VisitService`). Adds payment to the venue↔order cycle already parked as structure review F7. **Updated:** fold into F7 after 8 Nov (e.g. close guard via an event/port owned by venue). |
| S4 | Suggestion | Low | Size · **Current:** 2,192 added lines excl. `openapi.json`/lockfile (645 tests) vs the brief's ~500 target — the Rev 3 estimate was low, not a scope breach (scope matches §2). **Updated:** for BRIEF-023/024/025/026, size from the module count of this brief (~1.5k for a module with migration + 4 endpoints). Planning note for Cowork. |
| S5 | Suggestion | Low | BRIEF-018 input · `BillService.remaining` covers whole orders; a line voided after its order is in a completed payment makes `paid > total`. Out of scope here (void = BRIEF-018) — carry into BRIEF-018's ACs. |

## Recommendation to Field
PASS. Every AC is met with real-infra tests, all gates reproduce on a clean clone, the EMVCo payload matches an independent library, and concurrency/locking follows the BRIEF-012 pattern. S1 and S2 are the two worth scheduling: S2 before the AWS window, S1 before running more than one backend task. Neither affects the 8 Nov local demo.

**Next command:** `execute BRIEF-013` (PASS commit + PR)

## Evidence Coverage
- Reviewed work SHA: `f06f28a` (handoff `b793ac9`, docs only)
- Sources/diff inspected independently: `modules/payment/**` (service, bill, guard, repository, controller, processor, module, migration, payload), `providers/queue/*`, `VisitService` close/lockLive, `VenueSettingsService.paymentAccount`, order `ORDER_TOTALS_SQL` vs `BILL_SQL`, contracts `payments.ts`, `package.json`, `.env.example`; all ACs
- Tests run by auditor on a fresh clone of `b793ac9`, Linux, Postgres 16 + Redis local: contracts test 23 ✓ · lint 0 · typecheck 0 · test 73 ✓ · test:e2e 76 ✓ · build 0 · openapi:check 0 · run proof health 200. EMVCo vectors cross-checked with `promptpay-qr@0.5.0`.
- Written uncommitted; the executor commits it unchanged at PASS (H). Pre-merge summary must verify S..H contains evidence-only changes (§7).
- Repeated blocker: none

## Sonar (local scan)
- Handoff Sonar section present for the scanned commit = S (or later scan): no — "Not available yet (BRIEF-006)"; brief marks the scan **Required**. Not blocking for this PASS since no shared scanner exists; Field to confirm.
- Remaining issues have reasons; no unapproved "won't fix"/exclusions: n/a
- Learning mode respected: n/a (KJ brief)

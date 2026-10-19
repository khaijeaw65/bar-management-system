# Handoff — BRIEF-017 Ticket issue flow

| | |
|---|---|
| **Implementer** | kj |
| **Date** | 2026-10-20 |
| **Brief revision** | 3 |
| **Branch** | `feat/BRIEF-017-void-comp-issues` (PR opens after audit PASS) |
| **Commit** | `2dcc8f6e042d30bc570040ff732c702b60d742b3` |
| **Status** | Implemented — awaiting audit |

> Gates and the run proof were run on `2dcc8f6`. Node v24.14.0. Postgres `bar` on localhost:5432, Redis `redis://127.0.0.1:6379`. Branch includes `main` through BRIEF-024 (PR #66, `998e6c0`).

## Summary
Staff can flag a pending, accepted, or ready ticket (`out_of_stock`, `equipment`, or `other`), then either send that issue to the POS once or clear it and return the ticket to accepted. Prices and lines stay unchanged. The ticket row lock keeps concurrent taps to one valid result.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `test/ticket-issue.e2e-spec.ts` — flags pending / accepted / ready, fills `issue.reportedBy`, one `ticket.status_changed` · `ticket-transition.spec.ts` |
| AC-2 | ✅ | e2e — `other` without a note is 400 `VALIDATION_ERROR`; a line from another ticket or a cancelled line is 400; flag on sent / cancelled / issue is 409; unknown ticket is 404 |
| AC-3 | ✅ | e2e — escalate keeps `issue`, sets `escalatedAt`, one `ticket.issue_escalated` and no `ticket.status_changed`; second escalate is 409 `ใบงานนี้ส่งให้ POS แล้ว`; `GET /tickets?escalated=true` lists it and drops it after substitute |
| AC-4 | ✅ | e2e — substitute returns `accepted`, `issue` is null, one `ticket.status_changed`; resolve on a non-issue ticket is 409 |
| AC-5 | ✅ | e2e — two concurrent substitutes are 200 + 409; flag racing accept ends on `issue` with the reason set; flag racing send is 200 + 409 and the re-read matches the winner |
| AC-6 | ✅ | e2e — order items, order total, visit bill total, and `order_item` rows are identical before flag and after substitute |
| AC-7 | ✅ | `openapi:check` exit 0. OpenAPI lists `POST /api/tickets/{id}/flag-issue`, `POST /api/tickets/{id}/resolve`, and query `escalated`. README Tickets rows updated |
| AC-8 | ✅ | Gate table below |

## Gate Evidence (G1)
| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/contracts test` | 0 | 26 passed · 0 failed |
| `pnpm --filter @bar/backend lint` | 0 | pass |
| `pnpm --filter @bar/backend typecheck` | 0 | pass |
| `pnpm --filter @bar/backend test` | 0 | 81 passed · 0 failed |
| `pnpm --filter @bar/backend test:e2e` | 0 | 88 passed · 0 failed |
| `pnpm --filter @bar/backend build` | 0 | pass |
| `pnpm --filter @bar/backend openapi:check` | 0 | pass (export produced no diff) |
| run proof: stack up → `migration:run` → `start:dev` → `curl -fsS localhost:3001/api/health` | 0 | Postgres and Redis already up. `migration:run`: no migrations pending. `curl localhost:3001/api/health` → **404** HTML from an unrelated docker listener (same as BRIEF-013). This process listened on `127.0.0.1:3011` (`PORT=3011`). Health **200** `{"status":"ok","db":"up"}`. Seeded staff session: place `ช้างดราฟต์` → 201 total `120.00` → flag `out_of_stock` → 200 `issue`, reporter `เอ` → resolve escalate → 200 with `escalatedAt` → `GET /tickets?escalated=true` includes the ticket → resolve substitute → 200 `accepted`, `issue` null. Order total and line JSON unchanged |

UI exercised: n/a

## Sonar (local scan)
- Not available yet (BRIEF-006). Not run. This brief marks the scan optional.

## Decisions Raised
- none

## Deviations from Brief
- None. README rows that still said BRIEF-017 for cancel and 86 now point at BRIEF-018 and BRIEF-027 (Field split, 2026-10-20). Those endpoints were not built.

## Known Gaps / Follow-ups
- The optional `note` on resolve is accepted and not stored. Substitute clears `issue_*`, and issue history is out of scope.
- Diff excluding `docs/api/openapi.json` is about 740 added lines. The e2e covers the concurrency cases the brief requires.

## AI Usage
**High** — Cursor implemented the issue flow, contracts, and tests.

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-017`
- Work SHA: `2dcc8f6e042d30bc570040ff732c702b60d742b3`

## Notes for Reviewer
- Status rules are in `ticket-transition.ts`. `TicketService` is the only writer of `order_ticket.status` and `issue_*`. It locks the ticket row, then checks the line, then `save()`. Events fire after the transactional method returns.
- Escalate emits `ticket.issue_escalated` only. Flag and substitute emit `ticket.status_changed`.
- `GET /tickets?escalated=true` is `issue` tickets with `issue_escalated_at` set. `status` and `visitId` still apply.

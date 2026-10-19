# BRIEF-017 — Backend: ticket issue flow (flag · escalate · resolve)

| | |
|---|---|
| **Status** | Ready |
| **Implementer** | kj (executor agent — Cursor) |
| **Assigned auditor** | Cowork (default) |
| **Auditor assignment** | default; none |
| **Affected apps** | backend · contracts |
| **Revision** | 3 |
| **Depends on** | **BRIEF-012 merged ✅** (`TicketService`, `ticket-transition.ts`, `order_ticket.issue_*` columns, `ticket.status_changed`, room `staff`). Start: branch is rebased on `main` @ `998e6c0` (PR #66) — merge `main` again if it moved (workflow Rev 21). |
| **References** | FRD §6 (issue paths) · DR-012 · DR-013 Rules 3–4 · CD-08 J2 (staff issue sheet) · CD-15 J2 + issue column / strip · `docs/schema.sql` `order_ticket.issue_*` · `docs/api/README.md` (Tickets) |
| **Audit depth** | Full (core order flow, concurrency) |
| **Size** | ~1 day · ~500–600 net-new lines incl. tests (at the §2 limit — BRIEF-013 S4 sizing applied) |

---

## 1. Goal
Staff can report a problem on a ticket ("ของหมด / เครื่องเสีย / อื่นๆ"), then either fix it and continue or hand it to the POS; the POS sees escalated issues live and can send the ticket back to work. Ticket status stays correct under concurrent taps.

## 2. Scope
### In
- **Transitions** in `ticket-transition.ts` + `TicketService` (DR-013 names):
  | Endpoint | From → To | Body / effect |
  |---|---|---|
  | `POST /tickets/:id/flag-issue` | `pending \| accepted \| ready → issue` | `{ reason: 'out_of_stock' \| 'equipment' \| 'other', itemId?, note? }` — `note` required for `other`; `itemId` must be an active (not cancelled) line of this ticket; sets `issue_reason`, `issue_item_id`, `issue_note`, `issue_reported_by` (staff from CLS) |
  | `POST /tickets/:id/resolve` | `issue → accepted` (`substitute`) · stays `issue` (`escalate`) | `{ resolution: 'substitute' \| 'escalate', note? }` — `escalate` sets `issue_escalated_at` ("ส่งให้ POS"; second escalate → 409); `substitute` = staff "แก้แล้ว ทำต่อ" / POS "ทำต่อ", clears all `issue_*` fields |
  - Until BRIEF-018, an escalated issue is resolved at the POS by `substitute` only (no void).
- **Reads:** `Ticket` gains `issue: { reason, itemId, note, reportedBy: StaffRef, escalatedAt } | null` · `GET /tickets` adds `?escalated=true` (only `issue` tickets with `escalatedAt` set — CD-15 strip).
- **Events** (room `staff`, after commit): `ticket.status_changed` on flag + substitute (existing payload) · `ticket.issue_escalated` on escalate (Q4 A).
- **Contracts + docs:** body schemas, `TicketIssueSchema`, list query, `TicketIssueEscalatedPayloadSchema` in `events/order.ts`; `docs/api/README.md` Tickets rows; `openapi.json` regenerated.

### Out (do NOT build here)
- **Sold-out (86) auto-void → BRIEF-027** (Field, 2026-10-20 split) — incl. its menu ↔ order ↔ payment boundary question and the `OrderLine.cancellation` read.
- **Menu Redis cache → deferred until after 8 Nov** (Field, 2026-10-20) — one bar's menu read from Postgres has no load reason yet.
- Void / comp + PIN, DR-016 → BRIEF-018 (after the IAM brief; Field Q2 2026-10-17).
- Issue history / `audit_log` writes (substitute clears the fields) · push to the escalating staff (notifications brief) · IAM enforcement beyond the existing `@RequirePermissions`.

## 3. Contract
| Method | Path | Request → Response | Permission |
|---|---|---|---|
| POST | `/tickets/:id/flag-issue` | `{ reason, itemId?, note? }` → `Ticket` | `orders:update_status` |
| POST | `/tickets/:id/resolve` | `{ resolution, note? }` → `Ticket` | `orders:update_status` |
| GET | `/tickets?escalated=true` | (existing `status`, `visitId` still work) → `TicketList` | `orders:read` |
- **WS events:** `ticket.status_changed` (unchanged) · `ticket.issue_escalated` → `{ ticketId, orderId, visitId, orderNumber, seatLabel, reason, escalatedAt, escalatedBy: StaffRef }` (Q4 A).
- **Contracts changes:** `FlagIssueRequestSchema`, `ResolveIssueRequestSchema`, `TicketIssueSchema`, `TicketSchema.issue`, `TicketListQuerySchema.escalated`, `TICKET_ISSUE_ESCALATED` + payload schema. No new error codes (400 `VALIDATION_ERROR`, 409 `INVALID_STATE_TRANSITION`, 404 `NOT_FOUND`).
- **Business rules:**
  - Issue allowed from `pending / accepted / ready`, never `sent / cancelled / issue` → DR-013 · CD-08 J2
  - `other` needs a note; `itemId` only an active line of the same ticket → CD-08 J2
  - Escalate keeps `issue`, once only; POS resolves by `substitute` until BRIEF-018 → Field Q2 (2026-10-17)
  - `substitute` always returns to `accepted` (even if flagged from `ready` — the item is remade) → DR-013 Rule 4
  - Flagging never changes money: lines and totals untouched → FRD §6
- **Permissions:** existing actions only; no new policy names.
- **OpenAPI:** both POSTs + the new query param, permission in each description (`staffAccess`).

## 4. Acceptance Criteria
- **AC-1** — Given a `pending` / `accepted` / `ready` ticket, when staff flag `out_of_stock` with one of its lines, then status `issue`, `issue` set with reporter, response `Ticket.issue` filled, `ticket.status_changed` emitted once after commit.
- **AC-2** — `other` without note → 400; `itemId` from another ticket or a cancelled line → 400; flag on `sent` / `cancelled` / `issue` → 409; unknown ticket → 404.
- **AC-3** — Given an `issue` ticket, `escalate` sets `escalatedAt`, keeps `issue`, emits `ticket.issue_escalated` once after commit (no `ticket.status_changed`); second `escalate` → 409; it then appears in `GET /tickets?escalated=true` and disappears after `substitute`.
- **AC-4** — `substitute` → `accepted`, all `issue_*` cleared, `ticket.status_changed` emitted; `resolve` on a non-`issue` ticket → 409.
- **AC-5** — Two concurrent `resolve substitute` → one 200 + one 409; `flag-issue` racing `accept` / `send` on the same ticket → serialized by the ticket row lock (BRIEF-012 pattern), final state valid, no lost update.
- **AC-6** — Flag + resolve leave order lines and order / bill totals byte-identical.
- **AC-7** — OpenAPI lists both endpoints + `escalated`; `openapi:check` passes; README updated.
- **AC-8** — All gate commands and the run proof exit 0.

## 5. Test Gate
| AC | Test type | Location (expected) |
|---|---|---|
| AC-1–AC-4 (rules) | unit | `src/modules/order/application/ticket-transition.spec.ts` (new) · `ticket.service.spec.ts` |
| AC-1–AC-6 | e2e | `test/ticket-issue.e2e-spec.ts` (real Postgres + Redis) |
| AC-7 | command | `openapi:check` |

Gate commands (all must pass):
```bash
pnpm --filter @bar/contracts test
pnpm --filter @bar/backend lint
pnpm --filter @bar/backend typecheck
pnpm --filter @bar/backend test
pnpm --filter @bar/backend test:e2e
pnpm --filter @bar/backend build
pnpm --filter @bar/backend openapi:check
```
Run proof (on the work SHA):
```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
pnpm --filter @bar/backend migration:run
pnpm --filter @bar/backend start:dev   # separate shell
curl -fsS localhost:3001/api/health
# seeded staff session: place an order → flag-issue → resolve escalate → GET /tickets?escalated=true → resolve substitute
```
UI change: n/a

A required script that doesn't exist yet = **BLOCKED** — report it, never skip silently.

### Local Sonar scan
- Optional — Field's brief; run if time allows. Approved exclusions: none.

## 6. Constraints
- Status rules live in `ticket-transition.ts` (pure, unit-tested); `TicketService` is the only writer of `order_ticket.status` and `issue_*`.
- Lock the ticket row first (`lockTicket`), then validate `itemId` against that ticket's lines; `save()` on audited entities; events after commit.
- No schema change (columns exist since BRIEF-012 migration). No new packages.
- Thai `message`, English `code`; copy states facts, never blames (e.g. "ใบงานนี้ส่งให้ POS แล้ว").

## 7. Decision Points (Field Guard)
- **Q1 / Q2** (Rev 2, 2026-10-17) still hold: after BRIEF-013 ✅; no void/comp before IAM (→ BRIEF-018).
- **Q3 → moved to BRIEF-027** with the sold-out scope.
- **Split. ✅ Decided (Field, 2026-10-20):** 017 = issue flow; 86 auto-void → BRIEF-027; menu cache deferred after 8 Nov. *Why:* Rev 2 was ~1.2–1.5k lines vs the ~500 limit; the 86 part also needs its own module-boundary decision (PaymentModule already imports OrderModule).
- **Q4 — How the POS hears about an escalation. ✅ Decided (Field, 2026-10-20): A** — new event `ticket.issue_escalated` `{ ticketId, orderId, visitId, orderNumber, seatLabel, reason, escalatedAt, escalatedBy: StaffRef }`. *Why:* `ticket.status_changed` stays truthful (status didn't change); the POS strip subscribes to one explicit event.
  - *Rejected:* B — re-emit `ticket.status_changed` with an unchanged status.
- **Pre-decided:** endpoint paths above · `?escalated=true` · event name `ticket.issue_escalated` · no new packages · no schema change · no new error codes.
- **Likely DRs:** none expected.

## 8. Unlocked Protected Files
- `none`

---

## Ready Checklist
- [x] Named implementer and auditor; scope/ACs/contracts/references complete
- [x] Exact gates (incl. run proof) and evidence; dependencies have completion conditions
- [x] Size within workflow §2 (≤ ~3 working days, ~500 net-new lines); otherwise split — at the limit after the 2026-10-20 split
- [x] No unresolved decision blocking the main outcome (Split + Q4 decided 2026-10-20)
- [x] Exact pre-decisions/unlocks; Field explicitly approved this revision (2026-10-20, in session)

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-10-17 | Initial Draft (Cowork) — void/comp + PIN, issue flow, 86, cache; DR-016 raised |
| 2 | 2026-10-17 | Field decisions in session: Q1 A (after BRIEF-013), Q2 B (void/comp + PIN + DR-016 → BRIEF-018 after IAM), sold-out A + skip on payment in flight — recorded by Cowork on Field's explicit instruction. Renamed `BRIEF-017-issues-sold-out.md`; scope narrowed, ~1.5–2 days |
| 3 | 2026-10-20 | Rebased on `main` (#66). Rev 20 template (business rules, run proof, size). Field split: issue flow only; 86 → BRIEF-027; menu cache deferred after 8 Nov. `cancellation` read → 027. Q4 raised (escalation event). Renamed `BRIEF-017-ticket-issue-flow.md` |
| 3 | 2026-10-20 | Field in session: Q4 A (`ticket.issue_escalated`); Rev 3 approved → Ready — recorded by Cowork on Field's explicit instruction |

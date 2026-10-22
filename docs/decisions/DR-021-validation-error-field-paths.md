# DR-021 — Field paths on 400 `VALIDATION_ERROR`

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Claude Code (executor) · 2026-10-22 |
| **Brief** | BRIEF-035 (AC-2, AC-5) |
| **Category** | Brief deviation · Data (contracts shape) |

## Context
BRIEF-035 AC-2 asks for `400 VALIDATION_ERROR` "with field paths", and AC-5 for the 400 shown "under the field". The global envelope today (`ApiErrorSchema`, `HttpExceptionFilter.zodEnvelope`) returns `message: string[]` (Zod issue messages) and `data: null` — no paths. `ApiErrorDataSchema` is a closed union in `@bar/contracts`; adding paths changes a shared contract used by every endpoint, which the brief's Pre-decided list does not cover.

Meanwhile the settings form validates client-side with the same `UpdateVenueSettingsSchema` from `@bar/contracts`, so every rule the server enforces is shown under its field before sending. A server 400 (only reachable by a stale client) shows the messages in a form-level Alert.

## Options
**A) Add a `VALIDATION_ERROR` data variant `{ details: [{ path: string, message: string }] }`** — filled from Zod `issue.path.join('.')` in `zodEnvelope`; `message` unchanged, so existing clients keep working. / Touches the shared contract + filter spec + OpenAPI; ~30 lines.
**B) Keep the envelope; client-side validation only** — no contract change; AC-2 is met minus "field paths", AC-5's field errors come from the shared schema, server 400 → form Alert. / A server-only rule added later would not map to a field.
**C) Prefix messages with the path (`"name: …"`)** — no schema change. / Changes every existing validation message the UI may already show; brittle parsing.

## Recommendation
**B for BRIEF-035, A as its own small brief later.** The shared schema already gives exact per-field errors for this form, and B avoids a cross-cutting envelope change inside a settings brief. If Field prefers paths now, A is small and backward compatible.

## If Approved — Locks
A: `VALIDATION_ERROR` responses carry `data.details[{ path, message }]` (contracts `ApiErrorDataSchema`). B: none.

---

## Decision — Field only
**Decision:** Approved: B — no field-path envelope (option A dropped, no follow-up brief).
**Why:** Field-level rules live in the shared contracts schema and are checked in the browser first; rules that need the database are state conflicts, answered one at a time with a stable code. Error rule (Field, 2026-10-22): 400 `VALIDATION_ERROR` = schema (server keeps it as a safety net) · DB conflicts = 409 + a stable code from the contracts catalog (`docs/api/README.md`) · `data` shape fixed per code (closed union keyed by `code`, no generic optional bag) · one code per conflict kind, never per field combination; the UI maps a code to its field.
**Date:** 2026-10-22 · recorded by Cowork on Field's explicit instruction (session)

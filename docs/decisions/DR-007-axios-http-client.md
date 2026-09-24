# DR-007 — Frontend HTTP client: axios + TanStack Query (replaces native fetch wrappers)

| | |
|---|---|
| **Status** | Approved |
| **Raised by** | Field via Cowork · 2026-09-24 |
| **Brief** | BRIEF-005 audit F1 → implemented in the first frontend auth brief |
| **Category** | Dependency · Flow/Architecture |

## Context
DR-002 #17 and `frontend.md` locked "native fetch wrappers, no axios". BRIEF-005 built `apiFetch` on `fetch`. Its audit (F1) found that `response.json()` throws a raw `SyntaxError` on `204` or a non-JSON 5xx page. The auth design (handoff 2026-09-20 → Token Rotation) already assumes a 401-intercept pattern with a single shared `refreshPromise` — which is what axios interceptors are built for.

## Options
**A) axios + TanStack Query** — request/response interceptors (401 → one refresh → retry), `withCredentials`, central envelope unwrap + `ApiError` mapping, handles empty/non-JSON bodies / +1 dependency (~13 kB gz), one more API to learn.
**B) Keep fetch, harden `apiFetch`** — no dependency / refresh-retry queue and interceptors hand-written and maintained by us.

## Recommendation
**A.** The refresh-on-401 flow is the hard part of the web auth design; axios interceptors give it to us tested, and the same instance serves every screen. TanStack Query stays the server-state layer; only the transport changes.

### Rules
- One axios instance in `src/lib/api/client.ts` (`baseURL` from `NEXT_PUBLIC_API_URL`, `withCredentials: true`). Components never import axios.
- Response interceptor: unwrap `{ status, message, data }` → return `data` validated by the caller's Zod schema; non-2xx / network error → `ApiError(status, body, message)`.
- 401 interceptor: one shared refresh promise (`POST /api/auth/refresh`), retry the original request once; refresh failure → clear auth state + redirect to `/login`.
- Domain wrappers (`lib/api/<domain>.ts`) keep the same signature (`getMenuItems(): Promise<MenuList>`), so React Query hooks and components don't change when the transport switches.

**Timing:** the switch happens in the first frontend auth brief (it needs the 401 flow). Until then `apiFetch` (fetch) stays; BRIEF-005 F1 is closed by that brief, not patched twice.

**Follow-ups:** `frontend.md` API Client section + DO NOT list (done with this DR); DR-002 #17 superseded on "native fetch".

---

## Decision — Field only
**Decision:** Approved: A — switch to axios + TanStack Query, in the frontend auth brief
**Why:** Interceptors cover the 401 → refresh → retry flow the auth design needs; one place to map the envelope and errors.
**Date:** 2026-09-24 · recorded by Cowork on Field's explicit instruction (planning session); Field signs off by merging the PR

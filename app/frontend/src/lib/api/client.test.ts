import { AuthMeSchema } from "@bar/contracts";
import { http, HttpResponse } from "msw";
import { afterEach, expect, test } from "vitest";
import { z } from "zod";
import { apiEnvelope, staffMe } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { apiGet, apiPost, onSessionExpired } from "./client";
import { getSession, onGuestExpired } from "./customer";

const okSchema = z.object({ ok: z.literal(true) });

function unauthorized() {
  return HttpResponse.json(apiEnvelope(null, 401, "UNAUTHORIZED", "กรุณาเข้าสู่ระบบ"), { status: 401 });
}

afterEach(() => {
  server.events.removeAllListeners();
});

test("returns validated data and sends cookies", async () => {
  let credentials = "";
  server.events.on("request:start", ({ request }) => {
    if (request.url.includes("/auth/me")) credentials = request.credentials;
  });

  await expect(apiGet("/auth/me", AuthMeSchema)).resolves.toEqual(staffMe);
  expect(credentials).toBe("include");
});

test("keeps an unknown error code and joins a message array", async () => {
  server.use(
    http.get("*/api/ping", () =>
      HttpResponse.json(apiEnvelope(null, 400, "FUTURE_CODE", ["ชื่อว่าง", "ราคาผิด"]), { status: 400 }),
    ),
  );

  await expect(apiGet("/ping", okSchema)).rejects.toMatchObject({
    status: 400,
    code: "FUTURE_CODE",
    message: "ชื่อว่าง, ราคาผิด",
    data: null,
  });
});

test("maps a 409 envelope onto ApiError and keeps details", async () => {
  const details = [
    { variantId: "11111111-1111-4111-8111-111111111111", reason: "sold_out" },
  ];
  server.use(
    http.post("*/api/orders", () =>
      HttpResponse.json(apiEnvelope({ details }, 409, "ITEM_UNAVAILABLE", "สินค้าหมด"), { status: 409 }),
    ),
  );

  await expect(apiPost("/orders", {}, okSchema)).rejects.toMatchObject({
    status: 409,
    code: "ITEM_UNAVAILABLE",
    message: "สินค้าหมด",
    data: { details },
  });
});

test("turns a schema mismatch into INVALID_RESPONSE", async () => {
  server.use(http.get("*/api/ping", () => HttpResponse.json(apiEnvelope({ nope: true }))));

  await expect(apiGet("/ping", okSchema)).rejects.toMatchObject({
    status: 200,
    code: "INVALID_RESPONSE",
  });
});

test("maps a network failure to NETWORK_ERROR", async () => {
  server.use(http.get("*/api/ping", () => HttpResponse.error()));

  await expect(apiGet("/ping", okSchema)).rejects.toMatchObject({
    status: 0,
    code: "NETWORK_ERROR",
  });
});

test("refreshes once for three parallel 401s and retries each once", async () => {
  let reads = 0;
  let refreshes = 0;
  server.use(
    http.get("*/api/ping", () => {
      reads += 1;
      if (reads <= 3) return unauthorized();
      return HttpResponse.json(apiEnvelope({ ok: true }));
    }),
    http.post("*/api/auth/refresh", () => {
      refreshes += 1;
      return HttpResponse.json(apiEnvelope({ ok: true }));
    }),
  );

  await expect(Promise.all([apiGet("/ping", okSchema), apiGet("/ping", okSchema), apiGet("/ping", okSchema)])).resolves.toEqual([
    { ok: true },
    { ok: true },
    { ok: true },
  ]);
  expect(refreshes).toBe(1);
  expect(reads).toBe(6);
});

test("does not refresh a retried request a second time", async () => {
  let reads = 0;
  let refreshes = 0;
  server.use(
    http.get("*/api/ping", () => {
      reads += 1;
      return unauthorized();
    }),
    http.post("*/api/auth/refresh", () => {
      refreshes += 1;
      return HttpResponse.json(apiEnvelope({ ok: true }));
    }),
  );

  await expect(apiGet("/ping", okSchema)).rejects.toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  expect(refreshes).toBe(1);
  expect(reads).toBe(2);
});

test("tells the caller whether refresh failed on first load or mid-use", async () => {
  const phases: string[] = [];
  const stop = onSessionExpired((phase) => phases.push(phase));
  server.use(
    http.get("*/api/auth/me", () => unauthorized()),
    http.post("*/api/auth/refresh", () => unauthorized()),
  );

  await expect(apiGet("/auth/me", AuthMeSchema)).rejects.toMatchObject({ authPhase: "first-load" });

  server.use(
    http.get("*/api/auth/me", () => HttpResponse.json(apiEnvelope(staffMe))),
    http.post("*/api/auth/refresh", () => HttpResponse.json(apiEnvelope({ ok: true }))),
  );
  await apiGet("/auth/me", AuthMeSchema);
  server.use(
    http.get("*/api/auth/me", () => unauthorized()),
    http.post("*/api/auth/refresh", () => unauthorized()),
  );
  await expect(apiGet("/auth/me", AuthMeSchema)).rejects.toMatchObject({ authPhase: "mid-use" });
  expect(phases).toEqual(["first-load", "mid-use"]);
  stop();
});

test("sends an idempotency key when asked", async () => {
  let key: string | null = null;
  server.use(
    http.post("*/api/orders", ({ request }) => {
      key = request.headers.get("Idempotency-Key");
      return HttpResponse.json(apiEnvelope({ ok: true }));
    }),
  );

  await apiPost("/orders", { visitId: "x" }, okSchema, { idempotencyKey: "key-1" });
  expect(key).toBe("key-1");
});

test("a guest 401 never triggers the staff refresh and tells every screen the session is gone", async () => {
  let refreshed = 0;
  const gone: string[] = [];
  const stop = onGuestExpired(() => gone.push("expired"));
  server.use(
    http.get("*/api/customer/session", () =>
      HttpResponse.json(apiEnvelope(null, 401, "GUEST_SESSION_INVALID", "เซสชันหมดอายุ"), { status: 401 }),
    ),
    http.post("*/api/auth/refresh", () => {
      refreshed += 1;
      return HttpResponse.json(apiEnvelope({ ok: true }));
    }),
  );

  await expect(getSession()).rejects.toMatchObject({ status: 401, code: "GUEST_SESSION_INVALID" });
  stop();
  expect(refreshed).toBe(0);
  expect(gone).toEqual(["expired"]);
});

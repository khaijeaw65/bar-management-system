import { afterEach, expect, test, vi } from "vitest";
import { ZodError } from "zod";
import { apiFetch } from "./client";
import { ApiError } from "./errors";
import { menuListSchema } from "./menu";

const item = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "สิงห์",
  category: "เบียร์",
  price: "120.00",
  isAvailable: true,
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => body,
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("returns data only for a valid envelope and sends credentials", async () => {
  const fetchMock = vi.fn(async () =>
    jsonResponse({ status: 200, message: "success", data: { items: [item] } }),
  );
  vi.stubGlobal("fetch", fetchMock);

  await expect(apiFetch("/menu/items", menuListSchema)).resolves.toEqual({ items: [item] });
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/api/menu/items",
    expect.objectContaining({ credentials: "include" }),
  );
});

test("throws ApiError with the envelope message on non-2xx", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      jsonResponse({ status: 500, message: "เกิดข้อผิดพลาด", data: null }, 500),
    ),
  );

  await expect(apiFetch("/menu/items", menuListSchema)).rejects.toMatchObject({
    name: "ApiError",
    status: 500,
    message: "เกิดข้อผิดพลาด",
  } satisfies Partial<ApiError>);
});

test("throws ZodError when the success body does not match the schema", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => jsonResponse({ status: 200, message: "success", data: { items: [{}] } })),
  );

  await expect(apiFetch("/menu/items", menuListSchema)).rejects.toBeInstanceOf(ZodError);
});

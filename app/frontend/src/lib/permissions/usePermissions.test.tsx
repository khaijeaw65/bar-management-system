import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";
import { apiEnvelope, posMockControls } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { apiGet } from "@/lib/api/client";
import { MY_PERMISSIONS_KEY } from "@/lib/api/permissions";
import { z } from "zod";
import { Can } from "./Can";
import { PermissionWatcher } from "./PermissionWatcher";
import { usePermissions } from "./usePermissions";

const toastDanger = vi.hoisted(() => vi.fn());
vi.mock("@heroui/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@heroui/react")>()),
  toast: { danger: toastDanger },
}));

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>) => (
    <QueryClientProvider client={client}>
      {children}
      <PermissionWatcher />
    </QueryClientProvider>
  );
  return { client, wrapper };
}

test("while loading nothing is allowed, then the role's codes are", async () => {
  posMockControls.setRole("staff");
  const { wrapper } = setup();
  const { result } = renderHook(() => usePermissions(), { wrapper });
  expect(result.current.status).toBe("loading");
  expect(result.current.can("tables:read")).toBe(false);
  await waitFor(() => expect(result.current.status).toBe("ready"));
  expect(result.current.can("orders:create")).toBe(true);
  expect(result.current.can("payments:mark_paid")).toBe(false);
  expect(result.current.canAll("orders:create", "payments:mark_paid")).toBe(false);
  expect(result.current.canAny("orders:create", "payments:mark_paid")).toBe(true);
});

test("a failed load is an error status with nothing allowed, and retry asks again", async () => {
  server.use(http.get("*/api/me/permissions", () => HttpResponse.json(apiEnvelope(null, 500, "INTERNAL_ERROR"), { status: 500 })));
  const { wrapper } = setup();
  const { result } = renderHook(() => usePermissions(), { wrapper });
  await waitFor(() => expect(result.current.status).toBe("error"));
  expect(result.current.can("tables:read")).toBe(false);
  server.resetHandlers();
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.status).toBe("ready"));
  expect(result.current.can("tables:read")).toBe(true);
});

test("Can renders its children only for a held code, and the fallback otherwise", async () => {
  posMockControls.setRole("staff");
  const { wrapper } = setup();
  render(
    <>
      <Can code="orders:create"><span>เปิดได้</span></Can>
      <Can code="reports:read" fallback={<span>ไม่ได้</span>}>
        <span>รายงาน</span>
      </Can>
      <Can anyOf={["reports:read", "tables:read"]}><span>มีอย่างใดอย่างหนึ่ง</span></Can>
    </>,
    { wrapper },
  );
  expect(await screen.findByText("เปิดได้")).toBeInTheDocument();
  expect(screen.getByText("ไม่ได้")).toBeInTheDocument();
  expect(screen.queryByText("รายงาน")).not.toBeInTheDocument();
  expect(screen.getByText("มีอย่างใดอย่างหนึ่ง")).toBeInTheDocument();
});

test("a 403 that names missing permissions refetches the set and toasts once", async () => {
  toastDanger.mockClear();
  server.use(
    http.get("*/api/probe", () =>
      HttpResponse.json(apiEnvelope({ missing: ["payments:mark_paid"] }, 403, "FORBIDDEN", "ไม่มีสิทธิ์ใช้งานส่วนนี้"), { status: 403 }),
    ),
  );
  posMockControls.setRole("manager");
  const { wrapper, client } = setup();
  const { result } = renderHook(() => usePermissions(), { wrapper });
  await waitFor(() => expect(result.current.can("payments:mark_paid")).toBe(true));

  // Role changed mid-shift: the next answer from the server no longer holds the code.
  posMockControls.setRole("staff");
  const asked = vi.spyOn(client, "invalidateQueries");
  await expect(apiGet("/probe", z.unknown())).rejects.toMatchObject({ status: 403 });
  await expect(apiGet("/probe", z.unknown())).rejects.toMatchObject({ status: 403 });

  await waitFor(() => expect(result.current.can("payments:mark_paid")).toBe(false));
  expect(asked).toHaveBeenCalledWith({ queryKey: MY_PERMISSIONS_KEY });
  expect(toastDanger).toHaveBeenCalledTimes(1);
  expect(toastDanger).toHaveBeenCalledWith("ไม่มีสิทธิ์ทำรายการนี้");
});

test("a plain 403 without missing codes is not treated as a permission change", async () => {
  toastDanger.mockClear();
  server.use(http.get("*/api/probe", () => HttpResponse.json(apiEnvelope(null, 403, "FORBIDDEN"), { status: 403 })));
  setup();
  const { wrapper } = setup();
  renderHook(() => usePermissions(), { wrapper });
  await expect(apiGet("/probe", z.unknown())).rejects.toMatchObject({ status: 403 });
  expect(toastDanger).not.toHaveBeenCalled();
});

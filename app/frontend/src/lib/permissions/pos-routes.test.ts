import { expect, test } from "vitest";
import { firstAllowedPage, permissionForPath } from "./pos-routes";

test("every POS page maps to one permission", () => {
  expect(permissionForPath("/pos/tables")).toBe("tables:read");
  expect(permissionForPath("/pos/tables/abc/order")).toBe("orders:create");
  expect(permissionForPath("/pos/orders")).toBe("orders:read");
  expect(permissionForPath("/pos/menu")).toBe("menu:read");
  expect(permissionForPath("/pos/menu/modifiers")).toBe("menu:read");
  expect(permissionForPath("/pos/menu/new")).toBe("menu:write");
  expect(permissionForPath("/pos/menu/7f2c")).toBe("menu:write");
  expect(permissionForPath("/pos/reports")).toBe("reports:read");
  expect(permissionForPath("/pos/settings")).toBe("venue:update");
  expect(permissionForPath("/pos/settings/staff")).toBe("staff:manage");
  expect(permissionForPath("/pos/settings/staff/7f2c")).toBe("staff:manage");
  expect(permissionForPath("/pos/settings/groups")).toBe("staff:manage");
  expect(permissionForPath("/pos/settings/policies")).toBe("staff:manage");
  expect(permissionForPath("/login")).toBeNull();
});

test("the way back is the first page the person can open", () => {
  expect(firstAllowedPage(() => true)?.href).toBe("/pos/tables");
  expect(firstAllowedPage((code) => code === "orders:read")?.href).toBe("/pos/orders");
  expect(firstAllowedPage((code) => code === "reports:read")?.href).toBe("/pos/reports");
  expect(firstAllowedPage((code) => code === "venue:update")?.href).toBe("/pos/settings");
  expect(firstAllowedPage(() => false)).toBeNull();
});

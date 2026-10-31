import { PERMISSION_CODES, type PermissionCode } from "@bar/contracts";
import { http, HttpResponse } from "msw";

export type MockRole = "owner" | "manager" | "staff";

// The BRIEF-053 default policies, spelled out so a test reads what each role can do.
export const ROLE_CODES: Record<MockRole, readonly PermissionCode[]> = {
  owner: PERMISSION_CODES,
  manager: PERMISSION_CODES.filter((code) => code !== "staff:manage" && code !== "venue:update_payment"),
  staff: [
    "menu:read",
    "menu:toggle_availability",
    "orders:read",
    "orders:create",
    "orders:update_status",
    "tables:read",
    "visits:read",
    "visits:open",
    "visits:close",
    "payments:read",
    "payments:create",
    "venue:read",
  ],
};

const ROLE_GROUP: Record<MockRole, string> = { owner: "เจ้าของ", manager: "ผู้จัดการ", staff: "พนักงาน" };

// Kept in sessionStorage so a Playwright test can pick a role and then open a page by URL (a reload restarts the worker).
const STORAGE_KEY = "pos-mock-role";

function currentRole(): MockRole {
  const stored = typeof sessionStorage === "undefined" ? null : sessionStorage.getItem(STORAGE_KEY);
  return stored === "manager" || stored === "staff" ? stored : "owner";
}

/** The mock enforces the same codes the permission endpoint reports, like the server does. */
export function mockRoleCan(code: PermissionCode): boolean {
  return ROLE_CODES[currentRole()].includes(code);
}

export function setMockRole(next: MockRole): void {
  if (typeof sessionStorage !== "undefined") sessionStorage.setItem(STORAGE_KEY, next);
}

export function resetMockRole(): void {
  if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(STORAGE_KEY);
}

export const permissionHandlers = [
  http.get("*/api/me/permissions", () =>
    HttpResponse.json({
      status: 200,
      code: "",
      message: "success",
      data: {
        permissions: ROLE_CODES[currentRole()],
        groups: [{ id: "00000000-0000-4000-8000-0000000b0001", name: ROLE_GROUP[currentRole()], validUntil: null }],
      },
    }),
  ),
];

/** A one-off answer for tests that need a set no default role has (`server.use(onlyPermissions(...))`). */
export function onlyPermissions(...codes: PermissionCode[]) {
  return http.get("*/api/me/permissions", () =>
    HttpResponse.json({ status: 200, code: "", message: "success", data: { permissions: codes, groups: [] } }),
  );
}

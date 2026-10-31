import {
  PERMISSION_CATALOG,
  type AccessRequest,
  type EffectivePermissions,
  type MembershipInput,
  type StaffGroup,
  type StaffMember,
  type StaffMembership,
} from "@bar/contracts";
import { http, HttpResponse } from "msw";
import { mockRoleCan, ROLE_CODES } from "./permissions";

const ME = "11111111-1111-4111-8111-111111111111";
const OWNER = "00000000-0000-4000-8000-0000000c0001";
const MANAGER = "00000000-0000-4000-8000-0000000c0002";
const STAFF = "00000000-0000-4000-8000-0000000c0003";

export const staffIds = { me: ME, je: "21111111-1111-4111-8111-111111111111", mod: "22222222-2222-4222-8222-222222222222" } as const;
export const requestIds = { fon: "31111111-1111-4111-8111-111111111111", nio: "32222222-2222-4222-8222-222222222222" } as const;

const GROUPS: StaffGroup[] = [
  { id: OWNER, name: "เจ้าของ", description: null, system: "owner", policyIds: [], memberCount: 1 },
  { id: MANAGER, name: "ผู้จัดการ", description: null, system: "manager", policyIds: [], memberCount: 0 },
  { id: STAFF, name: "พนักงาน", description: null, system: "staff", policyIds: [], memberCount: 2 },
];
const POLICY = { [OWNER]: "ทั้งหมด", [MANAGER]: "จัดการร้าน", [STAFF]: "พนักงานหน้าร้าน" } as const;
const ROLE_OF = { [OWNER]: "owner", [MANAGER]: "manager", [STAFF]: "staff" } as const;

interface Row {
  id: string;
  displayName: string;
  isActive: boolean;
  memberships: Array<{ groupId: string; validFrom: string; validUntil: string | null }>;
}

const LONG_AGO = "2026-09-01T00:00:00.000Z";
const initialRows = (): Row[] => [
  { id: ME, displayName: "Beam", isActive: true, memberships: [{ groupId: OWNER, validFrom: LONG_AGO, validUntil: null }] },
  { id: staffIds.je, displayName: "เจ", isActive: true, memberships: [{ groupId: STAFF, validFrom: LONG_AGO, validUntil: null }] },
  {
    id: staffIds.mod,
    displayName: "มด",
    isActive: true,
    memberships: [
      { groupId: STAFF, validFrom: LONG_AGO, validUntil: null },
      { groupId: MANAGER, validFrom: LONG_AGO, validUntil: "2026-09-02T06:00:00.000Z" },
    ],
  },
];
const initialRequests = (): AccessRequest[] => [
  { id: requestIds.fon, displayName: "ฝน", avatarUrl: null, status: "pending", requestedAt: "2026-10-31T10:00:00.000Z", decidedAt: null },
  { id: requestIds.nio, displayName: "นิว", avatarUrl: null, status: "pending", requestedAt: "2026-10-31T11:00:00.000Z", decidedAt: null },
];

let rows = initialRows();
let requests = initialRequests();
let nextId = 1;

export function resetStaffMock(): void {
  rows = initialRows();
  requests = initialRequests();
  nextId = 1;
}

/** e2e / test handle: a LINE request arrives while the page is open. */
export const staffMockControls = {
  addRequest(name: string) {
    const id = `3ffffff${nextId++}-ffff-4fff-8fff-ffffffffffff`.slice(0, 36);
    requests = [...requests, { id, displayName: name, avatarUrl: null, status: "pending", requestedAt: new Date().toISOString(), decidedAt: null }];
    return id;
  },
};

function envelope(data: unknown, status = 200, code = "", message = "success") {
  return HttpResponse.json({ status, code, message, data }, { status });
}

function denied() {
  return envelope({ missing: ["staff:manage"] }, 403, "FORBIDDEN", "ไม่มีสิทธิ์");
}

function stateOf(from: string, until: string | null, now: number): StaffMembership["state"] {
  if (Date.parse(from) > now) return "future";
  return until !== null && Date.parse(until) <= now ? "expired" : "live";
}

function toMember(row: Row): StaffMember {
  const now = Date.now();
  return {
    id: row.id,
    displayName: row.displayName,
    avatarUrl: null,
    isActive: row.isActive,
    policyIds: [],
    memberships: row.memberships.map((membership) => ({
      groupId: membership.groupId,
      groupName: GROUPS.find((group) => group.id === membership.groupId)?.name ?? "",
      validFrom: membership.validFrom,
      validUntil: membership.validUntil,
      state: stateOf(membership.validFrom, membership.validUntil, now),
    })),
  };
}

function nextCutoffIso(): string {
  const at = new Date();
  at.setHours(6, 0, 0, 0);
  if (at.getTime() <= Date.now()) at.setDate(at.getDate() + 1);
  return at.toISOString();
}

/** `undefined` = a time already past. */
function resolve(until: MembershipInput["until"]): string | null | undefined {
  if (until === "permanent") return null;
  if (until === "end_of_night") return nextCutoffIso();
  return Date.parse(until) <= Date.now() ? undefined : until;
}

/** The server rule in miniature: someone active must hold เจ้าของ with no end date. */
function keepsAnOwner(next: Row[]): boolean {
  return next.some((row) => row.isActive && row.memberships.some((membership) => membership.groupId === OWNER && membership.validUntil === null));
}

function lockout() {
  return envelope({ reason: "last_manager" }, 409, "IAM_LOCKOUT", "ต้องมีผู้ดูแลสิทธิ์อย่างน้อย 1 คนที่ไม่มีวันหมดอายุ");
}

function replaceRow(next: Row): Row[] {
  return rows.map((row) => (row.id === next.id ? next : row));
}

function effective(row: Row): EffectivePermissions {
  const now = Date.now();
  const byCode = new Map<string, EffectivePermissions["permissions"][number]>();
  for (const membership of row.memberships) {
    if (stateOf(membership.validFrom, membership.validUntil, now) !== "live") continue;
    const group = GROUPS.find((item) => item.id === membership.groupId);
    for (const code of ROLE_CODES[ROLE_OF[membership.groupId as keyof typeof ROLE_OF]]) {
      const entry = byCode.get(code) ?? { code, sources: [] };
      entry.sources.push({ kind: "group", groupName: group?.name, policyName: POLICY[membership.groupId as keyof typeof POLICY] });
      byCode.set(code, entry);
    }
  }
  return { permissions: [...byCode.values()] };
}

type Params = { id: string };

export const staffHandlers = [
  http.get("*/api/staff/access-requests", ({ request }) => {
    if (!mockRoleCan("staff:manage")) return denied();
    const status = new URL(request.url).searchParams.get("status") ?? "pending";
    return envelope(requests.filter((item) => item.status === status));
  }),
  http.post<Params>("*/api/staff/access-requests/:id/approve", async ({ params, request }) => {
    if (!mockRoleCan("staff:manage")) return denied();
    const body = (await request.json()) as { displayName: string; memberships: MembershipInput[] };
    const found = requests.find((item) => item.id === params.id);
    if (!found) return envelope(null, 404, "NOT_FOUND", "ไม่พบคำขอ");
    if (found.status !== "pending") return envelope(null, 409, "ACCESS_REQUEST_DECIDED", "คำขอนี้ถูกจัดการแล้ว");
    const memberships = body.memberships.map((item) => ({ groupId: item.groupId, validFrom: new Date().toISOString(), validUntil: resolve(item.until) }));
    if (memberships.some((item) => item.validUntil === undefined)) return envelope(null, 400, "VALIDATION_ERROR", "เวลาสิ้นสุดต้องอยู่ในอนาคต");
    const row: Row = {
      id: `4000000${nextId++}-0000-4000-8000-000000000000`.slice(0, 36),
      displayName: body.displayName,
      isActive: true,
      memberships: memberships as Row["memberships"],
    };
    rows = [...rows, row];
    requests = requests.map((item) => (item.id === params.id ? { ...item, status: "approved", decidedAt: new Date().toISOString() } : item));
    return envelope(toMember(row), 201);
  }),
  http.post<Params>("*/api/staff/access-requests/:id/reject", ({ params }) => {
    if (!mockRoleCan("staff:manage")) return denied();
    const found = requests.find((item) => item.id === params.id);
    if (!found) return envelope(null, 404, "NOT_FOUND", "ไม่พบคำขอ");
    if (found.status !== "pending") return envelope(null, 409, "ACCESS_REQUEST_DECIDED", "คำขอนี้ถูกจัดการแล้ว");
    const next: AccessRequest = { ...found, status: "rejected", decidedAt: new Date().toISOString() };
    requests = requests.map((item) => (item.id === params.id ? next : item));
    return envelope(next, 201);
  }),
  http.post<Params>("*/api/staff/access-requests/:id/reopen", ({ params }) => {
    if (!mockRoleCan("staff:manage")) return denied();
    const found = requests.find((item) => item.id === params.id);
    if (!found) return envelope(null, 404, "NOT_FOUND", "ไม่พบคำขอ");
    if (found.status !== "rejected") return envelope(null, 409, "ACCESS_REQUEST_DECIDED", "คำขอนี้ถูกจัดการแล้ว");
    const next: AccessRequest = { ...found, status: "pending", decidedAt: null };
    requests = requests.map((item) => (item.id === params.id ? next : item));
    return envelope(next, 201);
  }),
  http.get("*/api/staff-groups", () => (mockRoleCan("staff:manage") ? envelope(GROUPS) : denied())),
  http.get("*/api/permissions/catalog", () => (mockRoleCan("staff:manage") ? envelope(PERMISSION_CATALOG) : denied())),
  http.get("*/api/staff", () => (mockRoleCan("staff:manage") ? envelope(rows.map(toMember)) : denied())),
  http.get<Params>("*/api/staff/:id", ({ params }) => {
    if (!mockRoleCan("staff:manage")) return denied();
    const found = rows.find((row) => row.id === params.id);
    return found ? envelope(toMember(found)) : envelope(null, 404, "NOT_FOUND", "ไม่พบพนักงาน");
  }),
  http.patch<Params>("*/api/staff/:id", async ({ params, request }) => {
    if (!mockRoleCan("staff:manage")) return denied();
    const patch = (await request.json()) as { displayName?: string; isActive?: boolean };
    const found = rows.find((row) => row.id === params.id);
    if (!found) return envelope(null, 404, "NOT_FOUND", "ไม่พบพนักงาน");
    if (patch.isActive === false && found.id === ME) return envelope(null, 409, "SELF_DEACTIVATE", "ปิดบัญชีของตัวเองไม่ได้");
    const next = { ...found, ...patch };
    if (!keepsAnOwner(replaceRow(next))) return lockout();
    rows = replaceRow(next);
    return envelope(toMember(next));
  }),
  http.put<Params>("*/api/staff/:id/memberships", async ({ params, request }) => {
    if (!mockRoleCan("staff:manage")) return denied();
    const body = (await request.json()) as { memberships: MembershipInput[] };
    const found = rows.find((row) => row.id === params.id);
    if (!found) return envelope(null, 404, "NOT_FOUND", "ไม่พบพนักงาน");
    const memberships = body.memberships.map((item) => ({ groupId: item.groupId, validFrom: new Date().toISOString(), validUntil: resolve(item.until) }));
    if (memberships.some((item) => item.validUntil === undefined)) return envelope(null, 400, "VALIDATION_ERROR", "เวลาสิ้นสุดต้องอยู่ในอนาคต");
    const next: Row = { ...found, memberships: memberships as Row["memberships"] };
    if (!keepsAnOwner(replaceRow(next))) return lockout();
    rows = replaceRow(next);
    return envelope(toMember(next));
  }),
  http.get<Params>("*/api/staff/:id/effective-permissions", ({ params }) => {
    if (!mockRoleCan("staff:manage")) return denied();
    const found = rows.find((row) => row.id === params.id);
    return found ? envelope(effective(found)) : envelope(null, 404, "NOT_FOUND", "ไม่พบพนักงาน");
  }),
];

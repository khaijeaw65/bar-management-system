import {
  PERMISSION_CODES,
  type DeleteImpact,
  type EffectivePermissions,
  type PermissionCode,
  type Policy,
  type StaffGroup,
} from "@bar/contracts";
import { http, HttpResponse } from "msw";
import { mockRoleCan, ROLE_CODES } from "./permissions";

export const OWNER_GROUP = "00000000-0000-4000-8000-0000000c0001";
export const MANAGER_GROUP = "00000000-0000-4000-8000-0000000c0002";
export const STAFF_GROUP = "00000000-0000-4000-8000-0000000c0003";
export const ALL_POLICY = "00000000-0000-4000-8000-0000000d0001";
export const MANAGER_POLICY = "00000000-0000-4000-8000-0000000d0002";
export const STAFF_POLICY = "00000000-0000-4000-8000-0000000d0003";

export interface IamRow {
  id: string;
  displayName: string;
  isActive: boolean;
  policyIds: string[];
  memberships: Array<{ groupId: string; validFrom: string; validUntil: string | null }>;
}

/** The staff mock owns the people; the IAM mock reads and edits them through this seam. */
export interface RowStore {
  all: () => IamRow[];
  set: (rows: IamRow[]) => void;
}

const initialGroups = (): StaffGroup[] => [
  { id: OWNER_GROUP, name: "เจ้าของ", description: null, system: "owner", policyIds: [ALL_POLICY], memberCount: 0 },
  { id: MANAGER_GROUP, name: "ผู้จัดการ", description: null, system: "manager", policyIds: [MANAGER_POLICY], memberCount: 0 },
  { id: STAFF_GROUP, name: "พนักงาน", description: null, system: "staff", policyIds: [STAFF_POLICY], memberCount: 0 },
];

const initialPolicies = (): Array<Omit<Policy, "usage">> => [
  { id: ALL_POLICY, name: "ทั้งหมด", description: null, system: "all", codes: [...PERMISSION_CODES] },
  { id: MANAGER_POLICY, name: "จัดการร้าน", description: null, system: null, codes: [...ROLE_CODES.manager] },
  { id: STAFF_POLICY, name: "พนักงานหน้าร้าน", description: null, system: null, codes: [...ROLE_CODES.staff] },
];

let groups = initialGroups();
let policies = initialPolicies();
let nextId = 1;

export function resetIamMock(): void {
  groups = initialGroups();
  policies = initialPolicies();
  nextId = 1;
}

export function groupName(id: string): string {
  return groups.find((group) => group.id === id)?.name ?? "";
}

function stateOf(from: string, until: string | null, now: number): "future" | "expired" | "live" {
  if (Date.parse(from) > now) return "future";
  return until !== null && Date.parse(until) <= now ? "expired" : "live";
}

export function effectiveOf(row: IamRow): EffectivePermissions {
  const now = Date.now();
  const byCode = new Map<PermissionCode, EffectivePermissions["permissions"][number]>();
  const add = (code: PermissionCode, source: EffectivePermissions["permissions"][number]["sources"][number]) => {
    const entry = byCode.get(code) ?? { code, sources: [] };
    entry.sources.push(source);
    byCode.set(code, entry);
  };
  for (const membership of row.memberships) {
    if (stateOf(membership.validFrom, membership.validUntil, now) !== "live") continue;
    const group = groups.find((item) => item.id === membership.groupId);
    for (const policy of policies.filter((item) => group?.policyIds.includes(item.id))) {
      for (const code of policy.codes) add(code, { kind: "group", groupName: group?.name, policyName: policy.name });
    }
  }
  for (const policy of policies.filter((item) => row.policyIds.includes(item.id))) {
    for (const code of policy.codes) add(code, { kind: "user", policyName: policy.name });
  }
  return { permissions: [...byCode.values()] };
}

const holds = (row: IamRow) => effectiveOf(row).permissions.some((entry) => entry.code === "staff:manage");

/** The server rule in miniature: someone active must keep staff:manage with no end date. */
export function keepsAnAdmin(rows: IamRow[]): boolean {
  return rows.some((row) => {
    if (!row.isActive) return false;
    const permanent = { ...row, memberships: row.memberships.filter((membership) => membership.validUntil === null) };
    return holds(permanent);
  });
}

/** Like the server (audit 055 F3), memberCount still counts expired memberships. */
function withGroupCounts(rows: IamRow[]): StaffGroup[] {
  return groups.map((group) => ({ ...group, memberCount: rows.filter((row) => row.memberships.some((membership) => membership.groupId === group.id)).length }));
}

function usageOf(policyId: string, rows: IamRow[]): Policy["usage"] {
  const viaGroups = groups.filter((group) => group.policyIds.includes(policyId));
  const reached = rows.filter(
    (row) => row.policyIds.includes(policyId) || row.memberships.some((membership) => viaGroups.some((group) => group.id === membership.groupId)),
  );
  return { groups: viaGroups.length, users: rows.filter((row) => row.policyIds.includes(policyId)).length, people: reached.length };
}

function envelope(data: unknown, status = 200, code = "", message = "success") {
  return HttpResponse.json({ status, code, message, data }, { status });
}

const denied = () => envelope({ missing: ["staff:manage"] }, 403, "FORBIDDEN", "ไม่มีสิทธิ์");
const lockout = () => envelope({ reason: "last_manager" }, 409, "IAM_LOCKOUT", "ต้องมีผู้ดูแลสิทธิ์อย่างน้อย 1 คนที่ไม่มีวันหมดอายุ");
const notFound = (what: string) => envelope(null, 404, "NOT_FOUND", what);
const systemRow = () => envelope(null, 409, "SYSTEM_ROW", "แถวระบบ แก้ไขหรือลบไม่ได้");
const normal = (name: string) => name.replaceAll(/\s+/g, "").toLowerCase();

type Params = { id: string };

/** e2e / test handle: seed a policy without going through the screen. */
export const iamMockControls = {
  addPolicy(name: string, codes: PermissionCode[]): string {
    const id = `5000000${nextId++}-0000-4000-8000-000000000000`.slice(0, 36);
    policies = [...policies, { id, name, description: null, system: null, codes }];
    return id;
  },
};

export function createIamHandlers(store: RowStore) {
  const withRows = (next: IamRow[]) => (keepsAnAdmin(next) ? null : lockout());
  const asPolicy = (policy: Omit<Policy, "usage">): Policy => ({ ...policy, usage: usageOf(policy.id, store.all()) });
  const guard = <T>(run: () => T) => (mockRoleCan("staff:manage") ? run() : denied());

  return [
    http.get("*/api/staff-groups", () => guard(() => envelope(withGroupCounts(store.all())))),
    http.post("*/api/staff-groups", async ({ request }) =>
      guard(async () => {
        const body = (await request.json()) as { name: string; description?: string; policyIds: string[] };
        if (groups.some((group) => normal(group.name) === normal(body.name))) return envelope(null, 409, "GROUP_NAME_TAKEN", "มีกลุ่มชื่อนี้อยู่แล้ว");
        const group: StaffGroup = { id: `6000000${nextId++}-0000-4000-8000-000000000000`.slice(0, 36), name: body.name.trim(), description: body.description?.trim() || null, system: null, policyIds: body.policyIds, memberCount: 0 };
        groups = [...groups, group];
        return envelope(group, 201);
      }),
    ),
    http.patch<Params>("*/api/staff-groups/:id", async ({ params, request }) =>
      guard(async () => {
        const body = (await request.json()) as { name?: string; description?: string };
        const found = groups.find((group) => group.id === params.id);
        if (!found) return notFound("ไม่พบกลุ่ม");
        if (found.system === "owner") return systemRow();
        if (body.name !== undefined && found.system !== null) return systemRow();
        if (body.name !== undefined && groups.some((group) => group.id !== found.id && normal(group.name) === normal(body.name ?? ""))) {
          return envelope(null, 409, "GROUP_NAME_TAKEN", "มีกลุ่มชื่อนี้อยู่แล้ว");
        }
        const next = { ...found, name: body.name?.trim() ?? found.name, description: body.description === undefined ? found.description : body.description.trim() || null };
        groups = groups.map((group) => (group.id === found.id ? next : group));
        return envelope(next);
      }),
    ),
    http.put<Params>("*/api/staff-groups/:id/policies", async ({ params, request }) =>
      guard(async () => {
        const body = (await request.json()) as { policyIds: string[] };
        const found = groups.find((group) => group.id === params.id);
        if (!found) return notFound("ไม่พบกลุ่ม");
        if (found.system === "owner") return systemRow();
        const before = groups;
        groups = groups.map((group) => (group.id === found.id ? { ...group, policyIds: body.policyIds } : group));
        const blocked = withRows(store.all());
        if (blocked) {
          groups = before;
          return blocked;
        }
        return envelope(groups.find((group) => group.id === found.id));
      }),
    ),
    http.get<Params>("*/api/staff-groups/:id/delete-impact", ({ params }) =>
      guard(() => {
        const found = groups.find((group) => group.id === params.id);
        if (!found) return notFound("ไม่พบกลุ่ม");
        const without = { ...found, policyIds: [] as string[] };
        const lose = (row: IamRow) => {
          const before = new Set(effectiveOf(row).permissions.map((entry) => entry.code));
          const saved = groups;
          groups = groups.map((group) => (group.id === found.id ? without : group));
          const after = new Set(effectiveOf(row).permissions.map((entry) => entry.code));
          groups = saved;
          return PERMISSION_CODES.filter((code) => before.has(code) && !after.has(code));
        };
        const members = store
          .all()
          .filter((row) => row.memberships.some((membership) => membership.groupId === found.id))
          .map((row) => ({ staffId: row.id, displayName: row.displayName, losing: lose(row) }));
        return envelope({ members } satisfies DeleteImpact);
      }),
    ),
    http.delete<Params>("*/api/staff-groups/:id", ({ params }) =>
      guard(() => {
        const found = groups.find((group) => group.id === params.id);
        if (!found) return notFound("ไม่พบกลุ่ม");
        if (found.system !== null) return systemRow();
        const nextRows = store.all().map((row) => ({ ...row, memberships: row.memberships.filter((membership) => membership.groupId !== found.id) }));
        const saved = groups;
        groups = groups.filter((group) => group.id !== found.id);
        const blocked = withRows(nextRows);
        if (blocked) {
          groups = saved;
          return blocked;
        }
        store.set(nextRows);
        return envelope({ ok: true });
      }),
    ),
    http.get("*/api/policies", () => guard(() => envelope(policies.map(asPolicy)))),
    http.post("*/api/policies", async ({ request }) =>
      guard(async () => {
        const body = (await request.json()) as { name: string; description?: string; codes: PermissionCode[] };
        if (policies.some((policy) => normal(policy.name) === normal(body.name))) return envelope(null, 409, "POLICY_NAME_TAKEN", "มีนโยบายชื่อนี้อยู่แล้ว");
        const policy = { id: `5000000${nextId++}-0000-4000-8000-000000000000`.slice(0, 36), name: body.name.trim(), description: body.description?.trim() || null, system: null, codes: body.codes };
        policies = [...policies, policy];
        return envelope(asPolicy(policy), 201);
      }),
    ),
    http.patch<Params>("*/api/policies/:id", async ({ params, request }) =>
      guard(async () => {
        const body = (await request.json()) as { name?: string; description?: string };
        const found = policies.find((policy) => policy.id === params.id);
        if (!found) return notFound("ไม่พบนโยบาย");
        if (found.system) return systemRow();
        if (body.name !== undefined && policies.some((policy) => policy.id !== found.id && normal(policy.name) === normal(body.name ?? ""))) {
          return envelope(null, 409, "POLICY_NAME_TAKEN", "มีนโยบายชื่อนี้อยู่แล้ว");
        }
        const next = { ...found, name: body.name?.trim() ?? found.name, description: body.description === undefined ? found.description : body.description.trim() || null };
        policies = policies.map((policy) => (policy.id === found.id ? next : policy));
        return envelope(asPolicy(next));
      }),
    ),
    http.put<Params>("*/api/policies/:id/permissions", async ({ params, request }) =>
      guard(async () => {
        const body = (await request.json()) as { codes: PermissionCode[] };
        const found = policies.find((policy) => policy.id === params.id);
        if (!found) return notFound("ไม่พบนโยบาย");
        if (found.system) return systemRow();
        const saved = policies;
        policies = policies.map((policy) => (policy.id === found.id ? { ...policy, codes: body.codes } : policy));
        const blocked = withRows(store.all());
        if (blocked) {
          policies = saved;
          return blocked;
        }
        return envelope(asPolicy(policies.find((policy) => policy.id === found.id) as Omit<Policy, "usage">));
      }),
    ),
    http.delete<Params>("*/api/policies/:id", ({ params }) =>
      guard(() => {
        const found = policies.find((policy) => policy.id === params.id);
        if (!found) return notFound("ไม่พบนโยบาย");
        if (found.system) return systemRow();
        const inGroups = groups.filter((group) => group.policyIds.includes(found.id)).map((group) => group.name);
        const inUsers = store.all().filter((row) => row.policyIds.includes(found.id)).map((row) => row.displayName);
        if (inGroups.length + inUsers.length > 0) return envelope({ groups: inGroups, users: inUsers }, 409, "POLICY_IN_USE", "นโยบายนี้ยังถูกใช้อยู่");
        policies = policies.filter((policy) => policy.id !== found.id);
        return envelope({ ok: true });
      }),
    ),
  ];
}

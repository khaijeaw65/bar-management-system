import type { Policy, StaffGroup, StaffMember } from "@bar/contracts";
import { expect, test } from "vitest";
import { losesStaffManage } from "./selfImpact";

const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
const policy = (n: number, codes: Policy["codes"]): Policy => ({ id: id(n), name: `p${n}`, description: null, system: null, codes, usage: { groups: 0, users: 0, people: 0 } });
const group = (n: number, policyIds: string[]): StaffGroup => ({ id: id(n), name: `g${n}`, description: null, system: null, policyIds, memberCount: 1 });
const member = (state: "live" | "expired", policyIds: string[] = []): StaffMember => ({
  id: id(9),
  displayName: "me",
  avatarUrl: null,
  isActive: true,
  policyIds,
  memberships: [{ groupId: id(1), groupName: "g1", validFrom: "2026-01-01T00:00:00.000Z", validUntil: null, state }],
});

const world = (state: "live" | "expired" = "live", personal: string[] = []) => ({
  member: member(state, personal),
  groups: [group(1, [id(5)])],
  policies: [policy(5, ["staff:manage", "menu:read"])],
});

test("dropping staff:manage from the policy the user reaches through a group is flagged", () => {
  expect(losesStaffManage(world(), { policies: [policy(5, ["menu:read"])] })).toBe(true);
});

test("detaching the policy from the group, or deleting the group, is flagged", () => {
  expect(losesStaffManage(world(), { groups: [group(1, [])] })).toBe(true);
  expect(losesStaffManage(world(), { groups: [] })).toBe(true);
});

test("another route to staff:manage (a personal policy) keeps it", () => {
  const w = world("live", [id(6)]);
  const both = { ...w, policies: [...w.policies, policy(6, ["staff:manage"])] };
  expect(losesStaffManage(both, { policies: [policy(5, ["menu:read"]), policy(6, ["staff:manage"])] })).toBe(false);
  expect(losesStaffManage(both, { personalPolicyIds: [] })).toBe(false);
});

test("a user who does not hold staff:manage now loses nothing", () => {
  expect(losesStaffManage(world("expired"), { groups: [] })).toBe(false);
});

import {
  DeleteImpactSchema,
  PolicySchema,
  StaffGroupSchema,
  StaffMemberSchema,
  type CreatePolicy,
  type PermissionCode,
  type CreateStaffGroup,
  type UpdatePolicy,
  type UpdateStaffGroup,
} from "@bar/contracts";
import { z } from "zod";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./client";

export const POLICIES_KEY = ["staff", "policies"] as const;

const OkSchema = z.object({ ok: z.literal(true) });

export function getPolicies() {
  return apiGet("/policies", z.array(PolicySchema));
}

export function createPolicy(body: CreatePolicy) {
  return apiPost("/policies", body, PolicySchema);
}

export function updatePolicy(id: string, body: UpdatePolicy) {
  return apiPatch(`/policies/${id}`, body, PolicySchema);
}

export function setPolicyCodes(id: string, codes: PermissionCode[]) {
  return apiPut(`/policies/${id}/permissions`, { codes }, PolicySchema);
}

export function deletePolicy(id: string) {
  return apiDelete(`/policies/${id}`, OkSchema);
}

export function createGroup(body: CreateStaffGroup) {
  return apiPost("/staff-groups", body, StaffGroupSchema);
}

export function updateGroup(id: string, body: UpdateStaffGroup) {
  return apiPatch(`/staff-groups/${id}`, body, StaffGroupSchema);
}

export function setGroupPolicies(id: string, policyIds: string[]) {
  return apiPut(`/staff-groups/${id}/policies`, { policyIds }, StaffGroupSchema);
}

export function getDeleteImpact(id: string) {
  return apiGet(`/staff-groups/${id}/delete-impact`, DeleteImpactSchema);
}

export function deleteGroup(id: string) {
  return apiDelete(`/staff-groups/${id}`, OkSchema);
}

export function setPersonalPolicies(staffId: string, policyIds: string[]) {
  return apiPut(`/staff/${staffId}/policies`, { policyIds }, StaffMemberSchema);
}

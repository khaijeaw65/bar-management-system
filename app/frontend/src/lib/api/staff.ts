import {
  AccessRequestSchema,
  EffectivePermissionsSchema,
  PermissionCatalogSchema,
  StaffGroupSchema,
  StaffMemberSchema,
  type ApproveAccessRequest,
  type MembershipInput,
  type UpdateStaff,
} from "@bar/contracts";
import { z } from "zod";
import { apiGet, apiPatch, apiPost, apiPut } from "./client";

export const ACCESS_REQUESTS_KEY = ["staff", "access-requests"] as const;
export const STAFF_KEY = ["staff", "members"] as const;
export const STAFF_GROUPS_KEY = ["staff", "groups"] as const;
export const PERMISSION_CATALOG_KEY = ["staff", "catalog"] as const;

export type RequestStatus = "pending" | "rejected";

export function getAccessRequests(status: RequestStatus) {
  return apiGet(`/staff/access-requests?status=${status}`, z.array(AccessRequestSchema));
}

export function approveAccessRequest(id: string, body: ApproveAccessRequest) {
  return apiPost(`/staff/access-requests/${id}/approve`, body, StaffMemberSchema);
}

export function rejectAccessRequest(id: string) {
  return apiPost(`/staff/access-requests/${id}/reject`, {}, AccessRequestSchema);
}

export function reopenAccessRequest(id: string) {
  return apiPost(`/staff/access-requests/${id}/reopen`, {}, AccessRequestSchema);
}

export function getStaffList() {
  return apiGet("/staff", z.array(StaffMemberSchema));
}

export function getStaffMember(id: string) {
  return apiGet(`/staff/${id}`, StaffMemberSchema);
}

export function updateStaff(id: string, body: UpdateStaff) {
  return apiPatch(`/staff/${id}`, body, StaffMemberSchema);
}

export function replaceMemberships(id: string, memberships: MembershipInput[]) {
  return apiPut(`/staff/${id}/memberships`, { memberships }, StaffMemberSchema);
}

export function getEffectivePermissions(id: string) {
  return apiGet(`/staff/${id}/effective-permissions`, EffectivePermissionsSchema);
}

export function getStaffGroups() {
  return apiGet("/staff-groups", z.array(StaffGroupSchema));
}

export function getPermissionCatalog() {
  return apiGet("/permissions/catalog", PermissionCatalogSchema);
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { getPolicies, POLICIES_KEY } from "@/lib/api/iam";
import { getPermissionCatalog, getStaffGroups, getStaffList, PERMISSION_CATALOG_KEY, STAFF_GROUPS_KEY, STAFF_KEY } from "@/lib/api/staff";

export const useGroups = () => useQuery({ queryKey: STAFF_GROUPS_KEY, queryFn: getStaffGroups, staleTime: 60_000, retry: false });
export const usePolicies = () => useQuery({ queryKey: POLICIES_KEY, queryFn: getPolicies, staleTime: 60_000, retry: false });
export const useCatalog = () => useQuery({ queryKey: PERMISSION_CATALOG_KEY, queryFn: getPermissionCatalog, staleTime: 5 * 60_000, retry: false });
export const useStaffList = () => useQuery({ queryKey: STAFF_KEY, queryFn: getStaffList, retry: false });

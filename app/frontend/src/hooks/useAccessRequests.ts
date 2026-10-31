"use client";

import { useQuery } from "@tanstack/react-query";
import { ACCESS_REQUESTS_KEY, getAccessRequests, type RequestStatus } from "@/lib/api/staff";
import { usePermissions } from "@/lib/permissions/usePermissions";

const POLL_MS = 60_000;

/** Pending requests (or the rejected list); polled while the tab is open and refetched on focus — no WS event (BRIEF-057). */
export function useAccessRequests(status: RequestStatus = "pending", enabled = true) {
  const { can } = usePermissions();
  return useQuery({
    queryKey: [...ACCESS_REQUESTS_KEY, status],
    queryFn: () => getAccessRequests(status),
    enabled: enabled && can("staff:manage"),
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    retry: false,
  });
}

/** 0 for anyone without `staff:manage`, so the tab count and the rail dot never show to them. */
export function usePendingRequestCount(): number {
  return useAccessRequests("pending").data?.length ?? 0;
}

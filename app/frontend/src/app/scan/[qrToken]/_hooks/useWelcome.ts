"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { startSession, updateSession } from "@/lib/api/customer";
import { sessionKey } from "../../../customer/_hooks/useGuestSession";

export function useWelcome(qrToken: string) {
  const router = useRouter();
  const client = useQueryClient();
  // One POST per scan: the query key dedups React strict mode's double effect, and the result is never refetched.
  const start = useQuery({
    queryKey: ["customer", "start", qrToken],
    queryFn: () => startSession(qrToken),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const enter = useMutation({
    mutationFn: async (name: string) => {
      const trimmed = name.trim();
      return trimmed ? updateSession(trimmed) : start.data;
    },
    onSuccess: (session) => {
      if (session) client.setQueryData(sessionKey, session);
      router.replace("/customer/menu");
    },
  });
  return { start, enter };
}

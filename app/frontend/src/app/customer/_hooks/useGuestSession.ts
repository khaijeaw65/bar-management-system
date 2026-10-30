"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getSession, onGuestExpired } from "@/lib/api/customer";
import { ApiError } from "@/lib/api/errors";

export const sessionKey = ["customer", "session"] as const;

function isGuestGone(error: unknown): boolean {
  return error instanceof ApiError && error.code === "GUEST_SESSION_INVALID";
}

export function useGuestSession() {
  const [expired, setExpired] = useState(false);
  const query = useQuery({
    queryKey: sessionKey,
    queryFn: getSession,
    retry: (count, error) => !isGuestGone(error) && count < 2,
  });
  useEffect(() => onGuestExpired(() => setExpired(true)), []);
  return { query, gone: expired || isGuestGone(query.error) };
}

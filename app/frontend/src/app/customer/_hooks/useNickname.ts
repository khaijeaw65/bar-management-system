"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSession } from "@/lib/api/customer";
import { sessionKey } from "./useGuestSession";

export function useNickname(onSaved: () => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => updateSession(name.trim().length > 0 ? name.trim() : null),
    onSuccess: (session) => {
      client.setQueryData(sessionKey, session);
      onSaved();
    },
  });
}

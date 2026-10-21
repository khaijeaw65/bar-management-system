"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useMe } from "@/hooks/useMe";
import { markSessionCleared, onSessionExpired } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { SessionExpiredModal } from "./SessionExpiredModal";

export function SessionGate({ children }: Readonly<{ children: ReactNode }>) {
  const me = useMe();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expired, setExpired] = useState(false);

  useEffect(
    () =>
      onSessionExpired((phase) => {
        if (phase === "mid-use") setExpired(true);
      }),
    [],
  );

  useEffect(() => {
    if (me.error instanceof ApiError && me.error.authPhase === "first-load") {
      router.replace("/login");
    }
  }, [me.error, router]);

  function leave() {
    markSessionCleared();
    queryClient.clear();
    router.replace("/login");
  }

  if (me.isPending) return null;
  if (!me.data && me.error instanceof ApiError && me.error.authPhase === "first-load") return null;
  if (!me.data && me.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 p-6">
        <p>โหลดข้อมูลไม่สำเร็จ</p>
        <button type="button" className="text-text-accent" onClick={() => void me.refetch()}>
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <>
      {children}
      {expired ? <SessionExpiredModal onLogin={leave} /> : null}
    </>
  );
}

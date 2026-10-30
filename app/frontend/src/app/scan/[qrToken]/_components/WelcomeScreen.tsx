"use client";

import { Spinner } from "@heroui/react";
import { useWelcome } from "../_hooks/useWelcome";
import { ScanProblem } from "./ScanProblem";
import { WelcomeCard } from "./WelcomeCard";

export function WelcomeScreen({ qrToken }: Readonly<{ qrToken: string }>) {
  const { start, enter } = useWelcome(qrToken);
  if (start.isError) return <ScanProblem error={start.error} onRetry={() => void start.refetch()} />;
  if (!start.data) {
    return (
      <main aria-busy className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg-app p-6">
        <Spinner />
        <p className="text-small text-text-muted">กำลังเปิดเมนูของโต๊ะ…</p>
      </main>
    );
  }
  return <WelcomeCard session={start.data} pending={enter.isPending} onEnter={(name) => enter.mutate(name)} />;
}

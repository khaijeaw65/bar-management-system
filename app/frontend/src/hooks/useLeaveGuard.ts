"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// App Router has no navigation-blocking API: catch in-app link clicks before Next handles them, and the browser's own unload.
export function useLeaveGuard(dirty: boolean) {
  const router = useRouter();
  const [target, setTarget] = useState<Route | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      const href = link?.getAttribute("href");
      if (!href?.startsWith("/") || event.metaKey || event.ctrlKey) return;
      event.preventDefault();
      event.stopPropagation();
      setTarget(href as Route);
    };
    const onUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [dirty]);

  return {
    target,
    // For buttons that leave the page: ask first when dirty, else go straight there.
    go: (route: Route) => (dirty ? setTarget(route) : router.push(route)),
    stay: () => setTarget(null),
    leave: () => {
      if (target) router.push(target);
      setTarget(null);
    },
  };
}
